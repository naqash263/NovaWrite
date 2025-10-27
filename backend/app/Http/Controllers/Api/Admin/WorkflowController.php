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
        
        // Check if no workflows found
        if ($workflows->isEmpty()) {
            return response()->json([
                'success' => true,
                'message' => 'No workflows found',
                'data' => []
            ]);
        }
        
        return response()->json($workflows);
    }

    public function store(Request $request)
    {
        $request->validate([
            'workflow_category_id' => 'required|exists:workflow_categories,id',
            'title' => 'required|string|max:255',
            'summary' => 'nullable|string',
            'description' => 'required|string',
            'tools' => 'nullable|array',
            'benefits' => 'nullable|array',
            'is_featured' => 'boolean',
            'status' => 'required|in:draft,published',
        ]);

        $workflow = Workflow::create([
            'workflow_category_id' => $request->workflow_category_id,
            'title' => $request->title,
            'slug' => Str::slug($request->title),
            'summary' => $request->summary,
            'description' => $request->description,
            'tools' => $request->tools ?? [],
            'benefits' => $request->benefits ?? [],
            'is_featured' => $request->is_featured ?? false,
            'status' => $request->status,
            'published_at' => $request->status === 'published' ? now() : null,
            'created_by' => Auth::id(),
            'updated_by' => Auth::id(),
        ]);

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
            'tools' => 'nullable|array',
            'benefits' => 'nullable|array',
            'is_featured' => 'boolean',
            'status' => 'required|in:draft,published',
        ]);

        $workflow->update([
            'workflow_category_id' => $request->workflow_category_id,
            'title' => $request->title,
            'slug' => Str::slug($request->title),
            'summary' => $request->summary,
            'description' => $request->description,
            'tools' => $request->tools ?? [],
            'benefits' => $request->benefits ?? [],
            'is_featured' => $request->is_featured ?? false,
            'status' => $request->status,
            'published_at' => $request->status === 'published' && !$workflow->published_at ? now() : $workflow->published_at,
            'updated_by' => Auth::id(),
        ]);

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
        $featured = Workflow::where('is_featured', true)->count();
        $premium = Workflow::where('is_premium', true)->count();
        $published = Workflow::where('is_published', true)->count();

        return response()->json([
            'total' => $total,
            'featured' => $featured,
            'premium' => $premium,
            'published' => $published
        ]);
    }
}
