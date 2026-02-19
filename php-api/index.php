<?php
// Enhanced CORS headers - must be first, before any output
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Expose-Headers: Content-Length, Content-Type');
header('Access-Control-Max-Age: 3600');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

echo json_encode([
    'message' => 'ClarifyAll API is running',
    'version' => '1.0.0',
    'cors_enabled' => true,
    'endpoints' => [
        'GET /categories.php' => 'Get all categories',
        'GET /tools.php' => 'Get all tools',
        'GET /tools.php/{id}' => 'Get tool by ID',
        'POST /tools.php' => 'Create new tool',
        'POST /users.php' => 'User registration/login',
        'GET /test-cors.php' => 'Test CORS configuration'
    ],
    'timestamp' => date('Y-m-d H:i:s')
]);
?>
