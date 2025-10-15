<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\VideoProcessingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class WatermarkRemoverController extends Controller
{
    protected $videoProcessingService;

    public function __construct(VideoProcessingService $videoProcessingService)
    {
        $this->videoProcessingService = $videoProcessingService;
    }

    /**
     * Upload video file for watermark removal
     */
    public function upload(Request $request): JsonResponse
    {
        // Include custom PHP configuration
        require_once public_path('upload-config.php');
        
        // Set PHP limits for this request - more aggressive approach
        ini_set('upload_max_filesize', '50M');
        ini_set('post_max_size', '50M');
        ini_set('memory_limit', '256M');
        ini_set('max_execution_time', 300);
        ini_set('max_input_time', 300);
        
        // Force PHP to accept the new limits
        if (function_exists('ini_set')) {
            ini_set('upload_max_filesize', '50M');
            ini_set('post_max_size', '50M');
            ini_set('memory_limit', '256M');
            ini_set('max_execution_time', 300);
            ini_set('max_input_time', 300);
        }
        
        // Debug: Log request details
        \Log::info('Upload request received:', [
            'has_file' => $request->hasFile('video'),
            'all_files' => $request->allFiles(),
            'content_length' => $request->header('Content-Length'),
            'content_type' => $request->header('Content-Type')
        ]);
        
        $validator = Validator::make($request->all(), [
            'video' => 'required|file|max:51200', // 50MB max (51200 KB)
        ], [
            'video.required' => 'Please select a video file to upload.',
            'video.file' => 'The uploaded file is invalid.',
            'video.max' => 'Video file size must not exceed 50MB.',
        ]);

        // Custom validation for file extension
        if ($request->hasFile('video')) {
            $file = $request->file('video');
            $allowedExtensions = ['mp4', 'mov', 'avi', 'webm'];
            $extension = strtolower($file->getClientOriginalExtension());
            $mimeType = $file->getMimeType();
            $originalName = $file->getClientOriginalName();
            
            // Log file details for debugging
            \Log::info('File upload details:', [
                'original_name' => $originalName,
                'extension' => $extension,
                'mime_type' => $mimeType,
                'size' => $file->getSize(),
                'is_valid' => $file->isValid()
            ]);
            
            // Check if file is valid
            if (!$file->isValid()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => [
                        'video' => ['The uploaded file is invalid or corrupted.']
                    ]
                ], 422);
            }
            
            // Check file extension
            if (!in_array($extension, $allowedExtensions)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => [
                        'video' => ["File extension '{$extension}' is not allowed. Only MP4, MOV, AVI, and WebM video files are allowed."]
                    ]
                ], 422);
            }
        }

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = Auth::guard('api')->user();
            $uploadedFile = $request->file('video');
            
            // Generate unique filename
            $filename = time() . '_' . Str::random(10) . '.' . $uploadedFile->getClientOriginalExtension();
            $path = $uploadedFile->storeAs('watermark-removal/original', $filename, 'public');

            // Create job record
            $jobId = Str::uuid()->toString();
            $jobData = [
                'id' => $jobId,
                'user_id' => $user ? $user->id : null,
                'original_file_path' => $path,
                'original_filename' => $uploadedFile->getClientOriginalName(),
                'file_size' => $uploadedFile->getSize(),
                'mime_type' => $uploadedFile->getMimeType(),
                'status' => 'uploaded',
                'created_at' => now(),
                'updated_at' => now(),
            ];

            // Store job data in cache (in production, use database)
            cache()->put("watermark_job_{$jobId}", $jobData, now()->addHours(24));

            return response()->json([
                'success' => true,
                'message' => 'Video uploaded successfully',
                'data' => [
                    'job_id' => $jobId,
                    'filename' => $uploadedFile->getClientOriginalName(),
                    'file_size' => $uploadedFile->getSize(),
                    'status' => 'uploaded'
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload video',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process video to remove watermark
     */
    public function process(Request $request, string $jobId): JsonResponse
    {
        try {
            $jobData = cache()->get("watermark_job_{$jobId}");
            
            if (!$jobData) {
                return response()->json([
                    'success' => false,
                    'message' => 'Job not found or expired'
                ], 404);
            }

            // Update status to processing
            $jobData['status'] = 'processing';
            $jobData['updated_at'] = now();
            cache()->put("watermark_job_{$jobId}", $jobData, now()->addHours(24));

            // Process video using the service
            $result = $this->videoProcessingService->removeWatermark($jobData);

            if ($result['success']) {
                // Update job with processed file info
                $jobData['status'] = 'completed';
                $jobData['processed_file_path'] = $result['processed_path'];
                $jobData['updated_at'] = now();
                cache()->put("watermark_job_{$jobId}", $jobData, now()->addHours(24));

                return response()->json([
                    'success' => true,
                    'message' => 'Video processed successfully',
                    'data' => [
                        'job_id' => $jobId,
                        'status' => 'completed',
                        'processed_file_url' => Storage::disk('public')->url($result['processed_path'])
                    ]
                ]);
            } else {
                // Update job with error status
                $jobData['status'] = 'failed';
                $jobData['error_message'] = $result['error'];
                $jobData['updated_at'] = now();
                cache()->put("watermark_job_{$jobId}", $jobData, now()->addHours(24));

                return response()->json([
                    'success' => false,
                    'message' => 'Video processing failed',
                    'error' => $result['error']
                ], 500);
            }

        } catch (\Exception $e) {
            // Update job with error status
            if (isset($jobData)) {
                $jobData['status'] = 'failed';
                $jobData['error_message'] = $e->getMessage();
                $jobData['updated_at'] = now();
                cache()->put("watermark_job_{$jobId}", $jobData, now()->addHours(24));
            }

            return response()->json([
                'success' => false,
                'message' => 'Video processing failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get processing status
     */
    public function status(string $jobId): JsonResponse
    {
        try {
            $jobData = cache()->get("watermark_job_{$jobId}");
            
            if (!$jobData) {
                return response()->json([
                    'success' => false,
                    'message' => 'Job not found or expired'
                ], 404);
            }

            $response = [
                'success' => true,
                'data' => [
                    'job_id' => $jobId,
                    'status' => $jobData['status'],
                    'created_at' => $jobData['created_at'],
                    'updated_at' => $jobData['updated_at']
                ]
            ];

            if ($jobData['status'] === 'completed' && isset($jobData['processed_file_path'])) {
                $response['data']['processed_file_url'] = Storage::disk('public')->url($jobData['processed_file_path']);
            }

            if ($jobData['status'] === 'failed' && isset($jobData['error_message'])) {
                $response['data']['error_message'] = $jobData['error_message'];
            }

            return response()->json($response);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get job status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download processed video
     */
    public function download(string $jobId)
    {
        try {
            $jobData = cache()->get("watermark_job_{$jobId}");
            
            if (!$jobData) {
                return response()->json([
                    'success' => false,
                    'message' => 'Job not found or expired'
                ], 404);
            }

            if ($jobData['status'] !== 'completed' || !isset($jobData['processed_file_path'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Video is not ready for download'
                ], 400);
            }

            $filePath = Storage::disk('public')->path($jobData['processed_file_path']);
            
            if (!file_exists($filePath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Processed file not found'
                ], 404);
            }

            $originalName = pathinfo($jobData['original_filename'], PATHINFO_FILENAME);
            $downloadName = $originalName . '_no_watermark.mp4';

            return response()->download($filePath, $downloadName);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to download video',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user's processing history
     */
    public function history(Request $request): JsonResponse
    {
        try {
            $user = Auth::guard('api')->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required'
                ], 401);
            }

            // In a real implementation, this would query a database
            // For now, we'll return a mock response
            $history = [
                [
                    'job_id' => 'example-1',
                    'original_filename' => 'sample_video.mp4',
                    'status' => 'completed',
                    'created_at' => now()->subHours(2),
                    'processed_file_url' => Storage::disk('public')->url('watermark-removal/processed/example_processed.mp4')
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $history
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get processing history',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a processing job and its files
     */
    public function delete(string $jobId): JsonResponse
    {
        try {
            $jobData = cache()->get("watermark_job_{$jobId}");
            
            if (!$jobData) {
                return response()->json([
                    'success' => false,
                    'message' => 'Job not found or expired'
                ], 404);
            }

            // Delete files from storage
            if (isset($jobData['original_file_path'])) {
                Storage::disk('public')->delete($jobData['original_file_path']);
            }
            
            if (isset($jobData['processed_file_path'])) {
                Storage::disk('public')->delete($jobData['processed_file_path']);
            }

            // Remove from cache
            cache()->forget("watermark_job_{$jobId}");

            return response()->json([
                'success' => true,
                'message' => 'Job and files deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete job',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
