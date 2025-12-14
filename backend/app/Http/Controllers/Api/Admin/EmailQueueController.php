<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmailQueue;
use App\Jobs\SendN8nEmail;
use App\Services\N8nEmailService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class EmailQueueController extends Controller
{
    /**
     * Display a listing of email queue items.
     */
    public function index(Request $request): JsonResponse
    {
        $query = EmailQueue::query();

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by action
        if ($request->has('action') && $request->action !== 'all') {
            $query->where('action', $request->action);
        }

        // Filter by date range
        if ($request->has('date_from')) {
            $query->where('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->where('created_at', '<=', $request->date_to);
        }

        // Search by recipient email
        if ($request->has('search')) {
            $query->where('recipient_email', 'like', '%' . $request->search . '%');
        }

        $queueItems = $query->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $queueItems
        ]);
    }

    /**
     * Display the specified email queue item.
     */
    public function show(EmailQueue $emailQueue): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $emailQueue,
            'can_retry' => $emailQueue->status === 'failed' || 
                          ($emailQueue->status === 'pending' && $emailQueue->attempts >= $emailQueue->max_attempts)
        ]);
    }

    /**
     * Retry a failed email - sends directly to N8n.
     */
    public function retry($id, N8nEmailService $n8nService): JsonResponse
    {
        // Find the email queue item by ID
        $emailQueue = EmailQueue::find($id);
        
        if (!$emailQueue) {
            return response()->json([
                'success' => false,
                'message' => 'Email queue item not found'
            ], 404);
        }

        // Allow retrying failed emails or pending emails that have reached max attempts
        $canRetry = $emailQueue->status === 'failed' || 
                   ($emailQueue->status === 'pending' && $emailQueue->attempts >= $emailQueue->max_attempts);

        if (!$canRetry) {
            return response()->json([
                'success' => false,
                'message' => 'Only failed emails or emails that have reached max attempts can be retried',
                'current_status' => $emailQueue->status,
                'attempts' => $emailQueue->attempts,
                'max_attempts' => $emailQueue->max_attempts
            ], 422);
        }

        // Mark as processing
        $emailQueue->markAsProcessing();

        // Prepare recipient data
        $recipient = [
            'email' => $emailQueue->recipient_email,
            'name' => $emailQueue->recipient_name ?? 'User'
        ];

        // Send directly to N8n
        try {
            $success = $n8nService->sendToN8n(
                $emailQueue->action,
                $recipient,
                $emailQueue->details ?? []
            );

            if ($success) {
                // Mark as completed
                $emailQueue->markAsCompleted();
                
                Log::info("Email retried and sent successfully via N8n", [
                    'queue_id' => $emailQueue->id,
                    'action' => $emailQueue->action,
                    'recipient' => $emailQueue->recipient_email
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Email sent successfully to N8n',
                    'data' => $emailQueue->fresh()
                ]);
            } else {
                // Increment attempts
                $emailQueue->incrementAttempts();
                
                // Get failure info from the last email log entry
                $lastLog = \App\Models\EmailLog::where('recipient_email', $emailQueue->recipient_email)
                    ->where('action', $emailQueue->action)
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
                    $emailQueue->update($failureInfo);
                }

                return response()->json([
                    'success' => false,
                    'message' => 'Email failed to send to N8n. Check email logs for details.',
                    'data' => $emailQueue->fresh(),
                    'attempts' => $emailQueue->attempts,
                    'max_attempts' => $emailQueue->max_attempts
                ], 500);
            }
        } catch (\Exception $e) {
            // Analyze the failure
            $failureInfo = \App\Services\EmailFailureAnalyzer::analyzeException($e);
            $failureInfo['provider_name'] = 'n8n';
            
            $emailQueue->markAsFailed($e->getMessage(), $failureInfo);
            
            Log::error("Email retry failed with exception", [
                'queue_id' => $emailQueue->id,
                'error' => $e->getMessage(),
                'failure_category' => $failureInfo['failure_category']
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error sending email to N8n: ' . $e->getMessage(),
                'data' => $emailQueue->fresh(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Retry all failed emails.
     */
    public function retryAll(): JsonResponse
    {
        $failedEmails = EmailQueue::where('status', 'failed')->get();
        $retryCount = 0;

        foreach ($failedEmails as $emailQueue) {
            // Reset the queue item for retry
            $emailQueue->update([
                'status' => 'pending',
                'attempts' => 0,
                'last_error' => null,
                'next_retry_at' => now()
            ]);

            // Dispatch the job
            SendN8nEmail::dispatch($emailQueue);
            $retryCount++;
        }

        return response()->json([
            'success' => true,
            'message' => "Retried {$retryCount} failed emails",
            'retry_count' => $retryCount
        ]);
    }

    /**
     * Get email queue statistics.
     */
    public function stats(): JsonResponse
    {
        $stats = [
            'total' => EmailQueue::count(),
            'pending' => EmailQueue::where('status', 'pending')->count(),
            'processing' => EmailQueue::where('status', 'processing')->count(),
            'completed' => EmailQueue::where('status', 'completed')->count(),
            'failed' => EmailQueue::where('status', 'failed')->count(),
        ];

        // Add success rate
        $stats['success_rate'] = $stats['total'] > 0 ? 
            round(($stats['completed'] / $stats['total']) * 100, 2) : 0;

        // Add recent activity (last 24 hours)
        $stats['recent_24h'] = EmailQueue::where('created_at', '>=', now()->subDay())->count();

        // Add common actions
        $stats['common_actions'] = EmailQueue::selectRaw('action, COUNT(*) as count')
            ->groupBy('action')
            ->orderBy('count', 'desc')
            ->limit(5)
            ->get();

        // Add failure analysis
        $stats['failure_categories'] = EmailQueue::getFailureCategories();
        $stats['failure_by_provider'] = EmailQueue::getFailureByProvider();

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}