<?php

namespace App\Services;

use GuzzleHttp\Exception\RequestException;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\TransferException;

class EmailFailureAnalyzer
{
    /**
     * Analyze an exception and extract failure information
     */
    public static function analyzeException(\Throwable $exception, ?int $httpStatusCode = null): array
    {
        $errorMessage = $exception->getMessage();
        $errorDetails = [
            'exception_type' => get_class($exception),
            'message' => $errorMessage,
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
        ];

        // Determine HTTP status code if available
        if ($httpStatusCode === null && $exception instanceof RequestException) {
            $response = $exception->getResponse();
            $httpStatusCode = $response ? $response->getStatusCode() : null;
        }

        // Categorize the failure
        $category = self::categorizeFailure($exception, $httpStatusCode, $errorMessage);
        $reasonCode = self::generateReasonCode($category, $httpStatusCode, $errorMessage);

        // Add HTTP-specific details
        if ($exception instanceof RequestException && $exception->getResponse()) {
            try {
                $responseBody = $exception->getResponse()->getBody()->getContents();
                $errorDetails['response_body'] = $responseBody;
                $errorDetails['response_headers'] = $exception->getResponse()->getHeaders();
            } catch (\Exception $e) {
                // Ignore errors reading response
            }
        }

        return [
            'failure_category' => $category,
            'failure_reason_code' => $reasonCode,
            'error_details' => $errorDetails,
            'http_status_code' => $httpStatusCode,
        ];
    }

    /**
     * Categorize the failure type
     */
    protected static function categorizeFailure(\Throwable $exception, ?int $httpStatusCode, string $errorMessage): string
    {
        // Network/Connection errors
        if ($exception instanceof ConnectException) {
            return 'network';
        }

        // Timeout errors
        if (str_contains(strtolower($errorMessage), 'timeout') || 
            str_contains(strtolower($errorMessage), 'timed out')) {
            return 'timeout';
        }

        // HTTP status code based categorization
        if ($httpStatusCode !== null) {
            // Authentication errors
            if (in_array($httpStatusCode, [401, 403])) {
                return 'authentication';
            }

            // Rate limiting
            if ($httpStatusCode === 429) {
                return 'rate_limit';
            }

            // Server errors
            if ($httpStatusCode >= 500) {
                return 'server_error';
            }

            // Invalid email/request errors
            if (in_array($httpStatusCode, [400, 422])) {
                // Check if it's specifically an email validation error
                if (str_contains(strtolower($errorMessage), 'email') || 
                    str_contains(strtolower($errorMessage), 'invalid') ||
                    str_contains(strtolower($errorMessage), 'malformed')) {
                    return 'invalid_email';
                }
                return 'server_error';
            }
        }

        // Check error message patterns
        $lowerMessage = strtolower($errorMessage);
        
        // Authentication patterns
        if (str_contains($lowerMessage, 'unauthorized') ||
            str_contains($lowerMessage, 'forbidden') ||
            str_contains($lowerMessage, 'authentication') ||
            str_contains($lowerMessage, 'credential') ||
            str_contains($lowerMessage, 'api key')) {
            return 'authentication';
        }

        // Rate limit patterns
        if (str_contains($lowerMessage, 'rate limit') ||
            str_contains($lowerMessage, 'too many requests') ||
            str_contains($lowerMessage, 'quota exceeded')) {
            return 'rate_limit';
        }

        // Invalid email patterns
        if (str_contains($lowerMessage, 'invalid email') ||
            str_contains($lowerMessage, 'malformed email') ||
            str_contains($lowerMessage, 'email address') ||
            str_contains($lowerMessage, 'bounce') ||
            str_contains($lowerMessage, 'rejected')) {
            return 'invalid_email';
        }

        // Network patterns
        if (str_contains($lowerMessage, 'connection') ||
            str_contains($lowerMessage, 'network') ||
            str_contains($lowerMessage, 'dns') ||
            str_contains($lowerMessage, 'resolve') ||
            str_contains($lowerMessage, 'could not connect')) {
            return 'network';
        }

        // Default to unknown
        return 'unknown';
    }

    /**
     * Generate a reason code for the failure
     */
    protected static function generateReasonCode(string $category, ?int $httpStatusCode, string $errorMessage): string
    {
        $code = strtoupper($category);

        // Add HTTP status code if available
        if ($httpStatusCode !== null) {
            $code .= '_' . $httpStatusCode;
        }

        // Add specific error indicators
        $lowerMessage = strtolower($errorMessage);
        
        if (str_contains($lowerMessage, 'timeout')) {
            $code .= '_TIMEOUT';
        } elseif (str_contains($lowerMessage, 'connection refused')) {
            $code .= '_CONN_REFUSED';
        } elseif (str_contains($lowerMessage, 'dns')) {
            $code .= '_DNS';
        }

        return $code;
    }

    /**
     * Get human-readable description for a failure category
     */
    public static function getCategoryDescription(string $category): string
    {
        return match($category) {
            'network' => 'Network connectivity issue - unable to reach the email service',
            'authentication' => 'Authentication failed - invalid credentials or API key',
            'rate_limit' => 'Rate limit exceeded - too many requests in a short time',
            'invalid_email' => 'Invalid email address - email format or domain issue',
            'server_error' => 'Server error - email service returned an error',
            'timeout' => 'Request timeout - email service did not respond in time',
            'unknown' => 'Unknown error - unable to categorize the failure',
            default => 'Uncategorized error'
        };
    }

    /**
     * Get suggested action for a failure category
     */
    public static function getSuggestedAction(string $category): string
    {
        return match($category) {
            'network' => 'Check internet connection and email service availability',
            'authentication' => 'Verify API credentials and webhook URL configuration',
            'rate_limit' => 'Wait before retrying or increase rate limits',
            'invalid_email' => 'Verify email address format and domain validity',
            'server_error' => 'Check email service status or try again later',
            'timeout' => 'Increase timeout settings or check network speed',
            'unknown' => 'Review error details and contact support if needed',
            default => 'Review error details'
        };
    }
}

