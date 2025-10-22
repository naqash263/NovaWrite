<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PushSubscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'endpoint',
        'p256dh',
        'auth',
        'preferences',
        'is_active',
        'last_used_at',
    ];

    protected $casts = [
        'preferences' => 'array',
        'is_active' => 'boolean',
        'last_used_at' => 'datetime',
    ];

    /**
     * Get the user that owns the push subscription.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope a query to only include active subscriptions.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to only include subscriptions for a specific user.
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope a query to only include subscriptions for a specific notification type.
     */
    public function scopeForNotificationType($query, $type)
    {
        return $query->whereJsonContains('preferences->' . $type, true);
    }

    /**
     * Get the subscription data for web-push library.
     */
    public function getSubscriptionData(): array
    {
        return [
            'endpoint' => $this->endpoint,
            'keys' => [
                'p256dh' => $this->p256dh,
                'auth' => $this->auth,
            ],
        ];
    }

    /**
     * Update the last used timestamp.
     */
    public function markAsUsed(): void
    {
        $this->update(['last_used_at' => now()]);
    }

    /**
     * Deactivate the subscription.
     */
    public function deactivate(): void
    {
        $this->update(['is_active' => false]);
    }
}