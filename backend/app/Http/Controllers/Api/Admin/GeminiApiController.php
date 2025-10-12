<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\GeminiApiKey;
use App\Models\UserApiKey;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class GeminiApiController extends Controller
{
    /**
     * Get all Gemini API keys with usage statistics
     */
    public function index(): JsonResponse
    {
        try {
            $apiKeys = GeminiApiKey::all();
            
            $totalRequests = $apiKeys->sum('total_requests');
            $usedRequests = $apiKeys->sum('used_requests');
            $availableRequests = $totalRequests - $usedRequests;
            
            return response()->json([
                'success' => true,
                'data' => [
                    'api_keys' => $apiKeys,
                    'statistics' => [
                        'total_keys' => $apiKeys->count(),
                        'total_requests' => $totalRequests,
                        'used_requests' => $usedRequests,
                        'available_requests' => $availableRequests
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching Gemini API keys: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch API keys'
            ], 500);
        }
    }

    /**
     * Show a specific Gemini API key
     */
    public function show($id): JsonResponse
    {
        try {
            $apiKey = GeminiApiKey::findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => $apiKey
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching Gemini API key: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'API key not found'
            ], 404);
        }
    }

    /**
     * Store a new Gemini API key
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'api_key' => 'required|string',
            'max_requests' => 'required|integer|min:1|max:1000',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Test the API key before storing
            $isValid = $this->validateApiKey($request->api_key);
            
            if (!$isValid) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid API key. Please check your Gemini API key.'
                ], 400);
            }

            $apiKey = GeminiApiKey::create([
                'name' => $request->name,
                'api_key' => encrypt($request->api_key),
                'max_requests' => $request->max_requests,
                'total_requests' => $request->max_requests,
                'used_requests' => 0,
                'is_active' => $request->is_active ?? true
            ]);

            return response()->json([
                'success' => true,
                'message' => 'API key added successfully',
                'data' => $apiKey
            ]);
        } catch (\Exception $e) {
            Log::error('Error storing Gemini API key: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to store API key'
            ], 500);
        }
    }

    /**
     * Update an existing API key
     */
    public function update(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'api_key' => 'sometimes|string',
            'max_requests' => 'sometimes|integer|min:1|max:1000',
            'is_active' => 'sometimes|boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $apiKey = GeminiApiKey::findOrFail($id);
            
            $updateData = $request->only(['name', 'max_requests', 'is_active']);
            
            if ($request->has('api_key')) {
                // Test the new API key before updating
                $isValid = $this->validateApiKey($request->api_key);
                
                if (!$isValid) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid API key. Please check your Gemini API key.'
                    ], 400);
                }
                
                $updateData['api_key'] = encrypt($request->api_key);
                $updateData['total_requests'] = $request->max_requests ?? $apiKey->max_requests;
                $updateData['used_requests'] = 0; // Reset usage when key is updated
            }
            
            $apiKey->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'API key updated successfully',
                'data' => $apiKey
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating Gemini API key: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update API key'
            ], 500);
        }
    }

    /**
     * Delete an API key
     */
    public function destroy($id): JsonResponse
    {
        try {
            $apiKey = GeminiApiKey::findOrFail($id);
            $apiKey->delete();

            return response()->json([
                'success' => true,
                'message' => 'API key deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting Gemini API key: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete API key'
            ], 500);
        }
    }

    /**
     * Test an API key
     */
    public function test(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'api_key' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'API key is required'
            ], 422);
        }

        try {
            $isValid = $this->validateApiKey($request->api_key);
            
            return response()->json([
                'success' => true,
                'valid' => $isValid,
                'message' => $isValid ? 'API key is valid' : 'API key is invalid'
            ]);
        } catch (\Exception $e) {
            Log::error('Error testing Gemini API key: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to test API key'
            ], 500);
        }
    }

    /**
     * Get available API keys for user
     */
    public function getAvailableKeys(): JsonResponse
    {
        try {
            $apiKeys = GeminiApiKey::where('is_active', true)
                ->whereRaw('used_requests < total_requests')
                ->get(['id', 'name', 'max_requests', 'used_requests', 'total_requests']);

            $totalAvailable = $apiKeys->sum(function ($key) {
                return $key->total_requests - $key->used_requests;
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'api_keys' => $apiKeys,
                    'total_available_requests' => $totalAvailable
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching available API keys: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch available API keys'
            ], 500);
        }
    }

    /**
     * Get all user API keys with usage statistics
     */
    public function getUserApiKeys(): JsonResponse
    {
        try {
            $userKeys = UserApiKey::with('user')->get();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'user_api_keys' => $userKeys,
                    'statistics' => [
                        'total_keys' => $userKeys->count(),
                        'active_keys' => $userKeys->where('is_active', true)->count(),
                        'total_requests' => $userKeys->sum('requests_per_key'),
                        'used_requests' => $userKeys->sum('usage_count'),
                        'available_requests' => $userKeys->sum('requests_per_key') - $userKeys->sum('usage_count')
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching user API keys: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch user API keys'
            ], 500);
        }
    }

    /**
     * Update user API key quota
     */
    public function updateUserApiKeyQuota(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'requests_per_key' => 'required|integer|min:1|max:10000',
            'is_active' => 'sometimes|boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $userApiKey = UserApiKey::findOrFail($id);
            
            $updateData = $request->only(['requests_per_key', 'is_active']);
            $userApiKey->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'User API key quota updated successfully',
                'data' => $userApiKey->load('user')
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating user API key quota: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user API key quota'
            ], 500);
        }
    }

    /**
     * Reset user API key usage
     */
    public function resetUserApiKeyUsage($id): JsonResponse
    {
        try {
            $userApiKey = UserApiKey::findOrFail($id);
            $userApiKey->update(['usage_count' => 0]);

            return response()->json([
                'success' => true,
                'message' => 'User API key usage reset successfully',
                'data' => $userApiKey->load('user')
            ]);
        } catch (\Exception $e) {
            Log::error('Error resetting user API key usage: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to reset user API key usage'
            ], 500);
        }
    }

    /**
     * Delete user API key
     */
    public function deleteUserApiKey($id): JsonResponse
    {
        try {
            $userApiKey = UserApiKey::findOrFail($id);
            $userApiKey->delete();

            return response()->json([
                'success' => true,
                'message' => 'User API key deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting user API key: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete user API key'
            ], 500);
        }
    }

    /**
     * Get comprehensive statistics for all API keys
     */
    public function getComprehensiveStats(): JsonResponse
    {
        try {
            // Get all Gemini API keys stats
            $geminiKeys = GeminiApiKey::all();
            $geminiTotalRequests = $geminiKeys->sum('total_requests');
            $geminiUsedRequests = $geminiKeys->sum('used_requests');
            $geminiAvailableRequests = $geminiTotalRequests - $geminiUsedRequests;
            
            // Get all user API keys stats  
            $userKeys = UserApiKey::where('is_active', true)->get();
            $userTotalRequests = $userKeys->sum('requests_per_key');
            $userUsedRequests = $userKeys->sum('usage_count');
            $userAvailableRequests = $userTotalRequests - $userUsedRequests;
            
            // Combined statistics
            return response()->json([
                'success' => true,
                'data' => [
                    'gemini_keys' => [
                        'total_keys' => $geminiKeys->count(),
                        'active_keys' => $geminiKeys->where('is_active', true)->count(),
                        'total_requests' => $geminiTotalRequests,
                        'used_requests' => $geminiUsedRequests,
                        'available_requests' => $geminiAvailableRequests,
                    ],
                    'user_keys' => [
                        'total_keys' => $userKeys->count(),
                        'total_requests' => $userTotalRequests,
                        'used_requests' => $userUsedRequests,
                        'available_requests' => $userAvailableRequests,
                    ],
                    'overall' => [
                        'total_keys' => $geminiKeys->count() + $userKeys->count(),
                        'total_requests' => $geminiTotalRequests + $userTotalRequests,
                        'used_requests' => $geminiUsedRequests + $userUsedRequests,
                        'available_requests' => $geminiAvailableRequests + $userAvailableRequests,
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching comprehensive API stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch comprehensive statistics'
            ], 500);
        }
    }

    /**
     * Validate Gemini API key by making a test request
     */
    private function validateApiKey(string $apiKey): bool
{
    try {
        $response = \Http::withHeaders([
            'Content-Type' => 'application/json',
        ])->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={$apiKey}", [
            'contents' => [
                [
                    'parts' => [
                        ['text' => 'Test']
                    ]
                ]
            ]
        ]);

        return $response->successful();
    } catch (\Exception $e) {
        Log::error('Admin API key validation failed: ' . $e->getMessage());
        return false;
    }
}


}

