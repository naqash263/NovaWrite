<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LessonProgress extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'lesson_id',
        'is_completed',
        'completed_at',
        'time_spent_minutes',
        'progress_data',
    ];

    protected $casts = [
        'is_completed' => 'boolean',
        'completed_at' => 'datetime',
        'progress_data' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }

    /**
     * Mark lesson as completed
     */
    public function markCompleted()
    {
        $this->update([
            'is_completed' => true,
            'completed_at' => now(),
        ]);
    }
}