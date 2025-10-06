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
}
