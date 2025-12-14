<?php

namespace App\Jobs;

use App\Models\EmailQueue;
use App\Services\N8nEmailService;
use App\Services\EmailFailureAnalyzer;
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
                // Get failure info from the last email log entry
                $lastLog = \App\Models\EmailLog::where('recipient_email', $this->emailQueue->recipient_email)
                    ->where('action', $this->emailQueue->action)
                    ->orderBy('created_at', 'desc')
                    ->first();
                
                $failureInfo = null;
                if ($lastLog && $lastLog->status === 'failed') {
                    $failureInfo = [
                        'failure_reason_code' => $lastLog->failure_reason_code,
                        'failure_category' => $lastLog->failure_category,
                        'error_details' => $lastLog->error_details,
                        'http_status_code' => $lastLog->http_status_code,
                        'provider_name' => $lastLog->provider_name ?? 'n8n'
                    ];
                }

                $this->emailQueue->incrementAttempts();
                
                // Update failure info if available
                if ($failureInfo) {
                    $this->emailQueue->update($failureInfo);
                }
                
                Log::warning("Email failed, will retry", [
                    'queue_id' => $this->emailQueue->id,
                    'attempts' => $this->emailQueue->attempts,
                    'max_attempts' => $this->emailQueue->max_attempts,
                    'failure_category' => $failureInfo['failure_category'] ?? null
                ]);
            }

        } catch (\Exception $e) {
            // Analyze the failure
            $failureInfo = EmailFailureAnalyzer::analyzeException($e);
            $failureInfo['provider_name'] = 'n8n';
            
            $this->emailQueue->markAsFailed($e->getMessage(), $failureInfo);
            Log::error("Email job failed with exception", [
                'queue_id' => $this->emailQueue->id,
                'error' => $e->getMessage(),
                'failure_category' => $failureInfo['failure_category'],
                'failure_reason_code' => $failureInfo['failure_reason_code']
            ]);
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        // Analyze the failure
        $failureInfo = EmailFailureAnalyzer::analyzeException($exception);
        $failureInfo['provider_name'] = 'n8n';
        
        $this->emailQueue->markAsFailed($exception->getMessage(), $failureInfo);
        Log::error("Email job permanently failed", [
            'queue_id' => $this->emailQueue->id,
            'error' => $exception->getMessage(),
            'failure_category' => $failureInfo['failure_category'],
            'failure_reason_code' => $failureInfo['failure_reason_code']
        ]);
    }
}