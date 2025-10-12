<?php

namespace App\Models;

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
        'is_active'
    ];

    protected $casts = [
        'api_key' => 'encrypted',
        'is_active' => 'boolean',
        'requests_per_key' => 'integer',
        'usage_count' => 'integer'
    ];

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
}