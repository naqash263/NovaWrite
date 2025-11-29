<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CareerAiService;
use App\Models\UserApiKey;
use App\Models\GeminiApiKey;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class TextSummarizerController extends Controller
{
    private $careerAiService;

    public function __construct(CareerAiService $careerAiService)
    {
        $this->careerAiService = $careerAiService;
    }

    /**
     * Summarize text
     */
    public function summarize(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'text' => 'required|string|max:50000',
            'length' => 'sometimes|in:short,medium,long',
            'focus' => 'sometimes|in:general,key-points,detailed'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $apiKey = $this->getAvailableApiKey();
            if (!$apiKey) {
                return response()->json([
                    'success' => false,
                    'message' => 'Service temporarily unavailable. Please try again later.'
                ], 503);
            }

            $text = $request->input('text');
            $length = $request->input('length', 'medium');
            $focus = $request->input('focus', 'general');

            $prompt = $this->buildSummarizePrompt($text, $length, $focus);
            $response = $this->careerAiService->callGeminiApi($apiKey, $prompt);
            $this->incrementApiUsage($apiKey);

            // Extract summary from response
            $summary = $this->extractSummary($response);

            return response()->json([
                'success' => true,
                'data' => [
                    'summary' => $summary,
                    'original_length' => strlen($text),
                    'summary_length' => strlen($summary),
                    'compression_ratio' => round((1 - strlen($summary) / strlen($text)) * 100, 1),
                    'remaining_requests' => $this->getRemainingRequests($apiKey)
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Text summarization error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate summary: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Build the prompt for summarization
     */
    private function buildSummarizePrompt(string $text, string $length, string $focus): string
    {
        $lengthInstructions = [
            'short' => 'in 2-3 sentences (approximately 50-100 words)',
            'medium' => 'in 1-2 paragraphs (approximately 100-200 words)',
            'long' => 'in 3-5 paragraphs (approximately 200-400 words)'
        ];

        $focusInstructions = [
            'general' => 'Provide a general summary covering all main points',
            'key-points' => 'Focus on extracting and listing the key points and main ideas',
            'detailed' => 'Provide a detailed summary with important context and examples'
        ];

        $instruction = $lengthInstructions[$length] ?? $lengthInstructions['medium'];
        $focusInstruction = $focusInstructions[$focus] ?? $focusInstructions['general'];

        return "Please summarize the following text {$instruction}. {$focusInstruction}. Maintain accuracy and preserve the most important information.\n\nText to summarize:\n\n{$text}\n\nSummary:";
    }

    /**
     * Extract summary from API response
     */
    private function extractSummary($response): string
    {
        // If response is already a string, return it
        if (is_string($response)) {
            return trim($response);
        }

        // If response is an array, try to find summary
        if (is_array($response)) {
            // Try common keys
            if (isset($response['summary'])) {
                return trim($response['summary']);
            }
            if (isset($response['text'])) {
                return trim($response['text']);
            }
            if (isset($response['content'])) {
                return trim($response['content']);
            }
            
            // If it's a simple array with one text element
            if (count($response) === 1 && is_string($response[0])) {
                return trim($response[0]);
            }
            
            // Try to get first string value
            foreach ($response as $value) {
                if (is_string($value) && strlen($value) > 10) {
                    return trim($value);
                }
            }
        }

        // Fallback: convert to string
        return trim(json_encode($response, JSON_PRETTY_PRINT));
    }

    /**
     * Get available API key
     */
    private function getAvailableApiKey()
    {
        try {
            $user = null;
            try {
                $user = auth('api')->user();
            } catch (\Exception $e) {
                // User not authenticated, continue with public access
                Log::info('No authenticated user for text summarizer, using public API access');
            }
            
            if ($user) {
                try {
                    $userApiKey = UserApiKey::where('user_id', $user->id)
                        ->where('is_active', true)
                        ->whereRaw('used_requests < max_requests')
                        ->first();

                    if ($userApiKey) {
                        Log::info('Using user API key for text summarizer', ['user_id' => $user->id]);
                        return $userApiKey;
                    }
                } catch (\Exception $e) {
                    Log::warning('Failed to get user API key: ' . $e->getMessage());
                }
            }

            try {
                $adminApiKey = GeminiApiKey::where('is_active', true)
                    ->whereRaw('used_requests < total_requests')
                    ->first();
                    
                if ($adminApiKey) {
                    Log::info('Using admin API key for text summarizer');
                    return $adminApiKey;
                }
            } catch (\Exception $e) {
                Log::error('Failed to get admin API key: ' . $e->getMessage());
                throw $e; // Re-throw database connection errors
            }

            Log::warning('No available API keys for text summarizer');
            return null;
        } catch (\Illuminate\Database\QueryException $e) {
            Log::error('Database connection error in text summarizer: ' . $e->getMessage());
            throw new \Exception('Database connection failed. Please try again later.');
        } catch (\Exception $e) {
            Log::error('API key retrieval failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Increment API usage
     */
    private function incrementApiUsage($apiKey)
    {
        try {
            if ($apiKey instanceof UserApiKey) {
                $apiKey->incrementUsage();
            } elseif ($apiKey instanceof GeminiApiKey) {
                $apiKey->incrementUsage();
            }
        } catch (\Exception $e) {
            Log::error('Failed to increment API usage: ' . $e->getMessage());
        }
    }

    /**
     * Get remaining requests for API key
     */
    private function getRemainingRequests($apiKey): int
    {
        try {
            if ($apiKey instanceof UserApiKey) {
                return max(0, $apiKey->max_requests - $apiKey->used_requests);
            } elseif ($apiKey instanceof GeminiApiKey) {
                return max(0, $apiKey->total_requests - $apiKey->used_requests);
            }
        } catch (\Exception $e) {
            Log::error('Failed to get remaining requests: ' . $e->getMessage());
        }
        return 0;
    }
}

