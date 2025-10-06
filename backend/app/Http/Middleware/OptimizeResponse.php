<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class OptimizeResponse
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only optimize successful responses
        if ($response->getStatusCode() !== 200) {
            return $response;
        }

        // Add performance-related headers
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Set caching headers for API responses
        if ($request->is('api/*')) {
            // Cache static data for 5 minutes
            if ($request->isMethod('GET') && $this->isCacheableRoute($request)) {
                $response->headers->set('Cache-Control', 'public, max-age=300, s-maxage=300');
                $response->headers->set('Vary', 'Accept-Encoding, Authorization');
            }
            
            // Set ETag for cacheable responses
            if ($request->isMethod('GET')) {
                $etag = md5($response->getContent());
                $response->headers->set('ETag', '"' . $etag . '"');
                
                // Check if client has cached version
                if ($request->headers->get('If-None-Match') === '"' . $etag . '"') {
                    return response('', 304);
                }
            }
        }

        // Compress response if supported
        if ($this->shouldCompress($request, $response)) {
            $this->compressResponse($response);
        }

        // Add resource hints for critical resources
        if ($request->is('/') || $request->is('login') || $request->is('admin*')) {
            $this->addResourceHints($response);
        }

        return $response;
    }

    private function isCacheableRoute(Request $request): bool
    {
        $cacheableRoutes = [
            'api/posts',
            'api/workflows',
            'api/categories',
            'api/workflow-categories',
            'api/courses',
        ];

        foreach ($cacheableRoutes as $route) {
            if ($request->is($route)) {
                return true;
            }
        }

        return false;
    }

    private function shouldCompress(Request $request, Response $response): bool
    {
        // Don't compress if already compressed
        if ($response->headers->has('Content-Encoding')) {
            return false;
        }

        // Don't compress small responses
        $content = $response->getContent();
        if (strlen($content) < 1024) {
            return false;
        }

        // Check if client accepts gzip
        $acceptEncoding = $request->headers->get('Accept-Encoding', '');
        return str_contains($acceptEncoding, 'gzip');
    }

    private function compressResponse(Response $response): void
    {
        $content = $response->getContent();
        $compressed = gzencode($content, 6); // Compression level 6 for balance

        if ($compressed !== false) {
            $response->setContent($compressed);
            $response->headers->set('Content-Encoding', 'gzip');
            $response->headers->set('Content-Length', strlen($compressed));
        }
    }

    private function addResourceHints(Response $response): void
    {
        $hints = [
            '<https://fonts.googleapis.com>; rel=preconnect; crossorigin',
            '<https://fonts.gstatic.com>; rel=preconnect; crossorigin',
        ];

        $response->headers->set('Link', implode(', ', $hints));
    }
}