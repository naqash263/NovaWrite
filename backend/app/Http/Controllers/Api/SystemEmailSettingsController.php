<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemEmailSetting;
use App\Models\SmtpConfiguration;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class SystemEmailSettingsController extends Controller
{
    /**
     * Health check endpoint
     */
    public function health(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'System email settings controller is working',
            'timestamp' => now()->toISOString()
        ]);
    }

    /**
     * Get system email settings
     */
    public function index(): JsonResponse
    {
        try {
            $settings = SystemEmailSetting::getAllSettings();
            
            // Convert string values to integers for SMTP IDs
            $formattedSettings = [
                'password_reset_smtp_id' => $settings['password_reset_smtp_id'] ? (int) $settings['password_reset_smtp_id'] : null,
                'welcome_email_smtp_id' => $settings['welcome_email_smtp_id'] ? (int) $settings['welcome_email_smtp_id'] : null,
                'notification_smtp_id' => $settings['notification_smtp_id'] ? (int) $settings['notification_smtp_id'] : null,
                'default_smtp_id' => $settings['default_smtp_id'] ? (int) $settings['default_smtp_id'] : null,
            ];

            return response()->json([
                'success' => true,
                'data' => $formattedSettings
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch system email settings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update system email settings
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'password_reset_smtp_id' => 'nullable|integer|exists:smtp_configurations,id',
            'welcome_email_smtp_id' => 'nullable|integer|exists:smtp_configurations,id',
            'notification_smtp_id' => 'nullable|integer|exists:smtp_configurations,id',
            'default_smtp_id' => 'nullable|integer|exists:smtp_configurations,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            \Log::info('Updating system email settings', $request->all());
            
            // Use database transaction to ensure atomicity
            \DB::transaction(function () use ($request) {
                // Update each setting
                foreach ($request->all() as $key => $value) {
                    if (in_array($key, ['password_reset_smtp_id', 'welcome_email_smtp_id', 'notification_smtp_id', 'default_smtp_id'])) {
                        \Log::info("Setting {$key} to {$value}");
                        SystemEmailSetting::setValue($key, $value);
                        \Log::info("Successfully set {$key}");
                    }
                }
            });

            \Log::info('System email settings updated successfully');

            return response()->json([
                'success' => true,
                'message' => 'System email settings updated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update system email settings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test email sending with specific SMTP configuration
     */
    public function testEmail(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email_type' => 'required|string|in:password_reset,welcome_email,notification',
            'smtp_id' => 'required|integer|exists:smtp_configurations,id',
            'test_email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $smtpConfig = SmtpConfiguration::findOrFail($request->smtp_id);
            $testEmail = $request->test_email;

            // Configure mail settings
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

            // Send test email based on type
            switch ($request->email_type) {
                case 'password_reset':
                    \Mail::html('This is a test password reset email from ' . $smtpConfig->name, function ($message) use ($testEmail, $smtpConfig) {
                        $message->to($testEmail)
                                ->subject('Test Password Reset Email - ' . $smtpConfig->name);
                    });
                    break;

                case 'welcome_email':
                    \Mail::html('This is a test welcome email from ' . $smtpConfig->name, function ($message) use ($testEmail, $smtpConfig) {
                        $message->to($testEmail)
                                ->subject('Test Welcome Email - ' . $smtpConfig->name);
                    });
                    break;

                case 'notification':
                    \Mail::html('This is a test notification email from ' . $smtpConfig->name, function ($message) use ($testEmail, $smtpConfig) {
                        $message->to($testEmail)
                                ->subject('Test Notification Email - ' . $smtpConfig->name);
                    });
                    break;
            }

            return response()->json([
                'success' => true,
                'message' => 'Test email sent successfully using ' . $smtpConfig->name
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send test email: ' . $e->getMessage()
            ], 500);
        }
    }
}