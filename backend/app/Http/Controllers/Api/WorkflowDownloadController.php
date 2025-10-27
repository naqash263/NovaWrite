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
            'email' => 'nullable|email',
            'marketing_opt_in' => 'boolean',
        ]);

        // Debug logging
        \Log::info('WorkflowDownload request', [
            'email' => $request->email,
            'marketing_opt_in' => $request->marketing_opt_in,
            'request_all' => $request->all(),
            'auth_web' => Auth::check(),
            'auth_api' => Auth::guard('api')->check(),
            'user_id' => Auth::id() ?? Auth::guard('api')->id(),
        ]);

        $workflowFile = WorkflowFile::with(['workflow', 'file'])->findOrFail($request->workflow_file_id);

        if (!$workflowFile->is_active) {
            abort(403, 'This file is not available for download');
        }

        if ($workflowFile->workflow->status !== 'published') {
            abort(403, 'This workflow is not published');
        }

        // Require authentication for premium workflows
        // Check both 'web' and 'api' guards since users can be authenticated via JWT
        $isAuthenticated = Auth::check() || Auth::guard('api')->check();
        
        if ($workflowFile->workflow->is_premium && !$isAuthenticated) {
            \Log::info('Premium workflow requires authentication', [
                'workflow_id' => $workflowFile->workflow_id,
                'is_premium' => $workflowFile->workflow->is_premium,
                'auth_check' => Auth::check(),
                'api_auth_check' => Auth::guard('api')->check(),
            ]);
            
            return response()->json([
                'message' => 'This workflow requires login to download. Please login or register to access.',
                'requires_auth' => true,
            ], 401);
        }

        // Get user ID if logged in (check both guards)
        $authenticatedUser = Auth::user() ?? Auth::guard('api')->user();
        
        // For logged-in users, automatically set marketing_opt_in to true
        // For anonymous users, use the request value or default to false
        $marketingOptIn = $authenticatedUser ? true : ($request->marketing_opt_in ?? false);
        
        $downloadData = [
            'workflow_id' => $workflowFile->workflow_id,
            'workflow_file_id' => $workflowFile->id,
            'downloaded_at' => now(),
            'marketing_opt_in' => $marketingOptIn,
        ];
        
        if ($authenticatedUser) {
            $downloadData['user_id'] = $authenticatedUser->id;
            
            // If logged in user doesn't provide email, use their user email
            if (!$request->email) {
                $downloadData['email'] = $authenticatedUser->email;
            }
        }

        if ($request->email) {
            $downloadData['email'] = $request->email;
        }

        $download = WorkflowDownload::create($downloadData);

        $workflowFile->incrementDownloads();

        return response()->json([
            'message' => 'Download request recorded successfully',
            'download_url' => route('workflow-files.download', ['id' => $workflowFile->id, 'token' => $download->download_token]),
            'file_name' => $workflowFile->file->name,
        ]);
    }

    public function download($id, Request $request)
    {
        $request->validate([
            'token' => 'required',
        ]);

        $workflowFile = WorkflowFile::with(['workflow', 'file'])->findOrFail($id);
        
        $download = WorkflowDownload::where('download_token', $request->token)
            ->where('workflow_file_id', $workflowFile->id)
            ->firstOrFail();

        if ($download->isExpired()) {
            abort(403, 'Download link has expired');
        }

        if (!$workflowFile->is_active || $workflowFile->workflow->status !== 'published') {
            abort(403, 'This file is no longer available');
        }

        $file = $workflowFile->file;
        $filePath = storage_path('app/public/' . $file->path);

        if (!file_exists($filePath)) {
            abort(404, 'File not found');
        }

        return response()->download($filePath, $file->name, [
            'Content-Type' => $file->mime_type,
        ]);
    }
}
