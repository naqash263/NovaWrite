<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\LessonTest;
use App\Models\TestAttempt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class LessonTestController extends Controller
{
    /**
     * Get test for a lesson
     */
    public function getTest(Request $request, $lessonId)
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
        
        $test = $lesson->activeTest();

        if (!$test) {
            return response()->json(['message' => 'No test available for this lesson'], 404);
        }

        // Check if user can access this lesson (sequential access)
        if (!$lesson->canBeAccessedByUser($user->id)) {
            return response()->json([
                'message' => 'Complete previous lessons first',
                'error' => 'Prerequisites not met'
            ], 403);
        }

        return response()->json([
            'test' => $test,
            'has_attempted' => $test->getLatestAttemptForUser($user->id) !== null,
            'has_passed' => $test->hasUserPassed($user->id),
        ]);
    }

    /**
     * Start a test attempt
     */
    public function startTest(Request $request, $lessonId)
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
        
        $test = $lesson->activeTest();

        if (!$test) {
            return response()->json(['message' => 'No test available for this lesson'], 404);
        }

        // Check if user can access this lesson (sequential access)
        if (!$lesson->canBeAccessedByUser($user->id)) {
            return response()->json([
                'message' => 'Complete previous lessons first',
                'error' => 'Prerequisites not met'
            ], 403);
        }

        // Check if user has already passed
        if ($test->hasUserPassed($user->id)) {
            return response()->json(['message' => 'You have already passed this test'], 400);
        }

        // Create new attempt
        $attempt = TestAttempt::create([
            'user_id' => $user->id,
            'lesson_test_id' => $test->id,
            'answers' => [],
            'started_at' => now(),
        ]);

        return response()->json([
            'message' => 'Test started',
            'attempt' => $attempt,
            'test' => $test,
        ]);
    }

    /**
     * Submit test answers
     */
    public function submitTest(Request $request, $lessonId)
    {
        $user = Auth::guard('api')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validator = Validator::make($request->all(), [
            'attempt_id' => 'required|exists:test_attempts,id',
            'answers' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $lesson = Lesson::findOrFail($lessonId);
        $test = $lesson->activeTest();

        if (!$test) {
            return response()->json(['message' => 'No test available for this lesson'], 404);
        }

        $attempt = TestAttempt::where('id', $request->attempt_id)
            ->where('user_id', $user->id)
            ->where('lesson_test_id', $test->id)
            ->first();

        if (!$attempt) {
            return response()->json(['message' => 'Test attempt not found'], 404);
        }

        // Update attempt with answers
        $attempt->update([
            'answers' => $request->answers,
        ]);

        // Calculate score
        $score = $attempt->calculateScore();

        // If passed, mark lesson as completed
        if ($attempt->passed) {
            $progress = \App\Models\LessonProgress::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'lesson_id' => $lessonId,
                ],
                [
                    'is_completed' => true,
                    'completed_at' => now(),
                ]
            );
        }

        return response()->json([
            'message' => $attempt->passed ? 'Test passed!' : 'Test failed. Try again.',
            'attempt' => $attempt,
            'score' => $score,
            'passed' => $attempt->passed,
            'lesson_completed' => $attempt->passed,
        ]);
    }

    /**
     * Get test results for a lesson
     */
    public function getResults(Request $request, $lessonId)
    {
        $user = Auth::guard('api')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $lesson = Lesson::findOrFail($lessonId);
        $test = $lesson->activeTest();

        if (!$test) {
            return response()->json(['message' => 'No test available for this lesson'], 404);
        }

        $attempts = TestAttempt::where('user_id', $user->id)
            ->where('lesson_test_id', $test->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'test' => $test,
            'attempts' => $attempts,
            'latest_attempt' => $attempts->first(),
            'has_passed' => $test->hasUserPassed($user->id),
        ]);
    }
}