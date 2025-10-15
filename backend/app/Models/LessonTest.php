<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LessonTest extends Model
{
    use HasFactory;

    protected $fillable = [
        'lesson_id',
        'title',
        'description',
        'question',
        'options',
        'correct_answer',
        'questions',
        'passing_score',
        'time_limit_minutes',
        'is_active',
        'order',
    ];

    protected $casts = [
        'questions' => 'array',
        'options' => 'array',
        'is_active' => 'boolean',
    ];

    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }

    public function attempts()
    {
        return $this->hasMany(TestAttempt::class);
    }

    /**
     * Get the latest attempt for a user
     */
    public function getLatestAttemptForUser($userId)
    {
        return $this->attempts()
            ->where('user_id', $userId)
            ->latest()
            ->first();
    }

    /**
     * Check if user has passed this test
     */
    public function hasUserPassed($userId)
    {
        $attempt = $this->getLatestAttemptForUser($userId);
        return $attempt && $attempt->passed;
    }
}