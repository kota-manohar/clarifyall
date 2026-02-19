<?php
// Email configuration for Hostinger SMTP
define('SMTP_HOST', 'smtp.hostinger.com');
define('SMTP_PORT', 465);
define('SMTP_USERNAME', 'support@clarifyall.com');
define('SMTP_PASSWORD', 'Mounika@k28');
define('SMTP_FROM_EMAIL', 'support@clarifyall.com');
define('SMTP_FROM_NAME', 'Clarifyall Support');
define('SMTP_ENCRYPTION', 'ssl'); // Use 'ssl' for port 465

// Site configuration
define('SITE_URL', 'https://clarifyall.com');
define('SITE_NAME', 'Clarifyall');

/**
 * Send email using Hostinger SMTP
 */
function sendEmail($to, $subject, $htmlBody, $textBody = '') {
    // Check if PHPMailer exists before requiring it
    $phpmailerPath = __DIR__ . '/PHPMailer/PHPMailer.php';
    
    if (!file_exists($phpmailerPath)) {
        // PHPMailer not available, log and return error
        logError('PHPMailer not found at: ' . $phpmailerPath);
        return ['success' => false, 'error' => 'Email service not configured'];
    }
    
    try {
        require_once __DIR__ . '/PHPMailer/PHPMailer.php';
        require_once __DIR__ . '/PHPMailer/SMTP.php';
        require_once __DIR__ . '/PHPMailer/Exception.php';
        
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);
        
        // Server settings
        $mail->isSMTP();
        $mail->Host = SMTP_HOST;
        $mail->SMTPAuth = true;
        $mail->Username = SMTP_USERNAME;
        $mail->Password = SMTP_PASSWORD;
        $mail->SMTPSecure = SMTP_ENCRYPTION;
        $mail->Port = SMTP_PORT;
        
        // Recipients
        $mail->setFrom(SMTP_FROM_EMAIL, SMTP_FROM_NAME);
        $mail->addAddress($to);
        $mail->addReplyTo(SMTP_FROM_EMAIL, SMTP_FROM_NAME);
        
        // Content
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $htmlBody;
        $mail->AltBody = $textBody ?: strip_tags($htmlBody);
        
        $mail->send();
        return ['success' => true, 'message' => 'Email sent successfully'];
    } catch (Exception $e) {
        logError('Email send error: ' . $e->getMessage());
        $errorMsg = isset($mail) && is_object($mail) ? $mail->ErrorInfo : $e->getMessage();
        return ['success' => false, 'error' => 'Email could not be sent. Error: ' . $errorMsg];
    }
}

/**
 * Generate verification token
 */
function generateVerificationToken() {
    return bin2hex(random_bytes(32));
}

/**
 * Send verification email
 */
function sendVerificationEmail($email, $name, $token) {
    $verificationLink = SITE_URL . '/verify-email?token=' . $token;
    
    $subject = 'Verify Your Email - ' . SITE_NAME;
    
    $htmlBody = '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to ' . SITE_NAME . '!</h1>
            </div>
            <div class="content">
                <h2>Hi ' . htmlspecialchars($name) . ',</h2>
                <p>Thank you for registering with ' . SITE_NAME . '! We\'re excited to have you on board.</p>
                <p>To complete your registration and start exploring our AI tools directory, please verify your email address by clicking the button below:</p>
                <div style="text-align: center;">
                    <a href="' . $verificationLink . '" class="button">Verify Email Address</a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #667eea;">' . $verificationLink . '</p>
                <p><strong>This verification link will expire in 24 hours.</strong></p>
                <p>If you didn\'t create an account with ' . SITE_NAME . ', please ignore this email.</p>
                <p>Best regards,<br>The ' . SITE_NAME . ' Team</p>
            </div>
            <div class="footer">
                <p>&copy; ' . date('Y') . ' ' . SITE_NAME . '. All rights reserved.</p>
                <p>This is an automated email. Please do not reply to this message.</p>
            </div>
        </div>
    </body>
    </html>
    ';
    
    $textBody = "Hi $name,\n\n";
    $textBody .= "Thank you for registering with " . SITE_NAME . "!\n\n";
    $textBody .= "Please verify your email address by visiting this link:\n";
    $textBody .= $verificationLink . "\n\n";
    $textBody .= "This verification link will expire in 24 hours.\n\n";
    $textBody .= "If you didn't create an account, please ignore this email.\n\n";
    $textBody .= "Best regards,\nThe " . SITE_NAME . " Team";
    
    return sendEmail($email, $subject, $htmlBody, $textBody);
}

/**
 * Send welcome email after verification
 */
function sendWelcomeEmail($email, $name) {
    $subject = 'Welcome to ' . SITE_NAME . '!';
    
    $htmlBody = '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Email Verified!</h1>
            </div>
            <div class="content">
                <h2>Hi ' . htmlspecialchars($name) . ',</h2>
                <p>Your email has been successfully verified! You now have full access to all features of ' . SITE_NAME . '.</p>
                <h3>What you can do now:</h3>
                <ul>
                    <li>Browse our extensive directory of AI tools</li>
                    <li>Save your favorite tools for quick access</li>
                    <li>Submit new AI tools to our directory</li>
                    <li>Get personalized recommendations</li>
                </ul>
                <div style="text-align: center;">
                    <a href="' . SITE_URL . '" class="button">Start Exploring</a>
                </div>
                <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
                <p>Happy exploring!<br>The ' . SITE_NAME . ' Team</p>
            </div>
        </div>
    </body>
    </html>
    ';
    
    return sendEmail($email, $subject, $htmlBody);
}

/**
 * Send password reset email
 */
function sendPasswordResetEmail($email, $name, $token) {
    $resetLink = SITE_URL . '/reset-password?token=' . $token;
    
    $subject = 'Reset Your Password - ' . SITE_NAME;
    
    $htmlBody = '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Password Reset Request</h1>
            </div>
            <div class="content">
                <h2>Hi ' . htmlspecialchars($name) . ',</h2>
                <p>We received a request to reset your password for your ' . SITE_NAME . ' account.</p>
                <p>Click the button below to reset your password:</p>
                <div style="text-align: center;">
                    <a href="' . $resetLink . '" class="button">Reset Password</a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #667eea;">' . $resetLink . '</p>
                <div class="warning">
                    <strong>⚠️ Security Notice:</strong>
                    <ul>
                        <li>This link will expire in 1 hour</li>
                        <li>If you didn\'t request this reset, please ignore this email</li>
                        <li>Your password will remain unchanged</li>
                    </ul>
                </div>
                <p>Best regards,<br>The ' . SITE_NAME . ' Team</p>
            </div>
        </div>
    </body>
    </html>
    ';
    
    return sendEmail($email, $subject, $htmlBody);
}
?>
