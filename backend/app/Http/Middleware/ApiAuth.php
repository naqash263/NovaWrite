<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use App\Models\ApiToken;

class ApiAuth
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Get the token from the Authorization header
        $token = $request->bearerToken();
        
        if (!$token) {
            return response()->json([
                'message' => 'Token not provided.',
                'error' => 'Authentication required'
            ], 401);
        }

        // First, try to authenticate with API Token (from admin panel)
        $apiToken = ApiToken::where('token', $token)->first();
        
        if ($apiToken) {
            // Check if token is expired
            if ($apiToken->isExpired()) {
                return response()->json([
                    'message' => 'API token has expired.',
                    'error' => 'Authentication required'
                ], 401);
            }
            
            // Update last used timestamp
            $apiToken->update(['last_used_at' => now()]);
            
            // Set the authenticated user
            Auth::guard('api')->setUser($apiToken->user);
            
            return $next($request);
        }

        // If not an API token, try JWT authentication
        try {
            $user = Auth::guard('api')->setToken($token)->user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'User not found.',
                    'error' => 'Authentication required'
                ], 401);
            }

            // Set the authenticated user
            Auth::guard('api')->setUser($user);
            
        } catch (JWTException $e) {
            return response()->json([
                'message' => 'Token is invalid.',
                'error' => 'Authentication required'
            ], 401);
        }

        return $next($request);
    }
}

