<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmailLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'action',
        'recipient_email',
        'status',
        'error_message',
        'payload',
        'response',
        'attempts',
        'failure_reason_code',
        'failure_category',
        'error_details',
        'http_status_code',
        'provider_name'
    ];

    protected $casts = [
        'payload' => 'array',
        'response' => 'array',
        'error_details' => 'array',
        'attempts' => 'integer',
        'http_status_code' => 'integer'
    ];

    /**
     * Scope for failed emails
     */
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * Scope for recent logs
     */
    public function scopeRecent($query, $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    /**
     * Get statistics
     */
    public static function getStatistics($days = 30)
    {
        $query = static::where('created_at', '>=', now()->subDays($days));
        
        return [
            'total' => $query->count(),
            'success' => $query->where('status', 'success')->count(),
            'failed' => $query->where('status', 'failed')->count(),
            'success_rate' => $query->count() > 0 ? 
                round(($query->where('status', 'success')->count() / $query->count()) * 100, 2) : 0,
            'common_errors' => $query->where('status', 'failed')
                ->whereNotNull('error_message')
                ->selectRaw('error_message, COUNT(*) as count')
                ->groupBy('error_message')
                ->orderBy('count', 'desc')
                ->limit(5)
                ->get(),
            'failure_categories' => static::getFailureCategories($days),
            'failure_by_provider' => static::getFailureByProvider($days),
            'failure_trends' => static::getFailureTrends($days)
        ];
    }

    /**
     * Get failure statistics by category
     */
    public static function getFailureCategories($days = 30)
    {
        return static::where('created_at', '>=', now()->subDays($days))
            ->where('status', 'failed')
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
    public static function getFailureByProvider($days = 30)
    {
        return static::where('created_at', '>=', now()->subDays($days))
            ->where('status', 'failed')
            ->whereNotNull('provider_name')
            ->selectRaw('provider_name, COUNT(*) as count')
            ->groupBy('provider_name')
            ->orderBy('count', 'desc')
            ->get();
    }

    /**
     * Get failure trends over time
     */
    public static function getFailureTrends($days = 30)
    {
        return static::where('created_at', '>=', now()->subDays($days))
            ->where('status', 'failed')
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();
    }
}