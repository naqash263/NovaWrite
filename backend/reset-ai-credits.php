<?php

// Simple script to reset AI credits without Laravel
$dsn = 'pgsql:dbname=novawrite_local';
$pdo = new PDO($dsn);

echo "Resetting AI credits...\n";

try {
    // Reset admin API keys usage
    $stmt = $pdo->prepare("UPDATE gemini_api_keys SET used_requests = 0 WHERE is_active = true");
    $result = $stmt->execute();
    $adminReset = $stmt->rowCount();
    
    // Reset user API keys usage
    $stmt = $pdo->prepare("UPDATE user_api_keys SET usage_count = 0 WHERE is_active = true");
    $result = $stmt->execute();
    $userReset = $stmt->rowCount();
    
    echo "✅ Reset complete!\n";
    echo "Admin API keys reset: {$adminReset}\n";
    echo "User API keys reset: {$userReset}\n";
    
    // Show current status
    echo "\nCurrent API Key Status:\n";
    echo "======================\n";
    
    $stmt = $pdo->query("SELECT name, total_requests, used_requests FROM gemini_api_keys WHERE is_active = true");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $remaining = $row['total_requests'] - $row['used_requests'];
        echo "Admin: {$row['name']} - {$remaining}/{$row['total_requests']} remaining\n";
    }
    
    $stmt = $pdo->query("SELECT name, requests_per_key, usage_count FROM user_api_keys WHERE is_active = true");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $remaining = $row['requests_per_key'] - $row['usage_count'];
        echo "User: {$row['name']} - {$remaining}/{$row['requests_per_key']} remaining\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error resetting credits: " . $e->getMessage() . "\n";
    exit(1);
}