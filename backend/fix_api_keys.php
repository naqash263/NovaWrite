<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\GeminiApiKey;
use Illuminate\Support\Facades\Log;

echo "Fixing corrupted API keys...\n";

try {
    $adminKeys = GeminiApiKey::all();
    
    foreach ($adminKeys as $key) {
        echo "Processing key: {$key->name} (ID: {$key->id})\n";
        
        try {
            // Try to decrypt the current key
            $decrypted = decrypt($key->getRawOriginal('api_key'));
            if (strpos($decrypted, 'AIza') === 0) {
                echo "  ✓ Key is already working (single decrypt)\n";
                continue;
            } else {
                $doubleDecrypted = decrypt($decrypted);
                if (strpos($doubleDecrypted, 'AIza') === 0) {
                    echo "  ✓ Key is already working (double decrypt)\n";
                    continue;
                }
            }
        } catch (\Exception $e) {
            echo "  ✗ Key decryption failed: " . $e->getMessage() . "\n";
            
            // For now, we'll need to manually provide a valid API key
            // This is a temporary solution - in production, you should:
            // 1. Get a valid Gemini API key
            // 2. Update the database record with the new encrypted key
            
            echo "  ⚠ This key needs manual intervention\n";
            echo "  To fix: Update the database with a valid encrypted API key\n";
            echo "  Example SQL: UPDATE gemini_api_keys SET api_key = '" . encrypt('YOUR_VALID_API_KEY_HERE') . "' WHERE id = {$key->id};\n\n";
        }
    }
    
    echo "\nFix complete. Check the output above for keys that need manual intervention.\n";
    
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
