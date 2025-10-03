<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\Course;
use Illuminate\Http\Request;

class LessonController extends Controller
{
    public function index($courseId)
    {
        $course = Course::findOrFail($courseId);
        $lessons = $course->lessons()->orderBy('order')->get();
        
        return response()->json([
            'course' => $course,
            'lessons' => $lessons
        ]);
    }

    public function store(Request $request, $courseId)
    {
        $course = Course::findOrFail($courseId);
        
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'video_url' => 'nullable|url|max:500',
            'duration_minutes' => 'required|integer|min:1',
            'order' => 'required|integer|min:0',
            'is_free_preview' => 'boolean',
        ]);

        $validated['course_id'] = $courseId;
        $lesson = Lesson::create($validated);

        return response()->json([
            'message' => 'Lesson created successfully',
            'lesson' => $lesson
        ], 201);
    }

    public function update(Request $request, $courseId, $id)
    {
        $lesson = Lesson::where('course_id', $courseId)->findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'video_url' => 'nullable|url|max:500',
            'duration_minutes' => 'required|integer|min:1',
            'order' => 'required|integer|min:0',
            'is_free_preview' => 'boolean',
        ]);

        $lesson->update($validated);

        return response()->json([
            'message' => 'Lesson updated successfully',
            'lesson' => $lesson
        ]);
    }

    public function destroy($courseId, $id)
    {
        $lesson = Lesson::where('course_id', $courseId)->findOrFail($id);
        $lesson->delete();

        return response()->json([
            'message' => 'Lesson deleted successfully'
        ]);
    }
}
