<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AppAnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class AppAnalyticsController extends Controller
{
    private AppAnalyticsService $analyticsService;

    public function __construct(AppAnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    /**
     * Track app install event.
     */
    public function trackInstall(Request $request): JsonResponse
    {
        try {
            $userId = Auth::id();
            $customData = $request->only([
                'install_source',
                'app_version',
                'session_duration',
                'page_views'
            ]);

            $analytics = $this->analyticsService->trackInstall($request, $userId, $customData);

            return response()->json([
                'message' => 'Install event tracked successfully',
                'analytics_id' => $analytics->id
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Failed to track install event', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to track install event',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Track app uninstall event.
     */
    public function trackUninstall(Request $request): JsonResponse
    {
        try {
            $userId = Auth::id();
            $customData = $request->only([
                'uninstall_reason',
                'session_duration',
                'page_views'
            ]);

            $analytics = $this->analyticsService->trackUninstall($request, $userId, $customData);

            return response()->json([
                'message' => 'Uninstall event tracked successfully',
                'analytics_id' => $analytics->id
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Failed to track uninstall event', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to track uninstall event',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Track app launch event.
     */
    public function trackLaunch(Request $request): JsonResponse
    {
        try {
            $userId = Auth::id();
            $customData = $request->only([
                'app_version',
                'session_duration',
                'page_views'
            ]);

            $analytics = $this->analyticsService->trackLaunch($request, $userId, $customData);

            return response()->json([
                'message' => 'Launch event tracked successfully',
                'analytics_id' => $analytics->id
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Failed to track launch event', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to track launch event',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Track background app activity.
     */
    public function trackBackground(Request $request): JsonResponse
    {
        try {
            $userId = Auth::id();
            $customData = $request->only([
                'app_version',
                'session_duration',
                'page_views'
            ]);

            $analytics = $this->analyticsService->trackBackground($request, $userId, $customData);

            return response()->json([
                'message' => 'Background event tracked successfully',
                'analytics_id' => $analytics->id
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Failed to track background event', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to track background event',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get analytics dashboard data (Admin only).
     */
    public function getDashboard(Request $request): JsonResponse
    {
        try {
            $days = $request->get('days', 30);
            $startDate = $request->get('start_date');
            $endDate = $request->get('end_date');
            
            // If custom date range is provided, use it; otherwise use days
            if ($startDate && $endDate) {
                $data = $this->analyticsService->getDashboardDataByDateRange($startDate, $endDate);
            } else {
                $data = $this->analyticsService->getDashboardData($days);
            }

            return response()->json($data);

        } catch (\Exception $e) {
            \Log::error('Failed to get analytics dashboard', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to get analytics dashboard',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get analytics summary (Admin only).
     */
    public function getSummary(Request $request): JsonResponse
    {
        try {
            $startDate = $request->get('start_date');
            $endDate = $request->get('end_date');
            
            $summary = \App\Models\AppAnalytics::getSummary($startDate, $endDate);

            return response()->json($summary);

        } catch (\Exception $e) {
            \Log::error('Failed to get analytics summary', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to get analytics summary',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get retention data (Admin only).
     */
    public function getRetention(Request $request): JsonResponse
    {
        try {
            $days = $request->get('days', 30);
            $retentionData = \App\Models\AppAnalytics::getRetentionData($days);

            return response()->json([
                'retention_data' => $retentionData,
                'retention_rate' => count(array_filter($retentionData, fn($item) => $item['retained'])) / count($retentionData) * 100
            ]);

        } catch (\Exception $e) {
            \Log::error('Failed to get retention data', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to get retention data',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}