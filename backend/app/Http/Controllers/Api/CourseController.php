<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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

        $isEnrolled = Auth::check() ? Auth::user()->isEnrolledIn($course->id) : false;

        return response()->json([
            'id' => $course->id,
            'title' => $course->title,
            'slug' => $course->slug,
            'description' => $course->description,
            'image_url' => $course->image_url,
            'what_you_learn' => $course->what_you_learn,
            'duration_hours' => $course->duration_hours,
            'level' => $course->level,
            'lessons' => $course->lessons->map(function ($lesson) use ($isEnrolled) {
                return [
                    'id' => $lesson->id,
                    'title' => $lesson->title,
                    'content' => ($isEnrolled || $lesson->is_free_preview) ? $lesson->content : null,
                    'video_url' => ($isEnrolled || $lesson->is_free_preview) ? $lesson->video_url : null,
                    'duration_minutes' => $lesson->duration_minutes,
                    'order' => $lesson->order,
                    'is_free_preview' => $lesson->is_free_preview,
                    'is_locked' => !($isEnrolled || $lesson->is_free_preview),
                ];
            }),
            'enrolled_users_count' => $course->enrollments()->count(),
            'is_enrolled' => $isEnrolled,
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
}
