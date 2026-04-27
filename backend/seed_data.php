<?php
require 'db.php';

$roomId = 'Room 1';
$now = time();

// Seed 7 days of data for Weekly view
for ($i = 0; $i < 7; $i++) {
    $date = date('Y-m-d H:i:s', $now - ($i * 86400));
    $energy = 2.5 + (rand(0, 50) / 10);
    $cost = $energy * 12.5;
    $power = 300 + rand(0, 200);
    
    $stmt = $conn->prepare("INSERT INTO consumption_logs (room_id, voltage, current_val, power, energy, cost, timestamp) VALUES (?, 220, ?, ?, ?, ?, ?)");
    $stmt->execute([$roomId, $power/220, $power, $energy, $cost, $date]);
}

// Seed 24 hours of data for Daily view
for ($i = 0; $i < 24; $i++) {
    $date = date('Y-m-d H:i:s', $now - ($i * 3600));
    $energy = 0.1 + (rand(0, 10) / 100);
    $cost = $energy * 12.5;
    $power = 100 + rand(0, 50);
    
    $stmt = $conn->prepare("INSERT INTO consumption_logs (room_id, voltage, current_val, power, energy, cost, timestamp) VALUES (?, 220, ?, ?, ?, ?, ?)");
    $stmt->execute([$roomId, $power/220, $power, $energy, $cost, $date]);
}

echo "Successfully seeded dummy data for Room 1";
?>
