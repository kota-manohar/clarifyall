<?php
/**
 * Tool Comments API
 * Handles CRUD operations for tool comments
 */

// Use centralized API initialization (handles CORS, security, rate limiting, DB connection)
require_once __DIR__ . '/api-init.php';

// OPTIONS requests are already handled by api-init.php, so we can skip validation for them
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// If it's an OPTIONS request, api-init.php should have already handled it and exited
// But just in case, let's handle it here too
if ($method === 'OPTIONS') {
    // CORS headers should already be set by api-init.php, but ensure they're set
    if (!headers_sent()) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, X-Requested-With, Accept');
        header('Access-Control-Max-Age: 3600');
        header('Content-Type: application/json');
    }
    http_response_code(200);
    exit();
}

// Validate HTTP method for non-OPTIONS requests
validateMethod(['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);

// Parse the URL path to get segments
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = explode('/', trim($path, '/'));

// Find the position of 'tool-comments' in the path
$toolCommentsIndex = array_search('tool-comments', $segments);
if ($toolCommentsIndex !== false) {
    // Get the tool ID (next segment after 'tool-comments')
    $toolId = isset($segments[$toolCommentsIndex + 1]) ? $segments[$toolCommentsIndex + 1] : null;
    // Get the comment ID (segment after tool ID, if exists)
    $commentId = isset($segments[$toolCommentsIndex + 2]) ? $segments[$toolCommentsIndex + 2] : null;
} else {
    // Fallback: try to get from segments directly
    // If URL is /php-api/tool-comments.php/27, segments might be [php-api, tool-comments.php, 27]
    // Or if rewritten: segments might be [php-api, tool-comments, 27]
    $toolId = null;
    $commentId = null;
    
    // Try to find numeric segments
    foreach ($segments as $index => $segment) {
        if (is_numeric($segment)) {
            if ($toolId === null) {
                $toolId = $segment;
            } elseif ($commentId === null) {
                $commentId = $segment;
                break;
            }
        }
    }
}

// Route handling
switch ($method) {
    case 'GET':
        if ($toolId && is_numeric($toolId)) {
            if ($commentId && is_numeric($commentId)) {
                getCommentById($commentId);
            } else {
                getCommentsByToolId($toolId);
            }
        } else {
            http_response_code(400);
            sendResponse(['error' => 'Tool ID required'], 400);
        }
        break;
    case 'POST':
        if ($toolId && is_numeric($toolId)) {
            createComment($toolId);
        } else {
            http_response_code(400);
            sendResponse(['error' => 'Tool ID required'], 400);
        }
        break;
    case 'PUT':
        if ($toolId && is_numeric($toolId)) {
            updateComment($toolId);
        } else {
            http_response_code(400);
            sendResponse(['error' => 'Comment ID required'], 400);
        }
        break;
    case 'DELETE':
        if ($toolId && is_numeric($toolId)) {
            deleteComment($toolId);
        } else {
            http_response_code(400);
            sendResponse(['error' => 'Comment ID required'], 400);
        }
        break;
    default:
        http_response_code(405);
        sendResponse(['error' => 'Method not allowed'], 405);
        break;
}

// ============================================
// GET Functions
// ============================================

function getCommentsByToolId($toolId) {
    global $pdo;
    
    // Ensure CORS headers are set
    if (!headers_sent()) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, X-Requested-With, Accept');
        header('Content-Type: application/json');
    }
    
    try {
        $stmt = $pdo->prepare("
            SELECT 
                c.id,
                c.tool_id,
                c.user_id,
                c.comment_text,
                c.status,
                c.created_at,
                c.updated_at,
                u.name as user_name,
                u.email as user_email,
                u.avatar_url as user_avatar
            FROM tool_comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.tool_id = ? AND c.status = 'APPROVED'
            ORDER BY c.created_at DESC
        ");
        $stmt->execute([$toolId]);
        $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get user info from session if available
        $currentUserId = null;
        if (isset($_SESSION['user_id'])) {
            $currentUserId = $_SESSION['user_id'];
        }
        
        sendResponse([
            'success' => true,
            'comments' => $comments,
            'count' => count($comments)
        ]);
    } catch (PDOException $e) {
        logError("Error fetching comments: " . $e->getMessage());
        sendError('Failed to fetch comments', 500, 'DB_ERROR');
    }
}

function getCommentById($commentId) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            SELECT 
                c.*,
                u.name as user_name,
                u.email as user_email,
                u.avatar_url as user_avatar
            FROM tool_comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        ");
        $stmt->execute([$commentId]);
        $comment = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$comment) {
            sendError('Comment not found', 404, 'NOT_FOUND');
            return;
        }
        
        sendResponse([
            'success' => true,
            'comment' => $comment
        ]);
    } catch (PDOException $e) {
        logError("Error fetching comment: " . $e->getMessage());
        sendError('Failed to fetch comment', 500, 'DB_ERROR');
    }
}

// ============================================
// POST Functions
// ============================================

function createComment($toolId) {
    global $pdo;
    
    // Ensure CORS headers are set for the actual request
    if (!headers_sent()) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, X-Requested-With, Accept');
        header('Content-Type: application/json');
    }
    
    // Get input data
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (empty($input['comment_text'])) {
        sendError('Comment text is required', 400, 'VALIDATION_ERROR');
        return;
    }
    
    // Get user ID from session or request
    $userId = null;
    if (isset($_SESSION['user_id'])) {
        $userId = $_SESSION['user_id'];
    } elseif (isset($input['user_id']) && is_numeric($input['user_id'])) {
        $userId = $input['user_id'];
    } else {
        // Try to get from Authorization header
        $headers = getallheaders();
        if (isset($headers['Authorization'])) {
            $token = str_replace('Bearer ', '', $headers['Authorization']);
            // Decode token or validate user (simplified - you may need to implement proper JWT validation)
            // For now, require user_id in request
            sendError('User authentication required', 401, 'UNAUTHORIZED');
            return;
        }
        sendError('User authentication required', 401, 'UNAUTHORIZED');
        return;
    }
    
    // Verify tool exists
    $toolStmt = $pdo->prepare("SELECT id FROM tools WHERE id = ? LIMIT 1");
    $toolStmt->execute([$toolId]);
    $tool = $toolStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$tool) {
        sendError('Tool not found', 404, 'TOOL_NOT_FOUND');
        return;
    }
    
    // Verify user exists
    $userStmt = $pdo->prepare("SELECT id, name, email FROM users WHERE id = ? LIMIT 1");
    $userStmt->execute([$userId]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        sendError('User not found', 404, 'USER_NOT_FOUND');
        return;
    }
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO tool_comments (tool_id, user_id, comment_text, status, created_at, updated_at)
            VALUES (?, ?, ?, 'APPROVED', NOW(), NOW())
        ");
        
        $commentText = sanitizeInput($input['comment_text']);
        $stmt->execute([$toolId, $userId, $commentText]);
        
        $commentId = $pdo->lastInsertId();
        
        // Fetch the created comment with user info
        $commentStmt = $pdo->prepare("
            SELECT 
                c.*,
                u.name as user_name,
                u.email as user_email,
                u.avatar_url as user_avatar
            FROM tool_comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        ");
        $commentStmt->execute([$commentId]);
        $comment = $commentStmt->fetch(PDO::FETCH_ASSOC);
        
        sendResponse([
            'success' => true,
            'message' => 'Comment created successfully',
            'comment' => $comment
        ], 201);
    } catch (PDOException $e) {
        logError("Error creating comment: " . $e->getMessage());
        sendError('Failed to create comment', 500, 'DB_ERROR');
    }
}

// ============================================
// PUT Functions
// ============================================

function updateComment($commentId) {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Get user ID from session
    $userId = null;
    if (isset($_SESSION['user_id'])) {
        $userId = $_SESSION['user_id'];
    } elseif (isset($input['user_id']) && is_numeric($input['user_id'])) {
        $userId = $input['user_id'];
    } else {
        sendError('User authentication required', 401, 'UNAUTHORIZED');
        return;
    }
    
    // Check if comment exists and belongs to user
    $checkStmt = $pdo->prepare("SELECT user_id FROM tool_comments WHERE id = ?");
    $checkStmt->execute([$commentId]);
    $comment = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$comment) {
        sendError('Comment not found', 404, 'NOT_FOUND');
        return;
    }
    
    if ($comment['user_id'] != $userId) {
        sendError('Unauthorized to update this comment', 403, 'FORBIDDEN');
        return;
    }
    
    if (empty($input['comment_text'])) {
        sendError('Comment text is required', 400, 'VALIDATION_ERROR');
        return;
    }
    
    try {
        $stmt = $pdo->prepare("
            UPDATE tool_comments 
            SET comment_text = ?, updated_at = NOW()
            WHERE id = ? AND user_id = ?
        ");
        
        $commentText = sanitizeInput($input['comment_text']);
        $stmt->execute([$commentText, $commentId, $userId]);
        
        // Fetch updated comment
        $commentStmt = $pdo->prepare("
            SELECT 
                c.*,
                u.name as user_name,
                u.email as user_email,
                u.avatar_url as user_avatar
            FROM tool_comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        ");
        $commentStmt->execute([$commentId]);
        $updatedComment = $commentStmt->fetch(PDO::FETCH_ASSOC);
        
        sendResponse([
            'success' => true,
            'message' => 'Comment updated successfully',
            'comment' => $updatedComment
        ]);
    } catch (PDOException $e) {
        logError("Error updating comment: " . $e->getMessage());
        sendError('Failed to update comment', 500, 'DB_ERROR');
    }
}

// ============================================
// DELETE Functions
// ============================================

function deleteComment($commentId) {
    global $pdo;
    
    // Get user ID from session, query param, or request body
    $userId = null;
    if (isset($_SESSION['user_id'])) {
        $userId = $_SESSION['user_id'];
    } elseif (isset($_GET['user_id']) && is_numeric($_GET['user_id'])) {
        $userId = $_GET['user_id'];
    } else {
        // Try to get from request body
        $input = json_decode(file_get_contents('php://input'), true);
        if (isset($input['user_id']) && is_numeric($input['user_id'])) {
            $userId = $input['user_id'];
        } else {
            sendError('User authentication required', 401, 'UNAUTHORIZED');
            return;
        }
    }
    
    // Check if comment exists and belongs to user
    $checkStmt = $pdo->prepare("SELECT user_id FROM tool_comments WHERE id = ?");
    $checkStmt->execute([$commentId]);
    $comment = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$comment) {
        sendError('Comment not found', 404, 'NOT_FOUND');
        return;
    }
    
    if ($comment['user_id'] != $userId) {
        sendError('Unauthorized to delete this comment', 403, 'FORBIDDEN');
        return;
    }
    
    try {
        $stmt = $pdo->prepare("DELETE FROM tool_comments WHERE id = ? AND user_id = ?");
        $stmt->execute([$commentId, $userId]);
        
        sendResponse([
            'success' => true,
            'message' => 'Comment deleted successfully'
        ]);
    } catch (PDOException $e) {
        logError("Error deleting comment: " . $e->getMessage());
        sendError('Failed to delete comment', 500, 'DB_ERROR');
    }
}

