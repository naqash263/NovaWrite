<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class GeminiApiKey extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'api_key',
        'max_requests',
        'total_requests',
        'used_requests',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'max_requests' => 'integer',
        'total_requests' => 'integer',
        'used_requests' => 'integer'
    ];

    protected $hidden = [
        // 'api_key' - Commented out to allow access to decrypted API key
    ];

    /**
     * Get the decrypted API key
     */
    protected function apiKey(): Attribute
    {
        return Attribute::make(
            get: fn (string $value) => decrypt($value),
            set: fn (string $value) => encrypt($value),
        );
    }

    /**
     * Get the remaining requests for this API key
     */
    public function getRemainingRequestsAttribute(): int
    {
        return max(0, $this->total_requests - $this->used_requests);
    }

    /**
     * Check if this API key has available requests
     */
    public function hasAvailableRequests(): bool
    {
        return $this->is_active && $this->remaining_requests > 0;
    }

    /**
     * Increment the used requests count
     */
    public function incrementUsage(): bool
    {
        if (!$this->hasAvailableRequests()) {
            return false;
        }

        return $this->increment('used_requests');
    }

    /**
     * Reset usage for this API key
     */
    public function resetUsage(): bool
    {
        return $this->update(['used_requests' => 0]);
    }

    /**
     * Get usage statistics
     */
    public function getUsageStats(): array
    {
        return [
            'total_requests' => $this->total_requests,
            'used_requests' => $this->used_requests,
            'remaining_requests' => $this->remaining_requests,
            'usage_percentage' => $this->total_requests > 0 
                ? round(($this->used_requests / $this->total_requests) * 100, 2) 
                : 0
        ];
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
        return $query->whereRaw('used_requests < total_requests');
    }
}
