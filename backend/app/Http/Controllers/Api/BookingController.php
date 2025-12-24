<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\N8nConfiguration;
use App\Services\N8nEmailService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

class BookingController extends Controller
{
    protected $client;
    protected $n8nService;

    public function __construct(N8nEmailService $n8nService)
    {
        $this->client = new Client();
        $this->n8nService = $n8nService;
    }

    /**
     * Send booking request to N8n webhook
     */
    public function bookService(Request $request)
    {
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

        $config = N8nConfiguration::getActive();
        
        if (!$config) {
            return response()->json([
                'success' => false,
                'message' => 'Booking service is currently unavailable. Please contact us directly.'
            ], 503);
        }

        if (!$config->isValidWebhookUrl()) {
            return response()->json([
                'success' => false,
                'message' => 'Booking service configuration error. Please contact us directly.'
            ], 503);
        }

        $bookingData = [
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
            ]
        ];

        $timeout = $config->webhook_timeout ?? 30;

        try {
            Log::info("Sending booking request to N8n webhook", [
                'url' => $config->webhook_url,
                'service' => $request->service_name,
                'email' => $request->email,
                'timeout' => $timeout,
            ]);

            $response = $this->client->post($config->webhook_url, [
                'json' => $bookingData,
                'timeout' => $timeout,
                'headers' => [
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json'
                ]
            ]);

            $statusCode = $response->getStatusCode();
            $responseBody = $response->getBody()->getContents();

            Log::info("Booking request sent successfully to N8n", [
                'service' => $request->service_name,
                'email' => $request->email,
                'status_code' => $statusCode
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Your booking request has been submitted successfully! We will contact you soon.',
                'status_code' => $statusCode
            ], 200);

        } catch (RequestException $e) {
            $errorMessage = $e->getMessage();
            $statusCode = $e->getResponse() ? $e->getResponse()->getStatusCode() : null;

            Log::error("Booking request failed", [
                'service' => $request->service_name,
                'email' => $request->email,
                'error' => $errorMessage,
                'status_code' => $statusCode
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Unable to submit booking at this time. Please try again or contact us directly.',
                'error' => config('app.debug') ? $errorMessage : null
            ], 500);

        } catch (\Exception $e) {
            Log::error("Booking request exception", [
                'service' => $request->service_name,
                'email' => $request->email,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred. Please contact us directly.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
}

