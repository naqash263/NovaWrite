<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class HomeSettings extends Model
{
    protected $fillable = [
        'key',
        'type',
        'value',
        'title',
        'description',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * Scope to get only active settings
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get settings by type
     */
    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    /**
     * Get setting value by key
     */
    public static function getValue(string $key, $default = null)
    {
        $setting = static::where('key', $key)->active()->first();
        return $setting ? $setting->value : $default;
    }

    /**
     * Set setting value by key
     */
    public static function setValue(string $key, $value, string $type = 'text', string $title = null, string $description = null): self
    {
        return static::updateOrCreate(
            ['key' => $key],
            [
                'value' => $value,
                'type' => $type,
                'title' => $title,
                'description' => $description,
                'is_active' => true,
            ]
        );
    }

    /**
     * Get all settings as key-value pairs
     */
    public static function getAllSettings(): array
    {
        return static::active()
            ->orderBy('sort_order')
            ->pluck('value', 'key')
            ->toArray();
    }

    /**
     * Get settings by type
     */
    public static function getSettingsByType(string $type): array
    {
        return static::active()
            ->byType($type)
            ->orderBy('sort_order')
            ->pluck('value', 'key')
            ->toArray();
    }
}
