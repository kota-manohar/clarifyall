<?php
/**
 * Simple File-based Cache Implementation
 * For production, consider using Redis or Memcached
 */

/**
 * Get cached data
 */
function getCache($key, $default = null) {
    if (!defined('ENABLE_CACHE') || !ENABLE_CACHE) {
        return $default;
    }
    
    $cacheDir = __DIR__ . '/../cache/data';
    if (!is_dir($cacheDir)) {
        @mkdir($cacheDir, 0755, true);
    }
    
    $cacheFile = $cacheDir . '/' . md5($key) . '.cache';
    
    if (!file_exists($cacheFile)) {
        return $default;
    }
    
    $data = json_decode(file_get_contents($cacheFile), true);
    if (!$data) {
        return $default;
    }
    
    // Check expiration
    if (isset($data['expires']) && $data['expires'] < time()) {
        @unlink($cacheFile);
        return $default;
    }
    
    return $data['value'];
}

/**
 * Set cached data
 */
function setCache($key, $value, $ttl = 300) {
    if (!defined('ENABLE_CACHE') || !ENABLE_CACHE) {
        return false;
    }
    
    $cacheDir = __DIR__ . '/../cache/data';
    if (!is_dir($cacheDir)) {
        @mkdir($cacheDir, 0755, true);
    }
    
    $cacheFile = $cacheDir . '/' . md5($key) . '.cache';
    
    $data = [
        'value' => $value,
        'expires' => time() + $ttl,
        'created' => time()
    ];
    
    return @file_put_contents($cacheFile, json_encode($data), LOCK_EX) !== false;
}

/**
 * Delete cached data
 */
function deleteCache($key) {
    $cacheDir = __DIR__ . '/../cache/data';
    $cacheFile = $cacheDir . '/' . md5($key) . '.cache';
    
    if (file_exists($cacheFile)) {
        return @unlink($cacheFile);
    }
    
    return true;
}

/**
 * Clear all cache
 */
function clearCache($pattern = null) {
    $cacheDir = __DIR__ . '/../cache/data';
    if (!is_dir($cacheDir)) {
        return true;
    }
    
    $files = glob($cacheDir . '/*.cache');
    $deleted = 0;
    
    foreach ($files as $file) {
        if ($pattern) {
            $data = json_decode(file_get_contents($file), true);
            if (!$data || !isset($data['key']) || strpos($data['key'], $pattern) === false) {
                continue;
            }
        }
        
        if (@unlink($file)) {
            $deleted++;
        }
    }
    
    return $deleted;
}

/**
 * Cache helper with automatic key generation
 */
function cache($key, $callback, $ttl = 300) {
    $cached = getCache($key);
    if ($cached !== null) {
        return $cached;
    }
    
    $value = call_user_func($callback);
    setCache($key, $value, $ttl);
    return $value;
}

/**
 * Clean expired cache files
 */
function cleanExpiredCache() {
    $cacheDir = __DIR__ . '/../cache/data';
    if (!is_dir($cacheDir)) {
        return;
    }
    
    $files = glob($cacheDir . '/*.cache');
    $currentTime = time();
    $cleaned = 0;
    
    foreach ($files as $file) {
        $data = json_decode(file_get_contents($file), true);
        if ($data && isset($data['expires']) && $data['expires'] < $currentTime) {
            if (@unlink($file)) {
                $cleaned++;
            }
        }
    }
    
    return $cleaned;
}

// Clean cache periodically (5% chance on each request)
// Only run if constants are defined and we're not in CLI mode
if (defined('ENABLE_CACHE') && ENABLE_CACHE && php_sapi_name() !== 'cli' && rand(1, 20) === 1) {
    cleanExpiredCache();
}

?>
