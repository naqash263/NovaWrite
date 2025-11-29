<?php

namespace App\Services;

use App\Models\GeminiApiKey;
use App\Models\UserApiKey;
use Illuminate\Support\Facades\Log;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

class CareerAiService
{
    private $client;

    public function __construct()
    {
        $this->client = new Client();
    }

    /**
     * Analyze LinkedIn profile and provide optimization recommendations
     */
    public function analyzeLinkedInProfile(array $profileData, $apiKey = null): array
    {
        try {
            if (!$apiKey) {
                $apiKey = $this->getAvailableApiKey();
            }
            
            if (!$apiKey) {
                throw new \Exception('No available API keys');
            }

            $prompt = $this->buildLinkedInAnalysisPrompt($profileData);
            $response = $this->callGeminiApi($apiKey, $prompt);

            return $this->parseLinkedInAnalysis($response);
        } catch (\Exception $e) {
            Log::error('LinkedIn analysis failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Generate cover letter using AI
     */
    public function generateCoverLetter(array $formData, $apiKey = null): array
    {
        try {
            if (!$apiKey) {
                $apiKey = $this->getAvailableApiKey();
            }
            
            if (!$apiKey) {
                throw new \Exception('No available API keys');
            }

            $prompt = $this->buildCoverLetterPrompt($formData);
            $response = $this->callGeminiApi($apiKey, $prompt);

            return $this->parseCoverLetterResponse($response);
        } catch (\Exception $e) {
            Log::error('Cover letter generation failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Generate interview preparation plan
     */
    public function generateInterviewPrep(array $formData, $apiKey = null): array
    {
        try {
            if (!$apiKey) {
                $apiKey = $this->getAvailableApiKey();
            }
            
            if (!$apiKey) {
                throw new \Exception('No available API keys');
            }

            $prompt = $this->buildInterviewPrepPrompt($formData);
            $response = $this->callGeminiApi($apiKey, $prompt);

            return $this->parseInterviewPrepResponse($response);
        } catch (\Exception $e) {
            Log::error('Interview prep generation failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Generate salary negotiation strategy
     */
    public function generateSalaryNegotiation(array $formData, $apiKey = null): array
    {
        try {
            if (!$apiKey) {
                $apiKey = $this->getAvailableApiKey();
            }
            
            if (!$apiKey) {
                throw new \Exception('No available API keys');
            }

            $prompt = $this->buildSalaryNegotiationPrompt($formData);
            $response = $this->callGeminiApi($apiKey, $prompt);

            return $this->parseSalaryNegotiationResponse($response);
        } catch (\Exception $e) {
            Log::error('Salary negotiation generation failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Generate skills assessment
     */
    public function generateSkillsAssessment(array $formData, $apiKey = null): array
    {
        try {
            if (!$apiKey) {
                $apiKey = $this->getAvailableApiKey();
            }
            
            if (!$apiKey) {
                throw new \Exception('No available API keys');
            }

            $prompt = $this->buildSkillsAssessmentPrompt($formData);
            $response = $this->callGeminiApi($apiKey, $prompt);

            return $this->parseSkillsAssessmentResponse($response);
        } catch (\Exception $e) {
            Log::error('Skills assessment generation failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Generate career path plan
     */
    public function generateCareerPath(array $formData, $apiKey = null): array
    {
        try {
            if (!$apiKey) {
                $apiKey = $this->getAvailableApiKey();
            }
            
            if (!$apiKey) {
                throw new \Exception('No available API keys');
            }

            $prompt = $this->buildCareerPathPrompt($formData);
            $response = $this->callGeminiApi($apiKey, $prompt);

            return $this->parseCareerPathResponse($response);
        } catch (\Exception $e) {
            Log::error('Career path generation failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Generate job search optimization strategy
     */
    public function generateJobSearchStrategy(array $formData, $apiKey = null): array
    {
        try {
            if (!$apiKey) {
                $apiKey = $this->getAvailableApiKey();
            }
            
            if (!$apiKey) {
                throw new \Exception('No available API keys');
            }

            $prompt = $this->buildJobSearchPrompt($formData);
            $response = $this->callGeminiApi($apiKey, $prompt);

            return $this->parseJobSearchResponse($response);
        } catch (\Exception $e) {
            Log::error('Job search strategy generation failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get an available API key
     */
    private function getAvailableApiKey()
    {
        try {
            // Try to get authenticated user (optional)
            $user = null;
            try {
                $user = auth('api')->user();
            } catch (\Exception $e) {
                // User not authenticated, continue with public access
                Log::info('No authenticated user, using public API access');
            }
            
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

            // Try to get authenticated user (optional)
            $user = null;
            try {
                $user = auth('api')->user();
            } catch (\Exception $e) {
                // User not authenticated, continue with public access
                Log::info('No authenticated user in PDO method, using public API access');
            }
            
            if ($user) {
                $stmt = $pdo->prepare("SELECT * FROM user_api_keys WHERE user_id = ? AND is_active = true AND used_requests < max_requests LIMIT 1");
                $stmt->execute([$user->id]);
                $userApiKey = $stmt->fetch(\PDO::FETCH_ASSOC);

                if ($userApiKey) {
                    return $this->createApiKeyObject($userApiKey, $pdo, 'user');
                }
            }

            // Try to get any user API key as fallback
            $stmt = $pdo->prepare("SELECT * FROM user_api_keys WHERE is_active = true AND used_requests < max_requests LIMIT 1");
            $stmt->execute();
            $userApiKey = $stmt->fetch(\PDO::FETCH_ASSOC);

            if ($userApiKey) {
                return $this->createApiKeyObject($userApiKey, $pdo, 'user');
            }

            // Fallback to admin API keys
            $stmt = $pdo->prepare("SELECT * FROM gemini_api_keys WHERE is_active = true AND used_requests < total_requests LIMIT 1");
            $stmt->execute();
            $adminApiKey = $stmt->fetch(\PDO::FETCH_ASSOC);

            if ($adminApiKey) {
                return $this->createApiKeyObject($adminApiKey, $pdo, 'admin');
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Direct PDO connection also failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Create API key object for PDO results
     */
    private function createApiKeyObject(array $keyData, $pdo, string $type)
    {
        $key = new \stdClass();
        $key->api_key = $keyData['api_key'];
        $key->id = $keyData['id'];
        $key->is_active = $keyData['is_active'];
        
        if ($type === 'user') {
            $key->user_id = $keyData['user_id'];
            $key->name = $keyData['name'];
            $key->max_requests = $keyData['max_requests'];
            $key->used_requests = $keyData['used_requests'];
            
            $key->incrementUsage = function() use ($pdo, $keyData) {
                $stmt = $pdo->prepare("UPDATE user_api_keys SET used_requests = used_requests + 1 WHERE id = ?");
                $stmt->execute([$keyData['id']]);
            };
        } else {
            $key->name = $keyData['name'];
            $key->total_requests = $keyData['total_requests'];
            $key->used_requests = $keyData['used_requests'];
            
            $key->incrementUsage = function() use ($pdo, $keyData) {
                $stmt = $pdo->prepare("UPDATE gemini_api_keys SET used_requests = used_requests + 1 WHERE id = ?");
                $stmt->execute([$keyData['id']]);
            };
        }
        
        return $key;
    }

    /**
     * Call Gemini API
     */
    public function callGeminiApi($apiKey, string $prompt): mixed
    {
        try {
            // Get the actual API key value
            if ($apiKey instanceof UserApiKey) {
                $apiKeyValue = $apiKey->api_key;
            } elseif ($apiKey instanceof GeminiApiKey) {
                try {
                    $firstDecrypt = decrypt($apiKey->getRawOriginal('api_key'));
                    if (strpos($firstDecrypt, 'AIza') === 0) {
                        $apiKeyValue = $firstDecrypt;
                    } else {
                        $apiKeyValue = decrypt($firstDecrypt);
                    }
                } catch (\Exception $e) {
                    Log::error('Failed to decrypt Gemini API key: ' . $e->getMessage());
                    $fallbackKey = env('FALLBACK_GEMINI_API_KEY', 'AIzaSyDummyKeyForTesting123456789');
                    if ($fallbackKey && strpos($fallbackKey, 'AIza') === 0) {
                        Log::warning('Using fallback API key due to decryption failure');
                        $apiKeyValue = $fallbackKey;
                    } else {
                        throw new \Exception('Failed to decrypt API key and no fallback available. Please contact support.');
                    }
                }
            } else {
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
                        'temperature' => 0.7,
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
            
            // Clean the response - remove markdown code blocks if present
            $cleanResponse = $aiResponse;
            if (strpos($aiResponse, '```json') !== false) {
                $cleanResponse = preg_replace('/```json\s*/', '', $aiResponse);
                $cleanResponse = preg_replace('/\s*```/', '', $cleanResponse);
            } elseif (strpos($aiResponse, '```') !== false) {
                // Remove any code blocks
                $cleanResponse = preg_replace('/```[a-z]*\s*/', '', $aiResponse);
                $cleanResponse = preg_replace('/\s*```/', '', $cleanResponse);
            }
            
            // Try to parse as JSON first
            $parsedData = json_decode(trim($cleanResponse), true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($parsedData)) {
                return $parsedData;
            }
            
            // If not JSON, try to extract JSON from the response if it's embedded in text
            if (preg_match('/\{.*\}/s', $cleanResponse, $matches)) {
                Log::info('Attempting to extract JSON from embedded text...');
                $extractedJson = $matches[0];
                $parsedData = json_decode($extractedJson, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($parsedData)) {
                    Log::info('Successfully extracted JSON from embedded text');
                    return $parsedData;
                }
            }
            
            // If all JSON parsing fails, return the clean response as string
            Log::info('Returning response as string (not JSON)');
            return trim($cleanResponse);
        } catch (RequestException $e) {
            Log::error('Gemini API request failed: ' . $e->getMessage());
            
            $response = $e->getResponse();
            if ($response) {
                $errorBody = $response->getBody()->getContents();
                $errorData = json_decode($errorBody, true);
                
                if (isset($errorData['error']['message'])) {
                    $errorMessage = $errorData['error']['message'];
                    
                    if (strpos($errorMessage, 'token count') !== false) {
                        throw new \Exception('Input is too large. Please try with shorter content.');
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

    // Prompt building methods
    private function buildLinkedInAnalysisPrompt(array $profileData): string
    {
        $profileJson = json_encode($profileData, JSON_PRETTY_PRINT);
        
        return "Analyze this LinkedIn profile and provide optimization recommendations. Return a JSON response with the following structure:

{
    \"headlineScore\": 85,
    \"summaryScore\": 70,
    \"skillsScore\": 90,
    \"overallScore\": 82,
    \"recommendations\": [
        {
            \"category\": \"Headline\",
            \"priority\": \"High\",
            \"current\": \"Current headline text\",
            \"suggestion\": \"Improved headline text\",
            \"reason\": \"Why this change will help\"
        }
    ],
    \"strengths\": [
        \"Strong technical skills\",
        \"Good experience diversity\"
    ],
    \"weaknesses\": [
        \"Missing keywords\",
        \"Unclear value proposition\"
    ],
    \"keywordSuggestions\": [
        \"React\",
        \"Node.js\",
        \"Leadership\"
    ]
}

Profile Data:
{$profileJson}

Focus on:
1. Headline optimization for better visibility
2. Summary improvement for engagement
3. Skills section enhancement
4. Keyword optimization for ATS
5. Professional branding consistency
6. Industry-specific recommendations

Return only valid JSON, no additional text.";
    }

    private function buildCoverLetterPrompt(array $formData): string
    {
        $formJson = json_encode($formData, JSON_PRETTY_PRINT);
        
        return "Generate a professional, ATS-friendly cover letter based on the provided information. Return a JSON response with the following structure:

{
    \"content\": \"Dear Hiring Manager,\n\n[Generated cover letter content]\n\nSincerely,\n[Name]\",
    \"atsScore\": 92,
    \"keywordDensity\": {
        \"technical\": 15,
        \"leadership\": 8,
        \"achievement\": 12
    },
    \"suggestions\": [
        \"Consider adding more specific metrics\",
        \"Include relevant industry keywords\"
    ],
    \"tone\": \"Professional and confident\",
    \"length\": \"Appropriate for the role\"
}

Form Data:
{$formJson}

Requirements:
1. Professional and engaging tone
2. ATS-friendly format
3. Include relevant keywords from job description
4. Highlight relevant experience and achievements
5. Show enthusiasm for the role
6. Keep it concise but impactful
7. Use specific examples and metrics when possible

Return only valid JSON, no additional text.";
    }

    private function buildInterviewPrepPrompt(array $formData): string
    {
        $formJson = json_encode($formData, JSON_PRETTY_PRINT);
        
        return "Generate a comprehensive interview preparation plan based on the provided information. Return a JSON response with the following structure:

{
    \"practiceQuestions\": [
        {
            \"category\": \"Behavioral\",
            \"question\": \"Tell me about a time when you had to work under pressure.\",
            \"difficulty\": \"Medium\",
            \"tips\": \"Use the STAR method: Situation, Task, Action, Result\",
            \"sampleAnswer\": \"In my previous role as a software engineer...\"
        }
    ],
    \"companyResearch\": {
        \"keyPoints\": [
            \"Founded in 2010, 500+ employees\",
            \"Focus on AI and machine learning\"
        ],
        \"culture\": \"Innovative and collaborative\",
        \"recentNews\": \"Recent funding round of $50M\"
    },
    \"technicalPrep\": [
        {
            \"topic\": \"Data Structures\",
            \"importance\": \"High\",
            \"resources\": [\"LeetCode problems\", \"System design basics\"]
        }
    ],
    \"questionsToAsk\": [
        \"What does success look like in this role?\",
        \"How do you measure team performance?\"
    ],
    \"confidenceTips\": [
        \"Practice your elevator pitch\",
        \"Prepare specific examples\"
    ]
}

Form Data:
{$formJson}

Focus on:
1. Role-specific questions
2. Industry-relevant scenarios
3. Technical skills assessment
4. Behavioral questions using STAR method
5. Company culture alignment
6. Questions to ask the interviewer

Return only valid JSON, no additional text.";
    }

    private function buildSalaryNegotiationPrompt(array $formData): string
    {
        $formJson = json_encode($formData, JSON_PRETTY_PRINT);
        
        return "Generate a comprehensive salary negotiation strategy based on the provided information. Return a JSON response with the following structure:

{
    \"marketSalary\": {
        \"min\": 75000,
        \"max\": 95000,
        \"median\": 85000,
        \"source\": \"Based on industry data and location\"
    },
    \"negotiationRange\": {
        \"minimum\": 80000,
        \"target\": 90000,
        \"maximum\": 100000
    },
    \"strategy\": {
        \"approach\": \"Collaborative\",
        \"timing\": \"After offer is made\",
        \"keyPoints\": [
            \"Highlight unique value proposition\",
            \"Reference market research\"
        ]
    },
    \"scripts\": [
        {
            \"situation\": \"Initial offer is below target\",
            \"script\": \"I'm excited about this opportunity. Based on my research and experience...\"
        }
    ],
    \"benefits\": [
        \"Flexible working hours\",
        \"Professional development budget\"
    ],
    \"fallbackOptions\": [
        \"Signing bonus\",
        \"Additional vacation days\"
    ]
}

Form Data:
{$formJson}

Consider:
1. Industry standards and location
2. Experience level and skills
3. Company size and stage
4. Market conditions
5. Alternative compensation options
6. Negotiation timing and approach

Return only valid JSON, no additional text.";
    }

    private function buildSkillsAssessmentPrompt(array $formData): string
    {
        $formJson = json_encode($formData, JSON_PRETTY_PRINT);
        
        return "Conduct a comprehensive, industry-agnostic skills assessment based on the provided information. This assessment should work for ANY career field - not just technology. Return a JSON response with the following structure:

{
    \"overallScore\": 78,
    \"categoryScores\": {
        \"Technical Skills\": 85,
        \"Soft Skills\": 70,
        \"Industry-Specific Skills\": 75,
        \"Leadership & Management\": 80,
        \"Communication\": 85,
        \"Problem Solving\": 75,
        \"Adaptability\": 70
    },
    \"strengths\": [
        {
            \"skill\": \"Project Management\",
            \"level\": \"Advanced\",
            \"score\": 90,
            \"evidence\": \"Led 5+ successful projects, certified in PMP\"
        }
    ],
    \"weaknesses\": [
        {
            \"skill\": \"Public Speaking\",
            \"currentLevel\": \"Beginner\",
            \"score\": 30,
            \"improvement\": \"Join Toastmasters, practice presentations, take communication courses\"
        }
    ],
    \"recommendations\": [
        {
            \"category\": \"Technical Skills\",
            \"skills\": [
                {
                    \"name\": \"Data Analysis\",
                    \"priority\": \"High\",
                    \"currentLevel\": \"Intermediate\",
                    \"targetLevel\": \"Advanced\",
                    \"action\": \"Complete advanced Excel and SQL courses\",
                    \"timeline\": \"3 months\",
                    \"resources\": [\"Coursera Data Analysis course\", \"Practice with real datasets\", \"Join data analysis community\"]
                }
            ]
        }
    ],
    \"learningPath\": [
        {
            \"phase\": \"Immediate (1-3 months)\",
            \"title\": \"Foundation Building\",
            \"focus\": \"Strengthen core competencies and address critical gaps\",
            \"skills\": [\"Data Analysis\", \"Presentation Skills\"],
            \"activities\": [
                \"Complete online courses in identified weak areas\",
                \"Practice skills through real-world projects\",
                \"Join professional groups and communities\"
            ],
            \"resources\": [\"Online courses\", \"Professional workshops\", \"Mentorship programs\"],
            \"timeline\": \"3 months\"
        },
        {
            \"phase\": \"Intermediate (3-6 months)\",
            \"title\": \"Skill Development\",
            \"focus\": \"Build advanced competencies and industry-specific knowledge\",
            \"skills\": [\"Advanced Excel\", \"Leadership\", \"Industry Certifications\"],
            \"activities\": [
                \"Pursue relevant certifications\",
                \"Take on leadership roles in projects\",
                \"Network with industry professionals\"
            ],
            \"resources\": [\"Certification programs\", \"Leadership training\", \"Industry conferences\"],
            \"timeline\": \"3 months\"
        },
        {
            \"phase\": \"Advanced (6-12 months)\",
            \"title\": \"Mastery & Specialization\",
            \"focus\": \"Achieve expert-level skills and career advancement\",
            \"skills\": [\"Strategic Thinking\", \"Advanced Analytics\", \"Team Management\"],
            \"activities\": [
                \"Lead major projects or initiatives\",
                \"Mentor junior colleagues\",
                \"Present at industry events\"
            ],
            \"resources\": [\"Executive education\", \"Professional coaching\", \"Industry publications\"],
            \"timeline\": \"6 months\"
        }
    ],
    \"careerAlignment\": {
        \"overallMatch\": 85,
        \"recommendedRoles\": [
            {
                \"title\": \"Senior Project Manager\",
                \"match\": 90,
                \"requiredSkills\": [\"Project Management\", \"Leadership\", \"Communication\"],
                \"missingSkills\": [\"Advanced Analytics\", \"Strategic Planning\"],
                \"salaryRange\": \"$80,000 - $120,000\",
                \"nextSteps\": [\"Get PMP certification\", \"Lead cross-functional projects\", \"Develop analytics skills\"]
            }
        ],
        \"skillGaps\": [\"Advanced Analytics\", \"Strategic Planning\", \"Digital Transformation\"],
        \"suggestions\": [\"Learn data visualization tools\", \"Study business strategy\", \"Understand digital trends in your industry\"],
        \"marketDemand\": \"High demand for project management and leadership skills across all industries\"
    },
    \"industryInsights\": {
        \"trendingSkills\": [\"Digital Literacy\", \"Remote Work Management\", \"Data-Driven Decision Making\", \"Sustainability\", \"Customer Experience\"],
        \"emergingRoles\": [\"Digital Transformation Specialist\", \"Remote Team Manager\", \"Data Analyst\", \"Sustainability Coordinator\"],
        \"salaryGrowth\": \"Project management roles show 15-20% salary growth potential\",
        \"jobMarket\": \"Strong demand across healthcare, finance, technology, and consulting sectors\"
    }
}

Form Data:
{$formJson}

IMPORTANT: This assessment should work for ANY industry and career field. Consider:
1. Industry-specific skills and requirements
2. Soft skills that are valuable across all fields
3. Leadership and management capabilities
4. Communication and interpersonal skills
5. Problem-solving and critical thinking
6. Adaptability and continuous learning
7. Technical skills relevant to the specific industry
8. Career advancement opportunities in that field
9. Market demand and salary potential
10. Emerging trends and future skills needed

Provide realistic, actionable recommendations that apply to the user's specific industry and career level. Focus on skills that will genuinely help them advance in their chosen field, whether that's healthcare, education, finance, marketing, sales, operations, legal, or any other profession.

Return only valid JSON, no additional text.";
    }

    private function buildCareerPathPrompt(array $formData): string
    {
        $formJson = json_encode($formData, JSON_PRETTY_PRINT);
        
        return "Generate a personalized career path plan based on the provided information. Return a JSON response with the following structure:

{
    \"careerPaths\": [
        {
            \"title\": \"Technical Leadership Track\",
            \"description\": \"Progress from Senior Developer to Tech Lead, Engineering Manager, and CTO\",
            \"timeline\": \"3-5 years\",
            \"probability\": \"High\",
            \"skills\": [\"Leadership\", \"System Architecture\", \"Team Management\"],
            \"nextSteps\": [
                \"Take on team lead responsibilities\",
                \"Complete leadership training\"
            ],
            \"salary\": {
                \"current\": 95000,
                \"next\": 120000,
                \"future\": 180000
            }
        }
    ],
    \"skillGaps\": [
        {
            \"skill\": \"Project Management\",
            \"importance\": \"High\",
            \"action\": \"Get PMP certification\",
            \"timeline\": \"6 months\"
        }
    ],
    \"networking\": [
        {
            \"activity\": \"Join professional associations\",
            \"timeline\": \"Immediate\",
            \"benefit\": \"Industry connections\"
        }
    ],
    \"education\": [
        {
            \"type\": \"Certification\",
            \"name\": \"AWS Solutions Architect\",
            \"timeline\": \"3 months\",
            \"cost\": \"$300\"
        }
    ],
    \"milestones\": [
        {
            \"milestone\": \"Lead first major project\",
            \"timeline\": \"6 months\",
            \"success\": \"Project delivered on time and budget\"
        }
    ]
}

Form Data:
{$formJson}

Consider:
1. Current skills and experience
2. Career goals and aspirations
3. Industry trends and opportunities
4. Skill development needs
5. Networking requirements
6. Education and certification needs
7. Realistic timelines and milestones

Return only valid JSON, no additional text.";
    }

    private function buildJobSearchPrompt(array $formData): string
    {
        $formJson = json_encode($formData, JSON_PRETTY_PRINT);
        
        return "Generate a comprehensive job search optimization strategy based on the provided information. Return a JSON response with the following structure:

{
    \"jobRecommendations\": [
        {
            \"title\": \"Senior Software Engineer\",
            \"company\": \"TechCorp Inc.\",
            \"location\": \"San Francisco, CA\",
            \"salary\": \"$120,000 - $150,000\",
            \"match\": \"95%\",
            \"description\": \"Full-stack development role with React and Node.js\",
            \"whyMatch\": \"Strong match for your React and JavaScript skills\",
            \"applicationTips\": [
                \"Highlight your 5+ years of experience\",
                \"Emphasize your leadership experience\"
            ]
        }
    ],
    \"searchStrategy\": {
        \"keywords\": [\"React\", \"Node.js\", \"Full-stack\"],
        \"jobBoards\": [\"LinkedIn\", \"Indeed\", \"AngelList\"],
        \"networking\": [\"Tech meetups\", \"Industry conferences\"]
    },
    \"applicationOptimization\": {
        \"resumeTips\": [
            \"Use ATS-friendly format\",
            \"Include relevant keywords\"
        ],
        \"coverLetterTips\": [
            \"Customize for each application\",
            \"Highlight specific achievements\"
        ]
    },
    \"interviewPrep\": {
        \"commonQuestions\": [
            \"Tell me about yourself\",
            \"Why do you want to work here?\"
        ],
        \"technicalFocus\": [\"System design\", \"Coding challenges\"]
    },
    \"networkingStrategy\": {
        \"online\": [\"LinkedIn outreach\", \"Professional groups\"],
        \"offline\": [\"Industry events\", \"Coffee meetings\"]
    }
}

Form Data:
{$formJson}

Focus on:
1. Role and industry matching
2. Location and salary expectations
3. Skill alignment
4. Application optimization
5. Networking strategies
6. Interview preparation
7. Market research and trends

Return only valid JSON, no additional text.";
    }

    // Response parsing methods
    private function parseLinkedInAnalysis(array $response): array
    {
        // If response is empty or invalid, return default structure
        if (empty($response) || !is_array($response)) {
            return [
                'headlineScore' => 75,
                'summaryScore' => 70,
                'skillsScore' => 80,
                'overallScore' => 75,
                'recommendations' => [
                    [
                        'category' => 'Headline',
                        'priority' => 'High',
                        'suggestion' => 'Add more specific keywords and industry terms to improve search visibility.',
                        'example' => 'Include your primary skill and industry in your headline'
                    ],
                    [
                        'category' => 'Summary',
                        'priority' => 'Medium',
                        'suggestion' => 'Add more quantifiable achievements and specific examples.',
                        'example' => 'Include metrics and specific accomplishments'
                    ],
                    [
                        'category' => 'Skills',
                        'priority' => 'High',
                        'suggestion' => 'Include trending skills relevant to your industry.',
                        'example' => 'Add 5-10 more relevant skills to your profile'
                    ]
                ],
                'profileStrengths' => [
                    'Good use of professional language',
                    'Clear career focus',
                    'Relevant skills listed'
                ],
                'areasForImprovement' => [
                    'Could use more specific achievements',
                    'Missing some trending keywords',
                    'Summary could be more detailed'
                ],
                'keywordSuggestions' => [
                    'Digital Transformation',
                    'Project Management',
                    'Team Leadership',
                    'Strategic Planning',
                    'Process Improvement'
                ],
                'industryKeywords' => [
                    'Technology Sales',
                    'SaaS Solutions',
                    'Cloud Computing',
                    'Digital Innovation',
                    'Business Development'
                ]
            ];
        }

        // Map AI response fields to frontend interface
        $mappedResponse = [
            'headlineScore' => $response['headlineScore'] ?? 0,
            'summaryScore' => $response['summaryScore'] ?? 0,
            'skillsScore' => $response['skillsScore'] ?? 0,
            'overallScore' => $response['overallScore'] ?? 0,
            'recommendations' => $this->mapRecommendations($response['recommendations'] ?? []),
            'profileStrengths' => $response['strengths'] ?? $response['profileStrengths'] ?? [],
            'areasForImprovement' => $response['weaknesses'] ?? $response['areasForImprovement'] ?? [],
            'keywordSuggestions' => $response['keywordSuggestions'] ?? [],
            'industryKeywords' => $response['industryKeywords'] ?? []
        ];

        return $mappedResponse;
    }

    /**
     * Map AI recommendations to frontend interface
     */
    private function mapRecommendations(array $recommendations): array
    {
        return array_map(function($rec) {
            return [
                'category' => $rec['category'] ?? 'General',
                'priority' => $rec['priority'] ?? 'Medium',
                'suggestion' => $rec['suggestion'] ?? $rec['description'] ?? $rec['reason'] ?? 'No suggestion available',
                'example' => $rec['example'] ?? $rec['action'] ?? $rec['current'] ?? 'No example available'
            ];
        }, $recommendations);
    }

    private function parseCoverLetterResponse(array $response): array
    {
        return array_merge([
            'content' => '',
            'atsScore' => 0,
            'keywordDensity' => [],
            'suggestions' => [],
            'tone' => '',
            'length' => ''
        ], $response);
    }

    private function parseInterviewPrepResponse(array $response): array
    {
        return array_merge([
            'practiceQuestions' => [],
            'companyResearch' => [],
            'technicalPrep' => [],
            'questionsToAsk' => [],
            'confidenceTips' => []
        ], $response);
    }

    private function parseSalaryNegotiationResponse(array $response): array
    {
        return array_merge([
            'marketSalary' => [],
            'negotiationRange' => [],
            'strategy' => [],
            'scripts' => [],
            'benefits' => [],
            'fallbackOptions' => []
        ], $response);
    }

    private function parseSkillsAssessmentResponse(array $response): array
    {
        return array_merge([
            'overallScore' => 0,
            'categoryScores' => [],
            'strengths' => [],
            'weaknesses' => [],
            'recommendations' => [],
            'learningPath' => [],
            'careerAlignment' => []
        ], $response);
    }

    private function parseCareerPathResponse(array $response): array
    {
        return array_merge([
            'careerPaths' => [],
            'skillGaps' => [],
            'networking' => [],
            'education' => [],
            'milestones' => []
        ], $response);
    }

    private function parseJobSearchResponse(array $response): array
    {
        // If response is empty or invalid, return default structure
        if (empty($response) || !is_array($response)) {
            return [
                'jobRecommendations' => [
                    [
                        'title' => 'Senior Software Engineer',
                        'company' => 'Tech Solutions Inc',
                        'location' => 'Remote',
                        'salary' => '$90,000 - $120,000',
                        'match' => '85%',
                        'description' => 'Full-stack development role with modern technologies',
                        'whyMatch' => 'Strong match for your JavaScript and React skills',
                        'applicationTips' => [
                            'Highlight your technical skills in the resume',
                            'Emphasize your remote work experience',
                            'Include specific project examples'
                        ]
                    ],
                    [
                        'title' => 'Frontend Developer',
                        'company' => 'Digital Agency',
                        'location' => 'Hybrid',
                        'salary' => '$80,000 - $100,000',
                        'match' => '90%',
                        'description' => 'React and modern frontend development',
                        'whyMatch' => 'Perfect match for your React and JavaScript expertise',
                        'applicationTips' => [
                            'Showcase your portfolio projects',
                            'Demonstrate responsive design skills',
                            'Highlight your team collaboration experience'
                        ]
                    ]
                ],
                'searchStrategy' => [
                    'keywords' => ['JavaScript', 'React', 'Node.js', 'Full-stack', 'Remote'],
                    'platforms' => ['LinkedIn', 'Indeed', 'AngelList', 'Remote.co'],
                    'timing' => 'Apply on Tuesday-Thursday mornings for best results',
                    'frequency' => 'Apply to 5-10 jobs per week for optimal results'
                ],
                'applicationOptimization' => [
                    'resumeTips' => [
                        'Use ATS-friendly format with clear sections',
                        'Include relevant keywords from job descriptions',
                        'Quantify your achievements with specific numbers',
                        'Keep it to 1-2 pages maximum'
                    ],
                    'coverLetterTips' => [
                        'Customize each cover letter for the specific role',
                        'Highlight specific achievements relevant to the job',
                        'Show enthusiasm for the company and role',
                        'Keep it concise and professional'
                    ],
                    'portfolioTips' => [
                        'Include 3-5 best projects with live demos',
                        'Write clear project descriptions',
                        'Show your problem-solving process',
                        'Include testimonials or recommendations'
                    ]
                ],
                'networkingStrategy' => [
                    'online' => [
                        'Optimize your LinkedIn profile with keywords',
                        'Join relevant professional groups',
                        'Engage with industry content regularly',
                        'Reach out to professionals in your field'
                    ],
                    'offline' => [
                        'Attend local tech meetups and conferences',
                        'Participate in hackathons and coding events',
                        'Join professional associations',
                        'Volunteer for tech-related causes'
                    ],
                    'informationalInterviews' => [
                        'Research companies and roles you\'re interested in',
                        'Prepare thoughtful questions about the industry',
                        'Follow up with thank you notes',
                        'Maintain relationships over time'
                    ]
                ],
                'interviewPreparation' => [
                    'commonQuestions' => [
                        'Tell me about yourself',
                        'Why do you want to work here?',
                        'What are your strengths and weaknesses?',
                        'Where do you see yourself in 5 years?',
                        'Why are you leaving your current role?'
                    ],
                    'technicalQuestions' => [
                        'Explain a complex project you worked on',
                        'How do you handle debugging and problem-solving?',
                        'Describe your experience with version control',
                        'How do you ensure code quality?',
                        'What\'s your approach to testing?'
                    ]
                ],
                'salaryNegotiation' => [
                    'research' => 'Research market rates for your role and location',
                    'timing' => 'Wait for the offer before discussing salary',
                    'approach' => 'Focus on value and market rates, not personal needs',
                    'alternatives' => 'Consider total compensation package, not just salary'
                ]
            ];
        }

        // Map AI response fields to frontend interface
        $mappedResponse = [
            'jobRecommendations' => $response['jobRecommendations'] ?? [],
            'searchStrategy' => [
                'keywords' => $response['searchStrategy']['keywords'] ?? [],
                'platforms' => $response['searchStrategy']['jobBoards'] ?? $response['searchStrategy']['platforms'] ?? [],
                'timing' => $response['searchStrategy']['timing'] ?? 'Apply during business hours for best results',
                'frequency' => $response['searchStrategy']['frequency'] ?? 'Apply to 5-10 jobs per week'
            ],
            'applicationOptimization' => [
                'resumeTips' => $response['applicationOptimization']['resumeTips'] ?? [],
                'coverLetterTips' => $response['applicationOptimization']['coverLetterTips'] ?? [],
                'portfolioTips' => $response['applicationOptimization']['portfolioTips'] ?? []
            ],
            'networkingStrategy' => [
                'online' => $response['networkingStrategy']['online'] ?? [],
                'offline' => $response['networkingStrategy']['offline'] ?? [],
                'informationalInterviews' => $response['networkingStrategy']['informationalInterviews'] ?? []
            ],
            'interviewPreparation' => [
                'commonQuestions' => $response['interviewPrep']['commonQuestions'] ?? [],
                'technicalQuestions' => $response['interviewPrep']['technicalQuestions'] ?? $response['interviewPrep']['technicalFocus'] ?? []
            ],
            'salaryNegotiation' => [
                'research' => $response['salaryNegotiation']['research'] ?? 'Research market rates for your role and location',
                'timing' => $response['salaryNegotiation']['timing'] ?? 'Wait for the offer before discussing salary',
                'approach' => $response['salaryNegotiation']['approach'] ?? 'Focus on value and market rates',
                'alternatives' => $response['salaryNegotiation']['alternatives'] ?? 'Consider total compensation package'
            ]
        ];

        return $mappedResponse;
    }
}
