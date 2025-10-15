<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class File extends Model
{
    protected $fillable = [
        'name',
        'original_name',
        'seo_name',
        'path',
        'mime_type',
        'size',
        'is_public',
        'downloads',
        'user_id',
        'ai_metadata',
        'keywords',
        'description',
        'seo_score',
        'content_category',
        'file_type_category',
        'content_purpose',
        'target_audience',
        'ai_tags',
    ];

    protected function casts(): array
    {
        return [
            'is_public' => 'boolean',
            'ai_metadata' => 'array',
            'keywords' => 'array',
            'ai_tags' => 'array',
            'seo_score' => 'integer',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
