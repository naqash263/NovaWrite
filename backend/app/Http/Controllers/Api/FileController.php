<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\File;
use App\Services\SeoFileNamingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FileController extends Controller
{
    public function index()
    {
        $files = File::with('user')->orderBy('created_at', 'desc')->get();
        return response()->json($files);
    }

    public function getByType($type)
    {
        $files = File::with('user')
            ->where('mime_type', 'like', $type . '/%')
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($files);
    }

    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:jpg,jpeg,png,gif,webp,svg,pdf,doc,docx,txt,zip,json|max:10240',
            'is_public' => 'nullable|in:true,false,1,0',
            'context' => 'nullable|string|max:100',
            'custom_name' => 'nullable|string|max:100',
        ], [
            'file.required' => 'Please select a file to upload.',
            'file.file' => 'The uploaded file is invalid.',
            'file.mimes' => 'Only JPG, PNG, GIF, WebP, SVG, PDF, DOC, DOCX, TXT, ZIP, and JSON files are allowed.',
            'file.max' => 'File size must not exceed 10MB.',
            'is_public.in' => 'The is_public field must be true or false.',
            'context.max' => 'Context must not exceed 100 characters.',
            'custom_name.max' => 'Custom name must not exceed 100 characters.',
        ]);

        try {
            $uploadedFile = $request->file('file');
            $context = $request->input('context');
            $customName = $request->input('custom_name');
            
            // Generate SEO-friendly filename and metadata
            $seoService = new SeoFileNamingService();
            $seoData = $seoService->generateSeoFilename($uploadedFile, $context, $customName);
            
            // Store file with SEO-friendly name
            $path = $uploadedFile->storeAs('uploads', $seoData['filename'], 'public');

            $file = File::create([
                'name' => pathinfo($uploadedFile->getClientOriginalName(), PATHINFO_FILENAME),
                'original_name' => $uploadedFile->getClientOriginalName(),
                'seo_name' => $seoData['seo_name'],
                'path' => $path,
                'mime_type' => $uploadedFile->getMimeType(),
                'size' => $uploadedFile->getSize(),
                'is_public' => $request->has('is_public') ? filter_var($request->is_public, FILTER_VALIDATE_BOOLEAN) : true,
                'user_id' => auth('api')->id(),
                'ai_metadata' => $seoData['ai_metadata'],
                'keywords' => $seoData['keywords'],
                'description' => $seoData['description'],
                'seo_score' => $seoData['ai_metadata']['seo_score'],
                'content_category' => $seoData['ai_metadata']['content_category'],
                'file_type_category' => $seoData['ai_metadata']['file_type'],
                'content_purpose' => $seoData['ai_metadata']['content_purpose'],
                'target_audience' => $seoData['ai_metadata']['target_audience'],
                'ai_tags' => $seoData['ai_metadata']['ai_tags'],
            ]);

            return response()->json([
                'message' => 'File uploaded successfully with SEO-friendly naming.',
                'file' => $file->load('user'),
                'seo_data' => [
                    'seo_name' => $seoData['seo_name'],
                    'filename' => $seoData['filename'],
                    'keywords' => $seoData['keywords'],
                    'description' => $seoData['description'],
                    'seo_score' => $seoData['ai_metadata']['seo_score']
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to upload file. Please try again.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        $file = File::with('user')->findOrFail($id);
        return response()->json($file);
    }

    public function download($id)
    {
        $file = File::findOrFail($id);

        if (!$file->is_public && (!auth('api')->check() || auth('api')->id() !== $file->user_id)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $file->increment('downloads');

        $filePath = Storage::disk('public')->path($file->path);
        
        if (!file_exists($filePath)) {
            return response()->json(['error' => 'File not found'], 404);
        }
        
        return response()->download($filePath, $file->original_name);
    }

    public function destroy($id)
    {
        $file = File::findOrFail($id);
        
        Storage::disk('public')->delete($file->path);
        $file->delete();

        return response()->json(['message' => 'File deleted successfully']);
    }

    /**
     * Search files by SEO keywords
     */
    public function search(Request $request)
    {
        $query = $request->get('q');
        $category = $request->get('category');
        $purpose = $request->get('purpose');
        $audience = $request->get('audience');
        $minSeoScore = $request->get('min_seo_score', 0);

        $files = File::query()
            ->where('is_public', true)
            ->when($query, function ($q) use ($query) {
                $q->where(function ($subQuery) use ($query) {
                    $subQuery->where('seo_name', 'like', "%{$query}%")
                        ->orWhere('description', 'like', "%{$query}%")
                        ->orWhereJsonContains('keywords', $query)
                        ->orWhere('original_name', 'like', "%{$query}%");
                });
            })
            ->when($category, function ($q) use ($category) {
                $q->where('content_category', $category);
            })
            ->when($purpose, function ($q) use ($purpose) {
                $q->where('content_purpose', $purpose);
            })
            ->when($audience, function ($q) use ($audience) {
                $q->where('target_audience', $audience);
            })
            ->where('seo_score', '>=', $minSeoScore)
            ->orderBy('seo_score', 'desc')
            ->orderBy('downloads', 'desc')
            ->with('user')
            ->paginate(20);

        return response()->json($files);
    }

    /**
     * Get file categories for filtering
     */
    public function getCategories()
    {
        $categories = File::where('is_public', true)
            ->whereNotNull('content_category')
            ->distinct()
            ->pluck('content_category')
            ->sort()
            ->values();

        return response()->json($categories);
    }

    /**
     * Get file purposes for filtering
     */
    public function getPurposes()
    {
        $purposes = File::where('is_public', true)
            ->whereNotNull('content_purpose')
            ->distinct()
            ->pluck('content_purpose')
            ->sort()
            ->values();

        return response()->json($purposes);
    }

    /**
     * Get target audiences for filtering
     */
    public function getAudiences()
    {
        $audiences = File::where('is_public', true)
            ->whereNotNull('target_audience')
            ->distinct()
            ->pluck('target_audience')
            ->sort()
            ->values();

        return response()->json($audiences);
    }

    /**
     * Get SEO statistics
     */
    public function getSeoStats()
    {
        $stats = [
            'total_files' => File::where('is_public', true)->count(),
            'avg_seo_score' => File::where('is_public', true)->avg('seo_score'),
            'high_seo_files' => File::where('is_public', true)->where('seo_score', '>=', 80)->count(),
            'categories' => File::where('is_public', true)
                ->whereNotNull('content_category')
                ->selectRaw('content_category, COUNT(*) as count')
                ->groupBy('content_category')
                ->orderBy('count', 'desc')
                ->get(),
            'purposes' => File::where('is_public', true)
                ->whereNotNull('content_purpose')
                ->selectRaw('content_purpose, COUNT(*) as count')
                ->groupBy('content_purpose')
                ->orderBy('count', 'desc')
                ->get(),
            'file_types' => File::where('is_public', true)
                ->whereNotNull('file_type_category')
                ->selectRaw('file_type_category, COUNT(*) as count')
                ->groupBy('file_type_category')
                ->orderBy('count', 'desc')
                ->get(),
        ];

        return response()->json($stats);
    }

    /**
     * Regenerate SEO data for existing file
     */
    public function regenerateSeo($id)
    {
        $file = File::findOrFail($id);
        
        try {
            // Create a mock UploadedFile object for the service
            $mockFile = new \Illuminate\Http\UploadedFile(
                Storage::disk('public')->path($file->path),
                $file->original_name,
                $file->mime_type,
                null,
                true
            );
            
            $seoService = new SeoFileNamingService();
            $seoData = $seoService->generateSeoFilename($mockFile);
            
            // Update file with new SEO data
            $file->update([
                'seo_name' => $seoData['seo_name'],
                'ai_metadata' => $seoData['ai_metadata'],
                'keywords' => $seoData['keywords'],
                'description' => $seoData['description'],
                'seo_score' => $seoData['ai_metadata']['seo_score'],
                'content_category' => $seoData['ai_metadata']['content_category'],
                'file_type_category' => $seoData['ai_metadata']['file_type'],
                'content_purpose' => $seoData['ai_metadata']['content_purpose'],
                'target_audience' => $seoData['ai_metadata']['target_audience'],
                'ai_tags' => $seoData['ai_metadata']['ai_tags'],
            ]);

            return response()->json([
                'message' => 'SEO data regenerated successfully.',
                'seo_data' => [
                    'seo_name' => $seoData['seo_name'],
                    'keywords' => $seoData['keywords'],
                    'description' => $seoData['description'],
                    'seo_score' => $seoData['ai_metadata']['seo_score']
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to regenerate SEO data.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Serve storage files
     */
    public function serve($path)
    {
        try {
            // Decode URL-encoded path
            $path = urldecode($path);
            
            // The path should be relative to storage/app/public/
            // Path format: converted-documents/filename.docx or uploads/filename.png
            $filePath = storage_path('app/public/' . $path);
            
            // Check if file exists
            if (!file_exists($filePath)) {
                \Log::warning('File not found', [
                    'requested_path' => $path,
                    'full_path' => $filePath,
                    'exists' => file_exists($filePath),
                    'storage_path' => storage_path('app/public'),
                    'directory_exists' => is_dir(dirname($filePath))
                ]);
                return response()->json(['message' => 'File not found'], 404);
            }
            
            // Get file info
            $mimeType = mime_content_type($filePath);
            $fileSize = filesize($filePath);
            $filename = basename($path);
            
            // Determine if this should be downloaded or displayed
            // For converted files, always download. For images, display inline.
            $isDownload = strpos($path, 'converted-') !== false || 
                         strpos($path, 'converted_') !== false ||
                         !in_array($mimeType, ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']);
            
            // Add CORS headers to allow cross-origin access
            $corsHeaders = [
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => 'GET, OPTIONS',
                'Access-Control-Allow-Headers' => 'Content-Type, Authorization',
                'Access-Control-Max-Age' => '86400',
            ];
            
            if ($isDownload) {
                // Use download response with proper headers
                $headers = array_merge([
                    'Content-Type' => $mimeType,
                    'Content-Length' => $fileSize,
                    'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                    'Cache-Control' => 'public, max-age=3600', // 1 hour cache for downloads
                ], $corsHeaders);
                
                return response()->download($filePath, $filename, $headers);
            } else {
                // Use file response for images (display inline)
                $headers = array_merge([
                    'Content-Type' => $mimeType,
                    'Content-Length' => $fileSize,
                    'Cache-Control' => 'public, max-age=31536000', // 1 year cache
                    'Last-Modified' => gmdate('D, d M Y H:i:s', filemtime($filePath)) . ' GMT',
                ], $corsHeaders);
                return response()->file($filePath, $headers);
            }
            
        } catch (\Exception $e) {
            \Log::error('Error serving file', [
                'path' => $path,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Error serving file.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
