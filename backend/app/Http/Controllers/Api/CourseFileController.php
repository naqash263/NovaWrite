<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseFile;
use App\Models\File;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class CourseFileController extends Controller
{
    public function index($courseId)
    {
        if (!Auth::check() || !Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $course = Course::findOrFail($courseId);
        $courseFiles = $course->courseFiles()->with('file')->get();

        return response()->json($courseFiles);
    }

    public function store(Request $request, $courseId)
    {
        if (!Auth::check() || !Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $course = Course::findOrFail($courseId);

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

        // Check if file is already attached to this course
        $existingAttachment = CourseFile::where('course_id', $courseId)
            ->where('file_id', $request->file_id)
            ->first();

        if ($existingAttachment) {
            return response()->json(['message' => 'File is already attached to this course'], 409);
        }

        $courseFile = CourseFile::create([
            'course_id' => $courseId,
            'file_id' => $request->file_id,
            'title' => $request->title,
            'description' => $request->description,
            'order' => $request->order ?? 0,
            'is_required' => $request->is_required ?? false,
            'is_downloadable' => $request->is_downloadable ?? true,
        ]);

        $courseFile->load('file');

        return response()->json($courseFile, 201);
    }

    public function show($courseId, $id)
    {
        if (!Auth::check() || !Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $courseFile = CourseFile::where('course_id', $courseId)
            ->with('file')
            ->findOrFail($id);

        return response()->json($courseFile);
    }

    public function update(Request $request, $courseId, $id)
    {
        if (!Auth::check() || !Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $courseFile = CourseFile::where('course_id', $courseId)->findOrFail($id);

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

        $courseFile->update($request->only([
            'title',
            'description',
            'order',
            'is_required',
            'is_downloadable',
        ]));

        $courseFile->load('file');

        return response()->json($courseFile);
    }

    public function destroy($courseId, $id)
    {
        if (!Auth::check() || !Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $courseFile = CourseFile::where('course_id', $courseId)->findOrFail($id);
        $courseFile->delete();

        return response()->json(['message' => 'File attachment removed successfully']);
    }

    public function reorder(Request $request, $courseId)
    {
        if (!Auth::check() || !Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'file_orders' => 'required|array',
            'file_orders.*.id' => 'required|exists:course_files,id',
            'file_orders.*.order' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        foreach ($request->file_orders as $fileOrder) {
            CourseFile::where('id', $fileOrder['id'])
                ->where('course_id', $courseId)
                ->update(['order' => $fileOrder['order']]);
        }

        return response()->json(['message' => 'File order updated successfully']);
    }
}





