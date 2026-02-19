<?php
/**
 * Prompts API
 * Handles CRUD operations for AI prompts
 */

// Use centralized API initialization (handles CORS, security, rate limiting, DB connection)
require_once __DIR__ . '/api-init.php';

// Validate HTTP method
validateMethod(['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = explode('/', trim($path, '/'));

// Route handling
switch ($method) {
    case 'GET':
        if (isset($segments[2])) {
            if ($segments[2] === 'all') {
                getAllPrompts();
            } elseif ($segments[2] === 'trending') {
                getTrendingPrompts();
            } elseif ($segments[2] === 'popular') {
                getPopularPrompts();
            } elseif ($segments[2] === 'statistics') {
                getStatistics();
            } elseif (isset($segments[3]) && $segments[2] === 'slug') {
                // Get by slug: /prompts.php/slug/{slug}
                getPromptBySlug($segments[3]);
            } elseif (is_numeric($segments[2])) {
                // Get by ID (backward compatibility)
                getPromptById($segments[2]);
            }
        } else {
            getPrompts();
        }
        break;
    case 'POST':
        createPrompt();
        break;
    case 'PUT':
        if (isset($segments[2]) && is_numeric($segments[2])) {
            if (isset($segments[3])) {
                if ($segments[3] === 'approve') {
                    approvePrompt($segments[2]);
                } elseif ($segments[3] === 'reject') {
                    rejectPrompt($segments[2]);
                } elseif ($segments[3] === 'upvote') {
                    votePrompt($segments[2], 'UPVOTE');
                } elseif ($segments[3] === 'downvote') {
                    votePrompt($segments[2], 'DOWNVOTE');
                }
            } else {
                updatePrompt($segments[2]);
            }
        }
        break;
    case 'DELETE':
        if (isset($segments[2]) && is_numeric($segments[2])) {
            deletePrompt($segments[2]);
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

// ============================================
// GET Functions
// ============================================

function getPrompts() {
    global $pdo;
    
    $query = "SELECT p.*, 
              LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(p.title, ' ', '-'), '_', '-'), '.', ''), ':', ''), ',', ''), '''', '')) as slug,
              pc.name as category_name,
              (p.upvotes - p.downvotes) as score
              FROM prompts p
              LEFT JOIN prompt_categories pc ON p.category_id = pc.id
              WHERE p.status = 'APPROVED'";
    
    $params = [];
    
    // Search
    if (isset($_GET['search']) && !empty($_GET['search'])) {
        $query .= " AND (p.title LIKE ? OR p.description LIKE ? OR p.prompt_text LIKE ?)";
        $search = '%' . $_GET['search'] . '%';
        $params[] = $search;
        $params[] = $search;
        $params[] = $search;
    }
    
    // Filter by type
    if (isset($_GET['type']) && !empty($_GET['type'])) {
        $query .= " AND p.prompt_type = ?";
        $params[] = $_GET['type'];
    }
    
    // Filter by category
    if (isset($_GET['category_id']) && !empty($_GET['category_id'])) {
        $query .= " AND p.category_id = ?";
        $params[] = $_GET['category_id'];
    }
    
    // Filter by tool
    if (isset($_GET['tool_id']) && !empty($_GET['tool_id'])) {
        $query .= " AND p.tool_id = ?";
        $params[] = $_GET['tool_id'];
    }
    
    // Filter by difficulty
    if (isset($_GET['difficulty']) && !empty($_GET['difficulty'])) {
        $query .= " AND p.difficulty = ?";
        $params[] = $_GET['difficulty'];
    }
    
    // Sort
    $sortBy = isset($_GET['sort']) ? $_GET['sort'] : 'created_at';
    $sortOrder = isset($_GET['order']) && $_GET['order'] === 'asc' ? 'ASC' : 'DESC';
    
    switch ($sortBy) {
        case 'popular':
            $query .= " ORDER BY score DESC, p.views DESC";
            break;
        case 'views':
            $query .= " ORDER BY p.views DESC";
            break;
        case 'upvotes':
            $query .= " ORDER BY p.upvotes DESC";
            break;
        default:
            $query .= " ORDER BY p.created_at $sortOrder";
    }
    
    // Pagination
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
    $offset = ($page - 1) * $limit;
    
    // Ensure positive integers
    $limit = max(1, $limit);
    $offset = max(0, $offset);
    
    // LIMIT and OFFSET cannot be bound as parameters in PDO, so we use sanitized integers directly
    $query .= " LIMIT $limit OFFSET $offset";
    
    try {
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $prompts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database query failed: ' . $e->getMessage()]);
        exit;
    }
    
    // Parse JSON fields
    foreach ($prompts as &$prompt) {
        $prompt['tags'] = json_decode($prompt['tags'], true) ?: [];
        $prompt['parameters'] = json_decode($prompt['parameters'], true) ?: [];
    }
    
    // Get total count
    $countQuery = "SELECT COUNT(*) as total FROM prompts p WHERE p.status = 'APPROVED'";
    $countParams = [];
    
    if (isset($_GET['search']) && !empty($_GET['search'])) {
        $countQuery .= " AND (p.title LIKE ? OR p.description LIKE ? OR p.prompt_text LIKE ?)";
        $search = '%' . $_GET['search'] . '%';
        $countParams[] = $search;
        $countParams[] = $search;
        $countParams[] = $search;
    }
    
    if (isset($_GET['type']) && !empty($_GET['type'])) {
        $countQuery .= " AND p.prompt_type = ?";
        $countParams[] = $_GET['type'];
    }
    
    if (isset($_GET['category_id']) && !empty($_GET['category_id'])) {
        $countQuery .= " AND p.category_id = ?";
        $countParams[] = $_GET['category_id'];
    }
    
    if (isset($_GET['difficulty']) && !empty($_GET['difficulty'])) {
        $countQuery .= " AND p.difficulty = ?";
        $countParams[] = $_GET['difficulty'];
    }
    
    try {
        $countStmt = $pdo->prepare($countQuery);
        $countStmt->execute($countParams);
        $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Count query failed: ' . $e->getMessage()]);
        exit;
    }
    
    echo json_encode([
        'prompts' => $prompts,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => (int)$total,
            'pages' => ceil($total / $limit)
        ]
    ]);
}

function getAllPrompts() {
    global $pdo;
    
    $query = "SELECT p.*, 
              LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(p.title, ' ', '-'), '_', '-'), '.', ''), ':', ''), ',', ''), '''', '')) as slug,
              pc.name as category_name,
              (p.upvotes - p.downvotes) as score
              FROM prompts p
              LEFT JOIN prompt_categories pc ON p.category_id = pc.id";
    
    $params = [];
    
    // Filter by status (for admin)
    if (isset($_GET['status']) && !empty($_GET['status'])) {
        $query .= " WHERE p.status = ?";
        $params[] = $_GET['status'];
    }
    
    $query .= " ORDER BY p.created_at DESC";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $prompts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Parse JSON fields
    foreach ($prompts as &$prompt) {
        $prompt['tags'] = json_decode($prompt['tags'], true) ?: [];
        $prompt['parameters'] = json_decode($prompt['parameters'], true) ?: [];
    }
    
    echo json_encode($prompts);
}

function getPromptById($id) {
    global $pdo;
    
    // Increment view count
    $updateStmt = $pdo->prepare("UPDATE prompts SET views = views + 1 WHERE id = ?");
    $updateStmt->execute([$id]);
    
    $stmt = $pdo->prepare("
        SELECT p.*, 
        LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(p.title, ' ', '-'), '_', '-'), '.', ''), ':', ''), ',', ''), '''', '')) as slug,
        pc.name as category_name,
        (p.upvotes - p.downvotes) as score
        FROM prompts p
        LEFT JOIN prompt_categories pc ON p.category_id = pc.id
        WHERE p.id = ?
    ");
    $stmt->execute([$id]);
    $prompt = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($prompt) {
        $prompt['tags'] = json_decode($prompt['tags'], true) ?: [];
        $prompt['parameters'] = json_decode($prompt['parameters'], true) ?: [];
        // Slug is already generated in the SELECT statement
        echo json_encode($prompt);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Prompt not found']);
    }
}

function getPromptBySlug($slug) {
    global $pdo;
    
    // Match by generated slug from title
    $stmt = $pdo->prepare("
        SELECT p.*, 
        LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(p.title, ' ', '-'), '_', '-'), '.', ''), ':', ''), ',', ''), '''', '')) as slug,
        pc.name as category_name,
        (p.upvotes - p.downvotes) as score
        FROM prompts p
        LEFT JOIN prompt_categories pc ON p.category_id = pc.id
        WHERE LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(p.title, ' ', '-'), '_', '-'), '.', ''), ':', ''), ',', ''), '''', '')) = ?
    ");
    $stmt->execute([strtolower($slug)]);
    $prompt = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($prompt) {
        // Increment view count
        $updateStmt = $pdo->prepare("UPDATE prompts SET views = views + 1 WHERE id = ?");
        $updateStmt->execute([$prompt['id']]);
        
        $prompt['tags'] = json_decode($prompt['tags'], true) ?: [];
        $prompt['parameters'] = json_decode($prompt['parameters'], true) ?: [];
        // Slug is already generated in the SELECT statement
        echo json_encode($prompt);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Prompt not found']);
    }
}

// Helper function to generate slug from title
function generateSlugFromTitle($title) {
    if (empty($title)) return '';
    $slug = strtolower(trim($title));
    $slug = preg_replace('/[^\w\s-]/', '', $slug); // Remove special characters
    $slug = preg_replace('/[\s_-]+/', '-', $slug); // Replace spaces and underscores with hyphens
    $slug = preg_replace('/^-+|-+$/', '', $slug); // Remove leading/trailing hyphens
    return $slug;
}

function getTrendingPrompts() {
    global $pdo;
    
    $stmt = $pdo->prepare("
        SELECT p.*, 
        LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(p.title, ' ', '-'), '_', '-'), '.', ''), ':', ''), ',', ''), '''', '')) as slug,
        pc.name as category_name,
        (p.upvotes - p.downvotes) as score
        FROM prompts p
        LEFT JOIN prompt_categories pc ON p.category_id = pc.id
        WHERE p.status = 'APPROVED'
        AND p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ORDER BY score DESC, p.views DESC
        LIMIT 20
    ");
    $stmt->execute();
    $prompts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($prompts as &$prompt) {
        $prompt['tags'] = json_decode($prompt['tags'], true) ?: [];
        $prompt['parameters'] = json_decode($prompt['parameters'], true) ?: [];
    }
    
    echo json_encode($prompts);
}

function getPopularPrompts() {
    global $pdo;
    
    $stmt = $pdo->prepare("
        SELECT p.*, 
        LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(p.title, ' ', '-'), '_', '-'), '.', ''), ':', ''), ',', ''), '''', '')) as slug,
        pc.name as category_name,
        (p.upvotes - p.downvotes) as score
        FROM prompts p
        LEFT JOIN prompt_categories pc ON p.category_id = pc.id
        WHERE p.status = 'APPROVED'
        ORDER BY score DESC, p.views DESC
        LIMIT 50
    ");
    $stmt->execute();
    $prompts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($prompts as &$prompt) {
        $prompt['tags'] = json_decode($prompt['tags'], true) ?: [];
        $prompt['parameters'] = json_decode($prompt['parameters'], true) ?: [];
    }
    
    echo json_encode($prompts);
}

function getStatistics() {
    global $pdo;
    
    $stmt = $pdo->prepare("
        SELECT 
        COUNT(*) as total_prompts,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_prompts,
        SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved_prompts,
        SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_prompts,
        SUM(CASE WHEN prompt_type = 'IMAGE' THEN 1 ELSE 0 END) as image_prompts,
        SUM(CASE WHEN prompt_type = 'VIDEO' THEN 1 ELSE 0 END) as video_prompts,
        SUM(CASE WHEN prompt_type = 'IMAGE_EDIT' THEN 1 ELSE 0 END) as image_edit_prompts,
        SUM(CASE WHEN prompt_type = 'VIDEO_EDIT' THEN 1 ELSE 0 END) as video_edit_prompts,
        SUM(views) as total_views,
        SUM(upvotes) as total_upvotes,
        SUM(downvotes) as total_downvotes
        FROM prompts
    ");
    $stmt->execute();
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode($stats);
}

// ============================================
// POST Functions
// ============================================

function createPrompt() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (empty($input['title']) || empty($input['prompt_text']) || empty($input['prompt_type'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Title, prompt text, and type are required']);
        return;
    }
    
    $stmt = $pdo->prepare("
        INSERT INTO prompts (
            title, description, prompt_text, prompt_type, category_id, tool_id,
            difficulty, tags, example_image_url, example_video_url, parameters,
            status, submitted_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    
    $tags = isset($input['tags']) ? json_encode($input['tags']) : '[]';
    $parameters = isset($input['parameters']) ? json_encode($input['parameters']) : '{}';
    $status = isset($input['status']) ? $input['status'] : 'PENDING';
    
    // Handle tool_id - accept numeric ID or string (tool name)
    $toolId = null;
    if (!empty($input['tool_id'])) {
        if (is_numeric($input['tool_id'])) {
            // Direct tool ID provided
            $toolId = (int)$input['tool_id'];
            
            // Verify tool exists
            $checkStmt = $pdo->prepare("SELECT id FROM tools WHERE id = ? LIMIT 1");
            $checkStmt->execute([$toolId]);
            $checkTool = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$checkTool) {
                error_log("Tool ID not found in database: " . $toolId);
                http_response_code(400);
                echo json_encode(['error' => 'Tool ID not found: ' . $toolId]);
                return;
            }
        } else {
            // String provided - try to find tool by name (case-insensitive)
            $toolName = trim($input['tool_id']);
            
            // First try exact match (case-insensitive)
            $toolStmt = $pdo->prepare("SELECT id FROM tools WHERE LOWER(TRIM(name)) = LOWER(?) LIMIT 1");
            $toolStmt->execute([$toolName]);
            $tool = $toolStmt->fetch(PDO::FETCH_ASSOC);
            
            // If not found, try LIKE match (handles partial matches)
            if (!$tool) {
                $toolStmt = $pdo->prepare("SELECT id FROM tools WHERE LOWER(name) LIKE LOWER(?) LIMIT 1");
                $toolStmt->execute(['%' . $toolName . '%']);
                $tool = $toolStmt->fetch(PDO::FETCH_ASSOC);
            }
            
            if ($tool) {
                $toolId = (int)$tool['id'];
            } else {
                // Tool not found - log for debugging
                error_log("Tool not found in database for prompt: tool_name='" . $toolName . "', title='" . ($input['title'] ?? '') . "'");
                // Return error response so user knows
                http_response_code(400);
                echo json_encode(['error' => 'Tool not found: ' . $toolName . '. Please ensure the tool exists in the tools table.']);
                return;
            }
        }
    }
    
    $result = $stmt->execute([
        $input['title'],
        $input['description'] ?? '',
        $input['prompt_text'],
        $input['prompt_type'],
        $input['category_id'] ?? null,
        $toolId,
        $input['difficulty'] ?? 'BEGINNER',
        $tags,
        $input['example_image_url'] ?? null,
        $input['example_video_url'] ?? null,
        $parameters,
        $status,
        $input['submitted_by'] ?? null
    ]);
    
    if ($result) {
        $promptId = $pdo->lastInsertId();
        echo json_encode(['success' => true, 'id' => $promptId]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create prompt']);
    }
}

// ============================================
// PUT Functions
// ============================================

function updatePrompt($id) {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        return;
    }
    
    $fields = [];
    $params = [];
    
    if (isset($input['title'])) {
        $fields[] = "title = ?";
        $params[] = $input['title'];
    }
    if (isset($input['description'])) {
        $fields[] = "description = ?";
        $params[] = $input['description'];
    }
    if (isset($input['prompt_text'])) {
        $fields[] = "prompt_text = ?";
        $params[] = $input['prompt_text'];
    }
    if (isset($input['prompt_type'])) {
        $fields[] = "prompt_type = ?";
        $params[] = $input['prompt_type'];
    }
    if (isset($input['category_id'])) {
        $fields[] = "category_id = ?";
        // Convert empty string to NULL
        $params[] = ($input['category_id'] === '' || $input['category_id'] === null) ? null : (int)$input['category_id'];
    }
    if (isset($input['tool_id'])) {
        $fields[] = "tool_id = ?";
        // Handle tool_id - if it's a string (tool name), try to find the tool ID
        $toolId = null;
        if (!empty($input['tool_id'])) {
            if (is_numeric($input['tool_id'])) {
                $toolId = (int)$input['tool_id'];
            } else {
                // Try to find tool by name (case-insensitive, handle various formats)
                $toolName = trim($input['tool_id']);
                
                // First try exact match (case-insensitive)
                $toolStmt = $pdo->prepare("SELECT id FROM tools WHERE LOWER(TRIM(name)) = LOWER(?) LIMIT 1");
                $toolStmt->execute([$toolName]);
                $tool = $toolStmt->fetch(PDO::FETCH_ASSOC);
                
                // If not found, try LIKE match (handles partial matches)
                if (!$tool) {
                    $toolStmt = $pdo->prepare("SELECT id FROM tools WHERE LOWER(name) LIKE LOWER(?) LIMIT 1");
                    $toolStmt->execute(['%' . $toolName . '%']);
                    $tool = $toolStmt->fetch(PDO::FETCH_ASSOC);
                }
                
                if ($tool) {
                    $toolId = (int)$tool['id'];
                } else {
                    // Tool not found - log for debugging
                    error_log("Tool not found in database for prompt update: tool_name='" . $toolName . "'");
                    // Set to null - allow update to continue without tool_id
                    $toolId = null;
                }
            }
        }
        $params[] = $toolId;
    }
    if (isset($input['difficulty'])) {
        $fields[] = "difficulty = ?";
        $params[] = $input['difficulty'];
    }
    if (isset($input['tags'])) {
        $fields[] = "tags = ?";
        $params[] = json_encode($input['tags']);
    }
    if (isset($input['example_image_url'])) {
        $fields[] = "example_image_url = ?";
        $params[] = ($input['example_image_url'] === '') ? null : $input['example_image_url'];
    }
    if (isset($input['example_video_url'])) {
        $fields[] = "example_video_url = ?";
        $params[] = ($input['example_video_url'] === '') ? null : $input['example_video_url'];
    }
    if (isset($input['parameters'])) {
        $fields[] = "parameters = ?";
        $params[] = json_encode($input['parameters']);
    }
    if (isset($input['status'])) {
        $fields[] = "status = ?";
        $params[] = $input['status'];
    }
    
    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['error' => 'No fields to update']);
        return;
    }
    
    $fields[] = "updated_at = NOW()";
    $params[] = $id;
    
    $query = "UPDATE prompts SET " . implode(', ', $fields) . " WHERE id = ?";
    
    try {
        $stmt = $pdo->prepare($query);
        if ($stmt->execute($params)) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update prompt']);
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function approvePrompt($id) {
    global $pdo;
    
    $stmt = $pdo->prepare("UPDATE prompts SET status = 'APPROVED', updated_at = NOW() WHERE id = ?");
    
    if ($stmt->execute([$id])) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to approve prompt']);
    }
}

function rejectPrompt($id) {
    global $pdo;
    
    $stmt = $pdo->prepare("UPDATE prompts SET status = 'REJECTED', updated_at = NOW() WHERE id = ?");
    
    if ($stmt->execute([$id])) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to reject prompt']);
    }
}

function votePrompt($id, $voteType) {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = $input['user_id'] ?? null;
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID required']);
        return;
    }
    
    try {
        // Check existing vote
        $checkStmt = $pdo->prepare("SELECT vote_type FROM prompt_votes WHERE prompt_id = ? AND user_id = ?");
        $checkStmt->execute([$id, $userId]);
        $existingVote = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingVote) {
            if ($existingVote['vote_type'] === $voteType) {
                // Remove vote
                $deleteStmt = $pdo->prepare("DELETE FROM prompt_votes WHERE prompt_id = ? AND user_id = ?");
                $deleteStmt->execute([$id, $userId]);
                
                $field = $voteType === 'UPVOTE' ? 'upvotes' : 'downvotes';
                $updateStmt = $pdo->prepare("UPDATE prompts SET $field = $field - 1 WHERE id = ?");
                $updateStmt->execute([$id]);
            } else {
                // Change vote
                $updateVoteStmt = $pdo->prepare("UPDATE prompt_votes SET vote_type = ? WHERE prompt_id = ? AND user_id = ?");
                $updateVoteStmt->execute([$voteType, $id, $userId]);
                
                if ($voteType === 'UPVOTE') {
                    $updateStmt = $pdo->prepare("UPDATE prompts SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = ?");
                } else {
                    $updateStmt = $pdo->prepare("UPDATE prompts SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = ?");
                }
                $updateStmt->execute([$id]);
            }
        } else {
            // New vote
            $insertStmt = $pdo->prepare("INSERT INTO prompt_votes (prompt_id, user_id, vote_type) VALUES (?, ?, ?)");
            $insertStmt->execute([$id, $userId, $voteType]);
            
            $field = $voteType === 'UPVOTE' ? 'upvotes' : 'downvotes';
            $updateStmt = $pdo->prepare("UPDATE prompts SET $field = $field + 1 WHERE id = ?");
            $updateStmt->execute([$id]);
        }
        
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to vote: ' . $e->getMessage()]);
    }
}

// ============================================
// DELETE Functions
// ============================================

function deletePrompt($id) {
    global $pdo;
    
    $stmt = $pdo->prepare("DELETE FROM prompts WHERE id = ?");
    
    if ($stmt->execute([$id])) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete prompt']);
    }
}
?>
