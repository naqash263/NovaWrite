<?php

namespace App\Console\Commands;

use App\Models\GeminiApiKey;
use App\Models\UserApiKey;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ResetApiLimitsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'api:reset-limits {--force : Force reset even if not needed}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset API limits for Gemini API keys to 100 requests daily';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting API limits reset process...');
        
        $force = $this->option('force');
        $resetCount = 0;
        
        // Reset Gemini API keys
        $geminiKeys = GeminiApiKey::where('is_active', true)->get();
        
        foreach ($geminiKeys as $key) {
            if ($force || $key->needsDailyReset()) {
                $key->resetDailyLimit();
                $resetCount++;
                $this->info("Reset API key: {$key->name} (ID: {$key->id})");
                Log::info("Daily API limit reset for Gemini key: {$key->name} (ID: {$key->id})");
            } else {
                $this->line("Skipping API key: {$key->name} - not due for reset yet");
            }
        }
        
        // Reset User API keys to 100 requests
        $userKeys = UserApiKey::where('is_active', true)->get();
        
        foreach ($userKeys as $key) {
            if ($force || $this->userKeyNeedsReset($key)) {
                $key->update([
                    'requests_per_key' => 100,
                    'usage_count' => 0
                ]);
                $resetCount++;
                $this->info("Reset user API key: {$key->name} (ID: {$key->id})");
                Log::info("Daily API limit reset for user key: {$key->name} (ID: {$key->id})");
            }
        }
        
        $this->info("API limits reset completed. {$resetCount} keys were reset.");
        Log::info("Daily API limits reset completed. {$resetCount} keys were reset.");
        
        return Command::SUCCESS;
    }
    
    /**
     * Check if a user API key needs reset
     */
    private function userKeyNeedsReset(UserApiKey $key): bool
    {
        // For user keys, we'll reset if they have less than 50 requests remaining
        // or if they've been used heavily (more than 80% of their limit)
        $remainingRequests = $key->remaining_requests;
        $usagePercentage = $key->requests_per_key > 0 
            ? ($key->usage_count / $key->requests_per_key) * 100 
            : 0;
            
        return $remainingRequests < 50 || $usagePercentage > 80;
    }
}
