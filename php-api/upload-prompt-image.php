<?php
/**
 * Upload Prompt Image API
 * Handles image upload for prompts
 */

// Use centralized API initialization (handles CORS, security, rate limiting)
require_once __DIR__ . '/api-init.php';

// Validate HTTP method
validateMethod(['POST', 'OPTIONS']);

// Check if file was uploaded
if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded or upload error']);
    exit;
}

$file = $_FILES['image'];

// Validate file type
$allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
if (!in_array($file['type'], $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.']);
    exit;
}

// Validate file size (max 5MB)
$maxSize = 5 * 1024 * 1024; // 5MB
if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['error' => 'File size exceeds 5MB limit']);
    exit;
}

// Create upload directory if it doesn't exist
// Use same pattern as tool logos - save to root level prompt-images/ folder
$uploadDir = __DIR__ . '/../prompt-images/';
if (!file_exists($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create upload directory']);
        exit;
    }
}

// Generate unique filename
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = 'prompt-' . uniqid() . '-' . time() . '.' . $extension;
$filepath = $uploadDir . $filename;

// Move uploaded file
if (!move_uploaded_file($file['tmp_name'], $filepath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save uploaded file']);
    exit;
}

// Generate URL
$url = 'https://clarifyall.com/prompt-images/' . $filename;

// Return success with URL
echo json_encode([
    'success' => true,
    'url' => $url,
    'filename' => $filename
]);
?>

