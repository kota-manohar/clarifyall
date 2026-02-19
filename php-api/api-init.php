<?php
/**
 * API Initialization Script
 * Include this at the top of all API endpoints for consistent setup
 * 
 * WARNING: This file should NOT be accessed directly via HTTP
 * It is designed to be included in other PHP files only
 */

// CRITICAL: Handle OPTIONS preflight requests FIRST - before ANY other code
// This MUST be the very first thing that runs after <?php
// No require_once, no function calls, nothing before this check
if (php_sapi_name() !== 'cli') {
    $requestMethod = $_SERVER['REQUEST_METHOD'] ?? '';
    if ($requestMethod === 'OPTIONS') {
        // Set CORS headers immediately - no other code should run
        // Clear any existing output
        if (ob_get_level()) {
            ob_clean();
        }
        if (!headers_sent()) {
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, X-Requested-With, Accept');
            header('Access-Control-Max-Age: 3600');
            header('Content-Type: application/json');
            http_response_code(200);
        }
        // Exit immediately - no further code execution
        exit();
    }
}

// Prevent direct access (only check for non-OPTIONS requests)
if (php_sapi_name() !== 'cli') {
    $phpSelf = basename($_SERVER['PHP_SELF'] ?? '');
    $scriptName = basename($_SERVER['SCRIPT_NAME'] ?? '');
    if ($phpSelf === 'api-init.php' || $scriptName === 'api-init.php') {
        // Only block if it's not an OPTIONS request (already handled above)
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'OPTIONS') {
            http_response_code(403);
            if (!headers_sent()) {
                header('Content-Type: application/json');
                header('Access-Control-Allow-Origin: *');
            }
            echo json_encode([
                'error' => true,
                'message' => 'Direct access to this file is not allowed. This file must be included in other PHP files.',
                'code' => 'FORBIDDEN'
            ]);
            exit;
        }
    }
}

// Load core configuration first
require_once __DIR__ . '/config.php';

// Load utilities before middleware
require_once __DIR__ . '/utils/cache.php';

// Load middleware
require_once __DIR__ . '/middleware/security.php';
require_once __DIR__ . '/middleware/rateLimit.php';
require_once __DIR__ . '/middleware/auth.php';

// OPTIONS requests are already handled at the top of this file
// This section continues for non-OPTIONS requests

// Set security headers
setSecurityHeaders();

// Add HSTS header for HTTPS enforcement
if (php_sapi_name() !== 'cli' && isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
    if (!headers_sent()) {
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
    }
}

// Validate HTTPS if required (only if not in CLI mode)
if (php_sapi_name() !== 'cli') {
    // Handle CORS for actual requests FIRST - before any other checks
    validateCORS();
    
    // Enforce HTTPS (but don't block if not configured)
    enforceHTTPS();
    
    // Check rate limiting (skip for OPTIONS as we already handled it)
    // Wrap in try-catch to prevent fatal errors from breaking the request
    if ($_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
        try {
            checkRateLimit();
        } catch (Exception $e) {
            // Log rate limit error but don't block request
            if (function_exists('logError')) {
                logError('Rate limit check error: ' . $e->getMessage());
            }
        }
    }
}

// Get database connection (will be reused if already exists)
// Only try to connect if not in CLI mode or if explicitly needed
// Connection will be automatically closed by shutdown function when script ends
if (php_sapi_name() !== 'cli') {
    try {
        $pdo = getDBConnection();
        // Store in global scope for shutdown function access
        $GLOBALS['pdo'] = $pdo;
    } catch(Exception $e) {
        // Log error but don't fail immediately - some endpoints might not need DB
        logError('Database connection failed in api-init: ' . $e->getMessage());
        // Only fail if we can't send error response
        if (!function_exists('sendError')) {
            http_response_code(503);
            header('Content-Type: application/json');
            echo json_encode([
                'error' => true,
                'message' => 'Service temporarily unavailable',
                'code' => 'DB_CONNECTION_ERROR'
            ]);
            exit;
        }
        sendError('Database connection failed', 503, 'DB_CONNECTION_ERROR');
    }
}

// Set default timezone
date_default_timezone_set('UTC');

// Enable error reporting based on log level (only in development)
if (defined('LOG_LEVEL') && LOG_LEVEL === 'DEBUG') {
    error_reporting(E_ALL);
    ini_set('display_errors', 0); // Never display errors to client
}

?>
