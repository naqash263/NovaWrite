<?php

namespace App\Services;

use App\Mail\WelcomeEmail;
use App\Mail\PasswordResetEmail;
use App\Mail\CourseEnrollmentEmail;
use App\Mail\WorkflowNotificationEmail;
use App\Mail\DynamicEmail;
use App\Models\User;
use App\Models\Course;
use App\Models\Workflow;
use App\Models\SmtpConfiguration;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class EmailService
{
    /**
     * Apply SMTP configuration from database
     */
    protected function applySmtpConfiguration()
    {
        $smtpConfig = SmtpConfiguration::getActive();
        
        if ($smtpConfig) {
            config([
                'mail.default' => 'smtp',
                'mail.mailers.smtp.host' => $smtpConfig->host,
                'mail.mailers.smtp.port' => $smtpConfig->port,
                'mail.mailers.smtp.username' => $smtpConfig->username,
                'mail.mailers.smtp.password' => $smtpConfig->password,
                'mail.mailers.smtp.encryption' => $smtpConfig->encryption,
                'mail.from.address' => $smtpConfig->from_address,
                'mail.from.name' => $smtpConfig->from_name,
            ]);
        }
    }

    /**
     * Send welcome email to new user
     */
    public function sendWelcomeEmail(User $user): bool
    {
        try {
            $this->applySmtpConfiguration();
            
            // Try to use dynamic template first, fallback to static template
            $template = \App\Models\EmailTemplate::getByName('welcome');
            if ($template) {
                $variables = [
                    'user_name' => $user->name,
                    'user_email' => $user->email,
                    'app_name' => config('app.name'),
                    'app_url' => config('app.url'),
                    'login_url' => config('app.url') . '/login',
                ];
                Mail::to($user->email)->send(new DynamicEmail('welcome', $variables));
            } else {
                Mail::to($user->email)->send(new WelcomeEmail($user));
            }
            Log::info("Welcome email sent to user: {$user->email}");
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to send welcome email to {$user->email}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send password reset email
     */
    public function sendPasswordResetEmail(User $user): bool
    {
        try {
            $this->applySmtpConfiguration();
            
            // Generate a temporary token for password reset
            $token = Str::random(64);
            
            // Store the token in the user's remember_token field temporarily
            $user->remember_token = Hash::make($token);
            $user->save();

            // Create reset URL
            $resetUrl = config('app.url') . '/reset-password?token=' . $token . '&email=' . urlencode($user->email);

            // Try to use dynamic template first, fallback to static template
            $template = \App\Models\EmailTemplate::getByName('password_reset');
            if ($template) {
                $variables = [
                    'user_name' => $user->name,
                    'user_email' => $user->email,
                    'reset_url' => $resetUrl,
                    'expires_in' => '60 minutes',
                    'app_name' => config('app.name'),
                ];
                Mail::to($user->email)->send(new DynamicEmail('password_reset', $variables));
            } else {
                Mail::to($user->email)->send(new PasswordResetEmail($user, $resetUrl));
            }
            Log::info("Password reset email sent to user: {$user->email}");
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to send password reset email to {$user->email}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send course enrollment email
     */
    public function sendCourseEnrollmentEmail(User $user, Course $course): bool
    {
        try {
            $this->applySmtpConfiguration();
            Mail::to($user->email)->send(new CourseEnrollmentEmail($user, $course));
            Log::info("Course enrollment email sent to user: {$user->email} for course: {$course->title}");
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to send course enrollment email to {$user->email}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send workflow notification email
     */
    public function sendWorkflowNotificationEmail(User $user, Workflow $workflow, string $type = 'new'): bool
    {
        try {
            $this->applySmtpConfiguration();
            Mail::to($user->email)->send(new WorkflowNotificationEmail($user, $workflow, $type));
            Log::info("Workflow notification email sent to user: {$user->email} for workflow: {$workflow->title} (type: {$type})");
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to send workflow notification email to {$user->email}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send bulk emails to multiple users
     */
    public function sendBulkEmails(array $users, string $emailType, array $data = []): array
    {
        $results = [
            'success' => 0,
            'failed' => 0,
            'errors' => []
        ];

        foreach ($users as $user) {
            try {
                $success = match($emailType) {
                    'welcome' => $this->sendWelcomeEmail($user),
                    'course_enrollment' => $this->sendCourseEnrollmentEmail($user, $data['course']),
                    'workflow_notification' => $this->sendWorkflowNotificationEmail($user, $data['workflow'], $data['type'] ?? 'new'),
                    default => false
                };

                if ($success) {
                    $results['success']++;
                } else {
                    $results['failed']++;
                    $results['errors'][] = "Failed to send {$emailType} email to {$user->email}";
                }
            } catch (\Exception $e) {
                $results['failed']++;
                $results['errors'][] = "Error sending {$emailType} email to {$user->email}: " . $e->getMessage();
            }
        }

        return $results;
    }

    /**
     * Test email configuration
     */
    public function testEmailConfiguration(): array
    {
        try {
            $testUser = new User([
                'name' => 'Test User',
                'email' => config('mail.from.address')
            ]);

            Mail::to($testUser->email)->send(new WelcomeEmail($testUser));
            
            return [
                'success' => true,
                'message' => 'Test email sent successfully'
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Test email failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Send email using dynamic template
     */
    public function sendDynamicEmail(string $templateName, string $toEmail, array $variables = []): bool
    {
        try {
            $this->applySmtpConfiguration();
            Mail::to($toEmail)->send(new DynamicEmail($templateName, $variables));
            Log::info("Dynamic email sent to {$toEmail} using template: {$templateName}");
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to send dynamic email to {$toEmail} using template {$templateName}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send email using dynamic template to multiple recipients
     */
    public function sendBulkDynamicEmail(string $templateName, array $recipients, array $variables = []): array
    {
        $results = [
            'success' => 0,
            'failed' => 0,
            'errors' => []
        ];

        foreach ($recipients as $email) {
            try {
                $success = $this->sendDynamicEmail($templateName, $email, $variables);
                if ($success) {
                    $results['success']++;
                } else {
                    $results['failed']++;
                    $results['errors'][] = "Failed to send email to {$email}";
                }
            } catch (\Exception $e) {
                $results['failed']++;
                $results['errors'][] = "Error sending email to {$email}: " . $e->getMessage();
            }
        }

        return $results;
    }

    /**
     * Send test email using a template
     */
    public function sendTestEmail($template, string $testEmail, array $variables = []): bool
    {
        try {
            $this->applySmtpConfiguration();
            
            // Render the template with the provided variables
            $rendered = $template->render($variables);
            
            // Send the email using the rendered content
            Mail::raw($rendered['body'], function ($message) use ($testEmail, $rendered) {
                $message->to($testEmail)
                       ->subject($rendered['subject']);
            });
            
            Log::info("Test email sent to {$testEmail} using template: {$template->name}");
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to send test email to {$testEmail} using template {$template->name}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get email statistics
     */
    public function getEmailStats(): array
    {
        // This would typically query a database table that logs email sends
        // For now, we'll return basic stats from logs
        return [
            'total_sent' => 0, // Would be calculated from email logs
            'success_rate' => 0, // Would be calculated from email logs
            'last_sent' => null, // Would be from email logs
        ];
    }
}
