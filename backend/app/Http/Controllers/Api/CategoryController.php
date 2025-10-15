<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Category::withCount('posts');

        // Search filter
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Posts count filter
        if ($request->has('min_posts')) {
            $query->having('posts_count', '>=', $request->min_posts);
        }

        if ($request->has('max_posts')) {
            $query->having('posts_count', '<=', $request->max_posts);
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
        
        $allowedSortFields = ['name', 'created_at', 'updated_at', 'posts_count'];
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
            return $query->paginate($perPage);
        }

        $categories = $query->get();
        return response()->json($categories);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $category = Category::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'description' => $request->description,
        ]);

        return response()->json($category, 201);
    }

    public function show($id)
    {
        $category = Category::withCount('posts')->findOrFail($id);
        return response()->json($category);
    }

    public function update(Request $request, $id)
    {
        $category = Category::findOrFail($id);

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
        $category = Category::findOrFail($id);
        $category->delete();
        return response()->json(['message' => 'Category deleted successfully']);
    }
}
