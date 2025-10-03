<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lesson extends Model
{
    protected $fillable = [
        'course_id',
        'title',
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
}
