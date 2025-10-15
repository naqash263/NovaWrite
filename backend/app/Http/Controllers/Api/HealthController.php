<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Models\Course;
use App\Models\Post;
use App\Models\Workflow;

class HealthController extends Controller
{
    /**
     * Basic health check endpoint
     */
    public function basic()
    {
        try {
            return response()->json([
                'status' => 'healthy',
                'timestamp' => now()->toISOString(),
                'service' => 'Naqash Thaheem API',
                'version' => '1.0.0'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
                'timestamp' => now()->toISOString()
            ], 500);
        }
    }

    /**
     * Comprehensive health check
     */
    public function comprehensive()
    {
        $checks = [];
        $overallStatus = 'healthy';
        $criticalIssues = 0;

        // Database connectivity check
        try {
            $dbStart = microtime(true);
            DB::connection()->getPdo();
            $dbTime = round((microtime(true) - $dbStart) * 1000, 2);
            
            $checks['database'] = [
                'status' => 'healthy',
                'response_time_ms' => $dbTime,
                'connection' => 'active'
            ];
        } catch (\Exception $e) {
            $checks['database'] = [
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
                'connection' => 'failed'
            ];
            $overallStatus = 'unhealthy';
            $criticalIssues++;
        }

        // Storage check
        try {
            $storageStart = microtime(true);
            $testFile = 'health_check_' . time() . '.txt';
            Storage::disk('public')->put($testFile, 'Health check test');
            $content = Storage::disk('public')->get($testFile);
            Storage::disk('public')->delete($testFile);
            $storageTime = round((microtime(true) - $storageStart) * 1000, 2);
            
            $checks['storage'] = [
                'status' => 'healthy',
                'response_time_ms' => $storageTime,
                'writable' => true,
                'readable' => $content === 'Health check test'
            ];
        } catch (\Exception $e) {
            $checks['storage'] = [
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
                'writable' => false
            ];
            $overallStatus = 'unhealthy';
            $criticalIssues++;
        }

        // Cache check
        try {
            $cacheStart = microtime(true);
            $cacheKey = 'health_check_' . time();
            Cache::put($cacheKey, 'test', 60);
            $cached = Cache::get($cacheKey);
            Cache::forget($cacheKey);
            $cacheTime = round((microtime(true) - $cacheStart) * 1000, 2);
            
            $checks['cache'] = [
                'status' => 'healthy',
                'response_time_ms' => $cacheTime,
                'working' => $cached === 'test'
            ];
        } catch (\Exception $e) {
            $checks['cache'] = [
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
                'working' => false
            ];
            $overallStatus = 'degraded';
        }

        // Database performance check
        try {
            $perfStart = microtime(true);
            $userCount = User::count();
            $courseCount = Course::count();
            $postCount = Post::count();
            $workflowCount = Workflow::count();
            $perfTime = round((microtime(true) - $perfStart) * 1000, 2);
            
            $checks['database_performance'] = [
                'status' => 'healthy',
                'response_time_ms' => $perfTime,
                'records' => [
                    'users' => $userCount,
                    'courses' => $courseCount,
                    'posts' => $postCount,
                    'workflows' => $workflowCount
                ]
            ];
        } catch (\Exception $e) {
            $checks['database_performance'] = [
                'status' => 'unhealthy',
                'error' => $e->getMessage()
            ];
            $overallStatus = 'unhealthy';
            $criticalIssues++;
        }

        // Memory usage check
        $memoryUsage = memory_get_usage(true);
        $memoryPeak = memory_get_peak_usage(true);
        $memoryLimit = ini_get('memory_limit');
        
        $checks['memory'] = [
            'status' => 'healthy',
            'current_usage_mb' => round($memoryUsage / 1024 / 1024, 2),
            'peak_usage_mb' => round($memoryPeak / 1024 / 1024, 2),
            'limit' => $memoryLimit
        ];

        // Disk space check
        $diskFree = disk_free_space(storage_path());
        $diskTotal = disk_total_space(storage_path());
        $diskUsagePercent = round((($diskTotal - $diskFree) / $diskTotal) * 100, 2);
        
        $checks['disk_space'] = [
            'status' => $diskUsagePercent > 90 ? 'critical' : ($diskUsagePercent > 80 ? 'warning' : 'healthy'),
            'usage_percent' => $diskUsagePercent,
            'free_space_gb' => round($diskFree / 1024 / 1024 / 1024, 2),
            'total_space_gb' => round($diskTotal / 1024 / 1024 / 1024, 2)
        ];

        if ($diskUsagePercent > 90) {
            $overallStatus = 'critical';
            $criticalIssues++;
        } elseif ($diskUsagePercent > 80) {
            $overallStatus = 'warning';
        }

        // Log recent errors
        $recentErrors = $this->getRecentErrors();
        if ($recentErrors > 0) {
            $checks['recent_errors'] = [
                'status' => 'warning',
                'error_count_last_hour' => $recentErrors
            ];
            if ($overallStatus === 'healthy') {
                $overallStatus = 'warning';
            }
        }

        $response = [
            'status' => $overallStatus,
            'timestamp' => now()->toISOString(),
            'service' => 'Naqash Thaheem API',
            'version' => '1.0.0',
            'critical_issues' => $criticalIssues,
            'checks' => $checks
        ];

        // Log health check results
        Log::info('Health check performed', [
            'status' => $overallStatus,
            'critical_issues' => $criticalIssues,
            'checks' => array_keys($checks)
        ]);

        $statusCode = $overallStatus === 'healthy' ? 200 : 
                     ($overallStatus === 'warning' ? 200 : 503);

        return response()->json($response, $statusCode);
    }

    /**
     * Get recent error count from logs
     */
    private function getRecentErrors()
    {
        try {
            $logFile = storage_path('logs/laravel.log');
            if (!file_exists($logFile)) {
                return 0;
            }

            $oneHourAgo = now()->subHour()->format('Y-m-d H:i:s');
            $errorCount = 0;
            
            $handle = fopen($logFile, 'r');
            if ($handle) {
                while (($line = fgets($handle)) !== false) {
                    if (strpos($line, $oneHourAgo) !== false && 
                        (strpos($line, 'ERROR') !== false || strpos($line, 'CRITICAL') !== false)) {
                        $errorCount++;
                    }
                }
                fclose($handle);
            }
            
            return $errorCount;
        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * Database-specific health check
     */
    public function database()
    {
        try {
            $start = microtime(true);
            
            // Test basic connection
            DB::connection()->getPdo();
            
            // Test query performance
            $userCount = User::count();
            $courseCount = Course::count();
            
            // Test transaction
            DB::beginTransaction();
            DB::rollBack();
            
            $responseTime = round((microtime(true) - $start) * 1000, 2);
            
            return response()->json([
                'status' => 'healthy',
                'response_time_ms' => $responseTime,
                'connection' => 'active',
                'records' => [
                    'users' => $userCount,
                    'courses' => $courseCount
                ],
                'timestamp' => now()->toISOString()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
                'timestamp' => now()->toISOString()
            ], 503);
        }
    }

    /**
     * Storage-specific health check
     */
    public function storage()
    {
        try {
            $start = microtime(true);
            
            // Test file operations
            $testFile = 'health_check_' . time() . '.txt';
            $testContent = 'Health check test at ' . now()->toISOString();
            
            // Write test
            Storage::disk('public')->put($testFile, $testContent);
            
            // Read test
            $readContent = Storage::disk('public')->get($testFile);
            
            // Delete test
            Storage::disk('public')->delete($testFile);
            
            $responseTime = round((microtime(true) - $start) * 1000, 2);
            
            return response()->json([
                'status' => 'healthy',
                'response_time_ms' => $responseTime,
                'writable' => true,
                'readable' => $readContent === $testContent,
                'timestamp' => now()->toISOString()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
                'timestamp' => now()->toISOString()
            ], 503);
        }
    }
}
