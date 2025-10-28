<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Workflow;
use App\Models\WorkflowFile;
use App\Events\NewWorkflow;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;

class WorkflowController extends Controller
{
    public function index()
    {
        $workflows = Workflow::with(['category', 'files.file'])
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($workflows);
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'workflow_category_id' => 'required|exists:workflow_categories,id',
                'title' => 'required|string|max:255',
                'summary' => 'nullable|string',
                'description' => 'required|string',
                'instructions' => 'nullable|string',
                'tools' => 'nullable|array',
                'benefits' => 'nullable|array',
                'tags' => 'nullable|array',
                'estimated_time' => 'nullable|string|max:255',
                'difficulty' => 'nullable|in:beginner,intermediate,advanced',
                'is_premium' => 'boolean',
                'status' => 'required|in:draft,published',
            ]);

            $workflow = Workflow::create([
                'workflow_category_id' => $request->workflow_category_id,
                'title' => $request->title,
                'slug' => Str::slug($request->title),
                'summary' => $request->summary,
                'description' => $request->description,
                'instructions' => $request->instructions,
                'tools' => $request->tools ?? [],
                'benefits' => $request->benefits ?? [],
                'estimated_time' => $request->estimated_time,
                'difficulty' => $request->difficulty,
                'tags' => $request->tags ?? [],
                'is_premium' => $request->boolean('is_premium', false),
                'status' => $request->status,
                'is_published' => $request->status === 'published',
                'published_at' => $request->status === 'published' ? now() : null,
                'image_url' => $request->image_url ?? null,
                'created_by' => Auth::id() ?? null,
                'updated_by' => Auth::id() ?? null,
            ]);
        } catch (\Exception $e) {
            \Log::error('Workflow creation error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            throw $e;
        }

        // Dispatch event for push notifications (only for published workflows)
        if ($workflow->status === 'published') {
            event(new NewWorkflow($workflow));
        }

        return response()->json($workflow->load(['category', 'files']), 201);
    }

    public function show($id)
    {
        $workflow = Workflow::with(['category', 'files.file'])->findOrFail($id);
        return response()->json($workflow);
    }

    public function update(Request $request, $id)
    {
        $workflow = Workflow::findOrFail($id);

        $request->validate([
            'workflow_category_id' => 'required|exists:workflow_categories,id',
            'title' => 'required|string|max:255',
            'summary' => 'nullable|string',
            'description' => 'required|string',
            'instructions' => 'nullable|string',
            'tools' => 'nullable|array',
            'benefits' => 'nullable|array',
            'tags' => 'nullable|array',
            'estimated_time' => 'nullable|string|max:255',
            'difficulty' => 'nullable|in:beginner,intermediate,advanced',
            'is_premium' => 'boolean',
            'status' => 'required|in:draft,published',
        ]);

        $updateData = [
            'workflow_category_id' => $request->workflow_category_id,
            'title' => $request->title,
            'description' => $request->description,
            'status' => $request->status,
            'updated_by' => Auth::id(),
        ];

        // Only update fields if they are provided (preserve existing values if not sent)
        if ($request->has('summary')) {
            $updateData['summary'] = $request->summary;
        }
        if ($request->has('instructions')) {
            $updateData['instructions'] = $request->instructions;
        }
        if ($request->has('tools')) {
            $updateData['tools'] = $request->tools ?? [];
        }
        if ($request->has('benefits')) {
            $updateData['benefits'] = $request->benefits ?? [];
        }
        if ($request->has('tags')) {
            $updateData['tags'] = $request->tags ?? [];
        }
        if ($request->has('estimated_time')) {
            $updateData['estimated_time'] = $request->estimated_time;
        }
        if ($request->has('difficulty')) {
            $updateData['difficulty'] = $request->difficulty;
        }
        if ($request->has('is_premium')) {
            $updateData['is_premium'] = $request->boolean('is_premium');
        }
        // Preserve existing image_url if not provided or empty
        if ($request->has('image_url')) {
            $updateData['image_url'] = $request->image_url ?: $workflow->image_url;
        } else {
            // If image_url is not in request, preserve existing value
            $updateData['image_url'] = $workflow->image_url;
        }

        // Only update slug if title changed
        if ($workflow->title !== $request->title) {
            $updateData['slug'] = Str::slug($request->title);
        }

        // Handle published_at based on status
        if ($request->status === 'published') {
            if (!$workflow->published_at) {
                $updateData['published_at'] = now();
            }
            $updateData['is_published'] = true;
        } else {
            $updateData['published_at'] = null;
            $updateData['is_published'] = false;
        }

        $workflow->update($updateData);

        return response()->json($workflow->load(['category', 'files']));
    }

    public function destroy($id)
    {
        $workflow = Workflow::findOrFail($id);
        $workflow->delete();
        return response()->json(['message' => 'Workflow deleted successfully']);
    }

    public function attachFile(Request $request, $id)
    {
        $workflow = Workflow::findOrFail($id);

        $request->validate([
            'file_id' => 'required|exists:files,id',
            'display_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'sort_order' => 'nullable|integer',
        ]);

        $workflowFile = WorkflowFile::create([
            'workflow_id' => $workflow->id,
            'file_id' => $request->file_id,
            'display_name' => $request->display_name,
            'description' => $request->description,
            'sort_order' => $request->sort_order ?? 0,
        ]);

        return response()->json($workflowFile->load('file'), 201);
    }

    public function detachFile($id, $fileId)
    {
        $workflow = Workflow::findOrFail($id);
        $workflowFile = WorkflowFile::where('workflow_id', $workflow->id)
            ->where('id', $fileId)
            ->firstOrFail();
        
        $workflowFile->delete();
        return response()->json(['message' => 'File detached successfully']);
    }

    public function stats()
    {
        $total = Workflow::count();
        $premium = Workflow::where('is_premium', true)->count();
        $published = Workflow::where('is_published', true)->count();

        return response()->json([
            'total' => $total,
            'premium' => $premium,
            'published' => $published
        ]);
    }
}
