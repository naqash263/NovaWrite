<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TagController extends Controller
{
    public function index(Request $request)
    {
        $query = Tag::withCount('posts');

        // Search filter
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Posts count filter will be handled after query execution

        // Color filter
        if ($request->has('color')) {
            $query->where('color', $request->color);
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

        // Recent tags filters
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

        $tags = $query->get();
        
        // Apply posts count filters after query execution
        if ($request->has('min_posts')) {
            $minPosts = (int) $request->min_posts;
            $tags = $tags->filter(function($tag) use ($minPosts) {
                return $tag->posts_count >= $minPosts;
            });
        }
        
        if ($request->has('max_posts')) {
            $maxPosts = (int) $request->max_posts;
            $tags = $tags->filter(function($tag) use ($maxPosts) {
                return $tag->posts_count <= $maxPosts;
            });
        }
        
        // Prepare response data
        $responseData = [
            'data' => $tags->values(), // Reset array keys
            'meta' => [
                'total' => $tags->count(),
                'search_applied' => $request->has('search'),
                'search_term' => $request->get('search'),
                'filters_applied' => $this->getAppliedFilters($request),
                'message' => $tags->isEmpty() ? 'No tags found matching your criteria.' : null
            ]
        ];
        
        return response()->json($responseData);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:tags,name',
            'description' => 'nullable|string',
            'color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        $tag = Tag::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'description' => $request->description,
            'color' => $request->color ?? '#3B82F6',
        ]);

        return response()->json($tag, 201);
    }

    public function show($id)
    {
        $tag = Tag::findOrFail($id);
        return response()->json($tag);
    }

    public function update(Request $request, $id)
    {
        $tag = Tag::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255|unique:tags,name,' . $id,
            'description' => 'nullable|string',
            'color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        $tag->update([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'description' => $request->description,
            'color' => $request->color ?? $tag->color,
        ]);

        return response()->json($tag);
    }

    public function destroy($id)
    {
        $tag = Tag::findOrFail($id);
        $tag->delete();

        return response()->json(['message' => 'Tag deleted successfully']);
    }

    /**
     * Get applied filters for metadata
     */
    private function getAppliedFilters(Request $request)
    {
        $filters = [];
        
        if ($request->has('search')) {
            $filters['search'] = $request->get('search');
        }
        
        if ($request->has('min_posts')) {
            $filters['min_posts'] = $request->get('min_posts');
        }
        
        if ($request->has('max_posts')) {
            $filters['max_posts'] = $request->get('max_posts');
        }
        
        if ($request->has('color')) {
            $filters['color'] = $request->get('color');
        }
        
        if ($request->has('created_from')) {
            $filters['created_from'] = $request->get('created_from');
        }
        
        if ($request->has('created_to')) {
            $filters['created_to'] = $request->get('created_to');
        }
        
        if ($request->has('updated_from')) {
            $filters['updated_from'] = $request->get('updated_from');
        }
        
        if ($request->has('updated_to')) {
            $filters['updated_to'] = $request->get('updated_to');
        }
        
        if ($request->has('created_year')) {
            $filters['created_year'] = $request->get('created_year');
        }
        
        if ($request->has('updated_year')) {
            $filters['updated_year'] = $request->get('updated_year');
        }
        
        if ($request->has('created_month')) {
            $filters['created_month'] = $request->get('created_month');
        }
        
        if ($request->has('updated_month')) {
            $filters['updated_month'] = $request->get('updated_month');
        }
        
        if ($request->has('recent_days')) {
            $filters['recent_days'] = $request->get('recent_days');
        }
        
        if ($request->has('recent_updated_days')) {
            $filters['recent_updated_days'] = $request->get('recent_updated_days');
        }
        
        return $filters;
    }
}