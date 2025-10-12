<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CvTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'thumbnail',
        'html_content',
        'json_config',
        'category',
        'ats_score',
        'is_active',
        'is_default',
        'customizable_options',
        'field_mappings',
        'created_by',
    ];

    protected $casts = [
        'json_config' => 'array',
        'customizable_options' => 'array',
        'field_mappings' => 'array',
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'ats_score' => 'integer',
    ];

    /**
     * Get the user who created this template.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope a query to only include active templates.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to only include templates by category.
     */
    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Get the default template.
     */
    public static function getDefault()
    {
        return static::where('is_default', true)->where('is_active', true)->first();
    }

    /**
     * Set this template as the default.
     */
    public function setAsDefault()
    {
        // Remove default flag from all other templates
        static::where('is_default', true)->update(['is_default' => false]);
        
        // Set this template as default
        $this->update(['is_default' => true]);
    }

    /**
     * Apply user customizations to the template.
     */
    public function applyCustomizations(array $customizations)
    {
        $html = $this->html_content;
        
        // Apply color customizations
        if (isset($customizations['primaryColor'])) {
            $html = str_replace('{{primaryColor}}', $customizations['primaryColor'], $html);
        }
        
        if (isset($customizations['secondaryColor'])) {
            $html = str_replace('{{secondaryColor}}', $customizations['secondaryColor'], $html);
        }
        
        // Apply font customizations
        if (isset($customizations['fontFamily'])) {
            $html = str_replace('{{fontFamily}}', $customizations['fontFamily'], $html);
        }
        
        if (isset($customizations['fontSize'])) {
            $html = str_replace('{{fontSize}}', $customizations['fontSize'], $html);
        }
        
        return $html;
    }
}