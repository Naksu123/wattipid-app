<?php
require 'db.php';

$sql = file_get_contents('C:/xampp/htdocs/wattipid_backend/setup.sql');
if (!$sql) {
    die("Error reading setup.sql");
}

try {
    $conn->exec($sql);
    echo "SQL Executed successfully!";
} catch (PDOException $e) {
    echo "Error executing SQL: " . $e->getMessage();
}
?>
