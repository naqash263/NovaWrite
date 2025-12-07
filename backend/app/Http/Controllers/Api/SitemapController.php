<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Workflow;
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
        $xml .= $this->addUrl($baseUrl, '/resources', $today, 'weekly', '0.8');
        
        // Career Tools
        $xml .= $this->addUrl($baseUrl, '/resources/cv-builder', $today, 'monthly', '0.7');
        $xml .= $this->addUrl($baseUrl, '/resources/linkedin-optimizer', $today, 'monthly', '0.7');
        $xml .= $this->addUrl($baseUrl, '/resources/cover-letter-generator', $today, 'monthly', '0.7');
        $xml .= $this->addUrl($baseUrl, '/resources/job-search-optimizer', $today, 'monthly', '0.7');
        $xml .= $this->addUrl($baseUrl, '/resources/skills-assessment', $today, 'monthly', '0.7');
        $xml .= $this->addUrl($baseUrl, '/resources/interview-prep', $today, 'monthly', '0.7');
        $xml .= $this->addUrl($baseUrl, '/resources/salary-negotiation', $today, 'monthly', '0.7');
        $xml .= $this->addUrl($baseUrl, '/resources/career-path-planner', $today, 'monthly', '0.7');
        
        // Conversion Tools
        $xml .= $this->addUrl($baseUrl, '/resources/conversion-tools', $today, 'weekly', '0.8');
        // Individual Conversion Tools
        $conversionTools = ['length', 'weight', 'volume', 'temperature', 'area', 'speed', 'currency', 'timezone', 'date', 'number', 'text', 'color', 'filesize', 'percentage', 'bmi'];
        foreach ($conversionTools as $tool) {
            $xml .= $this->addUrl($baseUrl, '/resources/conversion-tools?tool=' . $tool, $today, 'monthly', '0.7');
        }
        
        // Utility Tools
        $xml .= $this->addUrl($baseUrl, '/resources/utility-tools', $today, 'weekly', '0.8');
        // Individual Utility Tools
        $utilityTools = [
            'password-generator', 'qr-code-generator', 'image-resizer', 'text-to-image', 'word-counter',
            'loan-calculator', 'tip-calculator', 'compound-interest-calculator', 'json-formatter',
            'base64-encoder', 'url-encoder', 'regex-tester', 'uuid-generator', 'jwt-decoder',
            'pdf-merger', 'pdf-splitter', 'pdf-compressor', 'pdf-rotate', 'lorem-ipsum-generator',
            'text-case-converter', 'hash-generator', 'image-compressor', 'sql-formatter',
            'css-formatter', 'html-formatter', 'image-format-converter', 'color-picker',
            'markdown-preview', 'file-converter', 'document-converter', 'excel-csv-converter'
        ];
        foreach ($utilityTools as $tool) {
            $xml .= $this->addUrl($baseUrl, '/resources/utility-tools?tool=' . $tool, $today, 'monthly', '0.7');
        }
        
        // AI Tools
        $xml .= $this->addUrl($baseUrl, '/resources/ai-tools', $today, 'weekly', '0.8');
        // Individual AI Tools
        $aiTools = ['text-summarizer', 'article-rewriter', 'grammar-checker', 'language-translator', 'keyword-extractor'];
        foreach ($aiTools as $tool) {
            $xml .= $this->addUrl($baseUrl, '/resources/ai-tools?tool=' . $tool, $today, 'monthly', '0.7');
        }
        
        // Projects
        $xml .= $this->addUrl($baseUrl, '/projects', $today, 'weekly', '0.8');
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
                
                // Generate date-based URL: /blog/YYYY/MM/DD/slug
                $publishDate = $post->published_at 
                    ? Carbon::parse($post->published_at)
                    : Carbon::parse($post->updated_at ?? $today);
                $datePath = $publishDate->format('Y/m/d');
                
                $xml .= $this->addUrl($baseUrl, '/blog/' . $datePath . '/' . $post->slug, $lastmod, 'weekly', '0.8', $post->featured_image);
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
                
                // Generate date-based URL: /workflows/YYYY/MM/DD/slug
                $publishDate = $workflow->published_at 
                    ? Carbon::parse($workflow->published_at)
                    : Carbon::parse($workflow->updated_at ?? $today);
                $datePath = $publishDate->format('Y/m/d');
                
                $xml .= $this->addUrl($baseUrl, '/workflows/' . $datePath . '/' . $workflow->slug, $lastmod, 'weekly', '0.8', $workflow->image_url);
            }
        } catch (\Exception $e) {
            \Log::warning('Error fetching workflows for sitemap: ' . $e->getMessage());
        }

        // Projects (if Project model exists)
        try {
            if (class_exists(\App\Models\Project::class)) {
                $projects = \App\Models\Project::where('status', 'published')
                    ->select('slug', 'updated_at', 'created_at', 'image_url')
                    ->orderBy('created_at', 'desc')
                    ->get();

                foreach ($projects as $project) {
                    $lastmod = $project->updated_at 
                        ? Carbon::parse($project->updated_at)->format('Y-m-d')
                        : ($project->created_at 
                            ? Carbon::parse($project->created_at)->format('Y-m-d')
                            : $today);
                    
                    $xml .= $this->addUrl($baseUrl, '/projects/' . $project->slug, $lastmod, 'monthly', '0.7', $project->image_url);
                }
            }
        } catch (\Exception $e) {
            \Log::warning('Error fetching projects for sitemap: ' . $e->getMessage());
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

