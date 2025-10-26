<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmailLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class EmailLogController extends Controller
{
    /**
     * Display a listing of email logs.
     */
    public function index(Request $request): JsonResponse
    {
        $query = EmailLog::query();

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

        $logs = $query->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $logs
        ]);
    }

    /**
     * Display the specified email log.
     */
    public function show(EmailLog $emailLog): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $emailLog
        ]);
    }

    /**
     * Get email log statistics.
     */
    public function stats(Request $request): JsonResponse
    {
        $days = $request->get('days', 30);
        $stats = EmailLog::getStatistics($days);

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}