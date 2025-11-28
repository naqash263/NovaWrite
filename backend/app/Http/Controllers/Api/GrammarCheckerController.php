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

class GrammarCheckerController extends Controller
{
    private $careerAiService;

    public function __construct(CareerAiService $careerAiService)
    {
        $this->careerAiService = $careerAiService;
    }

    /**
     * Check grammar and correct text
     */
    public function check(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'text' => 'required|string|max:50000',
            'check_spelling' => 'sometimes|boolean',
            'check_grammar' => 'sometimes|boolean',
            'check_style' => 'sometimes|boolean',
            'suggest_improvements' => 'sometimes|boolean'
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
            $checkSpelling = $request->input('check_spelling', true);
            $checkGrammar = $request->input('check_grammar', true);
            $checkStyle = $request->input('check_style', true);
            $suggestImprovements = $request->input('suggest_improvements', true);

            $prompt = $this->buildGrammarCheckPrompt($text, $checkSpelling, $checkGrammar, $checkStyle, $suggestImprovements);
            $response = $this->careerAiService->callGeminiApi($apiKey, $prompt);
            $this->incrementApiUsage($apiKey);

            // Extract corrected text and suggestions from response
            $result = $this->extractGrammarCheckResult($response);

            return response()->json([
                'success' => true,
                'data' => [
                    'original_text' => $text,
                    'corrected_text' => $result['corrected_text'] ?? $text,
                    'errors_found' => $result['errors_found'] ?? 0,
                    'suggestions' => $result['suggestions'] ?? [],
                    'improvements' => $result['improvements'] ?? [],
                    'original_length' => strlen($text),
                    'corrected_length' => strlen($result['corrected_text'] ?? $text),
                    'remaining_requests' => $this->getRemainingRequests($apiKey)
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Grammar check error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to check grammar: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Build the prompt for grammar checking
     */
    private function buildGrammarCheckPrompt(string $text, bool $checkSpelling, bool $checkGrammar, bool $checkStyle, bool $suggestImprovements): string
    {
        $checks = [];
        if ($checkSpelling) {
            $checks[] = 'spelling errors';
        }
        if ($checkGrammar) {
            $checks[] = 'grammar mistakes';
        }
        if ($checkStyle) {
            $checks[] = 'style issues';
        }

        $checkList = !empty($checks) ? implode(', ', $checks) : 'errors';

        $prompt = "Please check the following text for {$checkList} and provide corrections.\n\n";
        
        if ($suggestImprovements) {
            $prompt .= "Also suggest improvements for clarity, readability, and overall quality.\n\n";
        }

        $prompt .= "Requirements:\n";
        $prompt .= "- Correct all spelling errors\n";
        $prompt .= "- Fix grammar mistakes\n";
        $prompt .= "- Improve sentence structure where needed\n";
        $prompt .= "- Maintain the original meaning and tone\n";
        $prompt .= "- Keep the same length approximately\n";
        
        if ($suggestImprovements) {
            $prompt .= "- Provide suggestions for better word choices and phrasing\n";
        }

        $prompt .= "\nPlease provide your response in JSON format with the following structure:\n";
        $prompt .= "{\n";
        $prompt .= '  "corrected_text": "the corrected version of the text",' . "\n";
        $prompt .= '  "errors_found": number_of_errors,' . "\n";
        $prompt .= '  "suggestions": ["suggestion 1", "suggestion 2", ...],' . "\n";
        $prompt .= '  "improvements": ["improvement 1", "improvement 2", ...]' . "\n";
        $prompt .= "}\n\n";
        $prompt .= "Text to check:\n\n{$text}\n\nCorrected text and suggestions:";

        return $prompt;
    }

    /**
     * Extract grammar check result from API response
     */
    private function extractGrammarCheckResult($response): array
    {
        $defaultResult = [
            'corrected_text' => '',
            'errors_found' => 0,
            'suggestions' => [],
            'improvements' => []
        ];

        // If response is already an array with expected structure
        if (is_array($response)) {
            if (isset($response['corrected_text'])) {
                return [
                    'corrected_text' => trim($response['corrected_text']),
                    'errors_found' => $response['errors_found'] ?? 0,
                    'suggestions' => $response['suggestions'] ?? [],
                    'improvements' => $response['improvements'] ?? []
                ];
            }
            
            // Try to find corrected text in other keys
            if (isset($response['text'])) {
                $defaultResult['corrected_text'] = trim($response['text']);
            } elseif (isset($response['content'])) {
                $defaultResult['corrected_text'] = trim($response['content']);
            } elseif (count($response) === 1 && is_string($response[0])) {
                $defaultResult['corrected_text'] = trim($response[0]);
            }
        }

        // If response is a string, try to parse as JSON
        if (is_string($response)) {
            $decoded = json_decode($response, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                return $this->extractGrammarCheckResult($decoded);
            }
            // If not JSON, treat as corrected text
            $defaultResult['corrected_text'] = trim($response);
        }

        return $defaultResult;
    }

    /**
     * Get available API key
     */
    private function getAvailableApiKey()
    {
        try {
            $user = auth('api')->user();
            
            if ($user) {
                $userApiKey = UserApiKey::where('user_id', $user->id)
                    ->where('is_active', true)
                    ->whereRaw('used_requests < max_requests')
                    ->first();

                if ($userApiKey) {
                    Log::info('Using user API key for grammar checker', ['user_id' => $user->id]);
                    return $userApiKey;
                }
            }

            $adminApiKey = GeminiApiKey::where('is_active', true)
                ->whereRaw('used_requests < total_requests')
                ->first();
                
            if ($adminApiKey) {
                Log::info('Using admin API key for grammar checker');
                return $adminApiKey;
            }

            Log::warning('No available API keys for grammar checker');
            return null;
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

