<?php
/**
 * Test OPTIONS handling - minimal test
 */

// Set CORS headers for all responses
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// Get method
$method = $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN';

// Test 1: Direct OPTIONS handling
if ($method === 'OPTIONS') {
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, X-Requested-With, Accept');
    header('Access-Control-Max-Age: 3600');
    http_response_code(200);
    echo json_encode([
        'status' => 'OK', 
        'message' => 'OPTIONS handled directly',
        'method' => $method,
        'request_info' => [
            'REQUEST_METHOD' => $_SERVER['REQUEST_METHOD'] ?? 'not set',
            'HTTP_ORIGIN' => $_SERVER['HTTP_ORIGIN'] ?? 'not set',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'] ?? 'not set'
        ]
    ]);
    exit();
}

// Test 2: Via api-init.php (for non-OPTIONS requests)
try {
    require_once __DIR__ . '/api-init.php';
    echo json_encode([
        'status' => 'success',
        'message' => 'api-init.php loaded successfully',
        'method' => $method,
        'note' => 'For OPTIONS test, browser will send OPTIONS request automatically'
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'api-init.php error: ' . $e->getMessage(),
        'method' => $method
    ]);
}

