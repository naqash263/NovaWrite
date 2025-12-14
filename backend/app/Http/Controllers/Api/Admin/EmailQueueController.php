<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmailQueue;
use App\Jobs\SendN8nEmail;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

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
     * Retry a failed email.
     */
    public function retry($id): JsonResponse
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
                'max_attempts' => $emailQueue->max_attempts,
                'debug_info' => [
                    'id' => $emailQueue->id,
                    'status' => $emailQueue->status,
                    'status_type' => gettype($emailQueue->status),
                    'is_failed' => $emailQueue->status === 'failed',
                    'attempts_check' => $emailQueue->attempts >= $emailQueue->max_attempts
                ]
            ], 422);
        }

        // Reset the queue item for retry
        $emailQueue->update([
            'status' => 'pending',
            'attempts' => 0,
            'last_error' => null,
            'failure_reason_code' => null,
            'failure_category' => null,
            'error_details' => null,
            'http_status_code' => null,
            'next_retry_at' => now()
        ]);

        // Refresh the model to get updated data
        $emailQueue->refresh();

        // Dispatch the job
        SendN8nEmail::dispatch($emailQueue);

        return response()->json([
            'success' => true,
            'message' => 'Email queued for retry',
            'data' => $emailQueue->fresh()
        ]);
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