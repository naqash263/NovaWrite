<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if (!Auth::guard('api')->check()) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $user = Auth::guard('api')->user();
        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Access denied. Admin privileges required.'], 403);
        }

        return $next($request);
    }
}