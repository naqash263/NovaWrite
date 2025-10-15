<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\LessonTest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class LessonTestAdminController extends Controller
{
    /**
     * Get all tests for a lesson
     */
    public function index($lessonId): JsonResponse
    {
        $lesson = Lesson::findOrFail($lessonId);
        $tests = $lesson->tests()->orderBy('order')->get();
        
        return response()->json([
            'success' => true,
            'data' => [
                'lesson' => $lesson,
                'tests' => $tests
            ]
        ]);
    }

    /**
     * Create a new test for a lesson
     */
    public function store(Request $request, $lessonId): JsonResponse
    {
        $lesson = Lesson::findOrFail($lessonId);
        
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'questions' => 'required|array|min:1',
            'questions.*.id' => 'required|integer',
            'questions.*.question' => 'required|string',
            'questions.*.type' => 'required|string|in:multiple_choice',
            'questions.*.options' => 'required|array|min:2',
            'questions.*.correct_answer' => 'required|string|in:A,B,C,D',
            'questions.*.points' => 'required|integer|min:1',
            'passing_score' => 'required|integer|min:1|max:100',
            'time_limit_minutes' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Get the next order number
        $maxOrder = $lesson->tests()->max('order') ?? -1;
        
        // Get the first question for the single question fields
        $firstQuestion = $request->questions[0] ?? null;
        
        $test = LessonTest::create([
            'lesson_id' => $lessonId,
            'title' => $request->title,
            'description' => $request->description,
            'question' => $firstQuestion['question'] ?? '',
            'options' => $firstQuestion['options'] ?? [],
            'correct_answer' => $firstQuestion['correct_answer'] ?? 'A',
            'questions' => $request->questions,
            'passing_score' => $request->passing_score,
            'time_limit_minutes' => $request->time_limit_minutes,
            'is_active' => $request->is_active ?? true,
            'order' => $maxOrder + 1,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Test created successfully',
            'data' => [
                'test' => $test
            ]
        ], 201);
    }

    /**
     * Get a specific test
     */
    public function show($lessonId, $id): JsonResponse
    {
        $test = LessonTest::where('lesson_id', $lessonId)->findOrFail($id);
        
        return response()->json([
            'success' => true,
            'data' => [
                'test' => $test
            ]
        ]);
    }

    /**
     * Update a test
     */
    public function update(Request $request, $lessonId, $id): JsonResponse
    {
        $test = LessonTest::where('lesson_id', $lessonId)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'title' => 'string|max:255',
            'description' => 'nullable|string',
            'questions' => 'array|min:1',
            'questions.*.id' => 'required|integer',
            'questions.*.question' => 'required|string',
            'questions.*.type' => 'required|string|in:multiple_choice',
            'questions.*.options' => 'required|array|min:2',
            'questions.*.correct_answer' => 'required|string|in:A,B,C,D',
            'questions.*.points' => 'required|integer|min:1',
            'passing_score' => 'integer|min:1|max:100',
            'time_limit_minutes' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
            'order' => 'integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $test->update($request->only([
            'title',
            'description',
            'questions',
            'passing_score',
            'time_limit_minutes',
            'is_active',
            'order',
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Test updated successfully',
            'data' => [
                'test' => $test
            ]
        ]);
    }

    /**
     * Delete a test
     */
    public function destroy($lessonId, $id): JsonResponse
    {
        $test = LessonTest::where('lesson_id', $lessonId)->findOrFail($id);
        $test->delete();

        return response()->json([
            'success' => true,
            'message' => 'Test deleted successfully'
        ]);
    }
}

