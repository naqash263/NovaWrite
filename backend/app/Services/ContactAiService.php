<?php

namespace App\Services;

use App\Models\GeminiApiKey;
use Illuminate\Support\Facades\Log;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

class ContactAiService
{
    private $client;

    public function __construct()
    {
        $this->client = new Client();
    }

    /**
     * Analyze contact form message and categorize inquiry type
     */
    public function analyzeInquiry(string $message, string $subject = '', $apiKey = null): array
    {
        try {
            if (!$apiKey) {
                $apiKey = $this->getAvailableApiKey();
            }
            
            if (!$apiKey) {
                // Return default if no API key available
                return $this->getDefaultAnalysis();
            }

            $prompt = $this->buildAnalysisPrompt($message, $subject);
            $response = $this->callGeminiApi($apiKey, $prompt);

            return $this->parseAnalysis($response);
        } catch (\Exception $e) {
            Log::warning('Contact AI analysis failed: ' . $e->getMessage());
            return $this->getDefaultAnalysis();
        }
    }

    /**
     * Get sentiment analysis of the message
     */
    public function analyzeSentiment(string $message, $apiKey = null): array
    {
        try {
            if (!$apiKey) {
                $apiKey = $this->getAvailableApiKey();
            }
            
            if (!$apiKey) {
                return ['sentiment' => 'neutral', 'score' => 0.5];
            }

            $prompt = "Analyze the sentiment of this message and respond with JSON only:\n\nMessage: {$message}\n\nRespond with JSON: {\"sentiment\": \"positive|negative|neutral\", \"score\": 0.0-1.0, \"confidence\": 0.0-1.0}";
            
            $response = $this->callGeminiApi($apiKey, $prompt);
            $data = json_decode($response, true);

            if (isset($data['sentiment']) && isset($data['score'])) {
                return [
                    'sentiment' => $data['sentiment'],
                    'score' => floatval($data['score']),
                    'confidence' => floatval($data['confidence'] ?? 0.8)
                ];
            }
        } catch (\Exception $e) {
            Log::warning('Sentiment analysis failed: ' . $e->getMessage());
        }

        return ['sentiment' => 'neutral', 'score' => 0.5, 'confidence' => 0.5];
    }

    /**
     * Get smart suggestions for improving the message
     */
    public function getSuggestions(string $message, $apiKey = null): array
    {
        try {
            if (!$apiKey) {
                $apiKey = $this->getAvailableApiKey();
            }
            
            if (!$apiKey) {
                return [];
            }

            $prompt = "Analyze this contact form message and provide 2-3 brief suggestions to make it more effective. Respond with JSON only:\n\nMessage: {$message}\n\nRespond with JSON: {\"suggestions\": [\"suggestion1\", \"suggestion2\", \"suggestion3\"]}";
            
            $response = $this->callGeminiApi($apiKey, $prompt);
            $data = json_decode($response, true);

            if (isset($data['suggestions']) && is_array($data['suggestions'])) {
                return $data['suggestions'];
            }
        } catch (\Exception $e) {
            Log::warning('AI suggestions failed: ' . $e->getMessage());
        }

        return [];
    }

    /**
     * Build analysis prompt
     */
    private function buildAnalysisPrompt(string $message, string $subject): string
    {
        return "Analyze this contact form submission and categorize it. Respond with JSON only:\n\nSubject: {$subject}\nMessage: {$message}\n\nCategorize the inquiry type as one of: general, consultation, project, partnership, other\n\nRespond with JSON: {\"inquiry_type\": \"type\", \"confidence\": 0.0-1.0, \"keywords\": [\"keyword1\", \"keyword2\"], \"urgency\": \"low|medium|high\"}";
    }

    /**
     * Call Gemini API
     */
    private function callGeminiApi($apiKey, string $prompt): string
    {
        $apiKeyModel = is_object($apiKey) ? $apiKey : GeminiApiKey::where('is_active', true)->first();
        
        if (!$apiKeyModel) {
            throw new \Exception('No available API keys');
        }

        $apiKeyValue = $apiKeyModel->decrypted_api_key;
        
        if (!$apiKeyValue) {
            throw new \Exception('Invalid API key');
        }

        $response = $this->client->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={$apiKeyValue}", [
            'headers' => [
                'Content-Type' => 'application/json',
            ],
            'json' => [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.3,
                    'topK' => 40,
                    'topP' => 0.95,
                    'maxOutputTokens' => 512,
                ]
            ],
            'timeout' => 15
        ]);

        $data = json_decode($response->getBody()->getContents(), true);
        
        if (!isset($data['candidates'][0]['content']['parts'][0]['text'])) {
            throw new \Exception('Invalid API response');
        }

        $aiResponse = $data['candidates'][0]['content']['parts'][0]['text'];
        
        // Clean the response - remove markdown code blocks if present
        $cleanResponse = $aiResponse;
        if (strpos($aiResponse, '```json') !== false) {
            $cleanResponse = preg_replace('/```json\s*/', '', $aiResponse);
            $cleanResponse = preg_replace('/\s*```/', '', $cleanResponse);
        } elseif (strpos($aiResponse, '```') !== false) {
            $cleanResponse = preg_replace('/```[a-z]*\s*/', '', $aiResponse);
            $cleanResponse = preg_replace('/\s*```/', '', $cleanResponse);
        }

        return trim($cleanResponse);
    }

    /**
     * Parse analysis response
     */
    private function parseAnalysis(string $response): array
    {
        $data = json_decode($response, true);
        
        if (json_last_error() === JSON_ERROR_NONE && is_array($data)) {
            return [
                'inquiry_type' => $data['inquiry_type'] ?? 'general',
                'confidence' => floatval($data['confidence'] ?? 0.7),
                'keywords' => $data['keywords'] ?? [],
                'urgency' => $data['urgency'] ?? 'medium',
            ];
        }

        return $this->getDefaultAnalysis();
    }

    /**
     * Get default analysis when AI is unavailable
     */
    private function getDefaultAnalysis(): array
    {
        return [
            'inquiry_type' => 'general',
            'confidence' => 0.5,
            'keywords' => [],
            'urgency' => 'medium',
        ];
    }

    /**
     * Get available API key
     */
    private function getAvailableApiKey()
    {
        return GeminiApiKey::where('is_active', true)
            ->where('requests_remaining', '>', 0)
            ->orderBy('requests_remaining', 'desc')
            ->first();
    }
}

