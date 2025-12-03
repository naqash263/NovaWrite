<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class EmailUnsubscribe extends Model
{
    protected $fillable = [
        'email',
        'token',
        'unsubscribed_types',
        'unsubscribe_all',
        'user_id',
        'unsubscribed_at',
    ];

    protected $casts = [
        'unsubscribed_types' => 'array',
        'unsubscribe_all' => 'boolean',
        'unsubscribed_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($unsubscribe) {
            if (empty($unsubscribe->token)) {
                $unsubscribe->token = Str::random(64);
            }
        });
    }

    /**
     * Get the user (if authenticated)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if email is unsubscribed from a specific type
     */
    public static function isUnsubscribed(string $email, string $emailType): bool
    {
        $unsubscribe = static::where('email', $email)->first();
        
        if (!$unsubscribe) {
            return false;
        }

        // If unsubscribe from all, return true
        if ($unsubscribe->unsubscribe_all) {
            return true;
        }

        // Check if specific type is unsubscribed
        if ($unsubscribe->unsubscribed_types && in_array($emailType, $unsubscribe->unsubscribed_types)) {
            return true;
        }

        return false;
    }

    /**
     * Unsubscribe email from specific types
     */
    public static function unsubscribe(string $email, array $types = [], bool $unsubscribeAll = false, ?int $userId = null): self
    {
        $unsubscribe = static::where('email', $email)->first();

        if ($unsubscribe) {
            if ($unsubscribeAll) {
                $unsubscribe->update([
                    'unsubscribe_all' => true,
                    'unsubscribed_types' => null,
                ]);
            } else {
                $existingTypes = $unsubscribe->unsubscribed_types ?? [];
                $newTypes = array_unique(array_merge($existingTypes, $types));
                $unsubscribe->update([
                    'unsubscribed_types' => $newTypes,
                ]);
            }
        } else {
            $unsubscribe = static::create([
                'email' => $email,
                'unsubscribed_types' => $unsubscribeAll ? null : $types,
                'unsubscribe_all' => $unsubscribeAll,
                'user_id' => $userId,
            ]);
        }

        return $unsubscribe;
    }

    /**
     * Resubscribe email (remove unsubscribe)
     */
    public static function resubscribe(string $email): bool
    {
        return static::where('email', $email)->delete();
    }

    /**
     * Resubscribe from specific types
     */
    public function resubscribeFromTypes(array $types): void
    {
        if ($this->unsubscribe_all) {
            // If unsubscribed from all, resubscribe means removing specific types from the all list
            // For now, we'll just remove the unsubscribe_all flag
            $this->update([
                'unsubscribe_all' => false,
                'unsubscribed_types' => [],
            ]);
        } else {
            $existingTypes = $this->unsubscribed_types ?? [];
            $remainingTypes = array_diff($existingTypes, $types);
            
            if (empty($remainingTypes)) {
                // If no types left, delete the unsubscribe record
                $this->delete();
            } else {
                $this->update([
                    'unsubscribed_types' => array_values($remainingTypes),
                ]);
            }
        }
    }
}
