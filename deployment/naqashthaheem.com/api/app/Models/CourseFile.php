<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CourseFile extends Model
{
    protected $fillable = [
        'course_id',
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

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function file()
    {
        return $this->belongsTo(File::class);
    }
}
