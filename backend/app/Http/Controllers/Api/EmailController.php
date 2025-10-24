<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\EmailService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class EmailController extends Controller
{
    protected $emailService;

    public function __construct(EmailService $emailService)
    {
        $this->emailService = $emailService;
    }

    /**
     * Send email using template
     */
    public function sendTemplateEmail(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'template_name' => 'required|string|exists:email_templates,name',
            'to_email' => 'required|email',
            'to_name' => 'nullable|string|max:255',
            'variables' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $success = $this->emailService->sendTemplateEmail(
            $request->template_name,
            $request->variables,
            $request->to_email,
            $request->to_name
        );

        if ($success) {
            return response()->json([
                'message' => 'Email sent successfully'
            ]);
        }

        return response()->json([
            'message' => 'Failed to send email'
        ], 500);
    }

    /**
     * Get available templates
     */
    public function getAvailableTemplates(): JsonResponse
    {
        $templates = $this->emailService->getAvailableTemplates();

        return response()->json([
            'data' => $templates
        ]);
    }

    /**
     * Preview template with sample data
     */
    public function previewTemplate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'template_name' => 'required|string|exists:email_templates,name',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $preview = $this->emailService->previewTemplate($request->template_name);

        if (!$preview) {
            return response()->json([
                'message' => 'Template not found'
            ], 404);
        }

        return response()->json([
            'data' => $preview
        ]);
    }

    /**
     * Send welcome email (for testing)
     */
    public function sendWelcomeEmail(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_name' => 'required|string|max:255',
            'user_email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = (object) [
            'name' => $request->user_name,
            'email' => $request->user_email,
        ];

        $success = $this->emailService->sendWelcomeEmail($user);

        if ($success) {
            return response()->json([
                'message' => 'Welcome email sent successfully'
            ]);
        }

        return response()->json([
            'message' => 'Failed to send welcome email'
        ], 500);
    }
}
