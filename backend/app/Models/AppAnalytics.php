<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppAnalytics extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'event_type',
        'session_id',
        'device_id',
        'country',
        'region',
        'city',
        'latitude',
        'longitude',
        'timezone',
        'user_agent',
        'platform',
        'browser',
        'browser_version',
        'os',
        'os_version',
        'device_type',
        'screen_resolution',
        'is_mobile',
        'is_tablet',
        'is_desktop',
        'app_version',
        'install_source',
        'uninstall_reason',
        'session_duration',
        'page_views',
        'custom_data',
        'ip_address',
        'referrer',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'event_timestamp',
    ];

    protected $casts = [
        'custom_data' => 'array',
        'is_mobile' => 'boolean',
        'is_tablet' => 'boolean',
        'is_desktop' => 'boolean',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'event_timestamp' => 'datetime',
    ];

    /**
     * Get the user that owns the analytics record.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope a query to only include install events.
     */
    public function scopeInstalls($query)
    {
        return $query->where('event_type', 'install');
    }

    /**
     * Scope a query to only include uninstall events.
     */
    public function scopeUninstalls($query)
    {
        return $query->where('event_type', 'uninstall');
    }

    /**
     * Scope a query to only include launch events.
     */
    public function scopeLaunches($query)
    {
        return $query->where('event_type', 'launch');
    }

    /**
     * Scope a query to only include events for a specific platform.
     */
    public function scopeForPlatform($query, $platform)
    {
        return $query->where('platform', $platform);
    }

    /**
     * Scope a query to only include events for a specific country.
     */
    public function scopeForCountry($query, $country)
    {
        return $query->where('country', $country);
    }

    /**
     * Scope a query to only include events within a date range.
     */
    public function scopeInDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('event_timestamp', [$startDate, $endDate]);
    }

    /**
     * Get analytics summary for a specific period.
     */
    public static function getSummary($startDate = null, $endDate = null)
    {
        $query = static::query();
        
        if ($startDate && $endDate) {
            $query->inDateRange($startDate, $endDate);
        }

        return [
            'total_installs' => $query->installs()->count(),
            'total_uninstalls' => $query->uninstalls()->count(),
            'total_launches' => $query->launches()->count(),
            'net_installs' => $query->installs()->count() - $query->uninstalls()->count(),
            'platforms' => $query->selectRaw('platform, COUNT(*) as count')
                ->groupBy('platform')
                ->pluck('count', 'platform'),
            'countries' => $query->selectRaw('country, COUNT(*) as count')
                ->whereNotNull('country')
                ->groupBy('country')
                ->orderBy('count', 'desc')
                ->limit(10)
                ->pluck('count', 'country'),
            'device_types' => $query->selectRaw('device_type, COUNT(*) as count')
                ->whereNotNull('device_type')
                ->groupBy('device_type')
                ->pluck('count', 'device_type'),
        ];
    }

    /**
     * Get install retention data.
     */
    public static function getRetentionData($days = 30)
    {
        $startDate = now()->subDays($days);
        
        $installs = static::installs()
            ->where('event_timestamp', '>=', $startDate)
            ->get();

        $retention = [];
        
        foreach ($installs as $install) {
            $deviceId = $install->device_id;
            $installDate = $install->event_timestamp;
            
            // Check if device had any activity after install
            $hasActivity = static::where('device_id', $deviceId)
                ->where('event_timestamp', '>', $installDate)
                ->where('event_type', '!=', 'install')
                ->exists();
            
            $retention[] = [
                'device_id' => $deviceId,
                'install_date' => $installDate,
                'retained' => $hasActivity,
            ];
        }

        return $retention;
    }
}