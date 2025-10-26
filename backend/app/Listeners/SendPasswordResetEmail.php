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

    // Specify queue connection explicitly
    public $connection = 'database';

    protected $emailService;

    /**
     * Create the event listener.
     */
    public function __construct(EmailService $emailService)
    {
        $this->emailService = $emailService;
        Log::info("SendPasswordResetEmail listener constructor called");
    }

    /**
     * Handle the event.
     */
    public function handle(PasswordResetRequested $event): void
    {
        try {
            Log::info("SendPasswordResetEmail listener triggered", [
                'user_email' => $event->user->email,
                'reset_url' => $event->resetUrl
            ]);
            
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
            Log::error("Error sending password reset email: " . $e->getMessage(), [
                'exception' => $e->getTraceAsString()
            ]);
        }
    }
}