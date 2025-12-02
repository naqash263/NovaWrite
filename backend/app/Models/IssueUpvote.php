<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IssueUpvote extends Model
{
    protected $fillable = [
        'issue_id',
        'user_id',
        'guest_ip',
    ];

    /**
     * Get the issue that was upvoted
     */
    public function issue(): BelongsTo
    {
        return $this->belongsTo(Issue::class);
    }

    /**
     * Get the user who upvoted (if authenticated)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
