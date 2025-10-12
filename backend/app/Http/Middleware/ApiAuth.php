<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;

class ApiAuth
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            // Get the token from the Authorization header
            $token = $request->bearerToken();
            
            if (!$token) {
                return response()->json([
                    'message' => 'Token not provided.',
                    'error' => 'Authentication required'
                ], 401);
            }

            // Try to authenticate using the API guard
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

