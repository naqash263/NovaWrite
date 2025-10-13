<?php
/**
 * Fix Gemini API Keys Table - Web Accessible Version
 * This script creates only the gemini_api_keys table if it doesn't exist
 */

// Set content type to plain text for better readability
header('Content-Type: text/plain');

echo "🔧 Gemini API Keys Table Fix Script\n";
echo "==================================\n\n";

// Load Laravel environment
require_once __DIR__ . '/../../vendor/autoload.php';

$app = require_once __DIR__ . '/../../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    echo "✅ Laravel application loaded\n";
    
    // Check if gemini_api_keys table exists
    $tables = DB::select("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gemini_api_keys'");
    $tableExists = count($tables) > 0;
    
    if ($tableExists) {
        echo "✅ gemini_api_keys table already exists\n";
        
        // Check if there are any records
        $count = DB::table('gemini_api_keys')->count();
        echo "📊 Records in gemini_api_keys table: $count\n";
        
        if ($count > 0) {
            $apiKeys = DB::table('gemini_api_keys')->select('id', 'name', 'is_active', 'used_requests', 'total_requests')->get();
            echo "📝 Existing API keys:\n";
            foreach ($apiKeys as $key) {
                echo "  - ID: {$key->id}, Name: {$key->name}, Active: " . ($key->is_active ? 'Yes' : 'No') . ", Usage: {$key->used_requests}/{$key->total_requests}\n";
            }
        }
        
    } else {
        echo "❌ gemini_api_keys table does not exist\n";
        echo "🔧 Creating gemini_api_keys table...\n";
        
        // Create the table using Laravel's schema builder
        DB::statement("
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
            )
        ");
        
        echo "✅ gemini_api_keys table created successfully\n";
        
        // Insert a sample API key (replace with your actual key)
        $sampleApiKey = "AIzaSyDummyKeyReplaceWithYourActualKey123456789";
        DB::table('gemini_api_keys')->insert([
            'name' => 'admin',
            'api_key' => encrypt($sampleApiKey), // Encrypt the API key
            'max_requests' => 100,
            'total_requests' => 100,
            'used_requests' => 0,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);
        
        echo "✅ Sample API key inserted (replace with your actual key)\n";
        echo "⚠️  IMPORTANT: Replace the dummy API key with your real Gemini API key!\n";
    }
    
    // Verify the table now exists and test the API endpoint
    $count = DB::table('gemini_api_keys')->count();
    echo "📊 Final count: $count records in gemini_api_keys table\n";
    
    // Test if the API endpoint now works
    echo "\n🧪 Testing API endpoint...\n";
    $testUrl = (isset($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . '/api/admin/gemini-api-keys';
    echo "Test URL: $testUrl\n";
    echo "Note: You'll need to authenticate with a valid token to test this endpoint.\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n🎉 Script completed!\n";
echo "\nNext steps:\n";
echo "1. Test the API endpoint with authentication\n";
echo "2. Replace the sample API key with your actual Gemini API key\n";
echo "3. Check the admin panel functionality\n";
echo "4. Delete this script file for security\n";
?>
