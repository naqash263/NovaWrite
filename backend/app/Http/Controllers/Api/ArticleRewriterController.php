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

class ArticleRewriterController extends Controller
{
    private $careerAiService;

    public function __construct(CareerAiService $careerAiService)
    {
        $this->careerAiService = $careerAiService;
    }

    /**
     * Rewrite/paraphrase article
     */
    public function rewrite(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'text' => 'required|string|max:50000',
            'style' => 'sometimes|in:formal,casual,creative,academic,professional',
            'tone' => 'sometimes|in:neutral,positive,persuasive,informative',
            'preserve_meaning' => 'sometimes|boolean'
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
            $style = $request->input('style', 'formal');
            $tone = $request->input('tone', 'neutral');
            $preserveMeaning = $request->input('preserve_meaning', true);

            $prompt = $this->buildRewritePrompt($text, $style, $tone, $preserveMeaning);
            $response = $this->careerAiService->callGeminiApi($apiKey, $prompt);
            $this->incrementApiUsage($apiKey);

            // Extract rewritten text from response
            $rewrittenText = $this->extractRewrittenText($response);

            return response()->json([
                'success' => true,
                'data' => [
                    'original_text' => $text,
                    'rewritten_text' => $rewrittenText,
                    'original_length' => strlen($text),
                    'rewritten_length' => strlen($rewrittenText),
                    'word_count_original' => str_word_count($text),
                    'word_count_rewritten' => str_word_count($rewrittenText),
                    'style' => $style,
                    'tone' => $tone,
                    'remaining_requests' => $this->getRemainingRequests($apiKey)
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Article rewriting error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to rewrite article: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Build the prompt for article rewriting
     */
    private function buildRewritePrompt(string $text, string $style, string $tone, bool $preserveMeaning): string
    {
        $styleInstructions = [
            'formal' => 'Use formal language with proper grammar and professional vocabulary',
            'casual' => 'Use casual, conversational language that is friendly and approachable',
            'creative' => 'Use creative and engaging language with varied sentence structures',
            'academic' => 'Use academic language with precise terminology and formal structure',
            'professional' => 'Use professional business language that is clear and concise'
        ];

        $toneInstructions = [
            'neutral' => 'Maintain a neutral, objective tone',
            'positive' => 'Use a positive, upbeat tone',
            'persuasive' => 'Use a persuasive, convincing tone',
            'informative' => 'Use an informative, educational tone'
        ];

        $styleInstruction = $styleInstructions[$style] ?? $styleInstructions['formal'];
        $toneInstruction = $toneInstructions[$tone] ?? $toneInstructions['neutral'];
        $meaningInstruction = $preserveMeaning 
            ? 'CRITICAL: Preserve the exact meaning and all key information from the original text. Do not add new information or remove important details.'
            : 'You may adapt the content while maintaining the core message.';

        return "Rewrite the following text while maintaining its core meaning and key information. {$styleInstruction}. {$toneInstruction}. {$meaningInstruction}\n\nRequirements:\n- Use different words and sentence structures\n- Maintain the same length (approximately)\n- Keep all important facts and details\n- Ensure the rewritten version is unique but conveys the same message\n- Make it natural and readable\n\nOriginal text:\n\n{$text}\n\nRewritten text:";
    }

    /**
     * Extract rewritten text from API response
     */
    private function extractRewrittenText($response): string
    {
        // If response is already a string, return it
        if (is_string($response)) {
            return trim($response);
        }

        // If response is an array, try to find rewritten text
        if (is_array($response)) {
            // Try common keys
            if (isset($response['rewritten_text'])) {
                return trim($response['rewritten_text']);
            }
            if (isset($response['text'])) {
                return trim($response['text']);
            }
            if (isset($response['content'])) {
                return trim($response['content']);
            }
            if (isset($response['rewritten'])) {
                return trim($response['rewritten']);
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
                Log::info('No authenticated user for article rewriter, using public API access');
            }
            
            if ($user) {
                try {
                    $userApiKey = UserApiKey::where('user_id', $user->id)
                        ->where('is_active', true)
                        ->whereRaw('used_requests < max_requests')
                        ->first();

                    if ($userApiKey) {
                        Log::info('Using user API key for article rewriter', ['user_id' => $user->id]);
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
                    Log::info('Using admin API key for article rewriter');
                    return $adminApiKey;
                }
            } catch (\Exception $e) {
                Log::error('Failed to get admin API key: ' . $e->getMessage());
                throw $e; // Re-throw database connection errors
            }

            Log::warning('No available API keys for article rewriter');
            return null;
        } catch (\Illuminate\Database\QueryException $e) {
            Log::error('Database connection error in article rewriter: ' . $e->getMessage());
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

