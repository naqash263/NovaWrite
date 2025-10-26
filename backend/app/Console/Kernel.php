<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Reset AI credits daily at midnight
        $schedule->command('ai:reset-credits')
                 ->daily()
                 ->at('00:00')
                 ->timezone('UTC')
                 ->withoutOverlapping()
                 ->runInBackground();
                 
        // Reset API limits daily at 1:00 AM UTC
        $schedule->command('api:reset-limits')
                 ->daily()
                 ->at('01:00')
                 ->timezone('UTC')
                 ->withoutOverlapping()
                 ->runInBackground();
                 
        // Process email queue every minute
        $schedule->command('email:process-queue')
                 ->everyMinute()
                 ->withoutOverlapping()
                 ->runInBackground();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}










