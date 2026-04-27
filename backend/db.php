<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Hostinger Database Configuration
$host = 'localhost'; // Usually localhost on Hostinger
$db_name = 'your_database_name'; // Replace with your Hostinger DB name
$username = 'your_database_user'; // Replace with your Hostinger DB user
$password = 'your_database_password'; // Replace with your Hostinger DB password

try {
    $conn = new PDO("mysql:host={$host};dbname={$db_name}", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    echo json_encode(["success" => false, "message" => "Connection failed: " . $e->getMessage()]);
    exit();
}
?>
