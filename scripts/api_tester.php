<?php
/**
 * Wattipid Automated End-to-End Test Suite - Authenticated
 */

$baseUrl = 'http://localhost/wattipid_backend/api.php';

function apiRequest($url, $payload, $token = null) {
    $ch = curl_init($url);
    $headers = ['Content-Type: application/json'];
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    return ['code' => $httpCode, 'raw' => $response, 'json' => json_decode($response, true), 'err' => $err];
}

function makeJWT($payload, $secret) {
    $header = json_encode(['alg' => 'HS256', 'typ' => 'JWT']);
    $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($payload)));
    $signature = hash_hmac('sha256', "$base64Header.$base64Payload", $secret, true);
    $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    return "$base64Header.$base64Payload.$base64Signature";
}

require_once 'c:/xampp/htdocs/wattipid_backend/config/config.php';
require_once 'c:/xampp/htdocs/wattipid_backend/config/db.php';

$tenantUser = $conn->query("SELECT * FROM users WHERE role = 'tenant' LIMIT 1")->fetch(PDO::FETCH_ASSOC);
$landlordUser = $conn->query("SELECT * FROM users WHERE role = 'landlord' LIMIT 1")->fetch(PDO::FETCH_ASSOC);

echo "====================================================\n";
echo "   WATTIPID AUTHENTICATED ENDPOINTS AUDIT           \n";
echo "====================================================\n\n";

if ($tenantUser) {
    $now = time();
    $tenantPayload = [
        'id' => (int)$tenantUser['id'],
        'email' => $tenantUser['email'],
        'role' => 'tenant',
        'ver' => (int)($tenantUser['token_version'] ?? 1),
        'iat' => $now,
        'exp' => $now + 3600
    ];
    $tenantJwt = makeJWT($tenantPayload, SECRET_KEY);
    echo "Tenant user: {$tenantUser['email']} | Room: {$tenantUser['room_id']}\n";

    // --- TEST 14: Tenant accessing their own billing overview ---
    $res = apiRequest($baseUrl, ['action' => 'getTenantBillingOverview', 'roomId' => $tenantUser['room_id']], $tenantJwt);
    $pass = ($res['code'] == 200 && isset($res['json']['success']) && $res['json']['success'] === true);
    echo "[TEST 14] Tenant Billing Overview (Own Room): HTTP {$res['code']} | " . ($pass ? "PASS" : "FAIL") . "\n";
    if ($pass) {
        $data = $res['json']['data'];
        echo "   -> Outstanding Grand Total: ₱" . ($data['total_outstanding']['grand_total'] ?? 'N/A') . "\n";
        echo "   -> Overdue Count: " . count($data['overdue_bills'] ?? []) . "\n";
    }

    // --- TEST 15: Tenant attempting IDOR on another room ---
    $res = apiRequest($baseUrl, ['action' => 'getTenantBillingOverview', 'roomId' => 'Room 2'], $tenantJwt);
    $pass = ($res['code'] == 403 || (isset($res['json']['success']) && $res['json']['success'] === false));
    echo "[TEST 15] Tenant IDOR Prevention on Room 2: HTTP {$res['code']} | " . ($pass ? "PASS (Protected)" : "FAIL (Leaked)") . " | Msg: " . ($res['json']['message'] ?? '') . "\n";

    // --- TEST 16: Tenant attempting Landlord-only action toggleRelay ---
    $res = apiRequest($baseUrl, ['action' => 'toggleRelay', 'roomId' => $tenantUser['room_id'], 'state' => 0], $tenantJwt);
    $pass = ($res['code'] == 403);
    echo "[TEST 16] Tenant Power Cut Attempt (toggleRelay): HTTP {$res['code']} | " . ($pass ? "PASS (403 Forbidden)" : "FAIL") . " | Msg: " . ($res['json']['message'] ?? '') . "\n";

    // --- TEST 17: Tenant submit payment with 0 amount ---
    $res = apiRequest($baseUrl, [
        'action' => 'submitPayment',
        'roomId' => $tenantUser['room_id'],
        'billingCycleId' => 15,
        'amount' => 0,
        'paymentMethod' => 'Cash'
    ], $tenantJwt);
    $pass = (isset($res['json']['success']) && $res['json']['success'] === false);
    echo "[TEST 17] Submit Payment Zero Amount: HTTP {$res['code']} | " . ($pass ? "PASS (Rejected)" : "FAIL") . " | Msg: " . ($res['json']['message'] ?? '') . "\n";

    // --- TEST 18: Tenant submit payment invalid payment method ---
    $res = apiRequest($baseUrl, [
        'action' => 'submitPayment',
        'roomId' => $tenantUser['room_id'],
        'billingCycleId' => 15,
        'amount' => 100,
        'paymentMethod' => 'Bitcoin'
    ], $tenantJwt);
    $pass = (isset($res['json']['success']) && $res['json']['success'] === false);
    echo "[TEST 18] Submit Payment Invalid Method: HTTP {$res['code']} | " . ($pass ? "PASS (Rejected)" : "FAIL") . " | Msg: " . ($res['json']['message'] ?? '') . "\n";

    // --- TEST 19: Tenant submit payment e-wallet short ref ---
    $res = apiRequest($baseUrl, [
        'action' => 'submitPayment',
        'roomId' => $tenantUser['room_id'],
        'billingCycleId' => 15,
        'amount' => 100,
        'paymentMethod' => 'GCash',
        'referenceNumber' => '12'
    ], $tenantJwt);
    $pass = (isset($res['json']['success']) && $res['json']['success'] === false);
    echo "[TEST 19] Submit Payment Short Reference Number: HTTP {$res['code']} | " . ($pass ? "PASS (Rejected)" : "FAIL") . " | Msg: " . ($res['json']['message'] ?? '') . "\n";
}

if ($landlordUser) {
    $now = time();
    $landlordPayload = [
        'id' => (int)$landlordUser['id'],
        'email' => $landlordUser['email'],
        'role' => 'landlord',
        'ver' => (int)($landlordUser['token_version'] ?? 1),
        'iat' => $now,
        'exp' => $now + 3600
    ];
    $landlordJwt = makeJWT($landlordPayload, SECRET_KEY);
    echo "\nLandlord user: {$landlordUser['email']}\n";

    // --- TEST 20: Landlord getAllRooms ---
    $res = apiRequest($baseUrl, ['action' => 'getAllRooms'], $landlordJwt);
    $pass = ($res['code'] == 200 && isset($res['json']['success']) && $res['json']['success'] === true);
    echo "[TEST 20] Landlord getAllRooms: HTTP {$res['code']} | " . ($pass ? "PASS" : "FAIL") . " | Rooms count: " . count($res['json']['data'] ?? []) . "\n";

    // --- TEST 21: Landlord getBuildingSummary ---
    $res = apiRequest($baseUrl, ['action' => 'getBuildingSummary'], $landlordJwt);
    $pass = ($res['code'] == 200 && isset($res['json']['success']) && $res['json']['success'] === true);
    echo "[TEST 21] Landlord getBuildingSummary: HTTP {$res['code']} | " . ($pass ? "PASS" : "FAIL") . "\n";

    // --- TEST 22: Landlord trigger penalty calculation ---
    $res = apiRequest($baseUrl, ['action' => 'triggerPenaltyCalculation'], $landlordJwt);
    $pass = ($res['code'] == 200 && isset($res['json']['success']) && $res['json']['success'] === true);
    echo "[TEST 22] Landlord Trigger Penalty Calculation: HTTP {$res['code']} | " . ($pass ? "PASS" : "FAIL") . " | Count: " . ($res['json']['count'] ?? 'N/A') . " | Msg: " . ($res['json']['message'] ?? '') . "\n";

    // --- TEST 23: Verify idempotency of penalty calculation (re-run immediately) ---
    $res = apiRequest($baseUrl, ['action' => 'triggerPenaltyCalculation'], $landlordJwt);
    $pass = ($res['code'] == 200 && isset($res['json']['count']) && $res['json']['count'] === 0);
    echo "[TEST 23] Penalty Idempotency Immediate Re-run: " . ($pass ? "PASS (0 duplicate penalties)" : "FAIL") . " | Msg: " . ($res['json']['message'] ?? '') . "\n";

    // --- TEST 24: Landlord getOverdueAccounts ---
    $res = apiRequest($baseUrl, ['action' => 'getOverdueAccounts'], $landlordJwt);
    $pass = ($res['code'] == 200 && isset($res['json']['success']) && $res['json']['success'] === true);
    echo "[TEST 24] Landlord getOverdueAccounts: HTTP {$res['code']} | " . ($pass ? "PASS" : "FAIL") . " | Overdue Count: " . count($res['json']['data'] ?? []) . "\n";

    // --- TEST 25: Landlord verify payment approve/reject validation ---
    $res = apiRequest($baseUrl, [
        'action' => 'verifyPayment',
        'paymentId' => 999999, // non-existent
        'action_type' => 'reject',
        'reason' => 'Test invalid'
    ], $landlordJwt);
    $pass = (isset($res['json']['success']) && $res['json']['success'] === false);
    echo "[TEST 25] Landlord verifyPayment Non-existent ID: HTTP {$res['code']} | " . ($pass ? "PASS (Cleanly Handled)" : "FAIL") . " | Msg: " . ($res['json']['message'] ?? '') . "\n";

    // --- TEST 26: Landlord verify payment reject missing reason ---
    $res = apiRequest($baseUrl, [
        'action' => 'verifyPayment',
        'paymentId' => 39,
        'action_type' => 'reject'
        // missing reason
    ], $landlordJwt);
    $pass = (isset($res['json']['success']) && $res['json']['success'] === false);
    echo "[TEST 26] Landlord verifyPayment Reject Missing Reason: HTTP {$res['code']} | " . ($pass ? "PASS (Rejected Missing Reason)" : "FAIL") . " | Msg: " . ($res['json']['message'] ?? '') . "\n";
}

echo "\n====================================================\n";
