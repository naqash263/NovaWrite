<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

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
            // Send email to admin
            Mail::raw(
                "New contact form submission:\n\n" .
                "Name: {$data['name']}\n" .
                "Email: {$data['email']}\n" .
                "Subject: {$data['subject']}\n\n" .
                "Message:\n{$data['message']}\n\n" .
                "Sent from: " . config('app.name'),
                function ($message) use ($data) {
                    $message->to('naqash263@gmail.com')
                           ->replyTo($data['email'], $data['name'])
                           ->subject('Contact Form: ' . $data['subject']);
                }
            );

            return response()->json([
                'message' => 'Thank you for your message! I will get back to you soon.',
                'success' => true
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Sorry, there was an error sending your message. Please try again or contact me directly.',
                'success' => false
            ], 500);
        }
    }
}