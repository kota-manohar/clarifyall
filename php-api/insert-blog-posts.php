<?php
// Script to insert sample blog posts
// Run this once via browser or command line: php insert-blog-posts.php

// Database configuration
$host = 'srv1148.hstgr.io';
$port = 3306;
$dbname = 'u530425252_kyc';
$username = 'u530425252_kyc';
$password = '&631^1HXVzqE';

try {
    // Use non-persistent connection to avoid hitting MySQL connection limit
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_PERSISTENT => false, // Non-persistent to avoid connection limit issues
        PDO::ATTR_TIMEOUT => 5
    ]);
    
    // Get first admin user or create a default author ID
    $stmt = $pdo->query("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1");
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$admin) {
        // Fallback to first user
        $stmt = $pdo->query("SELECT id FROM users LIMIT 1");
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    if (!$admin) {
        die("Error: No users found in database. Please create a user first.\n");
    }
    
    $authorId = $admin['id'];
    echo "Using author ID: $authorId\n";
    
    // Check if posts already exist
    $checkStmt = $pdo->query("SELECT COUNT(*) as count FROM blog_articles WHERE author_id = $authorId");
    $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existing['count'] > 0) {
        echo "Warning: There are already " . $existing['count'] . " blog posts by this author.\n";
        echo "Do you want to proceed? (This will insert duplicate posts)\n";
        echo "To skip this check, comment out the check in the script.\n";
    }
    
    // Read the SQL file
    $sqlFile = __DIR__ . '/../INSERT-SAMPLE-BLOG-POSTS.sql';
    if (!file_exists($sqlFile)) {
        die("Error: SQL file not found at: $sqlFile\n");
    }
    
    $sql = file_get_contents($sqlFile);
    
    // Replace author_id = 1 with actual author ID
    $sql = str_replace("author_id = 1", "author_id = $authorId", $sql);
    
    // Split by semicolons and execute each statement
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    $inserted = 0;
    foreach ($statements as $statement) {
        if (empty($statement) || strpos($statement, '--') === 0 || strpos(strtoupper($statement), 'INSERT') === false) {
            continue;
        }
        
        try {
            $pdo->exec($statement);
            $inserted++;
            echo "Inserted blog post: $inserted\n";
        } catch(PDOException $e) {
            echo "Error executing statement: " . $e->getMessage() . "\n";
            echo "Statement: " . substr($statement, 0, 100) . "...\n";
        }
    }
    
    echo "\nSuccessfully inserted $inserted blog posts!\n";
    
    // Close connection explicitly to free up MySQL connections
    $pdo = null;
    
} catch(PDOException $e) {
    die("Database error: " . $e->getMessage() . "\n");
} finally {
    // Ensure connection is closed even on error
    if (isset($pdo)) {
        $pdo = null;
    }
}
?>

