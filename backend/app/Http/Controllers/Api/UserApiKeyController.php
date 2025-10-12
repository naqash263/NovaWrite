<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserApiKey;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class UserApiKeyController extends Controller
{
    /**
     * Get user's API keys and stats.
     */
    public function index(): JsonResponse
    {
        $user = Auth::user();
        
        $userKeys = UserApiKey::where('user_id', $user->id)
            ->active()
            ->get()
            ->map(function ($key) {
                return [
                    'id' => $key->id,
                    'name' => $key->name,
                    'requests_per_key' => $key->requests_per_key,
                    'usage_count' => $key->usage_count,
                    'remaining_requests' => $key->remaining_requests,
                    'is_active' => $key->is_active,
                    'created_at' => $key->created_at
                ];
            });

        $totalRequests = $userKeys->sum('requests_per_key');
        $totalUsed = $userKeys->sum('usage_count');
        $availableRequests = $totalRequests - $totalUsed;

        return response()->json([
            'success' => true,
            'data' => [
                'user_keys' => $userKeys,
                'total_requests' => $totalRequests,
                'available_requests' => $availableRequests,
                'used_requests' => $totalUsed
            ]
        ]);
    }

    /**
     * Add a new API key for the user.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'api_key' => 'required|string|min:10',
            'name' => 'required|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();

        // Check if user already has this API key
        // Since api_key is encrypted, we need to get all keys and compare them
        $existingKeys = UserApiKey::where('user_id', $user->id)->get();
        $existingKey = $existingKeys->first(function ($key) use ($request) {
            return $key->api_key === $request->api_key;
        });

        if ($existingKey) {
            return response()->json([
                'success' => false,
                'message' => 'This API key is already added to your account'
            ], 400);
        }

        // Validate the API key by making a test request
        if (!$this->validateApiKey($request->api_key)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid API key. Please check your Gemini API key and try again.'
            ], 400);
        }

        $userApiKey = UserApiKey::create([
            'user_id' => $user->id,
            'name' => $request->name,
            'api_key' => $request->api_key,
            'requests_per_key' => 5, // Default 5 requests per key
            'usage_count' => 0,
            'is_active' => true
        ]);

        return response()->json([
            'success' => true,
            'message' => 'API key added successfully',
            'data' => [
                'id' => $userApiKey->id,
                'name' => $userApiKey->name,
                'requests_per_key' => $userApiKey->requests_per_key,
                'remaining_requests' => $userApiKey->remaining_requests
            ]
        ]);
    }

    /**
     * Get API stats for the user.
     */
    public function stats(): JsonResponse
    {
        $user = Auth::user();
        
        $userKeys = UserApiKey::where('user_id', $user->id)
            ->active()
            ->get();

        $totalRequests = $userKeys->sum('requests_per_key');
        $totalUsed = $userKeys->sum('usage_count');
        $availableRequests = $totalRequests - $totalUsed;

        return response()->json([
            'success' => true,
            'data' => [
                'available_requests' => $availableRequests,
                'total_requests' => $totalRequests,
                'used_requests' => $totalUsed,
                'user_keys_count' => $userKeys->count()
            ]
        ]);
    }

    /**
     * Delete a user's API key.
     */
    public function destroy($id): JsonResponse
    {
        $user = Auth::user();
        
        $userApiKey = UserApiKey::where('user_id', $user->id)
            ->where('id', $id)
            ->first();

        if (!$userApiKey) {
            return response()->json([
                'success' => false,
                'message' => 'API key not found'
            ], 404);
        }

        $userApiKey->delete();

        return response()->json([
            'success' => true,
            'message' => 'API key deleted successfully'
        ]);
    }

    /**
     * Validate API key by making a test request to Gemini.
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
            Log::error('User API key validation failed: ' . $e->getMessage());
            return false;
        }
    }
}