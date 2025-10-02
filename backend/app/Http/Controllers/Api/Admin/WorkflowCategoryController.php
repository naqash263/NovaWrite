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
        $categories = WorkflowCategory::withCount('workflows')->get();
        return response()->json($categories);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $category = WorkflowCategory::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'description' => $request->description,
        ]);

        return response()->json($category, 201);
    }

    public function show($id)
    {
        $category = WorkflowCategory::withCount('workflows')->findOrFail($id);
        return response()->json($category);
    }

    public function update(Request $request, $id)
    {
        $category = WorkflowCategory::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $category->update([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'description' => $request->description,
        ]);

        return response()->json($category);
    }

    public function destroy($id)
    {
        $category = WorkflowCategory::findOrFail($id);
        $category->delete();
        return response()->json(['message' => 'Workflow category deleted successfully']);
    }
}
