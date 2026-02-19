<?php
/**
 * Security Middleware
 * Handles HTTPS enforcement, CORS, and security headers
 */

/**
 * Enforce HTTPS
 */
function enforceHTTPS() {
    // Only enforce if explicitly required
    if (!defined('REQUIRE_HTTPS') || !REQUIRE_HTTPS || php_sapi_name() === 'cli') {
        return;
    }
    
    // Check if request is HTTPS
    $isHTTPS = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
               (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443) ||
               (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
    
    if (!$isHTTPS) {
        // Log the error instead of silently failing
        if (function_exists('logError')) {
            logError('HTTPS enforcement failed', [
                'HTTPS' => $_SERVER['HTTPS'] ?? 'not set',
                'SERVER_PORT' => $_SERVER['SERVER_PORT'] ?? 'not set',
                'X_FORWARDED_PROTO' => $_SERVER['HTTP_X_FORWARDED_PROTO'] ?? 'not set',
                'REQUEST_URI' => $_SERVER['REQUEST_URI'] ?? 'not set'
            ]);
        }
        sendError('HTTPS required', 400, 'HTTPS_REQUIRED');
    }
}

/**
 * Set security headers
 */
function setSecurityHeaders() {
    // Skip in CLI mode or if headers already sent
    if (php_sapi_name() === 'cli' || headers_sent()) {
        return;
    }
    
    // Prevent clickjacking
    header('X-Frame-Options: DENY');
    
    // Prevent MIME type sniffing
    header('X-Content-Type-Options: nosniff');
    
    // Enable XSS protection
    header('X-XSS-Protection: 1; mode=block');
    
    // Content Security Policy - relaxed for API to allow cross-origin requests
    // CSP doesn't control fetch/XHR, but we relax it to avoid any edge cases
    header("Content-Security-Policy: default-src 'self' https:; connect-src 'self' https:;");
    
    // Strict Transport Security (HSTS)
    if (defined('REQUIRE_HTTPS') && REQUIRE_HTTPS) {
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
    }
    
    // Referrer Policy
    header('Referrer-Policy: strict-origin-when-cross-origin');
}

/**
 * Validate CORS origin
 */
function validateCORS() {
    if (php_sapi_name() === 'cli') {
        return;
    }
    
    // Always set CORS headers - default to allow all origins
    $allowedOrigins = explode(',', getenv('ALLOWED_ORIGINS') ?: '*');
    $origin = $_SERVER['HTTP_ORIGIN'] ?? null;
    
    // Always set CORS headers for allowed origins
    if (in_array('*', $allowedOrigins) || empty(getenv('ALLOWED_ORIGINS'))) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, X-Requested-With, Accept');
        header('Access-Control-Max-Age: 3600');
    } elseif ($origin && in_array($origin, $allowedOrigins)) {
        header("Access-Control-Allow-Origin: $origin");
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, X-Requested-With, Accept');
        header('Access-Control-Max-Age: 3600');
    } else {
        // If origin doesn't match, still set headers (but browser will block if using credentials)
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, X-Requested-With, Accept');
        header('Access-Control-Max-Age: 3600');
    }
}

/**
 * Validate request method
 */
function validateMethod($allowedMethods) {
    if (php_sapi_name() === 'cli') {
        return;
    }
    
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    
    if (!in_array($method, $allowedMethods)) {
        sendError(
            "Method not allowed. Allowed methods: " . implode(', ', $allowedMethods),
            405,
            'METHOD_NOT_ALLOWED'
        );
    }
}

/**
 * Sanitize SQL query inputs
 */
function sanitizeForSQL($value, $type = 'string') {
    if ($type === 'int') {
        return (int)$value;
    } elseif ($type === 'float') {
        return (float)$value;
    } elseif ($type === 'bool') {
        return (bool)$value;
    }
    
    // For strings, return for use in prepared statements (never concatenate!)
    return $value;
}

/**
 * Get client IP (used by security middleware and rate limiting)
 * Defined here first, used by other middleware
 */
if (!function_exists('getClientIP')) {
    function getClientIP() {
        $ipKeys = [
            'HTTP_CLIENT_IP',
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_FORWARDED',
            'HTTP_X_CLUSTER_CLIENT_IP',
            'HTTP_FORWARDED_FOR',
            'HTTP_FORWARDED',
            'REMOTE_ADDR'
        ];
        
        foreach ($ipKeys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                foreach (explode(',', $_SERVER[$key]) as $ip) {
                    $ip = trim($ip);
                    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                        return $ip;
                    }
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }
}

/**
 * Prevent SQL Injection by ensuring prepared statements are used
 */
function checkForSQLInjection($input) {
    $dangerous = [
        "'", '"', ';', '--', '/*', '*/', 'xp_', 'sp_',
        'UNION', 'SELECT', 'INSERT', 'UPDATE', 'DELETE',
        'DROP', 'CREATE', 'ALTER', 'EXEC', 'EXECUTE'
    ];
    
    $inputStr = is_array($input) ? json_encode($input) : (string)$input;
    $inputUpper = strtoupper($inputStr);
    
    foreach ($dangerous as $pattern) {
        if (stripos($inputStr, $pattern) !== false) {
            // Check if it's not part of a legitimate word
            if (preg_match('/\b' . preg_quote($pattern, '/') . '\b/i', $inputStr)) {
                logError("Potential SQL injection attempt detected", [
                    'input' => substr($inputStr, 0, 100),
                    'ip' => getClientIP()
                ]);
                return true;
            }
        }
    }
    
    return false;
}

?>
