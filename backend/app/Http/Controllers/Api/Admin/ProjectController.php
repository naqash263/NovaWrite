<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class ProjectController extends Controller
{
    public function index()
    {
        $projects = Project::orderBy('order', 'asc')
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($projects);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'summary' => 'nullable|string',
            'description' => 'required|string',
            'product_description' => 'nullable|string',
            'meta_description' => 'nullable|string',
            'meta_keywords' => 'nullable|string',
            'seo_title' => 'nullable|string|max:255',
            'image_url' => 'nullable|string',
            'project_url' => 'nullable|url',
            'github_url' => 'nullable|url',
            'technologies' => 'nullable|array',
            'features' => 'nullable|array',
            'status' => 'required|in:draft,in_progress,completed,archived',
            'is_published' => 'boolean',
            'is_featured' => 'boolean',
            'order' => 'nullable|integer',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $project = Project::create([
            'title' => $request->title,
            'slug' => Str::slug($request->title),
            'summary' => $request->summary,
            'description' => $request->description,
            'product_description' => $request->product_description,
            'meta_description' => $request->meta_description,
            'meta_keywords' => $request->meta_keywords,
            'seo_title' => $request->seo_title,
            'image_url' => $request->image_url,
            'project_url' => $request->project_url,
            'github_url' => $request->github_url,
            'technologies' => $request->technologies ?? [],
            'features' => $request->features ?? [],
            'status' => $request->status,
            'is_published' => $request->is_published ?? false,
            'is_featured' => $request->is_featured ?? false,
            'order' => $request->order ?? 0,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'published_at' => $request->is_published ? now() : null,
            'created_by' => Auth::id(),
            'updated_by' => Auth::id(),
        ]);

        Cache::put('projects.last_updated', now(), 86400);

        return response()->json($project, 201);
    }

    public function show($id)
    {
        $project = Project::findOrFail($id);
        return response()->json($project);
    }

    public function update(Request $request, $id)
    {
        $project = Project::findOrFail($id);

        $request->validate([
            'title' => 'required|string|max:255',
            'summary' => 'nullable|string',
            'description' => 'required|string',
            'product_description' => 'nullable|string',
            'meta_description' => 'nullable|string',
            'meta_keywords' => 'nullable|string',
            'seo_title' => 'nullable|string|max:255',
            'image_url' => 'nullable|string',
            'project_url' => 'nullable|url',
            'github_url' => 'nullable|url',
            'technologies' => 'nullable|array',
            'features' => 'nullable|array',
            'status' => 'required|in:draft,in_progress,completed,archived',
            'is_published' => 'boolean',
            'is_featured' => 'boolean',
            'order' => 'nullable|integer',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $updateData = [
            'title' => $request->title,
            'summary' => $request->summary,
            'description' => $request->description,
            'product_description' => $request->product_description,
            'meta_description' => $request->meta_description,
            'meta_keywords' => $request->meta_keywords,
            'seo_title' => $request->seo_title,
            'image_url' => $request->image_url,
            'project_url' => $request->project_url,
            'github_url' => $request->github_url,
            'technologies' => $request->technologies ?? [],
            'features' => $request->features ?? [],
            'status' => $request->status,
            'is_published' => $request->is_published ?? false,
            'is_featured' => $request->is_featured ?? false,
            'order' => $request->order ?? 0,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'updated_by' => Auth::id(),
        ];

        // Only update slug if title changed
        if ($project->title !== $request->title) {
            $updateData['slug'] = Str::slug($request->title);
        }

        // Handle published_at based on is_published
        if ($request->is_published && !$project->published_at) {
            $updateData['published_at'] = now();
        } elseif (!$request->is_published) {
            $updateData['published_at'] = null;
        }

        $project->update($updateData);

        Cache::put('projects.last_updated', now(), 86400);

        return response()->json($project);
    }

    public function destroy($id)
    {
        $project = Project::findOrFail($id);
        $project->delete();
        
        Cache::put('projects.last_updated', now(), 86400);
        
        return response()->json(['message' => 'Project deleted successfully']);
    }

    public function stats()
    {
        $total = Project::count();
        $published = Project::where('is_published', true)->count();
        $featured = Project::where('is_featured', true)->count();
        $draft = Project::where('status', 'draft')->count();

        return response()->json([
            'total' => $total,
            'published' => $published,
            'featured' => $featured,
            'draft' => $draft
        ]);
    }
}

