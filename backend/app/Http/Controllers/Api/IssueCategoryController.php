<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\IssueCategory;
use Illuminate\Http\JsonResponse;

class IssueCategoryController extends Controller
{
    /**
     * List all active issue categories
     */
    public function index(): JsonResponse
    {
        try {
            $categories = IssueCategory::active()->ordered()->get();

            \Log::info('Issue categories fetched', [
                'count' => $categories->count(),
                'categories' => $categories->pluck('name')->toArray()
            ]);

            return response()->json([
                'success' => true,
                'data' => $categories
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching issue categories', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch categories',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
