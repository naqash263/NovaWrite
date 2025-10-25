<?php
/**
 * Script to manually mark the password reset migration as completed
 * and run the remaining migrations
 */

// Database connection details
$host = 'localhost';
$dbname = 'timesovh_naqashthaheem';
$username = 'timesovh_naqash_thaheem';
$password = 'mg08.Rcrld}N';

try {
    $pdo = new PDO("pgsql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Connected to database successfully.\n";
    
    // Check if the migration is already marked as completed
    $stmt = $pdo->prepare("SELECT * FROM migrations WHERE migration = ?");
    $stmt->execute(['2025_10_24_132508_add_password_reset_columns_to_users_table']);
    $result = $stmt->fetch();
    
    if ($result) {
        echo "Migration 2025_10_24_132508_add_password_reset_columns_to_users_table is already marked as completed.\n";
    } else {
        // Mark the migration as completed
        $stmt = $pdo->prepare("INSERT INTO migrations (migration, batch) VALUES (?, ?)");
        $stmt->execute(['2025_10_24_132508_add_password_reset_columns_to_users_table', 18]);
        echo "Marked migration 2025_10_24_132508_add_password_reset_columns_to_users_table as completed.\n";
    }
    
    // Check if the system email settings migration is completed
    $stmt = $pdo->prepare("SELECT * FROM migrations WHERE migration = ?");
    $stmt->execute(['2025_10_24_185409_create_system_email_settings_table']);
    $result = $stmt->fetch();
    
    if ($result) {
        echo "Migration 2025_10_24_185409_create_system_email_settings_table is already completed.\n";
    } else {
        echo "Migration 2025_10_24_185409_create_system_email_settings_table is still pending.\n";
    }
    
    echo "Migration status check completed.\n";
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
    exit(1);
}
?>
