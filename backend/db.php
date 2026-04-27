<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// XAMPP Local Database Configuration
$host = 'localhost'; 
$db_name = 'wattipid'; // Your local database name in phpMyAdmin
$username = 'root'; // XAMPP default username
$password = ''; // XAMPP default password (empty)

try {
    $conn = new PDO("mysql:host={$host};dbname={$db_name}", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    header('Content-Type: application/json');
    echo json_encode(["success" => false, "message" => "Connection failed: " . $e->getMessage()]);
    exit();
}
