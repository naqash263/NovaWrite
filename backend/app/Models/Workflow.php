<?php

namespace App\Models;

use App\Traits\HasAccessControl;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Workflow extends Model
{
    use HasAccessControl;
    protected $fillable = [
        'workflow_category_id',
        'title',
        'slug',
        'summary',
        'description',
        'product_description',
        'meta_description',
        'meta_keywords',
        'seo_title',
        'instructions',
        'tools',
        'benefits',
        'tools_used',
        'key_benefits',
        'is_premium',
        'is_published',
        'status',
        'access_level',
        'allowed_user_ids',
        'allowed_group_ids',
        'published_at',
        'created_by',
        'updated_by',
        'image_url',
        'estimated_time',
        'difficulty',
        'tags',
    ];

    protected $casts = [
        'tools' => 'array',
        'benefits' => 'array',
        'tags' => 'array',
        'allowed_user_ids' => 'array',
        'allowed_group_ids' => 'array',
        'is_premium' => 'boolean',
        'is_published' => 'boolean',
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
        return $query->where('is_published', true);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
