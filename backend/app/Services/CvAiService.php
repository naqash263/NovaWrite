<?php

namespace App\Services;

use App\Models\GeminiApiKey;
use App\Models\UserApiKey;
use Illuminate\Support\Facades\Log;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

class CvAiService
{
    private $client;

    public function __construct()
    {
        $this->client = new Client();
    }

    /**
     * Extract CV data from uploaded file using AI
     */
    public function extractCvData(string $fileContent, string $fileType, $apiKey = null): array
    {
        try {
            if (!$apiKey) {
                $apiKey = $this->getAvailableApiKey();
            }
            
            if (!$apiKey) {
                throw new \Exception('No available API keys');
            }

            // Truncate content if it's too large (Gemini has token limits)
            $truncatedContent = $this->truncateContent($fileContent);
            
            $prompt = $this->buildExtractionPrompt($truncatedContent, $fileType);
            $response = $this->callGeminiApi($apiKey, $prompt);

            return $this->parseCvData($response);
        } catch (\Exception $e) {
            Log::error('CV extraction failed: ' . $e->getMessage());
            
            // Provide more specific error messages
            if (strpos($e->getMessage(), 'token count') !== false) {
                throw new \Exception('CV file is too large. Please try a shorter CV or split it into sections.');
            } elseif (strpos($e->getMessage(), 'temporarily unavailable') !== false) {
                throw new \Exception('AI service is temporarily unavailable. Please try again in a few minutes.');
            } elseif (strpos($e->getMessage(), 'No available API keys') !== false) {
                throw new \Exception('No API keys available. Please add your own API key or contact support.');
            }
            
            throw $e;
        }
    }

    /**
     * Tailor CV to job description using AI
     */
    public function tailorCvToJob(array $cvData, string $jobDescription, $apiKey = null): array
    {
        try {
            if (!$apiKey) {
                $apiKey = $this->getAvailableApiKey();
            }
            
            if (!$apiKey) {
                throw new \Exception('No available API keys');
            }

            $prompt = $this->buildTailoringPrompt($cvData, $jobDescription);
            $response = $this->callGeminiApi($apiKey, $prompt);

            return $this->parseTailoredCvData($response);
        } catch (\Exception $e) {
            Log::error('CV tailoring failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get an available API key (fallback for backward compatibility)
     */
    private function getAvailableApiKey()
    {
        try {
            // Try Laravel's Eloquent first
            // Try to get a user API key first (if authenticated)
            $userApiKey = UserApiKey::where('is_active', true)
                ->whereRaw('usage_count < requests_per_key')
                ->first();

            if ($userApiKey) {
                return $userApiKey;
            }

            // Fallback to admin API keys
            return GeminiApiKey::where('is_active', true)
                ->whereRaw('used_requests < total_requests')
                ->first();
        } catch (\Exception $e) {
            // If Laravel connection fails, use direct PDO
            Log::warning('Laravel database connection failed, using direct PDO: ' . $e->getMessage());
            return $this->getAvailableApiKeyWithPDO();
        }
    }

    /**
     * Get available API key using direct PDO connection
     */
    private function getAvailableApiKeyWithPDO()
    {
        try {
            $pdo = new \PDO('pgsql:dbname=novawrite_local');
            $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);

            // Try to get a user API key first
            $stmt = $pdo->prepare("SELECT * FROM user_api_keys WHERE is_active = true AND usage_count < requests_per_key LIMIT 1");
            $stmt->execute();
            $userApiKey = $stmt->fetch(\PDO::FETCH_ASSOC);

            if ($userApiKey) {
                // Create a simple object that mimics the UserApiKey model
                $key = new \stdClass();
                $key->api_key = $userApiKey['api_key'];
                $key->id = $userApiKey['id'];
                $key->user_id = $userApiKey['user_id'];
                $key->name = $userApiKey['name'];
                $key->is_active = $userApiKey['is_active'];
                $key->requests_per_key = $userApiKey['requests_per_key'];
                $key->usage_count = $userApiKey['usage_count'];
                
                // Add incrementUsage method
                $key->incrementUsage = function() use ($pdo, $userApiKey) {
                    $stmt = $pdo->prepare("UPDATE user_api_keys SET usage_count = usage_count + 1 WHERE id = ?");
                    $stmt->execute([$userApiKey['id']]);
                };
                
                return $key;
            }

            // Fallback to admin API keys
            $stmt = $pdo->prepare("SELECT * FROM gemini_api_keys WHERE is_active = true AND used_requests < total_requests LIMIT 1");
            $stmt->execute();
            $adminApiKey = $stmt->fetch(\PDO::FETCH_ASSOC);

            if ($adminApiKey) {
                // Create a simple object that mimics the GeminiApiKey model
                $key = new \stdClass();
                $key->api_key = $adminApiKey['api_key'];
                $key->id = $adminApiKey['id'];
                $key->name = $adminApiKey['name'];
                $key->is_active = $adminApiKey['is_active'];
                $key->total_requests = $adminApiKey['total_requests'];
                $key->used_requests = $adminApiKey['used_requests'];
                
                // Add incrementUsage method
                $key->incrementUsage = function() use ($pdo, $adminApiKey) {
                    $stmt = $pdo->prepare("UPDATE gemini_api_keys SET used_requests = used_requests + 1 WHERE id = ?");
                    $stmt->execute([$adminApiKey['id']]);
                };
                
                return $key;
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Direct PDO connection also failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Call Gemini API
     */
    private function callGeminiApi($apiKey, string $prompt): array
    {
        try {
            // Get the actual API key value
            if ($apiKey instanceof UserApiKey) {
                $apiKeyValue = $apiKey->api_key; // UserApiKey has encrypted cast
            } elseif ($apiKey instanceof GeminiApiKey) {
                // For GeminiApiKey, try single decrypt first, then double decrypt if needed
                try {
                    $firstDecrypt = decrypt($apiKey->getRawOriginal('api_key'));
                    // Check if the first decrypt gives us a valid API key (starts with AIza)
                    if (strpos($firstDecrypt, 'AIza') === 0) {
                        $apiKeyValue = $firstDecrypt;
                    } else {
                        // If not, try double decrypt
                        $apiKeyValue = decrypt($firstDecrypt);
                    }
                } catch (\Exception $e) {
                    Log::error('Failed to decrypt Gemini API key: ' . $e->getMessage());
                    // If decryption fails, use fallback API key
                    $fallbackKey = env('FALLBACK_GEMINI_API_KEY');
                    if ($fallbackKey && strpos($fallbackKey, 'AIza') === 0) {
                        Log::warning('Using fallback API key due to decryption failure');
                        $apiKeyValue = $fallbackKey;
                    } else {
                        throw new \Exception('Failed to decrypt API key and no fallback available. Please contact support.');
                    }
                }
            } else {
                // For PDO objects or other types
                $apiKeyValue = $apiKey->api_key ?? $apiKey->apiKey ?? null;
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
                        'temperature' => 0.1,
                        'topK' => 40,
                        'topP' => 0.95,
                        'maxOutputTokens' => 2048,
                    ]
                ],
                'timeout' => 30
            ]);

            $data = json_decode($response->getBody()->getContents(), true);
            
            if (!isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                throw new \Exception('Invalid API response');
            }

            $aiResponse = $data['candidates'][0]['content']['parts'][0]['text'];
            Log::info('AI Response: ' . $aiResponse);
            
            // Clean the response - remove markdown code blocks if present
            $cleanResponse = $aiResponse;
            if (strpos($aiResponse, '```json') !== false) {
                $cleanResponse = preg_replace('/```json\s*/', '', $aiResponse);
                $cleanResponse = preg_replace('/\s*```/', '', $cleanResponse);
            }
            
            $parsedData = json_decode($cleanResponse, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('JSON parsing error: ' . json_last_error_msg());
                Log::error('Raw AI response: ' . $aiResponse);
                Log::error('Cleaned response: ' . $cleanResponse);
                // Return empty data if JSON parsing fails
                return [];
            }
            
            return $parsedData ?? [];
        } catch (RequestException $e) {
            Log::error('Gemini API request failed: ' . $e->getMessage());
            
            // Parse the error response for more specific error messages
            $response = $e->getResponse();
            if ($response) {
                $errorBody = $response->getBody()->getContents();
                $errorData = json_decode($errorBody, true);
                
                if (isset($errorData['error']['message'])) {
                    $errorMessage = $errorData['error']['message'];
                    
                    if (strpos($errorMessage, 'token count') !== false) {
                        throw new \Exception('CV file is too large. Please try a shorter CV or split it into sections.');
                    } elseif (strpos($errorMessage, 'quota') !== false) {
                        throw new \Exception('API quota exceeded. Please try again later or add your own API key.');
                    } elseif (strpos($errorMessage, 'invalid') !== false) {
                        throw new \Exception('Invalid API key. Please check your API key and try again.');
                    }
                }
            }
            
            throw new \Exception('AI service temporarily unavailable. Please try again in a few minutes.');
        }
    }

    /**
     * Build extraction prompt
     */
    private function buildExtractionPrompt(string $fileContent, string $fileType): string
    {
        return "Extract CV information from this {$fileType} file and return it as JSON with the following structure:
        {
            \"fullName\": \"Full Name\",
            \"jobTitle\": \"Job Title\",
            \"email\": \"email@example.com\",
            \"phoneNumber\": \"+1234567890\",
            \"address\": \"Address\",
            \"professionalSummary\": \"Professional summary paragraph\",
            \"workExperience\": [
                {
                    \"jobTitle\": \"Job Title\",
                    \"company\": \"Company Name\",
                    \"startDate\": \"2020-01\",
                    \"endDate\": \"2023-12\",
                    \"description\": \"Job description with achievements\"
                }
            ],
            \"education\": [
                {
                    \"degree\": \"Degree Name\",
                    \"institution\": \"Institution Name\",
                    \"graduationYear\": \"2020\"
                }
            ],
            \"skills\": \"Skill1, Skill2, Skill3\",
            \"projects\": [
                {
                    \"name\": \"Project Name\",
                    \"description\": \"Project description\",
                    \"technologies\": \"Technologies used\",
                    \"url\": \"Project URL (optional)\",
                    \"startDate\": \"2020-01\",
                    \"endDate\": \"2020-06\"
                }
            ],
            \"certificates\": [
                {
                    \"name\": \"Certificate Name\",
                    \"issuer\": \"Issuing Organization\",
                    \"date\": \"2020-01\",
                    \"credentialId\": \"Credential ID (optional)\",
                    \"url\": \"Certificate URL (optional)\"
                }
            ],
            \"languages\": [
                {
                    \"language\": \"Language Name\",
                    \"proficiency\": \"Beginner|Intermediate|Advanced|Native|Fluent\"
                }
            ],
            \"achievements\": [
                {
                    \"title\": \"Achievement Title\",
                    \"description\": \"Achievement description\",
                    \"date\": \"2020-01\"
                }
            ],
            \"references\": [
                {
                    \"name\": \"Reference Name\",
                    \"position\": \"Position\",
                    \"company\": \"Company\",
                    \"email\": \"email@example.com\",
                    \"phone\": \"+1234567890\"
                }
            ]
        }

        File content:
        {$fileContent}";
    }

    /**
     * Build tailoring prompt
     */
    private function buildTailoringPrompt(array $cvData, string $jobDescription): string
    {
        $cvJson = json_encode($cvData, JSON_PRETTY_PRINT);
        
        return "Tailor this CV to match the job description. Return the updated CV as JSON with the same structure, but optimize the content to better match the job requirements:

        Current CV:
        {$cvJson}

        Job Description:
        {$jobDescription}

        Focus on optimizing ALL sections:
        1. **Professional Summary**: Rewrite to match job requirements and highlight relevant experience
        2. **Work Experience**: Adjust job descriptions to emphasize relevant skills and achievements
        3. **Education**: Highlight relevant degrees, certifications, or coursework
        4. **Skills**: Reorder skills by relevance to the job, add missing relevant skills if mentioned in CV
        5. **Projects**: Emphasize projects that match job requirements, adjust descriptions to highlight relevant technologies
        6. **Certificates**: Prioritize certificates relevant to the job, adjust descriptions to show relevance
        7. **Languages**: Reorder by relevance if job requires specific languages
        8. **Achievements**: Highlight achievements that demonstrate skills needed for the job
        9. **References**: If available, prioritize references from relevant industries or roles

        Guidelines:
        - Use keywords from the job description naturally
        - Maintain the same JSON structure
        - Keep all original information but optimize presentation
        - If sections are empty, leave them as empty arrays
        - Focus on relevance and impact for the specific role

        Return only the JSON, no additional text.";
    }

    /**
     * Parse extracted CV data
     */
    private function parseCvData(array $response): array
    {
        // Ensure all required fields have default values
        return array_merge([
            'fullName' => '',
            'jobTitle' => '',
            'email' => '',
            'phoneNumber' => '',
            'address' => '',
            'professionalSummary' => '',
            'workExperience' => [],
            'education' => [],
            'skills' => '',
            'projects' => [],
            'certificates' => [],
            'languages' => [],
            'achievements' => [],
            'references' => []
        ], $response);
    }

    /**
     * Parse tailored CV data
     */
    private function parseTailoredCvData(array $response): array
    {
        return $this->parseCvData($response);
    }

    /**
     * Truncate content to fit within token limits
     * Gemini has a limit of ~1M tokens, so we'll be conservative and limit to ~50K characters
     */
    private function truncateContent(string $content): string
    {
        $maxLength = 50000; // Conservative limit to avoid token issues
        
        if (strlen($content) <= $maxLength) {
            return $content;
        }
        
        // Try to truncate at a reasonable point (end of a sentence or paragraph)
        $truncated = substr($content, 0, $maxLength);
        
        // Find the last complete sentence
        $lastSentenceEnd = max(
            strrpos($truncated, '.'),
            strrpos($truncated, '!'),
            strrpos($truncated, '?')
        );
        
        if ($lastSentenceEnd !== false && $lastSentenceEnd > $maxLength * 0.8) {
            $truncated = substr($truncated, 0, $lastSentenceEnd + 1);
        }
        
        Log::info('Content truncated from ' . strlen($content) . ' to ' . strlen($truncated) . ' characters');
        
        return $truncated . "\n\n[Content truncated due to size limits - only the first part was processed]";
    }

    /**
     * Get API usage statistics (admin only)
     */
    public function getApiStats(): array
    {
        $apiKeys = GeminiApiKey::where('is_active', true)->get();
        
        $totalRequests = $apiKeys->sum('total_requests');
        $usedRequests = $apiKeys->sum('used_requests');
        $availableRequests = $totalRequests - $usedRequests;

        return [
            'total_keys' => $apiKeys->count(),
            'total_requests' => $totalRequests,
            'used_requests' => $usedRequests,
            'available_requests' => $availableRequests,
            'api_keys' => $apiKeys->map(function ($key) {
                return [
                    'id' => $key->id,
                    'name' => $key->name,
                    'remaining_requests' => $key->total_requests - $key->used_requests
                ];
            })
        ];
    }
}