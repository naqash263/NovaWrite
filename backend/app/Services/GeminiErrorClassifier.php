<?php

namespace App\Services;

use GuzzleHttp\Exception\RequestException;
use Illuminate\Support\Facades\Log;

class GeminiErrorClassifier
{
    /**
     * Determine if fallback to N8N should be used
     */
    public static function shouldFallback($exception): bool
    {
        // If it's a RequestException, check HTTP status
        if ($exception instanceof RequestException) {
            $response = $exception->getResponse();
            if ($response) {
                $statusCode = $response->getStatusCode();
                
                // Fallback for these HTTP status codes
                $fallbackStatusCodes = [429, 500, 502, 503, 504];
                if (in_array($statusCode, $fallbackStatusCodes)) {
                    return true;
                }
                
                // Check error message for quota/rate limit
                try {
                    $errorBody = $response->getBody()->getContents();
                    $errorData = json_decode($errorBody, true);
                    
                    if (isset($errorData['error']['message'])) {
                        $errorMessage = strtolower($errorData['error']['message']);
                        
                        if (strpos($errorMessage, 'quota') !== false ||
                            strpos($errorMessage, 'rate limit') !== false ||
                            strpos($errorMessage, 'rate_limit') !== false ||
                            strpos($errorMessage, 'limit exceeded') !== false) {
                            return true;
                        }
                    }
                } catch (\Exception $e) {
                    Log::warning('Failed to parse error response: ' . $e->getMessage());
                }
            }
        }
        
        // Check exception message for common patterns
        $errorMessage = strtolower($exception->getMessage());
        
        $fallbackPatterns = [
            'quota',
            'rate limit',
            'rate_limit',
            'temporarily unavailable',
            'service unavailable',
            'timeout',
            'timed out',
            'connection',
            'network',
            'no available api keys',
            'all api keys exhausted'
        ];
        
        foreach ($fallbackPatterns as $pattern) {
            if (strpos($errorMessage, $pattern) !== false) {
                return true;
            }
        }
        
        // Check for specific exception types
        if ($exception instanceof \GuzzleHttp\Exception\ConnectException) {
            return true; // Network connection issues
        }
        
        if ($exception instanceof \GuzzleHttp\Exception\ServerException) {
            return true; // Server errors (5xx)
        }
        
        return false;
    }

    /**
     * Get the fallback reason code
     */
    public static function getFallbackReason($exception): string
    {
        // Check HTTP status code first
        if ($exception instanceof RequestException) {
            $response = $exception->getResponse();
            if ($response) {
                $statusCode = $response->getStatusCode();
                
                if ($statusCode === 429) {
                    return 'rate_limited';
                }
                
                if ($statusCode >= 500) {
                    return 'service_unavailable';
                }
                
                // Check error message
                try {
                    $errorBody = $response->getBody()->getContents();
                    $errorData = json_decode($errorBody, true);
                    
                    if (isset($errorData['error'])) {
                        $error = $errorData['error'];
                        $errorMessage = strtolower($error['message'] ?? '');
                        
                        if (strpos($errorMessage, 'quota') !== false) {
                            return 'quota_exceeded';
                        }
                        
                        if (strpos($errorMessage, 'rate') !== false) {
                            return 'rate_limited';
                        }
                        
                        if (in_array($error['code'] ?? 0, [400, 401, 403])) {
                            return 'api_error';
                        }
                    }
                } catch (\Exception $e) {
                    // Continue to message-based detection
                }
            }
        }
        
        // Check exception message
        $errorMessage = strtolower($exception->getMessage());
        
        if (strpos($errorMessage, 'quota') !== false) {
            return 'quota_exceeded';
        }
        
        if (strpos($errorMessage, 'rate limit') !== false || 
            strpos($errorMessage, 'rate_limit') !== false) {
            return 'rate_limited';
        }
        
        if (strpos($errorMessage, 'timeout') !== false || 
            strpos($errorMessage, 'timed out') !== false) {
            return 'timeout';
        }
        
        if (strpos($errorMessage, 'no available api keys') !== false ||
            strpos($errorMessage, 'all api keys exhausted') !== false) {
            return 'no_keys_available';
        }
        
        if (strpos($errorMessage, 'invalid') !== false && 
            strpos($errorMessage, 'key') !== false) {
            return 'invalid_key';
        }
        
        if (strpos($errorMessage, 'connection') !== false ||
            strpos($errorMessage, 'network') !== false) {
            return 'network_error';
        }
        
        if (strpos($errorMessage, 'unavailable') !== false) {
            return 'service_unavailable';
        }
        
        // Check exception type
        if ($exception instanceof \GuzzleHttp\Exception\ConnectException) {
            return 'network_error';
        }
        
        if ($exception instanceof \GuzzleHttp\Exception\ServerException) {
            return 'service_unavailable';
        }
        
        return 'api_error';
    }

    /**
     * Get error code from exception
     */
    public static function getErrorCode($exception): ?string
    {
        if ($exception instanceof RequestException) {
            $response = $exception->getResponse();
            if ($response) {
                try {
                    $errorBody = $response->getBody()->getContents();
                    $errorData = json_decode($errorBody, true);
                    
                    if (isset($errorData['error']['code'])) {
                        return (string) $errorData['error']['code'];
                    }
                } catch (\Exception $e) {
                    // Return HTTP status code as fallback
                    return (string) $response->getStatusCode();
                }
            }
        }
        
        return null;
    }

    /**
     * Get error message from exception
     */
    public static function getErrorMessage($exception): string
    {
        if ($exception instanceof RequestException) {
            $response = $exception->getResponse();
            if ($response) {
                try {
                    $errorBody = $response->getBody()->getContents();
                    $errorData = json_decode($errorBody, true);
                    
                    if (isset($errorData['error']['message'])) {
                        return $errorData['error']['message'];
                    }
                } catch (\Exception $e) {
                    // Continue to exception message
                }
            }
        }
        
        return $exception->getMessage();
    }
}
