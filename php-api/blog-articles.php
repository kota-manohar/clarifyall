<?php
/**
 * Blog Articles API
 * Handles CRUD operations for blog articles
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
            getArticleById($segments[2]);
        } elseif (isset($segments[2]) && !is_numeric($segments[2])) {
            getArticleBySlug($segments[2]);
        } else {
            getArticles();
        }
        break;
    case 'POST':
        createArticle();
        break;
    case 'PUT':
        if (isset($segments[2]) && is_numeric($segments[2])) {
            updateArticle($segments[2]);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid article ID']);
        }
        break;
    case 'DELETE':
        if (isset($segments[2]) && is_numeric($segments[2])) {
            deleteArticle($segments[2]);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid article ID']);
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

function getArticles() {
    global $pdo;
    
    try {
        $category = isset($_GET['category']) ? $_GET['category'] : null;
        $status = isset($_GET['status']) ? $_GET['status'] : 'PUBLISHED';
        $search = isset($_GET['search']) ? $_GET['search'] : '';
        $featured = isset($_GET['featured']) ? (int)$_GET['featured'] : null;
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 12;
        $offset = ($page - 1) * $limit;
        
        $query = "SELECT ba.*, 
                  u.name as author_name, u.email as author_email
                  FROM blog_articles ba
                  LEFT JOIN users u ON ba.author_id = u.id
                  WHERE 1=1";
        
        $params = [];
        
        if ($status) {
            $query .= " AND ba.status = ?";
            $params[] = $status;
        }
        
        if ($category) {
            $query .= " AND ba.category = ?";
            $params[] = $category;
        }
        
        if ($search) {
            $query .= " AND (ba.title LIKE ? OR ba.excerpt LIKE ? OR ba.content LIKE ?)";
            $searchParam = '%' . $search . '%';
            $params[] = $searchParam;
            $params[] = $searchParam;
            $params[] = $searchParam;
        }
        
        if ($featured !== null) {
            $query .= " AND ba.is_featured = ?";
            $params[] = $featured;
        }
        
        $query .= " ORDER BY ba.published_at DESC, ba.created_at DESC";
        
        // Get total count
        $countQuery = str_replace("SELECT ba.*, u.name as author_name, u.email as author_email", "SELECT COUNT(*) as total", $query);
        $countStmt = $pdo->prepare($countQuery);
        $countStmt->execute($params);
        $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Add pagination
        $limit = max(1, $limit);
        $offset = max(0, $offset);
        $query .= " LIMIT $limit OFFSET $offset";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $articles = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Parse JSON fields
        foreach ($articles as &$article) {
            $article['tags'] = json_decode($article['tags'], true) ?: [];
            $article['related_tools'] = json_decode($article['related_tools'], true) ?: [];
            $article['ad_positions'] = json_decode($article['ad_positions'], true) ?: [];
        }
        
        echo json_encode([
            'articles' => $articles,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => (int)$total,
                'pages' => ceil($total / $limit)
            ]
        ]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function getArticleById($id) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            SELECT ba.*, 
                   u.name as author_name, u.email as author_email
            FROM blog_articles ba
            LEFT JOIN users u ON ba.author_id = u.id
            WHERE ba.id = ?
        ");
        $stmt->execute([$id]);
        $article = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($article) {
            // Increment view count for published articles
            if ($article['status'] === 'PUBLISHED') {
                $updateStmt = $pdo->prepare("UPDATE blog_articles SET view_count = view_count + 1 WHERE id = ?");
                $updateStmt->execute([$id]);
                $article['view_count'] = $article['view_count'] + 1;
            }
            
            $article['tags'] = json_decode($article['tags'], true) ?: [];
            $article['related_tools'] = json_decode($article['related_tools'], true) ?: [];
            $article['ad_positions'] = json_decode($article['ad_positions'], true) ?: [];
            
            echo json_encode($article);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Article not found']);
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function getArticleBySlug($slug) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            SELECT ba.*, 
                   u.name as author_name, u.email as author_email
            FROM blog_articles ba
            LEFT JOIN users u ON ba.author_id = u.id
            WHERE ba.slug = ? AND ba.status = 'PUBLISHED'
        ");
        $stmt->execute([$slug]);
        $article = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($article) {
            // Increment view count
            $updateStmt = $pdo->prepare("UPDATE blog_articles SET view_count = view_count + 1 WHERE id = ?");
            $updateStmt->execute([$article['id']]);
            $article['view_count'] = $article['view_count'] + 1;
            
            $article['tags'] = json_decode($article['tags'], true) ?: [];
            $article['related_tools'] = json_decode($article['related_tools'], true) ?: [];
            $article['ad_positions'] = json_decode($article['ad_positions'], true) ?: [];
            
            echo json_encode($article);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Article not found']);
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

// ============================================
// POST Functions
// ============================================

function createArticle() {
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
        if (empty($input['title']) || empty($input['content'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Title and content are required']);
            return;
        }
        
        // Generate slug from title if not provided
        $slug = isset($input['slug']) ? $input['slug'] : generateSlug($input['title']);
        
        // Calculate read time (average reading speed: 200 words per minute)
        $wordCount = str_word_count(strip_tags($input['content']));
        $readTime = max(1, ceil($wordCount / 200));
        
        $stmt = $pdo->prepare("
            INSERT INTO blog_articles (
                title, slug, excerpt, content, featured_image, author_id,
                category, tags, meta_title, meta_description, meta_keywords,
                status, published_at, read_time, is_featured, ad_positions, related_tools
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $result = $stmt->execute([
            $input['title'],
            $slug,
            $input['excerpt'] ?? '',
            $input['content'],
            $input['featured_image'] ?? null,
            $input['author_id'] ?? null,
            $input['category'] ?? 'general',
            json_encode($input['tags'] ?? []),
            $input['meta_title'] ?? $input['title'],
            $input['meta_description'] ?? $input['excerpt'] ?? '',
            $input['meta_keywords'] ?? '',
            $input['status'] ?? 'DRAFT',
            $input['status'] === 'PUBLISHED' ? ($input['published_at'] ?? date('Y-m-d H:i:s')) : null,
            $readTime,
            isset($input['is_featured']) ? (int)$input['is_featured'] : 0,
            json_encode($input['ad_positions'] ?? []),
            json_encode($input['related_tools'] ?? [])
        ]);
        
        if ($result) {
            $articleId = $pdo->lastInsertId();
            echo json_encode(['success' => true, 'id' => $articleId, 'slug' => $slug]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create article']);
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error creating article: ' . $e->getMessage()]);
    }
}

// ============================================
// PUT Functions
// ============================================

function updateArticle($id) {
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
        
        if (isset($input['title'])) {
            $fields[] = "title = ?";
            $params[] = $input['title'];
        }
        if (isset($input['slug'])) {
            $fields[] = "slug = ?";
            $params[] = $input['slug'];
        } elseif (isset($input['title'])) {
            // Auto-generate slug if title changed but slug not provided
            $fields[] = "slug = ?";
            $params[] = generateSlug($input['title']);
        }
        if (isset($input['excerpt'])) {
            $fields[] = "excerpt = ?";
            $params[] = $input['excerpt'];
        }
        if (isset($input['content'])) {
            $fields[] = "content = ?";
            $params[] = $input['content'];
            // Recalculate read time
            $wordCount = str_word_count(strip_tags($input['content']));
            $readTime = max(1, ceil($wordCount / 200));
            $fields[] = "read_time = ?";
            $params[] = $readTime;
        }
        if (isset($input['featured_image'])) {
            $fields[] = "featured_image = ?";
            $params[] = $input['featured_image'];
        }
        if (isset($input['category'])) {
            $fields[] = "category = ?";
            $params[] = $input['category'];
        }
        if (isset($input['tags'])) {
            $fields[] = "tags = ?";
            $params[] = json_encode($input['tags']);
        }
        if (isset($input['meta_title'])) {
            $fields[] = "meta_title = ?";
            $params[] = $input['meta_title'];
        }
        if (isset($input['meta_description'])) {
            $fields[] = "meta_description = ?";
            $params[] = $input['meta_description'];
        }
        if (isset($input['meta_keywords'])) {
            $fields[] = "meta_keywords = ?";
            $params[] = $input['meta_keywords'];
        }
        if (isset($input['status'])) {
            $fields[] = "status = ?";
            $params[] = $input['status'];
            
            // Set published_at when status changes to PUBLISHED
            if ($input['status'] === 'PUBLISHED') {
                $checkStmt = $pdo->prepare("SELECT published_at FROM blog_articles WHERE id = ?");
                $checkStmt->execute([$id]);
                $current = $checkStmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$current['published_at']) {
                    $fields[] = "published_at = NOW()";
                }
            }
        }
        if (isset($input['is_featured'])) {
            $fields[] = "is_featured = ?";
            $params[] = (int)$input['is_featured'];
        }
        if (isset($input['ad_positions'])) {
            $fields[] = "ad_positions = ?";
            $params[] = json_encode($input['ad_positions']);
        }
        if (isset($input['related_tools'])) {
            $fields[] = "related_tools = ?";
            $params[] = json_encode($input['related_tools']);
        }
        
        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            return;
        }
        
        $fields[] = "updated_at = NOW()";
        $params[] = $id;
        
        $query = "UPDATE blog_articles SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $pdo->prepare($query);
        
        if ($stmt->execute($params)) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update article']);
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error updating article: ' . $e->getMessage()]);
    }
}

// ============================================
// DELETE Functions
// ============================================

function deleteArticle($id) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("DELETE FROM blog_articles WHERE id = ?");
        
        if ($stmt->execute([$id])) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete article']);
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

// ============================================
// Helper Functions
// ============================================

function generateSlug($title) {
    // Convert to lowercase
    $slug = strtolower($title);
    // Replace spaces and special characters with hyphens
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
    // Remove leading/trailing hyphens
    $slug = trim($slug, '-');
    // Remove consecutive hyphens
    $slug = preg_replace('/-+/', '-', $slug);
    
    // Ensure uniqueness by appending timestamp if needed (can be improved)
    return $slug . '-' . time();
}
?>

