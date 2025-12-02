<?php

namespace App\Models;

use App\Traits\HasAccessControl;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Course extends Model
{
    use HasAccessControl;
    protected $fillable = [
        'title',
        'slug',
        'description',
        'image_url',
        'what_you_learn',
        'duration_hours',
        'level',
        'is_published',
        'access_level',
        'allowed_user_ids',
        'allowed_group_ids',
        'order',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'allowed_user_ids' => 'array',
        'allowed_group_ids' => 'array',
        'duration_hours' => 'integer',
        'order' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($course) {
            if (empty($course->slug)) {
                $course->slug = static::generateUniqueSlug($course->title);
            }
        });

        static::updating(function ($course) {
            if ($course->isDirty('title') && empty($course->slug)) {
                $course->slug = static::generateUniqueSlug($course->title, $course->id);
            }
        });
    }

    protected static function generateUniqueSlug($title, $ignoreId = null)
    {
        $slug = Str::slug($title);
        $originalSlug = $slug;
        $counter = 1;

        while (static::where('slug', $slug)->when($ignoreId, function ($query, $id) {
            return $query->where('id', '!=', $id);
        })->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    public function lessons()
    {
        return $this->hasMany(Lesson::class)->orderBy('order');
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }

    public function getEnrolledUsersCountAttribute()
    {
        return $this->enrollments()->count();
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function courseFiles()
    {
        return $this->hasMany(CourseFile::class)->orderBy('order');
    }

    public function files()
    {
        return $this->hasManyThrough(File::class, CourseFile::class, 'course_id', 'id', 'id', 'file_id');
    }

    /**
     * Get all comments for this course
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
