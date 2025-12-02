<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IssueAssignment extends Model
{
    protected $fillable = [
        'issue_id',
        'user_id',
        'assigned_by',
        'assigned_at',
        'notes',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
    ];

    /**
     * Get the assigned issue
     */
    public function issue(): BelongsTo
    {
        return $this->belongsTo(Issue::class);
    }

    /**
     * Get the assigned user
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the user who made the assignment
     */
    public function assigner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }
}
