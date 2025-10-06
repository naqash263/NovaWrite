<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;

class CourseController extends Controller
{
    public function index()
    {
        $courses = Course::published()
            ->with('lessons')
            ->orderBy('order')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($course) {
                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'slug' => $course->slug,
                    'description' => $course->description,
                    'image_url' => $course->image_url,
                    'what_you_learn' => $course->what_you_learn,
                    'duration_hours' => $course->duration_hours,
                    'level' => $course->level,
                    'lessons_count' => $course->lessons->count(),
                    'enrolled_users_count' => $course->enrollments()->count(),
                    'is_enrolled' => Auth::check() ? Auth::user()->isEnrolledIn($course->id) : false,
                ];
            });

        return response()->json($courses);
    }

    public function show($slug)
    {
        $course = Course::where('slug', $slug)
            ->with('lessons')
            ->firstOrFail();

        if (!$course->is_published) {
            return response()->json(['message' => 'Course not found'], 404);
        }

        // Manually check for authentication token
        $isLoggedIn = false;
        $isEnrolled = false;
        $user = null;
        
        if (request()->bearerToken()) {
            try {
                $user = Auth::guard('api')->user();
                if ($user) {
                    $isLoggedIn = true;
                    $isEnrolled = $user->isEnrolledIn($course->id);
                }
            } catch (\Exception $e) {
                // Token is invalid, treat as not logged in
                $isLoggedIn = false;
                $user = null;
            }
        }

        return response()->json([
            'id' => $course->id,
            'title' => $course->title,
            'slug' => $course->slug,
            'description' => $course->description,
            'image_url' => $course->image_url,
            'what_you_learn' => $course->what_you_learn,
            'duration_hours' => $course->duration_hours,
            'level' => $course->level,
            'lessons' => $course->lessons->map(function ($lesson) use ($isLoggedIn, $isEnrolled, $user) {
                // For logged-in users: check sequential access
                if ($isLoggedIn && $user) {
                    $canAccess = $lesson->canBeAccessedByUser($user->id);
                    $isCompleted = $lesson->isCompletedByUser($user->id);
                    $hasTest = $lesson->activeTest() !== null;
                    $hasPassedTest = $hasTest ? $lesson->activeTest()->hasUserPassed($user->id) : true;
                    
                    // User can access lesson content if previous lessons are completed
                    // Test passing is only required for marking lesson as completed, not for accessing content
                    $hasAccess = $canAccess;
                } else {
                    // Non-logged-in users only get free previews
                    $hasAccess = $lesson->is_free_preview;
                    $isCompleted = false;
                    $hasTest = false;
                    $hasPassedTest = false;
                }
                
                return [
                    'id' => $lesson->id,
                    'title' => $lesson->title,
                    'content' => $hasAccess ? $lesson->content : null,
                    'video_url' => $hasAccess ? $lesson->video_url : null,
                    'duration_minutes' => $lesson->duration_minutes,
                    'order' => $lesson->order,
                    'is_free_preview' => $lesson->is_free_preview,
                    'is_locked' => !$hasAccess,
                    'is_completed' => $isCompleted ?? false,
                    'has_test' => $hasTest ?? false,
                    'test_passed' => $hasPassedTest ?? false,
                ];
            }),
            'enrolled_users_count' => $course->enrollments()->count(),
            'is_enrolled' => $isEnrolled,
            'is_logged_in' => $isLoggedIn,
        ]);
    }

    public function enroll(Request $request, $id)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $course = Course::findOrFail($id);

        if (!$course->is_published) {
            return response()->json(['message' => 'Course not available'], 404);
        }

        if ($user->isEnrolledIn($course->id)) {
            return response()->json(['message' => 'Already enrolled'], 409);
        }

        Enrollment::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
        ]);

        return response()->json([
            'message' => 'Successfully enrolled in course',
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,
            ],
        ], 201);
    }

    public function myCourses(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $enrollments = Enrollment::where('user_id', $user->id)
            ->with('course.lessons')
            ->orderBy('enrolled_at', 'desc')
            ->get()
            ->map(function ($enrollment) {
                return [
                    'enrollment_id' => $enrollment->id,
                    'enrolled_at' => $enrollment->enrolled_at,
                    'progress' => $enrollment->progress,
                    'completed_at' => $enrollment->completed_at,
                    'course' => [
                        'id' => $enrollment->course->id,
                        'title' => $enrollment->course->title,
                        'slug' => $enrollment->course->slug,
                        'description' => $enrollment->course->description,
                        'image_url' => $enrollment->course->image_url,
                        'duration_hours' => $enrollment->course->duration_hours,
                        'level' => $enrollment->course->level,
                        'lessons_count' => $enrollment->course->lessons->count(),
                    ],
                ];
            });

        return response()->json($enrollments);
    }

    public function adminIndex()
    {
        if (!Auth::check() || !Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $courses = Course::withCount(['lessons', 'courseFiles'])
            ->orderBy('order')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($courses);
    }

    public function store(Request $request)
    {
        if (!Auth::check() || !Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'image_url' => 'nullable|url',
            'what_you_learn' => 'nullable|string',
            'duration_hours' => 'required|numeric|min:0',
            'level' => 'required|in:beginner,intermediate,advanced',
            'is_published' => 'boolean',
            'order' => 'integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $slug = Str::slug($request->title);
        $originalSlug = $slug;
        $counter = 1;

        while (Course::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        $course = Course::create([
            'title' => $request->title,
            'slug' => $slug,
            'description' => $request->description,
            'image_url' => $request->image_url,
            'what_you_learn' => $request->what_you_learn,
            'duration_hours' => $request->duration_hours,
            'level' => $request->level,
            'is_published' => $request->is_published ?? true,
            'order' => $request->order ?? 0,
        ]);

        return response()->json($course, 201);
    }

    public function update(Request $request, $id)
    {
        if (!Auth::check() || !Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $course = Course::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'image_url' => 'nullable|url',
            'what_you_learn' => 'nullable|string',
            'duration_hours' => 'sometimes|required|numeric|min:0',
            'level' => 'sometimes|required|in:beginner,intermediate,advanced',
            'is_published' => 'boolean',
            'order' => 'integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        if ($request->has('title') && $request->title !== $course->title) {
            $slug = Str::slug($request->title);
            $originalSlug = $slug;
            $counter = 1;

            while (Course::where('slug', $slug)->where('id', '!=', $id)->exists()) {
                $slug = $originalSlug . '-' . $counter;
                $counter++;
            }
            $course->slug = $slug;
        }

        $course->update($request->only([
            'title',
            'description',
            'image_url',
            'what_you_learn',
            'duration_hours',
            'level',
            'is_published',
            'order',
        ]));

        return response()->json($course);
    }

    public function destroy($id)
    {
        if (!Auth::check() || !Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $course = Course::findOrFail($id);
        $course->delete();

        return response()->json(['message' => 'Course deleted successfully']);
    }
}
