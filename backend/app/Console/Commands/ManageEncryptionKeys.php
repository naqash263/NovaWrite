<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

class ManageEncryptionKeys extends Command
{
    protected $signature = 'encryption:manage 
                            {action : The action to perform (backup, restore, rotate, check)}
                            {--key= : The encryption key to use}
                            {--force : Force the action without confirmation}';

    protected $description = 'Manage encryption keys for CV AI API keys';

    public function handle()
    {
        $action = $this->argument('action');
        
        switch ($action) {
            case 'backup':
                $this->backupCurrentKey();
                break;
            case 'restore':
                $this->restoreKey();
                break;
            case 'rotate':
                $this->rotateKey();
                break;
            case 'check':
                $this->checkEncryptionHealth();
                break;
            default:
                $this->error('Invalid action. Use: backup, restore, rotate, or check');
                return 1;
        }
        
        return 0;
    }

    private function backupCurrentKey()
    {
        $currentKey = config('app.key');
        $backupFile = storage_path('app/encryption_key_backup.txt');
        
        if (file_exists($backupFile)) {
            if (!$this->option('force') && !$this->confirm('Backup file already exists. Overwrite?')) {
                $this->info('Backup cancelled.');
                return;
            }
        }
        
        file_put_contents($backupFile, $currentKey);
        $this->info("Current encryption key backed up to: {$backupFile}");
        
        // Also store in database for production
        DB::table('encryption_key_backups')->updateOrInsert(
            ['environment' => config('app.env')],
            [
                'key' => $currentKey,
                'backed_up_at' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]
        );
        
        $this->info('Key also stored in database for production access.');
    }

    private function restoreKey()
    {
        $key = $this->option('key');
        
        if (!$key) {
            // Try to load from backup file
            $backupFile = storage_path('app/encryption_key_backup.txt');
            if (file_exists($backupFile)) {
                $key = trim(file_get_contents($backupFile));
                $this->info("Loaded key from backup file.");
            } else {
                // Try to load from database
                $backup = DB::table('encryption_key_backups')
                    ->where('environment', config('app.env'))
                    ->first();
                
                if ($backup) {
                    $key = $backup->key;
                    $this->info("Loaded key from database backup.");
                } else {
                    $this->error('No backup key found. Please provide --key option.');
                    return;
                }
            }
        }
        
        if (!$this->option('force') && !$this->confirm("Are you sure you want to restore this key? This will affect all encrypted data.")) {
            $this->info('Restore cancelled.');
            return;
        }
        
        // Update the .env file
        $envFile = base_path('.env');
        $envContent = file_get_contents($envFile);
        $envContent = preg_replace('/^APP_KEY=.*/m', "APP_KEY={$key}", $envContent);
        file_put_contents($envFile, $envContent);
        
        $this->info("Encryption key restored. Please run: php artisan config:clear");
    }

    private function rotateKey()
    {
        $newKey = 'base64:' . base64_encode(random_bytes(32));
        
        if (!$this->option('force') && !$this->confirm("Generate new encryption key? This will make existing encrypted data unreadable.")) {
            $this->info('Key rotation cancelled.');
            return;
        }
        
        // Backup current key first
        $this->backupCurrentKey();
        
        // Update .env with new key
        $envFile = base_path('.env');
        $envContent = file_get_contents($envFile);
        $envContent = preg_replace('/^APP_KEY=.*/m', "APP_KEY={$newKey}", $envContent);
        file_put_contents($envFile, $envContent);
        
        $this->info("New encryption key generated: {$newKey}");
        $this->info("Please run: php artisan config:clear");
        $this->warn("WARNING: All existing encrypted data will be unreadable with the new key!");
    }

    private function checkEncryptionHealth()
    {
        $this->info('Checking encryption health...');
        
        // Check current key
        $currentKey = config('app.key');
        $this->info("Current APP_KEY: {$currentKey}");
        
        // Check API keys in database
        try {
            $apiKeys = DB::table('cv_ai_api_keys')->get();
            $this->info("Found {$apiKeys->count()} API keys in database");
        } catch (\Exception $e) {
            $this->warn("Could not access cv_ai_api_keys table: " . $e->getMessage());
            $apiKeys = collect();
        }
        
        $workingKeys = 0;
        $brokenKeys = 0;
        
        foreach ($apiKeys as $apiKey) {
            try {
                $decrypted = decrypt($apiKey->api_key);
                if ($decrypted) {
                    $workingKeys++;
                } else {
                    $brokenKeys++;
                }
            } catch (\Exception $e) {
                $brokenKeys++;
                $this->warn("Key ID {$apiKey->id}: Decryption failed - {$e->getMessage()}");
            }
        }
        
        $this->info("Working keys: {$workingKeys}");
        $this->info("Broken keys: {$brokenKeys}");
        
        if ($brokenKeys > 0) {
            $this->warn("Some API keys cannot be decrypted. Consider restoring a previous key.");
        } else {
            $this->info("All API keys are working correctly!");
        }
    }
}
