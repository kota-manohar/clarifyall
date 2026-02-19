<?php
/**
 * User Authentication Service
 * Handles user registration, login, profile management, email verification, and password reset
 * 
 * This file contains all user-related functions separated from admin functions
 */

// Include required dependencies
if (!defined('INCLUDED_FROM_USERS')) {
    require_once __DIR__ . '/../api-init.php';
}

// Register new user
function register($input) {
    global $pdo;
    
    // Ensure CORS headers are set before any output
    if (!headers_sent()) {
        header('Access-Control-Allow-Origin: *');
        header('Content-Type: application/json');
    }
    
    if (function_exists('logError')) {
        logError('register() function called', ['input_keys' => $input ? array_keys($input) : []]);
    }
    
    try {
        // Validation - check if input is valid
        if (!$input || !is_array($input)) {
            if (function_exists('logError')) {
                logError('register() failed: Invalid input', ['input' => $input]);
            }
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid request data']);
            return;
        }
        
        if (empty($input['email']) || empty($input['password']) || empty($input['name'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Email, password, and name are required']);
            return;
        }
        
        // Validate email format
        if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid email format']);
            return;
        }
        
        // Validate password length
        if (strlen($input['password']) < 6) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Password must be at least 6 characters long']);
            return;
        }
        
        // Check if user already exists
        try {
            if (function_exists('logError')) {
                logError('register() checking if user exists', ['email' => $input['email']]);
            }
            
            if (!isset($pdo)) {
                if (function_exists('logError')) {
                    logError('register() error: $pdo not set');
                }
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Database connection not available']);
                return;
            }
            
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$input['email']]);
            if ($stmt->fetch()) {
                if (function_exists('logError')) {
                    logError('register() failed: Email already exists', ['email' => $input['email']]);
                }
                http_response_code(409);
                echo json_encode(['success' => false, 'error' => 'Email already registered']);
                return;
            }
        } catch(PDOException $e) {
            if (function_exists('logError')) {
                logError('Error checking existing user: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            }
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Database error while checking user']);
            return;
        }
        
        // Hash password
        $passwordHash = password_hash($input['password'], PASSWORD_DEFAULT);
        
        // Check if verification columns exist, if not use NULL
        $verificationToken = null;
        $tokenExpiry = null;
        
        // Check if we can generate verification token (function exists)
        if (function_exists('generateVerificationToken')) {
            try {
                $verificationToken = generateVerificationToken();
                $tokenExpiry = date('Y-m-d H:i:s', strtotime('+24 hours'));
            } catch(Exception $e) {
                logError('Verification token generation failed: ' . $e->getMessage());
            }
        }
        
        // Try inserting with verification fields first
        try {
            $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, is_verified, role, verification_token, verification_token_expiry, created_at) VALUES (?, ?, ?, FALSE, 'USER', ?, ?, NOW())");
            $result = $stmt->execute([$input['name'], $input['email'], $passwordHash, $verificationToken, $tokenExpiry]);
        } catch(PDOException $e) {
            // If verification columns don't exist, try without them
            if (strpos($e->getMessage(), 'verification_token') !== false || 
                strpos($e->getMessage(), 'Unknown column') !== false) {
                logError('Verification columns not found, using simplified insert: ' . $e->getMessage());
                try {
                    $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, is_verified, role, created_at) VALUES (?, ?, ?, TRUE, 'USER', NOW())");
                    $result = $stmt->execute([$input['name'], $input['email'], $passwordHash]);
                    $verificationToken = null; // Set to null so we skip email sending
                } catch(PDOException $e2) {
                    logError('Error inserting user: ' . $e2->getMessage());
                    http_response_code(500);
                    echo json_encode([
                        'success' => false, 
                        'error' => 'Registration failed: ' . (defined('LOG_LEVEL') && LOG_LEVEL === 'DEBUG' ? $e2->getMessage() : 'Database error')
                    ]);
                    return;
                }
            } else {
                logError('Error inserting user: ' . $e->getMessage());
                http_response_code(500);
                echo json_encode([
                    'success' => false, 
                    'error' => 'Registration failed: ' . (defined('LOG_LEVEL') && LOG_LEVEL === 'DEBUG' ? $e->getMessage() : 'Database error')
                ]);
                return;
            }
        }
        
        if ($result) {
            $userId = $pdo->lastInsertId();
            
            // Get user data
            try {
                $stmt = $pdo->prepare("SELECT id, name, email, avatar_url, is_verified, role, created_at FROM users WHERE id = ?");
                $stmt->execute([$userId]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
            } catch(PDOException $e) {
                logError('Error fetching created user: ' . $e->getMessage());
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'User created but failed to retrieve user data']);
                return;
            }
            
            // Send verification email (only if token was generated)
            $emailSent = false;
            $emailError = null;
            
            if ($verificationToken && function_exists('sendVerificationEmail')) {
                try {
                    $emailResult = sendVerificationEmail($input['email'], $input['name'], $verificationToken);
                    $emailSent = $emailResult['success'] ?? false;
                    $emailError = $emailResult['error'] ?? null;
                } catch(Exception $e) {
                    logError('Error sending verification email: ' . $e->getMessage());
                    $emailSent = false;
                    $emailError = 'Email service unavailable';
                }
            }
            
            // Return success response
            $response = [
                'success' => true,
                'message' => $emailSent 
                    ? 'Registration successful! Please check your email to verify your account.'
                    : 'Registration successful! You can now log in.',
                'user' => $user,
                'email_sent' => $emailSent
            ];
            
            if ($emailError) {
                $response['email_error'] = $emailError;
            }
            
            // Clean output buffer before sending response
            if (ob_get_level() > 0) {
                ob_end_clean();
            }
            
            echo json_encode($response);
            exit; // Exit after sending response
        } else {
            // Clean output buffer
            if (ob_get_level() > 0) {
                ob_end_clean();
            }
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Registration failed - database insert returned false']);
            exit;
        }
    } catch(Exception $e) {
        // Clean output buffer
        if (ob_get_level() > 0) {
            ob_end_clean();
        }
        
        if (function_exists('logError')) {
            logError('Registration error: ' . $e->getMessage());
        }
        http_response_code(500);
        echo json_encode([
            'success' => false, 
            'error' => 'Registration failed: ' . (defined('LOG_LEVEL') && LOG_LEVEL === 'DEBUG' ? $e->getMessage() : 'Internal server error')
        ]);
        exit;
    }
}

// Login user
function login($input) {
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
    
    if (empty($input['email']) || empty($input['password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Email and password are required']);
        return;
    }
    
    // Find user - use specific columns to avoid conflicts with duplicate column names
    $stmt = $pdo->prepare("SELECT id, name, email, password_hash, is_verified, role, avatar_url, bio, created_at, updated_at FROM users WHERE email = ?");
    $stmt->execute([$input['email']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid email or password']);
        return;
    }
    
    // Verify password - check if password_hash exists and is not null
    if (empty($user['password_hash']) || !password_verify($input['password'], $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid email or password']);
        return;
    }
    
    // Check if email is verified - use is_verified column (snake_case)
    // Handle both boolean and integer representations (0/1, false/true)
    $isVerified = false;
    if (isset($user['is_verified'])) {
        // Check for various truthy values
        $isVerifiedValue = $user['is_verified'];
        if (is_bool($isVerifiedValue)) {
            $isVerified = $isVerifiedValue === true;
        } elseif (is_numeric($isVerifiedValue)) {
            $isVerified = (int)$isVerifiedValue === 1;
        } elseif (is_string($isVerifiedValue)) {
            $isVerified = in_array(strtolower($isVerifiedValue), ['1', 'true', 'yes', 'on']);
        }
    }
    
    // If email is not verified, block login
    if (!$isVerified) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => 'Please verify your email address before logging in. Check your email inbox for the verification link.',
            'email_not_verified' => true,
            'email' => $user['email']
        ]);
        return;
    }
        
    // Remove password hash and sensitive data from response
    unset($user['password_hash']);
    if (isset($user['verification_token'])) unset($user['verification_token']);
    if (isset($user['verification_token_expiry'])) unset($user['verification_token_expiry']);
    if (isset($user['reset_token'])) unset($user['reset_token']);
    if (isset($user['reset_token_expiry'])) unset($user['reset_token_expiry']);
    // Remove any camelCase variations if they exist (should not happen if DB schema is correct)
    if (isset($user['isVerified'])) unset($user['isVerified']);
    if (isset($user['createdAt'])) unset($user['createdAt']);
    if (isset($user['updatedAt'])) unset($user['updatedAt']);
    if (isset($user['password'])) unset($user['password']);
    
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
}

// Get user profile
function getUserProfile($userId) {
    global $pdo;
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'User ID is required']);
        return;
    }
    
    // Get user with bio field
    $stmt = $pdo->prepare("SELECT id, name, email, bio, avatar_url, is_verified, role, created_at, updated_at FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        echo json_encode(['success' => true, 'user' => $user]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'User not found']);
    }
}

// Update user profile
function updateProfile($input) {
    global $pdo;
    
    try {
        if (empty($input['user_id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'User ID is required']);
            return;
        }
        
        $updates = [];
        $params = [];
        
        if (isset($input['name'])) {
            $updates[] = "name = ?";
            $params[] = trim($input['name']);
        }
        
        if (isset($input['bio'])) {
            $updates[] = "bio = ?";
            $params[] = trim($input['bio']);
        }
        
        if (isset($input['avatar_url'])) {
            $updates[] = "avatar_url = ?";
            $params[] = $input['avatar_url'];
        }
        
        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No fields to update']);
            return;
        }
        
        $params[] = $input['user_id'];
        $sql = "UPDATE users SET " . implode(", ", $updates) . ", updated_at = NOW() WHERE id = ?";
        
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute($params);
        
        if ($result) {
            // Get updated user data (include bio if it exists)
            $stmt = $pdo->prepare("SELECT id, name, email, bio, avatar_url, is_verified, role, created_at, updated_at FROM users WHERE id = ?");
            $stmt->execute([$input['user_id']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'message' => 'Profile updated successfully',
                'user' => $user
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to update profile']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error updating profile: ' . $e->getMessage()]);
    }
}

// Upload avatar
function uploadAvatar($userId) {
    global $pdo;
    
    try {
        if (!$userId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'User ID is required']);
            return;
        }
        
        if (!isset($_FILES['avatar'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No avatar file uploaded']);
            return;
        }
        
        $file = $_FILES['avatar'];
        
        // Check for upload errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'File upload error: ' . $file['error']]);
            return;
        }
        
        // Validate file type
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($file['type'], $allowedTypes)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid file type. Only JPEG, PNG, GIF, WEBP are allowed.']);
            return;
        }
        
        // Validate file size (5MB max)
        $maxFileSize = 5 * 1024 * 1024; // 5 MB
        if ($file['size'] > $maxFileSize) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'File size exceeds 5MB limit.']);
            return;
        }
        
        // Create upload directory if it doesn't exist
        $uploadDir = __DIR__ . '/../../avatars/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        
        // Generate unique filename
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'avatar_' . $userId . '_' . time() . '.' . $extension;
        $filepath = $uploadDir . $filename;
        
        // Move uploaded file
        if (move_uploaded_file($file['tmp_name'], $filepath)) {
            // Generate URL
            $avatarUrl = 'https://clarifyall.com/avatars/' . $filename;
            
            // Update user's avatar_url in database
            $stmt = $pdo->prepare("UPDATE users SET avatar_url = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$avatarUrl, $userId]);
            
            // Get updated user data
            $stmt = $pdo->prepare("SELECT id, name, email, bio, avatar_url, is_verified, role, created_at, updated_at FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'message' => 'Avatar uploaded successfully',
                'avatarUrl' => $avatarUrl,
                'user' => $user
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to move uploaded file. Check directory permissions.']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error uploading avatar: ' . $e->getMessage()]);
    }
}

// Change password (user version)
function changePassword($input) {
    global $pdo;
    
    if (empty($input['user_id']) || empty($input['current_password']) || empty($input['new_password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'User ID, current password, and new password are required']);
        return;
    }
    
    // Validate new password length
    if (strlen($input['new_password']) < 6) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'New password must be at least 6 characters long']);
        return;
    }
    
    // Get current password hash
    $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
    $stmt->execute([$input['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'User not found']);
        return;
    }
    
    // Verify current password
    if (!password_verify($input['current_password'], $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Current password is incorrect']);
        return;
    }
    
    // Hash new password
    $newPasswordHash = password_hash($input['new_password'], PASSWORD_DEFAULT);
    
    // Update password
    $stmt = $pdo->prepare("UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?");
    $result = $stmt->execute([$newPasswordHash, $input['user_id']]);
    
    if ($result) {
        echo json_encode([
            'success' => true,
            'message' => 'Password changed successfully'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to change password']);
    }
}

// Get user's saved tools
function getUserSavedTools($userId) {
    global $pdo;
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'User ID is required']);
        return;
    }
    
    $stmt = $pdo->prepare("
        SELECT t.* 
        FROM tools t
        INNER JOIN user_saved_tools ust ON t.id = ust.tool_id
        WHERE ust.user_id = ?
        ORDER BY ust.created_at DESC
    ");
    $stmt->execute([$userId]);
    $tools = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'tools' => $tools
    ]);
}

// Save a tool
function saveTool($input) {
    global $pdo;
    
    if (empty($input['user_id']) || empty($input['tool_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'User ID and Tool ID are required']);
        return;
    }
    
    try {
        // Check if already saved
        $stmt = $pdo->prepare("SELECT id FROM user_saved_tools WHERE user_id = ? AND tool_id = ?");
        $stmt->execute([$input['user_id'], $input['tool_id']]);
        
        if ($stmt->fetch()) {
            echo json_encode([
                'success' => true,
                'message' => 'Tool already saved'
            ]);
            return;
        }
        
        // Save tool
        $stmt = $pdo->prepare("INSERT INTO user_saved_tools (user_id, tool_id, created_at) VALUES (?, ?, NOW())");
        $result = $stmt->execute([$input['user_id'], $input['tool_id']]);
        
        if ($result) {
            // Update save count
            $stmt = $pdo->prepare("UPDATE tools SET save_count = save_count + 1 WHERE id = ?");
            $stmt->execute([$input['tool_id']]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Tool saved successfully'
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to save tool']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    }
}

// Check if user has saved a tool
function checkSavedTool($userId, $toolId) {
    global $pdo;
    
    if (!$userId || !$toolId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'isSaved' => false, 'error' => 'User ID and Tool ID are required']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("SELECT id FROM user_saved_tools WHERE user_id = ? AND tool_id = ? LIMIT 1");
        $stmt->execute([$userId, $toolId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'isSaved' => $result !== false
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'isSaved' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    }
}

// Unsave a tool
function unsaveTool($input) {
    global $pdo;
    
    if (empty($input['user_id']) || empty($input['tool_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'User ID and Tool ID are required']);
        return;
    }
    
    try {
        // Remove saved tool
        $stmt = $pdo->prepare("DELETE FROM user_saved_tools WHERE user_id = ? AND tool_id = ?");
        $result = $stmt->execute([$input['user_id'], $input['tool_id']]);
        
        if ($result && $stmt->rowCount() > 0) {
            // Update save count
            $stmt = $pdo->prepare("UPDATE tools SET save_count = GREATEST(save_count - 1, 0) WHERE id = ?");
            $stmt->execute([$input['tool_id']]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Tool unsaved successfully'
            ]);
        } else {
            echo json_encode([
                'success' => true,
                'message' => 'Tool was not saved'
            ]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    }
}

// Verify email with token
function verifyEmail($token) {
    global $pdo;
    
    if (!$token) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Verification token is required']);
        return;
    }
    
    try {
        // Find user with this token
        $stmt = $pdo->prepare("SELECT * FROM users WHERE verification_token = ? AND verification_token_expiry > NOW()");
        $stmt->execute([$token]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Invalid or expired verification token'
            ]);
            return;
        }
        
        // Check if already verified - handle different data types
        $isAlreadyVerified = false;
        if (isset($user['is_verified'])) {
            $verifiedValue = $user['is_verified'];
            if (is_bool($verifiedValue)) {
                $isAlreadyVerified = $verifiedValue === true;
            } elseif (is_numeric($verifiedValue)) {
                $isAlreadyVerified = (int)$verifiedValue === 1;
            } elseif (is_string($verifiedValue)) {
                $isAlreadyVerified = in_array(strtolower($verifiedValue), ['1', 'true', 'yes', 'on']);
            }
        }
        
        if ($isAlreadyVerified) {
            echo json_encode([
                'success' => true,
                'message' => 'Email already verified',
                'already_verified' => true
            ]);
            return;
        }
        
        // Verify the user - set is_verified to TRUE (1)
        $stmt = $pdo->prepare("UPDATE users SET is_verified = 1, verification_token = NULL, verification_token_expiry = NULL, updated_at = NOW() WHERE id = ?");
        $result = $stmt->execute([$user['id']]);
        
        if ($result) {
            // Send welcome email
            if (function_exists('sendWelcomeEmail')) {
                sendWelcomeEmail($user['email'], $user['name']);
            }
            
            // Get updated user data
            $stmt = $pdo->prepare("SELECT id, name, email, avatar_url, is_verified, role, created_at FROM users WHERE id = ?");
            $stmt->execute([$user['id']]);
            $verifiedUser = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'message' => 'Email verified successfully! You can now log in.',
                'user' => $verifiedUser
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to verify email']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    }
}

// Resend verification email
function resendVerification($input) {
    global $pdo;
    
    if (empty($input['email'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Email is required']);
        return;
    }
    
    try {
        // Find user
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$input['email']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'User not found']);
            return;
        }
        
        // Check if already verified - handle different data types
        $isAlreadyVerified = false;
        if (isset($user['is_verified'])) {
            $verifiedValue = $user['is_verified'];
            if (is_bool($verifiedValue)) {
                $isAlreadyVerified = $verifiedValue === true;
            } elseif (is_numeric($verifiedValue)) {
                $isAlreadyVerified = (int)$verifiedValue === 1;
            } elseif (is_string($verifiedValue)) {
                $isAlreadyVerified = in_array(strtolower($verifiedValue), ['1', 'true', 'yes', 'on']);
            }
        }
        
        if ($isAlreadyVerified) {
            echo json_encode([
                'success' => true,
                'message' => 'Email already verified',
                'already_verified' => true
            ]);
            return;
        }
        
        // Generate new verification token
        $verificationToken = generateVerificationToken();
        $tokenExpiry = date('Y-m-d H:i:s', strtotime('+24 hours'));
        
        // Update token
        $stmt = $pdo->prepare("UPDATE users SET verification_token = ?, verification_token_expiry = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$verificationToken, $tokenExpiry, $user['id']]);
        
        // Send verification email
        if (function_exists('sendVerificationEmail')) {
            $emailResult = sendVerificationEmail($user['email'], $user['name'], $verificationToken);
            
            if ($emailResult['success']) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Verification email sent! Please check your inbox.'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Failed to send verification email: ' . ($emailResult['error'] ?? 'Unknown error')
                ]);
            }
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Email service not available']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    }
}

// Forgot password - send reset email
function forgotPassword($input) {
    global $pdo;
    
    if (empty($input['email'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Email is required']);
        return;
    }
    
    try {
        // Find user
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$input['email']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Always return success to prevent email enumeration
        if (!$user) {
            echo json_encode([
                'success' => true,
                'message' => 'If an account exists with this email, a password reset link has been sent.'
            ]);
            return;
        }
        
        // Generate reset token
        $resetToken = generateVerificationToken();
        $tokenExpiry = date('Y-m-d H:i:s', strtotime('+1 hour'));
        
        // Update token
        $stmt = $pdo->prepare("UPDATE users SET reset_token = ?, reset_token_expiry = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$resetToken, $tokenExpiry, $user['id']]);
        
        // Send reset email
        if (function_exists('sendPasswordResetEmail')) {
            sendPasswordResetEmail($user['email'], $user['name'], $resetToken);
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'If an account exists with this email, a password reset link has been sent.'
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    }
}

// Reset password with token
function resetPassword($input) {
    global $pdo;
    
    if (empty($input['token']) || empty($input['new_password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Token and new password are required']);
        return;
    }
    
    // Validate new password length
    if (strlen($input['new_password']) < 6) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Password must be at least 6 characters long']);
        return;
    }
    
    try {
        // Find user with this token
        $stmt = $pdo->prepare("SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()");
        $stmt->execute([$input['token']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Invalid or expired reset token'
            ]);
            return;
        }
        
        // Hash new password
        $newPasswordHash = password_hash($input['new_password'], PASSWORD_DEFAULT);
        
        // Update password and clear reset token
        $stmt = $pdo->prepare("UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL, updated_at = NOW() WHERE id = ?");
        $result = $stmt->execute([$newPasswordHash, $user['id']]);
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Password reset successfully! You can now log in with your new password.'
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to reset password']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    }
}

?>

