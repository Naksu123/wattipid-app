<?php
require 'db.php';
try {
    $conn->exec("ALTER TABLE consumption_logs ADD COLUMN energy_cumulative DECIMAL(10, 4) DEFAULT 0 AFTER energy");
    echo "Column 'energy_cumulative' added successfully.";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
