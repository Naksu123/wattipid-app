<?php
/**
 * Wattipid Email Service
 * 
 * Production-grade email sending via third-party Email APIs.
 * Supports: SendGrid, Brevo (Sendinblue), and Mock mode for development.
 * 
 * All email sending goes through sendEmail() which dispatches to the configured provider.
 * OTP generation, hashing, validation, and rate limiting are handled here.
 */

require_once 'email_config.php';

// ============ CORE EMAIL DISPATCHER ============

/**
 * Send an email using the configured provider.
 * 
 * @param string $toEmail    Recipient email address
 * @param string $toName     Recipient name (can be empty)
 * @param string $subject    Email subject line
 * @param string $htmlBody   HTML content of the email
 * @param string $textBody   Plain text fallback (optional)
 * @return array             ['success' => bool, 'message' => string, 'provider' => string]
 */
function sendEmail($toEmail, $toName, $subject, $htmlBody, $textBody = '') {
    $provider = EMAIL_PROVIDER;

    switch ($provider) {
        case 'sendgrid':
            return sendViaSendGrid($toEmail, $toName, $subject, $htmlBody, $textBody);
        case 'brevo':
            return sendViaBrevo($toEmail, $toName, $subject, $htmlBody, $textBody);
        case 'mock':
            return sendViaMock($toEmail, $subject, $htmlBody);
        default:
            return ['success' => false, 'message' => "Unknown email provider: $provider"];
    }
}

// ============ SENDGRID PROVIDER ============

function sendViaSendGrid($toEmail, $toName, $subject, $htmlBody, $textBody) {
    $url = 'https://api.sendgrid.com/v3/mail/send';

    $payload = [
        'personalizations' => [
            [
                'to' => [['email' => $toEmail, 'name' => $toName ?: $toEmail]],
                'subject' => $subject
            ]
        ],
        'from' => [
            'email' => SENDER_EMAIL,
            'name' => SENDER_NAME
        ],
        'content' => []
    ];

    if ($textBody) {
        $payload['content'][] = ['type' => 'text/plain', 'value' => $textBody];
    }
    $payload['content'][] = ['type' => 'text/html', 'value' => $htmlBody];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . SENDGRID_API_KEY,
            'Content-Type: application/json'
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 15,
        CURLOPT_SSL_VERIFYPEER => false  // For XAMPP local dev
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        return ['success' => false, 'message' => "cURL error: $curlError", 'provider' => 'sendgrid'];
    }

    // SendGrid returns 202 for successful queuing
    if ($httpCode >= 200 && $httpCode < 300) {
        return ['success' => true, 'message' => 'Email sent via SendGrid', 'provider' => 'sendgrid'];
    }

    $errorData = json_decode($response, true);
    $errorMsg = $errorData['errors'][0]['message'] ?? "HTTP $httpCode";
    return ['success' => false, 'message' => "SendGrid error: $errorMsg", 'provider' => 'sendgrid'];
}

// ============ BREVO (SENDINBLUE) PROVIDER ============

function sendViaBrevo($toEmail, $toName, $subject, $htmlBody, $textBody) {
    $url = 'https://api.brevo.com/v3/smtp/email';

    $payload = [
        'sender' => [
            'name' => SENDER_NAME,
            'email' => SENDER_EMAIL
        ],
        'to' => [
            ['email' => $toEmail, 'name' => $toName ?: $toEmail]
        ],
        'subject' => $subject,
        'htmlContent' => $htmlBody
    ];

    if ($textBody) {
        $payload['textContent'] = $textBody;
    }

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'api-key: ' . BREVO_API_KEY,
            'Content-Type: application/json',
            'Accept: application/json'
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 15,
        CURLOPT_SSL_VERIFYPEER => false  // For XAMPP local dev
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        return ['success' => false, 'message' => "cURL error: $curlError", 'provider' => 'brevo'];
    }

    // Brevo returns 201 for successful sending
    if ($httpCode >= 200 && $httpCode < 300) {
        return ['success' => true, 'message' => 'Email sent via Brevo', 'provider' => 'brevo'];
    }

    $errorData = json_decode($response, true);
    $errorMsg = $errorData['message'] ?? "HTTP $httpCode";
    return ['success' => false, 'message' => "Brevo error: $errorMsg", 'provider' => 'brevo'];
}

// ============ MOCK PROVIDER (Development) ============

function sendViaMock($toEmail, $subject, $htmlBody) {
    // Log to file for development
    $logEntry = date('[Y-m-d H:i:s]') . " MOCK EMAIL to: $toEmail | Subject: $subject\n";
    file_put_contents(__DIR__ . '/email_debug.log', $logEntry, FILE_APPEND);

    return [
        'success' => true,
        'message' => "Mock email logged (not actually sent)",
        'provider' => 'mock'
    ];
}


// ============ OTP GENERATION ============

/**
 * Generate a cryptographically secure OTP code.
 * Uses random_int() for security instead of rand/mt_rand.
 */
function generateOTP() {
    $min = pow(10, OTP_LENGTH - 1);     // 100000 for 6 digits
    $max = pow(10, OTP_LENGTH) - 1;     // 999999 for 6 digits
    return (string) random_int($min, $max);
}

/**
 * Hash an OTP for secure database storage.
 * We use SHA-256 since OTPs are short-lived and rate-limited.
 */
function hashOTP($otp) {
    return hash('sha256', $otp);
}


// ============ OTP DATABASE OPERATIONS ============

/**
 * Store a new OTP in the database.
 * Invalidates any previous unused OTPs for the same email.
 * 
 * @param PDO    $conn    Database connection
 * @param string $email   Recipient email
 * @param string $otp     Raw OTP (will be hashed before storage)
 * @param string $type    'verification' or 'access_code'
 * @return bool
 */
function storeOTP($conn, $email, $otp, $type = 'verification') {
    // 1. Invalidate all previous unused OTPs for this email + type
    $stmt = $conn->prepare("UPDATE email_otps SET status = 'invalidated' WHERE email = ? AND type = ? AND status = 'pending'");
    $stmt->execute([$email, $type]);

    // 2. Store the new hashed OTP
    $hashedOtp = hashOTP($otp);
    $expiresAt = date('Y-m-d H:i:s', time() + (OTP_EXPIRY_MINUTES * 60));

    $stmt = $conn->prepare("INSERT INTO email_otps (email, otp_hash, type, expires_at) VALUES (?, ?, ?, ?)");
    return $stmt->execute([$email, $hashedOtp, $type, $expiresAt]);
}

/**
 * Validate an OTP against the database.
 * Handles expiration, attempt counting, and status updates.
 * 
 * @param PDO    $conn   Database connection
 * @param string $email  Email to verify against
 * @param string $otp    Raw OTP entered by user
 * @param string $type   'verification' or 'access_code'
 * @return array         ['success' => bool, 'message' => string, 'status' => string]
 */
function validateOTP($conn, $email, $otp, $type = 'verification') {
    // Find the most recent pending OTP for this email
    $stmt = $conn->prepare("SELECT * FROM email_otps WHERE email = ? AND type = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1");
    $stmt->execute([$email, $type]);
    $record = $stmt->fetch();

    if (!$record) {
        return ['success' => false, 'message' => 'No verification code found. Please request a new one.', 'status' => 'not_found'];
    }

    // Check expiry
    if (strtotime($record['expires_at']) < time()) {
        $stmt = $conn->prepare("UPDATE email_otps SET status = 'expired' WHERE id = ?");
        $stmt->execute([$record['id']]);
        return ['success' => false, 'message' => 'Verification code has expired. Please request a new one.', 'status' => 'expired'];
    }

    // Check attempt limit
    if ($record['attempts'] >= OTP_MAX_ATTEMPTS) {
        $stmt = $conn->prepare("UPDATE email_otps SET status = 'locked' WHERE id = ?");
        $stmt->execute([$record['id']]);
        return ['success' => false, 'message' => 'Too many failed attempts. Please request a new code.', 'status' => 'locked'];
    }

    // Verify the OTP hash
    if (hashOTP($otp) !== $record['otp_hash']) {
        // Increment attempt count
        $stmt = $conn->prepare("UPDATE email_otps SET attempts = attempts + 1 WHERE id = ?");
        $stmt->execute([$record['id']]);
        $remaining = OTP_MAX_ATTEMPTS - $record['attempts'] - 1;
        return ['success' => false, 'message' => "Incorrect code. $remaining attempts remaining.", 'status' => 'invalid'];
    }

    // Success! Mark as used
    $stmt = $conn->prepare("UPDATE email_otps SET status = 'used', verified_at = NOW() WHERE id = ?");
    $stmt->execute([$record['id']]);

    return ['success' => true, 'message' => 'Verification successful!', 'status' => 'valid'];
}


/**
 * Check rate limiting for OTP requests.
 * Prevents abuse by limiting OTPs per email per hour.
 * 
 * @param PDO    $conn   Database connection
 * @param string $email  Email address to check
 * @return array         ['allowed' => bool, 'message' => string, 'wait_seconds' => int]
 */
function checkOTPRateLimit($conn, $email) {
    // Check total OTPs sent in the last hour
    $stmt = $conn->prepare("SELECT COUNT(*) as cnt FROM email_otps WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)");
    $stmt->execute([$email]);
    $hourCount = $stmt->fetch()['cnt'];

    if ($hourCount >= OTP_RATE_LIMIT_PER_HOUR) {
        return ['allowed' => false, 'message' => 'Too many code requests. Please try again in 1 hour.', 'wait_seconds' => 3600];
    }

    // Check cooldown since last OTP
    $stmt = $conn->prepare("SELECT created_at FROM email_otps WHERE email = ? ORDER BY created_at DESC LIMIT 1");
    $stmt->execute([$email]);
    $lastOtp = $stmt->fetch();

    if ($lastOtp) {
        $elapsed = time() - strtotime($lastOtp['created_at']);
        if ($elapsed < OTP_RESEND_COOLDOWN_SECONDS) {
            $wait = OTP_RESEND_COOLDOWN_SECONDS - $elapsed;
            return ['allowed' => false, 'message' => "Please wait $wait seconds before requesting a new code.", 'wait_seconds' => $wait];
        }
    }

    return ['allowed' => true, 'message' => 'OK', 'wait_seconds' => 0];
}


// ============ EMAIL TEMPLATES ============

/**
 * Generate a beautiful HTML email template for OTP verification.
 */
function getOTPEmailTemplate($recipientName, $otpCode, $type = 'verification') {
    $title = $type === 'access_code' 
        ? 'Your Wattipid Access Code' 
        : 'Verify Your Email';
    
    $subtitle = $type === 'access_code'
        ? 'Your landlord has invited you to join Wattipid. Use the code below to complete your registration.'
        : 'Enter the code below to verify your email address and complete your registration.';

    $expiryText = OTP_EXPIRY_MINUTES . ' minutes';

    return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$title}</title>
</head>
<body style="margin:0; padding:0; background-color:#0a0f1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0f1a; padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background: linear-gradient(135deg, #111827, #1a2332); border-radius:16px; border:1px solid rgba(34,197,94,0.2); overflow:hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding:32px 32px 20px; text-align:center;">
                            <div style="display:inline-block; width:64px; height:64px; border-radius:50%; background: linear-gradient(135deg, #22c55e, #16a34a); line-height:64px; text-align:center;">
                                <span style="font-size:28px; color:white;">⚡</span>
                            </div>
                            <h1 style="color:#ffffff; font-size:22px; font-weight:700; margin:16px 0 8px;">
                                {$title}
                            </h1>
                            <p style="color:#9ca3af; font-size:14px; line-height:1.5; margin:0;">
                                {$subtitle}
                            </p>
                        </td>
                    </tr>
                    
                    <!-- OTP Code Box -->
                    <tr>
                        <td style="padding:0 32px;">
                            <div style="background: rgba(34,197,94,0.08); border:2px solid rgba(34,197,94,0.3); border-radius:12px; padding:24px; text-align:center;">
                                <p style="color:#9ca3af; font-size:12px; text-transform:uppercase; letter-spacing:2px; margin:0 0 8px;">
                                    Your Verification Code
                                </p>
                                <p style="color:#22c55e; font-size:36px; font-weight:700; letter-spacing:8px; margin:0; font-family:monospace;">
                                    {$otpCode}
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Expiry Warning -->
                    <tr>
                        <td style="padding:16px 32px;">
                            <div style="background:rgba(245,158,11,0.08); border-left:3px solid #f59e0b; border-radius:8px; padding:12px 16px;">
                                <p style="color:#f59e0b; font-size:13px; margin:0;">
                                    ⏱ This code expires in <strong>{$expiryText}</strong>. Do not share it with anyone.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding:20px 32px 32px; text-align:center; border-top:1px solid rgba(255,255,255,0.05);">
                            <p style="color:#6b7280; font-size:12px; line-height:1.5; margin:0;">
                                If you didn't request this code, please ignore this email.<br>
                                This is an automated message from Wattipid Energy Monitor.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;
}

/**
 * Generate a plain text version of the OTP email.
 */
function getOTPEmailPlainText($recipientName, $otpCode, $type = 'verification') {
    $title = $type === 'access_code' ? 'Wattipid Access Code' : 'Wattipid Email Verification';
    $expiry = OTP_EXPIRY_MINUTES;
    
    return <<<TEXT
{$title}

Hi {$recipientName},

Your verification code is: {$otpCode}

This code expires in {$expiry} minutes. Do not share it with anyone.

If you didn't request this code, please ignore this email.

— Wattipid Energy Monitor
TEXT;
}


// ============ HIGH-LEVEL SEND FUNCTIONS ============

/**
 * Send a verification OTP to a tenant during registration.
 * Handles rate limiting, OTP generation, storage, and email delivery.
 * 
 * @param PDO    $conn        Database connection
 * @param string $email       Tenant email
 * @param string $tenantName  Tenant name (for personalization)
 * @return array              ['success' => bool, 'message' => string, ...]
 */
function sendVerificationOTP($conn, $email, $tenantName = '') {
    // Rate limit check
    $rateCheck = checkOTPRateLimit($conn, $email);
    if (!$rateCheck['allowed']) {
        return ['success' => false, 'message' => $rateCheck['message'], 'wait_seconds' => $rateCheck['wait_seconds']];
    }

    // Generate and store OTP
    $otp = generateOTP();
    storeOTP($conn, $email, $otp, 'verification');

    // Build email
    $subject = 'Your Wattipid Verification Code: ' . $otp;
    $htmlBody = getOTPEmailTemplate($tenantName ?: $email, $otp, 'verification');
    $textBody = getOTPEmailPlainText($tenantName ?: $email, $otp, 'verification');

    // Send
    $result = sendEmail($email, $tenantName, $subject, $htmlBody, $textBody);

    // Log delivery status
    if ($result['success']) {
        logEmailDelivery($conn, $email, 'verification', 'sent', $result['provider']);
    } else {
        logEmailDelivery($conn, $email, 'verification', 'failed', $result['provider'] ?? 'unknown', $result['message']);
    }

    return $result;
}

/**
 * Send an access code email to a tenant (initiated by landlord).
 * 
 * @param PDO    $conn       Database connection
 * @param string $email      Tenant email
 * @param string $accessCode The room access code
 * @param string $roomId     Room identifier
 * @return array
 */
function sendAccessCodeEmail($conn, $email, $accessCode, $roomId) {
    $subject = 'Your Wattipid Room Access Code';
    $htmlBody = getOTPEmailTemplate($email, $accessCode, 'access_code');
    $textBody = getOTPEmailPlainText($email, $accessCode, 'access_code');

    $result = sendEmail($email, '', $subject, $htmlBody, $textBody);

    // Log delivery
    if ($result['success']) {
        logEmailDelivery($conn, $email, 'access_code', 'sent', $result['provider']);
    } else {
        logEmailDelivery($conn, $email, 'access_code', 'failed', $result['provider'] ?? 'unknown', $result['message']);
    }

    return $result;
}


// ============ EMAIL DELIVERY LOGGING ============

function logEmailDelivery($conn, $email, $type, $status, $provider, $errorMessage = null) {
    try {
        $stmt = $conn->prepare("INSERT INTO email_logs (email, type, status, provider, error_message) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$email, $type, $status, $provider, $errorMessage]);
    } catch (Exception $e) {
        // Silently fail logging — don't break the main flow
    }
}
