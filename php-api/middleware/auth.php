<?php
/**
 * Authentication Middleware
 * Handles API key validation, JWT tokens, and user authentication
 */

/**
 * Check if request requires authentication
 */
function requiresAuth() {
    return defined('API_KEY_REQUIRED') && constant('API_KEY_REQUIRED') === true;
}

/**
 * Validate API Key from header
 */
function validateApiKey() {
    $apiKey = null;
    
    // Check Authorization header (with fallback if getallheaders doesn't exist)
    if (!function_exists('getallheaders')) {
        // Fallback implementation
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headerName = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))));
                $headers[$headerName] = $value;
            }
        }
    } else {
        $headers = getallheaders();
    }
    if (isset($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $apiKey = $matches[1];
        } elseif (preg_match('/API-Key\s+(.*)$/i', $authHeader, $matches)) {
            $apiKey = $matches[1];
        }
    }
    
    // Check X-API-Key header
    if (!$apiKey && isset($headers['X-API-Key'])) {
        $apiKey = $headers['X-API-Key'];
    }
    
    // Check query parameter (less secure, but for compatibility)
    if (!$apiKey && isset($_GET['api_key'])) {
        $apiKey = $_GET['api_key'];
    }
    
    if (!$apiKey) {
        sendError('API key required', 401, 'MISSING_API_KEY');
    }
    
    // Validate API key (you should store valid keys in database or environment)
    $validKeys = explode(',', getenv('API_KEYS') ?: '');
    if (!in_array($apiKey, $validKeys)) {
        logError("Invalid API key attempt", ['ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown']);
        sendError('Invalid API key', 403, 'INVALID_API_KEY');
    }
    
    return true;
}

/**
 * Validate JWT Token
 */
function validateJWT($token) {
    // Simple JWT validation (implement full JWT library for production)
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return false;
    }
    
    // In production, use a proper JWT library like firebase/php-jwt
    // For now, return true if token format is correct
    return true;
}

/**
 * Get current authenticated user
 */
function getCurrentUser() {
    global $pdo;
    
    $token = getBearerToken();
    if (!$token) {
        return null;
    }
    
    // Validate token and get user (implement based on your auth system)
    try {
        $stmt = $pdo->prepare("SELECT id, name, email, role FROM users WHERE api_token = ? LIMIT 1");
        $stmt->execute([$token]);
        return $stmt->fetch();
    } catch (PDOException $e) {
        logError("Error fetching user from token: " . $e->getMessage());
        return null;
    }
}

/**
 * Extract Bearer token from Authorization header
 */
function getBearerToken() {
    // Fallback for getallheaders if not available
    if (!function_exists('getallheaders')) {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headerName = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))));
                $headers[$headerName] = $value;
            }
        }
    } else {
        $headers = getallheaders();
    }
    if (isset($headers['Authorization'])) {
        if (preg_match('/Bearer\s+(.*)$/i', $headers['Authorization'], $matches)) {
            return $matches[1];
        }
    }
    return null;
}

/**
 * Check if user has required role
 */
function requireRole($requiredRole) {
    $user = getCurrentUser();
    if (!$user) {
        sendError('Authentication required', 401, 'AUTH_REQUIRED');
    }
    
    if ($user['role'] !== $requiredRole && $requiredRole !== 'ADMIN') {
        sendError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');
    }
    
    return $user;
}

?>
