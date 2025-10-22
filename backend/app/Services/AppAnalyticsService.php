<?php

namespace App\Services;

use App\Models\AppAnalytics;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AppAnalyticsService
{
    /**
     * Track an app analytics event.
     */
    public function trackEvent(
        string $eventType,
        Request $request,
        ?int $userId = null,
        array $customData = []
    ): AppAnalytics {
        $deviceInfo = $this->parseUserAgent($request->userAgent());
        $locationInfo = $this->getLocationInfo($request);
        
        return AppAnalytics::create([
            'user_id' => $userId,
            'event_type' => $eventType,
            'session_id' => $this->getSessionId($request),
            'device_id' => $this->getDeviceId($request),
            'country' => $locationInfo['country'],
            'region' => $locationInfo['region'],
            'city' => $locationInfo['city'],
            'latitude' => $locationInfo['latitude'],
            'longitude' => $locationInfo['longitude'],
            'timezone' => $locationInfo['timezone'],
            'user_agent' => $request->userAgent(),
            'platform' => $deviceInfo['platform'],
            'browser' => $deviceInfo['browser'],
            'browser_version' => $deviceInfo['browser_version'],
            'os' => $deviceInfo['os'],
            'os_version' => $deviceInfo['os_version'],
            'device_type' => $deviceInfo['device_type'],
            'screen_resolution' => $request->header('X-Screen-Resolution'),
            'is_mobile' => $deviceInfo['is_mobile'],
            'is_tablet' => $deviceInfo['is_tablet'],
            'is_desktop' => $deviceInfo['is_desktop'],
            'app_version' => $request->header('X-App-Version'),
            'install_source' => $customData['install_source'] ?? null,
            'uninstall_reason' => $customData['uninstall_reason'] ?? null,
            'session_duration' => $customData['session_duration'] ?? null,
            'page_views' => $customData['page_views'] ?? null,
            'custom_data' => $customData,
            'ip_address' => $request->ip(),
            'referrer' => $request->header('referer'),
            'utm_source' => $request->get('utm_source'),
            'utm_medium' => $request->get('utm_medium'),
            'utm_campaign' => $request->get('utm_campaign'),
            'event_timestamp' => now(),
        ]);
    }

    /**
     * Track app installation.
     */
    public function trackInstall(Request $request, ?int $userId = null, array $customData = []): AppAnalytics
    {
        return $this->trackEvent('install', $request, $userId, $customData);
    }

    /**
     * Track app uninstallation.
     */
    public function trackUninstall(Request $request, ?int $userId = null, array $customData = []): AppAnalytics
    {
        return $this->trackEvent('uninstall', $request, $userId, $customData);
    }

    /**
     * Track app launch.
     */
    public function trackLaunch(Request $request, ?int $userId = null, array $customData = []): AppAnalytics
    {
        return $this->trackEvent('launch', $request, $userId, $customData);
    }

    /**
     * Track background app activity.
     */
    public function trackBackground(Request $request, ?int $userId = null, array $customData = []): AppAnalytics
    {
        return $this->trackEvent('background', $request, $userId, $customData);
    }

    /**
     * Parse user agent to extract device information.
     */
    private function parseUserAgent(?string $userAgent): array
    {
        if (!$userAgent) {
            return [
                'platform' => 'unknown',
                'browser' => 'unknown',
                'browser_version' => null,
                'os' => 'unknown',
                'os_version' => null,
                'device_type' => 'unknown',
                'is_mobile' => false,
                'is_tablet' => false,
                'is_desktop' => true,
            ];
        }

        $isMobile = preg_match('/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i', $userAgent);
        $isTablet = preg_match('/iPad|Android.*Tablet|Kindle|Silk/i', $userAgent);
        $isDesktop = !$isMobile && !$isTablet;

        // Detect platform
        $platform = 'unknown';
        if (preg_match('/iPhone|iPad|iPod|Macintosh/i', $userAgent)) {
            $platform = 'ios';
        } elseif (preg_match('/Android/i', $userAgent)) {
            $platform = 'android';
        } elseif (preg_match('/Windows/i', $userAgent)) {
            $platform = 'windows';
        } elseif (preg_match('/Macintosh/i', $userAgent)) {
            $platform = 'macos';
        } elseif (preg_match('/Linux/i', $userAgent)) {
            $platform = 'linux';
        }

        // Detect browser
        $browser = 'unknown';
        $browserVersion = null;
        if (preg_match('/Chrome\/(\d+\.\d+)/i', $userAgent, $matches)) {
            $browser = 'chrome';
            $browserVersion = $matches[1];
        } elseif (preg_match('/Firefox\/(\d+\.\d+)/i', $userAgent, $matches)) {
            $browser = 'firefox';
            $browserVersion = $matches[1];
        } elseif (preg_match('/Safari\/(\d+\.\d+)/i', $userAgent, $matches)) {
            $browser = 'safari';
            $browserVersion = $matches[1];
        } elseif (preg_match('/Edge\/(\d+\.\d+)/i', $userAgent, $matches)) {
            $browser = 'edge';
            $browserVersion = $matches[1];
        }

        // Detect OS
        $os = 'unknown';
        $osVersion = null;
        if (preg_match('/Windows NT (\d+\.\d+)/i', $userAgent, $matches)) {
            $os = 'windows';
            $osVersion = $matches[1];
        } elseif (preg_match('/Mac OS X (\d+[._]\d+)/i', $userAgent, $matches)) {
            $os = 'macos';
            $osVersion = str_replace('_', '.', $matches[1]);
        } elseif (preg_match('/Android (\d+\.\d+)/i', $userAgent, $matches)) {
            $os = 'android';
            $osVersion = $matches[1];
        } elseif (preg_match('/iPhone OS (\d+[._]\d+)/i', $userAgent, $matches)) {
            $os = 'ios';
            $osVersion = str_replace('_', '.', $matches[1]);
        }

        // Determine device type
        $deviceType = 'desktop';
        if ($isMobile) {
            $deviceType = 'mobile';
        } elseif ($isTablet) {
            $deviceType = 'tablet';
        }

        return [
            'platform' => $platform,
            'browser' => $browser,
            'browser_version' => $browserVersion,
            'os' => $os,
            'os_version' => $osVersion,
            'device_type' => $deviceType,
            'is_mobile' => $isMobile,
            'is_tablet' => $isTablet,
            'is_desktop' => $isDesktop,
        ];
    }

    /**
     * Get location information from request.
     */
    private function getLocationInfo(Request $request): array
    {
        // In a real implementation, you might use a geolocation service
        // For now, we'll use basic IP-based detection or accept from frontend
        $country = $request->header('X-Country') ?? $request->get('country');
        $region = $request->header('X-Region') ?? $request->get('region');
        $city = $request->header('X-City') ?? $request->get('city');
        $latitude = $request->header('X-Latitude') ?? $request->get('latitude');
        $longitude = $request->header('X-Longitude') ?? $request->get('longitude');
        $timezone = $request->header('X-Timezone') ?? $request->get('timezone');

        return [
            'country' => $country,
            'region' => $region,
            'city' => $city,
            'latitude' => $latitude ? (float) $latitude : null,
            'longitude' => $longitude ? (float) $longitude : null,
            'timezone' => $timezone,
        ];
    }

    /**
     * Get or generate session ID.
     */
    private function getSessionId(Request $request): string
    {
        return $request->session()->getId() ?? uniqid('session_', true);
    }

    /**
     * Get or generate device ID.
     */
    private function getDeviceId(Request $request): string
    {
        $deviceId = $request->header('X-Device-ID') ?? $request->get('device_id');
        
        if (!$deviceId) {
            // Generate a device ID based on user agent and IP
            $deviceId = 'device_' . md5($request->userAgent() . $request->ip());
        }
        
        return $deviceId;
    }

    /**
     * Get analytics dashboard data.
     */
    public function getDashboardData($days = 30)
    {
        $startDate = now()->subDays($days);
        $endDate = now();

        return [
            'summary' => AppAnalytics::getSummary($startDate, $endDate),
            'daily_installs' => $this->getDailyInstalls($startDate, $endDate),
            'daily_uninstalls' => $this->getDailyUninstalls($startDate, $endDate),
            'retention_data' => AppAnalytics::getRetentionData($days),
            'top_countries' => $this->getTopCountries($startDate, $endDate),
            'platform_distribution' => $this->getPlatformDistribution($startDate, $endDate),
            'device_type_distribution' => $this->getDeviceTypeDistribution($startDate, $endDate),
        ];
    }

    /**
     * Get daily install counts.
     */
    private function getDailyInstalls($startDate, $endDate)
    {
        return AppAnalytics::installs()
            ->inDateRange($startDate, $endDate)
            ->selectRaw('DATE(event_timestamp) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->pluck('count', 'date');
    }

    /**
     * Get daily uninstall counts.
     */
    private function getDailyUninstalls($startDate, $endDate)
    {
        return AppAnalytics::uninstalls()
            ->inDateRange($startDate, $endDate)
            ->selectRaw('DATE(event_timestamp) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->pluck('count', 'date');
    }

    /**
     * Get top countries by install count.
     */
    private function getTopCountries($startDate, $endDate, $limit = 10)
    {
        return AppAnalytics::installs()
            ->inDateRange($startDate, $endDate)
            ->whereNotNull('country')
            ->selectRaw('country, COUNT(*) as count')
            ->groupBy('country')
            ->orderBy('count', 'desc')
            ->limit($limit)
            ->get()
            ->pluck('count', 'country');
    }

    /**
     * Get platform distribution.
     */
    private function getPlatformDistribution($startDate, $endDate)
    {
        return AppAnalytics::installs()
            ->inDateRange($startDate, $endDate)
            ->selectRaw('platform, COUNT(*) as count')
            ->groupBy('platform')
            ->get()
            ->pluck('count', 'platform');
    }

    /**
     * Get device type distribution.
     */
    private function getDeviceTypeDistribution($startDate, $endDate)
    {
        return AppAnalytics::installs()
            ->inDateRange($startDate, $endDate)
            ->whereNotNull('device_type')
            ->selectRaw('device_type, COUNT(*) as count')
            ->groupBy('device_type')
            ->get()
            ->pluck('count', 'device_type');
    }
}
