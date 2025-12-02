<?php

namespace App\Models;

use App\Traits\HasAccessControl;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    use HasAccessControl;
    protected $fillable = [
        'title',
        'slug',
        'excerpt',
        'content',
        'featured_image',
        'category_id',
        'user_id',
        'published_at',
        'is_published',
        'approval_status',
        'rejection_reason',
        'approved_by',
        'approved_at',
        'access_level',
        'allowed_user_ids',
        'allowed_group_ids',
        'views',
        'meta_description',
        'meta_keywords',
    ];

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'is_published' => 'boolean',
            'approved_at' => 'datetime',
            'allowed_user_ids' => 'array',
            'allowed_group_ids' => 'array',
        ];
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function tags()
    {
        return $this->belongsToMany(Tag::class);
    }

    /**
     * Get all comments for this post
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
