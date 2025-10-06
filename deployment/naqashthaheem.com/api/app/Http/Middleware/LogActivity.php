<?php

namespace App\Http\Middleware;

use App\Models\ActivityLog;
use Closure;
use Illuminate\Http\Request;

class LogActivity
{
    public function handle(Request $request, Closure $next)
    {
        // Log the request
        if (auth()->check() && $this->shouldLogRequest($request)) {
            ActivityLog::log(
                $this->getActionName($request),
                null,
                $this->getDescription($request)
            );
        }

        return $next($request);
    }

    private function shouldLogRequest(Request $request): bool
    {
        // Don't log GET requests for performance
        if ($request->isMethod('GET')) {
            return false;
        }

        // Don't log certain routes
        $skipRoutes = [
            'auth/refresh',
            'cache/stats',
        ];

        foreach ($skipRoutes as $route) {
            if (str_contains($request->path(), $route)) {
                return false;
            }
        }

        return true;
    }

    private function getActionName(Request $request): string
    {
        $method = $request->method();
        $path = $request->path();

        // Map common patterns to readable actions
        if (str_contains($path, '/login')) {
            return 'login_attempt';
        }
        
        if (str_contains($path, '/logout')) {
            return 'logout';
        }

        if ($method === 'POST' && !str_contains($path, 'bulk')) {
            return 'create';
        }

        if ($method === 'PUT' || $method === 'PATCH') {
            return 'update';
        }

        if ($method === 'DELETE') {
            return 'delete';
        }

        if (str_contains($path, 'bulk')) {
            return 'bulk_operation';
        }

        if (str_contains($path, 'approve')) {
            return 'approve';
        }

        if (str_contains($path, 'reject')) {
            return 'reject';
        }

        return strtolower($method);
    }

    private function getDescription(Request $request): string
    {
        $action = $this->getActionName($request);
        $path = $request->path();
        $user = auth()->user();

        return "{$user->name} performed {$action} on {$path}";
    }
}