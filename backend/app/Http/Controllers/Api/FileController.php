<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\File;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FileController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api')->except(['download']);
    }

    public function index()
    {
        $files = File::with('user')->orderBy('created_at', 'desc')->get();
        return response()->json($files);
    }

    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:10240',
            'is_public' => 'boolean',
        ]);

        $uploadedFile = $request->file('file');
        $filename = time() . '_' . $uploadedFile->getClientOriginalName();
        $path = $uploadedFile->storeAs('uploads', $filename, 'public');

        $file = File::create([
            'name' => pathinfo($filename, PATHINFO_FILENAME),
            'original_name' => $uploadedFile->getClientOriginalName(),
            'path' => $path,
            'mime_type' => $uploadedFile->getMimeType(),
            'size' => $uploadedFile->getSize(),
            'is_public' => $request->is_public ?? true,
            'user_id' => auth('api')->id(),
        ]);

        return response()->json($file->load('user'), 201);
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

        return Storage::disk('public')->download($file->path, $file->original_name);
    }

    public function destroy($id)
    {
        $file = File::findOrFail($id);
        
        Storage::disk('public')->delete($file->path);
        $file->delete();

        return response()->json(['message' => 'File deleted successfully']);
    }
}
