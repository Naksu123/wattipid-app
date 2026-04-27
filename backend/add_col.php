<?php
require 'db.php';
try {
    $conn->exec("ALTER TABLE budget_settings ADD COLUMN weekly_allowance DECIMAL(10, 2) DEFAULT 0 AFTER daily_allowance");
    echo "Column weekly_allowance added successfully!";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
