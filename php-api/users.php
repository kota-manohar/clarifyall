<?php
/**
 * Users API
 * Handles user authentication, profile management, and user-related operations
 */

// CRITICAL: Handle OPTIONS preflight requests FIRST - before including anything
// This MUST happen before api-init.php is loaded to ensure it works
$requestMethod = $_SERVER['REQUEST_METHOD'] ?? '';
if ($requestMethod === 'OPTIONS') {
    if (!headers_sent()) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, X-Requested-With, Accept');
        header('Access-Control-Max-Age: 3600');
        header('Content-Type: application/json');
    }
    http_response_code(200);
    exit();
}

// Use centralized API initialization (handles CORS, security, rate limiting, DB connection)
require_once __DIR__ . '/api-init.php';

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Set error handler to catch fatal errors and ensure response is always sent
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== NULL && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        // Log the error first
        if (function_exists('logError')) {
            logError('Fatal error in users.php: ' . $error['message'], [
                'file' => $error['file'],
                'line' => $error['line'],
                'type' => $error['type']
            ]);
        }
        
        if (!headers_sent()) {
            header('Access-Control-Allow-Origin: *');
            header('Content-Type: application/json');
            http_response_code(500);
        }
        echo json_encode([
            'success' => false,
            'error' => 'Internal server error: ' . $error['message'],
            'file' => basename($error['file']),
            'line' => $error['line'],
            'type' => $error['type']
        ], JSON_PRETTY_PRINT);
    }
});

// Get method (OPTIONS already handled in api-init.php)
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Validate HTTP method (OPTIONS already handled in api-init.php, so skip validation for it)
if ($method !== 'OPTIONS') {
    try {
        validateMethod(['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);
    } catch (Exception $e) {
        if (!headers_sent()) {
            header('Content-Type: application/json');
            header('Access-Control-Allow-Origin: *');
            http_response_code(500);
        }
        echo json_encode([
            'success' => false,
            'error' => 'Method validation error: ' . $e->getMessage()
        ]);
        exit;
    }
}

// Include email configuration for email-related functions (after OPTIONS handling)
// Only include when needed, not for OPTIONS requests (which already exited above)
if ($method !== 'OPTIONS') {
    try {
        require_once __DIR__ . '/email-config.php';
    } catch (Exception $e) {
        // Log error but continue - email functions might fail but shouldn't stop API
        if (function_exists('logError')) {
            logError('Email config load error: ' . $e->getMessage());
        }
    }
    
    // Include service files
    define('INCLUDED_FROM_USERS', true);
    require_once __DIR__ . '/services/user-auth-service.php';
    require_once __DIR__ . '/services/admin-service.php';
}

// Parse JSON input safely (already have $method from above)
$input = null;
if ($method === 'POST' || $method === 'PUT') {
    $jsonInput = file_get_contents('php://input');
    if (function_exists('logError')) {
        logError('users.php: POST/PUT request received', [
            'method' => $method,
            'input_length' => strlen($jsonInput),
            'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'not set'
        ]);
    }
    
    if (!empty($jsonInput)) {
        $input = json_decode($jsonInput, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            // Invalid JSON - log error but continue (will be handled by validation)
            if (function_exists('logError')) {
                logError('Invalid JSON in users.php: ' . json_last_error_msg(), [
                    'raw_input' => substr($jsonInput, 0, 200)
                ]);
            }
            $input = null;
        } else {
            if (function_exists('logError') && isset($input['action'])) {
                logError('users.php: JSON parsed successfully', [
                    'action' => $input['action'] ?? 'none',
                    'has_email' => isset($input['email']),
                    'has_password' => isset($input['password']),
                    'has_name' => isset($input['name'])
                ]);
            }
        }
    } else {
        if (function_exists('logError')) {
            logError('users.php: Empty input received for POST/PUT');
        }
    }
}

// Route requests - wrap in try-catch to handle any unexpected errors
try {
if ($method === 'GET') {
    // Handle direct id parameter for user profile
    if (isset($_GET['id']) && !isset($_GET['action'])) {
        getUserProfile($_GET['id']);
        exit;
    }
    
    // Handle action parameter
    if (isset($_GET['action'])) {
        switch ($_GET['action']) {
            case 'saved_tools':
                getUserSavedTools($_GET['user_id'] ?? null);
                break;
            case 'profile':
                getUserProfile($_GET['user_id'] ?? null);
                break;
            case 'verify_email':
                verifyEmail($_GET['token'] ?? null);
                break;
            case 'check_saved':
                if (isset($_GET['user_id']) && isset($_GET['tool_id'])) {
                    checkSavedTool($_GET['user_id'], $_GET['tool_id']);
                } else {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'error' => 'User ID and Tool ID are required']);
                }
                break;
            case 'list_admins':
                listAdminUsers();
                break;
            case 'admin_profile':
                getAdminProfile();
                break;
            default:
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid action']);
        }
    } else {
        // No action or id provided
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid request. Provide action or id parameter.']);
    }
} elseif ($method === 'PUT') {
    // Handle PUT requests for profile updates
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $pathSegments = explode('/', trim($path, '/'));
    
    
    // Check if it's /users.php/{id} for profile update
    if (count($pathSegments) >= 2 && is_numeric(end($pathSegments))) {
        $userId = (int)end($pathSegments);
        $updateData = json_decode(file_get_contents('php://input'), true);
        if (!$updateData) {
            $updateData = [];
        }
        $updateData['user_id'] = $userId;
        updateProfile($updateData);
        exit;
    }
    
    // Check for change_password action via PUT (user version)
    if ($input && isset($input['action']) && $input['action'] === 'change_password') {
        changePassword($input);
        exit;
    }
    
    // Avatar uploads are handled via POST, not PUT (because FormData with file uploads)
    // So we skip avatar handling in PUT
    
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid PUT request']);
} elseif ($method === 'DELETE') {
    // Handle DELETE requests
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $pathSegments = explode('/', trim($path, '/'));
    
    // Check for delete admin action
    if (isset($_GET['action']) && $_GET['action'] === 'delete_admin' && count($pathSegments) >= 2 && is_numeric(end($pathSegments))) {
        $userId = (int)end($pathSegments);
        deleteAdminUser($userId);
        exit;
    }
    
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid DELETE request']);
} elseif ($method === 'POST') {
    // Check if it's an avatar upload request /users.php/{id}/avatar
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $pathSegments = explode('/', trim($path, '/'));
    
    if (count($pathSegments) >= 3 && $pathSegments[count($pathSegments) - 2] === 'avatar' && is_numeric($pathSegments[count($pathSegments) - 3])) {
        $userId = (int)$pathSegments[count($pathSegments) - 3];
        uploadAvatar($userId);
        exit;
    }
    
    // Handle action-based POST requests
    // Check action in both query string and request body
    $action = $_GET['action'] ?? ($input && isset($input['action']) ? $input['action'] : null);
    
    if ($action) {
        if (function_exists('logError')) {
            logError('users.php: Processing POST action', ['action' => $action]);
        }
        
        switch ($action) {
            case 'register':
                if (function_exists('logError')) {
                    logError('users.php: Calling register function');
                }
                register($input);
                exit; // Exit after function completes
            case 'login':
                if (function_exists('logError')) {
                    logError('users.php: Calling login function');
                }
                login($input);
                exit; // Exit after function completes
            case 'admin_login':
                adminLogin($input);
                exit; // Exit after function completes
            case 'admin_profile':
                getAdminProfile();
                exit;
            case 'list_admins':
                listAdminUsers();
                exit;
            case 'create_admin':
                // Merge query params into input if needed
                if (!$input || !is_array($input)) {
                    $input = [];
                }
                createAdminUser($input);
                exit; // Exit after function completes
            case 'update_admin':
                // Merge query params into input if needed
                if (!$input || !is_array($input)) {
                    $input = [];
                }
                updateAdminUser($input);
                exit; // Exit after function completes
            case 'change_admin_password':
                changeAdminPassword($input);
                break;
            case 'save_tool':
                saveTool($input);
                break;
            case 'unsave_tool':
                unsaveTool($input);
                break;
            case 'update_profile':
                updateProfile($input);
                break;
            case 'resend_verification':
                resendVerification($input);
                exit;
            case 'forgot_password':
                forgotPassword($input);
                exit;
            case 'reset_password':
                resetPassword($input);
                exit;
            default:
                if (!headers_sent()) {
                    header('Access-Control-Allow-Origin: *');
                    header('Content-Type: application/json');
                }
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid action']);
                exit;
        }
    } else {
        if (!headers_sent()) {
            header('Access-Control-Allow-Origin: *');
            header('Content-Type: application/json');
        }
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Action is required']);
        exit;
    }
} else {
    // Invalid method
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
} catch (Exception $e) {
    // Catch any unexpected errors
    // Flush any output buffer first
    ob_end_clean();
    
    if (!headers_sent()) {
        header('Access-Control-Allow-Origin: *');
        header('Content-Type: application/json');
        http_response_code(500);
    }
    
    $errorResponse = [
        'success' => false,
        'error' => 'Unexpected error: ' . $e->getMessage(),
        'file' => basename($e->getFile()),
        'line' => $e->getLine()
    ];
    
    if (defined('LOG_LEVEL') && LOG_LEVEL === 'DEBUG') {
        $errorResponse['trace'] = $e->getTraceAsString();
    }
    
    echo json_encode($errorResponse, JSON_PRETTY_PRINT);
    
    if (function_exists('logError')) {
        logError('Unexpected error in users.php routing: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
    }
    
    exit;
}

?>
