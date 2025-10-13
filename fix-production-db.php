<?php
/**
 * Production Database Fix Script
 * This script helps diagnose and fix production database issues
 */

echo "🔧 Production Database Diagnostic Script\n";
echo "=====================================\n\n";

// Test database connection
try {
    $pdo = new PDO('pgsql:host=localhost;dbname=timesovh_naqashthaheem', 'timesovh_naqash_thaheem', 'mg08.Rcrld}N');
    echo "✅ Database connection successful\n";
    
    // Check if gemini_api_keys table exists
    $stmt = $pdo->query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'gemini_api_keys')");
    $tableExists = $stmt->fetchColumn();
    
    if ($tableExists) {
        echo "✅ gemini_api_keys table exists\n";
        
        // Check table structure
        $stmt = $pdo->query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'gemini_api_keys' ORDER BY ordinal_position");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "📋 Table structure:\n";
        foreach ($columns as $column) {
            echo "  - {$column['column_name']}: {$column['data_type']}\n";
        }
        
        // Check if there are any records
        $stmt = $pdo->query("SELECT COUNT(*) FROM gemini_api_keys");
        $count = $stmt->fetchColumn();
        echo "📊 Records in table: $count\n";
        
        if ($count > 0) {
            $stmt = $pdo->query("SELECT id, name, is_active, created_at FROM gemini_api_keys LIMIT 5");
            $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo "📝 Sample records:\n";
            foreach ($records as $record) {
                echo "  - ID: {$record['id']}, Name: {$record['name']}, Active: " . ($record['is_active'] ? 'Yes' : 'No') . ", Created: {$record['created_at']}\n";
            }
        }
        
    } else {
        echo "❌ gemini_api_keys table does not exist\n";
        echo "🔧 Need to run migration: 2025_10_09_234758_create_gemini_api_keys_table\n";
        
        // Show the migration SQL
        echo "\n📝 Migration SQL:\n";
        echo "CREATE TABLE gemini_api_keys (\n";
        echo "    id BIGSERIAL PRIMARY KEY,\n";
        echo "    name VARCHAR(255) NOT NULL,\n";
        echo "    api_key TEXT NOT NULL,\n";
        echo "    max_requests INTEGER NOT NULL DEFAULT 100,\n";
        echo "    total_requests INTEGER NOT NULL DEFAULT 100,\n";
        echo "    used_requests INTEGER NOT NULL DEFAULT 0,\n";
        echo "    is_active BOOLEAN NOT NULL DEFAULT true,\n";
        echo "    created_at TIMESTAMP(0) NULL,\n";
        echo "    updated_at TIMESTAMP(0) NULL\n";
        echo ");\n";
    }
    
} catch (Exception $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "\n";
}

echo "\n🔧 To fix this issue on production:\n";
echo "1. SSH into your production server\n";
echo "2. Navigate to your application directory\n";
echo "3. Run: php artisan migrate --force\n";
echo "4. Or run the migration SQL manually if needed\n";
echo "\n✅ Script completed\n";
?>
