<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Workflow;
use App\Models\Course;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class SitemapController extends Controller
{
    /**
     * Generate dynamic sitemap XML including all blog posts and workflows
     */
    public function index(): Response
    {
        // Cache the sitemap for 1 hour
        // Cache key includes last update timestamps to auto-invalidate when content changes
        $lastPostUpdate = Cache::get('posts.last_updated', now()->subDays(1))->timestamp;
        $lastWorkflowUpdate = Cache::get('workflows.last_updated', now()->subDays(1))->timestamp;
        $cacheKey = 'sitemap.xml.' . max($lastPostUpdate, $lastWorkflowUpdate);
        
        $sitemap = Cache::remember($cacheKey, 3600, function () {
            return $this->generateSitemap();
        });

        return response($sitemap, 200)
            ->header('Content-Type', 'application/xml; charset=utf-8')
            ->header('Cache-Control', 'public, max-age=3600');
    }

    /**
     * Clear sitemap cache (call this when posts/workflows are updated)
     */
    public static function clearCache(): void
    {
        Cache::forget('sitemap.xml');
        // Also clear any timestamped cache keys
        Cache::forget('sitemap.xml.' . Cache::get('posts.last_updated', now())->timestamp);
        Cache::forget('sitemap.xml.' . Cache::get('workflows.last_updated', now())->timestamp);
    }

    /**
     * Generate the sitemap XML content
     */
    private function generateSitemap(): string
    {
        $baseUrl = config('app.url', 'https://naqashthaheem.com');
        $today = Carbon::now()->format('Y-m-d');

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' . "\n";
        $xml .= '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' . "\n";
        $xml .= '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">' . "\n\n";

        // Static pages
        $xml .= $this->addUrl($baseUrl, '/', $today, 'weekly', '1.0');
        $xml .= $this->addUrl($baseUrl, '/about', $today, 'monthly', '0.8');
        $xml .= $this->addUrl($baseUrl, '/workflows', $today, 'daily', '0.9');
        $xml .= $this->addUrl($baseUrl, '/blog', $today, 'daily', '0.9');
        $xml .= $this->addUrl($baseUrl, '/contact', $today, 'monthly', '0.7');
        $xml .= $this->addUrl($baseUrl, '/courses', $today, 'weekly', '0.8');
        $xml .= $this->addUrl($baseUrl, '/resources', $today, 'weekly', '0.8');
        $xml .= $this->addUrl($baseUrl, '/resources/cv-builder', $today, 'monthly', '0.7');
        $xml .= $this->addUrl($baseUrl, '/resources/linkedin-optimizer', $today, 'monthly', '0.7');
        $xml .= $this->addUrl($baseUrl, '/resources/cover-letter-generator', $today, 'monthly', '0.7');
        $xml .= $this->addUrl($baseUrl, '/resources/job-search-optimizer', $today, 'monthly', '0.7');
        $xml .= $this->addUrl($baseUrl, '/resources/skills-assessment', $today, 'monthly', '0.7');
        $xml .= $this->addUrl($baseUrl, '/resources/interview-prep', $today, 'monthly', '0.7');
        $xml .= $this->addUrl($baseUrl, '/resources/salary-negotiation', $today, 'monthly', '0.7');
        $xml .= $this->addUrl($baseUrl, '/resources/career-path-planner', $today, 'monthly', '0.7');
        $xml .= $this->addUrl($baseUrl, '/privacy-policy', $today, 'yearly', '0.3');
        $xml .= $this->addUrl($baseUrl, '/terms-of-service', $today, 'yearly', '0.3');
        $xml .= $this->addUrl($baseUrl, '/cookie-policy', $today, 'yearly', '0.3');
        $xml .= $this->addUrl($baseUrl, '/login', $today, 'monthly', '0.4');
        $xml .= $this->addUrl($baseUrl, '/register', $today, 'monthly', '0.4');

        // Blog posts
        try {
            $posts = Post::where('is_published', true)
                ->where('approval_status', 'approved')
                ->select('slug', 'updated_at', 'published_at', 'featured_image')
                ->orderBy('published_at', 'desc')
                ->get();

            foreach ($posts as $post) {
                $lastmod = $post->updated_at 
                    ? Carbon::parse($post->updated_at)->format('Y-m-d')
                    : ($post->published_at 
                        ? Carbon::parse($post->published_at)->format('Y-m-d')
                        : $today);
                
                $xml .= $this->addUrl($baseUrl, '/blog/' . $post->slug, $lastmod, 'weekly', '0.8', $post->featured_image);
            }
        } catch (\Exception $e) {
            \Log::warning('Error fetching posts for sitemap: ' . $e->getMessage());
        }

        // Workflows
        try {
            $workflows = Workflow::published()
                ->where('status', 'published')
                ->select('slug', 'updated_at', 'published_at', 'image_url')
                ->orderBy('published_at', 'desc')
                ->get();

            foreach ($workflows as $workflow) {
                $lastmod = $workflow->updated_at 
                    ? Carbon::parse($workflow->updated_at)->format('Y-m-d')
                    : ($workflow->published_at 
                        ? Carbon::parse($workflow->published_at)->format('Y-m-d')
                        : $today);
                
                $xml .= $this->addUrl($baseUrl, '/workflows/' . $workflow->slug, $lastmod, 'weekly', '0.8', $workflow->image_url);
            }
        } catch (\Exception $e) {
            \Log::warning('Error fetching workflows for sitemap: ' . $e->getMessage());
        }

        // Courses
        try {
            $courses = Course::published()
                ->select('slug', 'updated_at', 'created_at', 'image_url')
                ->orderBy('created_at', 'desc')
                ->get();

            foreach ($courses as $course) {
                $lastmod = $course->updated_at 
                    ? Carbon::parse($course->updated_at)->format('Y-m-d')
                    : ($course->created_at 
                        ? Carbon::parse($course->created_at)->format('Y-m-d')
                        : $today);
                
                $xml .= $this->addUrl($baseUrl, '/courses/' . $course->slug, $lastmod, 'monthly', '0.7', $course->image_url);
            }
        } catch (\Exception $e) {
            \Log::warning('Error fetching courses for sitemap: ' . $e->getMessage());
        }

        $xml .= '</urlset>';

        return $xml;
    }

    /**
     * Add a URL entry to the sitemap
     */
    private function addUrl(string $baseUrl, string $path, string $lastmod, string $changefreq, string $priority, ?string $imageUrl = null): string
    {
        $url = htmlspecialchars(rtrim($baseUrl, '/') . $path);
        $xml = "  <url>\n";
        $xml .= "    <loc>{$url}</loc>\n";
        $xml .= "    <lastmod>{$lastmod}</lastmod>\n";
        $xml .= "    <changefreq>{$changefreq}</changefreq>\n";
        $xml .= "    <priority>{$priority}</priority>\n";
        
        if ($imageUrl) {
            $fullImageUrl = str_starts_with($imageUrl, 'http') 
                ? $imageUrl 
                : rtrim($baseUrl, '/') . '/' . ltrim($imageUrl, '/');
            $xml .= "    <image:image>\n";
            $xml .= "      <image:loc>" . htmlspecialchars($fullImageUrl) . "</image:loc>\n";
            $xml .= "    </image:image>\n";
        }
        
        $xml .= "  </url>\n\n";
        return $xml;
    }
}

