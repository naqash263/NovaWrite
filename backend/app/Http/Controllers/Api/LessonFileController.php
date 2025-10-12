<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\LessonFile;
use App\Models\File;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class LessonFileController extends Controller
{
    public function index($lessonId)
    {
        if (!Auth::check() || !Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $lesson = Lesson::findOrFail($lessonId);
        $lessonFiles = $lesson->lessonFiles()->with('file')->get();

        return response()->json($lessonFiles);
    }

    public function store(Request $request, $lessonId)
    {
        if (!Auth::check() || !Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $lesson = Lesson::findOrFail($lessonId);

        $validator = Validator::make($request->all(), [
            'file_id' => 'required|exists:files,id',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'order' => 'integer|min:0',
            'is_required' => 'boolean',
            'is_downloadable' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        // Check if file is already attached to this lesson
        $existingAttachment = LessonFile::where('lesson_id', $lessonId)
            ->where('file_id', $request->file_id)
            ->first();

        if ($existingAttachment) {
            return response()->json(['message' => 'File is already attached to this lesson'], 409);
        }

        $lessonFile = LessonFile::create([
            'lesson_id' => $lessonId,
            'file_id' => $request->file_id,
            'title' => $request->title,
            'description' => $request->description,
            'order' => $request->order ?? 0,
            'is_required' => $request->is_required ?? false,
            'is_downloadable' => $request->is_downloadable ?? true,
        ]);

        $lessonFile->load('file');

        return response()->json($lessonFile, 201);
    }

    public function show($lessonId, $id)
    {
        if (!Auth::check() || !Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $lessonFile = LessonFile::where('lesson_id', $lessonId)
            ->with('file')
            ->findOrFail($id);

        return response()->json($lessonFile);
    }

    public function update(Request $request, $lessonId, $id)
    {
        if (!Auth::check() || !Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $lessonFile = LessonFile::where('lesson_id', $lessonId)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'order' => 'integer|min:0',
            'is_required' => 'boolean',
            'is_downloadable' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $lessonFile->update($request->only([
            'title',
            'description',
            'order',
            'is_required',
            'is_downloadable',
        ]));

        $lessonFile->load('file');

        return response()->json($lessonFile);
    }

    public function destroy($lessonId, $id)
    {
        if (!Auth::check() || !Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $lessonFile = LessonFile::where('lesson_id', $lessonId)->findOrFail($id);
        $lessonFile->delete();

        return response()->json(['message' => 'File attachment removed successfully']);
    }

    public function reorder(Request $request, $lessonId)
    {
        if (!Auth::check() || !Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'file_orders' => 'required|array',
            'file_orders.*.id' => 'required|exists:lesson_files,id',
            'file_orders.*.order' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        foreach ($request->file_orders as $fileOrder) {
            LessonFile::where('id', $fileOrder['id'])
                ->where('lesson_id', $lessonId)
                ->update(['order' => $fileOrder['order']]);
        }

        return response()->json(['message' => 'File order updated successfully']);
    }
}




