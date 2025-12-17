<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\GeminiN8nFallbackService;
use App\Models\GeminiFallbackLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class GeminiFallbackController extends Controller
{
    protected $fallbackService;

    public function __construct(GeminiN8nFallbackService $fallbackService)
    {
        $this->fallbackService = $fallbackService;
    }

    /**
     * Get fallback statistics
     */
    public function getStats(Request $request): JsonResponse
    {
        try {
            $days = $request->input('days', 7);
            $toolType = $request->input('tool_type');

            if ($toolType) {
                // Get stats for specific tool
                $stats = GeminiFallbackLog::getToolStats($toolType, $days);
                
                return response()->json([
                    'success' => true,
                    'data' => $stats
                ]);
            }

            // Get overall stats
            $overallStats = GeminiFallbackLog::getOverallStats($days);
            $reasonStats = GeminiFallbackLog::getReasonStats($days);
            
            // Get stats by tool type
            $toolStats = [];
            foreach (GeminiFallbackLog::TOOL_TYPES as $type => $name) {
                $toolStats[$type] = GeminiFallbackLog::getToolStats($type, $days);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'overall' => $overallStats,
                    'by_reason' => $reasonStats,
                    'by_tool' => $toolStats
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching fallback stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch statistics'
            ], 500);
        }
    }

    /**
     * Get fallback logs
     */
    public function getLogs(Request $request): JsonResponse
    {
        try {
            $query = GeminiFallbackLog::query();

            // Filter by tool type
            if ($request->has('tool_type')) {
                $query->where('tool_type', $request->input('tool_type'));
            }

            // Filter by fallback reason
            if ($request->has('fallback_reason')) {
                $query->where('fallback_reason', $request->input('fallback_reason'));
            }

            // Filter by success
            if ($request->has('success')) {
                $query->where('success', $request->boolean('success'));
            }

            // Date range
            if ($request->has('start_date')) {
                $query->where('created_at', '>=', $request->input('start_date'));
            }
            if ($request->has('end_date')) {
                $query->where('created_at', '<=', $request->input('end_date'));
            }

            // Pagination
            $limit = $request->input('limit', 50);
            $page = $request->input('page', 1);
            
            $logs = $query->orderBy('created_at', 'desc')
                ->paginate($limit, ['*'], 'page', $page);

            return response()->json([
                'success' => true,
                'data' => [
                    'logs' => $logs->items(),
                    'pagination' => [
                        'current_page' => $logs->currentPage(),
                        'last_page' => $logs->lastPage(),
                        'per_page' => $logs->perPage(),
                        'total' => $logs->total()
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching fallback logs: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch logs'
            ], 500);
        }
    }

    /**
     * Get fallback health status
     */
    public function getHealth(Request $request): JsonResponse
    {
        try {
            $isAvailable = $this->fallbackService->isFallbackAvailable();
            
            $lastTest = null;
            $testResult = null;
            
            // Optionally run a quick test
            if ($request->input('test', false)) {
                $testResult = $this->fallbackService->testConnection();
                $lastTest = now()->toISOString();
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'enabled' => $isAvailable,
                    'webhook_configured' => $isAvailable,
                    'last_test' => $lastTest,
                    'test_result' => $testResult,
                    'status' => $isAvailable ? 'healthy' : 'unavailable'
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error checking fallback health: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to check health'
            ], 500);
        }
    }

    /**
     * Test N8N fallback connection
     */
    public function testConnection(): JsonResponse
    {
        try {
            $result = $this->fallbackService->testConnection();

            return response()->json([
                'success' => $result['success'],
                'message' => $result['message'],
                'data' => $result
            ]);
        } catch (\Exception $e) {
            Log::error('Error testing fallback connection: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to test connection: ' . $e->getMessage()
            ], 500);
        }
    }
}
