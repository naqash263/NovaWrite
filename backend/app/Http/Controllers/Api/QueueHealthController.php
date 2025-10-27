<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class QueueHealthController extends Controller
{
    /**
     * Check queue worker and scheduler health status
     */
    public function check(): JsonResponse
    {
        try {
            $queueWorkerRunning = false;
            $schedulerRunning = false;
            $queueWorkerProcess = null;
            $schedulerProcess = null;

            // Check if queue worker is running
            exec("ps aux | grep '[q]ueue:work'", $queueWorkerOutput);
            if (!empty($queueWorkerOutput)) {
                $queueWorkerRunning = true;
                $queueWorkerProcess = $queueWorkerOutput[0] ?? 'Running';
            }

            // Check if scheduler is running
            exec("ps aux | grep '[s]chedule:work'", $schedulerOutput);
            if (!empty($schedulerOutput)) {
                $schedulerRunning = true;
                $schedulerProcess = $schedulerOutput[0] ?? 'Running';
            }

            // Count pending emails
            $pendingEmails = \DB::table('email_queue')
                ->where('status', 'pending')
                ->count();

            // Count jobs in Laravel queue
            $jobsCount = \DB::table('jobs')->count();

            $status = 'healthy';
            $issues = [];

            if (!$queueWorkerRunning && $pendingEmails > 0) {
                $status = 'warning';
                $issues[] = 'Queue worker is not running, but there are pending emails in the queue.';
            }

            if (!$queueWorkerRunning) {
                $status = 'error';
                $issues[] = 'Queue worker is not running. Emails will not be processed.';
            }

            if (!$schedulerRunning) {
                $status = 'warning';
                $issues[] = 'Scheduler is not running. Scheduled jobs will not execute.';
            }

            // Get N8n configuration status
            $n8nConfig = \App\Models\N8nConfiguration::where('is_active', true)->first();

            return response()->json([
                'status' => $status,
                'queue_worker' => [
                    'running' => $queueWorkerRunning,
                    'process' => $queueWorkerProcess
                ],
                'scheduler' => [
                    'running' => $schedulerRunning,
                    'process' => $schedulerProcess
                ],
                'pending_emails' => $pendingEmails,
                'jobs_in_queue' => $jobsCount,
                'n8n_config_active' => $n8nConfig ? true : false,
                'issues' => $issues,
                'instructions' => $this->getInstructions($queueWorkerRunning, $schedulerRunning)
            ]);

        } catch (\Exception $e) {
            Log::error("Queue health check failed: " . $e->getMessage());
            
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to check queue health',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get instructions to start queue worker
     */
    private function getInstructions(bool $queueWorkerRunning, bool $schedulerRunning): array
    {
        $instructions = [];

        if (!$queueWorkerRunning) {
            $instructions[] = [
                'service' => 'Queue Worker',
                'command' => 'cd ~/naqashthaheem.com/backend && nohup php artisan queue:work --sleep=3 --tries=3 --max-time=3600 --timeout=120 > storage/logs/queue-worker.log 2>&1 &',
                'verify' => 'ps aux | grep queue:work'
            ];
        }

        if (!$schedulerRunning) {
            $instructions[] = [
                'service' => 'Scheduler',
                'command' => 'cd ~/naqashthaheem.com/backend && nohup php artisan schedule:work > storage/logs/scheduler.log 2>&1 &',
                'verify' => 'ps aux | grep schedule:work'
            ];
        }

        return $instructions;
    }
}

