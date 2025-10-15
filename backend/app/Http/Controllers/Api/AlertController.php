<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class AlertController extends Controller
{
    /**
     * Send critical alert
     */
    public function sendCriticalAlert(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
            'details' => 'nullable|string',
            'component' => 'nullable|string',
            'severity' => 'required|in:low,medium,high,critical'
        ]);

        $alert = [
            'message' => $request->message,
            'details' => $request->details,
            'component' => $request->component ?? 'Unknown',
            'severity' => $request->severity,
            'timestamp' => now()->toISOString(),
            'server' => gethostname(),
            'environment' => app()->environment()
        ];

        // Log the alert
        Log::critical('Production Alert', $alert);

        // Send email alert
        $this->sendEmailAlert($alert);

        // Store in cache for dashboard
        $this->storeAlertInCache($alert);

        return response()->json([
            'success' => true,
            'message' => 'Alert sent successfully',
            'alert_id' => $alert['timestamp']
        ]);
    }

    /**
     * Get recent alerts
     */
    public function getRecentAlerts(Request $request)
    {
        $hours = $request->get('hours', 24);
        $severity = $request->get('severity');
        
        $alerts = Cache::get('recent_alerts', []);
        
        // Filter by time
        $cutoff = now()->subHours($hours);
        $alerts = array_filter($alerts, function($alert) use ($cutoff) {
            return strtotime($alert['timestamp']) > $cutoff->timestamp;
        });
        
        // Filter by severity if specified
        if ($severity) {
            $alerts = array_filter($alerts, function($alert) use ($severity) {
                return $alert['severity'] === $severity;
            });
        }
        
        // Sort by timestamp (newest first)
        usort($alerts, function($a, $b) {
            return strtotime($b['timestamp']) - strtotime($a['timestamp']);
        });
        
        return response()->json([
            'success' => true,
            'alerts' => array_values($alerts),
            'total' => count($alerts)
        ]);
    }

    /**
     * Get alert statistics
     */
    public function getAlertStats(Request $request)
    {
        $hours = $request->get('hours', 24);
        $alerts = Cache::get('recent_alerts', []);
        
        $cutoff = now()->subHours($hours);
        $recentAlerts = array_filter($alerts, function($alert) use ($cutoff) {
            return strtotime($alert['timestamp']) > $cutoff->timestamp;
        });
        
        $stats = [
            'total' => count($recentAlerts),
            'by_severity' => [
                'critical' => 0,
                'high' => 0,
                'medium' => 0,
                'low' => 0
            ],
            'by_component' => [],
            'last_24h' => count($recentAlerts),
            'last_hour' => count(array_filter($recentAlerts, function($alert) {
                return strtotime($alert['timestamp']) > now()->subHour()->timestamp;
            }))
        ];
        
        foreach ($recentAlerts as $alert) {
            $stats['by_severity'][$alert['severity']]++;
            
            $component = $alert['component'];
            if (!isset($stats['by_component'][$component])) {
                $stats['by_component'][$component] = 0;
            }
            $stats['by_component'][$component]++;
        }
        
        return response()->json([
            'success' => true,
            'stats' => $stats
        ]);
    }

    /**
     * Send email alert
     */
    private function sendEmailAlert($alert)
    {
        try {
            $subject = "Naqash Thaheem Production Alert - {$alert['severity']}";
            $message = "Alert Details:\n\n";
            $message .= "Message: {$alert['message']}\n";
            $message .= "Component: {$alert['component']}\n";
            $message .= "Severity: {$alert['severity']}\n";
            $message .= "Time: {$alert['timestamp']}\n";
            $message .= "Server: {$alert['server']}\n";
            $message .= "Environment: {$alert['environment']}\n\n";
            
            if ($alert['details']) {
                $message .= "Details:\n{$alert['details']}\n\n";
            }
            
            $message .= "Please check the system immediately.\n";
            $message .= "Monitoring Dashboard: https://naqashthaheem.com/admin/monitoring\n";
            
            // Send email (you can configure this with your SMTP settings)
            Mail::raw($message, function($mail) use ($subject) {
                $mail->to('naqash263@gmail.com')
                     ->subject($subject);
            });
            
        } catch (\Exception $e) {
            Log::error('Failed to send email alert: ' . $e->getMessage());
        }
    }

    /**
     * Store alert in cache
     */
    private function storeAlertInCache($alert)
    {
        $alerts = Cache::get('recent_alerts', []);
        $alerts[] = $alert;
        
        // Keep only last 100 alerts
        if (count($alerts) > 100) {
            $alerts = array_slice($alerts, -100);
        }
        
        Cache::put('recent_alerts', $alerts, now()->addDays(7));
    }

    /**
     * Test alert system
     */
    public function testAlert(Request $request)
    {
        $alert = [
            'message' => 'Test alert from monitoring system',
            'details' => 'This is a test alert to verify the alert system is working correctly.',
            'component' => 'Monitoring System',
            'severity' => 'low',
            'timestamp' => now()->toISOString(),
            'server' => gethostname(),
            'environment' => app()->environment()
        ];

        Log::info('Test Alert Sent', $alert);
        $this->storeAlertInCache($alert);

        return response()->json([
            'success' => true,
            'message' => 'Test alert sent successfully',
            'alert' => $alert
        ]);
    }
}
