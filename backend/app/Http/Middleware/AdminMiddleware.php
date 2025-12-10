<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        // Try api guard first
        if (!Auth::guard('api')->check()) {
            // Fallback to default guard
            if (!Auth::check()) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }
            $user = Auth::user();
        } else {
            $user = Auth::guard('api')->user();
        }

        if (!$user || !$user->isAdmin()) {
            Log::warning('Admin access denied', [
                'user_id' => $user?->id,
                'user_role' => $user?->role,
                'path' => $request->path(),
                'method' => $request->method(),
            ]);
            return response()->json(['message' => 'Access denied. Admin privileges required.'], 403);
        }

        return $next($request);
    }
}