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

            // Sanitize content to ensure valid UTF-8
            $fileContent = $this->sanitizeUtf8Content($fileContent);

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
            // Check if user is authenticated and get their API keys first
            $user = auth('api')->user();
            
            if ($user) {
                $userApiKey = UserApiKey::where('user_id', $user->id)
                    ->where('is_active', true)
                    ->whereRaw('used_requests < max_requests')
                    ->first();

                if ($userApiKey) {
                    Log::info('Using user API key for authenticated user', ['user_id' => $user->id, 'key_id' => $userApiKey->id]);
                    return $userApiKey;
                }
            }

            // Fallback to admin API keys
            $adminApiKey = GeminiApiKey::where('is_active', true)
                ->whereRaw('used_requests < total_requests')
                ->first();
                
            if ($adminApiKey) {
                Log::info('Using admin API key as fallback');
                return $adminApiKey;
            }

            Log::warning('No available API keys found');
            return null;
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

            // Check if user is authenticated and get their API keys first
            $user = auth('api')->user();
            
            if ($user) {
                $stmt = $pdo->prepare("SELECT * FROM user_api_keys WHERE user_id = ? AND is_active = true AND used_requests < max_requests LIMIT 1");
                $stmt->execute([$user->id]);
                $userApiKey = $stmt->fetch(\PDO::FETCH_ASSOC);

                if ($userApiKey) {
                    // Create a simple object that mimics the UserApiKey model
                    $key = new \stdClass();
                    $key->api_key = $userApiKey['api_key'];
                    $key->id = $userApiKey['id'];
                    $key->user_id = $userApiKey['user_id'];
                    $key->name = $userApiKey['name'];
                    $key->is_active = $userApiKey['is_active'];
                    $key->max_requests = $userApiKey['max_requests'];
                    $key->used_requests = $userApiKey['used_requests'];
                    
                    // Add incrementUsage method
                    $key->incrementUsage = function() use ($pdo, $userApiKey) {
                        $stmt = $pdo->prepare("UPDATE user_api_keys SET used_requests = used_requests + 1 WHERE id = ?");
                        $stmt->execute([$userApiKey['id']]);
                    };
                    
                    Log::info('Using user API key via PDO for authenticated user', ['user_id' => $user->id, 'key_id' => $userApiKey['id']]);
                    return $key;
                }
            }

            // Try to get any user API key as fallback
            $stmt = $pdo->prepare("SELECT * FROM user_api_keys WHERE is_active = true AND used_requests < max_requests LIMIT 1");
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
                $key->max_requests = $userApiKey['max_requests'];
                $key->used_requests = $userApiKey['used_requests'];
                
                // Add incrementUsage method
                $key->incrementUsage = function() use ($pdo, $userApiKey) {
                    $stmt = $pdo->prepare("UPDATE user_api_keys SET used_requests = used_requests + 1 WHERE id = ?");
                    $stmt->execute([$userApiKey['id']]);
                };
                
                Log::info('Using user API key via PDO as fallback', ['key_id' => $userApiKey['id']]);
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
                    $fallbackKey = env('FALLBACK_GEMINI_API_KEY', 'AIzaSyDummyKeyForTesting123456789');
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
            Log::info('AI Response Length: ' . strlen($aiResponse));
            Log::info('AI Response Preview: ' . substr($aiResponse, 0, 500) . '...');
            
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
                
                // Try to extract JSON from the response if it's embedded in text
                if (preg_match('/\{.*\}/s', $cleanResponse, $matches)) {
                    Log::info('Attempting to extract JSON from embedded text...');
                    $extractedJson = $matches[0];
                    $parsedData = json_decode($extractedJson, true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        Log::info('Successfully extracted JSON from embedded text');
                    } else {
                        Log::error('Failed to parse extracted JSON: ' . json_last_error_msg());
                        return [];
                    }
                } else {
                    Log::error('No JSON found in response');
                    return [];
                }
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
        return "You are an expert CV parser. Extract and structure ALL information from this {$fileType} CV file.

        CRITICAL PARSING RULES:
        1. Read the ENTIRE document carefully, including all pages
        2. DISTINGUISH between job titles and job descriptions clearly
        3. For work experience: jobTitle = the position/role name, description = what they did/achieved
        4. For education: degree = qualification name, institution = school/university name
        5. For projects: name = project title, description = what the project does/achieved
        6. Look for information in ANY format - headers, bullet points, paragraphs, tables
        7. Extract ALL available information, even if it seems incomplete
        8. If a section has multiple entries, create multiple array items
        9. If dates are in different formats, convert them to YYYY-MM format when possible
        10. If information is missing, leave the field empty or as an empty array
        11. Be thorough - extract everything you can find

        FIELD MAPPING GUIDELINES:
        - Personal Info: Name, Title, Email, Phone, Address
        - Summary/Objective: Professional summary, career objective, profile
        - Work Experience: 
          * jobTitle = Position/Role (e.g., 'Software Engineer', 'Marketing Manager')
          * company = Company name
          * description = Responsibilities, achievements, what they did
          * startDate/endDate = Employment dates
        - Education: 
          * degree = Qualification name (e.g., 'Bachelor of Science', 'MBA')
          * institution = School/University name
          * graduationYear = Year completed
        - Skills: Technical skills, soft skills, tools, technologies (comma-separated)
        - Projects: 
          * name = Project title/name
          * description = What the project does, technologies used, achievements
          * technologies = Technologies/tools used
        - Certificates: Professional certifications, licenses, awards
        - Languages: Spoken languages with proficiency levels
        - Achievements: Awards, recognitions, accomplishments
        - References: Contact information for references

        Return ONLY valid JSON with this exact structure:
        {
            \"fullName\": \"Full Name\",
            \"jobTitle\": \"Current Job Title\",
            \"email\": \"email@example.com\",
            \"phoneNumber\": \"+1234567890\",
            \"address\": \"Full Address\",
            \"professionalSummary\": \"Professional summary paragraph\",
            \"workExperience\": [
                {
                    \"jobTitle\": \"Software Engineer\",
                    \"company\": \"Tech Company Inc\",
                    \"startDate\": \"2020-01\",
                    \"endDate\": \"2023-12\",
                    \"description\": \"Developed web applications using React and Node.js. Led a team of 3 developers. Improved system performance by 40%. Implemented CI/CD pipelines.\"
                },
                {
                    \"jobTitle\": \"Junior Developer\",
                    \"company\": \"StartupXYZ\",
                    \"startDate\": \"2018-06\",
                    \"endDate\": \"2019-12\",
                    \"description\": \"Built responsive websites using HTML, CSS, and JavaScript. Collaborated with design team. Maintained existing codebase.\"
                }
            ],
            \"education\": [
                {
                    \"degree\": \"Bachelor of Science in Computer Science\",
                    \"institution\": \"University of Technology\",
                    \"graduationYear\": \"2018\"
                },
                {
                    \"degree\": \"Master of Business Administration\",
                    \"institution\": \"Business School\",
                    \"graduationYear\": \"2020\"
                }
            ],
            \"skills\": \"JavaScript, React, Node.js, Python, SQL, Git, AWS, Docker\",
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
                    \"credentialId\": \"Credential ID (if available)\",
                    \"url\": \"Certificate URL (if available)\"
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

        CV Content to Parse:
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
        Log::info('Parsing CV data from AI response...');
        Log::info('Response keys: ' . implode(', ', array_keys($response)));
        
        // Ensure all required fields have default values
        $data = array_merge([
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
        
        // Clean up and validate the extracted data
        $data = $this->cleanupExtractedData($data);
        
        // Log what we extracted
        Log::info('Extracted data summary:');
        Log::info('- Full Name: ' . ($data['fullName'] ?: 'Not found'));
        Log::info('- Job Title: ' . ($data['jobTitle'] ?: 'Not found'));
        Log::info('- Email: ' . ($data['email'] ?: 'Not found'));
        Log::info('- Phone: ' . ($data['phoneNumber'] ?: 'Not found'));
        Log::info('- Work Experience entries: ' . count($data['workExperience']));
        Log::info('- Education entries: ' . count($data['education']));
        Log::info('- Skills: ' . ($data['skills'] ?: 'Not found'));
        Log::info('- Projects: ' . count($data['projects']));
        Log::info('- Certificates: ' . count($data['certificates']));
        Log::info('- Languages: ' . count($data['languages']));
        Log::info('- Achievements: ' . count($data['achievements']));
        Log::info('- References: ' . count($data['references']));
        
        // Log work experience details for debugging
        foreach ($data['workExperience'] as $index => $exp) {
            Log::info("Work Experience {$index}: JobTitle='{$exp['jobTitle']}', Company='{$exp['company']}', Description length=" . strlen($exp['description']));
        }
        
        // Sanitize all string values to ensure valid UTF-8
        foreach ($data as $key => $value) {
            if (is_string($value)) {
                $data[$key] = $this->sanitizeUtf8Content($value);
            } elseif (is_array($value)) {
                // Recursively sanitize nested arrays
                $data[$key] = $this->sanitizeArrayValues($value);
            }
        }
        
        return $data;
    }
    
    /**
     * Recursively sanitize all string values in an array
     */
    private function sanitizeArrayValues(array $array): array
    {
        foreach ($array as $key => $value) {
            if (is_string($value)) {
                $array[$key] = $this->sanitizeUtf8Content($value);
            } elseif (is_array($value)) {
                $array[$key] = $this->sanitizeArrayValues($value);
            }
        }
        
        return $array;
    }

    /**
     * Parse tailored CV data
     */
    private function parseTailoredCvData(array $response): array
    {
        return $this->parseCvData($response);
    }

    /**
     * Sanitize content to ensure valid UTF-8 encoding
     * This prevents "Malformed UTF-8 characters" errors during JSON encoding
     */
    private function sanitizeUtf8Content(string $content): string
    {
        // Remove invalid UTF-8 sequences
        $content = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $content);
        
        // Replace common problematic characters
        $content = str_replace([
            "\u{FFFD}", // Unicode replacement character
            "\u{FEFF}", // Zero width no-break space
            "\u{200B}", // Zero width space
            "\u{200C}", // Zero width non-joiner
            "\u{200D}", // Zero width joiner
            "\u{2028}", // Line separator
            "\u{2029}"  // Paragraph separator
        ], '', $content);
        
        // Ensure the content is valid UTF-8
        if (!mb_check_encoding($content, 'UTF-8')) {
            // Try to convert from other common encodings
            foreach (['ISO-8859-1', 'Windows-1252'] as $encoding) {
                $converted = @mb_convert_encoding($content, 'UTF-8', $encoding);
                if (mb_check_encoding($converted, 'UTF-8')) {
                    $content = $converted;
                    break;
                }
            }
            
            // If still not valid UTF-8, force encode as UTF-8
            if (!mb_check_encoding($content, 'UTF-8')) {
                $content = mb_convert_encoding($content, 'UTF-8', 'UTF-8');
            }
        }
        
        // Final cleanup - replace any remaining invalid characters
        $content = mb_convert_encoding($content, 'UTF-8', 'UTF-8');
        
        return $content;
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
    
    /**
     * Clean up and validate extracted CV data
     */
    private function cleanupExtractedData(array $data): array
    {
        // Clean up work experience
        if (isset($data['workExperience']) && is_array($data['workExperience'])) {
            $cleanedWorkExp = [];
            foreach ($data['workExperience'] as $exp) {
                if (!is_array($exp)) continue;
                
                $cleanedExp = [
                    'jobTitle' => $this->cleanString($exp['jobTitle'] ?? ''),
                    'company' => $this->cleanString($exp['company'] ?? ''),
                    'startDate' => $this->cleanString($exp['startDate'] ?? ''),
                    'endDate' => $this->cleanString($exp['endDate'] ?? ''),
                    'description' => $this->cleanString($exp['description'] ?? '')
                ];
                
                // Only add if we have at least a job title or company
                if (!empty($cleanedExp['jobTitle']) || !empty($cleanedExp['company'])) {
                    $cleanedWorkExp[] = $cleanedExp;
                }
            }
            $data['workExperience'] = $cleanedWorkExp;
        }
        
        // Clean up education
        if (isset($data['education']) && is_array($data['education'])) {
            $cleanedEducation = [];
            foreach ($data['education'] as $edu) {
                if (!is_array($edu)) continue;
                
                $cleanedEdu = [
                    'degree' => $this->cleanString($edu['degree'] ?? ''),
                    'institution' => $this->cleanString($edu['institution'] ?? ''),
                    'graduationYear' => $this->cleanString($edu['graduationYear'] ?? '')
                ];
                
                // Only add if we have at least a degree or institution
                if (!empty($cleanedEdu['degree']) || !empty($cleanedEdu['institution'])) {
                    $cleanedEducation[] = $cleanedEdu;
                }
            }
            $data['education'] = $cleanedEducation;
        }
        
        // Clean up projects
        if (isset($data['projects']) && is_array($data['projects'])) {
            $cleanedProjects = [];
            foreach ($data['projects'] as $project) {
                if (!is_array($project)) continue;
                
                $cleanedProject = [
                    'name' => $this->cleanString($project['name'] ?? ''),
                    'description' => $this->cleanString($project['description'] ?? ''),
                    'technologies' => $this->cleanString($project['technologies'] ?? ''),
                    'url' => $this->cleanString($project['url'] ?? ''),
                    'startDate' => $this->cleanString($project['startDate'] ?? ''),
                    'endDate' => $this->cleanString($project['endDate'] ?? '')
                ];
                
                // Only add if we have at least a name or description
                if (!empty($cleanedProject['name']) || !empty($cleanedProject['description'])) {
                    $cleanedProjects[] = $cleanedProject;
                }
            }
            $data['projects'] = $cleanedProjects;
        }
        
        // Clean up other array fields
        $arrayFields = ['certificates', 'languages', 'achievements', 'references'];
        foreach ($arrayFields as $field) {
            if (isset($data[$field]) && is_array($data[$field])) {
                $cleanedArray = [];
                foreach ($data[$field] as $item) {
                    if (is_array($item)) {
                        $cleanedItem = [];
                        foreach ($item as $key => $value) {
                            $cleanedItem[$key] = $this->cleanString($value);
                        }
                        // Only add if at least one field has content
                        if (!empty(array_filter($cleanedItem))) {
                            $cleanedArray[] = $cleanedItem;
                        }
                    }
                }
                $data[$field] = $cleanedArray;
            }
        }
        
        // Clean up string fields
        $stringFields = ['fullName', 'jobTitle', 'email', 'phoneNumber', 'address', 'professionalSummary', 'skills'];
        foreach ($stringFields as $field) {
            if (isset($data[$field])) {
                $data[$field] = $this->cleanString($data[$field]);
            }
        }
        
        return $data;
    }
    
    /**
     * Clean a string value
     */
    private function cleanString($value): string
    {
        if (!is_string($value)) {
            return '';
        }
        
        // Remove extra whitespace
        $value = trim($value);
        
        // Remove common artifacts
        $value = preg_replace('/\s+/', ' ', $value);
        
        // Remove empty or very short values that are likely errors
        if (strlen($value) < 2) {
            return '';
        }
        
        return $value;
    }
}