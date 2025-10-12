<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\UserActivity;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class UserActivityController extends Controller
{
    /**
     * Get all user activities with pagination and filtering
     */
    public function index(Request $request): JsonResponse
    {
        $query = UserActivity::with('user:id,name,email');

        // Filter by user
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by activity type
        if ($request->has('activity_type')) {
            $query->where('activity_type', $request->activity_type);
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
            $query->where('description', 'like', '%' . $request->search . '%');
        }

        // Order by latest first
        $query->orderBy('created_at', 'desc');

        $activities = $query->paginate($request->per_page ?? 20);

        return response()->json([
            'success' => true,
            'data' => $activities
        ]);
    }

    /**
     * Get activities for a specific user
     */
    public function userActivities(Request $request, $userId): JsonResponse
    {
        $user = User::findOrFail($userId);

        $query = $user->activities();

        // Filter by activity type
        if ($request->has('activity_type')) {
            $query->where('activity_type', $request->activity_type);
        }

        // Filter by date range
        if ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // Order by latest first
        $query->orderBy('created_at', 'desc');

        $activities = $query->paginate($request->per_page ?? 20);

        return response()->json([
            'success' => true,
            'data' => $activities,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ]
        ]);
    }

    /**
     * Get activity statistics
     */
    public function statistics(Request $request): JsonResponse
    {
        $startDate = $request->start_date ?? now()->subDays(30);
        $endDate = $request->end_date ?? now();

        // Total activities
        $totalActivities = UserActivity::whereBetween('created_at', [$startDate, $endDate])->count();

        // Activities by type
        $activitiesByType = UserActivity::whereBetween('created_at', [$startDate, $endDate])
            ->select('activity_type', DB::raw('count(*) as count'))
            ->groupBy('activity_type')
            ->get();

        // Most active users
        $mostActiveUsers = UserActivity::whereBetween('created_at', [$startDate, $endDate])
            ->select('user_id', DB::raw('count(*) as activity_count'))
            ->groupBy('user_id')
            ->orderBy('activity_count', 'desc')
            ->limit(10)
            ->with('user:id,name,email')
            ->get();

        // Activities timeline (daily)
        $timeline = UserActivity::whereBetween('created_at', [$startDate, $endDate])
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Recent activities
        $recentActivities = UserActivity::with('user:id,name,email')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total_activities' => $totalActivities,
                'activities_by_type' => $activitiesByType,
                'most_active_users' => $mostActiveUsers,
                'timeline' => $timeline,
                'recent_activities' => $recentActivities,
            ],
            'date_range' => [
                'start' => $startDate,
                'end' => $endDate,
            ]
        ]);
    }

    /**
     * Get available activity types
     */
    public function activityTypes(): JsonResponse
    {
        $types = UserActivity::select('activity_type')
            ->distinct()
            ->pluck('activity_type');

        return response()->json([
            'success' => true,
            'data' => $types
        ]);
    }

    /**
     * Delete old activities (cleanup)
     */
    public function cleanup(Request $request): JsonResponse
    {
        $request->validate([
            'days' => 'required|integer|min:30', // Minimum 30 days
        ]);

        $date = now()->subDays($request->days);
        $deleted = UserActivity::where('created_at', '<', $date)->delete();

        return response()->json([
            'success' => true,
            'message' => "Deleted {$deleted} activities older than {$request->days} days",
            'deleted_count' => $deleted
        ]);
    }
}
