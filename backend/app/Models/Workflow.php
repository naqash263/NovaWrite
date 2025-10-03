<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Workflow extends Model
{
    protected $fillable = [
        'workflow_category_id',
        'title',
        'slug',
        'summary',
        'description',
        'tools',
        'benefits',
        'is_featured',
        'is_premium',
        'status',
        'published_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'tools' => 'array',
        'benefits' => 'array',
        'is_featured' => 'boolean',
        'is_premium' => 'boolean',
        'published_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($workflow) {
            if (empty($workflow->slug)) {
                $workflow->slug = static::generateUniqueSlug($workflow->title);
            }
        });

        static::updating(function ($workflow) {
            if ($workflow->isDirty('title') && empty($workflow->slug)) {
                $workflow->slug = static::generateUniqueSlug($workflow->title, $workflow->id);
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

    public function category()
    {
        return $this->belongsTo(WorkflowCategory::class, 'workflow_category_id');
    }

    public function files()
    {
        return $this->hasMany(WorkflowFile::class);
    }

    public function downloads()
    {
        return $this->hasMany(WorkflowDownload::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }
}
