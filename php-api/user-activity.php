<?php
/**
 * User Activity API
 * Tracks user activity (views, saves, shares, clicks) and provides analytics
 */

// Use centralized API initialization (handles CORS, security, rate limiting, DB connection)
require_once __DIR__ . '/api-init.php';

// Validate HTTP method
validateMethod(['GET', 'POST', 'OPTIONS']);

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = explode('/', trim($path, '/'));

// Get user ID from query param for GET requests
$userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;

switch ($method) {
    case 'GET':
        if (isset($segments[2])) {
            if ($segments[2] === 'recently-viewed') {
                getRecentlyViewed($userId);
            } elseif ($segments[2] === 'stats') {
                getUserStats($userId);
            } elseif ($segments[2] === 'recommended') {
                getRecommendedTools($userId);
            } elseif ($segments[2] === 'activity') {
                getUserActivity($userId);
            }
        }
        break;
    case 'POST':
        if (isset($segments[2]) && $segments[2] === 'track-view') {
            trackToolView();
        } elseif (isset($segments[2]) && $segments[2] === 'track-activity') {
            trackActivity();
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

function getRecentlyViewed($userId) {
    global $pdo;
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID required']);
        return;
    }
    
    try {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        
        $stmt = $pdo->prepare("
            SELECT DISTINCT t.*, 
                   uv.viewed_at,
                   c.name as category_name
            FROM user_tool_views uv
            INNER JOIN tools t ON uv.tool_id = t.id
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE uv.user_id = ?
            ORDER BY uv.viewed_at DESC
            LIMIT ?
        ");
        $stmt->execute([$userId, $limit]);
        $tools = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['tools' => $tools]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function getUserStats($userId) {
    global $pdo;
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID required']);
        return;
    }
    
    try {
        // Total views
        $viewsStmt = $pdo->prepare("SELECT COUNT(DISTINCT tool_id) as total_views FROM user_tool_views WHERE user_id = ?");
        $viewsStmt->execute([$userId]);
        $views = $viewsStmt->fetch(PDO::FETCH_ASSOC);
        
        // Saved tools count
        $savedStmt = $pdo->prepare("SELECT COUNT(*) as total_saved FROM user_saved_tools WHERE user_id = ?");
        $savedStmt->execute([$userId]);
        $saved = $savedStmt->fetch(PDO::FETCH_ASSOC);
        
        // Submitted tools count
        $submittedStmt = $pdo->prepare("SELECT COUNT(*) as total_submitted FROM tools WHERE submitted_by = ?");
        $submittedStmt->execute([$userId]);
        $submitted = $submittedStmt->fetch(PDO::FETCH_ASSOC);
        
        // Activity count (last 30 days)
        $activityStmt = $pdo->prepare("
            SELECT COUNT(*) as recent_activity 
            FROM user_tool_activity 
            WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ");
        $activityStmt->execute([$userId]);
        $activity = $activityStmt->fetch(PDO::FETCH_ASSOC);
        
        // Most viewed category
        $categoryStmt = $pdo->prepare("
            SELECT c.name, COUNT(*) as view_count
            FROM user_tool_views uv
            INNER JOIN tools t ON uv.tool_id = t.id
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE uv.user_id = ? AND c.id IS NOT NULL
            GROUP BY c.id, c.name
            ORDER BY view_count DESC
            LIMIT 1
        ");
        $categoryStmt->execute([$userId]);
        $topCategory = $categoryStmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'total_views' => (int)$views['total_views'],
            'total_saved' => (int)$saved['total_saved'],
            'total_submitted' => (int)$submitted['total_submitted'],
            'recent_activity' => (int)$activity['recent_activity'],
            'top_category' => $topCategory ? $topCategory['name'] : null,
            'top_category_views' => $topCategory ? (int)$topCategory['view_count'] : 0
        ]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function getRecommendedTools($userId) {
    global $pdo;
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID required']);
        return;
    }
    
    try {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 6;
        
        // Get user's preferred categories from view history
        $prefStmt = $pdo->prepare("
            SELECT t.category_id, COUNT(*) as view_count
            FROM user_tool_views uv
            INNER JOIN tools t ON uv.tool_id = t.id
            WHERE uv.user_id = ? AND t.category_id IS NOT NULL
            GROUP BY t.category_id
            ORDER BY view_count DESC
            LIMIT 3
        ");
        $prefStmt->execute([$userId]);
        $preferredCategories = $prefStmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Get user's viewed tool IDs to exclude
        $viewedStmt = $pdo->prepare("SELECT DISTINCT tool_id FROM user_tool_views WHERE user_id = ?");
        $viewedStmt->execute([$userId]);
        $viewedToolIds = $viewedStmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Build query
        if (!empty($preferredCategories)) {
            $placeholders = implode(',', array_fill(0, count($preferredCategories), '?'));
            $excludePlaceholders = !empty($viewedToolIds) ? ' AND t.id NOT IN (' . implode(',', array_fill(0, count($viewedToolIds), '?')) . ')' : '';
            $params = array_merge($preferredCategories, $viewedToolIds);
            
            $query = "
                SELECT t.*, c.name as category_name,
                       (t.view_count + t.save_count * 2) as popularity_score
                FROM tools t
                LEFT JOIN categories c ON t.category_id = c.id
                WHERE t.status = 'APPROVED' 
                AND t.category_id IN ($placeholders)
                $excludePlaceholders
                ORDER BY popularity_score DESC, t.created_at DESC
                LIMIT ?
            ";
            $params[] = $limit;
        } else {
            // If no preferences, recommend popular tools
            $excludePlaceholders = !empty($viewedToolIds) ? ' AND t.id NOT IN (' . implode(',', array_fill(0, count($viewedToolIds), '?')) . ')' : '';
            $params = $viewedToolIds;
            
            $query = "
                SELECT t.*, c.name as category_name,
                       (t.view_count + t.save_count * 2) as popularity_score
                FROM tools t
                LEFT JOIN categories c ON t.category_id = c.id
                WHERE t.status = 'APPROVED'
                $excludePlaceholders
                ORDER BY popularity_score DESC, t.created_at DESC
                LIMIT ?
            ";
            $params[] = $limit;
        }
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $tools = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['tools' => $tools]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function getUserActivity($userId) {
    global $pdo;
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID required']);
        return;
    }
    
    try {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
        $days = isset($_GET['days']) ? (int)$_GET['days'] : 30;
        
        $stmt = $pdo->prepare("
            SELECT ua.*, t.name as tool_name, t.logo_url, t.category_id,
                   c.name as category_name
            FROM user_tool_activity ua
            INNER JOIN tools t ON ua.tool_id = t.id
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE ua.user_id = ? 
            AND ua.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            ORDER BY ua.created_at DESC
            LIMIT ?
        ");
        $stmt->execute([$userId, $days, $limit]);
        $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['activities' => $activities]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function trackToolView() {
    global $pdo;
    
    try {
        $jsonInput = file_get_contents('php://input');
        if (empty($jsonInput)) {
            http_response_code(400);
            echo json_encode(['error' => 'No data provided']);
            return;
        }
        
        $input = json_decode($jsonInput, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON input: ' . json_last_error_msg()]);
            return;
        }
        
        if (empty($input['user_id']) || empty($input['tool_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'User ID and Tool ID are required']);
            return;
        }
        
        $userId = (int)$input['user_id'];
        $toolId = (int)$input['tool_id'];
        $duration = isset($input['duration']) ? (int)$input['duration'] : 0;
        
        // Check if record exists for today
        $checkStmt = $pdo->prepare("
            SELECT id, view_duration 
            FROM user_tool_views 
            WHERE user_id = ? 
            AND tool_id = ? 
            AND DATE(viewed_at) = DATE(NOW())
            LIMIT 1
        ");
        $checkStmt->execute([$userId, $toolId]);
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing) {
            // Update existing record
            $updateStmt = $pdo->prepare("
                UPDATE user_tool_views 
                SET viewed_at = NOW(), 
                    view_duration = view_duration + ?
                WHERE id = ?
            ");
            $updateStmt->execute([$duration, $existing['id']]);
        } else {
            // Insert new record
            $insertStmt = $pdo->prepare("
                INSERT INTO user_tool_views (user_id, tool_id, viewed_at, view_duration)
                VALUES (?, ?, NOW(), ?)
            ");
            $insertStmt->execute([$userId, $toolId, $duration]);
        }
        
        echo json_encode(['success' => true]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error tracking view: ' . $e->getMessage()]);
    }
}

function trackActivity() {
    global $pdo;
    
    try {
        $jsonInput = file_get_contents('php://input');
        if (empty($jsonInput)) {
            http_response_code(400);
            echo json_encode(['error' => 'No data provided']);
            return;
        }
        
        $input = json_decode($jsonInput, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON input: ' . json_last_error_msg()]);
            return;
        }
        
        if (empty($input['user_id']) || empty($input['tool_id']) || empty($input['activity_type'])) {
            http_response_code(400);
            echo json_encode(['error' => 'User ID, Tool ID, and Activity Type are required']);
            return;
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO user_tool_activity (user_id, tool_id, activity_type, activity_data)
            VALUES (?, ?, ?, ?)
        ");
        
        $activityData = isset($input['activity_data']) ? json_encode($input['activity_data']) : null;
        
        $stmt->execute([
            (int)$input['user_id'],
            (int)$input['tool_id'],
            $input['activity_type'],
            $activityData
        ]);
        
        echo json_encode(['success' => true]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error tracking activity: ' . $e->getMessage()]);
    }
}
?>

