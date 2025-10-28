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
            'expires_at' => now()->addHours(24), // Token expires after 24 hours
            'marketing_opt_in' => $marketingOptIn,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
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

        $downloadUrl = '';
        $baseUrl = url('/');
        
        // Non-premium workflows can download directly without any tracking
        // Premium workflows require token and tracking
        if ($workflowFile->workflow->is_premium) {
            // Premium workflow - create download record with token
            $download = WorkflowDownload::create($downloadData);
            // Don't increment here - will increment on actual download
            $downloadUrl = $baseUrl . '/api/workflow-files/' . $workflowFile->id . '/download?token=' . $download->token;
        } else {
            // Non-premium workflow - direct download, no tracking needed
            $downloadUrl = $baseUrl . '/api/workflow-files/' . $workflowFile->id . '/download';
        }

        return response()->json([
            'message' => $workflowFile->workflow->is_premium ? 'Download request recorded successfully' : 'Download ready',
            'download_url' => $downloadUrl,
            'file_name' => $workflowFile->file->name,
        ]);
    }

    public function download($id, Request $request)
    {
        \Log::info('Workflow download requested', [
            'id' => $id,
            'token' => $request->query('token'),
            'request_path' => $request->path(),
            'is_premium' => null, // will be set below
        ]);
        
        $workflowFile = WorkflowFile::with(['workflow', 'file'])->findOrFail($id);
        
        \Log::info('Workflow file found', [
            'workflow_file_id' => $workflowFile->id,
            'workflow_id' => $workflowFile->workflow_id,
            'file_id' => $workflowFile->file_id,
            'is_premium' => $workflowFile->workflow->is_premium,
            'is_active' => $workflowFile->is_active,
            'workflow_status' => $workflowFile->workflow->status,
        ]);

        // Check if workflow file has a file attached
        if (!$workflowFile->file) {
            abort(404, 'File not attached to this workflow file');
        }

        if (!$workflowFile->is_active || $workflowFile->workflow->status !== 'published') {
            abort(403, 'This file is no longer available');
        }

        // For premium workflows, require token validation
        if ($workflowFile->workflow->is_premium) {
            $request->validate([
                'token' => 'required',
            ]);

            $download = WorkflowDownload::where('token', $request->token)
                ->where('workflow_file_id', $workflowFile->id)
                ->firstOrFail();

            if ($download->isExpired()) {
                abort(403, 'Download link has expired');
            }
            
            // Mark premium download as completed
            $download->update(['downloaded_at' => now()]);
            $workflowFile->incrementDownloads();
        } else {
            // For non-premium workflows, increment download count without restriction
            $workflowFile->incrementDownloads();
        }

        $file = $workflowFile->file;
        $filePath = storage_path('app/public/' . $file->path);

        if (!file_exists($filePath)) {
            \Log::error('Workflow file not found in storage', [
                'workflow_file_id' => $workflowFile->id,
                'file_id' => $file->id,
                'file_path' => $filePath,
                'expected_path' => $file->path,
            ]);
            abort(404, 'File not found in storage');
        }

        return response()->download($filePath, $file->name, [
            'Content-Type' => $file->mime_type,
        ]);
    }
}
