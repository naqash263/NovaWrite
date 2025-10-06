<?php

namespace App\Http\Controllers;

use App\Services\EmailService;
use App\Models\User;
use App\Models\Course;
use App\Models\Workflow;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class EmailController extends Controller
{
    protected EmailService $emailService;

    public function __construct(EmailService $emailService)
    {
        $this->emailService = $emailService;
    }

    /**
     * Send welcome email to a user
     */
    public function sendWelcomeEmail(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::findOrFail($request->user_id);
        
        $success = $this->emailService->sendWelcomeEmail($user);

        return response()->json([
            'success' => $success,
            'message' => $success ? 'Welcome email sent successfully' : 'Failed to send welcome email'
        ]);
    }

    /**
     * Send password reset email
     */
    public function sendPasswordResetEmail(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::where('email', $request->email)->firstOrFail();
        
        $success = $this->emailService->sendPasswordResetEmail($user);

        return response()->json([
            'success' => $success,
            'message' => $success ? 'Password reset email sent successfully' : 'Failed to send password reset email'
        ]);
    }

    /**
     * Send course enrollment email
     */
    public function sendCourseEnrollmentEmail(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'course_id' => 'required|exists:courses,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::findOrFail($request->user_id);
        $course = Course::findOrFail($request->course_id);
        
        $success = $this->emailService->sendCourseEnrollmentEmail($user, $course);

        return response()->json([
            'success' => $success,
            'message' => $success ? 'Course enrollment email sent successfully' : 'Failed to send course enrollment email'
        ]);
    }

    /**
     * Send workflow notification email
     */
    public function sendWorkflowNotificationEmail(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'workflow_id' => 'required|exists:workflows,id',
            'type' => 'sometimes|in:new,updated,approved,rejected',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::findOrFail($request->user_id);
        $workflow = Workflow::findOrFail($request->workflow_id);
        $type = $request->get('type', 'new');
        
        $success = $this->emailService->sendWorkflowNotificationEmail($user, $workflow, $type);

        return response()->json([
            'success' => $success,
            'message' => $success ? 'Workflow notification email sent successfully' : 'Failed to send workflow notification email'
        ]);
    }

    /**
     * Send bulk emails
     */
    public function sendBulkEmails(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'exists:users,id',
            'email_type' => 'required|in:welcome,course_enrollment,workflow_notification',
            'course_id' => 'required_if:email_type,course_enrollment|exists:courses,id',
            'workflow_id' => 'required_if:email_type,workflow_notification|exists:workflows,id',
            'workflow_type' => 'required_if:email_type,workflow_notification|in:new,updated,approved,rejected',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $users = User::whereIn('id', $request->user_ids)->get();
        $emailType = $request->email_type;
        
        $data = [];
        if ($request->course_id) {
            $data['course'] = Course::findOrFail($request->course_id);
        }
        if ($request->workflow_id) {
            $data['workflow'] = Workflow::findOrFail($request->workflow_id);
        }
        if ($request->workflow_type) {
            $data['type'] = $request->workflow_type;
        }

        $results = $this->emailService->sendBulkEmails($users, $emailType, $data);

        return response()->json([
            'success' => $results['success'] > 0,
            'message' => "Bulk email operation completed. Success: {$results['success']}, Failed: {$results['failed']}",
            'results' => $results
        ]);
    }

    /**
     * Test email configuration
     */
    public function testEmailConfiguration(): JsonResponse
    {
        // Only allow admins to test email configuration
        if (!Auth::check() || !Auth::user()->hasRole('admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        $result = $this->emailService->testEmailConfiguration();

        return response()->json($result);
    }

    /**
     * Get email statistics
     */
    public function getEmailStats(): JsonResponse
    {
        // Only allow admins to view email statistics
        if (!Auth::check() || !Auth::user()->hasRole('admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        $stats = $this->emailService->getEmailStats();

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}
