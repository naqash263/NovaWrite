<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\EmailService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class ContactController extends Controller
{
    public function submit(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'subject' => 'required|string|max:255',
            'message' => 'required|string|min:10|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();

        try {
            // Send email to admin using N8n EmailService
            $emailService = app(EmailService::class);
            $variables = [
                'contact_name' => $data['name'],
                'contact_email' => $data['email'],
                'contact_subject' => $data['subject'],
                'contact_message' => $data['message'],
                'app_name' => config('app.name'),
                'app_url' => config('app.url'),
            ];

            $success = $emailService->sendTemplateEmail('contact_form', $variables, 'naqash263@gmail.com', 'Admin');

            if ($success) {
                Log::info("Contact form email sent successfully", ['contact_email' => $data['email']]);
                
                return response()->json([
                    'message' => 'Thank you for your message! I will get back to you soon.',
                    'success' => true
                ]);
            } else {
                Log::error("Failed to send contact form email", ['contact_email' => $data['email']]);
                
                return response()->json([
                    'message' => 'Sorry, there was an error sending your message. Please try again or contact me directly.',
                    'success' => false
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error("Contact form error: " . $e->getMessage(), [
                'exception' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Sorry, there was an error sending your message. Please try again or contact me directly.',
                'success' => false
            ], 500);
        }
    }
}