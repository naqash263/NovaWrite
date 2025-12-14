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
        'completed_at',
        'failure_reason_code',
        'failure_category',
        'error_details',
        'http_status_code',
        'provider_name'
    ];

    protected $casts = [
        'details' => 'array',
        'error_details' => 'array',
        'next_retry_at' => 'datetime',
        'completed_at' => 'datetime',
        'attempts' => 'integer',
        'max_attempts' => 'integer',
        'http_status_code' => 'integer'
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
                    ->where(function($q) {
                        $q->whereNull('next_retry_at')
                          ->orWhere('next_retry_at', '<=', now());
                    });
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
    public function markAsFailed(string $error, ?array $failureInfo = null): void
    {
        $updateData = [
            'status' => 'failed',
            'last_error' => $error
        ];

        if ($failureInfo) {
            $updateData = array_merge($updateData, $failureInfo);
        }

        $this->update($updateData);
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

    /**
     * Get failure statistics by category
     */
    public static function getFailureCategories()
    {
        return static::where('status', 'failed')
            ->whereNotNull('failure_category')
            ->selectRaw('failure_category, COUNT(*) as count')
            ->groupBy('failure_category')
            ->orderBy('count', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'category' => $item->failure_category,
                    'count' => $item->count,
                    'description' => \App\Services\EmailFailureAnalyzer::getCategoryDescription($item->failure_category),
                    'suggested_action' => \App\Services\EmailFailureAnalyzer::getSuggestedAction($item->failure_category)
                ];
            });
    }

    /**
     * Get failure statistics by provider
     */
    public static function getFailureByProvider()
    {
        return static::where('status', 'failed')
            ->whereNotNull('provider_name')
            ->selectRaw('provider_name, COUNT(*) as count')
            ->groupBy('provider_name')
            ->orderBy('count', 'desc')
            ->get();
    }
}