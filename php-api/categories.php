<?php
/**
 * Categories API
 * Handles CRUD operations for tool categories
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
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM categories ORDER BY name");
        $stmt->execute();
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($categories);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function getCategoryById($id) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM categories WHERE id = ?");
        $stmt->execute([$id]);
        $category = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($category) {
            echo json_encode($category);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Category not found']);
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
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
        
        // Generate slug from name if not provided
        $slug = isset($input['slug']) ? $input['slug'] : generateSlug($input['name']);
        
        // Check if category name already exists
        $checkNameStmt = $pdo->prepare("SELECT id FROM categories WHERE name = ?");
        $checkNameStmt->execute([$input['name']]);
        if ($checkNameStmt->fetch()) {
            http_response_code(400);
            echo json_encode(['error' => 'Category name already exists']);
            return;
        }
        
        // Check if slug already exists
        $checkSlugStmt = $pdo->prepare("SELECT id FROM categories WHERE slug = ?");
        $checkSlugStmt->execute([$slug]);
        if ($checkSlugStmt->fetch()) {
            // If slug exists, append a number to make it unique
            $counter = 1;
            $originalSlug = $slug;
            do {
                $slug = $originalSlug . '-' . $counter;
                // Prepare a new statement for each check
                $checkSlugStmt = $pdo->prepare("SELECT id FROM categories WHERE slug = ?");
                $checkSlugStmt->execute([$slug]);
                $exists = $checkSlugStmt->fetch();
                $counter++;
                // Safety limit to prevent infinite loop
                if ($counter > 1000) {
                    http_response_code(500);
                    echo json_encode(['error' => 'Unable to generate unique slug']);
                    return;
                }
            } while ($exists);
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO categories (name, slug, description, created_at)
            VALUES (?, ?, ?, NOW())
        ");
        
        $result = $stmt->execute([
            $input['name'],
            $slug,
            $input['description'] ?? ''
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
        error_log("PDOException in createCategory: " . $e->getMessage());
        echo json_encode(['error' => 'Database error: ' . $e->getMessage(), 'code' => $e->getCode()]);
    } catch(Exception $e) {
        http_response_code(500);
        error_log("Exception in createCategory: " . $e->getMessage());
        echo json_encode(['error' => 'Error creating category: ' . $e->getMessage(), 'code' => $e->getCode()]);
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
        if (isset($input['slug'])) {
            $fields[] = "slug = ?";
            $params[] = $input['slug'];
        }
        
        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            return;
        }
        
        // If name is being updated and slug is not provided, generate new slug
        if (isset($input['name']) && !isset($input['slug'])) {
            $fields[] = "slug = ?";
            $params[] = generateSlug($input['name']);
        }
        
        $params[] = $id;
        
        $query = "UPDATE categories SET " . implode(', ', $fields) . " WHERE id = ?";
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
    
    try {
        // Check if category has tools
        $checkStmt = $pdo->prepare("SELECT COUNT(*) as count FROM tools WHERE category_id = ?");
        $checkStmt->execute([$id]);
        $count = $checkStmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        if ($count > 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Cannot delete category with tools. Please reassign or delete tools first.']);
            return;
        }
        
        $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
        
        if ($stmt->execute([$id])) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete category']);
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error deleting category: ' . $e->getMessage()]);
    }
}

// ============================================
// Helper Functions
// ============================================

function generateSlug($name) {
    // Convert to lowercase
    $slug = strtolower($name);
    // Replace spaces and special characters with hyphens
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
    // Remove leading/trailing hyphens
    $slug = trim($slug, '-');
    // Remove consecutive hyphens
    $slug = preg_replace('/-+/', '-', $slug);
    return $slug;
}
?>