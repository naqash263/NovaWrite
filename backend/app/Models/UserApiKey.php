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
        'max_requests',
        'used_requests',
        'is_active',
        'last_reset_at'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'max_requests' => 'integer',
        'used_requests' => 'integer',
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
        return $query->whereRaw('used_requests < max_requests');
    }

    /**
     * Get the remaining requests for this key.
     */
    public function getRemainingRequestsAttribute(): int
    {
        return max(0, $this->max_requests - $this->used_requests);
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
        $this->increment('used_requests');
    }
    
    /**
     * Reset usage for this API key
     */
    public function resetUsage(): bool
    {
        return $this->update([
            'used_requests' => 0,
            'last_reset_at' => now()
        ]);
    }
    
    /**
     * Reset usage and set daily limit to 100
     */
    public function resetDailyLimit(): bool
    {
        return $this->update([
            'used_requests' => 0,
            'max_requests' => 100,
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
            'total_requests' => $this->max_requests,
            'used_requests' => $this->used_requests,
            'remaining_requests' => $this->remaining_requests,
            'usage_percentage' => $this->max_requests > 0 
                ? round(($this->used_requests / $this->max_requests) * 100, 2) 
                : 0,
            'last_reset_at' => $this->last_reset_at
        ];
    }
}