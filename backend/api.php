<?php
require 'db.php';

// Set response header to JSON
header('Content-Type: application/json');

// Get POST data
$json = file_get_contents('php://input');
$data = json_decode($json, true);

$response = ["success" => false, "message" => "Invalid action"];

if (isset($data['action'])) {
    $action = $data['action'];

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
        switch ($action) {
            // ============ AUTHENTICATION ============
            case 'login':
                $stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
                $stmt->execute([$data['email']]);
                $user = $stmt->fetch();
                if ($user && password_verify($data['password'], $user['password_hash'])) {
                    unset($user['password_hash']);
                    $response['success'] = true;
                    $response['data'] = $user;
                } else {
                    $response['message'] = "Invalid email or password";
                }
                break;

            case 'register':
                $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
                $stmt = $conn->prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'tenant')");
                if ($stmt->execute([$data['name'], $data['email'], $passwordHash])) {
                    $response['success'] = true;
                    $response['message'] = "Registered successfully";
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
                $stmt = $conn->prepare("SELECT * FROM rooms WHERE status = 'Vacant'");
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
                    $stmt = $conn->prepare("UPDATE rooms SET tenant_name = ?, tenant_start_date = ?, status = 'Occupied' WHERE room_id = ?");
                    $stmt->execute([$tenant['tenant_name'], $tenant['tenant_start_date'], $toRoom]);
                    
                    // 3. Clear old room
                    $stmt = $conn->prepare("UPDATE rooms SET tenant_name = NULL, tenant_start_date = NULL, status = 'Vacant' WHERE room_id = ?");
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
                    $stmt->execute([$roomId, $tenantName, $user['email'] ?? 'unknown', $room['tenant_start_date'], 'moved_out']);

                    // 4. DELETE ALL DATA (Privacy Requirement)
                    // Delete User Account
                    if ($user) {
                        $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
                        $stmt->execute([$user['id']]);
                    }
                    
                    // Delete active/pending invitations
                    $stmt = $conn->prepare("DELETE FROM tenant_invitations WHERE room_id = ?");
                    $stmt->execute([$roomId]);

                    // Delete consumption logs for this specific tenant in this room
                    $stmt = $conn->prepare("DELETE FROM consumption_logs WHERE room_id = ? AND tenant_name = ?");
                    $stmt->execute([$roomId, $tenantName]);
                }
                
                // 5. Reset room status
                $stmt = $conn->prepare("UPDATE rooms SET tenant_name = NULL, tenant_start_date = NULL, status = 'Vacant' WHERE room_id = ?");
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
                $code = $data['tenantCode'];
                
                $stmt = $conn->prepare("INSERT INTO tenant_invitations (email, room_id, tenant_code, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE)) ON DUPLICATE KEY UPDATE tenant_code = VALUES(tenant_code), expires_at = DATE_ADD(NOW(), INTERVAL 5 MINUTE), status = 'active'");
                $stmt->execute([$email, $roomId, $code]);
                
                // Update room status to 'on_process'
                $stmt = $conn->prepare("UPDATE rooms SET status = 'on_process' WHERE room_id = ?");
                $stmt->execute([$roomId]);
                
                $response['success'] = true;
                $response['data'] = ['status' => 'active'];
                break;

            case 'getTenantInvitationByEmail':
                $stmt = $conn->prepare("SELECT * FROM tenant_invitations WHERE email = ? AND status = 'active' AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1");
                $stmt->execute([$data['email']]);
                $response['data'] = $stmt->fetch();
                $response['success'] = true;
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
                
                $stmt = $conn->prepare("INSERT INTO consumption_logs (room_id, tenant_name, voltage, current_val, power, energy, energy_cumulative, cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$roomId, $tenantName, $voltage, $current, $power, $energyDelta, $cumulativeEnergy, $cost]);

                // --- PEAK POWER CHECK ---
                $threshold = 1000; // 1kW default
                $stmt = $conn->prepare("SELECT setting_value FROM settings WHERE setting_key = 'peak_power_threshold' LIMIT 1");
                $stmt->execute();
                $row = $stmt->fetch();
                if ($row) $threshold = (float)$row['setting_value'];

                if ($power > $threshold) {
                    $stmt = $conn->prepare("INSERT INTO notifications (room_id, type, title, message) VALUES (?, 'alert', 'High Power Usage Detected', ?)");
                    $msg = "Your room is currently consuming " . number_format($power, 0) . "W, which exceeds your threshold of " . number_format($threshold, 0) . "W.";
                    $stmt->execute([$roomId, $msg]);
                }
                
                $response['success'] = true;
                $response['delta'] = $energyDelta;
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
                if ($period === 'daily') {
                    $stmt = $conn->prepare("SELECT DATE_FORMAT(timestamp, '%H:00') as label, AVG(power) as avgPower, MAX(power) as peakPower, SUM(energy) as energy, SUM(cost) as cost FROM consumption_logs WHERE room_id = ? AND timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR) GROUP BY DATE_FORMAT(timestamp, '%H') ORDER BY timestamp ASC");
                } elseif ($period === 'weekly') {
                    $stmt = $conn->prepare("SELECT *, DATE_FORMAT(timestamp, '%w') as label, AVG(power) as avgPower, MAX(power) as peakPower, SUM(energy) as energy, SUM(cost) as cost FROM consumption_logs WHERE room_id = ? AND timestamp >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) AND DATE_FORMAT(timestamp, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m') GROUP BY DATE(timestamp) ORDER BY timestamp ASC");
                } else {
                    $stmt = $conn->prepare("SELECT *, DATE_FORMAT(timestamp, '%d') as label, AVG(power) as avgPower, MAX(power) as peakPower, SUM(energy) as energy, SUM(cost) as cost FROM consumption_logs WHERE room_id = ? AND timestamp >= DATE_SUB(CURDATE(), INTERVAL 29 DAY) GROUP BY DATE(timestamp) ORDER BY timestamp ASC");
                }
                $stmt->execute([$roomId]);
                $response['data'] = $stmt->fetchAll();
                $response['success'] = true;
                break;

            case 'getTotalConsumptionToday':
                $stmt = $conn->prepare("SELECT COALESCE(SUM(energy), 0) as totalEnergy, COALESCE(SUM(cost), 0) as totalCost FROM consumption_logs WHERE room_id = ? AND DATE(timestamp) = CURDATE()");
                $stmt->execute([$data['roomId']]);
                $response['data'] = $stmt->fetch();
                $response['success'] = true;
                break;

            case 'getTotalConsumptionWeek':
                // Use calendar week starting Monday
                $stmt = $conn->prepare("SELECT COALESCE(SUM(energy), 0) as totalEnergy, COALESCE(SUM(cost), 0) as totalCost, COUNT(*) as entryCount FROM consumption_logs WHERE room_id = ? AND timestamp >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) AND DATE_FORMAT(timestamp, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')");
                $stmt->execute([$data['roomId']]);
                $response['data'] = $stmt->fetch();
                $response['success'] = true;
                break;

            case 'getTotalConsumptionMonth':
                $stmt = $conn->prepare("SELECT COALESCE(SUM(energy), 0) as totalEnergy, COALESCE(SUM(cost), 0) as totalCost FROM consumption_logs WHERE room_id = ? AND DATE_FORMAT(timestamp, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')");
                $stmt->execute([$data['roomId']]);
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
                $stmt = $conn->prepare("SELECT HOUR(timestamp) as hour, SUM(energy) as totalEnergy, AVG(power) as avgPower, SUM(cost) as totalCost FROM consumption_logs WHERE room_id = ? AND DATE(timestamp) = CURDATE() GROUP BY HOUR(timestamp) ORDER BY hour ASC");
                $stmt->execute([$data['roomId']]);
                $response['data'] = $stmt->fetchAll();
                $response['success'] = true;
                break;

            case 'getDailyBreakdown':
                $stmt = $conn->prepare("SELECT DATE(timestamp) as day, AVG(power) as avgPower, MAX(power) as peakPower, SUM(energy) as totalEnergy, SUM(cost) as totalCost, COUNT(*) as entries FROM consumption_logs WHERE room_id = ? AND YEAR(timestamp) = ? AND MONTH(timestamp) = ? GROUP BY DATE(timestamp) ORDER BY day DESC");
                $stmt->execute([$data['roomId'], $data['year'], $data['month']]);
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
                $where = "WHERE room_id = ?";
                $params = [$roomId];
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
                if ($period === 'weekly') {
                    $stmt = $conn->prepare("SELECT COALESCE(SUM(energy), 0) as totalEnergy, COALESCE(SUM(cost), 0) as totalCost FROM consumption_logs WHERE room_id = ? AND timestamp >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) AND DATE_FORMAT(timestamp, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')");
                    $stmt->execute([$roomId]);
                    $curr = $stmt->fetch();
                    $stmt = $conn->prepare("SELECT COALESCE(SUM(energy), 0) as totalEnergy, COALESCE(SUM(cost), 0) as totalCost FROM consumption_logs WHERE room_id = ? AND timestamp >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE())+7 DAY) AND timestamp < DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)");
                    $stmt->execute([$roomId]);
                    $prev = $stmt->fetch();
                } else {
                    $stmt = $conn->prepare("SELECT COALESCE(SUM(energy), 0) as totalEnergy, COALESCE(SUM(cost), 0) as totalCost FROM consumption_logs WHERE room_id = ? AND DATE_FORMAT(timestamp, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')");
                    $stmt->execute([$roomId]);
                    $curr = $stmt->fetch();
                    $stmt = $conn->prepare("SELECT COALESCE(SUM(energy), 0) as totalEnergy, COALESCE(SUM(cost), 0) as totalCost FROM consumption_logs WHERE room_id = ? AND DATE_FORMAT(timestamp, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m')");
                    $stmt->execute([$roomId]);
                    $prev = $stmt->fetch();
                }
                $response['data'] = [
                    "current" => [
                        "totalEnergy" => (float)$curr['totalEnergy'],
                        "totalCost" => (float)$curr['totalCost']
                    ],
                    "previous" => [
                        "totalEnergy" => (float)$prev['totalEnergy'],
                        "totalCost" => (float)$prev['totalCost']
                    ]
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
        }
    } catch (Exception $e) {
        $response['message'] = $e->getMessage();
    }
}

echo json_encode($response);
