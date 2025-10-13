<?php
/**
 * Fix Gemini API Keys Table Only
 * This script creates only the gemini_api_keys table if it doesn't exist
 */

echo "🔧 Gemini API Keys Table Fix Script\n";
echo "==================================\n\n";

// Database connection (update these with your production credentials)
$host = 'localhost';
$dbname = 'timesovh_naqashthaheem';
$username = 'timesovh_naqash_thaheem';
$password = 'mg08.Rcrld}N';

try {
    $pdo = new PDO("pgsql:host=$host;dbname=$dbname", $username, $password);
    echo "✅ Database connection successful\n";
    
    // Check if gemini_api_keys table exists
    $stmt = $pdo->query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'gemini_api_keys')");
    $tableExists = $stmt->fetchColumn();
    
    if ($tableExists) {
        echo "✅ gemini_api_keys table already exists\n";
        
        // Check if there are any records
        $stmt = $pdo->query("SELECT COUNT(*) FROM gemini_api_keys");
        $count = $stmt->fetchColumn();
        echo "📊 Records in gemini_api_keys table: $count\n";
        
    } else {
        echo "❌ gemini_api_keys table does not exist\n";
        echo "🔧 Creating gemini_api_keys table...\n";
        
        // Create the table
        $createTableSQL = "
        CREATE TABLE gemini_api_keys (
            id BIGSERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            api_key TEXT NOT NULL,
            max_requests INTEGER NOT NULL DEFAULT 100,
            total_requests INTEGER NOT NULL DEFAULT 100,
            used_requests INTEGER NOT NULL DEFAULT 0,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP(0) NULL,
            updated_at TIMESTAMP(0) NULL
        );
        ";
        
        $pdo->exec($createTableSQL);
        echo "✅ gemini_api_keys table created successfully\n";
        
        // Insert a sample API key (you can replace this with your actual API key)
        $sampleApiKey = "AIzaSyDummyKeyReplaceWithYourActualKey123456789";
        $insertSQL = "
        INSERT INTO gemini_api_keys (name, api_key, max_requests, total_requests, used_requests, is_active, created_at, updated_at) 
        VALUES ('admin', ?, 100, 100, 0, true, NOW(), NOW())
        ";
        
        $stmt = $pdo->prepare($insertSQL);
        $stmt->execute([$sampleApiKey]);
        echo "✅ Sample API key inserted (replace with your actual key)\n";
    }
    
    // Verify the table now exists
    $stmt = $pdo->query("SELECT COUNT(*) FROM gemini_api_keys");
    $count = $stmt->fetchColumn();
    echo "📊 Final count: $count records in gemini_api_keys table\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n🎉 Script completed!\n";
echo "\nNext steps:\n";
echo "1. Test the API endpoint: https://naqashthaheem.com/api/admin/gemini-api-keys\n";
echo "2. Replace the sample API key with your actual Gemini API key\n";
echo "3. Check the admin panel functionality\n";
?>
