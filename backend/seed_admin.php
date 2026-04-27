<?php
require 'db.php';

$name = 'Admin Landlord';
$email = 'admin@wattipid.com';
$password = 'admin123';
$role = 'landlord';
$is_verified = 1;

try {
    // Check if admin already exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo "Admin account already exists.";
        exit();
    }

    $password_hash = password_hash($password, PASSWORD_BCRYPT);
    $sql = "INSERT INTO users (name, email, password_hash, role, is_verified) VALUES (?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$name, $email, $password_hash, $role, $is_verified]);
    
    echo "Admin account created successfully!";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
