<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ResetAiCreditsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ai:reset-credits';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset AI API credits daily';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Resetting AI credits...');

        try {
            // Reset admin API keys usage
            $adminReset = DB::table('gemini_api_keys')
                ->where('is_active', true)
                ->update(['used_requests' => 0]);

            // Reset user API keys usage
            $userReset = DB::table('user_api_keys')
                ->where('is_active', true)
                ->update(['usage_count' => 0]);

            $this->info("✅ Reset complete!");
            $this->info("Admin API keys reset: {$adminReset}");
            $this->info("User API keys reset: {$userReset}");

            // Show current status
            $this->info("\nCurrent API Key Status:");
            $this->info("======================");

            $adminKeys = DB::table('gemini_api_keys')
                ->where('is_active', true)
                ->select('name', 'total_requests', 'used_requests')
                ->get();

            foreach ($adminKeys as $key) {
                $remaining = $key->total_requests - $key->used_requests;
                $this->info("Admin: {$key->name} - {$remaining}/{$key->total_requests} remaining");
            }

            $userKeys = DB::table('user_api_keys')
                ->where('is_active', true)
                ->select('name', 'requests_per_key', 'usage_count')
                ->get();

            foreach ($userKeys as $key) {
                $remaining = $key->requests_per_key - $key->usage_count;
                $this->info("User: {$key->name} - {$remaining}/{$key->requests_per_key} remaining");
            }

        } catch (\Exception $e) {
            $this->error("❌ Error resetting credits: " . $e->getMessage());
            return 1;
        }

        return 0;
    }
}