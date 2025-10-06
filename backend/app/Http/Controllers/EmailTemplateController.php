<?php

namespace App\Http\Controllers;

use App\Models\EmailTemplate;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class EmailTemplateController extends Controller
{
    public function __construct()
    {
        // Middleware is handled by the route group
    }

    /**
     * Display a listing of email templates
     */
    public function index(Request $request): JsonResponse
    {
        $query = EmailTemplate::query();

        // Filter by category
        if ($request->has('category')) {
            $query->byCategory($request->category);
        }

        // Filter by active status
        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        // Search by name or description
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('subject', 'like', "%{$search}%");
            });
        }

        $templates = $query->orderBy('category')->orderBy('name')->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $templates
        ]);
    }

    /**
     * Store a newly created email template
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:email_templates,name',
            'subject' => 'required|string|max:255',
            'body' => 'required|string',
            'type' => 'required|in:markdown,html',
            'variables' => 'sometimes|array',
            'variables.*' => 'string',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'category' => 'required|string|in:general,user,course,workflow,system,marketing',
            'metadata' => 'sometimes|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $template = EmailTemplate::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Email template created successfully',
            'data' => $template
        ], 201);
    }

    /**
     * Display the specified email template
     */
    public function show(string $id): JsonResponse
    {
        $template = EmailTemplate::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $template
        ]);
    }

    /**
     * Update the specified email template
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $template = EmailTemplate::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255|unique:email_templates,name,' . $id,
            'subject' => 'sometimes|string|max:255',
            'body' => 'sometimes|string',
            'type' => 'sometimes|in:markdown,html',
            'variables' => 'sometimes|array',
            'variables.*' => 'string',
            'description' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
            'category' => 'sometimes|string|in:general,user,course,workflow,system,marketing',
            'metadata' => 'sometimes|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $template->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Email template updated successfully',
            'data' => $template
        ]);
    }

    /**
     * Remove the specified email template
     */
    public function destroy(string $id): JsonResponse
    {
        $template = EmailTemplate::findOrFail($id);
        $template->delete();

        return response()->json([
            'success' => true,
            'message' => 'Email template deleted successfully'
        ]);
    }

    /**
     * Get template preview with sample data
     */
    public function preview(string $id): JsonResponse
    {
        $template = EmailTemplate::findOrFail($id);
        $preview = $template->getPreview();

        return response()->json([
            'success' => true,
            'data' => $preview
        ]);
    }

    /**
     * Test template with custom variables
     */
    public function test(Request $request, string $id): JsonResponse
    {
        $template = EmailTemplate::findOrFail($id);
        $variables = $request->get('variables', []);
        $testEmail = $request->get('test_email');

        if (!$testEmail) {
            return response()->json([
                'success' => false,
                'message' => 'Test email address is required'
            ], 422);
        }

        // Validate required variables
        $errors = $template->validateVariables($variables);
        if (!empty($errors)) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $errors
            ], 422);
        }

        try {
            // Send test email using the EmailService
            $emailService = app(\App\Services\EmailService::class);
            $success = $emailService->sendTestEmail($template, $testEmail, $variables);

            if ($success) {
                return response()->json([
                    'success' => true,
                    'message' => 'Test email sent successfully!'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to send test email'
                ], 500);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error sending test email: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get template categories
     */
    public function categories(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => EmailTemplate::getCategories()
        ]);
    }

    /**
     * Get template types
     */
    public function types(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => EmailTemplate::getTypes()
        ]);
    }

    /**
     * Duplicate an existing template
     */
    public function duplicate(string $id): JsonResponse
    {
        $originalTemplate = EmailTemplate::findOrFail($id);
        
        $newTemplate = $originalTemplate->replicate();
        $newTemplate->name = $originalTemplate->name . '_copy_' . time();
        $newTemplate->save();

        return response()->json([
            'success' => true,
            'message' => 'Email template duplicated successfully',
            'data' => $newTemplate
        ], 201);
    }

    /**
     * Toggle template active status
     */
    public function toggleStatus(string $id): JsonResponse
    {
        $template = EmailTemplate::findOrFail($id);
        $template->is_active = !$template->is_active;
        $template->save();

        return response()->json([
            'success' => true,
            'message' => 'Template status updated successfully',
            'data' => $template
        ]);
    }

    /**
     * Get template by name (for internal use)
     */
    public function getByName(string $name): JsonResponse
    {
        $template = EmailTemplate::getByName($name);

        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => 'Template not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $template
        ]);
    }
}
