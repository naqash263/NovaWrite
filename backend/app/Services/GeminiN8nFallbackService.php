<?php

namespace App\Services;

use App\Models\N8nConfiguration;
use App\Models\GeminiFallbackLog;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Support\Facades\Log;

class GeminiN8nFallbackService
{
    protected $client;
    protected $errorClassifier;
    protected $responseAdapter;

    public function __construct()
    {
        $this->client = new Client();
        $this->errorClassifier = new GeminiErrorClassifier();
        $this->responseAdapter = new N8nResponseAdapter();
    }

    /**
     * Call Gemini API with automatic fallback to N8N
     */
    public function callWithFallback(
        callable $geminiCall,
        string $toolType,
        string $prompt,
        array $options = []
    ): array {
        $startTime = microtime(true);
        $fallbackReason = null;
        $geminiErrorCode = null;
        $geminiErrorMessage = null;

        try {
            // Try Gemini API first
            $response = $geminiCall();
            $responseTime = microtime(true) - $startTime;

            // Log successful Gemini call (no fallback needed)
            Log::info('Gemini API call successful', [
                'tool_type' => $toolType,
                'response_time' => round($responseTime, 3)
            ]);

            return $response;

        } catch (\Exception $e) {
            $geminiErrorCode = GeminiErrorClassifier::getErrorCode($e);
            $geminiErrorMessage = GeminiErrorClassifier::getErrorMessage($e);

            // Check if we should fallback
            if (!$this->errorClassifier->shouldFallback($e)) {
                Log::info('Gemini API error, but fallback not needed', [
                    'tool_type' => $toolType,
                    'error' => $e->getMessage()
                ]);
                throw $e;
            }

            $fallbackReason = $this->errorClassifier->getFallbackReason($e);

            Log::info('Gemini API failed, attempting N8N fallback', [
                'tool_type' => $toolType,
                'fallback_reason' => $fallbackReason,
                'error' => $e->getMessage()
            ]);

            // Attempt N8N fallback
            try {
                $n8nStartTime = microtime(true);
                $n8nResponse = $this->callN8nFallback($prompt, $toolType, $options);
                $n8nResponseTime = microtime(true) - $n8nStartTime;

                // Format response
                $formattedResponse = $this->responseAdapter->adapt($n8nResponse, $toolType);

                // Log successful fallback
                $this->logFallbackUsage(
                    $toolType,
                    $prompt,
                    $fallbackReason,
                    $geminiErrorCode,
                    $geminiErrorMessage,
                    $n8nResponseTime,
                    true,
                    strlen(json_encode($formattedResponse))
                );

                Log::info('N8N fallback successful', [
                    'tool_type' => $toolType,
                    'response_time' => round($n8nResponseTime, 3)
                ]);

                return $formattedResponse;

            } catch (\Exception $n8nException) {
                // N8N fallback also failed
                $this->logFallbackUsage(
                    $toolType,
                    $prompt,
                    $fallbackReason,
                    $geminiErrorCode,
                    $geminiErrorMessage,
                    null,
                    false,
                    null
                );

                Log::error('N8N fallback also failed', [
                    'tool_type' => $toolType,
                    'gemini_error' => $e->getMessage(),
                    'n8n_error' => $n8nException->getMessage()
                ]);

                // Throw original Gemini error
                throw $e;
            }
        }
    }

    /**
     * Call N8N fallback webhook
     */
    public function callN8nFallback(string $prompt, string $toolType, array $options = []): array
    {
        $config = N8nConfiguration::getActive();

        if (!$config) {
            throw new \Exception('No active N8N configuration found');
        }

        if (!$config->isGeminiFallbackEnabled()) {
            throw new \Exception('Gemini fallback is not enabled');
        }

        if (!$config->isValidGeminiWebhookUrl()) {
            throw new \Exception('Invalid Gemini webhook URL in N8N configuration');
        }

        $webhookUrl = $config->getGeminiWebhookUrl();
        $timeout = $config->getGeminiFallbackTimeout();

        // Build payload
        $payload = [
            'action' => 'gemini_fallback',
            'tool_type' => $toolType,
            'prompt' => $prompt,
            'options' => $options,
            'metadata' => [
                'request_id' => uniqid('req_', true),
                'timestamp' => now()->toISOString(),
                'fallback_reason' => $options['fallback_reason'] ?? 'unknown'
            ]
        ];

        try {
            Log::info('Sending request to N8N fallback webhook', [
                'tool_type' => $toolType,
                'webhook_url' => $webhookUrl,
                'timeout' => $timeout
            ]);

            $response = $this->client->post($webhookUrl, [
                'json' => $payload,
                'timeout' => $timeout,
                'headers' => [
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json'
                ]
            ]);

            $statusCode = $response->getStatusCode();
            $responseBody = $response->getBody()->getContents();
            $responseData = json_decode($responseBody, true);

            if ($statusCode >= 200 && $statusCode < 300) {
                // Check if response has success flag
                if (isset($responseData['success']) && $responseData['success'] === false) {
                    throw new \Exception($responseData['message'] ?? 'N8N returned error response');
                }

                // Return data (could be in 'data' key or root)
                return $responseData['data'] ?? $responseData;
            } else {
                throw new \Exception("N8N webhook returned status code: {$statusCode}");
            }

        } catch (RequestException $e) {
            $errorMessage = $e->getMessage();
            $statusCode = $e->getResponse() ? $e->getResponse()->getStatusCode() : null;

            Log::error('N8N fallback webhook request failed', [
                'tool_type' => $toolType,
                'error' => $errorMessage,
                'status_code' => $statusCode,
                'webhook_url' => $webhookUrl
            ]);

            throw new \Exception("N8N fallback failed: {$errorMessage}", 0, $e);
        } catch (\Exception $e) {
            Log::error('N8N fallback error', [
                'tool_type' => $toolType,
                'error' => $e->getMessage()
            ]);

            throw $e;
        }
    }

    /**
     * Log fallback usage
     */
    private function logFallbackUsage(
        string $toolType,
        string $prompt,
        string $fallbackReason,
        ?string $geminiErrorCode,
        ?string $geminiErrorMessage,
        ?float $n8nResponseTime,
        bool $success,
        ?int $responseSize
    ): void {
        try {
            // Hash prompt for privacy (first 100 chars)
            $promptHash = hash('sha256', substr($prompt, 0, 100));

            GeminiFallbackLog::create([
                'tool_type' => $toolType,
                'prompt_hash' => $promptHash,
                'fallback_reason' => $fallbackReason,
                'gemini_error_code' => $geminiErrorCode,
                'gemini_error_message' => $geminiErrorMessage ? substr($geminiErrorMessage, 0, 500) : null,
                'n8n_response_time' => $n8nResponseTime,
                'success' => $success,
                'response_size' => $responseSize,
                'metadata' => [
                    'timestamp' => now()->toISOString()
                ]
            ]);
        } catch (\Exception $e) {
            // Don't fail the request if logging fails
            Log::warning('Failed to log fallback usage: ' . $e->getMessage());
        }
    }

    /**
     * Check if fallback is available
     */
    public function isFallbackAvailable(): bool
    {
        $config = N8nConfiguration::getActive();

        if (!$config) {
            return false;
        }

        return $config->isGeminiFallbackEnabled() && 
               $config->isValidGeminiWebhookUrl();
    }

    /**
     * Test N8N fallback connection
     */
    public function testConnection(): array
    {
        $config = N8nConfiguration::getActive();

        if (!$config) {
            return [
                'success' => false,
                'message' => 'No active N8N configuration found'
            ];
        }

        if (!$config->isGeminiFallbackEnabled()) {
            return [
                'success' => false,
                'message' => 'Gemini fallback is not enabled'
            ];
        }

        if (!$config->isValidGeminiWebhookUrl()) {
            return [
                'success' => false,
                'message' => 'Invalid Gemini webhook URL'
            ];
        }

        try {
            $testPayload = [
                'action' => 'gemini_fallback',
                'tool_type' => 'test',
                'prompt' => 'Test connection',
                'options' => [],
                'metadata' => [
                    'test' => true,
                    'timestamp' => now()->toISOString()
                ]
            ];

            $response = $this->client->post($config->getGeminiWebhookUrl(), [
                'json' => $testPayload,
                'timeout' => 10,
                'headers' => [
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json'
                ]
            ]);

            $statusCode = $response->getStatusCode();
            $responseBody = $response->getBody()->getContents();

            return [
                'success' => $statusCode >= 200 && $statusCode < 300,
                'status_code' => $statusCode,
                'response' => json_decode($responseBody, true),
                'message' => 'Connection test successful'
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'message' => 'Connection test failed'
            ];
        }
    }
}
