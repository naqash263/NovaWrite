<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\File;
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
        ], [
            'file.required' => 'Please select a file to upload.',
            'file.file' => 'The uploaded file is invalid.',
            'file.mimes' => 'Only JPG, PNG, GIF, WebP, SVG, PDF, DOC, DOCX, TXT, ZIP, and JSON files are allowed.',
            'file.max' => 'File size must not exceed 10MB.',
            'is_public.in' => 'The is_public field must be true or false.',
        ]);

        try {
            $uploadedFile = $request->file('file');
            $filename = time() . '_' . str_replace(' ', '_', $uploadedFile->getClientOriginalName());
            $path = $uploadedFile->storeAs('uploads', $filename, 'public');

            $file = File::create([
                'name' => pathinfo($uploadedFile->getClientOriginalName(), PATHINFO_FILENAME),
                'original_name' => $uploadedFile->getClientOriginalName(),
                'path' => $path,
                'mime_type' => $uploadedFile->getMimeType(),
                'size' => $uploadedFile->getSize(),
                'is_public' => $request->has('is_public') ? filter_var($request->is_public, FILTER_VALIDATE_BOOLEAN) : true,
                'user_id' => auth('api')->id(),
            ]);

            return response()->json([
                'message' => 'File uploaded successfully.',
                'file' => $file->load('user')
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
}
