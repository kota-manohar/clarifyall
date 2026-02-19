<?php
/**
 * Core Configuration and Database Connection Manager
 * Implements singleton pattern with persistent connections for optimal performance
 */

// Load environment variables if .env file exists
function loadEnv($path) {
    if (!file_exists($path)) {
        return false;
    }
    
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        
        if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
            putenv(sprintf('%s=%s', $name, $value));
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
    return true;
}

// Try to load .env file
loadEnv(__DIR__ . '/.env');

// Configuration with environment variable fallbacks
define('DB_HOST', getenv('DB_HOST') ?: 'srv1148.hstgr.io');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'u530425252_kyc');
define('DB_USER', getenv('DB_USER') ?: 'u530425252_kyc');
define('DB_PASS', getenv('DB_PASS') ?: '&631^1HXVzqE');

define('API_VERSION', getenv('API_VERSION') ?: 'v1');
define('REQUIRE_HTTPS', filter_var(getenv('REQUIRE_HTTPS') ?: 'false', FILTER_VALIDATE_BOOLEAN));
define('ENABLE_RATE_LIMITING', filter_var(getenv('ENABLE_RATE_LIMITING') ?: 'true', FILTER_VALIDATE_BOOLEAN));
define('RATE_LIMIT_REQUESTS', (int)(getenv('RATE_LIMIT_REQUESTS') ?: '500')); // Increased from 100 to 500
define('RATE_LIMIT_WINDOW', (int)(getenv('RATE_LIMIT_WINDOW') ?: '3600')); // 1 hour
define('ENABLE_CACHE', filter_var(getenv('ENABLE_CACHE') ?: 'false', FILTER_VALIDATE_BOOLEAN));
define('LOG_LEVEL', getenv('LOG_LEVEL') ?: 'INFO');

/**
 * Singleton pattern for database connection to prevent exceeding connection limits
 */
class DatabaseConnection {
    private static $instance = null;
    private $pdo = null;
    
    private function __construct() {
        try {
            $dsn = sprintf(
                "mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4",
                DB_HOST,
                DB_PORT,
                DB_NAME
            );
            
            // Disable persistent connections to prevent hitting MySQL connection limit on shared hosting
            // Use regular connections that close after each request
            $this->pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_TIMEOUT => 5,
                PDO::ATTR_PERSISTENT => false, // Disabled to prevent connection limit issues on shared hosting
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
                PDO::ATTR_STRINGIFY_FETCHES => false,
                // Additional MySQL-specific settings for connection management
                PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true,
                PDO::MYSQL_ATTR_COMPRESS => false // Disable compression to reduce connection overhead
            ]);
        } catch(PDOException $e) {
            logError("Database connection error: " . $e->getMessage());
            throw $e;
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            try {
                self::$instance = new self();
            } catch(PDOException $e) {
                // If connection fails, wait a bit and retry once
                usleep(500000); // 0.5 seconds
                try {
                    self::$instance = new self();
                } catch(PDOException $e2) {
                    http_response_code(503); // Service Unavailable
                    echo json_encode([
                        'error' => 'Service temporarily unavailable',
                        'message' => 'Database connection failed. Please try again later.',
                        'code' => 'DB_CONNECTION_ERROR'
                    ], JSON_UNESCAPED_UNICODE);
                    logError("Database connection retry failed: " . $e2->getMessage());
                    exit;
                }
            }
        }
        return self::$instance->pdo;
    }
    
    /**
     * Get the singleton instance (for closing connection)
     */
    public static function getInstanceObject() {
        return self::$instance;
    }
    
    /**
     * Close database connection explicitly
     * This is important for shared hosting to prevent connection limit issues
     */
    public function closeConnection() {
        if ($this->pdo !== null) {
            // Explicitly close the PDO connection
            try {
                // Set PDO to null to close connection
                $this->pdo = null;
            } catch (Exception $e) {
                // Ignore errors when closing
            }
        }
        // Reset singleton instance
        self::$instance = null;
    }
    
    public function __destruct() {
        // Explicitly close connection to free up MySQL connections
        // This ensures connections are closed even if closeConnection() wasn't called
        $this->closeConnection();
    }
}

/**
 * Get database connection instance
 */
function getDBConnection() {
    return DatabaseConnection::getInstance();
}

/**
 * Close database connection explicitly
 * Call this at the end of long-running scripts or when done with database operations
 */
function closeDBConnection() {
    if (class_exists('DatabaseConnection')) {
        $instance = DatabaseConnection::getInstanceObject();
        if ($instance && method_exists($instance, 'closeConnection')) {
            $instance->closeConnection();
        }
    }
}

// Register shutdown function to close DB connection when script ends
// This is critical for shared hosting to prevent connection limit issues
register_shutdown_function(function() {
    if (class_exists('DatabaseConnection')) {
        // Close connection on script end to free up MySQL connections immediately
        try {
            $instance = DatabaseConnection::getInstanceObject();
            if ($instance !== null && method_exists($instance, 'closeConnection')) {
                $instance->closeConnection();
            }
        } catch (Exception $e) {
            // Ignore errors during shutdown - connection might already be closed
            // Log only in debug mode
            if (defined('LOG_LEVEL') && LOG_LEVEL === 'DEBUG') {
                error_log("Error closing DB connection during shutdown: " . $e->getMessage());
            }
        }
    }
    
    // Also ensure global $pdo is null if it exists
    if (isset($GLOBALS['pdo']) && $GLOBALS['pdo'] !== null) {
        $GLOBALS['pdo'] = null;
    }
});

/**
 * Standardized API response
 */
function sendResponse($data, $status = 200, $headers = []) {
    // Prevent headers already sent errors
    if (headers_sent()) {
        // If headers already sent, just output JSON
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
    
    http_response_code($status);
    
    // Always set CORS headers for API responses
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, X-Requested-With, Accept');
    
    foreach ($headers as $header) {
        header($header);
    }
    
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Send error response
 */
function sendError($message, $status = 400, $code = null, $details = null) {
    // Prevent headers already sent errors
    if (headers_sent()) {
        return;
    }
    
    $response = [
        'error' => true,
        'message' => $message
    ];
    
    if ($code) {
        $response['code'] = $code;
    }
    
    // Only include details in development
    if ($details && defined('LOG_LEVEL') && LOG_LEVEL === 'DEBUG') {
        $response['details'] = $details;
    }
    
    logError("API Error: $message" . ($code ? " (Code: $code)" : ""));
    sendResponse($response, $status);
}

/**
 * Logging function
 */
function logError($message, $context = []) {
    $logDir = __DIR__ . '/logs';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0755, true);
    }
    
    $logFile = $logDir . '/api-' . date('Y-m-d') . '.log';
    $timestamp = date('Y-m-d H:i:s');
    $contextStr = !empty($context) ? ' | Context: ' . json_encode($context) : '';
    $logMessage = "[$timestamp] $message$contextStr" . PHP_EOL;
    
    @file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
}

/**
 * Fallback for getallheaders() if not available (e.g., CLI or some servers)
 */
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        if (function_exists('apache_request_headers')) {
            return apache_request_headers();
        }
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}

/**
 * Input sanitization
 */
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

/**
 * Validate integer
 */
function validateInt($value, $min = null, $max = null) {
    $int = filter_var($value, FILTER_VALIDATE_INT);
    if ($int === false) {
        return false;
    }
    if ($min !== null && $int < $min) {
        return false;
    }
    if ($max !== null && $int > $max) {
        return false;
    }
    return $int;
}

/**
 * Validate email
 */
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Validate required fields
 */
function validateRequired($data, $requiredFields) {
    $missing = [];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            $missing[] = $field;
        }
    }
    return $missing;
}
?>