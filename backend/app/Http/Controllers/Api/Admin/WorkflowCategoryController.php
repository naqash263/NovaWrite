<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\WorkflowCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class WorkflowCategoryController extends Controller
{
    public function index()
    {
        $categories = WorkflowCategory::orderBy('name')->get();
        
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