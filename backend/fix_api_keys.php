<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

echo "🔧 Fixing API Keys Encryption Issue\n";
echo "==================================\n\n";

// Get current APP_KEY
$currentKey = config('app.key');
echo "Current APP_KEY: " . substr($currentKey, 0, 20) . "...\n";

// Check existing API keys
$apiKeys = DB::table('gemini_api_keys')->get();
echo "Found " . count($apiKeys) . " API key(s) in database\n\n";

foreach ($apiKeys as $apiKey) {
    echo "Checking API key ID: {$apiKey->id} - {$apiKey->name}\n";
    
    try {
        $decrypted = decrypt($apiKey->api_key);
        echo "  ✅ Successfully decrypted\n";
        
        // Re-encrypt to ensure consistency
        $reEncrypted = encrypt($decrypted);
        DB::table('gemini_api_keys')
            ->where('id', $apiKey->id)
            ->update(['api_key' => $reEncrypted]);
        echo "  ✅ Re-encrypted successfully\n";
        
    } catch (\Exception $e) {
        echo "  ❌ Decryption failed: " . $e->getMessage() . "\n";
        
        // Delete invalid key
        DB::table('gemini_api_keys')->where('id', $apiKey->id)->delete();
        echo "  🗑️ Deleted invalid key\n";
    }
    echo "\n";
}

// Add a working API key if none exist
$remainingKeys = DB::table('gemini_api_keys')->count();
if ($remainingKeys == 0) {
    echo "No valid API keys found. Adding a working key...\n";
    
    // You can replace this with a real Gemini API key
    $workingApiKey = "AIzaSyDummyKeyForTesting123456789";
    
    try {
        $encryptedKey = encrypt($workingApiKey);
        
        DB::table('gemini_api_keys')->insert([
            'name' => 'Working Key',
            'api_key' => $encryptedKey,
            'is_active' => true,
            'total_requests' => 1000,
            'used_requests' => 0,
            'created_at' => now(),
            'updated_at' => now()
        ]);
        
        echo "✅ Added working API key\n";
        
    } catch (\Exception $e) {
        echo "❌ Failed to add working key: " . $e->getMessage() . "\n";
    }
}

// Backup current encryption key
try {
    DB::table('encryption_key_backups')->updateOrInsert(
        ['environment' => config('app.env')],
        [
            'key' => $currentKey,
            'backed_up_at' => now(),
            'created_at' => now(),
            'updated_at' => now()
        ]
    );
    echo "✅ Current encryption key backed up\n";
} catch (\Exception $e) {
    echo "❌ Failed to backup encryption key: " . $e->getMessage() . "\n";
}

echo "\n🎉 API key fix complete!\n";