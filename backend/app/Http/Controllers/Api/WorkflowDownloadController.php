<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WorkflowDownload;
use App\Models\WorkflowFile;
use App\Models\File;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class WorkflowDownloadController extends Controller
{
    public function requestDownload(Request $request)
    {
        $request->validate([
            'workflow_file_id' => 'required|exists:workflow_files,id',
            'email' => 'required|email',
            'marketing_opt_in' => 'boolean',
        ]);

        $workflowFile = WorkflowFile::with(['workflow', 'file'])->findOrFail($request->workflow_file_id);

        if (!$workflowFile->is_active) {
            abort(403, 'This file is not available for download');
        }

        if ($workflowFile->workflow->status !== 'published') {
            abort(403, 'This workflow is not published');
        }

        if ($workflowFile->workflow->is_premium && !Auth::check()) {
            return response()->json([
                'message' => 'This is a premium workflow. Please login or register to access.',
                'requires_auth' => true,
            ], 401);
        }

        $download = WorkflowDownload::create([
            'workflow_id' => $workflowFile->workflow_id,
            'workflow_file_id' => $workflowFile->id,
            'email' => $request->email,
            'downloaded_at' => now(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'marketing_opt_in' => $request->marketing_opt_in ?? false,
        ]);

        $workflowFile->incrementDownloads();

        return response()->json([
            'message' => 'Download request recorded successfully',
            'download_url' => route('workflow-files.download', ['id' => $workflowFile->id, 'token' => $download->token]),
            'file_name' => $workflowFile->file->name,
        ]);
    }

    public function download($id, Request $request)
    {
        $request->validate([
            'token' => 'required|uuid',
        ]);

        $workflowFile = WorkflowFile::with(['workflow', 'file'])->findOrFail($id);
        
        $download = WorkflowDownload::where('token', $request->token)
            ->where('workflow_file_id', $workflowFile->id)
            ->firstOrFail();

        if ($download->isExpired()) {
            abort(403, 'Download link has expired');
        }

        if (!$workflowFile->is_active || $workflowFile->workflow->status !== 'published') {
            abort(403, 'This file is no longer available');
        }

        $file = $workflowFile->file;
        $filePath = storage_path('app/' . $file->path);

        if (!file_exists($filePath)) {
            abort(404, 'File not found');
        }

        return response()->download($filePath, $file->name, [
            'Content-Type' => $file->mime_type,
        ]);
    }
}
