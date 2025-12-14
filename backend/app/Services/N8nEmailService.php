<?php

namespace App\Services;

use App\Models\N8nConfiguration;
use App\Models\EmailLog;
use App\Services\EmailFailureAnalyzer;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Support\Facades\Log;

class N8nEmailService
{
    protected $client;

    public function __construct()
    {
        $this->client = new Client();
    }

    /**
     * Send email data to N8n webhook
     */
    public function sendToN8n(string $action, array $recipient, array $details, ?int $customTimeout = null): bool
    {
        $config = N8nConfiguration::getActive();
        
        if (!$config) {
            Log::error('No active N8n configuration found');
            return false;
        }

        if (!$config->isValidWebhookUrl()) {
            Log::error('Invalid webhook URL in active N8n configuration');
            return false;
        }

        $payload = [
            'action' => $action,
            'recipient' => $recipient,
            'details' => $details
        ];

        $timeout = $customTimeout ?? $config->webhook_timeout;

        try {
            Log::info("Sending to N8n webhook", [
                'url' => $config->webhook_url,
                'action' => $action,
                'recipient' => $recipient['email'],
                'timeout' => $timeout,
                'payload' => json_encode($payload)
            ]);

            $response = $this->client->post($config->webhook_url, [
                'json' => $payload,
                'timeout' => $timeout,
                'headers' => [
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json'
                ]
            ]);

            Log::info("N8n webhook received response", [
                'status_code' => $response->getStatusCode(),
                'url' => $config->webhook_url
            ]);

            $statusCode = $response->getStatusCode();
            $responseBody = $response->getBody()->getContents();

            // Log successful request
            EmailLog::create([
                'action' => $action,
                'recipient_email' => $recipient['email'],
                'status' => 'success',
                'payload' => $payload,
                'response' => json_decode($responseBody, true),
                'attempts' => 1
            ]);

            Log::info("N8n webhook sent successfully", [
                'action' => $action,
                'recipient' => $recipient['email'],
                'status_code' => $statusCode
            ]);

            return $statusCode >= 200 && $statusCode < 300;

        } catch (RequestException $e) {
            $errorMessage = $e->getMessage();
            $statusCode = $e->getResponse() ? $e->getResponse()->getStatusCode() : null;
            $responseBody = $e->getResponse() ? $e->getResponse()->getBody()->getContents() : null;

            // Analyze the failure
            $failureInfo = EmailFailureAnalyzer::analyzeException($e, $statusCode);
            $failureInfo['provider_name'] = 'n8n';

            // Log failed request with detailed failure information
            EmailLog::create([
                'action' => $action,
                'recipient_email' => $recipient['email'],
                'status' => 'failed',
                'error_message' => $errorMessage,
                'payload' => $payload,
                'response' => $responseBody ? json_decode($responseBody, true) : null,
                'attempts' => 1,
                'failure_reason_code' => $failureInfo['failure_reason_code'],
                'failure_category' => $failureInfo['failure_category'],
                'error_details' => $failureInfo['error_details'],
                'http_status_code' => $failureInfo['http_status_code'],
                'provider_name' => $failureInfo['provider_name']
            ]);

            Log::error("N8n webhook failed", [
                'action' => $action,
                'recipient' => $recipient['email'],
                'error' => $errorMessage,
                'status_code' => $statusCode,
                'failure_category' => $failureInfo['failure_category'],
                'failure_reason_code' => $failureInfo['failure_reason_code']
            ]);

            return false;
        } catch (\Exception $e) {
            // Handle other exceptions
            $errorMessage = $e->getMessage();
            
            // Analyze the failure
            $failureInfo = EmailFailureAnalyzer::analyzeException($e);
            $failureInfo['provider_name'] = 'n8n';

            // Log failed request
            EmailLog::create([
                'action' => $action,
                'recipient_email' => $recipient['email'],
                'status' => 'failed',
                'error_message' => $errorMessage,
                'payload' => $payload,
                'response' => null,
                'attempts' => 1,
                'failure_reason_code' => $failureInfo['failure_reason_code'],
                'failure_category' => $failureInfo['failure_category'],
                'error_details' => $failureInfo['error_details'],
                'http_status_code' => $failureInfo['http_status_code'],
                'provider_name' => $failureInfo['provider_name']
            ]);

            Log::error("N8n webhook failed with exception", [
                'action' => $action,
                'recipient' => $recipient['email'],
                'error' => $errorMessage,
                'failure_category' => $failureInfo['failure_category'],
                'failure_reason_code' => $failureInfo['failure_reason_code']
            ]);

            return false;
        }
    }

    /**
     * Test N8n webhook connection
     */
    public function testConnection(N8nConfiguration $config): array
    {
        // Validate webhook URL
        if (empty($config->webhook_url)) {
            return [
                'success' => false,
                'message' => 'Webhook URL is not configured',
                'error' => 'webhook_url_empty'
            ];
        }

        $testPayload = [
            'action' => 'test_connection',
            'recipient' => [
                'email' => 'test@example.com',
                'name' => 'Test User'
            ],
            'details' => [
                'test' => true,
                'timestamp' => now()->toISOString(),
                'message' => 'This is a test connection from the admin panel'
            ]
        ];

        try {
            $response = $this->client->post($config->webhook_url, [
                'json' => $testPayload,
                'timeout' => $config->webhook_timeout,
                'headers' => [
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json'
                ]
            ]);

            $statusCode = $response->getStatusCode();
            $responseBody = $response->getBody()->getContents();

            return [
                'success' => true,
                'status_code' => $statusCode,
                'response' => json_decode($responseBody, true),
                'message' => 'Connection test successful'
            ];

        } catch (RequestException $e) {
            $errorMessage = $e->getMessage();
            $statusCode = $e->getResponse() ? $e->getResponse()->getStatusCode() : 0;

            return [
                'success' => false,
                'status_code' => $statusCode,
                'error' => $errorMessage,
                'message' => 'Connection test failed'
            ];
        }
    }
}
