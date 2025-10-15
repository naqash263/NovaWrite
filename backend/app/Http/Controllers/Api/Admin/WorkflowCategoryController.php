<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\WorkflowCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class WorkflowCategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = WorkflowCategory::withCount('workflows');

        // Search filter
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Workflows count filter
        if ($request->has('min_workflows')) {
            $query->having('workflows_count', '>=', $request->min_workflows);
        }

        if ($request->has('max_workflows')) {
            $query->having('workflows_count', '<=', $request->max_workflows);
        }

        // Date range filters for created date
        if ($request->has('created_from')) {
            $query->whereDate('created_at', '>=', $request->created_from);
        }

        if ($request->has('created_to')) {
            $query->whereDate('created_at', '<=', $request->created_to);
        }

        // Date range filters for updated date
        if ($request->has('updated_from')) {
            $query->whereDate('updated_at', '>=', $request->updated_from);
        }

        if ($request->has('updated_to')) {
            $query->whereDate('updated_at', '<=', $request->updated_to);
        }

        // Year filters for different dates
        if ($request->has('created_year')) {
            $query->whereYear('created_at', $request->created_year);
        }

        if ($request->has('updated_year')) {
            $query->whereYear('updated_at', $request->updated_year);
        }

        // Month filters for different dates
        if ($request->has('created_month')) {
            $query->whereMonth('created_at', $request->created_month);
        }

        if ($request->has('updated_month')) {
            $query->whereMonth('updated_at', $request->updated_month);
        }

        // Recent categories filters
        if ($request->has('recent_days')) {
            $days = (int) $request->recent_days;
            $query->where('created_at', '>=', now()->subDays($days));
        }

        if ($request->has('recent_updated_days')) {
            $days = (int) $request->recent_updated_days;
            $query->where('updated_at', '>=', now()->subDays($days));
        }

        // Sort options
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');
        
        $allowedSortFields = ['name', 'created_at', 'updated_at', 'workflows_count'];
        if (in_array($sortBy, $allowedSortFields)) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            // Default sorting
            $query->orderBy('name', 'asc');
        }

        // Pagination
        $perPage = $request->get('per_page', 50);
        $perPage = min($perPage, 100); // Limit to 100 per page

        if ($request->has('paginate') && $request->paginate) {
            $categories = $query->paginate($perPage);
            return response()->json([
                'success' => true,
                'data' => $categories->items(),
                'pagination' => [
                    'current_page' => $categories->currentPage(),
                    'last_page' => $categories->lastPage(),
                    'per_page' => $categories->perPage(),
                    'total' => $categories->total(),
                ]
            ]);
        }

        $categories = $query->get();
        return response()->json([
            'success' => true,
            'data' => $categories
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:workflow_categories,name',
            'description' => 'nullable|string',
        ]);

        $category = WorkflowCategory::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'description' => $request->description,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Workflow category created successfully',
            'data' => $category
        ], 201);
    }

    public function show($id)
    {
        $category = WorkflowCategory::findOrFail($id);
        
        return response()->json([
            'success' => true,
            'data' => $category
        ]);
    }

    public function update(Request $request, $id)
    {
        $category = WorkflowCategory::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255|unique:workflow_categories,name,' . $id,
            'description' => 'nullable|string',
        ]);

        $category->update([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'description' => $request->description,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Workflow category updated successfully',
            'data' => $category
        ]);
    }

    public function destroy($id)
    {
        $category = WorkflowCategory::findOrFail($id);
        
        // Check if category has workflows
        if ($category->workflows()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete category that has workflows. Please move or delete the workflows first.'
            ], 422);
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Workflow category deleted successfully'
        ]);
    }
}