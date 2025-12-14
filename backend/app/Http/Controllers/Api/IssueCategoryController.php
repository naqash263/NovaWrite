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

    /**
     * Display the specified issue category by ID
     */
    public function show(string $id): JsonResponse
    {
        try {
            // Only return active categories for public API
            $category = IssueCategory::active()->find($id);
            
            if (!$category) {
                return response()->json([
                    'success' => false,
                    'message' => 'Category not found'
                ], 404);
            }

            // Try to add issue count
            try {
                $category->loadCount('issues');
            } catch (\Exception $e) {
                // If issues table doesn't exist, set count to 0
                $category->issues_count = 0;
            }

            return response()->json([
                'success' => true,
                'data' => $category
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching issue category', [
                'id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch category',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
