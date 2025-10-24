<?php

namespace App\Listeners;

use App\Events\PasswordResetRequested;
use App\Services\EmailService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class SendPasswordResetEmail implements ShouldQueue
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
    public function handle(PasswordResetRequested $event): void
    {
        try {
            $user = $event->user;
            $resetUrl = $event->resetUrl;
            
            // Send password reset email using the EmailService
            $success = $this->emailService->sendPasswordResetEmail($user, $resetUrl);
            
            if ($success) {
                Log::info("Password reset email sent successfully to user: {$user->email}");
            } else {
                Log::error("Failed to send password reset email to user: {$user->email}");
            }
        } catch (\Exception $e) {
            Log::error("Error sending password reset email: " . $e->getMessage());
        }
    }
}