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

class CareerToolsController extends Controller
{
    private $careerAiService;

    public function __construct(CareerAiService $careerAiService)
    {
        $this->careerAiService = $careerAiService;
    }

    /**
     * Analyze LinkedIn profile
     */
    public function analyzeLinkedIn(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'profile_data' => 'required|array',
            'profile_data.headline' => 'nullable|string|max:255',
            'profile_data.summary' => 'nullable|string|max:2000',
            'profile_data.skills' => 'nullable|array',
            'profile_data.experience' => 'nullable|array',
            'profile_data.education' => 'nullable|array',
            'profile_data.location' => 'nullable|string|max:255',
            'profile_data.industry' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if we have at least some profile data to analyze
        $profileData = $request->input('profile_data', []);
        if (empty($profileData['headline']) && empty($profileData['summary']) && empty($profileData['skills'])) {
            return response()->json([
                'success' => false,
                'message' => 'Please provide at least a headline, summary, or skills to analyze your LinkedIn profile.'
            ], 422);
        }

        try {
            $apiKey = $this->getAvailableApiKey();
            if (!$apiKey) {
                return response()->json([
                    'success' => false,
                    'message' => 'No API keys available. Please add your own API key or contact support.'
                ], 400);
            }

            $analysis = $this->careerAiService->analyzeLinkedInProfile($request->profile_data, $apiKey);
            $this->incrementApiUsage($apiKey);

            return response()->json([
                'success' => true,
                'data' => $analysis
            ]);

        } catch (\Exception $e) {
            Log::error('LinkedIn analysis error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate cover letter
     */
    public function generateCoverLetter(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'job_title' => 'required|string|max:255',
            'company_name' => 'required|string|max:255',
            'job_description' => 'required|string|max:2000',
            'years_experience' => 'required|integer|min:0|max:50',
            'current_position' => 'required|string|max:255',
            'achievements' => 'required|string|max:1000',
            'skills' => 'required|string|max:500',
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
                    'message' => 'No API keys available. Please add your own API key or contact support.'
                ], 400);
            }

            $coverLetter = $this->careerAiService->generateCoverLetter($request->all(), $apiKey);
            $this->incrementApiUsage($apiKey);

            return response()->json([
                'success' => true,
                'data' => $coverLetter
            ]);

        } catch (\Exception $e) {
            Log::error('Cover letter generation error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate interview preparation plan
     */
    public function generateInterviewPrep(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'job_title' => 'required|string|max:255',
            'company_name' => 'required|string|max:255',
            'industry' => 'required|string|max:100',
            'experience_level' => 'required|string|in:entry,mid,senior,executive',
            'interview_type' => 'required|string|in:phone,video,in-person,panel',
            'technical_skills' => 'required|array',
            'soft_skills' => 'required|array',
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
                    'message' => 'No API keys available. Please add your own API key or contact support.'
                ], 400);
            }

            $prepPlan = $this->careerAiService->generateInterviewPrep($request->all(), $apiKey);
            $this->incrementApiUsage($apiKey);

            return response()->json([
                'success' => true,
                'data' => $prepPlan
            ]);

        } catch (\Exception $e) {
            Log::error('Interview prep generation error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate salary negotiation strategy
     */
    public function generateSalaryNegotiation(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'current_salary' => 'required|numeric|min:0',
            'desired_salary' => 'required|numeric|min:0',
            'job_title' => 'required|string|max:255',
            'location' => 'required|string|max:100',
            'experience_years' => 'required|integer|min:0|max:50',
            'education_level' => 'required|string|in:high_school,bachelor,master,phd',
            'skills' => 'required|array',
            'company_size' => 'required|string|in:startup,small,medium,large,enterprise',
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
                    'message' => 'No API keys available. Please add your own API key or contact support.'
                ], 400);
            }

            $negotiationPlan = $this->careerAiService->generateSalaryNegotiation($request->all(), $apiKey);
            $this->incrementApiUsage($apiKey);

            return response()->json([
                'success' => true,
                'data' => $negotiationPlan
            ]);

        } catch (\Exception $e) {
            Log::error('Salary negotiation generation error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate skills assessment
     */
    public function generateSkillsAssessment(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'technical_skills' => 'array',
            'soft_skills' => 'array',
            'experience_years' => 'required|integer|min:0|max:50',
            'current_role' => 'required|string|max:255',
            'career_goals' => 'required|string|max:1000',
            'industry' => 'required|string|max:100',
        ]);

        // Check if at least one skill is provided
        $technicalSkills = $request->input('technical_skills', []);
        $softSkills = $request->input('soft_skills', []);
        
        if (empty($technicalSkills) && empty($softSkills)) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => [
                    'skills' => ['At least one skill (technical or soft) must be provided.']
                ]
            ], 422);
        }

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
                    'message' => 'No API keys available. Please add your own API key or contact support.'
                ], 400);
            }

            $assessment = $this->careerAiService->generateSkillsAssessment($request->all(), $apiKey);
            $this->incrementApiUsage($apiKey);

            return response()->json([
                'success' => true,
                'data' => $assessment
            ]);

        } catch (\Exception $e) {
            Log::error('Skills assessment generation error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate career path plan
     */
    public function generateCareerPath(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'current_role' => 'required|string|max:255',
            'experience_years' => 'required|integer|min:0|max:50',
            'skills' => 'required|array',
            'interests' => 'required|array',
            'career_goals' => 'required|string|max:1000',
            'industry' => 'required|string|max:100',
            'education_level' => 'required|string|in:high_school,bachelor,master,phd',
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
                    'message' => 'No API keys available. Please add your own API key or contact support.'
                ], 400);
            }

            $careerPath = $this->careerAiService->generateCareerPath($request->all(), $apiKey);
            $this->incrementApiUsage($apiKey);

            return response()->json([
                'success' => true,
                'data' => $careerPath
            ]);

        } catch (\Exception $e) {
            Log::error('Career path generation error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate job search optimization strategy
     */
    public function generateJobSearchStrategy(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'job_title' => 'required|string|max:255',
            'location' => 'required|string|max:100',
            'experience_years' => 'required|integer|min:0|max:50',
            'skills' => 'required|array',
            'salary_expectation' => 'required|numeric|min:0',
            'job_type' => 'required|string|in:full_time,part_time,contract,remote,hybrid',
            'industry' => 'required|string|max:100',
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
                    'message' => 'No API keys available. Please add your own API key or contact support.'
                ], 400);
            }

            $jobSearchStrategy = $this->careerAiService->generateJobSearchStrategy($request->all(), $apiKey);
            $this->incrementApiUsage($apiKey);

            return response()->json([
                'success' => true,
                'data' => $jobSearchStrategy
            ]);

        } catch (\Exception $e) {
            Log::error('Job search strategy generation error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available API key
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

            // If user is authenticated, try to use their API keys first
            if ($user) {
                Log::info('User authenticated, looking for user API keys', ['user_id' => $user->id]);
                $userApiKey = UserApiKey::where('user_id', $user->id)
                    ->active()
                    ->withRemainingRequests()
                    ->first();

                if ($userApiKey) {
                    Log::info('Found user API key', ['key_id' => $userApiKey->id, 'user_id' => $user->id]);
                    return $userApiKey;
                } else {
                    Log::info('No user API key found for user', ['user_id' => $user->id]);
                }
            }

            // Fallback to admin API keys
            $adminApiKey = GeminiApiKey::active()
                ->withRemainingRequests()
                ->first();

            if ($adminApiKey) {
                return $adminApiKey;
            }

            Log::warning('No available API keys found in database');
            return null;
        } catch (\Exception $e) {
            Log::error('API key retrieval failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Increment API usage count
     */
    private function incrementApiUsage($apiKey)
    {
        try {
            if ($apiKey instanceof UserApiKey) {
                Log::info('Calling incrementUsage on UserApiKey');
                $apiKey->incrementUsage();
            } elseif ($apiKey instanceof GeminiApiKey) {
                Log::info('Calling incrementUsage on GeminiApiKey');
                $apiKey->incrementUsage();
            } elseif (is_object($apiKey) && property_exists($apiKey, 'incrementUsage')) {
                Log::info('Calling incrementUsage on PDO object');
                $apiKey->incrementUsage->__invoke();
            } else {
                Log::warning('No incrementUsage property found on API key object');
            }
        } catch (\Exception $e) {
            Log::error('Failed to increment API usage: ' . $e->getMessage());
        }
    }
}
