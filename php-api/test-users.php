<?php
/**
 * Test endpoint for users.php debugging
 * This file helps diagnose issues with user authentication endpoints
 */

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors, just log them

// Log function
function testLog($message, $data = null) {
    $logDir = __DIR__ . '/logs';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0755, true);
    }
    
    $logFile = $logDir . '/test-users-' . date('Y-m-d') . '.log';
    $timestamp = date('Y-m-d H:i:s');
    $dataStr = $data ? ' | Data: ' . json_encode($data) : '';
    $logMessage = "[$timestamp] $message$dataStr" . PHP_EOL;
    
    @file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
    
    // Also return in response for debugging
    return $logMessage;
}

// Start output buffering to catch any early output
ob_start();

$response = [
    'success' => false,
    'test' => 'users.php diagnostic',
    'timestamp' => date('Y-m-d H:i:s'),
    'logs' => [],
    'request_info' => []
];

// Log request info
$method = $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN';
$response['request_info'] = [
    'method' => $method,
    'uri' => $_SERVER['REQUEST_URI'] ?? 'UNKNOWN',
    'path' => parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH),
    'query' => $_SERVER['QUERY_STRING'] ?? '',
    'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'NOT SET',
    'origin' => $_SERVER['HTTP_ORIGIN'] ?? 'NOT SET',
    'referer' => $_SERVER['HTTP_REFERER'] ?? 'NOT SET',
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'NOT SET',
];

$response['logs'][] = testLog('Test endpoint called', ['method' => $method]);

// Handle OPTIONS preflight immediately
if ($method === 'OPTIONS') {
    $response['logs'][] = testLog('OPTIONS preflight request received');
    
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, X-Requested-With, Accept');
    header('Access-Control-Max-Age: 3600');
    header('Content-Type: application/json');
    http_response_code(200);
    
    $response['success'] = true;
    $response['message'] = 'OPTIONS preflight successful';
    $response['logs'][] = testLog('OPTIONS headers sent');
    
    ob_end_clean();
    echo json_encode($response, JSON_PRETTY_PRINT);
    exit;
}

// Set CORS headers for all requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, X-Requested-With, Accept');
header('Content-Type: application/json');

$response['logs'][] = testLog('CORS headers set');

// Test 1: Check if api-init.php can be included
$response['tests'] = [];
try {
    $response['logs'][] = testLog('Attempting to include api-init.php');
    require_once __DIR__ . '/api-init.php';
    $response['tests']['api_init'] = ['status' => 'success', 'message' => 'api-init.php loaded successfully'];
    $response['logs'][] = testLog('api-init.php loaded successfully');
} catch (Exception $e) {
    $response['tests']['api_init'] = [
        'status' => 'error',
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ];
    $response['logs'][] = testLog('api-init.php error', ['error' => $e->getMessage()]);
}

// Test 2: Check if email-config.php can be included
try {
    $response['logs'][] = testLog('Attempting to include email-config.php');
    require_once __DIR__ . '/email-config.php';
    $response['tests']['email_config'] = ['status' => 'success', 'message' => 'email-config.php loaded successfully'];
    $response['logs'][] = testLog('email-config.php loaded successfully');
} catch (Exception $e) {
    $response['tests']['email_config'] = [
        'status' => 'error',
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ];
    $response['logs'][] = testLog('email-config.php error', ['error' => $e->getMessage()]);
}

// Test 3: Check if database connection works
try {
    if (isset($pdo) && $pdo) {
        $response['tests']['database'] = ['status' => 'success', 'message' => 'Database connection exists'];
        $response['logs'][] = testLog('Database connection found');
        
        // Test a simple query
        $stmt = $pdo->query("SELECT 1 as test");
        $result = $stmt->fetch();
        if ($result) {
            $response['tests']['database_query'] = ['status' => 'success', 'message' => 'Database query successful'];
            $response['logs'][] = testLog('Database query test successful');
        }
    } else {
        $response['tests']['database'] = ['status' => 'warning', 'message' => 'Database connection not found'];
        $response['logs'][] = testLog('Database connection not found');
    }
} catch (Exception $e) {
    $response['tests']['database'] = [
        'status' => 'error',
        'message' => $e->getMessage()
    ];
    $response['logs'][] = testLog('Database error', ['error' => $e->getMessage()]);
}

// Test 4: Check HTTPS enforcement
try {
    $isHTTPS = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
               (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443) ||
               (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
    $response['tests']['https_check'] = [
        'status' => 'success',
        'message' => 'HTTPS check completed',
        'is_https' => $isHTTPS,
        'HTTPS' => $_SERVER['HTTPS'] ?? 'not set',
        'SERVER_PORT' => $_SERVER['SERVER_PORT'] ?? 'not set',
        'X_FORWARDED_PROTO' => $_SERVER['HTTP_X_FORWARDED_PROTO'] ?? 'not set'
    ];
    $response['logs'][] = testLog('HTTPS check', ['is_https' => $isHTTPS]);
} catch (Exception $e) {
    $response['tests']['https_check'] = [
        'status' => 'error',
        'message' => $e->getMessage()
    ];
}

// Default test data for register action (for testing without POST)
$defaultTestData = [
    "action" => "register",
    "email" => "test@example.com",
    "password" => "test123",
    "name" => "Test User"
];

// Test 5: Check if input can be read
if ($method === 'POST' || $method === 'PUT') {
    try {
        $rawInput = file_get_contents('php://input');
        $response['tests']['input_read'] = [
            'status' => 'success',
            'message' => 'Input can be read',
            'raw_length' => strlen($rawInput),
            'has_content' => !empty($rawInput)
        ];
        $response['logs'][] = testLog('Input read', ['length' => strlen($rawInput)]);
        
        if (!empty($rawInput)) {
            $input = json_decode($rawInput, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $response['tests']['json_parse'] = [
                    'status' => 'success',
                    'message' => 'JSON parsed successfully',
                    'keys' => array_keys($input),
                    'action' => $input['action'] ?? 'none'
                ];
                $response['logs'][] = testLog('JSON parsed successfully', ['keys' => array_keys($input)]);
            } else {
                $response['tests']['json_parse'] = [
                    'status' => 'error',
                    'message' => 'JSON parse error: ' . json_last_error_msg(),
                    'raw' => substr($rawInput, 0, 200)
                ];
                $response['logs'][] = testLog('JSON parse error', ['error' => json_last_error_msg()]);
            }
        } else {
            // No POST data provided, use default test data for testing
            $input = $defaultTestData;
            $response['tests']['input_read']['note'] = 'Using default test data since no POST data provided';
            $response['logs'][] = testLog('Using default test data for register action');
            $response['default_data_used'] = true;
        }
    } catch (Exception $e) {
        $response['tests']['input_read'] = [
            'status' => 'error',
            'message' => $e->getMessage()
        ];
        $response['logs'][] = testLog('Input read error', ['error' => $e->getMessage()]);
    }
} else if ($method === 'GET') {
    // For GET requests, also use default test data to simulate register action
    $input = $defaultTestData;
    $response['default_data_used'] = true;
    $response['tests']['get_with_default_data'] = [
        'status' => 'success',
        'message' => 'Using default test data for GET request simulation'
    ];
    $response['logs'][] = testLog('GET request - using default test data for register action');
}

// Test 6: Check if functions exist
$functionsToCheck = [
    'validateMethod',
    'validateCORS',
    'logError',
    'sendEmail',
    'generateVerificationToken'
];

$response['tests']['functions'] = [];
foreach ($functionsToCheck as $func) {
    $exists = function_exists($func);
    $response['tests']['functions'][$func] = $exists ? 'exists' : 'missing';
    if (!$exists) {
        $response['logs'][] = testLog("Function missing: $func");
    }
}

// Test 7: Simulate a register action (always test if we have the input data)
if (isset($input) && isset($input['action']) && $input['action'] === 'register') {
    $response['logs'][] = testLog('Register action detected', ['input' => $input]);
    $response['tests']['register_action'] = ['status' => 'detected', 'message' => 'Register action found in POST data'];
    
    // Validate required fields
    if (empty($input['email']) || empty($input['password']) || empty($input['name'])) {
        $response['tests']['register_validation'] = [
            'status' => 'error',
            'message' => 'Missing required fields',
            'has_email' => !empty($input['email']),
            'has_password' => !empty($input['password']),
            'has_name' => !empty($input['name'])
        ];
        $response['logs'][] = testLog('Register validation failed', $input);
    } else {
        $response['tests']['register_validation'] = ['status' => 'success', 'message' => 'All required fields present'];
        
        // Try to hash password
        try {
            $hash = password_hash($input['password'], PASSWORD_DEFAULT);
            $response['tests']['password_hash'] = ['status' => 'success', 'message' => 'Password hashing works', 'hash_length' => strlen($hash)];
            $response['logs'][] = testLog('Password hashing successful');
        } catch (Exception $e) {
            $response['tests']['password_hash'] = ['status' => 'error', 'message' => $e->getMessage()];
            $response['logs'][] = testLog('Password hashing error', ['error' => $e->getMessage()]);
        }
        
        // Test if we can check user existence (without actually registering)
        try {
            if (isset($pdo) && $pdo) {
                $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
                $stmt->execute([$input['email']]);
                $existing = $stmt->fetch();
                $response['tests']['user_check'] = [
                    'status' => 'success',
                    'message' => 'Database query executed successfully',
                    'email_exists' => $existing !== false
                ];
                $response['logs'][] = testLog('User existence check completed', ['exists' => $existing !== false]);
            }
        } catch (PDOException $e) {
            $response['tests']['user_check'] = [
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ];
            $response['logs'][] = testLog('User check error', ['error' => $e->getMessage()]);
        }
        
        // Test if generateVerificationToken works
        if (function_exists('generateVerificationToken')) {
            try {
                $token = generateVerificationToken();
                $response['tests']['token_generation'] = [
                    'status' => 'success',
                    'message' => 'Token generation works',
                    'token_length' => strlen($token)
                ];
                $response['logs'][] = testLog('Token generation successful');
            } catch (Exception $e) {
                $response['tests']['token_generation'] = ['status' => 'error', 'message' => $e->getMessage()];
                $response['logs'][] = testLog('Token generation error', ['error' => $e->getMessage()]);
            }
        }
        
        // Test 8: Actually try to insert user into database (dry run test)
        try {
            if (isset($pdo) && $pdo) {
                $response['logs'][] = testLog('Testing user insertion...');
                
                // First check if email already exists
                $checkStmt = $pdo->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
                $checkStmt->execute([$input['email']]);
                $existingUser = $checkStmt->fetch();
                
                if ($existingUser) {
                    $response['tests']['user_insert_test'] = [
                        'status' => 'skipped',
                        'message' => 'User already exists (not inserting duplicate)',
                        'existing_user_id' => $existingUser['id']
                    ];
                    $response['logs'][] = testLog('User already exists, skipping insertion');
                } else {
                    // Test the INSERT query structure (without actually inserting)
                    $passwordHash = password_hash($input['password'], PASSWORD_DEFAULT);
                    $testToken = generateVerificationToken();
                    $tokenExpiry = date('Y-m-d H:i:s', strtotime('+24 hours'));
                    
                    // Test the query preparation
                    $insertStmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, is_verified, role, verification_token, verification_token_expiry, created_at) VALUES (?, ?, ?, FALSE, 'USER', ?, ?, NOW())");
                    
                    $response['tests']['insert_query_prep'] = [
                        'status' => 'success',
                        'message' => 'INSERT query prepared successfully',
                        'columns' => ['name', 'email', 'password_hash', 'is_verified', 'role', 'verification_token', 'verification_token_expiry', 'created_at']
                    ];
                    $response['logs'][] = testLog('INSERT query prepared successfully');
                    
                    // Try to actually insert (if not test mode)
                    // For safety, we'll skip actual insertion in test mode unless requested
                    if (isset($_GET['insert']) && $_GET['insert'] === 'true') {
                        try {
                            $result = $insertStmt->execute([
                                $input['name'], 
                                $input['email'], 
                                $passwordHash, 
                                $testToken, 
                                $tokenExpiry
                            ]);
                            
                            if ($result) {
                                $userId = $pdo->lastInsertId();
                                $response['tests']['user_insert_test'] = [
                                    'status' => 'success',
                                    'message' => 'User inserted successfully',
                                    'user_id' => $userId
                                ];
                                $response['logs'][] = testLog('User inserted successfully', ['user_id' => $userId]);
                            } else {
                                $response['tests']['user_insert_test'] = [
                                    'status' => 'error',
                                    'message' => 'INSERT query returned false'
                                ];
                                $response['logs'][] = testLog('INSERT query returned false');
                            }
                        } catch (PDOException $e) {
                            $response['tests']['user_insert_test'] = [
                                'status' => 'error',
                                'message' => 'INSERT failed: ' . $e->getMessage(),
                                'error_code' => $e->getCode(),
                                'sql_state' => $e->errorInfo[0] ?? null,
                                'error_info' => $e->errorInfo ?? null
                            ];
                            $response['logs'][] = testLog('INSERT error', [
                                'error' => $e->getMessage(),
                                'code' => $e->getCode(),
                                'errorInfo' => $e->errorInfo
                            ]);
                        }
                    } else {
                        $response['tests']['user_insert_test'] = [
                            'status' => 'ready',
                            'message' => 'Query prepared and ready. Add ?insert=true to URL to actually insert',
                            'note' => 'Add ?insert=true parameter to test actual insertion'
                        ];
                    }
                }
            }
        } catch (Exception $e) {
            $response['tests']['user_insert_test'] = [
                'status' => 'error',
                'message' => 'Insert test error: ' . $e->getMessage()
            ];
            $response['logs'][] = testLog('Insert test error', ['error' => $e->getMessage()]);
        }
    }
}

// Check for any output before this point
$output = ob_get_clean();
if (!empty($output)) {
    $response['warnings'][] = 'Output detected before response: ' . substr($output, 0, 200);
    $response['logs'][] = testLog('Unexpected output', ['output' => substr($output, 0, 200)]);
}

// Set success if we got here
$response['success'] = true;
$response['message'] = 'Test completed successfully';
$response['logs'][] = testLog('Test endpoint completed');

// Return response
http_response_code(200);
echo json_encode($response, JSON_PRETTY_PRINT);

