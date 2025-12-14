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
            'data' => $emailQueue
        ]);
    }

    /**
     * Retry a failed email.
     */
    public function retry(EmailQueue $emailQueue): JsonResponse
    {
        if ($emailQueue->status !== 'failed') {
            return response()->json([
                'success' => false,
                'message' => 'Only failed emails can be retried'
            ], 422);
        }

        // Reset the queue item for retry
        $emailQueue->update([
            'status' => 'pending',
            'attempts' => 0,
            'last_error' => null,
            'next_retry_at' => now()
        ]);

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