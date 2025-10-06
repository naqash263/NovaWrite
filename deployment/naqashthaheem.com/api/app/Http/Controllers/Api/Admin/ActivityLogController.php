<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $query = ActivityLog::with('user');

        // Filter by user
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by action
        if ($request->has('action')) {
            $query->where('action', $request->action);
        }

        // Filter by model type
        if ($request->has('model_type')) {
            $query->where('model_type', $request->model_type);
        }

        // Filter by date range
        if ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // Search in description
        if ($request->has('search')) {
            $search = $request->search;
            $query->where('description', 'like', "%{$search}%");
        }

        $logs = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 50));

        return response()->json($logs);
    }

    public function show($id)
    {
        $log = ActivityLog::with('user')->findOrFail($id);
        return response()->json($log);
    }

    public function getStats()
    {
        $stats = [
            'total_activities' => ActivityLog::count(),
            'today_activities' => ActivityLog::whereDate('created_at', today())->count(),
            'week_activities' => ActivityLog::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count(),
            'month_activities' => ActivityLog::whereMonth('created_at', now()->month)->count(),
        ];

        // Top actions
        $topActions = ActivityLog::selectRaw('action, COUNT(*) as count')
            ->groupBy('action')
            ->orderBy('count', 'desc')
            ->limit(10)
            ->get();

        // Recent activities
        $recentActivities = ActivityLog::with('user')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Activity by model type
        $activityByModel = ActivityLog::selectRaw('model_type, COUNT(*) as count')
            ->whereNotNull('model_type')
            ->groupBy('model_type')
            ->orderBy('count', 'desc')
            ->get();

        return response()->json([
            'stats' => $stats,
            'top_actions' => $topActions,
            'recent_activities' => $recentActivities,
            'activity_by_model' => $activityByModel,
        ]);
    }

    public function getUserActivity($userId, Request $request)
    {
        $query = ActivityLog::where('user_id', $userId);

        if ($request->has('limit')) {
            $query->limit($request->limit);
        }

        $activities = $query->orderBy('created_at', 'desc')->get();

        return response()->json($activities);
    }

    public function clear(Request $request)
    {
        $request->validate([
            'older_than_days' => 'nullable|integer|min:1',
        ]);

        $query = ActivityLog::query();

        if ($request->has('older_than_days')) {
            $query->where('created_at', '<', now()->subDays($request->older_than_days));
        }

        $deletedCount = $query->delete();

        ActivityLog::log('activity_logs_cleared', null, "Cleared {$deletedCount} activity log entries");

        return response()->json([
            'message' => "Successfully cleared {$deletedCount} activity log entries",
            'deleted_count' => $deletedCount
        ]);
    }

    public function export(Request $request)
    {
        $query = ActivityLog::with('user');

        // Apply same filters as index
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('action')) {
            $query->where('action', $request->action);
        }

        if ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $logs = $query->orderBy('created_at', 'desc')->get();

        $csvData = [];
        $csvData[] = ['Date', 'User', 'Action', 'Model', 'Description', 'IP Address'];

        foreach ($logs as $log) {
            $csvData[] = [
                $log->created_at->format('Y-m-d H:i:s'),
                $log->user ? $log->user->name : 'System',
                $log->action,
                $log->model_type ?? 'N/A',
                $log->description ?? 'N/A',
                $log->ip_address ?? 'N/A',
            ];
        }

        $filename = 'activity_logs_' . now()->format('Y_m_d_H_i_s') . '.csv';
        
        return response()->json([
            'filename' => $filename,
            'data' => $csvData,
            'count' => count($csvData) - 1 // Subtract header row
        ]);
    }
}