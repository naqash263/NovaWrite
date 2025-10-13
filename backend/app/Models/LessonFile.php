<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LessonFile extends Model
{
    protected $fillable = [
        'lesson_id',
        'file_id',
        'title',
        'description',
        'order',
        'is_required',
        'is_downloadable',
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'is_downloadable' => 'boolean',
        'order' => 'integer',
    ];

    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }

    public function file()
    {
        return $this->belongsTo(File::class);
    }
}






