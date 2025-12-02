<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CareerAiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class KeywordExtractorController extends Controller
{
    protected $careerAiService;

    public function __construct(CareerAiService $careerAiService)
    {
        $this->careerAiService = $careerAiService;
    }

    public function extract(Request $request)
    {
        $request->validate([
            'text' => 'required|string|min:10|max:10000',
            'maxKeywords' => 'nullable|integer|min:5|max:50',
            'includeRelated' => 'nullable|boolean',
        ], [
            'text.required' => 'Please provide text to extract keywords from.',
            'text.min' => 'Text must be at least 10 characters long.',
            'text.max' => 'Text must not exceed 10,000 characters.',
        ]);

        try {
            $text = $request->input('text');
            $maxKeywords = $request->input('maxKeywords', 10);
            $includeRelated = $request->input('includeRelated', false);

            // Get available API key
            $apiKey = $this->getAvailableApiKey();
            if (!$apiKey) {
                return response()->json([
                    'success' => false,
                    'message' => 'AI service is temporarily unavailable. Please try again later.'
                ], 503);
            }

            // Prepare prompt for Gemini
            $prompt = "Extract the most important keywords from the following text. ";
            $prompt .= "Return only the keywords as a comma-separated list. ";
            $prompt .= "Focus on the main topics, concepts, and important terms. ";
            $prompt .= "Extract up to {$maxKeywords} keywords. ";
            
            if ($includeRelated) {
                $prompt .= "Also include related keywords and synonyms. ";
            }
            
            $prompt .= "\n\nText:\n{$text}\n\nKeywords:";

            // Call Gemini API
            $response = $this->careerAiService->callGeminiApi($apiKey, $prompt);

            // Parse response
            $keywords = $this->parseKeywords($response);

            // Increment API usage
            $this->careerAiService->incrementApiUsage($apiKey);

            return response()->json([
                'success' => true,
                'message' => 'Keywords extracted successfully',
                'data' => [
                    'keywords' => $keywords,
                    'count' => count($keywords),
                    'text_length' => strlen($text),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Keyword extraction error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to extract keywords: ' . $e->getMessage()
            ], 500);
        }
    }

    private function getAvailableApiKey()
    {
        try {
            // Try to get user's API key first
            $user = auth('api')->user();
            if ($user) {
                $userApiKey = $this->careerAiService->getAvailableUserApiKey($user->id);
                if ($userApiKey) {
                    return $userApiKey;
                }
            }

            // Fallback to shared API key
            return $this->careerAiService->getAvailableSharedApiKey();
        } catch (\Exception $e) {
            Log::warning('Error getting API key: ' . $e->getMessage());
            return null;
        }
    }

    private function parseKeywords($response)
    {
        if (is_array($response)) {
            // If response is already an array, extract keywords
            $text = json_encode($response);
        } else {
            $text = $response;
        }

        // Remove markdown code blocks if present
        $text = preg_replace('/```[a-z]*\n?/', '', $text);
        $text = preg_replace('/```\n?/', '', $text);

        // Split by common delimiters
        $keywords = preg_split('/[,;\n\r|•]/', $text);
        
        // Clean and filter keywords
        $keywords = array_map(function($keyword) {
            return trim($keyword);
        }, $keywords);

        // Remove empty values and duplicates
        $keywords = array_filter($keywords, function($keyword) {
            return !empty($keyword) && strlen($keyword) > 1;
        });

        // Remove duplicates (case-insensitive)
        $keywords = array_unique(array_map('strtolower', $keywords));
        $keywords = array_values($keywords);

        return $keywords;
    }
}

