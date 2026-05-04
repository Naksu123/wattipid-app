<?php
require 'db.php';
require_once 'email_service.php';

// Set response header to JSON
header('Content-Type: application/json');

// Global error handler to ensure JSON response on PHP errors
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    echo json_encode([
        "success" => false,
        "message" => "PHP Error: $errstr in $errfile on line $errline",
        "error_type" => "php_error"
    ]);
    exit;
});

set_exception_handler(function($exception) {
    echo json_encode([
        "success" => false,
        "message" => "PHP Exception: " . $exception->getMessage(),
        "error_type" => "php_exception"
    ]);
    exit;
});

// --- PRODUCTION CONFIG ---
define('DEBUG_MODE', false);
define('SECRET_KEY', 'wattipid_secure_key_2026'); // CHANGE THIS IN PRODUCTION!

// Get POST data
$json = file_get_contents('php://input');
$data = json_decode($json, true);
$action = $data['action'] ?? '';

// Debug log (Only in debug mode)
if (DEBUG_MODE) {
    file_put_contents('debug_api.log', date('[Y-m-d H:i:s] ') . "Action: $action | Data: " . $json . "\n", FILE_APPEND);
}

function sendResponse($success, $message, $data = null, $httpCode = 200) {
    http_response_code($httpCode);
    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ]);
    exit;
}

$response = ["success" => false, "message" => "Invalid action"];

function generateToken($user) {
    $header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload = base64_encode(json_encode([
        'id' => $user['id'],
        'email' => $user['email'],
        'role' => $user['role'],
        'room_id' => $user['room_id'] ?? null,
        'exp' => time() + (86400 * 30) // 30 days
    ]));
    $signature = base64_encode(hash_hmac('sha256', "$header.$payload", SECRET_KEY, true));
    return "$header.$payload.$signature";
}

function verifyToken($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;
    list($header, $payload, $signature) = $parts;
    $validSig = base64_encode(hash_hmac('sha256', "$header.$payload", SECRET_KEY, true));
    if ($signature !== $validSig) return false;
    
    $data = json_decode(base64_decode($payload), true);
    if ($data['exp'] < time()) return false;
    return $data;
}

if (isset($data['action'])) {
    $action = $data['action'];

    // --- TOKEN SECURITY CHECK ---
    $publicActions = ['login', 'register', 'logConsumption', 'getSetting', 'getTenantInvitationByEmail', 'getRoomByTenantCode', 'sendVerificationCode', 'verifyOTP', 'resendVerificationCode'];
    $authenticatedUser = null;

    if (!in_array($action, $publicActions)) {
        // Fallback for getallheaders() which might be missing in some environments
        if (!function_exists('getallheaders')) {
            function getallheaders() {
                $headers = [];
                foreach ($_SERVER as $name => $value) {
                    if (substr($name, 0, 5) == 'HTTP_') {
                        $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
                    }
                }
                return $headers;
            }
        }

        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        $token = str_replace('Bearer ', '', $authHeader);
        
        $authenticatedUser = verifyToken($token);
        if (!$authenticatedUser) {
            sendResponse(false, "Unauthorized access. Please log in again.", null, 401);
        }
    }

    // --- AUTO-MIGRATION (Self-Healing) ---
    try {
        $conn->exec("ALTER TABLE budget_settings ADD COLUMN weekly_allowance DECIMAL(10, 2) DEFAULT 0 AFTER daily_allowance");
    } catch (Exception $e) {}

    try {
        $conn->exec("ALTER TABLE consumption_logs ADD COLUMN tenant_name VARCHAR(255) DEFAULT NULL AFTER room_id");
        // Backfill existing logs for currently occupied rooms
        $conn->exec("UPDATE consumption_logs cl JOIN rooms r ON cl.room_id = r.room_id SET cl.tenant_name = r.tenant_name WHERE cl.tenant_name IS NULL AND r.tenant_name IS NOT NULL");
    } catch (Exception $e) {}

    try {
        $conn->exec("ALTER TABLE rooms ADD COLUMN last_seen TIMESTAMP NULL DEFAULT NULL AFTER status");
    } catch (Exception $e) {}

    try {
        $conn->exec("CREATE TABLE IF NOT EXISTS settings (
            setting_key VARCHAR(255) PRIMARY KEY,
            setting_value VARCHAR(255)
        )");
        $conn->exec("INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('rate_per_kwh', '12.50')");
    } catch (Exception $e) {}

    try {
        $conn->exec("CREATE TABLE IF NOT EXISTS monthly_archives (
            id INT AUTO_INCREMENT PRIMARY KEY,
            room_id VARCHAR(50),
            tenant_name VARCHAR(255),
            month_year VARCHAR(7),
            total_energy DECIMAL(15,4),
            total_cost DECIMAL(15,2),
            archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");
    } catch (Exception $e) {}

    try {
        $conn->exec("CREATE TABLE IF NOT EXISTS invitations (
            email VARCHAR(255) PRIMARY KEY,
            room_id VARCHAR(50),
            tenant_code VARCHAR(10),
            status ENUM('pending', 'used') DEFAULT 'pending',
            expires_at TIMESTAMP NULL DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");
        // Add column if it doesn't exist for existing tables
        $conn->exec("ALTER TABLE invitations ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP NULL DEFAULT NULL AFTER status");
    } catch (Exception $e) {}

    // Email OTPs table for verification codes
    try {
        $conn->exec("CREATE TABLE IF NOT EXISTS email_otps (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            otp_hash VARCHAR(64) NOT NULL,
            type ENUM('verification', 'access_code') DEFAULT 'verification',
            status ENUM('pending', 'used', 'expired', 'invalidated', 'locked') DEFAULT 'pending',
            attempts INT DEFAULT 0,
            expires_at TIMESTAMP NOT NULL,
            verified_at TIMESTAMP NULL DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_email_type (email, type),
            INDEX idx_status (status)
        )");
    } catch (Exception $e) {}

    // Email delivery logs
    try {
        $conn->exec("CREATE TABLE IF NOT EXISTS email_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            type VARCHAR(50) NOT NULL,
            status VARCHAR(20) NOT NULL,
            provider VARCHAR(50),
            error_message TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_email (email)
        )");
    } catch (Exception $e) {}

    function checkMonthlyReset($conn) {
        $currentMonth = date('Y-m');
        
        $stmt = $conn->prepare("SELECT setting_value FROM settings WHERE setting_key = 'last_archive_month'");
        $stmt->execute();
        $lastReset = $stmt->fetchColumn();

        if ($lastReset !== $currentMonth) {
            if (!$lastReset) {
                // First time setup
                $stmt = $conn->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('last_archive_month', ?)");
                $stmt->execute([$currentMonth]);
                return;
            }

            // A new month has started! Archive previous month totals
            $prevMonth = date('Y-m', strtotime('first day of last month'));
            
            $stmt = $conn->query("SELECT room_id, tenant_name FROM rooms WHERE status = 'occupied'");
            $rooms = $stmt->fetchAll();

            foreach ($rooms as $room) {
                $stmt = $conn->prepare("SELECT SUM(energy) as energy, SUM(cost) as cost FROM consumption_logs 
                                      WHERE room_id = ? AND DATE_FORMAT(timestamp, '%Y-%m') = ?");
                $stmt->execute([$room['room_id'], $prevMonth]);
                $totals = $stmt->fetch();

                if ($totals && $totals['energy'] > 0) {
                    $stmt = $conn->prepare("INSERT INTO monthly_archives (room_id, tenant_name, month_year, total_energy, total_cost) 
                                          VALUES (?, ?, ?, ?, ?)");
                    $stmt->execute([$room['room_id'], $room['tenant_name'], $prevMonth, $totals['energy'], $totals['cost']]);
                }
            }

            // Update setting
            $stmt = $conn->prepare("UPDATE settings SET setting_value = ? WHERE setting_key = 'last_archive_month'");
            $stmt->execute([$currentMonth]);
        }
    }

    checkMonthlyReset($conn);

    try {
        $conn->exec("ALTER TABLE users ADD COLUMN push_token VARCHAR(255) DEFAULT NULL");
    } catch (Exception $e) {}

    // --- AUTO-REVERT EXPIRED ON_PROCESS ROOMS ---
    try {
        $conn->exec("UPDATE rooms r 
                     LEFT JOIN invitations i ON r.room_id = i.room_id AND i.status = 'pending' AND i.expires_at > NOW()
                     SET r.status = 'vacant' 
                     WHERE r.status = 'on_process' AND i.email IS NULL");
    } catch (Exception $e) {}

    try {
        switch ($action) {
            // ============ AUTHENTICATION ============
            case 'updatePushToken':
                if (!$authenticatedUser) break;
                $stmt = $conn->prepare("UPDATE users SET push_token = ? WHERE id = ?");
                $stmt->execute([$data['pushToken'], $authenticatedUser['id']]);
                $response['success'] = true;
                break;

            case 'login':
                $stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
                $stmt->execute([$data['email']]);
                $user = $stmt->fetch();
                if ($user && password_verify($data['password'], $user['password_hash'])) {
                    unset($user['password_hash']);
                    $response['success'] = true;
                    $response['data'] = $user;
                    $response['authToken'] = generateToken($user);
                } else {
                    $response['message'] = "Invalid email or password";
                }
                break;

            case 'register':
                $name = $data['name'];
                $email = $data['email'];
                $password = $data['password'];
                $role = $data['role'] ?? 'tenant';
                $code = $data['code'] ?? null;
                $passwordHash = password_hash($password, PASSWORD_DEFAULT);

                $roomId = null;

                // If tenant, verify the access code and get the room_id
                if ($role === 'tenant') {
                    if (!$code) {
                        $response['message'] = "Access code is required for tenants";
                        break;
                    }
                    
                    $stmt = $conn->prepare("SELECT room_id FROM invitations WHERE email = ? AND tenant_code = ? AND status = 'pending' AND (expires_at > NOW() OR expires_at IS NULL)");
                    $stmt->execute([$email, $code]);
                    $invitation = $stmt->fetch();

                    if (!$invitation) {
                        $response['message'] = "Invalid or expired access code for this email";
                        break;
                    }
                    $roomId = $invitation['room_id'];
                }

                // Create the user
                $stmt = $conn->prepare("INSERT INTO users (name, email, password_hash, role, room_id) VALUES (?, ?, ?, ?, ?)");
                if ($stmt->execute([$name, $email, $passwordHash, $role, $roomId])) {
                    $userId = $conn->lastInsertId();

                    if ($role === 'tenant' && $roomId) {
                        // 1. Update invitation status
                        $stmt = $conn->prepare("UPDATE invitations SET status = 'used' WHERE email = ? AND tenant_code = ?");
                        $stmt->execute([$email, $code]);

                        // 2. Update room status to occupied
                        $stmt = $conn->prepare("UPDATE rooms SET status = 'occupied', tenant_name = ?, tenant_start_date = CURDATE() WHERE room_id = ?");
                        $stmt->execute([$name, $roomId]);
                    }

                    $response['success'] = true;
                    $response['message'] = "Registered successfully";
                    
                    // If tenant, send verification email
                    if ($role === 'tenant') {
                        $emailResult = sendVerificationOTP($conn, $email, $name);
                        $response['needsVerification'] = true;
                        if (isset($emailResult['mockCode'])) {
                            $response['mockCode'] = $emailResult['mockCode'];
                        }
                        // Do not return authToken yet so they are forced to verify
                    } else {
                        // Automatically log in after registration
                        $stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
                        $stmt->execute([$userId]);
                        $user = $stmt->fetch();
                        unset($user['password_hash']);

                        $response['needsVerification'] = false;
                        $response['authToken'] = generateToken($user);
                        $response['data'] = $user;
                    }
                } else {
                    $response['message'] = "Registration failed. Email might already exist.";
                }
                break;

            case 'getUserByEmail':
                $stmt = $conn->prepare("SELECT id, name, email, role, room_id FROM users WHERE email = ?");
                $stmt->execute([$data['email']]);
                $response['data'] = $stmt->fetch();
                $response['success'] = true;
                break;

            case 'updateUserProfile':
                $stmt = $conn->prepare("UPDATE users SET name = ?, email = ? WHERE id = ?");
                $stmt->execute([$data['name'], $data['email'], $data['id']]);
                $response['success'] = true;
                break;

            // ============ ROOMS ============
            case 'getAllRooms':
                $stmt = $conn->prepare("SELECT * FROM rooms ORDER BY room_id ASC");
                $stmt->execute();
                $response['data'] = $stmt->fetchAll();
                $response['success'] = true;
                break;

            case 'getUserRooms':
                $stmt = $conn->prepare("SELECT r.*, u.id as user_id FROM rooms r LEFT JOIN users u ON r.room_id = u.room_id WHERE u.id = ? OR r.tenant_name = ?");
                $stmt->execute([$data['userId'] ?? 0, $data['userName'] ?? '']);
                $response['data'] = $stmt->fetchAll();
                $response['success'] = true;
                break;

            case 'getBuildingSummary':
                $currMonth = date('Y-m');
                $prevMonth = date('Y-m', strtotime('first day of last month'));
                
                // 1. Overall stats
                $stmt = $conn->query("SELECT 
                    COUNT(*) as totalRooms,
                    COALESCE(SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END), 0) as occupiedRooms,
                    COALESCE(SUM(CASE WHEN status = 'on_process' THEN 1 ELSE 0 END), 0) as onProcessRooms,
                    COALESCE(SUM(CASE WHEN last_seen < DATE_SUB(NOW(), INTERVAL 5 MINUTE) OR last_seen IS NULL THEN 1 ELSE 0 END), 0) as offlineMeters
                    FROM rooms");
                $stats = $stmt->fetch();

                // 2. Total consumption for the building (All rooms combined)
                $stmt = $conn->prepare("SELECT COALESCE(SUM(energy), 0) as totalEnergy, COALESCE(SUM(cost), 0) as totalCost FROM consumption_logs WHERE DATE_FORMAT(timestamp, '%Y-%m') = ?");
                $stmt->execute([$currMonth]);
                $totals = $stmt->fetch();

                // 3. Room details with their current and previous month totals
                $stmt = $conn->query("SELECT r.*, 
                    (SELECT COALESCE(SUM(energy), 0) FROM consumption_logs WHERE room_id = r.room_id AND DATE_FORMAT(timestamp, '%Y-%m') = '$currMonth') as currEnergy,
                    (SELECT COALESCE(SUM(energy), 0) FROM consumption_logs WHERE room_id = r.room_id AND DATE_FORMAT(timestamp, '%Y-%m') = '$prevMonth') as prevEnergy
                    FROM rooms r");
                $rooms = $stmt->fetchAll();

                sendResponse(true, "Summary retrieved", [
                    'stats' => $stats,
                    'totals' => $totals,
                    'rooms' => $rooms
                ]);
                break;

            case 'getRoomById':
                $stmt = $conn->prepare("SELECT * FROM rooms WHERE room_id = ?");
                $stmt->execute([$data['roomId']]);
                $response['data'] = $stmt->fetch();
                $response['success'] = true;
                break;

            case 'getRoomByTenantCode':
                $stmt = $conn->prepare("SELECT * FROM rooms WHERE tenant_code = ?");
                $stmt->execute([$data['code']]);
                $response['data'] = $stmt->fetch();
                $response['success'] = true;
                break;

            case 'updateRoomStatus':
                $stmt = $conn->prepare("UPDATE rooms SET status = ?, tenant_name = ?, tenant_start_date = ? WHERE room_id = ?");
                $stmt->execute([$data['status'], $data['tenantName'], $data['startDate'], $data['roomId']]);
                $response['success'] = true;
                $response['data'] = ["status" => $data['status']];
                break;

            case 'getVacantRooms':
                $stmt = $conn->prepare("SELECT * FROM rooms WHERE status = 'vacant'");
                $stmt->execute();
                $response['data'] = $fetchAll = $stmt->fetchAll();
                $response['success'] = true;
                break;

            case 'transferTenant':
                $fromRoom = $data['fromRoomId'];
                $toRoom = $data['toRoomId'];
                
                // 1. Get tenant details from current room
                $stmt = $conn->prepare("SELECT tenant_name, tenant_start_date, tenant_code FROM rooms WHERE room_id = ?");
                $stmt->execute([$fromRoom]);
                $tenant = $stmt->fetch();
                
                if ($tenant) {
                    // 2. Update new room
                    $stmt = $conn->prepare("UPDATE rooms SET tenant_name = ?, tenant_start_date = ?, status = 'occupied' WHERE room_id = ?");
                    $stmt->execute([$tenant['tenant_name'], $tenant['tenant_start_date'], $toRoom]);
                    
                    // 3. Clear old room
                    $stmt = $conn->prepare("UPDATE rooms SET tenant_name = NULL, tenant_start_date = NULL, status = 'vacant' WHERE room_id = ?");
                    $stmt->execute([$fromRoom]);
                    
                    $response['success'] = true;
                    $response['data'] = [
                        'tenantName' => $tenant['tenant_name'],
                        'fromRoomId' => $fromRoom,
                        'toRoomId' => $toRoom,
                        'newStartDate' => $tenant['tenant_start_date']
                    ];
                } else {
                    $response['message'] = "Source room not found";
                }
                break;

            case 'revokeTenant':
                $roomId = $data['roomId'];
                
                // 1. Get tenant details before deletion
                $stmt = $conn->prepare("SELECT tenant_name, tenant_start_date FROM rooms WHERE room_id = ?");
                $stmt->execute([$roomId]);
                $room = $stmt->fetch();
                $tenantName = $room ? $room['tenant_name'] : null;

                if ($tenantName) {
                    // 2. Find the user ID/Email
                    $stmt = $conn->prepare("SELECT id, email FROM users WHERE room_id = ? AND role = 'tenant'");
                    $stmt->execute([$roomId]);
                    $user = $stmt->fetch();

                    // 3. Archive for safety (Soft-Archive)
                    $stmt = $conn->prepare("INSERT INTO tenant_history (room_id, tenant_name, tenant_email, tenant_start_date, move_out_date, status) VALUES (?, ?, ?, ?, CURDATE(), 'moved_out')");
                    $stmt->execute([$roomId, $tenantName, $user['email'] ?? 'unknown', $room['tenant_start_date']]);

                    // 4. DELETE ALL DATA (Privacy Requirement)
                    // Delete User Account
                    if ($user) {
                        $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
                        $stmt->execute([$user['id']]);
                    }
                    
                    // Delete active/pending invitations
                    $stmt = $conn->prepare("DELETE FROM invitations WHERE room_id = ?");
                    $stmt->execute([$roomId]);

                    // Delete consumption logs for this specific tenant in this room
                    $stmt = $conn->prepare("DELETE FROM consumption_logs WHERE room_id = ? AND tenant_name = ?");
                    $stmt->execute([$roomId, $tenantName]);
                }
                
                // 5. Reset room status
                $stmt = $conn->prepare("UPDATE rooms SET tenant_name = NULL, tenant_start_date = NULL, status = 'vacant' WHERE room_id = ?");
                $stmt->execute([$roomId]);
                
                $response['success'] = true;
                $response['data'] = ['tenantName' => $tenantName];
                break;

            case 'generateNewTenantCode':
                $newCode = strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 8));
                $stmt = $conn->prepare("UPDATE rooms SET tenant_code = ? WHERE room_id = ?");
                $stmt->execute([$newCode, $data['roomId']]);
                $response['success'] = true;
                $response['data'] = $newCode;
                break;

            case 'saveTenantInvitation':
                $email = $data['email'];
                $roomId = $data['roomId'];
                $tenantCode = $data['tenantCode'];
                $stmt = $conn->prepare("INSERT INTO invitations (email, room_id, tenant_code, status, expires_at) VALUES (?, ?, ?, 'pending', DATE_ADD(NOW(), INTERVAL 5 MINUTE)) 
                                        ON DUPLICATE KEY UPDATE room_id = ?, tenant_code = ?, status = 'pending', expires_at = DATE_ADD(NOW(), INTERVAL 5 MINUTE)");
                $stmt->execute([$email, $roomId, $tenantCode, $roomId, $tenantCode]);

                // Send real email with the access code
                $emailResult = sendAccessCodeEmail($conn, $email, $tenantCode, $roomId);

                if ($emailResult['success']) {
                    // Automatically mark room as 'on_process' to prevent duplicate invites
                    $stmt = $conn->prepare("UPDATE rooms SET status = 'on_process' WHERE room_id = ? AND status = 'vacant'");
                    $stmt->execute([$roomId]);

                    sendResponse(true, "Invitation saved. Email sent successfully.", [
                        'emailSent' => true,
                        'emailProvider' => $emailResult['provider'] ?? 'unknown'
                    ]);
                } else {
                    // Even if DB saved, if email fails we should let the frontend know
                    sendResponse(false, "Failed to send email: " . $emailResult['message']);
                }
                break;

            case 'getTenantInvitationByEmail':
                $email = $data['email'];
                $stmt = $conn->prepare("SELECT * FROM invitations WHERE email = ? AND status = 'pending'");
                $stmt->execute([$email]);
                $invitation = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($invitation) {
                    // Check expiry
                    if ($invitation['expires_at'] && strtotime($invitation['expires_at']) < time()) {
                        sendResponse(false, "Your access code has expired. Please ask your landlord to send you a new one.", ["expired" => true]);
                    }

                    // Resend the email so the tenant actually receives it right now
                    $emailResult = sendAccessCodeEmail($conn, $email, $invitation['tenant_code'], $invitation['room_id']);

                    if ($emailResult['success']) {
                        // Reset the expiration timer since we just sent a fresh email
                        $stmt = $conn->prepare("UPDATE invitations SET expires_at = DATE_ADD(NOW(), INTERVAL 5 MINUTE) WHERE email = ?");
                        $stmt->execute([$email]);
                        $invitation['expires_at'] = date('Y-m-d H:i:s', time() + 300);
                        
                        sendResponse(true, "Access code sent to your email", $invitation);
                    } else {
                        sendResponse(false, "Failed to send email: " . $emailResult['message']);
                    }
                } else {
                    sendResponse(false, "No access code found for this email. Please ask your landlord to send you one first.");
                }
                break;

            case 'getBudget':
                $month = $data['month'] ?? (int)date('m');
                $year = $data['year'] ?? (int)date('Y');
                $stmt = $conn->prepare("SELECT * FROM budget_settings WHERE room_id = ? AND month = ? AND year = ?");
                $stmt->execute([$data['roomId'], $month, $year]);
                $row = $stmt->fetch();
                if ($row) {
                    $daysInMonth = (int)date('t', strtotime("$year-$month-01"));
                    if (!isset($row['weekly_allowance']) || $row['weekly_allowance'] == 0) {
                        $row['weekly_allowance'] = $row['monthly_budget'] / ($daysInMonth / 7);
                    }
                    if (!isset($row['daily_allowance']) || $row['daily_allowance'] == 0) {
                        $row['daily_allowance'] = $row['monthly_budget'] / $daysInMonth;
                    }
                    $row['days_in_month'] = $daysInMonth;
                    // Remaining days in month
                    $today = (int)date('d');
                    $row['remaining_days'] = max(0, $daysInMonth - $today + 1);
                }
                $response['data'] = $row;
                $response['success'] = true;
                break;

            case 'setBudget':
            case 'updateBudget':
                $month = $data['month'] ?? (int)date('m');
                $year = $data['year'] ?? (int)date('Y');
                
                // Proportionally calculate allowances
                $daysInMonth = (int)date('t', strtotime("$year-$month-01"));
                $daily = $data['dailyAllowance'] ?? ($data['monthlyBudget'] / $daysInMonth);
                $weekly = $data['weeklyAllowance'] ?? ($data['monthlyBudget'] / ($daysInMonth / 7));
                
                $stmt = $conn->prepare("INSERT INTO budget_settings (room_id, monthly_budget, daily_allowance, weekly_allowance, month, year) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE monthly_budget = VALUES(monthly_budget), daily_allowance = VALUES(daily_allowance), weekly_allowance = VALUES(weekly_allowance)");
                $stmt->execute([$data['roomId'], $data['monthlyBudget'], $daily, $weekly, $month, $year]);
                
                $response['success'] = true;
                $response['data'] = [
                    "dailyAllowance" => $daily,
                    "weeklyAllowance" => $weekly,
                    "daysInMonth" => $daysInMonth
                ];
                break;

            case 'resetBudget':
                $stmt = $conn->prepare("DELETE FROM budget_settings WHERE room_id = ?");
                $stmt->execute([$data['roomId']]);
                $response['success'] = true;
                break;

            // ============ CONSUMPTION IOT ============
            case 'logConsumption':
                $roomId = $data['roomId'];
                $voltage = (float)($data['voltage'] ?? 0);
                $current = (float)($data['current'] ?? 0);
                $power = (float)($data['power'] ?? 0);
                $cumulativeEnergy = (float)($data['energy'] ?? 0);
                
                $stmt = $conn->prepare("SELECT energy_cumulative FROM consumption_logs WHERE room_id = ? ORDER BY timestamp DESC LIMIT 1");
                $stmt->execute([$roomId]);
                $lastRow = $stmt->fetch();
                $lastCumulative = $lastRow ? (float)$lastRow['energy_cumulative'] : 0;
                
                $energyDelta = ($cumulativeEnergy < $lastCumulative) ? $cumulativeEnergy : ($cumulativeEnergy - $lastCumulative);
                if ($energyDelta > 5) $energyDelta = 0; // Safety cap
                
                $rate = 12.5; 
                $stmt = $conn->prepare("SELECT setting_value FROM settings WHERE setting_key = 'rate_per_kwh' LIMIT 1");
                $stmt->execute();
                $row = $stmt->fetch();
                if ($row) $rate = (float)$row['setting_value'];
                
                $cost = $energyDelta * $rate;
                
                // --- FIND CURRENT TENANT ---
                $stmt = $conn->prepare("SELECT tenant_name FROM rooms WHERE room_id = ? LIMIT 1");
                $stmt->execute([$roomId]);
                $room = $stmt->fetch();
                $tenantName = $room ? $room['tenant_name'] : null;
                
                $stmt = $conn->prepare("UPDATE rooms SET last_seen = NOW() WHERE room_id = ?");
                $stmt->execute([$roomId]);

                $stmt = $conn->prepare("INSERT INTO consumption_logs (room_id, tenant_name, voltage, current_val, power, energy, energy_cumulative, cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$roomId, $tenantName, $voltage, $current, $power, $energyDelta, $cumulativeEnergy, $cost]);

                // ==========================================
                // --- TIPSENGINE INTELLIGENCE PIPELINE ---
                // ==========================================

                // 1. Get Rolling Average (last 10 readings)
                $stmt = $conn->prepare("SELECT AVG(power) as avg_p FROM (SELECT power FROM consumption_logs WHERE room_id = ? ORDER BY timestamp DESC LIMIT 10) as last_readings");
                $stmt->execute([$roomId]);
                $avgRow = $stmt->fetch();
                $avgPower = $avgRow ? (float)$avgRow['avg_p'] : $power;

                // 2. Get Trend (last 3 readings)
                $stmt = $conn->prepare("SELECT power FROM consumption_logs WHERE room_id = ? ORDER BY timestamp DESC LIMIT 3");
                $stmt->execute([$roomId]);
                $trendReadings = $stmt->fetchAll(PDO::FETCH_COLUMN);
                $isIncreasing = count($trendReadings) >= 3 && ($trendReadings[0] > $trendReadings[1]) && ($trendReadings[1] > $trendReadings[2]);

                // 3. Get Consumption Totals (Daily, Weekly, Monthly)
                $stmt = $conn->prepare("SELECT 
                    SUM(CASE WHEN DATE(timestamp) = CURDATE() THEN cost ELSE 0 END) as total_daily,
                    SUM(CASE WHEN timestamp >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) THEN cost ELSE 0 END) as total_weekly,
                    SUM(CASE WHEN DATE_FORMAT(timestamp, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m') THEN cost ELSE 0 END) as total_monthly
                    FROM consumption_logs WHERE room_id = ?");
                $stmt->execute([$roomId]);
                $totals = $stmt->fetch();
                $totalDaily = (float)$totals['total_daily'];
                $totalWeekly = (float)$totals['total_weekly'];
                $totalMonthly = (float)$totals['total_monthly'];

                // 4. Get Budget Settings
                $stmt = $conn->prepare("SELECT daily_allowance, weekly_allowance, monthly_budget FROM budget_settings WHERE room_id = ? LIMIT 1");
                $stmt->execute([$roomId]);
                $budget = $stmt->fetch();
                $dailyLimit = $budget ? (float)$budget['daily_allowance'] : 0;
                $weeklyLimit = $budget ? (float)$budget['weekly_allowance'] : 0;
                $monthlyLimit = $budget ? (float)$budget['monthly_budget'] : 0;

                // --- DECISION LAYER: TRIGGER RULES ---

                $alerts = [];

                // RULE: Confirmed Spike Alert
                if ($power > 100 && $power >= ($avgPower * 1.8) && $isIncreasing) {
                    $alerts[] = [
                        'type' => 'alert',
                        'title' => '⚡ TipsEngine: Electricity Spike',
                        'message' => "Confirmed power spike detected: " . number_format($power, 0) . "W usage."
                    ];
                }

                // RULE: Daily Budget
                if ($dailyLimit > 0) {
                    $pct = ($totalDaily / $dailyLimit) * 100;
                    if ($pct >= 100) {
                        $alerts[] = ['type' => 'danger', 'title' => '🚨 TipsEngine: Daily Limit Exceeded', 'message' => "Daily allowance of ₱" . number_format($dailyLimit, 2) . " consumed."];
                    } else if ($pct >= 85) {
                        $alerts[] = ['type' => 'warning', 'title' => '⚠️ TipsEngine: Daily Limit Warning', 'message' => "You've used " . number_format($pct, 0) . "% of your daily allowance."];
                    }
                }

                // RULE: Weekly Budget
                if ($weeklyLimit > 0) {
                    $pct = ($totalWeekly / $weeklyLimit) * 100;
                    if ($pct >= 100) {
                        $alerts[] = ['type' => 'danger', 'title' => '🚨 TipsEngine: Weekly Limit Exceeded', 'message' => "Weekly budget of ₱" . number_format($weeklyLimit, 2) . " consumed."];
                    } else if ($pct >= 85) {
                        $alerts[] = ['type' => 'warning', 'title' => '⚠️ TipsEngine: Weekly Limit Warning', 'message' => "You've used " . number_format($pct, 0) . "% of your weekly budget."];
                    }
                }

                // RULE: Monthly Budget
                if ($monthlyLimit > 0) {
                    $pct = ($totalMonthly / $monthlyLimit) * 100;
                    if ($pct >= 100) {
                        $alerts[] = ['type' => 'danger', 'title' => '🚨 TipsEngine: Monthly Budget Exceeded', 'message' => "Monthly budget of ₱" . number_format($monthlyLimit, 2) . " consumed."];
                    } else if ($pct >= 85) {
                        $alerts[] = ['type' => 'warning', 'title' => '⚠️ TipsEngine: Monthly Budget Warning', 'message' => "You've used " . number_format($pct, 0) . "% of your monthly budget."];
                    }
                }

                // --- ANTI-DUPLICATION & NOTIFICATION DELIVERY ---
                foreach ($alerts as $alert) {
                    // Check if same alert title was sent within last 30 minutes
                    $stmt = $conn->prepare("SELECT COUNT(*) FROM notifications WHERE room_id = ? AND title = ? AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)");
                    $stmt->execute([$roomId, $alert['title']]);
                    if ($stmt->fetchColumn() == 0) {
                        $stmt = $conn->prepare("INSERT INTO notifications (room_id, type, title, message) VALUES (?, ?, ?, ?)");
                        $stmt->execute([$roomId, $alert['type'], $alert['title'], $alert['message']]);
                    }
                }

                $response['success'] = true;
                $response['delta'] = $energyDelta;
                $response['monthly_cost'] = $totalMonthly;
                $response['daily_cost'] = $totalDaily;
                $response['weekly_cost'] = $totalWeekly;
                break;

            case 'getNotifications':
                $roomId = $data['roomId'] ?? null;
                $userId = $data['userId'] ?? null;
                $where = "WHERE 1=1";
                $params = [];
                if ($roomId) { $where .= " AND room_id = ?"; $params[] = $roomId; }
                if ($userId) { $where .= " AND user_id = ?"; $params[] = $userId; }
                $stmt = $conn->prepare("SELECT * FROM notifications $where ORDER BY created_at DESC LIMIT 20");
                $stmt->execute($params);
                $response['data'] = $stmt->fetchAll();
                $response['success'] = true;
                break;

            case 'markNotificationRead':
                $stmt = $conn->prepare("UPDATE notifications SET is_read = 1 WHERE id = ?");
                $stmt->execute([$data['id']]);
                $response['success'] = true;
                break;

            case 'getConsumptionHistory':
                $roomId = $data['roomId'];
                $period = $data['period'] ?? 'daily';
                $tenantName = $data['tenantName'] ?? null;
                $identifier = ($tenantName && $tenantName !== 'No tenant assigned') ? "tenant_name = ?" : "room_id = ?";
                $val = ($tenantName && $tenantName !== 'No tenant assigned') ? $tenantName : $roomId;

                if ($period === 'daily') {
                    $stmt = $conn->prepare("SELECT DATE_FORMAT(timestamp, '%H:00') as label, AVG(power) as avgPower, MAX(power) as peakPower, SUM(energy) as energy, SUM(cost) as cost FROM consumption_logs WHERE $identifier AND timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR) GROUP BY DATE_FORMAT(timestamp, '%H') ORDER BY timestamp ASC");
                } elseif ($period === 'weekly') {
                    $stmt = $conn->prepare("SELECT *, DATE_FORMAT(timestamp, '%w') as label, AVG(power) as avgPower, MAX(power) as peakPower, SUM(energy) as energy, SUM(cost) as cost FROM consumption_logs WHERE $identifier AND timestamp >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) AND DATE_FORMAT(timestamp, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m') GROUP BY DATE(timestamp) ORDER BY timestamp ASC");
                } else {
                    $stmt = $conn->prepare("SELECT *, DATE_FORMAT(timestamp, '%d') as label, AVG(power) as avgPower, MAX(power) as peakPower, SUM(energy) as energy, SUM(cost) as cost FROM consumption_logs WHERE $identifier AND timestamp >= DATE_SUB(CURDATE(), INTERVAL 29 DAY) GROUP BY DATE(timestamp) ORDER BY timestamp ASC");
                }
                $stmt->execute([$val]);
                $response['data'] = $stmt->fetchAll();
                $response['success'] = true;
                break;

            case 'getTotalConsumptionToday':
                $tenantName = $data['tenantName'] ?? null;
                $identifier = ($tenantName && $tenantName !== 'No tenant assigned') ? "tenant_name = ?" : "room_id = ?";
                $val = ($tenantName && $tenantName !== 'No tenant assigned') ? $tenantName : $data['roomId'];
                
                $stmt = $conn->prepare("SELECT COALESCE(SUM(energy), 0) as totalEnergy, COALESCE(SUM(cost), 0) as totalCost FROM consumption_logs WHERE $identifier AND DATE(timestamp) = CURDATE()");
                $stmt->execute([$val]);
                $response['data'] = $stmt->fetch();
                $response['success'] = true;
                break;

            case 'getTotalConsumptionWeek':
                $tenantName = $data['tenantName'] ?? null;
                $identifier = ($tenantName && $tenantName !== 'No tenant assigned') ? "tenant_name = ?" : "room_id = ?";
                $val = ($tenantName && $tenantName !== 'No tenant assigned') ? $tenantName : $data['roomId'];
                
                $stmt = $conn->prepare("SELECT COALESCE(SUM(energy), 0) as totalEnergy, COALESCE(SUM(cost), 0) as totalCost, COUNT(*) as entryCount FROM consumption_logs WHERE $identifier AND timestamp >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) AND DATE_FORMAT(timestamp, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')");
                $stmt->execute([$val]);
                $response['data'] = $stmt->fetch();
                $response['success'] = true;
                break;

            case 'getTotalConsumptionMonth':
                $tenantName = $data['tenantName'] ?? null;
                $identifier = ($tenantName && $tenantName !== 'No tenant assigned') ? "tenant_name = ?" : "room_id = ?";
                $val = ($tenantName && $tenantName !== 'No tenant assigned') ? $tenantName : $data['roomId'];

                $stmt = $conn->prepare("SELECT COALESCE(SUM(energy), 0) as totalEnergy, COALESCE(SUM(cost), 0) as totalCost FROM consumption_logs WHERE $identifier AND DATE_FORMAT(timestamp, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')");
                $stmt->execute([$val]);
                $response['data'] = $stmt->fetch();
                $response['success'] = true;
                break;

            case 'getMonthlyConsumptionFiltered':
                $roomId = $data['roomId'];
                $year = $data['year'];
                $month = $data['month'];
                $tenantName = $data['tenantName'] ?? null;
                
                // If we have a tenant name, track THEM instead of the room
                if ($tenantName && $tenantName !== 'No tenant assigned') {
                    $stmt = $conn->prepare("SELECT COALESCE(SUM(energy), 0) as totalEnergy, COALESCE(SUM(cost), 0) as totalCost, COUNT(*) as entryCount FROM consumption_logs WHERE tenant_name = ? AND YEAR(timestamp) = ? AND MONTH(timestamp) = ?");
                    $stmt->execute([$tenantName, $year, $month]);
                } else {
                    $stmt = $conn->prepare("SELECT COALESCE(SUM(energy), 0) as totalEnergy, COALESCE(SUM(cost), 0) as totalCost, COUNT(*) as entryCount FROM consumption_logs WHERE room_id = ? AND YEAR(timestamp) = ? AND MONTH(timestamp) = ?");
                    $stmt->execute([$roomId, $year, $month]);
                }
                $response['data'] = $stmt->fetch();
                $response['success'] = true;
                break;

            case 'getHourlyBreakdown':
                $tenantName = $data['tenantName'] ?? null;
                $identifier = ($tenantName && $tenantName !== 'No tenant assigned') ? "tenant_name = ?" : "room_id = ?";
                $val = ($tenantName && $tenantName !== 'No tenant assigned') ? $tenantName : $data['roomId'];

                $stmt = $conn->prepare("SELECT HOUR(timestamp) as hour, SUM(energy) as totalEnergy, AVG(power) as avgPower, SUM(cost) as totalCost FROM consumption_logs WHERE $identifier AND DATE(timestamp) = CURDATE() GROUP BY HOUR(timestamp) ORDER BY hour ASC");
                $stmt->execute([$val]);
                $response['data'] = $stmt->fetchAll();
                $response['success'] = true;
                break;

            case 'getDailyBreakdown':
                $tenantName = $data['tenantName'] ?? null;
                $identifier = ($tenantName && $tenantName !== 'No tenant assigned') ? "tenant_name = ?" : "room_id = ?";
                $val = ($tenantName && $tenantName !== 'No tenant assigned') ? $tenantName : $data['roomId'];

                $stmt = $conn->prepare("SELECT DATE(timestamp) as day, AVG(power) as avgPower, MAX(power) as peakPower, SUM(energy) as totalEnergy, SUM(cost) as totalCost, COUNT(*) as entries FROM consumption_logs WHERE $identifier AND YEAR(timestamp) = ? AND MONTH(timestamp) = ? GROUP BY DATE(timestamp) ORDER BY day DESC");
                $stmt->execute([$val, $data['year'], $data['month']]);
                $response['data'] = $stmt->fetchAll();
                $response['success'] = true;
                break;

            case 'getDailyBreakdownFiltered':
                $roomId = $data['roomId'];
                $year = $data['year'];
                $month = $data['month'];
                $tenantName = $data['tenantName'] ?? null;
                
                if ($tenantName && $tenantName !== 'No tenant assigned') {
                    $stmt = $conn->prepare("SELECT DATE(timestamp) as day, SUM(energy) as totalEnergy, SUM(cost) as totalCost, COUNT(*) as entries FROM consumption_logs WHERE tenant_name = ? AND YEAR(timestamp) = ? AND MONTH(timestamp) = ? GROUP BY DATE(timestamp) ORDER BY day DESC");
                    $stmt->execute([$tenantName, $year, $month]);
                } else {
                    $stmt = $conn->prepare("SELECT DATE(timestamp) as day, SUM(energy) as totalEnergy, SUM(cost) as totalCost, COUNT(*) as entries FROM consumption_logs WHERE room_id = ? AND YEAR(timestamp) = ? AND MONTH(timestamp) = ? GROUP BY DATE(timestamp) ORDER BY day DESC");
                    $stmt->execute([$roomId, $year, $month]);
                }
                $response['data'] = $stmt->fetchAll();
                $response['success'] = true;
                break;

            case 'getTransactionHistory':
                $limit = (int)($data['limit'] ?? 50);
                $roomId = $data['roomId'];
                $period = $data['period'] ?? 'all';
                $tenantName = $data['tenantName'] ?? null;
                $identifier = ($tenantName && $tenantName !== 'No tenant assigned') ? "tenant_name = ?" : "room_id = ?";
                $val = ($tenantName && $tenantName !== 'No tenant assigned') ? $tenantName : $roomId;

                $where = "WHERE $identifier";
                $params = [$val];
                if ($period === 'daily') $where .= " AND timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)";
                elseif ($period === 'weekly') $where .= " AND timestamp >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) AND DATE_FORMAT(timestamp, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')";
                elseif ($period === 'monthly') $where .= " AND timestamp >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)";
                $stmt = $conn->prepare("SELECT *, DATE_FORMAT(timestamp, '%Y-%m-%d') as date_label, DATE_FORMAT(timestamp, '%H:%i') as time_label FROM consumption_logs $where ORDER BY timestamp DESC LIMIT " . $limit);
                $stmt->execute($params);
                $response['data'] = $stmt->fetchAll();
                $response['success'] = true;
                break;

            case 'getConsumptionComparison':
                $roomId = $data['roomId'];
                $period = $data['period'] ?? 'weekly';
                $tenantName = $data['tenantName'] ?? null;
                $identifier = ($tenantName && $tenantName !== 'No tenant assigned') ? "tenant_name = ?" : "room_id = ?";
                $val = ($tenantName && $tenantName !== 'No tenant assigned') ? $tenantName : $roomId;

                if ($period === 'daily') {
                    // Today so far
                    $stmt = $conn->prepare("SELECT COALESCE(SUM(energy), 0) as totalEnergy, COALESCE(SUM(cost), 0) as totalCost FROM consumption_logs WHERE $identifier AND DATE(timestamp) = CURDATE()");
                    $stmt->execute([$val]);
                    $curr = $stmt->fetch();
                    // Yesterday same time range
                    $stmt = $conn->prepare("SELECT COALESCE(SUM(energy), 0) as totalEnergy, COALESCE(SUM(cost), 0) as totalCost FROM consumption_logs WHERE $identifier AND DATE(timestamp) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND TIME(timestamp) <= TIME(NOW())");
                    $stmt->execute([$val]);
                    $prev = $stmt->fetch();
                } elseif ($period === 'weekly') {
                    // Current Week
                    $stmt = $conn->prepare("SELECT COALESCE(SUM(energy), 0) as totalEnergy, COALESCE(SUM(cost), 0) as totalCost FROM consumption_logs WHERE $identifier AND timestamp >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)");
                    $stmt->execute([$val]);
                    $curr = $stmt->fetch();
                    // Previous Week (Same days)
                    $stmt = $conn->prepare("SELECT COALESCE(SUM(energy), 0) as totalEnergy, COALESCE(SUM(cost), 0) as totalCost FROM consumption_logs WHERE $identifier AND timestamp >= DATE_SUB(DATE_SUB(CURDATE(), INTERVAL 7 DAY), INTERVAL WEEKDAY(CURDATE()) DAY) AND timestamp < DATE_SUB(CURDATE(), INTERVAL 7 DAY)");
                    $stmt->execute([$val]);
                    $prev = $stmt->fetch();
                } else {
                    // Current Month (MTD)
                    $stmt = $conn->prepare("SELECT COALESCE(SUM(energy), 0) as totalEnergy, COALESCE(SUM(cost), 0) as totalCost FROM consumption_logs WHERE $identifier AND DATE_FORMAT(timestamp, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')");
                    $stmt->execute([$val]);
                    $curr = $stmt->fetch();
                    // Previous Month (Same days - MTD)
                    $stmt = $conn->prepare("SELECT COALESCE(SUM(energy), 0) as totalEnergy, COALESCE(SUM(cost), 0) as totalCost FROM consumption_logs WHERE $identifier AND DATE_FORMAT(timestamp, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m') AND DAY(timestamp) <= DAY(CURDATE())");
                    $stmt->execute([$val]);
                    $prev = $stmt->fetch();
                }

                // Check for anomalies (±30% deviation)
                $isAbnormal = false;
                if ($prev['totalEnergy'] > 0) {
                    $pctChange = (($curr['totalEnergy'] - $prev['totalEnergy']) / $prev['totalEnergy']) * 100;
                    if (abs($pctChange) >= 30) $isAbnormal = true;
                }

                // Check budget (get from budget_settings)
                $isBudgetExceeded = false;
                $stmt = $conn->prepare("SELECT monthly_budget FROM budget_settings WHERE room_id = ? AND month = ? AND year = ?");
                $stmt->execute([$roomId, (int)date('m'), (int)date('Y')]);
                $budget = $stmt->fetch();
                if ($budget && $curr['totalCost'] > $budget['monthly_budget']) {
                    $isBudgetExceeded = true;
                }

                $response['data'] = [
                    "current" => [
                        "totalEnergy" => (float)$curr['totalEnergy'],
                        "totalCost" => (float)$curr['totalCost']
                    ],
                    "previous" => [
                        "totalEnergy" => (float)$prev['totalEnergy'],
                        "totalCost" => (float)$prev['totalCost']
                    ],
                    "isAbnormal" => $isAbnormal,
                    "isBudgetExceeded" => $isBudgetExceeded,
                    "energyPctChange" => ($prev['totalEnergy'] > 0) ? (($curr['totalEnergy'] - $prev['totalEnergy']) / $prev['totalEnergy']) * 100 : 0,
                    "costPctChange" => ($prev['totalCost'] > 0) ? (($curr['totalCost'] - $prev['totalCost']) / $prev['totalCost']) * 100 : 0
                ];
                $response['success'] = true;
                break;

            // ============ SETTINGS ============
            case 'getSetting':
                $stmt = $conn->prepare("SELECT setting_value FROM settings WHERE setting_key = ?");
                $stmt->execute([$data['key']]);
                $row = $stmt->fetch();
                $response['data'] = $row ? $row['setting_value'] : null;
                $response['success'] = true;
                break;

            case 'setSetting':
                $stmt = $conn->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
                $stmt->execute([$data['key'], $data['value']]);
                $response['success'] = true;
                break;

            // ============ EMAIL VERIFICATION ============
            case 'sendVerificationCode':
                $email = $data['email'];
                $tenantName = $data['name'] ?? '';

                // Rate limit check
                $rateCheck = checkOTPRateLimit($conn, $email);
                if (!$rateCheck['allowed']) {
                    sendResponse(false, $rateCheck['message'], ['wait_seconds' => $rateCheck['wait_seconds']]);
                }

                // Generate, store, and send OTP
                $otp = generateOTP();
                storeOTP($conn, $email, $otp, 'verification');

                $subject = 'Your Wattipid Verification Code: ' . $otp;
                $htmlBody = getOTPEmailTemplate($tenantName ?: $email, $otp, 'verification');
                $textBody = getOTPEmailPlainText($tenantName ?: $email, $otp, 'verification');
                $emailResult = sendEmail($email, $tenantName, $subject, $htmlBody, $textBody);
                logEmailDelivery($conn, $email, 'verification', $emailResult['success'] ? 'sent' : 'failed', $emailResult['provider'] ?? 'unknown', $emailResult['success'] ? null : $emailResult['message']);

                if ($emailResult['success']) {
                    // In mock mode, include the code for development testing
                    $responseData = ['emailSent' => true];
                    if (EMAIL_PROVIDER === 'mock') {
                        $responseData['mockCode'] = $otp;
                    }
                    sendResponse(true, 'Verification code sent to your email.', $responseData);
                } else {
                    sendResponse(false, 'Failed to send verification email. Please try again.', [
                        'error' => $emailResult['message']
                    ]);
                }
                break;

            case 'verifyOTP':
                $email = $data['email'];
                $code = $data['code'];
                $type = $data['type'] ?? 'verification';

                $result = validateOTP($conn, $email, $code, $type);
                sendResponse($result['success'], $result['message'], ['status' => $result['status']]);
                break;

            case 'resendVerificationCode':
                $email = $data['email'];
                $tenantName = $data['name'] ?? '';

                // Rate limit check
                $rateCheck = checkOTPRateLimit($conn, $email);
                if (!$rateCheck['allowed']) {
                    sendResponse(false, $rateCheck['message'], ['wait_seconds' => $rateCheck['wait_seconds']]);
                }

                // Generate new OTP (invalidates old ones)
                $otp = generateOTP();
                storeOTP($conn, $email, $otp, 'verification');

                $subject = 'Your New Wattipid Verification Code: ' . $otp;
                $htmlBody = getOTPEmailTemplate($tenantName ?: $email, $otp, 'verification');
                $textBody = getOTPEmailPlainText($tenantName ?: $email, $otp, 'verification');
                $emailResult = sendEmail($email, $tenantName, $subject, $htmlBody, $textBody);
                logEmailDelivery($conn, $email, 'verification', $emailResult['success'] ? 'sent' : 'failed', $emailResult['provider'] ?? 'unknown', $emailResult['success'] ? null : $emailResult['message']);

                if ($emailResult['success']) {
                    $responseData = ['emailSent' => true];
                    if (EMAIL_PROVIDER === 'mock') {
                        $responseData['mockCode'] = $otp;
                    }
                    sendResponse(true, 'New verification code sent.', $responseData);
                } else {
                    sendResponse(false, 'Failed to resend verification email.', ['error' => $emailResult['message']]);
                }
                break;
        }
    } catch (Exception $e) {
        $response['message'] = $e->getMessage();
    }
}

echo json_encode($response);
