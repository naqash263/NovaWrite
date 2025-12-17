<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GeminiFallbackLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'tool_type',
        'prompt_hash',
        'fallback_reason',
        'gemini_error_code',
        'gemini_error_message',
        'n8n_response_time',
        'success',
        'response_size',
        'metadata'
    ];

    protected $casts = [
        'success' => 'boolean',
        'n8n_response_time' => 'decimal:3',
        'metadata' => 'array',
        'created_at' => 'datetime'
    ];

    /**
     * Tool types that use fallback
     */
    public const TOOL_TYPES = [
        'cv_extract' => 'CV Extraction',
        'cv_tailor' => 'CV Tailoring',
        'cover_letter' => 'Cover Letter',
        'interview_prep' => 'Interview Prep',
        'salary_negotiation' => 'Salary Negotiation',
        'skills_assessment' => 'Skills Assessment',
        'career_path' => 'Career Path',
        'job_search' => 'Job Search',
        'linkedin_analysis' => 'LinkedIn Analysis',
        'grammar_check' => 'Grammar Check',
        'text_summarize' => 'Text Summarizer',
        'article_rewrite' => 'Article Rewriter',
        'language_translate' => 'Language Translator',
        'contact_ai' => 'Contact AI'
    ];

    /**
     * Fallback reasons
     */
    public const FALLBACK_REASONS = [
        'quota_exceeded' => 'Quota Exceeded',
        'rate_limited' => 'Rate Limited',
        'api_error' => 'API Error',
        'timeout' => 'Timeout',
        'invalid_key' => 'Invalid Key',
        'service_unavailable' => 'Service Unavailable',
        'network_error' => 'Network Error',
        'invalid_response' => 'Invalid Response',
        'no_keys_available' => 'No Keys Available'
    ];

    /**
     * Get statistics for a specific tool type
     */
    public static function getToolStats(string $toolType, int $days = 7): array
    {
        $startDate = now()->subDays($days);
        
        $stats = self::where('tool_type', $toolType)
            ->where('created_at', '>=', $startDate)
            ->selectRaw('
                COUNT(*) as total_fallbacks,
                SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successful_fallbacks,
                AVG(n8n_response_time) as avg_response_time,
                AVG(response_size) as avg_response_size
            ')
            ->first();

        return [
            'tool_type' => $toolType,
            'total_fallbacks' => (int) ($stats->total_fallbacks ?? 0),
            'successful_fallbacks' => (int) ($stats->successful_fallbacks ?? 0),
            'success_rate' => $stats->total_fallbacks > 0 
                ? round(($stats->successful_fallbacks / $stats->total_fallbacks) * 100, 2)
                : 0,
            'avg_response_time' => round($stats->avg_response_time ?? 0, 3),
            'avg_response_size' => round($stats->avg_response_size ?? 0, 0)
        ];
    }

    /**
     * Get statistics by fallback reason
     */
    public static function getReasonStats(int $days = 7): array
    {
        $startDate = now()->subDays($days);
        
        return self::where('created_at', '>=', $startDate)
            ->selectRaw('
                fallback_reason,
                COUNT(*) as count,
                SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as success_count
            ')
            ->groupBy('fallback_reason')
            ->orderByDesc('count')
            ->get()
            ->map(function ($item) {
                return [
                    'reason' => $item->fallback_reason,
                    'count' => (int) $item->count,
                    'success_count' => (int) $item->success_count,
                    'success_rate' => $item->count > 0 
                        ? round(($item->success_count / $item->count) * 100, 2)
                        : 0
                ];
            })
            ->toArray();
    }

    /**
     * Get overall statistics
     */
    public static function getOverallStats(int $days = 7): array
    {
        $startDate = now()->subDays($days);
        
        $stats = self::where('created_at', '>=', $startDate)
            ->selectRaw('
                COUNT(*) as total_fallbacks,
                SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successful_fallbacks,
                AVG(n8n_response_time) as avg_response_time
            ')
            ->first();

        return [
            'total_fallbacks' => (int) ($stats->total_fallbacks ?? 0),
            'successful_fallbacks' => (int) ($stats->successful_fallbacks ?? 0),
            'success_rate' => $stats->total_fallbacks > 0 
                ? round(($stats->successful_fallbacks / $stats->total_fallbacks) * 100, 2)
                : 0,
            'avg_response_time' => round($stats->avg_response_time ?? 0, 3)
        ];
    }
}
