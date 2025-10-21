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
        $user = Auth::guard('api')->user();
        
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

        $totalRequests = $userKeys->sum('max_requests');
        $totalUsed = $userKeys->sum('used_requests');
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
        try {
            \Log::info('UserApiKeyController::store called', [
                'user_id' => Auth::id(),
                'request_data' => $request->only(['name', 'api_key'])
            ]);

            $validator = Validator::make($request->all(), [
                'api_key' => 'required|string|min:10',
                'name' => 'required|string|max:255'
            ]);

            if ($validator->fails()) {
                \Log::warning('Validation failed', ['errors' => $validator->errors()]);
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = Auth::guard('api')->user();
            
            if (!$user) {
                \Log::error('No authenticated user found');
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required'
                ], 401);
            }

        // Check if user already has this API key
        // Since api_key is encrypted, we need to get all keys and compare them
        $existingKeys = UserApiKey::where('user_id', $user->id)->get();
        $existingKey = $existingKeys->first(function ($key) use ($request) {
            try {
                // Decrypt the stored key and compare with the request key
                $decryptedKey = $key->api_key; // This will use the accessor to decrypt
                return $decryptedKey === $request->api_key;
            } catch (\Exception $e) {
                // If decryption fails, skip this key
                return false;
            }
        });

        if ($existingKey) {
            return response()->json([
                'success' => false,
                'message' => 'This API key is already added to your account'
            ], 400);
        }

        // Validate the API key by making a test request
        $validationResult = $this->validateApiKey($request->api_key);
        if (!$validationResult['valid']) {
            return response()->json([
                'success' => false,
                'message' => $validationResult['message']
            ], 400);
        }

            $userApiKey = UserApiKey::create([
                'user_id' => $user->id,
                'name' => $request->name,
                'api_key' => $request->api_key,
                'max_requests' => 100, // Default 100 requests per key
                'used_requests' => 0,
                'is_active' => true,
                'last_reset_at' => now()
            ]);

            \Log::info('API key created successfully', ['key_id' => $userApiKey->id]);
            
            return response()->json([
                'success' => true,
                'message' => 'API key added successfully',
                'data' => [
                    'id' => $userApiKey->id,
                    'name' => $userApiKey->name,
                    'max_requests' => $userApiKey->max_requests,
                    'remaining_requests' => $userApiKey->remaining_requests
                ]
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Error in UserApiKeyController::store', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while adding the API key. Please try again.'
            ], 500);
        }
    }

    /**
     * Get API stats for the user.
     */
    public function stats(): JsonResponse
    {
        $user = Auth::guard('api')->user();
        
        $userKeys = UserApiKey::where('user_id', $user->id)
            ->active()
            ->get();

        $totalRequests = $userKeys->sum('max_requests');
        $totalUsed = $userKeys->sum('used_requests');
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
        $user = Auth::guard('api')->user();
        
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
    private function validateApiKey(string $apiKey): array
    {
        try {
            \Log::info('Validating API key', ['key_length' => strlen($apiKey), 'key_prefix' => substr($apiKey, 0, 10)]);
            
            // Basic format validation
            if (empty($apiKey) || strlen($apiKey) < 20) {
                \Log::warning('API key validation failed: too short', ['length' => strlen($apiKey)]);
                return [
                    'valid' => false,
                    'message' => 'API key appears to be invalid. Please check the format and try again.'
                ];
            }
            
            if (!str_starts_with($apiKey, 'AIza')) {
                \Log::warning('API key validation failed: wrong format', ['prefix' => substr($apiKey, 0, 10)]);
                return [
                    'valid' => false,
                    'message' => 'Invalid API key format. Gemini API keys should start with "AIza".'
                ];
            }

            \Log::info('Making test request to Gemini API');
            
            $response = \Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->timeout(10)->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={$apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => 'Test']
                        ]
                    ]
                ]
            ]);
            
            \Log::info('Gemini API response received', [
                'status' => $response->status(),
                'successful' => $response->successful()
            ]);
    
            if ($response->successful()) {
                return [
                    'valid' => true,
                    'message' => 'API key is valid'
                ];
            }
            
            // Parse error response for more specific messages
            $errorData = $response->json();
            if (isset($errorData['error']['message'])) {
                $errorMessage = $errorData['error']['message'];
                
                if (str_contains($errorMessage, 'API_KEY_INVALID')) {
                    return [
                        'valid' => false,
                        'message' => 'Invalid API key. Please check your Gemini API key and try again.'
                    ];
                } elseif (str_contains($errorMessage, 'API_KEY_EXPIRED')) {
                    return [
                        'valid' => false,
                        'message' => 'API key has expired. Please generate a new key from Google AI Studio.'
                    ];
                } elseif (str_contains($errorMessage, 'QUOTA_EXCEEDED')) {
                    return [
                        'valid' => false,
                        'message' => 'API key quota exceeded. Please check your usage limits.'
                    ];
                } else {
                    return [
                        'valid' => false,
                        'message' => 'API key validation failed: ' . $errorMessage
                    ];
                }
            }
            
            return [
                'valid' => false,
                'message' => 'API key validation failed. Please check your key and try again.'
            ];
            
        } catch (\Exception $e) {
            \Log::error('User API key validation failed', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'api_key_prefix' => substr($apiKey, 0, 10)
            ]);
            return [
                'valid' => false,
                'message' => 'Unable to validate API key. Please check your internet connection and try again.'
            ];
        }
    }
}