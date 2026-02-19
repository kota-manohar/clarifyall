<?php
/**
 * Admin Database Connection Management
 * Allows admins to clear/reset database connections
 * SECURITY: Admin-only endpoint
 */

require_once __DIR__ . '/api-init.php';

// Check if user is admin
if (php_sapi_name() !== 'cli') {
    $isAdmin = false;
    $userId = $_GET['user_id'] ?? $_POST['user_id'] ?? null;
    $username = $_GET['username'] ?? $_POST['username'] ?? null;
    
    // First, try to authenticate by user_id
    if ($userId) {
        try {
            $pdo = getDBConnection();
            $stmt = $pdo->prepare("SELECT id, role FROM users WHERE id = ? AND role = 'ADMIN'");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            $isAdmin = ($user && $user['role'] === 'ADMIN');
        } catch (Exception $e) {
            logError("Admin auth check error: " . $e->getMessage());
            $isAdmin = false;
        }
    }
    
    // If not authenticated by user_id, try username (for direct DB user access)
    if (!$isAdmin && $username) {
        // Check if username matches DB_USER (for direct database user access)
        if ($username === DB_USER) {
            $isAdmin = true;
        } else {
            // Or check if it's an admin user by email/username
            try {
                $pdo = getDBConnection();
                $stmt = $pdo->prepare("SELECT id, role FROM users WHERE (email = ? OR name = ?) AND role = 'ADMIN'");
                $stmt->execute([$username, $username]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                $isAdmin = ($user && $user['role'] === 'ADMIN');
            } catch (Exception $e) {
                logError("Admin auth check by username error: " . $e->getMessage());
                $isAdmin = false;
            }
        }
    }
    
    // Allow if DB_USER matches (for direct database operations)
    if (!$isAdmin && $username === DB_USER) {
        $isAdmin = true;
    }
    
    if (!$isAdmin) {
        http_response_code(403);
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
        echo json_encode([
            'success' => false,
            'error' => 'Unauthorized. Admin access required. Please provide a valid admin user_id or username.',
            'code' => 'UNAUTHORIZED',
            'hint' => 'Provide user_id or username parameter'
        ]);
        exit;
    }
}

// Handle the request
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? $_POST['action'] ?? 'status';

try {
    switch ($action) {
        case 'clear':
        case 'reset':
        case 'kill':
            // Clear all database connections using KILL queries
            $connectionCount = 0;
            $closedCount = 0;
            $killedConnections = 0;
            $killQueries = [];
            $killErrors = [];
            
            // Close PHP connections first
            if (class_exists('DatabaseConnection')) {
                $connectionCount = DatabaseConnection::getConnectionCount();
                
                // Close the singleton instance
                $instance = DatabaseConnection::getInstanceObject();
                if ($instance !== null) {
                    $instance->closeConnection();
                    $closedCount++;
                }
                
                // Also close any global connections
                if (isset($GLOBALS['pdo']) && $GLOBALS['pdo'] !== null) {
                    $GLOBALS['pdo'] = null;
                    $closedCount++;
                }
            }
            
            // Force garbage collection
            if (function_exists('gc_collect_cycles')) {
                gc_collect_cycles();
            }
            
            // Get MySQL process list and kill connections
            $mysqlConnections = 0;
            $currentConnectionId = null;
            try {
                $pdo = getDBConnection();
                
                // Get current connection ID to avoid killing ourselves
                $stmt = $pdo->query("SELECT CONNECTION_ID() as current_id");
                $currentConn = $stmt->fetch(PDO::FETCH_ASSOC);
                $currentConnectionId = $currentConn['current_id'] ?? null;
                
                // Get all KILL queries for connections except current one
                // Note: information_schema views may not support prepared statements, so we escape DB_USER
                // DB_USER is a constant from config, so it's safe, but we escape it anyway
                $dbUserEscaped = $pdo->quote(DB_USER);
                $stmt = $pdo->query("
                    SELECT CONCAT('KILL ', id, ';') as kill_query, id, user, host, db, command, time, state
                    FROM information_schema.PROCESSLIST
                    WHERE id <> CONNECTION_ID()
                    AND user = $dbUserEscaped
                ");
                $killStatements = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                $mysqlConnections = count($killStatements);
                
                // Execute each KILL query
                foreach ($killStatements as $kill) {
                    $killQuery = $kill['kill_query'];
                    $connectionId = $kill['id'];
                    $killQueries[] = [
                        'query' => $killQuery,
                        'connection_id' => $connectionId,
                        'user' => $kill['user'],
                        'host' => $kill['host'],
                        'db' => $kill['db'],
                        'command' => $kill['command'],
                        'time' => $kill['time'],
                        'state' => $kill['state']
                    ];
                    
                    try {
                        $pdo->exec($killQuery);
                        $killedConnections++;
                    } catch (Exception $e) {
                        $killErrors[] = [
                            'connection_id' => $connectionId,
                            'error' => $e->getMessage()
                        ];
                    }
                }
                
                // Get final connection count
                $stmt = $pdo->query("SHOW PROCESSLIST");
                $processes = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $finalConnections = count($processes);
                
                // Close this connection too
                closeDBConnection();
            } catch (Exception $e) {
                logError("Error killing MySQL connections: " . $e->getMessage());
                $killErrors[] = ['error' => $e->getMessage()];
            }
            
            sendResponse([
                'success' => true,
                'message' => 'Database connections cleared successfully',
                'data' => [
                    'php_connections_closed' => $closedCount,
                    'php_connections_before' => $connectionCount,
                    'mysql_connections_before' => $mysqlConnections,
                    'mysql_connections_killed' => $killedConnections,
                    'mysql_active_connections_after' => $finalConnections ?? 0,
                    'current_connection_id' => $currentConnectionId,
                    'kill_queries' => $killQueries,
                    'kill_errors' => $killErrors,
                    'timestamp' => date('Y-m-d H:i:s')
                ]
            ]);
            break;
            
        case 'status':
        default:
            // Get connection status
            $connectionCount = 0;
            $mysqlConnections = 0;
            $mysqlProcessList = [];
            $killQueries = [];
            $currentConnectionId = null;
            
            if (class_exists('DatabaseConnection')) {
                $connectionCount = DatabaseConnection::getConnectionCount();
            }
            
            try {
                $pdo = getDBConnection();
                
                // Get current connection ID
                $stmt = $pdo->query("SELECT CONNECTION_ID() as current_id");
                $currentConn = $stmt->fetch(PDO::FETCH_ASSOC);
                $currentConnectionId = $currentConn['current_id'] ?? null;
                
                // Get all processes
                $stmt = $pdo->query("SHOW PROCESSLIST");
                $processes = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $mysqlConnections = count($processes);
                
                // Get KILL queries for all connections except current
                // Note: information_schema views may not support prepared statements, so we escape DB_USER
                // DB_USER is a constant from config, so it's safe, but we escape it anyway
                $dbUserEscaped = $pdo->quote(DB_USER);
                $stmt = $pdo->query("
                    SELECT CONCAT('KILL ', id, ';') as kill_query, id, user, host, db, command, time, state, info
                    FROM information_schema.PROCESSLIST
                    WHERE id <> CONNECTION_ID()
                    AND user = $dbUserEscaped
                ");
                $killStatements = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Get connection details (limit to current user's connections)
                $currentUser = DB_USER;
                foreach ($processes as $process) {
                    if ($process['User'] === $currentUser || $process['User'] === str_replace('_', '', $currentUser)) {
                        $mysqlProcessList[] = [
                            'id' => $process['Id'],
                            'user' => $process['User'],
                            'host' => $process['Host'],
                            'db' => $process['db'],
                            'command' => $process['Command'],
                            'time' => $process['Time'],
                            'state' => $process['State'],
                            'info' => $process['Info'] ?? null
                        ];
                    }
                }
                
                // Build kill queries list
                foreach ($killStatements as $kill) {
                    $killQueries[] = [
                        'query' => $kill['kill_query'],
                        'connection_id' => $kill['id'],
                        'user' => $kill['user'],
                        'host' => $kill['host'],
                        'db' => $kill['db'],
                        'command' => $kill['command'],
                        'time' => $kill['time'],
                        'state' => $kill['state']
                    ];
                }
            } catch (Exception $e) {
                logError("Error getting MySQL process list: " . $e->getMessage());
            }
            
            sendResponse([
                'success' => true,
                'data' => [
                    'php_connection_count' => $connectionCount,
                    'mysql_total_connections' => $mysqlConnections,
                    'mysql_user_connections' => count($mysqlProcessList),
                    'mysql_processes' => $mysqlProcessList,
                    'kill_queries' => $killQueries,
                    'kill_queries_count' => count($killQueries),
                    'current_connection_id' => $currentConnectionId,
                    'timestamp' => date('Y-m-d H:i:s')
                ]
            ]);
            break;
    }
} catch (Exception $e) {
    logError("Admin DB connection error: " . $e->getMessage());
    sendError('Failed to manage database connections: ' . $e->getMessage(), 500, 'DB_CONNECTION_ERROR');
}

