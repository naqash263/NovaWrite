<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\LinkedInProfileService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class LinkedInProfileController extends Controller
{
    private $linkedInService;

    public function __construct(LinkedInProfileService $linkedInService)
    {
        $this->linkedInService = $linkedInService;
    }

    /**
     * Extract profile data from LinkedIn URL
     */
    public function extractProfile(Request $request): JsonResponse
    {
        $url = $request->input('url');
        
        // Manual validation
        if (empty($url)) {
            return response()->json([
                'success' => false,
                'message' => 'URL is required'
            ], 422);
        }
        
        // Check if URL matches LinkedIn pattern
        $linkedinPattern = '/^https?:\/\/(www\.)?([a-z]{2}\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/';
        if (!preg_match($linkedinPattern, $url)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid LinkedIn URL format. Please provide a valid LinkedIn profile URL.'
            ], 422);
        }

        try {
            $profileData = $this->linkedInService->extractProfileData($request->input('url'));

            return response()->json([
                'success' => true,
                'data' => $profileData
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Validate LinkedIn URL
     */
    public function validateUrl(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'url' => 'required|regex:/^https?:\/\/(www\.)?([a-z]{2}\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid LinkedIn URL format',
                'errors' => $validator->errors()
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Valid LinkedIn URL'
        ]);
    }
}
