<?php
/**
 * Admin Service
 * Handles admin authentication, admin profile management, and admin user management
 * 
 * This file contains all admin-related functions separated from user functions
 */

// Include required dependencies
if (!defined('INCLUDED_FROM_USERS')) {
    require_once __DIR__ . '/../api-init.php';
}

/**
 * Admin Login
 */
function adminLogin($input) {
    global $pdo;
    
    // Ensure CORS headers are set before any output
    if (!headers_sent()) {
        header('Access-Control-Allow-Origin: *');
        header('Content-Type: application/json');
    }
    
    // Validation - check if input is valid
    if (!$input || !is_array($input)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid request data']);
        return;
    }
    
    if (!isset($input['email']) || !isset($input['password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Email and password are required']);
        return;
    }
    
    try {
        // Use specific columns to avoid conflicts with duplicate column names  
        $stmt = $pdo->prepare("SELECT id, name, email, password_hash, is_verified, role, avatar_url, bio, created_at, updated_at FROM users WHERE email = ? AND role = 'ADMIN'");
        $stmt->execute([$input['email']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Invalid email or password']);
            return;
        }
        
        // Check if password_hash exists and verify password
        if (empty($user['password_hash']) || !password_verify($input['password'], $user['password_hash'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Invalid email or password']);
            return;
        }
        
        // Remove sensitive data
        unset($user['password_hash']);
        if (isset($user['verification_token'])) unset($user['verification_token']);
        if (isset($user['reset_token'])) unset($user['reset_token']);
        // Remove any duplicate camelCase fields if they exist
        // Remove any camelCase variations if they exist (should not happen if DB schema is correct)
        if (isset($user['isVerified'])) unset($user['isVerified']);
        if (isset($user['createdAt'])) unset($user['createdAt']);
        if (isset($user['updatedAt'])) unset($user['updatedAt']);
        if (isset($user['password'])) unset($user['password']); // Remove plain password if exists
        
        // Clean output buffer before sending response
        if (ob_get_level() > 0) {
            ob_end_clean();
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Login successful',
            'user' => $user
        ]);
        exit; // Exit after sending response
    } catch(Exception $e) {
        // Clean output buffer
        if (ob_get_level() > 0) {
            ob_end_clean();
        }
        
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
        exit;
    }
}

/**
 * Get Admin Profile
 */
function getAdminProfile() {
    global $pdo;
    
    // Get admin user from token or session (simplified - should use proper auth)
    $adminId = $_GET['user_id'] ?? null;
    
    if (!$adminId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'User ID is required']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("SELECT id, name, email, avatar_url, role, created_at, updated_at FROM users WHERE id = ? AND role = 'ADMIN'");
        $stmt->execute([$adminId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Admin user not found']);
            return;
        }
        
        echo json_encode([
            'success' => true,
            'user' => $user
        ]);
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * List Admin Users
 */
function listAdminUsers() {
    global $pdo;
    
    // Ensure CORS headers are set
    if (!headers_sent()) {
        header('Access-Control-Allow-Origin: *');
        header('Content-Type: application/json');
    }
    
    try {
        $stmt = $pdo->prepare("SELECT id, name, email, avatar_url, role, created_at, updated_at FROM users WHERE role = 'ADMIN' ORDER BY created_at DESC");
        $stmt->execute();
        $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'admins' => $admins
        ]);
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Create Admin User
 */
function createAdminUser($input) {
    global $pdo;
    
    // Ensure CORS headers are set
    if (!headers_sent()) {
        header('Access-Control-Allow-Origin: *');
        header('Content-Type: application/json');
    }
    
    // Validation - check if input is valid
    if (!$input || !is_array($input)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid request data']);
        return;
    }
    
    if (!isset($input['name']) || !isset($input['email']) || !isset($input['password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Name, email, and password are required']);
        return;
    }
    
    // Validate email
    if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid email address']);
        return;
    }
    
    // Validate password length
    if (strlen($input['password']) < 6) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Password must be at least 6 characters']);
        return;
    }
    
    try {
        // Check if email already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$input['email']]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Email already exists']);
            return;
        }
        
        // Hash password
        $passwordHash = password_hash($input['password'], PASSWORD_DEFAULT);
        
        // Insert admin user
        $stmt = $pdo->prepare("
            INSERT INTO users (name, email, password_hash, role, is_verified, created_at) 
            VALUES (?, ?, ?, 'ADMIN', TRUE, NOW())
        ");
        $stmt->execute([
            $input['name'],
            $input['email'],
            $passwordHash
        ]);
        
        $userId = $pdo->lastInsertId();
        
        // Get created user
        $stmt = $pdo->prepare("SELECT id, name, email, avatar_url, role, created_at FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'message' => 'Admin user created successfully',
            'user' => $user
        ]);
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Update Admin User
 */
function updateAdminUser($input) {
    global $pdo;
    
    // Ensure CORS headers are set
    if (!headers_sent()) {
        header('Access-Control-Allow-Origin: *');
        header('Content-Type: application/json');
    }
    
    // Validation - check if input is valid
    if (!$input || !is_array($input)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid request data']);
        return;
    }
    
    if (!isset($input['user_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'User ID is required']);
        return;
    }
    
    $userId = $input['user_id'];
    
    // Check if user exists and is admin
    try {
        $stmt = $pdo->prepare("SELECT id, role FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Admin user not found']);
            return;
        }
        
        if ($user['role'] !== 'ADMIN') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Only admin users can be updated']);
            return;
        }
        
        // Build update query dynamically based on provided fields
        $updates = [];
        $params = [];
        
        if (isset($input['name'])) {
            $updates[] = "name = ?";
            $params[] = trim($input['name']);
        }
        
        if (isset($input['email'])) {
            // Validate email format
            if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid email address']);
                return;
            }
            
            // Check if email already exists for another user
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
            $stmt->execute([$input['email'], $userId]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Email already exists']);
                return;
            }
            
            $updates[] = "email = ?";
            $params[] = trim($input['email']);
        }
        
        if (isset($input['password']) && !empty($input['password'])) {
            // Validate password length
            if (strlen($input['password']) < 6) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Password must be at least 6 characters']);
                return;
            }
            
            // Hash new password
            $passwordHash = password_hash($input['password'], PASSWORD_DEFAULT);
            $updates[] = "password_hash = ?";
            $params[] = $passwordHash;
        }
        
        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No fields to update']);
            return;
        }
        
        // Add updated_at and user_id for WHERE clause
        $updates[] = "updated_at = NOW()";
        $params[] = $userId;
        
        // Build and execute update query
        $sql = "UPDATE users SET " . implode(", ", $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute($params);
        
        if ($result) {
            // Get updated user data
            $stmt = $pdo->prepare("SELECT id, name, email, avatar_url, role, created_at, updated_at FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $updatedUser = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'message' => 'Admin user updated successfully',
                'user' => $updatedUser
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to update admin user']);
        }
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Change Password (Admin version)
 */
function changeAdminPassword($input) {
    global $pdo;
    
    if (!isset($input['currentPassword']) || !isset($input['newPassword'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Current password and new password are required']);
        return;
    }
    
    if (strlen($input['newPassword']) < 6) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'New password must be at least 6 characters']);
        return;
    }
    
    // Get user ID from input or query
    $userId = $input['user_id'] ?? $_GET['user_id'] ?? null;
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'User ID is required']);
        return;
    }
    
    try {
        // Get current password hash
        $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = ? AND role = 'ADMIN'");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Admin user not found']);
            return;
        }
        
        // Verify current password
        if (!password_verify($input['currentPassword'], $user['password_hash'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Current password is incorrect']);
            return;
        }
        
        // Hash new password
        $newPasswordHash = password_hash($input['newPassword'], PASSWORD_DEFAULT);
        
        // Update password
        $stmt = $pdo->prepare("UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$newPasswordHash, $userId]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Password changed successfully'
        ]);
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Delete Admin User
 */
function deleteAdminUser($userId) {
    global $pdo;
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'User ID is required']);
        return;
    }
    
    try {
        // Check if user exists and is admin
        $stmt = $pdo->prepare("SELECT id, role FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'User not found']);
            return;
        }
        
        if ($user['role'] !== 'ADMIN') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Only admin users can be deleted']);
            return;
        }
        
        // Delete user
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ? AND role = 'ADMIN'");
        $stmt->execute([$userId]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Admin user deleted successfully'
        ]);
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    }
}

?>

