<?php

namespace App\Services;

use App\Models\EmailTemplate;
use App\Models\SmtpConfiguration;
use App\Models\SystemEmailSetting;
use App\Models\N8nConfiguration;
use App\Models\EmailQueue;
use App\Models\EmailUnsubscribe;
use App\Jobs\SendN8nEmail;
use App\Services\N8nEmailService;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class EmailService
{
    /**
     * Configure mail settings using active SMTP configuration
     */
    private function configureMailSettings(): void
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
                'mail.mailers.smtp.timeout' => 30,
                'mail.from.address' => $smtpConfig->from_address,
                'mail.from.name' => $smtpConfig->from_name,
            ]);
            
            Log::info("Using SMTP configuration: {$smtpConfig->name} ({$smtpConfig->host})");
        } else {
            Log::warning("No active SMTP configuration found, using default mail settings");
        }
    }

    /**
     * Configure mail settings using system email settings for specific email type
     */
    private function configureMailSettingsForEmailType(string $emailType): void
    {
        $smtpId = SystemEmailSetting::getSmtpForEmailType($emailType);
        
        if ($smtpId) {
            $smtpConfig = SmtpConfiguration::find($smtpId);
            if ($smtpConfig) {
                config([
                    'mail.default' => 'smtp',
                    'mail.mailers.smtp.host' => $smtpConfig->host,
                    'mail.mailers.smtp.port' => $smtpConfig->port,
                    'mail.mailers.smtp.username' => $smtpConfig->username,
                    'mail.mailers.smtp.password' => $smtpConfig->password,
                    'mail.mailers.smtp.encryption' => $smtpConfig->encryption,
                    'mail.mailers.smtp.timeout' => 30,
                    'mail.from.address' => $smtpConfig->from_address,
                    'mail.from.name' => $smtpConfig->from_name,
                ]);
                
                Log::info("Using SMTP configuration for {$emailType}: {$smtpConfig->name} ({$smtpConfig->host})");
                return;
            }
        }
        
        // Fallback to active SMTP configuration
        $this->configureMailSettings();
    }

    /**
     * Send email using a template with direct send and status logging
     */
    public function sendTemplateEmail(string $templateName, array $variables, string $to, ?string $toName = null): bool
    {
        try {
            // Check if email is unsubscribed
            if (EmailUnsubscribe::isUnsubscribed($to, $templateName)) {
                Log::info("Email not sent - user unsubscribed", [
                    'email' => $to,
                    'template' => $templateName
                ]);
                return false;
            }

            $config = N8nConfiguration::getActive();
            if (!$config) {
                Log::error("No active N8n configuration found for template: {$templateName}");
                return false;
            }

            // Attempt direct send to N8n
            $n8nService = app(N8nEmailService::class);
            $recipient = [
                'email' => $to,
                'name' => $toName ?? 'User'
            ];

            $success = $n8nService->sendToN8n($templateName, $recipient, $variables);

            if ($success) {
                // Log as completed
                EmailQueue::create([
                    'action' => $templateName,
                    'recipient_email' => $to,
                    'recipient_name' => $toName,
                    'details' => $variables,
                    'max_attempts' => 1,
                    'status' => 'completed',
                    'completed_at' => now(),
                    'attempts' => 1,
                ]);
                Log::info("Email sent and logged as completed using template: {$templateName} to: {$to}");
                return true;
            } else {
                // Log as failed (not pending/processing/queued)
                $record = EmailQueue::create([
                    'action' => $templateName,
                    'recipient_email' => $to,
                    'recipient_name' => $toName,
                    'details' => $variables,
                    'max_attempts' => 1,
                    'status' => 'failed',
                    'last_error' => 'Direct send failure',
                    'attempts' => 1,
                ]);
                // Auto-notify if enabled in active N8n configuration
                if ($config && ($config->auto_notify_on_failure ?? false)) {
                    try {
                        app(\App\Services\FallbackWebhookNotifier::class)->notifySingleEmail($record);
                    } catch (\Throwable $t) {
                        Log::warning('Auto notify on failure failed', ['error' => $t->getMessage()]);
                    }
                }
                Log::error("Failed to send email directly via N8n using template: {$templateName} to: {$to}");
                return false;
            }
        } catch (\Exception $e) {
            Log::error("Failed to send email directly via N8n: " . $e->getMessage(), ['exception' => $e->getTraceAsString()]);
            // Log as failed
            $record = EmailQueue::create([
                'action' => $templateName,
                'recipient_email' => $to,
                'recipient_name' => $toName,
                'details' => $variables,
                'max_attempts' => 1,
                'status' => 'failed',
                'last_error' => $e->getMessage(),
                'attempts' => 1,
            ]);
            // Auto-notify if enabled
            $config = N8nConfiguration::getActive();
            if ($config && ($config->auto_notify_on_failure ?? false)) {
                try {
                    app(\App\Services\FallbackWebhookNotifier::class)->notifySingleEmail($record);
                } catch (\Throwable $t) {
                    Log::warning('Auto notify on failure failed', ['error' => $t->getMessage()]);
                }
            }
            return false;
        }
    }

    /**
     * Send email directly to N8n without queueing
     */
    public function sendTemplateEmailDirect(string $templateName, array $variables, string $to, ?string $toName = null): bool
    {
        // Use main sendTemplateEmail (always direct now)
        return $this->sendTemplateEmail($templateName, $variables, $to, $toName);
    }

    /**
     * Send email using a specific SMTP configuration (deprecated - now uses N8n)
     */
    public function sendTemplateEmailWithSmtp(string $templateName, array $variables, string $to, ?string $toName = null, ?int $smtpConfigId = null): bool
    {
        // Use main sendTemplateEmail (SMTP is deprecated and no longer used)
        return $this->sendTemplateEmail($templateName, $variables, $to, $toName);
    }

    /**
     * Send welcome email to new user
     */
    public function sendWelcomeEmail($user): bool
    {
        try {
            $variables = $this->getUserVariables($user);
            return $this->sendTemplateEmail('welcome_email', $variables, $user->email, $user->name);
        } catch (\Exception $e) {
            Log::error("Failed to send welcome email: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get real user data for email templates
     */
    public function getUserVariables($user): array
    {
        return [
            'user_name' => $user->name ?? 'User',
            'user_email' => $user->email,
            'user_id' => $user->id,
            'app_name' => config('app.name'),
            'app_url' => config('app.url'),
            'login_url' => config('app.url') . '/login',
            'support_email' => config('mail.from.address'),
            'current_year' => date('Y'),
            'registration_date' => $user->created_at ? $user->created_at->format('F j, Y') : 'Recently',
            'profile_url' => config('app.url') . '/profile',
        ];
    }

    /**
     * Get real course data for email templates
     */
    public function getCourseVariables($course, $user = null): array
    {
        $baseVariables = $user ? $this->getUserVariables($user) : [];
        
        return array_merge($baseVariables, [
            'course_title' => $course->title,
            'course_description' => $course->description ?? '',
            'course_url' => config('app.url') . '/courses/' . $course->id,
            'course_instructor' => $course->instructor ?? 'Our Team',
            'course_duration' => $course->duration ?? 'Self-paced',
            'course_price' => $course->price ?? 'Free',
            'course_category' => $course->category ?? 'General',
            'enrollment_date' => now()->format('F j, Y'),
        ]);
    }

    /**
     * Get real workflow data for email templates
     */
    public function getWorkflowVariables($workflow, $user = null): array
    {
        $baseVariables = $user ? $this->getUserVariables($user) : [];
        
        return array_merge($baseVariables, [
            'workflow_title' => $workflow->title,
            'workflow_description' => $workflow->description ?? '',
            'workflow_url' => config('app.url') . '/workflows/' . $workflow->id,
            'workflow_category' => $workflow->category ?? 'General',
            'workflow_type' => $workflow->type ?? 'new',
            'workflow_author' => $workflow->author ?? 'Our Team',
            'workflow_steps' => $workflow->steps ?? 0,
            'workflow_difficulty' => $workflow->difficulty ?? 'Beginner',
        ]);
    }

    /**
     * Get real post data for email templates
     */
    public function getPostVariables($post, $user = null): array
    {
        $baseVariables = $user ? $this->getUserVariables($user) : [];
        
        return array_merge($baseVariables, [
            'post_title' => $post->title,
            'post_excerpt' => $post->excerpt ?? substr(strip_tags($post->content), 0, 150) . '...',
            'post_url' => config('app.url') . '/blog/' . $post->slug,
            'post_author' => $post->author ?? 'Our Team',
            'post_category' => $post->category ?? 'General',
            'post_published_date' => $post->published_at ? $post->published_at->format('F j, Y') : 'Recently',
            'post_read_time' => $post->read_time ?? '5 min read',
        ]);
    }

    /**
     * Send password reset email
     */
    public function sendPasswordResetEmail($user, $resetUrl): bool
    {
        try {
            Log::info("sendPasswordResetEmail called", [
                'user_email' => $user->email,
                'reset_url' => $resetUrl
            ]);
            
            // Check if there's already a pending password reset email for this user in the last 10 minutes
            $existingEmail = EmailQueue::where('recipient_email', $user->email)
                ->where('action', 'password_reset')
                ->whereIn('status', ['pending', 'processing'])
                ->where('created_at', '>=', now()->subMinutes(10))
                ->first();
            
            if ($existingEmail) {
                Log::info("Password reset email already queued for user in last 10 minutes: {$user->email}");
                return true; // Return true as email is already queued
            }
            
            $variables = $this->getUserVariables($user);
            $variables['reset_url'] = $resetUrl;
            $variables['expires_in'] = '24 hours';
            
            Log::info("Calling sendTemplateEmail for password reset", [
                'user_email' => $user->email,
                'template' => 'password_reset'
            ]);
            
            return $this->sendTemplateEmail('password_reset', $variables, $user->email, $user->name);
        } catch (\Exception $e) {
            Log::error("Failed to send password reset email: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send email verification email
     */
    public function sendEmailVerificationEmail($user, $verificationUrl): bool
    {
        return $this->sendTemplateEmail('email_verification', [
            'user_name' => $user->name,
            'user_email' => $user->email,
            'verification_url' => $verificationUrl,
            'app_name' => config('app.name'),
            'app_url' => config('app.url'),
            'support_email' => config('mail.from.address'),
            'current_year' => date('Y'),
        ], $user->email, $user->name);
    }

    /**
     * Send course enrollment email
     */
    public function sendCourseEnrollmentEmail($user, $course): bool
    {
        return $this->sendTemplateEmail('course_enrollment', [
            'user_name' => $user->name,
            'user_email' => $user->email,
            'course_title' => $course->title,
            'course_description' => $course->description,
            'course_url' => config('app.url') . '/courses/' . $course->id,
            'app_name' => config('app.name'),
            'app_url' => config('app.url'),
            'support_email' => config('mail.from.address'),
            'current_year' => date('Y'),
        ], $user->email, $user->name);
    }

    /**
     * Send workflow notification email
     */
    public function sendWorkflowNotificationEmail($user, $workflow): bool
    {
        return $this->sendTemplateEmail('workflow_notification', [
            'user_name' => $user->name,
            'user_email' => $user->email,
            'workflow_title' => $workflow->title,
            'workflow_description' => $workflow->description,
            'workflow_url' => config('app.url') . '/workflows/' . $workflow->id,
            'workflow_type' => 'new',
            'app_name' => config('app.name'),
            'app_url' => config('app.url'),
            'support_email' => config('mail.from.address'),
            'current_year' => date('Y'),
        ], $user->email, $user->name);
    }

    /**
     * Send newsletter email
     */
    public function sendNewsletterEmail($user, $newsletterData): bool
    {
        return $this->sendTemplateEmail('newsletter', [
            'user_name' => $user->name,
            'user_email' => $user->email,
            'app_name' => config('app.name'),
            'app_url' => config('app.url'),
            'date' => date('F Y'),
            'newsletter_title' => $newsletterData['title'] ?? 'Monthly Newsletter',
            'newsletter_content' => $newsletterData['content'] ?? '',
            'featured_articles' => $newsletterData['articles'] ?? '',
            'upcoming_events' => $newsletterData['events'] ?? '',
            'support_email' => config('mail.from.address'),
            'unsubscribe_url' => config('app.url') . '/unsubscribe?token=' . $user->id,
            'current_year' => date('Y'),
        ], $user->email, $user->name);
    }

    /**
     * Send system maintenance notification
     */
    public function sendMaintenanceNotificationEmail($user, $maintenanceData): bool
    {
        return $this->sendTemplateEmail('system_maintenance', [
            'user_name' => $user->name,
            'user_email' => $user->email,
            'app_name' => config('app.name'),
            'maintenance_date' => $maintenanceData['date'],
            'maintenance_duration' => $maintenanceData['duration'],
            'maintenance_reason' => $maintenanceData['reason'],
            'app_url' => config('app.url'),
            'support_email' => config('mail.from.address'),
            'current_year' => date('Y'),
        ], $user->email, $user->name);
    }

    /**
     * Get available templates for selection
     */
    public function getAvailableTemplates(): array
    {
        return EmailTemplate::where('is_active', true)
            ->select('id', 'name', 'subject', 'description', 'category', 'type')
            ->get()
            ->toArray();
    }

    /**
     * Preview template with sample data
     */
    public function previewTemplate(string $templateName): ?array
    {
        $template = EmailTemplate::getByName($templateName);
        
        if (!$template) {
            return null;
        }

        return $template->getPreview();
    }

    /**
     * Send course enrollment email with real data
     */
    public function sendCourseEnrollmentEmailWithRealData($user, $course): bool
    {
        $variables = $this->getCourseVariables($course, $user);
        return $this->sendTemplateEmail('course_enrollment', $variables, $user->email, $user->name);
    }

    /**
     * Send workflow notification email with real data
     */
    public function sendWorkflowNotificationEmailWithRealData($user, $workflow): bool
    {
        $variables = $this->getWorkflowVariables($workflow, $user);
        return $this->sendTemplateEmail('workflow_notification', $variables, $user->email, $user->name);
    }

    /**
     * Send blog post notification email with real data
     */
    public function sendBlogPostNotificationEmailWithRealData($user, $post): bool
    {
        $variables = $this->getPostVariables($post, $user);
        return $this->sendTemplateEmail('newsletter', $variables, $user->email, $user->name);
    }

    /**
     * Send custom email with real data
     */
    public function sendCustomEmailWithRealData($user, $templateName, $additionalData = []): bool
    {
        $variables = $this->getUserVariables($user);
        $variables = array_merge($variables, $additionalData);
        
        return $this->sendTemplateEmail($templateName, $variables, $user->email, $user->name);
    }
}