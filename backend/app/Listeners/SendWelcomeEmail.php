<?php

namespace App\Listeners;

use App\Events\UserRegistered;
use App\Services\EmailService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class SendWelcomeEmail implements ShouldQueue
{
    use InteractsWithQueue;

    protected $emailService;

    /**
     * Create the event listener.
     */
    public function __construct(EmailService $emailService)
    {
        $this->emailService = $emailService;
    }

    /**
     * Handle the event.
     */
    public function handle(UserRegistered $event): void
    {
        try {
            $user = $event->user;
            
            // Send welcome email using the EmailService
            $success = $this->emailService->sendWelcomeEmail($user);
            
            if ($success) {
                Log::info("Welcome email sent successfully to user: {$user->email}");
            } else {
                Log::error("Failed to send welcome email to user: {$user->email}");
            }
        } catch (\Exception $e) {
            Log::error("Error sending welcome email: " . $e->getMessage());
        }
    }
}