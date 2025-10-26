<?php

namespace App\Console\Commands;

use App\Models\EmailQueue;
use App\Jobs\SendN8nEmail;
use Illuminate\Console\Command;

class ProcessEmailQueue extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'email:process-queue';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process pending email queue items that are ready for retry';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Processing email queue...');

        // Find items ready for retry
        $readyItems = EmailQueue::readyForRetry()->get();

        if ($readyItems->isEmpty()) {
            $this->info('No email queue items ready for processing.');
            return;
        }

        $this->info("Found {$readyItems->count()} items ready for processing.");

        $processed = 0;
        foreach ($readyItems as $item) {
            try {
                SendN8nEmail::dispatch($item);
                $processed++;
                $this->line("Queued email #{$item->id} ({$item->action} to {$item->recipient_email})");
            } catch (\Exception $e) {
                $this->error("Failed to queue email #{$item->id}: " . $e->getMessage());
            }
        }

        $this->info("Successfully queued {$processed} emails for processing.");
    }
}