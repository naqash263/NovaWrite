<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Workflow;
use App\Models\WorkflowCategory;
use Illuminate\Http\Request;

class WorkflowController extends Controller
{
    public function index(Request $request)
    {
        $query = Workflow::with(['category', 'files.file'])
            ->published();

        // Search filter
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('instructions', 'like', "%{$search}%");
            });
        }

        // Category filter
        if ($request->has('category_id')) {
            $query->where('workflow_category_id', $request->category_id);
        }

        // Category slug filter
        if ($request->has('category_slug')) {
            $query->whereHas('category', function($q) use ($request) {
                $q->where('slug', $request->category_slug);
            });
        }

        // Premium workflows filter
        if ($request->has('premium')) {
            $query->where('is_premium', filter_var($request->premium, FILTER_VALIDATE_BOOLEAN));
        }

        // Date range filters for published date
        if ($request->has('date_from')) {
            $query->whereDate('published_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('published_at', '<=', $request->date_to);
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
        if ($request->has('year')) {
            $query->whereYear('published_at', $request->year);
        }

        if ($request->has('created_year')) {
            $query->whereYear('created_at', $request->year);
        }

        if ($request->has('updated_year')) {
            $query->whereYear('updated_at', $request->year);
        }

        // Month filters for different dates
        if ($request->has('month')) {
            $query->whereMonth('published_at', $request->month);
        }

        if ($request->has('created_month')) {
            $query->whereMonth('created_at', $request->month);
        }

        if ($request->has('updated_month')) {
            $query->whereMonth('updated_at', $request->month);
        }

        // Recent workflows filters
        if ($request->has('recent_days')) {
            $days = (int) $request->recent_days;
            $query->where('created_at', '>=', now()->subDays($days));
        }

        if ($request->has('recent_updated_days')) {
            $days = (int) $request->recent_updated_days;
            $query->where('updated_at', '>=', now()->subDays($days));
        }

        // Downloads filter (popular workflows)
        if ($request->has('min_downloads')) {
            $query->where('downloads', '>=', $request->min_downloads);
        }

        // Author filter
        if ($request->has('author_id')) {
            $query->where('user_id', $request->author_id);
        }

        // Sort options
        $sortBy = $request->get('sort_by', 'published_at');
        $sortOrder = $request->get('sort_order', 'desc');
        
        $allowedSortFields = ['published_at', 'created_at', 'updated_at', 'title', 'downloads'];
        if (in_array($sortBy, $allowedSortFields)) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            // Default sorting when no valid sort field specified
            $query->orderBy('published_at', 'desc');
        }

        // Pagination
        $perPage = $request->get('per_page', 20);
        $perPage = min($perPage, 100); // Limit to 100 per page

        if ($request->has('paginate') && $request->paginate) {
            return $query->paginate($perPage);
        }

        $workflows = $query->get();
        return response()->json($workflows);
    }

    public function show($slug)
    {
        $workflow = Workflow::with(['category', 'files.file'])
            ->published()
            ->where('slug', $slug)
            ->firstOrFail();

        return response()->json($workflow);
    }

    public function categories()
    {
        $categories = WorkflowCategory::withCount(['workflows' => function($query) {
            $query->published();
        }])->get();
        
        // Check if no records found
        if ($categories->isEmpty()) {
            return response()->json([
                'message' => 'No records found',
                'data' => []
            ]);
        }
        
        return response()->json($categories);
    }
}
