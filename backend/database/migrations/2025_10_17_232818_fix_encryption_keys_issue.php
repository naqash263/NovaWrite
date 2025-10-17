<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Get the current APP_KEY
        $currentKey = config('app.key');
        
        if (!$currentKey) {
            Log::error('No APP_KEY found in configuration');
            return;
        }
        
        Log::info('Current APP_KEY: ' . substr($currentKey, 0, 20) . '...');
        
        // Get all API keys that might have encryption issues
        $apiKeys = DB::table('gemini_api_keys')->get();
        
        foreach ($apiKeys as $apiKey) {
            try {
                // Try to decrypt the current key
                $decrypted = decrypt($apiKey->api_key);
                
                // If decryption succeeds, re-encrypt with current key to ensure consistency
                $reEncrypted = encrypt($decrypted);
                
                DB::table('gemini_api_keys')
                    ->where('id', $apiKey->id)
                    ->update(['api_key' => $reEncrypted]);
                    
                Log::info("Successfully re-encrypted API key ID: {$apiKey->id}");
                
            } catch (\Exception $e) {
                Log::warning("Failed to decrypt API key ID: {$apiKey->id} - {$e->getMessage()}");
                
                // If decryption fails, we need to either:
                // 1. Delete the invalid key, or
                // 2. Replace it with a working key
                
                // For now, let's delete invalid keys and log them
                DB::table('gemini_api_keys')->where('id', $apiKey->id)->delete();
                Log::info("Deleted invalid API key ID: {$apiKey->id}");
            }
        }
        
        // Create a backup of the current encryption key
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
            Log::info('Current encryption key backed up successfully');
        } catch (\Exception $e) {
            Log::warning('Failed to backup encryption key: ' . $e->getMessage());
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration is not reversible as it modifies data
    }
};