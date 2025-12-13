<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Comment extends Model
{
    protected $fillable = [
        'commentable_type',
        'commentable_id',
        'user_id',
        'parent_id',
        'content',
        'guest_name',
        'guest_email',
        'is_approved',
        'is_edited',
        'edited_at',
        'likes_count',
        'replies_count',
        'is_pinned',
        'is_spam',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'is_approved' => 'boolean',
        'is_edited' => 'boolean',
        'is_pinned' => 'boolean',
        'is_spam' => 'boolean',
        'edited_at' => 'datetime',
        'likes_count' => 'integer',
        'replies_count' => 'integer',
    ];

    /**
     * Get the parent model (Post, Workflow, Course, etc.)
     */
    public function commentable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get the user who created the comment
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the parent comment (for nested replies)
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Comment::class, 'parent_id');
    }

    /**
     * Get all replies to this comment
     */
    public function replies(): HasMany
    {
        return $this->hasMany(Comment::class, 'parent_id')->orderBy('created_at', 'asc');
    }

    /**
     * Get approved replies only
     */
    public function approvedReplies(): HasMany
    {
        return $this->replies()->where('is_approved', true);
    }

    /**
     * Get all likes for this comment
     */
    public function likes(): HasMany
    {
        return $this->hasMany(CommentLike::class);
    }

    /**
     * Get all reports for this comment
     */
    public function reports(): HasMany
    {
        return $this->hasMany(CommentReport::class);
    }

    /**
     * Check if a user has liked this comment
     */
    public function isLikedBy(?int $userId, ?string $guestIp = null): bool
    {
        if ($userId) {
            return $this->likes()->where('user_id', $userId)->exists();
        }
        
        if ($guestIp) {
            return $this->likes()->where('guest_ip', $guestIp)->exists();
        }
        
        return false;
    }

    /**
     * Get the author name (user name or guest name)
     */
    public function getAuthorNameAttribute(): string
    {
        return $this->user ? $this->user->name : ($this->guest_name ?? 'Anonymous');
    }

    /**
     * Get the author email (user email or guest email)
     */
    public function getAuthorEmailAttribute(): ?string
    {
        return $this->user ? $this->user->email : $this->guest_email;
    }

    /**
     * Check if comment can be edited by user
     */
    public function canBeEditedBy(?User $user): bool
    {
        if (!$user) {
            return false;
        }

        // Admin can edit any comment
        if ($user->role === 'admin') {
            return true;
        }

        // User can edit their own comments within 15 minutes
        if ($this->user_id === $user->id) {
            $minutesSinceCreation = $this->created_at->diffInMinutes(now());
            return $minutesSinceCreation <= 15;
        }

        return false;
    }

    /**
     * Check if comment can be deleted by user
     * Only admins can delete comments
     */
    public function canBeDeletedBy(?User $user): bool
    {
        if (!$user) {
            return false;
        }

        // Only admins can delete comments
        return $user->role === 'admin';
    }

    /**
     * Increment likes count
     */
    public function incrementLikesCount(): void
    {
        $this->increment('likes_count');
    }

    /**
     * Decrement likes count
     */
    public function decrementLikesCount(): void
    {
        $this->decrement('likes_count');
    }

    /**
     * Increment replies count
     */
    public function incrementRepliesCount(): void
    {
        $this->increment('replies_count');
    }

    /**
     * Decrement replies count
     */
    public function decrementRepliesCount(): void
    {
        $this->decrement('replies_count');
    }

    /**
     * Mark comment as edited
     */
    public function markAsEdited(): void
    {
        $this->update([
            'is_edited' => true,
            'edited_at' => now(),
        ]);
    }

    /**
     * Scope: Get approved comments only
     */
    public function scopeApproved($query)
    {
        return $query->where('is_approved', true);
    }

    /**
     * Scope: Get top-level comments (no parent)
     */
    public function scopeTopLevel($query)
    {
        return $query->whereNull('parent_id');
    }

    /**
     * Scope: Get pinned comments first
     */
    public function scopeOrderByPinned($query)
    {
        return $query->orderBy('is_pinned', 'desc');
    }
}
