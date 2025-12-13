<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Str;

class Issue extends Model
{
    protected $fillable = [
        'title',
        'slug',
        'description',
        'user_id',
        'guest_name',
        'guest_email',
        'category_id',
        'status',
        'priority',
        'assigned_to',
        'labels',
        'views_count',
        'upvotes_count',
        'comments_count',
        'is_pinned',
        'is_locked',
        'resolution_notes',
        'resolved_at',
        'resolved_by',
        'ip_address',
    ];

    protected $casts = [
        'labels' => 'array',
        'views_count' => 'integer',
        'upvotes_count' => 'integer',
        'comments_count' => 'integer',
        'is_pinned' => 'boolean',
        'is_locked' => 'boolean',
        'resolved_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($issue) {
            if (empty($issue->slug)) {
                $issue->slug = static::generateUniqueSlug($issue->title);
            }
        });

        static::updating(function ($issue) {
            if ($issue->isDirty('title') && empty($issue->slug)) {
                $issue->slug = static::generateUniqueSlug($issue->title, $issue->id);
            }
        });
    }

    protected static function generateUniqueSlug($title, $ignoreId = null)
    {
        $slug = Str::slug($title);
        $originalSlug = $slug;
        $counter = 1;

        while (static::where('slug', $slug)->when($ignoreId, function ($query, $id) {
            return $query->where('id', '!=', $id);
        })->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    /**
     * Get the user who created the issue
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the category
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(IssueCategory::class);
    }

    /**
     * Get the assigned user
     */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Get the user who resolved the issue
     */
    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    /**
     * Get all upvotes for this issue
     */
    public function upvotes(): HasMany
    {
        return $this->hasMany(IssueUpvote::class);
    }

    /**
     * Get all assignments for this issue
     */
    public function assignments(): HasMany
    {
        return $this->hasMany(IssueAssignment::class);
    }

    /**
     * Get all comments for this issue
     */
    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable');
    }

    /**
     * Get approved comments only
     */
    public function approvedComments(): MorphMany
    {
        return $this->comments()->where('is_approved', true);
    }

    /**
     * Check if a user has upvoted this issue
     */
    public function isUpvotedBy(?int $userId, ?string $guestIp = null): bool
    {
        if ($userId) {
            return $this->upvotes()->where('user_id', $userId)->exists();
        }
        
        if ($guestIp) {
            return $this->upvotes()->where('guest_ip', $guestIp)->exists();
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
     * Increment views count
     */
    public function incrementViews(): void
    {
        $this->increment('views_count');
    }

    /**
     * Increment upvotes count
     */
    public function incrementUpvotesCount(): void
    {
        $this->increment('upvotes_count');
    }

    /**
     * Decrement upvotes count
     */
    public function decrementUpvotesCount(): void
    {
        $this->decrement('upvotes_count');
    }

    /**
     * Increment comments count
     */
    public function incrementCommentsCount(): void
    {
        $this->increment('comments_count');
    }

    /**
     * Decrement comments count (with safeguard to prevent negative values)
     */
    public function decrementCommentsCount(): void
    {
        if ($this->comments_count > 0) {
            $this->decrement('comments_count');
        } else {
            // If count is already 0 or negative, recalculate from actual comments
            $this->recalculateCommentsCount();
        }
    }
    
    /**
     * Recalculate comments count from actual comments
     */
    public function recalculateCommentsCount(): void
    {
        $actualCount = $this->comments()->count();
        $this->update(['comments_count' => max(0, $actualCount)]);
    }

    /**
     * Mark issue as resolved
     */
    public function markAsResolved(int $resolvedBy, string $notes = null): void
    {
        $this->update([
            'status' => 'resolved',
            'resolved_at' => now(),
            'resolved_by' => $resolvedBy,
            'resolution_notes' => $notes,
        ]);
    }

    /**
     * Scope: Get open issues
     */
    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    /**
     * Scope: Get resolved issues
     */
    public function scopeResolved($query)
    {
        return $query->where('status', 'resolved');
    }

    /**
     * Scope: Get by priority
     */
    public function scopeByPriority($query, string $priority)
    {
        return $query->where('priority', $priority);
    }

    /**
     * Scope: Get pinned issues first
     */
    public function scopeOrderByPinned($query)
    {
        return $query->orderBy('is_pinned', 'desc');
    }
}
