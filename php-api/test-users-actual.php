<?php
/**
 * Test endpoint that mimics users.php exactly
 * This will help us identify what's different
 */

// Handle OPTIONS immediately - same as users.php should
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, X-Requested-With, Accept');
    header('Access-Control-Max-Age: 3600');
    header('Content-Type: application/json');
    http_response_code(200);
    exit();
}

// Set CORS headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// Try to load api-init.php exactly like users.php does
$response = [
    'success' => false,
    'message' => 'Testing users.php flow',
    'steps' => []
];

try {
    $response['steps'][] = 'Loading api-init.php';
    require_once __DIR__ . '/api-init.php';
    $response['steps'][] = 'api-init.php loaded successfully';
    
    // Get method
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $response['method'] = $method;
    
    // Parse input like users.php does
    $input = null;
    if ($method === 'POST' || $method === 'PUT') {
        $response['steps'][] = 'Reading POST input';
        $jsonInput = file_get_contents('php://input');
        $response['input_length'] = strlen($jsonInput);
        
        if (!empty($jsonInput)) {
            $input = json_decode($jsonInput, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $response['steps'][] = 'JSON parsed successfully';
                $response['input_action'] = $input['action'] ?? 'none';
            } else {
                $response['steps'][] = 'JSON parse error: ' . json_last_error_msg();
            }
        } else {
            // Use test data for GET requests
            $input = [
                'action' => 'register',
                'email' => 'test2@example.com',
                'password' => 'test123',
                'name' => 'Test User 2'
            ];
            $response['steps'][] = 'Using test data';
        }
    } else {
        // Use test data for GET
        $input = [
            'action' => 'register',
            'email' => 'test2@example.com',
            'password' => 'test123',
            'name' => 'Test User 2'
        ];
        $response['steps'][] = 'Using test data for GET';
    }
    
    // Try to call register function if action is register
    if ($input && isset($input['action']) && $input['action'] === 'register') {
        $response['steps'][] = 'Action is register, checking if register function exists';
        
        if (function_exists('register')) {
            $response['steps'][] = 'register() function exists, attempting to call it';
            $response['steps'][] = 'Note: This will actually register a user!';
            
            // Actually call the register function
            register($input);
            // Should exit, so we won't reach here
        } else {
            $response['steps'][] = 'register() function not found';
        }
    }
    
    $response['success'] = true;
    
} catch (Exception $e) {
    $response['success'] = false;
    $response['error'] = $e->getMessage();
    $response['file'] = $e->getFile();
    $response['line'] = $e->getLine();
    $response['trace'] = $e->getTraceAsString();
}

http_response_code(200);
echo json_encode($response, JSON_PRETTY_PRINT);


