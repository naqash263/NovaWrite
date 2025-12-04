<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\EmailService;
use App\Services\ContactAiService;
use App\Models\Contact;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class ContactController extends Controller
{
    protected $emailService;
    protected $aiService;

    public function __construct(EmailService $emailService, ContactAiService $aiService)
    {
        $this->emailService = $emailService;
        $this->aiService = $aiService;
    }

    /**
     * Submit contact form
     */
    public function submit(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'company' => 'nullable|string|max:255',
            'subject' => 'required|string|max:255',
            'message' => 'required|string|min:10|max:5000',
            'inquiry_type' => 'nullable|string|in:general,consultation,project,partnership,other',
            'order_type' => 'nullable|string|max:255',
            'file_id' => 'nullable|integer|exists:files,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // AI-powered inquiry type detection if not provided
            $inquiryType = $request->inquiry_type;
            if (!$inquiryType || $inquiryType === 'general') {
                $aiAnalysis = $this->aiService->analyzeInquiry($request->message, $request->subject);
                $inquiryType = $aiAnalysis['inquiry_type'] ?? 'general';
            }

            // Store contact submission
            $contact = Contact::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'company' => $request->company,
                'subject' => $request->subject,
                'message' => $request->message,
                'inquiry_type' => $inquiryType,
                'order_type' => $request->order_type,
                'file_id' => $request->file_id,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            // Prepare email variables for N8n
            $variables = [
                'contact_name' => $contact->name,
                'contact_email' => $contact->email,
                'contact_phone' => $contact->phone ?? 'Not provided',
                'contact_company' => $contact->company ?? 'Not provided',
                'contact_subject' => $contact->subject,
                'contact_message' => $contact->message,
                'inquiry_type' => ucfirst($contact->inquiry_type),
                'order_type' => $contact->order_type ?? 'Not specified',
                'submission_date' => $contact->created_at->format('F j, Y \a\t g:i A'),
                'app_name' => config('app.name'),
                'app_url' => config('app.url'),
                'contact_id' => $contact->id,
            ];

            // Add file information if attached
            if ($contact->file_id && $contact->file) {
                $variables['file_name'] = $contact->file->name;
                $variables['file_url'] = $contact->file->url ?? '';
            }

            // Send email to admin via N8n
            $emailSent = $this->emailService->sendTemplateEmail(
                'contact_form',
                $variables,
                config('mail.from.address', 'contact@naqashthaheem.com'),
                config('mail.from.name', 'Naqash Thaheem')
            );

            // Send auto-reply to user via N8n
            $autoReplySent = $this->emailService->sendTemplateEmail(
                'contact_form_auto_reply',
                [
                    'user_name' => $contact->name,
                    'user_email' => $contact->email,
                    'app_name' => config('app.name'),
                    'app_url' => config('app.url'),
                    'support_email' => config('mail.from.address', 'contact@naqashthaheem.com'),
                    'current_year' => date('Y'),
                ],
                $contact->email,
                $contact->name
            );

            Log::info('Contact form submitted', [
                'contact_id' => $contact->id,
                'email' => $contact->email,
                'email_sent' => $emailSent,
                'auto_reply_sent' => $autoReplySent,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Thank you for your message! I\'ll get back to you within 24 hours.',
                'data' => [
                    'id' => $contact->id,
                    'submitted_at' => $contact->created_at->toIso8601String(),
                ]
            ], 201);

        } catch (\Exception $e) {
            Log::error('Contact form submission failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Something went wrong. Please try again later.',
            ], 500);
        }
    }

    /**
     * Analyze contact form message with AI
     */
    public function analyze(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'message' => 'required|string|min:10|max:5000',
            'subject' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $analysis = $this->aiService->analyzeInquiry($request->message, $request->subject ?? '');
            $sentiment = $this->aiService->analyzeSentiment($request->message);
            $suggestions = $this->aiService->getSuggestions($request->message);

            return response()->json([
                'success' => true,
                'data' => [
                    'inquiry_type' => $analysis['inquiry_type'],
                    'confidence' => $analysis['confidence'],
                    'keywords' => $analysis['keywords'],
                    'urgency' => $analysis['urgency'],
                    'sentiment' => $sentiment,
                    'suggestions' => $suggestions,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Contact AI analysis failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'AI analysis temporarily unavailable',
            ], 500);
        }
    }
}

