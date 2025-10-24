<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\EmailService;
use App\Models\User;
use App\Models\Course;
use App\Models\Workflow;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class EmailServiceController extends Controller
{
    protected $emailService;

    public function __construct(EmailService $emailService)
    {
        $this->emailService = $emailService;
    }

    /**
     * Send email with real system data
     */
    public function sendEmailWithRealData(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'template_name' => 'required|string',
            'user_id' => 'required|integer|exists:users,id',
            'course_id' => 'nullable|integer|exists:courses,id',
            'workflow_id' => 'nullable|integer|exists:workflows,id',
            'post_id' => 'nullable|integer|exists:posts,id',
            'custom_variables' => 'nullable|array',
            'smtp_config_id' => 'nullable|integer|exists:smtp_configurations,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::findOrFail($request->user_id);
            $customVariables = $request->custom_variables ?? [];

            // Determine which service method to use based on what data is provided
            $smtpConfigId = $request->smtp_config_id;
            
            if ($request->course_id) {
                $course = Course::findOrFail($request->course_id);
                $success = $this->emailService->sendTemplateEmailWithSmtp(
                    $request->template_name, 
                    $this->emailService->getCourseVariables($course, $user), 
                    $user->email, 
                    $user->name, 
                    $smtpConfigId
                );
            } elseif ($request->workflow_id) {
                $workflow = Workflow::findOrFail($request->workflow_id);
                $success = $this->emailService->sendTemplateEmailWithSmtp(
                    $request->template_name, 
                    $this->emailService->getWorkflowVariables($workflow, $user), 
                    $user->email, 
                    $user->name, 
                    $smtpConfigId
                );
            } elseif ($request->post_id) {
                $post = Post::findOrFail($request->post_id);
                $success = $this->emailService->sendTemplateEmailWithSmtp(
                    $request->template_name, 
                    $this->emailService->getPostVariables($post, $user), 
                    $user->email, 
                    $user->name, 
                    $smtpConfigId
                );
            } else {
                // Send with just user data and custom variables
                $variables = $this->emailService->getUserVariables($user);
                $variables = array_merge($variables, $customVariables);
                
                $success = $this->emailService->sendTemplateEmailWithSmtp(
                    $request->template_name, 
                    $variables, 
                    $user->email, 
                    $user->name, 
                    $smtpConfigId
                );
            }

            if ($success) {
                return response()->json([
                    'success' => true,
                    'message' => 'Email sent successfully'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to send email'
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Email service error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while sending the email',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Preview email with real system data
     */
    public function previewEmailWithRealData(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'template_name' => 'required|string',
            'user_id' => 'required|integer|exists:users,id',
            'course_id' => 'nullable|integer|exists:courses,id',
            'workflow_id' => 'nullable|integer|exists:workflows,id',
            'post_id' => 'nullable|integer|exists:posts,id',
            'custom_variables' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::findOrFail($request->user_id);
            $customVariables = $request->custom_variables ?? [];

            // Generate variables based on what data is provided
            $variables = $this->emailService->getUserVariables($user);

            if ($request->course_id) {
                $course = Course::findOrFail($request->course_id);
                $courseVariables = $this->emailService->getCourseVariables($course, $user);
                $variables = array_merge($variables, $courseVariables);
            }

            if ($request->workflow_id) {
                $workflow = Workflow::findOrFail($request->workflow_id);
                $workflowVariables = $this->emailService->getWorkflowVariables($workflow, $user);
                $variables = array_merge($variables, $workflowVariables);
            }

            if ($request->post_id) {
                $post = Post::findOrFail($request->post_id);
                $postVariables = $this->emailService->getPostVariables($post, $user);
                $variables = array_merge($variables, $postVariables);
            }

            // Add custom variables
            $variables = array_merge($variables, $customVariables);

            // Get template and render with real data
            $template = \App\Models\EmailTemplate::getByName($request->template_name);
            if (!$template) {
                return response()->json([
                    'success' => false,
                    'message' => 'Template not found'
                ], 404);
            }

            $rendered = $template->render($variables);

            return response()->json([
                'success' => true,
                'preview' => $rendered,
                'variables' => $variables,
                'template' => $template->toArray()
            ]);

        } catch (\Exception $e) {
            Log::error('Email preview error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while generating preview',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available data for email service
     */
    public function getAvailableData(): JsonResponse
    {
        try {
            $data = [
                'users' => User::select('id', 'name', 'email', 'created_at')
                    ->orderBy('name')
                    ->get(),
                'courses' => collect([]), // Empty collection for now
                'workflows' => collect([]), // Empty collection for now
                'posts' => collect([]), // Empty collection for now
            ];

            // Try to get courses if table exists
            try {
                if (\Schema::hasTable('courses')) {
                    $data['courses'] = Course::select('id', 'title', 'description', 'category', 'instructor', 'duration', 'price')
                        ->orderBy('title')
                        ->get();
                }
            } catch (\Exception $e) {
                Log::warning('Courses table not available: ' . $e->getMessage());
            }

            // Try to get workflows if table exists
            try {
                if (\Schema::hasTable('workflows')) {
                    $data['workflows'] = Workflow::select('id', 'title', 'description', 'category', 'type', 'author', 'steps', 'difficulty')
                        ->orderBy('title')
                        ->get();
                }
            } catch (\Exception $e) {
                Log::warning('Workflows table not available: ' . $e->getMessage());
            }

            // Try to get posts if table exists
            try {
                if (\Schema::hasTable('posts')) {
                    $data['posts'] = Post::select('id', 'title', 'content', 'excerpt', 'slug', 'author', 'category', 'published_at', 'read_time')
                        ->orderBy('title')
                        ->get();
                }
            } catch (\Exception $e) {
                Log::warning('Posts table not available: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'data' => $data
            ]);

        } catch (\Exception $e) {
            Log::error('Get available data error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get template variables for a specific template
     */
    public function getTemplateVariables(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'template_name' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $template = \App\Models\EmailTemplate::getByName($request->template_name);
            if (!$template) {
                return response()->json([
                    'success' => false,
                    'message' => 'Template not found'
                ], 404);
            }

            $variables = $template->detectVariables();

            return response()->json([
                'success' => true,
                'variables' => $variables,
                'template' => $template->toArray()
            ]);

        } catch (\Exception $e) {
            Log::error('Get template variables error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching template variables',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
