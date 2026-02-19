<?php
/**
 * Debug endpoint - mimics users.php exactly but with extensive logging
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Log function
function debugLog($message) {
    $logDir = __DIR__ . '/logs';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0755, true);
    }
    $logFile = $logDir . '/debug-users-' . date('Y-m-d') . '.log';
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] $message" . PHP_EOL;
    @file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
    
    // Also output for immediate feedback
    global $debugOutput;
    $debugOutput['logs'][] = "[$timestamp] $message";
}

$debugOutput = [
    'success' => false,
    'message' => 'Debug endpoint',
    'logs' => [],
    'request_info' => []
];

// Log request info
$method = $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN';
$debugOutput['request_info'] = [
    'method' => $method,
    'uri' => $_SERVER['REQUEST_URI'] ?? 'UNKNOWN',
    'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'NOT SET',
    'origin' => $_SERVER['HTTP_ORIGIN'] ?? 'NOT SET',
];

debugLog("Debug endpoint called with method: $method");

// Handle OPTIONS immediately
if ($method === 'OPTIONS') {
    debugLog('OPTIONS preflight request');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, X-Requested-With, Accept');
    header('Access-Control-Max-Age: 3600');
    header('Content-Type: application/json');
    http_response_code(200);
    debugLog('OPTIONS headers sent, exiting');
    exit();
}

// Set CORS headers for all requests
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

debugLog('CORS headers set');

// Try to load api-init.php
try {
    debugLog('Loading api-init.php');
    require_once __DIR__ . '/api-init.php';
    debugLog('api-init.php loaded successfully');
    $debugOutput['api_init'] = 'success';
} catch (Exception $e) {
    debugLog('api-init.php error: ' . $e->getMessage());
    $debugOutput['api_init'] = 'error';
    $debugOutput['api_init_error'] = $e->getMessage();
}

// Parse input
$input = null;
if ($method === 'POST') {
    debugLog('Reading POST input');
    $jsonInput = file_get_contents('php://input');
    $debugOutput['input_length'] = strlen($jsonInput);
    
    if (!empty($jsonInput)) {
        $input = json_decode($jsonInput, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            debugLog('JSON parsed successfully');
            $debugOutput['input'] = $input;
        } else {
            debugLog('JSON parse error: ' . json_last_error_msg());
            $debugOutput['json_error'] = json_last_error_msg();
        }
    } else {
        debugLog('Empty POST input');
    }
}

// Try to call register function if action is register
if ($input && isset($input['action']) && $input['action'] === 'register') {
    debugLog('Register action detected');
    $debugOutput['action'] = 'register';
    
    // Check if function exists
    if (function_exists('register')) {
        debugLog('register() function exists');
        
        // Actually try to call it
        try {
            debugLog('Calling register() function');
            register($input);
            // Should exit, so we won't reach here
            debugLog('register() completed (unexpected - should have exited)');
        } catch (Exception $e) {
            debugLog('register() exception: ' . $e->getMessage());
            $debugOutput['register_error'] = $e->getMessage();
        }
    } else {
        debugLog('register() function not found');
        $debugOutput['register_function'] = 'not found';
    }
}

$debugOutput['success'] = true;
debugLog('Debug endpoint completed');

http_response_code(200);
echo json_encode($debugOutput, JSON_PRETTY_PRINT);


