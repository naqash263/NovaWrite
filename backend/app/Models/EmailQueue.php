<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class EmailQueue extends Model
{
    use HasFactory;

    protected $table = 'email_queue';

    protected $fillable = [
        'action',
        'recipient_email',
        'recipient_name',
        'details',
        'status',
        'attempts',
        'max_attempts',
        'last_error',
        'next_retry_at',
        'completed_at'
    ];

    protected $casts = [
        'details' => 'array',
        'next_retry_at' => 'datetime',
        'completed_at' => 'datetime',
        'attempts' => 'integer',
        'max_attempts' => 'integer'
    ];

    /**
     * Scope for pending items
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for failed items
     */
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * Scope for items ready for retry
     */
    public function scopeReadyForRetry($query)
    {
        return $query->where('status', 'pending')
                    ->where('next_retry_at', '<=', now());
    }

    /**
     * Mark as processing
     */
    public function markAsProcessing(): void
    {
        $this->update(['status' => 'processing']);
    }

    /**
     * Mark as completed
     */
    public function markAsCompleted(): void
    {
        $this->update([
            'status' => 'completed',
            'completed_at' => now()
        ]);
    }

    /**
     * Mark as failed
     */
    public function markAsFailed(string $error): void
    {
        $this->update([
            'status' => 'failed',
            'last_error' => $error
        ]);
    }

    /**
     * Increment attempts and calculate next retry time
     */
    public function incrementAttempts(): void
    {
        $this->attempts++;
        
        if ($this->attempts < $this->max_attempts) {
            // Exponential backoff: 2^attempts minutes
            $minutes = pow(2, $this->attempts);
            $this->next_retry_at = now()->addMinutes($minutes);
            $this->status = 'pending';
        } else {
            $this->status = 'failed';
        }
        
        $this->save();
    }

    /**
     * Check if can retry
     */
    public function canRetry(): bool
    {
        return $this->status === 'pending' && 
               $this->attempts < $this->max_attempts &&
               $this->next_retry_at <= now();
    }
}