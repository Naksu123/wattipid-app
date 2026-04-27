<?php
require 'db.php';

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get JSON input
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!$data) {
        // Fallback for form-data
        $data = $_POST;
    }

    $name = $data['name'] ?? '';
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    $role = $data['role'] ?? 'tenant';
    $room_id = $data['roomId'] ?? null;
    $tenant_code = $data['tenantCode'] ?? null;
    
    // In a real app, you would verify email. For now, auto-verify for simplicity
    $is_verified = 1;

    if (empty($name) || empty($email) || empty($password)) {
        echo json_encode(["success" => false, "message" => "All fields are required."]);
        exit();
    }

    try {
        // Check if email already exists
        $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            echo json_encode(["success" => false, "message" => "Email already registered."]);
            exit();
        }

        // Hash the password securely
        $password_hash = password_hash($password, PASSWORD_BCRYPT);

        // Insert new user
        $sql = "INSERT INTO users (name, email, password_hash, role, room_id, tenant_code, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$name, $email, $password_hash, $role, $room_id, $tenant_code, $is_verified]);
        
        $newUserId = $conn->lastInsertId();

        // Fetch and return the created user object (excluding password)
        $stmt = $conn->prepare("SELECT id, name, email, role, room_id, tenant_code, is_verified FROM users WHERE id = ?");
        $stmt->execute([$newUserId]);
        $user = $stmt->fetch();

        echo json_encode([
            "success" => true,
            "message" => "Registration successful",
            "user" => $user
        ]);

    } catch (Exception $e) {
        echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
}
?>
