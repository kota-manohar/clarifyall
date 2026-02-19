<?php
/**
 * Simple POST test endpoint
 * Tests if POST requests work at all
 */

// Handle OPTIONS immediately
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

$method = $_SERVER['REQUEST_METHOD'];
$response = [
    'success' => true,
    'method' => $method,
    'timestamp' => date('Y-m-d H:i:s'),
    'message' => 'POST test endpoint working'
];

if ($method === 'POST') {
    $input = file_get_contents('php://input');
    $response['input_received'] = !empty($input);
    $response['input_length'] = strlen($input);
    
    if (!empty($input)) {
        $data = json_decode($input, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $response['json_parsed'] = true;
            $response['data'] = $data;
        } else {
            $response['json_parsed'] = false;
            $response['json_error'] = json_last_error_msg();
            $response['raw_input'] = substr($input, 0, 200);
        }
    }
}

http_response_code(200);
echo json_encode($response, JSON_PRETTY_PRINT);

