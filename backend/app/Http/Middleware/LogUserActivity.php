<?php

namespace App\Http\Middleware;

use App\Models\UserActivity;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LogUserActivity
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only log for authenticated users
        if (auth()->check()) {
            $this->logActivity($request, $response);
        }

        return $response;
    }

    /**
     * Log the user activity
     */
    protected function logActivity(Request $request, Response $response): void
    {
        try {
            $user = auth()->user();
            $method = $request->method();
            $path = $request->path();
            $statusCode = $response->getStatusCode();

            // Determine activity type based on the route
            $activityType = $this->determineActivityType($method, $path, $statusCode);

            // Skip if no specific activity type
            if (!$activityType) {
                return;
            }

            // Generate description
            $description = $this->generateDescription($method, $path, $statusCode);

            // Get metadata
            $metadata = [
                'method' => $method,
                'path' => $path,
                'status_code' => $statusCode,
                'query_params' => $request->query(),
            ];

            // Log the activity
            UserActivity::log(
                $user->id,
                $activityType,
                $description,
                $metadata,
                $request->ip(),
                $request->userAgent()
            );
        } catch (\Exception $e) {
            // Silently fail - don't break the request flow
            \Log::error('Failed to log user activity: ' . $e->getMessage());
        }
    }

    /**
     * Determine activity type based on the route
     */
    protected function determineActivityType(string $method, string $path, int $statusCode): ?string
    {
        // Skip logging for certain paths
        if (str_contains($path, 'health') || str_contains($path, 'user-activities')) {
            return null;
        }

        // Only log successful requests (2xx status codes)
        if ($statusCode < 200 || $statusCode >= 300) {
            return null;
        }

        // Authentication routes
        if (str_contains($path, 'auth/login')) {
            return 'login';
        }
        if (str_contains($path, 'auth/logout')) {
            return 'logout';
        }
        if (str_contains($path, 'auth/register')) {
            return 'register';
        }

        // CV routes
        if (str_contains($path, 'cv-templates') && $method === 'POST') {
            return 'cv_template_created';
        }
        if (str_contains($path, 'cv-ai/extract')) {
            return 'cv_extracted';
        }
        if (str_contains($path, 'cv-builder') && $method === 'POST') {
            return 'cv_created';
        }

        // Course routes
        if (str_contains($path, 'courses') && $method === 'POST') {
            return 'course_created';
        }
        if (str_contains($path, 'enrollments') && $method === 'POST') {
            return 'course_enrolled';
        }
        if (str_contains($path, 'lessons') && str_contains($path, 'complete')) {
            return 'lesson_completed';
        }

        // Blog routes
        if (str_contains($path, 'blog-posts') && $method === 'POST') {
            return 'blog_post_created';
        }

        // File routes
        if (str_contains($path, 'files') && $method === 'POST') {
            return 'file_uploaded';
        }

        // Default to generic action
        if ($method === 'POST') {
            return 'created';
        }
        if ($method === 'PUT' || $method === 'PATCH') {
            return 'updated';
        }
        if ($method === 'DELETE') {
            return 'deleted';
        }
        if ($method === 'GET') {
            return 'viewed';
        }

        return null;
    }

    /**
     * Generate a human-readable description
     */
    protected function generateDescription(string $method, string $path, int $statusCode): string
    {
        $action = match($method) {
            'GET' => 'Viewed',
            'POST' => 'Created',
            'PUT', 'PATCH' => 'Updated',
            'DELETE' => 'Deleted',
            default => 'Accessed'
        };

        // Clean up the path for display
        $resource = str_replace('api/', '', $path);
        $resource = str_replace('-', ' ', $resource);
        $resource = ucwords($resource);

        return "{$action} {$resource}";
    }
}
