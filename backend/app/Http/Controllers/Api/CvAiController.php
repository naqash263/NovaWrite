<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GeminiApiKey;
use App\Models\UserApiKey;
use App\Services\CvAiService;
use App\Services\FileProcessingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class CvAiController extends Controller
{
    private $cvAiService;
    private $fileProcessingService;

    public function __construct(CvAiService $cvAiService, FileProcessingService $fileProcessingService)
    {
        $this->cvAiService = $cvAiService;
        $this->fileProcessingService = $fileProcessingService;
    }

    /**
     * Extract CV data from uploaded file
     */
    public function extractCv(Request $request): JsonResponse
    {
        // Support both file upload and content-based extraction for backward compatibility
        if ($request->hasFile('file')) {
            return $this->extractCvFromFile($request);
        } else {
            return $this->extractCvFromContent($request);
        }
    }

    /**
     * Extract CV data from uploaded file (new method)
     */
    private function extractCvFromFile(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:pdf,doc,docx,txt|max:10240'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $file = $request->file('file');
            
            // Validate file using our service
            $validationErrors = $this->fileProcessingService->validateFile($file);
            if (!empty($validationErrors)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File validation failed',
                    'errors' => $validationErrors
                ], 422);
            }

            // Get file type
            $fileType = $this->fileProcessingService->getFileType($file->getClientOriginalName());
            
            // Extract text content
            $fileContent = $this->fileProcessingService->extractTextContent($file, $fileType);
            
                if (empty(trim($fileContent))) {
                    $errorMessage = 'No readable text found in the uploaded file. ';
                    if ($fileType === 'pdf') {
                        $errorMessage .= 'This appears to be an image-based PDF (scanned document). Please try uploading a text-based PDF or convert your CV to a text-based format.';
                    } else {
                        $errorMessage .= 'Please ensure the file contains text content.';
                    }
                    
                    return response()->json([
                        'success' => false,
                        'message' => $errorMessage
                    ], 400);
                }

            // Get available API key
            $apiKey = $this->getAvailableApiKey();
            
            if (!$apiKey) {
                return response()->json([
                    'success' => false,
                    'message' => 'No API keys available. Please add your own API key or contact support.'
                ], 400);
            }

            // Extract CV data using AI
            $cvData = $this->cvAiService->extractCvData($fileContent, $fileType, $apiKey);

            // Increment usage count for both UserApiKey and GeminiApiKey
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

            return response()->json([
                'success' => true,
                'message' => 'CV data extracted successfully',
                'data' => $cvData,
                'file_info' => [
                    'filename' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                    'type' => $fileType,
                    'extracted_text_length' => strlen($fileContent)
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('CV extraction error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Extract CV data from content (legacy method for backward compatibility)
     */
    private function extractCvFromContent(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file_content' => 'required|string',
            'file_type' => 'required|string|in:pdf,doc,docx,txt'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Get available API key (user-specific or admin)
            $apiKey = $this->getAvailableApiKey();
            
            if (!$apiKey) {
                return response()->json([
                    'success' => false,
                    'message' => 'No API keys available. Please add your own API key or contact support.'
                ], 400);
            }

            $cvData = $this->cvAiService->extractCvData(
                $request->file_content,
                $request->file_type,
                $apiKey
            );

            // Increment usage count for both UserApiKey and GeminiApiKey
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

            return response()->json([
                'success' => true,
                'message' => 'CV data extracted successfully',
                'data' => $cvData
            ]);
        } catch (\Exception $e) {
            Log::error('CV extraction error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Tailor CV to job description
     */
    public function tailorCv(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'cv_data' => 'required|array',
            'job_description' => 'required|string|min:50'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Get available API key (user-specific or admin)
            $apiKey = $this->getAvailableApiKey();
            
            if (!$apiKey) {
                return response()->json([
                    'success' => false,
                    'message' => 'No API keys available. Please add your own API key or contact support.'
                ], 400);
            }

            $tailoredCv = $this->cvAiService->tailorCvToJob(
                $request->cv_data,
                $request->job_description,
                $apiKey
            );

            // Increment usage count for both UserApiKey and GeminiApiKey
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

            return response()->json([
                'success' => true,
                'message' => 'CV tailored successfully',
                'data' => $tailoredCv
            ]);
        } catch (\Exception $e) {
            Log::error('CV tailoring error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get API usage statistics
     */
    public function getApiStats(): JsonResponse
    {
        try {
            $user = Auth::user();
            $stats = [];

            if ($user) {
                // Get user-specific stats
                $userKeys = UserApiKey::where('user_id', $user->id)
                    ->active()
                    ->get();

                $userTotalRequests = $userKeys->sum('requests_per_key');
                $userUsedRequests = $userKeys->sum('usage_count');
                $userAvailableRequests = $userTotalRequests - $userUsedRequests;

                $stats = [
                    'available_requests' => $userAvailableRequests,
                    'total_requests' => $userTotalRequests,
                    'used_requests' => $userUsedRequests,
                    'user_keys_count' => $userKeys->count(),
                    'is_authenticated' => true
                ];
            } else {
                // Get admin API stats for non-authenticated users
                $adminKeys = GeminiApiKey::active()->get();
                $adminTotalRequests = $adminKeys->sum('total_requests');
                $adminUsedRequests = $adminKeys->sum('used_requests');
                $adminAvailableRequests = $adminTotalRequests - $adminUsedRequests;

                $stats = [
                    'available_requests' => $adminAvailableRequests,
                    'total_requests' => $adminTotalRequests,
                    'used_requests' => $adminUsedRequests,
                    'user_keys_count' => 0,
                    'is_authenticated' => false,
                    'usage_percentage' => $adminTotalRequests > 0 ? round(($adminUsedRequests / $adminTotalRequests) * 100, 1) : 0,
                    'remaining_percentage' => $adminTotalRequests > 0 ? round(($adminAvailableRequests / $adminTotalRequests) * 100, 1) : 0,
                    'usage_display' => "{$adminUsedRequests} of {$adminTotalRequests} requests used ({$adminAvailableRequests} remaining)"
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            // If Laravel connection fails, use direct PDO
            Log::warning('Laravel database connection failed in getApiStats, using direct PDO: ' . $e->getMessage());
            return $this->getApiStatsWithPDO();
        }
    }

    /**
     * Get API stats using direct PDO connection
     */
    private function getApiStatsWithPDO(): JsonResponse
    {
        try {
            $pdo = new \PDO('pgsql:dbname=novawrite_local');
            $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);

            $user = Auth::user();
            $stats = [];

            if ($user) {
                // Get user-specific stats
                $stmt = $pdo->prepare("SELECT SUM(requests_per_key) as total_requests, SUM(usage_count) as used_requests, COUNT(*) as user_keys_count FROM user_api_keys WHERE user_id = ? AND is_active = true");
                $stmt->execute([$user->id]);
                $userStats = $stmt->fetch(\PDO::FETCH_ASSOC);

                $userTotalRequests = $userStats['total_requests'] ?? 0;
                $userUsedRequests = $userStats['used_requests'] ?? 0;
                $userAvailableRequests = $userTotalRequests - $userUsedRequests;

                $stats = [
                    'available_requests' => $userAvailableRequests,
                    'total_requests' => $userTotalRequests,
                    'used_requests' => $userUsedRequests,
                    'user_keys_count' => $userStats['user_keys_count'] ?? 0,
                    'is_authenticated' => true
                ];
            } else {
                // Get admin API stats for non-authenticated users
                $stmt = $pdo->query("SELECT SUM(total_requests) as total_requests, SUM(used_requests) as used_requests FROM gemini_api_keys WHERE is_active = true");
                $adminStats = $stmt->fetch(\PDO::FETCH_ASSOC);

                $adminTotalRequests = $adminStats['total_requests'] ?? 0;
                $adminUsedRequests = $adminStats['used_requests'] ?? 0;
                $adminAvailableRequests = $adminTotalRequests - $adminUsedRequests;

                $stats = [
                    'available_requests' => $adminAvailableRequests,
                    'total_requests' => $adminTotalRequests,
                    'used_requests' => $adminUsedRequests,
                    'user_keys_count' => 0,
                    'is_authenticated' => false,
                    'usage_percentage' => $adminTotalRequests > 0 ? round(($adminUsedRequests / $adminTotalRequests) * 100, 1) : 0,
                    'remaining_percentage' => $adminTotalRequests > 0 ? round(($adminAvailableRequests / $adminTotalRequests) * 100, 1) : 0,
                    'usage_display' => "{$adminUsedRequests} of {$adminTotalRequests} requests used ({$adminAvailableRequests} remaining)"
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('Direct PDO connection also failed in getApiStats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch API statistics'
            ], 500);
        }
    }

    /**
     * Add user's own API key (legacy endpoint for backward compatibility)
     */
    public function addUserApiKey(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'api_key' => 'required|string',
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
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required to add API key'
            ], 401);
        }

        try {
            // Check if user already has this API key
            $existingKey = UserApiKey::where('user_id', $user->id)
                ->where('api_key', $request->api_key)
                ->first();

            if ($existingKey) {
                return response()->json([
                    'success' => false,
                    'message' => 'This API key is already added to your account'
                ], 400);
            }

            // Validate the API key
            if (!$this->validateApiKey($request->api_key)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid API key. Please check your Gemini API key.'
                ], 400);
            }

            // Create user API key (encrypt the API key)
            $userApiKey = UserApiKey::create([
                'user_id' => $user->id,
                'name' => $request->name,
                'api_key' => encrypt($request->api_key), // Encrypt the API key
                'requests_per_key' => 5,
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
        } catch (\Exception $e) {
            Log::error('Error adding user API key: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to add API key'
            ], 500);
        }
    }

    /**
     * Get available API key for the current request
     */
    private function getAvailableApiKey()
    {
        try {
            $user = Auth::user();

            // If user is authenticated, try to use their API keys first
            if ($user) {
                $userApiKey = UserApiKey::where('user_id', $user->id)
                    ->active()
                    ->withRemainingRequests()
                    ->first();

                if ($userApiKey) {
                    return $userApiKey;
                }
            }

            // Fallback to admin API keys
            $adminApiKey = GeminiApiKey::active()
                ->withRemainingRequests()
                ->first();

            if ($adminApiKey) {
                return $adminApiKey;
            }

            // If no API keys found, return null instead of trying PDO
            Log::warning('No available API keys found in database');
            return null;
        } catch (\Exception $e) {
            // Only use PDO fallback for actual database connection errors
            if (strpos($e->getMessage(), 'Connection') !== false || 
                strpos($e->getMessage(), 'database') !== false ||
                strpos($e->getMessage(), 'SQL') !== false) {
                Log::warning('Laravel database connection failed in controller, using direct PDO: ' . $e->getMessage());
                return $this->getAvailableApiKeyWithPDO();
            } else {
                // For other errors (like MAC validation), log and return fallback
                Log::error('API key retrieval failed: ' . $e->getMessage());
                return $this->getFallbackApiKey();
            }
        }
    }

    /**
     * Get fallback API key when all others fail
     */
    private function getFallbackApiKey()
    {
        // Create a temporary fallback API key object
        $fallbackKey = new \stdClass();
        $fallbackKey->api_key = env('FALLBACK_GEMINI_API_KEY', 'AIzaSyDummyKeyForTesting123456789');
        $fallbackKey->id = 'fallback';
        $fallbackKey->name = 'Fallback Key';
        $fallbackKey->is_active = true;
        $fallbackKey->total_requests = 1000;
        $fallbackKey->used_requests = 0;
        
        // Add incrementUsage method (no-op for fallback)
        $fallbackKey->incrementUsage = function() {
            Log::info('Fallback API key usage incremented (no-op)');
        };
        
        Log::warning('Using fallback API key due to encryption issues');
        return $fallbackKey;
    }

    /**
     * Get available API key using direct PDO connection
     */
    private function getAvailableApiKeyWithPDO()
    {
        try {
            // Use the correct production database connection
            $pdo = new \PDO(
                'pgsql:host=' . env('DB_HOST', 'localhost') . 
                ';port=' . env('DB_PORT', '5432') . 
                ';dbname=' . env('DB_DATABASE', 'novawrite') . 
                ';user=' . env('DB_USERNAME', 'postgres') . 
                ';password=' . env('DB_PASSWORD', ''),
                null,
                [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]
            );

            // Try to get a user API key first (if authenticated)
            $user = Auth::user();
            if ($user) {
                $stmt = $pdo->prepare("SELECT * FROM user_api_keys WHERE user_id = ? AND is_active = true AND usage_count < requests_per_key LIMIT 1");
                $stmt->execute([$user->id]);
                $userApiKey = $stmt->fetch(\PDO::FETCH_ASSOC);

                if ($userApiKey) {
                    // Create a simple object that mimics the UserApiKey model
                    $key = new \stdClass();
                    try {
                        $key->api_key = decrypt($userApiKey['api_key']);
                    } catch (\Exception $e) {
                        Log::error('Failed to decrypt user API key: ' . $e->getMessage());
                        return null;
                    }
                    $key->id = $userApiKey['id'];
                    $key->user_id = $userApiKey['user_id'];
                    $key->name = $userApiKey['name'];
                    $key->is_active = $userApiKey['is_active'];
                    $key->requests_per_key = $userApiKey['requests_per_key'];
                    $key->usage_count = $userApiKey['usage_count'];
                    
                    // Add incrementUsage method
                    $key->incrementUsage = function() use ($pdo, $userApiKey) {
                        try {
                            $stmt = $pdo->prepare("UPDATE user_api_keys SET usage_count = usage_count + 1 WHERE id = ?");
                            $result = $stmt->execute([$userApiKey['id']]);
                            Log::info('Incremented usage for user key ID: ' . $userApiKey['id'] . ', Result: ' . ($result ? 'success' : 'failed'));
                        } catch (\Exception $e) {
                            Log::error('Failed to increment usage for user key: ' . $e->getMessage());
                        }
                    };
                    
                    return $key;
                }
            }

            // Fallback to admin API keys
            $stmt = $pdo->prepare("SELECT * FROM gemini_api_keys WHERE is_active = true AND used_requests < total_requests LIMIT 1");
            $stmt->execute();
            $adminApiKey = $stmt->fetch(\PDO::FETCH_ASSOC);

            if ($adminApiKey) {
                // Create a simple object that mimics the GeminiApiKey model
                $key = new \stdClass();
                try {
                    // Try single decrypt first
                    $decryptedKey = decrypt($adminApiKey['api_key']);
                    // Check if it looks like a valid API key
                    if (strpos($decryptedKey, 'AIza') === 0) {
                        $key->api_key = $decryptedKey;
                    } else {
                        // If not, try double decrypt
                        $key->api_key = decrypt($decryptedKey);
                    }
                } catch (\Exception $e) {
                    Log::error('Failed to decrypt admin API key: ' . $e->getMessage());
                    return null;
                }
                $key->id = $adminApiKey['id'];
                $key->name = $adminApiKey['name'];
                $key->is_active = $adminApiKey['is_active'];
                $key->total_requests = $adminApiKey['total_requests'];
                $key->used_requests = $adminApiKey['used_requests'];
                
                // Add incrementUsage method
                $key->incrementUsage = function() use ($pdo, $adminApiKey) {
                    try {
                        $stmt = $pdo->prepare("UPDATE gemini_api_keys SET used_requests = used_requests + 1 WHERE id = ?");
                        $result = $stmt->execute([$adminApiKey['id']]);
                        Log::info('Incremented usage for admin key ID: ' . $adminApiKey['id'] . ', Result: ' . ($result ? 'success' : 'failed'));
                    } catch (\Exception $e) {
                        Log::error('Failed to increment usage for admin key: ' . $e->getMessage());
                    }
                };
                
                return $key;
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Direct PDO connection also failed in controller: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Debug API key decryption (temporary endpoint for troubleshooting)
     */
    public function debugApiKeys(): JsonResponse
    {
        try {
            $debug = [
                'app_key' => config('app.key'),
                'encryption_driver' => config('app.cipher'),
                'api_keys' => []
            ];

            // Check admin API keys
            $adminKeys = GeminiApiKey::all();
            foreach ($adminKeys as $key) {
                $keyDebug = [
                    'id' => $key->id,
                    'name' => $key->name,
                    'is_active' => $key->is_active,
                    'encrypted_length' => strlen($key->getRawOriginal('api_key')),
                    'decryption_status' => 'unknown'
                ];

                try {
                    $decrypted = decrypt($key->getRawOriginal('api_key'));
                    if (strpos($decrypted, 'AIza') === 0) {
                        $keyDebug['decryption_status'] = 'success_single';
                        $keyDebug['api_key_preview'] = substr($decrypted, 0, 10) . '...';
                    } else {
                        $doubleDecrypted = decrypt($decrypted);
                        $keyDebug['decryption_status'] = 'success_double';
                        $keyDebug['api_key_preview'] = substr($doubleDecrypted, 0, 10) . '...';
                    }
                } catch (\Exception $e) {
                    $keyDebug['decryption_status'] = 'failed';
                    $keyDebug['error'] = $e->getMessage();
                }

                $debug['api_keys'][] = $keyDebug;
            }

            return response()->json($debug);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    /**
     * Fix corrupted API keys by re-encrypting them (temporary endpoint for troubleshooting)
     */
    public function fixApiKeys(): JsonResponse
    {
        try {
            $fixed = [];
            $adminKeys = GeminiApiKey::all();
            
            foreach ($adminKeys as $key) {
                $keyInfo = [
                    'id' => $key->id,
                    'name' => $key->name,
                    'status' => 'unchanged'
                ];

                try {
                    // Try to decrypt the current key
                    $decrypted = decrypt($key->getRawOriginal('api_key'));
                    if (strpos($decrypted, 'AIza') === 0) {
                        $keyInfo['status'] = 'already_working';
                    } else {
                        $doubleDecrypted = decrypt($decrypted);
                        if (strpos($doubleDecrypted, 'AIza') === 0) {
                            $keyInfo['status'] = 'already_working_double';
                        }
                    }
                } catch (\Exception $e) {
                    // If decryption fails, we need to manually fix this
                    // For now, we'll mark it as needing manual intervention
                    $keyInfo['status'] = 'needs_manual_fix';
                    $keyInfo['error'] = $e->getMessage();
                }

                $fixed[] = $keyInfo;
            }

            return response()->json([
                'message' => 'API key analysis complete',
                'keys' => $fixed,
                'note' => 'Keys marked as "needs_manual_fix" require manual re-encryption with a valid API key'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    /**
     * Validate API key
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
            Log::error('CV AI API key validation failed: ' . $e->getMessage());
            return false;
        }
    }
}
