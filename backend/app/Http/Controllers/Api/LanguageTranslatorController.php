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

class LanguageTranslatorController extends Controller
{
    private $careerAiService;

    public function __construct(CareerAiService $careerAiService)
    {
        $this->careerAiService = $careerAiService;
    }

    /**
     * Translate text
     */
    public function translate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'text' => 'required|string|max:50000',
            'source_language' => 'nullable|string|max:50',
            'target_language' => 'required|string|max:50|min:1',
            'preserve_formatting' => 'sometimes|boolean'
        ], [
            'text.required' => 'Text is required',
            'text.string' => 'Text must be a string',
            'text.max' => 'Text must not exceed 50,000 characters',
            'target_language.required' => 'Target language is required',
            'target_language.string' => 'Target language must be a string',
            'target_language.min' => 'Target language cannot be empty',
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
            $sourceLanguage = $request->input('source_language') ?: 'auto';
            $targetLanguage = $request->input('target_language');
            $preserveFormatting = $request->input('preserve_formatting', true);

            $prompt = $this->buildTranslationPrompt($text, $sourceLanguage, $targetLanguage, $preserveFormatting);
            $response = $this->careerAiService->callGeminiApi($apiKey, $prompt);
            $this->incrementApiUsage($apiKey);

            // Extract translated text from response
            $translatedText = $this->extractTranslatedText($response);

            return response()->json([
                'success' => true,
                'data' => [
                    'original_text' => $text,
                    'translated_text' => $translatedText,
                    'source_language' => $sourceLanguage === 'auto' ? $this->detectLanguage($text) : $sourceLanguage,
                    'target_language' => $targetLanguage,
                    'original_length' => strlen($text),
                    'translated_length' => strlen($translatedText),
                    'remaining_requests' => $this->getRemainingRequests($apiKey)
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Translation error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to translate text: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Build the prompt for translation
     */
    private function buildTranslationPrompt(string $text, string $sourceLanguage, string $targetLanguage, bool $preserveFormatting): string
    {
        $sourceInstruction = $sourceLanguage === 'auto' 
            ? 'Detect the source language automatically'
            : "Source language: {$sourceLanguage}";

        $formattingInstruction = $preserveFormatting 
            ? 'Preserve all formatting, line breaks, paragraphs, and special characters exactly as they appear in the original.'
            : 'You may adjust formatting for better readability in the target language.';

        $prompt = "Translate the following text from {$sourceInstruction} to {$targetLanguage}.\n\n";
        $prompt .= "{$formattingInstruction}\n\n";
        $prompt .= "Requirements:\n";
        $prompt .= "- Provide accurate, natural translation\n";
        $prompt .= "- Maintain the original meaning and tone\n";
        $prompt .= "- Use appropriate vocabulary for the target language\n";
        $prompt .= "- Ensure the translation reads naturally in {$targetLanguage}\n";
        $prompt .= "- Keep cultural context appropriate\n\n";
        $prompt .= "Text to translate:\n\n{$text}\n\nTranslation:";

        return $prompt;
    }

    /**
     * Extract translated text from API response
     */
    private function extractTranslatedText($response): string
    {
        // If response is already a string, return it
        if (is_string($response)) {
            return trim($response);
        }

        // If response is an array, try to find translated text
        if (is_array($response)) {
            // Try common keys
            if (isset($response['translated_text'])) {
                return trim($response['translated_text']);
            }
            if (isset($response['text'])) {
                return trim($response['text']);
            }
            if (isset($response['content'])) {
                return trim($response['content']);
            }
            if (isset($response['translation'])) {
                return trim($response['translation']);
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
     * Detect language (simple detection)
     */
    private function detectLanguage(string $text): string
    {
        // Simple language detection - can be enhanced
        // For now, return 'auto' or common languages based on character patterns
        if (preg_match('/[\x{4e00}-\x{9fff}]/u', $text)) {
            return 'Chinese';
        }
        if (preg_match('/[\x{3040}-\x{309F}\x{30A0}-\x{30FF}]/u', $text)) {
            return 'Japanese';
        }
        if (preg_match('/[\x{0600}-\x{06FF}]/u', $text)) {
            return 'Arabic';
        }
        if (preg_match('/[А-Яа-яЁё]/u', $text)) {
            return 'Russian';
        }
        
        // Default to English if can't detect
        return 'English';
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
                Log::info('No authenticated user for language translator, using public API access');
            }
            
            if ($user) {
                try {
                    $userApiKey = UserApiKey::where('user_id', $user->id)
                        ->where('is_active', true)
                        ->whereRaw('used_requests < max_requests')
                        ->first();

                    if ($userApiKey) {
                        Log::info('Using user API key for language translator', ['user_id' => $user->id]);
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
                    Log::info('Using admin API key for language translator');
                    return $adminApiKey;
                }
            } catch (\Exception $e) {
                Log::error('Failed to get admin API key: ' . $e->getMessage());
                throw $e; // Re-throw database connection errors
            }

            Log::warning('No available API keys for language translator');
            return null;
        } catch (\Illuminate\Database\QueryException $e) {
            Log::error('Database connection error in language translator: ' . $e->getMessage());
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

