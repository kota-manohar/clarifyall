<?php
/**
 * Prompt Collections API
 * Manages user prompt collections CRUD operations
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
        if (isset($segments[2]) && is_numeric($segments[2])) {
            if (isset($segments[3]) && $segments[3] === 'prompts') {
                getCollectionPrompts($segments[2]);
            } else {
                getCollectionById($segments[2]);
            }
        } else {
            getCollections();
        }
        break;
    case 'POST':
        if (isset($segments[2]) && is_numeric($segments[2])) {
            if (isset($segments[3]) && $segments[3] === 'add-prompt') {
                addPromptToCollection($segments[2]);
            } elseif (isset($segments[3]) && $segments[3] === 'remove-prompt') {
                removePromptFromCollection($segments[2]);
            }
        } else {
            createCollection();
        }
        break;
    case 'PUT':
        if (isset($segments[2]) && is_numeric($segments[2])) {
            updateCollection($segments[2]);
        }
        break;
    case 'DELETE':
        if (isset($segments[2]) && is_numeric($segments[2])) {
            deleteCollection($segments[2]);
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

function getCollections() {
    global $pdo;
    
    $query = "SELECT c.*, 
              u.name as user_name,
              COUNT(cp.prompt_id) as prompt_count
              FROM prompt_collections c
              LEFT JOIN users u ON c.user_id = u.id
              LEFT JOIN collection_prompts cp ON c.id = cp.collection_id
              WHERE 1=1";
    
    $params = [];
    
    // Filter by user
    if (isset($_GET['user_id']) && !empty($_GET['user_id'])) {
        $query .= " AND c.user_id = ?";
        $params[] = $_GET['user_id'];
    }
    
    // Filter by public/private
    if (isset($_GET['is_public'])) {
        $query .= " AND c.is_public = ?";
        $params[] = $_GET['is_public'] === 'true' ? 1 : 0;
    }
    
    $query .= " GROUP BY c.id ORDER BY c.created_at DESC";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $collections = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($collections);
}

function getCollectionById($id) {
    global $pdo;
    
    $stmt = $pdo->prepare("
        SELECT c.*, 
        u.name as user_name,
        COUNT(cp.prompt_id) as prompt_count
        FROM prompt_collections c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN collection_prompts cp ON c.id = cp.collection_id
        WHERE c.id = ?
        GROUP BY c.id
    ");
    $stmt->execute([$id]);
    $collection = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($collection) {
        echo json_encode($collection);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Collection not found']);
    }
}

function getCollectionPrompts($collectionId) {
    global $pdo;
    
    $stmt = $pdo->prepare("
        SELECT p.*, 
        pc.name as category_name,
        t.name as tool_name,
        cp.order_index,
        cp.added_at,
        (p.upvotes - p.downvotes) as score
        FROM collection_prompts cp
        JOIN prompts p ON cp.prompt_id = p.id
        LEFT JOIN prompt_categories pc ON p.category_id = pc.id
        LEFT JOIN tools t ON p.tool_id = t.id
        WHERE cp.collection_id = ?
        ORDER BY cp.order_index ASC, cp.added_at DESC
    ");
    $stmt->execute([$collectionId]);
    $prompts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Parse JSON fields
    foreach ($prompts as &$prompt) {
        $prompt['tags'] = json_decode($prompt['tags'], true) ?: [];
        $prompt['parameters'] = json_decode($prompt['parameters'], true) ?: [];
    }
    
    echo json_encode($prompts);
}

// ============================================
// POST Functions
// ============================================

function createCollection() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (empty($input['name']) || empty($input['user_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Collection name and user ID are required']);
        return;
    }
    
    $stmt = $pdo->prepare("
        INSERT INTO prompt_collections (
            name, description, user_id, is_public, created_at
        ) VALUES (?, ?, ?, ?, NOW())
    ");
    
    $result = $stmt->execute([
        $input['name'],
        $input['description'] ?? '',
        $input['user_id'],
        isset($input['is_public']) && $input['is_public'] ? 1 : 0
    ]);
    
    if ($result) {
        $collectionId = $pdo->lastInsertId();
        echo json_encode(['success' => true, 'id' => $collectionId]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create collection']);
    }
}

function addPromptToCollection($collectionId) {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['prompt_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Prompt ID is required']);
        return;
    }
    
    // Check if prompt already in collection
    $checkStmt = $pdo->prepare("SELECT * FROM collection_prompts WHERE collection_id = ? AND prompt_id = ?");
    $checkStmt->execute([$collectionId, $input['prompt_id']]);
    
    if ($checkStmt->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'Prompt already in collection']);
        return;
    }
    
    // Get max order_index
    $maxStmt = $pdo->prepare("SELECT MAX(order_index) as max_order FROM collection_prompts WHERE collection_id = ?");
    $maxStmt->execute([$collectionId]);
    $maxOrder = $maxStmt->fetch(PDO::FETCH_ASSOC)['max_order'] ?? 0;
    
    $stmt = $pdo->prepare("
        INSERT INTO collection_prompts (collection_id, prompt_id, order_index, added_at)
        VALUES (?, ?, ?, NOW())
    ");
    
    if ($stmt->execute([$collectionId, $input['prompt_id'], $maxOrder + 1])) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to add prompt to collection']);
    }
}

function removePromptFromCollection($collectionId) {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['prompt_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Prompt ID is required']);
        return;
    }
    
    $stmt = $pdo->prepare("DELETE FROM collection_prompts WHERE collection_id = ? AND prompt_id = ?");
    
    if ($stmt->execute([$collectionId, $input['prompt_id']])) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to remove prompt from collection']);
    }
}

// ============================================
// PUT Functions
// ============================================

function updateCollection($id) {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $fields = [];
    $params = [];
    
    if (isset($input['name'])) {
        $fields[] = "name = ?";
        $params[] = $input['name'];
    }
    if (isset($input['description'])) {
        $fields[] = "description = ?";
        $params[] = $input['description'];
    }
    if (isset($input['is_public'])) {
        $fields[] = "is_public = ?";
        $params[] = $input['is_public'] ? 1 : 0;
    }
    
    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['error' => 'No fields to update']);
        return;
    }
    
    $fields[] = "updated_at = NOW()";
    $params[] = $id;
    
    $query = "UPDATE prompt_collections SET " . implode(', ', $fields) . " WHERE id = ?";
    $stmt = $pdo->prepare($query);
    
    if ($stmt->execute($params)) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update collection']);
    }
}

// ============================================
// DELETE Functions
// ============================================

function deleteCollection($id) {
    global $pdo;
    
    // Delete collection (cascade will delete collection_prompts)
    $stmt = $pdo->prepare("DELETE FROM prompt_collections WHERE id = ?");
    
    if ($stmt->execute([$id])) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete collection']);
    }
}
?>
