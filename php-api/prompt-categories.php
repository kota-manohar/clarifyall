<?php
/**
 * Prompt Categories API
 * Manages prompt categories CRUD operations
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
            getCategoryById($segments[2]);
        } else {
            getCategories();
        }
        break;
    case 'POST':
        createCategory();
        break;
    case 'PUT':
        if (isset($segments[2]) && is_numeric($segments[2])) {
            updateCategory($segments[2]);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid category ID']);
        }
        break;
    case 'DELETE':
        if (isset($segments[2]) && is_numeric($segments[2])) {
            deleteCategory($segments[2]);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid category ID']);
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

function getCategories() {
    global $pdo;
    
    $query = "SELECT pc.*, 
              COUNT(p.id) as prompt_count,
              parent.name as parent_name
              FROM prompt_categories pc
              LEFT JOIN prompts p ON pc.id = p.category_id AND p.status = 'APPROVED'
              LEFT JOIN prompt_categories parent ON pc.parent_id = parent.id
              GROUP BY pc.id
              ORDER BY pc.order_index ASC, pc.name ASC";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Organize into tree structure
    $tree = [];
    $lookup = [];
    
    // First pass: create lookup
    foreach ($categories as $category) {
        $category['children'] = [];
        $lookup[$category['id']] = $category;
    }
    
    // Second pass: build tree
    foreach ($lookup as $id => $category) {
        if ($category['parent_id']) {
            if (isset($lookup[$category['parent_id']])) {
                $lookup[$category['parent_id']]['children'][] = &$lookup[$id];
            }
        } else {
            $tree[] = &$lookup[$id];
        }
    }
    
    echo json_encode($tree);
}

function getCategoryById($id) {
    global $pdo;
    
    $stmt = $pdo->prepare("
        SELECT pc.*, 
        COUNT(p.id) as prompt_count,
        parent.name as parent_name
        FROM prompt_categories pc
        LEFT JOIN prompts p ON pc.id = p.category_id AND p.status = 'APPROVED'
        LEFT JOIN prompt_categories parent ON pc.parent_id = parent.id
        WHERE pc.id = ?
        GROUP BY pc.id
    ");
    $stmt->execute([$id]);
    $category = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($category) {
        // Get subcategories
        $subStmt = $pdo->prepare("
            SELECT pc.*, COUNT(p.id) as prompt_count
            FROM prompt_categories pc
            LEFT JOIN prompts p ON pc.id = p.category_id AND p.status = 'APPROVED'
            WHERE pc.parent_id = ?
            GROUP BY pc.id
            ORDER BY pc.order_index ASC
        ");
        $subStmt->execute([$id]);
        $category['children'] = $subStmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($category);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Category not found']);
    }
}

// ============================================
// POST Functions
// ============================================

function createCategory() {
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
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON input']);
            return;
        }
        
        // Validate required fields
        if (empty($input['name'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Category name is required']);
            return;
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO prompt_categories (
                name, description, icon, parent_id, order_index, created_at
            ) VALUES (?, ?, ?, ?, ?, NOW())
        ");
        
        $result = $stmt->execute([
            $input['name'],
            $input['description'] ?? '',
            $input['icon'] ?? '🎨',
            ($input['parent_id'] === '' || $input['parent_id'] === null) ? null : (int)$input['parent_id'],
            (int)($input['order_index'] ?? 0)
        ]);
        
        if ($result) {
            $categoryId = $pdo->lastInsertId();
            echo json_encode(['success' => true, 'id' => $categoryId]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create category']);
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error creating category: ' . $e->getMessage()]);
    }
}

// ============================================
// PUT Functions
// ============================================

function updateCategory($id) {
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
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON input']);
            return;
        }
        
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
        if (isset($input['icon'])) {
            $fields[] = "icon = ?";
            $params[] = $input['icon'];
        }
        if (isset($input['parent_id'])) {
            $fields[] = "parent_id = ?";
            // Convert empty string to NULL
            $params[] = ($input['parent_id'] === '' || $input['parent_id'] === null) ? null : (int)$input['parent_id'];
        }
        if (isset($input['order_index'])) {
            $fields[] = "order_index = ?";
            $params[] = (int)$input['order_index'];
        }
        
        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            return;
        }
        
        $fields[] = "updated_at = NOW()";
        $params[] = $id;
        
        $query = "UPDATE prompt_categories SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $pdo->prepare($query);
        
        if ($stmt->execute($params)) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update category']);
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error updating category: ' . $e->getMessage()]);
    }
}

// ============================================
// DELETE Functions
// ============================================

function deleteCategory($id) {
    global $pdo;
    
    // Check if category has prompts
    $checkStmt = $pdo->prepare("SELECT COUNT(*) as count FROM prompts WHERE category_id = ?");
    $checkStmt->execute([$id]);
    $count = $checkStmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    if ($count > 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Cannot delete category with prompts. Please reassign or delete prompts first.']);
        return;
    }
    
    // Check if category has subcategories
    $subCheckStmt = $pdo->prepare("SELECT COUNT(*) as count FROM prompt_categories WHERE parent_id = ?");
    $subCheckStmt->execute([$id]);
    $subCount = $subCheckStmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    if ($subCount > 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Cannot delete category with subcategories. Please delete subcategories first.']);
        return;
    }
    
    $stmt = $pdo->prepare("DELETE FROM prompt_categories WHERE id = ?");
    
    if ($stmt->execute([$id])) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete category']);
    }
}
?>
