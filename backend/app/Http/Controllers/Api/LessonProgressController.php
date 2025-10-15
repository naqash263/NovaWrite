<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\LessonProgress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class LessonProgressController extends Controller
{
    /**
     * Mark a lesson as completed
     */
    public function markCompleted(Request $request, $lessonId)
    {
        $user = Auth::guard('api')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $lesson = Lesson::findOrFail($lessonId);

        // Check if user is enrolled in the course
        if (!$user->isEnrolledIn($lesson->course_id)) {
            return response()->json([
                'message' => 'You must enroll in this course first',
                'error' => 'Not enrolled'
            ], 403);
        }

        // Check if user can access this lesson (sequential access)
        if (!$lesson->canBeAccessedByUser($user->id)) {
            return response()->json([
                'message' => 'Complete previous lessons first',
                'error' => 'Prerequisites not met'
            ], 403);
        }

        // Create or update lesson progress
        $progress = LessonProgress::updateOrCreate(
            [
                'user_id' => $user->id,
                'lesson_id' => $lessonId,
            ],
            [
                'is_completed' => true,
                'completed_at' => now(),
                'time_spent_minutes' => $request->time_spent_minutes ?? 0,
                'progress_data' => $request->progress_data ?? [],
            ]
        );

        return response()->json([
            'message' => 'Lesson marked as completed',
            'progress' => $progress,
        ]);
    }

    /**
     * Get lesson progress for a user
     */
    public function getProgress(Request $request, $lessonId)
    {
        $user = Auth::guard('api')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $progress = LessonProgress::where('user_id', $user->id)
            ->where('lesson_id', $lessonId)
            ->first();

        return response()->json([
            'progress' => $progress,
            'is_completed' => $progress ? $progress->is_completed : false,
        ]);
    }

    /**
     * Get all lesson progress for a course
     */
    public function getCourseProgress(Request $request, $courseId)
    {
        $user = Auth::guard('api')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $progress = LessonProgress::where('user_id', $user->id)
            ->whereHas('lesson', function ($query) use ($courseId) {
                $query->where('course_id', $courseId);
            })
            ->with('lesson')
            ->get();

        return response()->json([
            'progress' => $progress,
            'completed_lessons' => $progress->where('is_completed', true)->count(),
            'total_lessons' => Lesson::where('course_id', $courseId)->count(),
        ]);
    }

    /**
     * Reset lesson progress (for testing purposes)
     */
    public function resetProgress(Request $request, $lessonId)
    {
        $user = Auth::guard('api')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Only allow admins to reset progress
        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        LessonProgress::where('user_id', $user->id)
            ->where('lesson_id', $lessonId)
            ->delete();

        return response()->json(['message' => 'Progress reset successfully']);
    }
}