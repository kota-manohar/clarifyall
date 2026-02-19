<?php
/**
 * Rate Limiting Middleware
 * Prevents API abuse by limiting requests per IP address
 */

/**
 * Check rate limit for current IP
 */
function checkRateLimit() {
    if (!defined('ENABLE_RATE_LIMITING') || !ENABLE_RATE_LIMITING || php_sapi_name() === 'cli') {
        return true;
    }
    
    // Skip rate limiting for OPTIONS requests (CORS preflight)
    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        return true;
    }
    
    // Check if constants are defined
    if (!defined('RATE_LIMIT_REQUESTS') || !defined('RATE_LIMIT_WINDOW')) {
        return true; // Skip rate limiting if not configured
    }
    
    $ip = getClientIP();
    $cacheDir = __DIR__ . '/../cache/rate_limit';
    
    if (!is_dir($cacheDir)) {
        @mkdir($cacheDir, 0755, true);
    }
    
    $cacheFile = $cacheDir . '/' . md5($ip) . '.json';
    $currentTime = time();
    
    // Read existing rate limit data
    $rateLimitWindow = defined('RATE_LIMIT_WINDOW') ? RATE_LIMIT_WINDOW : 3600;
    $rateData = [
        'count' => 0,
        'reset_time' => $currentTime + $rateLimitWindow
    ];
    
    if (file_exists($cacheFile)) {
        $data = json_decode(file_get_contents($cacheFile), true);
        if ($data) {
            $rateData = $data;
        }
    }
    
    // Reset if window has passed
    if ($currentTime >= $rateData['reset_time']) {
        $rateLimitWindow = defined('RATE_LIMIT_WINDOW') ? RATE_LIMIT_WINDOW : 3600;
        $rateData = [
            'count' => 0,
            'reset_time' => $currentTime + $rateLimitWindow
        ];
    }
    
    // Check limit
    $rateLimitRequests = defined('RATE_LIMIT_REQUESTS') ? RATE_LIMIT_REQUESTS : 100;
    $rateLimitWindow = defined('RATE_LIMIT_WINDOW') ? RATE_LIMIT_WINDOW : 3600;
    
    if ($rateData['count'] >= $rateLimitRequests) {
        $resetSeconds = $rateData['reset_time'] - $currentTime;
        logError("Rate limit exceeded", ['ip' => $ip, 'count' => $rateData['count']]);
        
        if (!headers_sent()) {
            header('X-RateLimit-Limit: ' . $rateLimitRequests);
            header('X-RateLimit-Remaining: 0');
            header('X-RateLimit-Reset: ' . $rateData['reset_time']);
            header('Retry-After: ' . $resetSeconds);
        }
        
        sendError(
            "Rate limit exceeded. Maximum " . $rateLimitRequests . " requests per " . ($rateLimitWindow / 60) . " minutes. Please try again in {$resetSeconds} seconds.",
            429,
            'RATE_LIMIT_EXCEEDED'
        );
    }
    
    // Increment count
    $rateData['count']++;
    
    // Save updated data
    @file_put_contents($cacheFile, json_encode($rateData), LOCK_EX);
    
    // Set response headers
    if (!headers_sent()) {
        header('X-RateLimit-Limit: ' . $rateLimitRequests);
        header('X-RateLimit-Remaining: ' . max(0, $rateLimitRequests - $rateData['count']));
        header('X-RateLimit-Reset: ' . $rateData['reset_time']);
    }
    
    return true;
}

/**
 * Get client IP address
 * Note: This function is defined in security.php to avoid duplication
 * If security.php isn't loaded yet, define it here as fallback
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
 * Clean old rate limit files
 */
function cleanRateLimitCache($maxAge = 3600) {
    $cacheDir = __DIR__ . '/../cache/rate_limit';
    if (!is_dir($cacheDir)) {
        return;
    }
    
    $files = glob($cacheDir . '/*.json');
    $currentTime = time();
    
    foreach ($files as $file) {
        if (filemtime($file) < ($currentTime - $maxAge)) {
            @unlink($file);
        }
    }
}

// Clean cache periodically (10% chance on each request)
if (rand(1, 10) === 1) {
    cleanRateLimitCache();
}

?>
