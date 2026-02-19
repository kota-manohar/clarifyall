<?php
/**
 * Prompts API Endpoint
 * Returns paginated list of prompts with filtering and sorting
 * 
 * GET /allprompts.php
 * Query Parameters: page, limit, sort, order, category, type, difficulty, search
 */

// Initialize API with security, rate limiting, and database connection
require_once __DIR__ . '/api-init.php';

// Validate HTTP method
validateMethod(['GET', 'OPTIONS']);

// Sanitize and validate input parameters
$page = validateInt($_GET['page'] ?? 1, 1, 1000) ?: 1;
$limit = validateInt($_GET['limit'] ?? 12, 1, 100) ?: 12;
$sort = sanitizeInput($_GET['sort'] ?? 'created_at');
$order = strtoupper(sanitizeInput($_GET['order'] ?? 'desc')) === 'ASC' ? 'ASC' : 'DESC';
$category = isset($_GET['category']) ? validateInt($_GET['category'], 1) : null;
$type = sanitizeInput($_GET['type'] ?? null);
$difficulty = sanitizeInput($_GET['difficulty'] ?? null);
$search = sanitizeInput($_GET['search'] ?? null);

// Validate sort field (prevent SQL injection)
$allowedSortFields = ['created_at', 'updated_at', 'title', 'upvotes', 'downvotes', 'views'];
if (!in_array($sort, $allowedSortFields)) {
    $sort = 'created_at';
}

// Build query
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

// Filter by tool_id (tool name or ID)
if (isset($_GET['tool_id']) && !empty($_GET['tool_id'])) {
    // If tool_id is numeric, use it as ID, otherwise try to match by tool name
    if (is_numeric($_GET['tool_id'])) {
        $query .= " AND p.tool_id = ?";
        $params[] = (int)$_GET['tool_id'];
    } else {
        // Match by tool name - join with tools table
        $query .= " AND EXISTS (SELECT 1 FROM tools t WHERE t.id = p.tool_id AND LOWER(t.name) = LOWER(?))";
        $params[] = $_GET['tool_id'];
    }
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

if (isset($_GET['tool_id']) && !empty($_GET['tool_id'])) {
    if (is_numeric($_GET['tool_id'])) {
        $countQuery .= " AND p.tool_id = ?";
        $countParams[] = (int)$_GET['tool_id'];
    } else {
        $countQuery .= " AND EXISTS (SELECT 1 FROM tools t WHERE t.id = p.tool_id AND LOWER(t.name) = LOWER(?))";
        $countParams[] = $_GET['tool_id'];
    }
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
?>
