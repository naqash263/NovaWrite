<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $query = Project::published();

        // Search filter
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('summary', 'like', "%{$search}%");
            });
        }

        // Featured filter
        if ($request->has('featured')) {
            $query->where('is_featured', filter_var($request->featured, FILTER_VALIDATE_BOOLEAN));
        }

        // Status filter
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Sort
        $sortBy = $request->get('sort_by', 'order');
        $sortOrder = $request->get('sort_order', 'asc');
        
        $allowedSortFields = ['order', 'published_at', 'created_at', 'updated_at', 'title'];
        if (in_array($sortBy, $allowedSortFields)) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->orderBy('order', 'asc')->orderBy('published_at', 'desc');
        }

        // Pagination
        $perPage = $request->get('per_page', 20);
        $perPage = min($perPage, 100);

        if ($request->has('paginate') && $request->paginate) {
            return $query->paginate($perPage);
        }

        $projects = $query->get();
        return response()->json($projects);
    }

    public function show($slug)
    {
        $project = Project::published()
            ->where('slug', $slug)
            ->firstOrFail();

        return response()->json($project);
    }
}

