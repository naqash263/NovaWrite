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
        'attempts'
    ];

    protected $casts = [
        'payload' => 'array',
        'response' => 'array',
        'attempts' => 'integer'
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
                ->get()
        ];
    }
}