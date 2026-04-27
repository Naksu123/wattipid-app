<?php
require 'db.php';

$roomId = 'Room 1';
$now = time();

// Clear existing unrealistic logs for Room 1
$conn->prepare("DELETE FROM consumption_logs WHERE room_id = ?")->execute([$roomId]);

echo "Cleared old logs. Seeding realistic dormitory data...\n";

$rate = 12.5;
$stmt = $conn->prepare("SELECT setting_value FROM settings WHERE setting_key = 'rate_per_kwh' LIMIT 1");
$stmt->execute();
$row = $stmt->fetch();
if ($row) $rate = (float)$row['setting_value'];

// Seed 7 days of data
// We'll generate 1 reading every 30 minutes to keep the history clean but realistic.
// 48 readings per day.
for ($day = 0; $day < 7; $day++) {
    $dayTimestamp = $now - ($day * 86400);
    
    for ($hour = 0; $hour < 24; $hour++) {
        for ($half = 0; $half < 2; $half++) {
            $timestamp = date('Y-m-d H:i:s', $dayTimestamp - ($hour * 3600) - ($half * 1800));
            
            // Realistic Power for a dorm (50W standby to 600W peak)
            // Higher power during day/evening, lower at night
            $basePower = ($hour >= 8 && $hour <= 23) ? 150 : 40;
            $power = $basePower + rand(0, 150);
            
            // Energy in kWh for this 30-minute interval
            // kWh = (Watts * hours) / 1000
            $energy = ($power * 0.5) / 1000;
            $cost = $energy * $rate;
            
            $stmt = $conn->prepare("INSERT INTO consumption_logs (room_id, voltage, current_val, power, energy, cost, timestamp) VALUES (?, 220, ?, ?, ?, ?, ?)");
            $stmt->execute([$roomId, $power/220, $power, $energy, $cost, $timestamp]);
        }
    }
}

echo "Successfully seeded realistic dormitory data for Room 1 (48 readings/day).\n";
?>
