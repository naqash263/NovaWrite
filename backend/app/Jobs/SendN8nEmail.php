<?php

namespace App\Jobs;

use App\Models\EmailQueue;
use App\Services\N8nEmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendN8nEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $emailQueue;

    /**
     * Create a new job instance.
     */
    public function __construct(EmailQueue $emailQueue)
    {
        $this->emailQueue = $emailQueue;
    }

    /**
     * Execute the job.
     */
    public function handle(N8nEmailService $n8nService): void
    {
        try {
            // Mark as processing
            $this->emailQueue->markAsProcessing();

            // Prepare recipient data
            $recipient = [
                'email' => $this->emailQueue->recipient_email,
                'name' => $this->emailQueue->recipient_name
            ];

            // Send to N8n
            $success = $n8nService->sendToN8n(
                $this->emailQueue->action,
                $recipient,
                $this->emailQueue->details
            );

            if ($success) {
                $this->emailQueue->markAsCompleted();
                Log::info("Email sent successfully via N8n", [
                    'queue_id' => $this->emailQueue->id,
                    'action' => $this->emailQueue->action,
                    'recipient' => $this->emailQueue->recipient_email
                ]);
            } else {
                $this->emailQueue->incrementAttempts();
                Log::warning("Email failed, will retry", [
                    'queue_id' => $this->emailQueue->id,
                    'attempts' => $this->emailQueue->attempts,
                    'max_attempts' => $this->emailQueue->max_attempts
                ]);
            }

        } catch (\Exception $e) {
            $this->emailQueue->markAsFailed($e->getMessage());
            Log::error("Email job failed with exception", [
                'queue_id' => $this->emailQueue->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        $this->emailQueue->markAsFailed($exception->getMessage());
        Log::error("Email job permanently failed", [
            'queue_id' => $this->emailQueue->id,
            'error' => $exception->getMessage()
        ]);
    }
}