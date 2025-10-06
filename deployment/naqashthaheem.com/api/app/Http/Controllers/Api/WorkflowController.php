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
            ->published()
            ->orderBy('is_featured', 'desc')
            ->orderBy('published_at', 'desc');

        if ($request->has('category_id')) {
            $query->where('workflow_category_id', $request->category_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
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
        
        return response()->json($categories);
    }
}
