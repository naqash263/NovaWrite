<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lesson extends Model
{
    protected $fillable = [
        'course_id',
        'title',
        'thumbnail',
        'content',
        'video_url',
        'duration_minutes',
        'order',
        'is_free_preview',
    ];

    protected $casts = [
        'course_id' => 'integer',
        'duration_minutes' => 'integer',
        'order' => 'integer',
        'is_free_preview' => 'boolean',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function lessonFiles()
    {
        return $this->hasMany(LessonFile::class)->orderBy('order');
    }

    public function files()
    {
        return $this->hasManyThrough(File::class, LessonFile::class, 'lesson_id', 'id', 'id', 'file_id');
    }

    public function lessonProgress()
    {
        return $this->hasMany(LessonProgress::class);
    }

    public function tests()
    {
        return $this->hasMany(LessonTest::class)->orderBy('order');
    }

    /**
     * Get the active test for this lesson
     */
    public function activeTest()
    {
        return $this->tests()->where('is_active', true)->first();
    }

    /**
     * Check if user has completed this lesson
     */
    public function isCompletedByUser($userId)
    {
        return $this->lessonProgress()
            ->where('user_id', $userId)
            ->where('is_completed', true)
            ->exists();
    }

    /**
     * Check if user can access this lesson (previous lessons completed)
     */
    public function canBeAccessedByUser($userId)
    {
        // Get all previous lessons in the same course
        $previousLessons = Lesson::where('course_id', $this->course_id)
            ->where('order', '<', $this->order)
            ->get();

        // Check if all previous lessons are completed
        foreach ($previousLessons as $prevLesson) {
            if (!$prevLesson->isCompletedByUser($userId)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get all comments for this lesson
     */
    public function comments()
    {
        return $this->morphMany(Comment::class, 'commentable');
    }

    /**
     * Get approved comments only
     */
    public function approvedComments()
    {
        return $this->comments()->where('is_approved', true);
    }
}
