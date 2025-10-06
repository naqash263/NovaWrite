<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TestAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'lesson_test_id',
        'answers',
        'score',
        'passed',
        'started_at',
        'completed_at',
        'time_taken_minutes',
        'feedback',
    ];

    protected $casts = [
        'answers' => 'array',
        'passed' => 'boolean',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'feedback' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function lessonTest()
    {
        return $this->belongsTo(LessonTest::class);
    }

    /**
     * Calculate and set the score based on answers
     */
    public function calculateScore()
    {
        $questions = $this->lessonTest->questions;
        $answers = $this->answers;
        $correct = 0;
        $total = count($questions);

        foreach ($questions as $index => $question) {
            if (isset($answers[$index]) && $answers[$index] === $question['correct_answer']) {
                $correct++;
            }
        }

        $score = $total > 0 ? round(($correct / $total) * 100) : 0;
        $passed = $score >= $this->lessonTest->passing_score;

        $this->update([
            'score' => $score,
            'passed' => $passed,
            'completed_at' => now(),
        ]);

        return $score;
    }
}