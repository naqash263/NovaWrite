<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\IssueCategory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class IssueCategoryController extends Controller
{
    /**
     * List all issue categories (admin view - includes inactive)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = IssueCategory::query();

            // Try to add issue count, but handle if issues table doesn't exist yet
            try {
                $query->withCount('issues');
            } catch (\Exception $e) {
                Log::warning('Could not load issue count: ' . $e->getMessage());
                // Continue without count
            }

            // Search filter
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            // Active filter
            if ($request->has('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            // Order by sort_order, then name
            $categories = $query->orderBy('sort_order')->orderBy('name')->get();

            // Manually add issue count if withCount failed
            if (!isset($categories[0]->issues_count)) {
                foreach ($categories as $category) {
                    try {
                        $category->issues_count = $category->issues()->count();
                    } catch (\Exception $e) {
                        $category->issues_count = 0;
                    }
                }
            }

            return response()->json([
                'success' => true,
                'data' => $categories
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching issue categories', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch categories',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Store a newly created issue category
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:issue_categories,name',
            'description' => 'nullable|string|max:1000',
            'color' => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
            'icon' => 'nullable|string|max:50',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $category = IssueCategory::create([
                'name' => $request->name,
                'description' => $request->description,
                'color' => $request->color ?? '#64748B',
                'icon' => $request->icon ?? 'tag',
                'is_active' => $request->boolean('is_active', true),
                'sort_order' => $request->sort_order ?? 99,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Issue category created successfully',
                'data' => $category
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating issue category: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create category'
            ], 500);
        }
    }

    /**
     * Display the specified issue category
     */
    public function show(string $id): JsonResponse
    {
        try {
            $category = IssueCategory::findOrFail($id);
            
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
            Log::error('Error fetching issue category', [
                'id' => $id,
                'message' => $e->getMessage()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Category not found'
            ], 404);
        }
    }

    /**
     * Update the specified issue category
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:issue_categories,name,' . $id,
            'description' => 'nullable|string|max:1000',
            'color' => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
            'icon' => 'nullable|string|max:50',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $category = IssueCategory::findOrFail($id);
            
            $category->update([
                'name' => $request->name,
                'description' => $request->description,
                'color' => $request->color ?? $category->color,
                'icon' => $request->icon ?? $category->icon,
                'is_active' => $request->has('is_active') ? $request->boolean('is_active') : $category->is_active,
                'sort_order' => $request->sort_order ?? $category->sort_order,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Issue category updated successfully',
                'data' => $category
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating issue category: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update category'
            ], 500);
        }
    }

    /**
     * Remove the specified issue category
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $category = IssueCategory::findOrFail($id);
            
            // Check if category has issues
            if ($category->issues()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete category with existing issues. Please reassign or delete issues first.'
                ], 422);
            }

            $category->delete();

            return response()->json([
                'success' => true,
                'message' => 'Issue category deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting issue category: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete category'
            ], 500);
        }
    }
}

