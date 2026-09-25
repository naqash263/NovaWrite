<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\N8nConfiguration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use GuzzleHttp\Client;

class BookingController extends Controller
{
    protected $client;

    public function __construct()
    {
        $this->client = new Client();
    }

    /**
     * Store a consultation request, then forward it to the n8n booking workflow
     */
    public function bookService(Request $request)
    {
        try {
            $request->validate([
                'service_name' => 'required|string|max:255',
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255',
                'phone' => 'nullable|string|max:50',
                'company' => 'nullable|string|max:255',
                'message' => 'nullable|string|max:2000',
                'preferred_contact_method' => 'nullable|in:email,phone,whatsapp',
                'budget_range' => 'nullable|string|max:100',
                'timeline' => 'nullable|string|max:100',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error("Booking validation failed", [
                'errors' => $e->errors(),
                'request_data' => $request->except(['message']) // Exclude message from logs for privacy
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Please fill in all required fields correctly.',
                'errors' => $e->errors()
            ], 422);
        }

        // Save the request first: the enquiry must not depend on the n8n webhook being up.
        $contact = null;
        try {
            $details = array_filter([
                $request->message,
                $request->budget_range ? 'Budget: ' . $request->budget_range : null,
                $request->timeline ? 'Timeline: ' . $request->timeline : null,
                'Preferred contact: ' . ($request->preferred_contact_method ?? 'email'),
            ]);
            $contact = Contact::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'company' => $request->company,
                'subject' => 'Consultation request: ' . $request->service_name,
                'message' => implode("\n", $details),
                'inquiry_type' => 'consultation',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ] + ContactController::sourceAttribute('booking:' . mb_substr($request->service_name, 0, 100)));
        } catch (\Throwable $e) {
            Log::error('Booking could not be stored', ['service' => $request->service_name, 'error' => $e->getMessage()]);
        }

        $forwarded = $this->forwardToN8n($request);

        if (!$contact && !$forwarded) {
            return response()->json([
                'success' => false,
                'message' => 'Unable to submit your request right now. Please email contact@naqashthaheem.com.',
            ], 503);
        }

        return response()->json([
            'success' => true,
            'message' => 'Your consultation request has been received. I will reply within one business day.',
        ], 200);
    }

    /**
     * Best-effort hand-off to the n8n booking workflow (notifications, CRM).
     */
    private function forwardToN8n(Request $request): bool
    {
        try {
            if (!DB::getSchemaBuilder()->hasTable('n8n_configurations')) {
                return false;
            }
            $config = N8nConfiguration::getActive();
            if (!$config || !$config->isValidWebhookUrl()) {
                Log::warning('Booking not forwarded: no valid n8n configuration', ['service' => $request->service_name]);
                return false;
            }

            $this->client->post($config->webhook_url, [
                'json' => [
                    'action' => 'service_booking',
                    'service_name' => $request->service_name,
                    'booking_details' => [
                        'name' => $request->name,
                        'email' => $request->email,
                        'phone' => $request->phone,
                        'company' => $request->company,
                        'message' => $request->message,
                        'preferred_contact_method' => $request->preferred_contact_method ?? 'email',
                        'budget_range' => $request->budget_range,
                        'timeline' => $request->timeline,
                        'booking_date' => now()->toISOString(),
                        'source' => 'website_booking_form',
                    ],
                ],
                'timeout' => $config->webhook_timeout ?? 30,
                'headers' => ['Content-Type' => 'application/json', 'Accept' => 'application/json'],
            ]);

            return true;
        } catch (\Throwable $e) {
            Log::error('Booking forward to n8n failed', ['service' => $request->service_name, 'error' => $e->getMessage()]);
            return false;
        }
    }

}

