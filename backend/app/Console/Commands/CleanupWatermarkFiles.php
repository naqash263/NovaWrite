<?php

namespace App\Console\Commands;

use App\Services\VideoProcessingService;
use Illuminate\Console\Command;

class CleanupWatermarkFiles extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'watermark:cleanup {--hours=24 : Number of hours old files should be before cleanup}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up old watermark removal files';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $hours = (int) $this->option('hours');
        
        $this->info("Starting cleanup of files older than {$hours} hours...");
        
        $videoProcessingService = app(VideoProcessingService::class);
        $deletedCount = $videoProcessingService->cleanupOldFiles($hours);
        
        $this->info("Cleanup completed. Deleted {$deletedCount} files.");
        
        return Command::SUCCESS;
    }
}
