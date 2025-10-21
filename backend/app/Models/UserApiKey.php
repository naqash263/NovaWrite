<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserApiKey extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'api_key',
        'requests_per_key',
        'usage_count',
        'is_active',
        'last_reset_at'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'requests_per_key' => 'integer',
        'usage_count' => 'integer',
        'last_reset_at' => 'datetime'
    ];
    
    protected $hidden = [
        'api_key' // Hide encrypted API key from JSON responses
    ];
    
    /**
     * Get/set the API key with encryption
     */
    protected function apiKey(): Attribute
    {
        return Attribute::make(
            get: function ($value) {
                try {
                    return $value ? decrypt($value) : null;
                } catch (\Exception $e) {
                    \Log::warning('Failed to decrypt user API key: ' . $e->getMessage());
                    return null;
                }
            },
            set: fn ($value) => $value ? encrypt($value) : null
        );
    }

    /**
     * Get the user that owns the API key.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope a query to only include active keys.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to only include keys with remaining requests.
     */
    public function scopeWithRemainingRequests($query)
    {
        return $query->whereRaw('usage_count < requests_per_key');
    }

    /**
     * Get the remaining requests for this key.
     */
    public function getRemainingRequestsAttribute(): int
    {
        return max(0, $this->requests_per_key - $this->usage_count);
    }

    /**
     * Check if this key has remaining requests.
     */
    public function hasRemainingRequests(): bool
    {
        return $this->remaining_requests > 0;
    }

    /**
     * Increment the usage count for this key.
     */
    public function incrementUsage(): void
    {
        $this->increment('usage_count');
    }
    
    /**
     * Reset usage for this API key
     */
    public function resetUsage(): bool
    {
        return $this->update([
            'usage_count' => 0,
            'last_reset_at' => now()
        ]);
    }
    
    /**
     * Reset usage and set daily limit to 100
     */
    public function resetDailyLimit(): bool
    {
        return $this->update([
            'usage_count' => 0,
            'requests_per_key' => 100,
            'last_reset_at' => now()
        ]);
    }
    
    /**
     * Check if this API key needs daily reset
     */
    public function needsDailyReset(): bool
    {
        if (!$this->last_reset_at) {
            return true; // Never been reset
        }
        
        // Check if it's been more than 24 hours since last reset
        return $this->last_reset_at->addDay()->isPast();
    }
    
    /**
     * Get usage statistics
     */
    public function getUsageStats(): array
    {
        return [
            'total_requests' => $this->requests_per_key,
            'used_requests' => $this->usage_count,
            'remaining_requests' => $this->remaining_requests,
            'usage_percentage' => $this->requests_per_key > 0 
                ? round(($this->usage_count / $this->requests_per_key) * 100, 2) 
                : 0,
            'last_reset_at' => $this->last_reset_at
        ];
    }
}