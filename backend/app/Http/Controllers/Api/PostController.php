<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\N8nConfiguration;
use App\Events\NewBlogPost;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

class PostController extends Controller
{
    protected $client;

    public function __construct()
    {
        $this->client = new Client();
    }

    public function index(Request $request)
    {
        // Create cache key based on request parameters and last update timestamp
        $lastUpdated = Cache::get('posts.last_updated', now()->subDays(1));
        $cacheKey = 'posts.index.' . md5(serialize($request->all()) . $lastUpdated->timestamp);
        
        return Cache::remember($cacheKey, 900, function () use ($request) { // 15 minutes cache
            $query = Post::with(['category', 'user', 'tags'])
                ->where('is_published', true)
                ->where('approval_status', 'approved'); // Only show approved posts

            // Search filter
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('excerpt', 'like', "%{$search}%")
                      ->orWhere('content', 'like', "%{$search}%")
                      ->orWhereHas('tags', function($tagQuery) use ($search) {
                          $tagQuery->where('name', 'like', "%{$search}%");
                      });
                });
            }

            // Category filter
            if ($request->has('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            // Category slug filter
            if ($request->has('category_slug')) {
                $query->whereHas('category', function($q) use ($request) {
                    $q->where('slug', $request->category_slug);
                });
            }

            // Tags filter (multiple tags)
            if ($request->has('tags')) {
                $tags = is_array($request->tags) ? $request->tags : explode(',', $request->tags);
                $query->whereHas('tags', function($q) use ($tags) {
                    $q->whereIn('tags.id', $tags);
                });
            }

            // Tag slugs filter
            if ($request->has('tag_slugs')) {
                $tagSlugs = is_array($request->tag_slugs) ? $request->tag_slugs : explode(',', $request->tag_slugs);
                $query->whereHas('tags', function($q) use ($tagSlugs) {
                    $q->whereIn('tags.slug', $tagSlugs);
                });
            }

            // Date range filters for published date
            if ($request->has('date_from')) {
                $query->whereDate('published_at', '>=', $request->date_from);
            }

            if ($request->has('date_to')) {
                $query->whereDate('published_at', '<=', $request->date_to);
            }

            // Date range filters for created date
            if ($request->has('created_from')) {
                $query->whereDate('created_at', '>=', $request->created_from);
            }

            if ($request->has('created_to')) {
                $query->whereDate('created_at', '<=', $request->created_to);
            }

            // Date range filters for updated date
            if ($request->has('updated_from')) {
                $query->whereDate('updated_at', '>=', $request->updated_from);
            }

            if ($request->has('updated_to')) {
                $query->whereDate('updated_at', '<=', $request->updated_to);
            }

            // Year filters for different dates
            if ($request->has('year')) {
                $query->whereYear('published_at', $request->year);
            }

            if ($request->has('created_year')) {
                $query->whereYear('created_at', $request->created_year);
            }

            if ($request->has('updated_year')) {
                $query->whereYear('updated_at', $request->updated_year);
            }

            // Month filters for different dates
            if ($request->has('month')) {
                $query->whereMonth('published_at', $request->month);
            }

            if ($request->has('created_month')) {
                $query->whereMonth('created_at', $request->created_month);
            }

            if ($request->has('updated_month')) {
                $query->whereMonth('updated_at', $request->updated_month);
            }

            // Recent posts filters
            if ($request->has('recent_days')) {
                $days = (int) $request->recent_days;
                $query->where('created_at', '>=', now()->subDays($days));
            }

            if ($request->has('recent_updated_days')) {
                $days = (int) $request->recent_updated_days;
                $query->where('updated_at', '>=', now()->subDays($days));
            }

            // Since parameter - get posts created/updated after a specific timestamp
            if ($request->has('since')) {
                $since = $request->since;
                
                // Validate timestamp format (ISO 8601 or Unix timestamp)
                if (is_numeric($since)) {
                    // Unix timestamp
                    $sinceDate = \Carbon\Carbon::createFromTimestamp($since);
                } else {
                    // ISO 8601 format
                    try {
                        $sinceDate = \Carbon\Carbon::parse($since);
                    } catch (\Exception $e) {
                        return response()->json(['error' => 'Invalid since parameter format. Use ISO 8601 or Unix timestamp.'], 400);
                    }
                }
                
                // Get posts created or updated after the since timestamp
                $query->where(function($q) use ($sinceDate) {
                    $q->where('created_at', '>', $sinceDate)
                      ->orWhere('updated_at', '>', $sinceDate);
                });
            }

            // Author filter
            if ($request->has('author_id')) {
                $query->where('user_id', $request->author_id);
            }

            // Featured posts filter
            if ($request->has('featured')) {
                $query->where('is_featured', filter_var($request->featured, FILTER_VALIDATE_BOOLEAN));
            }

            // Views filter (popular posts)
            if ($request->has('min_views')) {
                $query->where('views', '>=', $request->min_views);
            }

            // Sort options
            $sortBy = $request->get('sort_by', 'published_at');
            $sortOrder = $request->get('sort_order', 'desc');
            
            $allowedSortFields = ['published_at', 'created_at', 'updated_at', 'title', 'views'];
            if (in_array($sortBy, $allowedSortFields)) {
                $query->orderBy($sortBy, $sortOrder);
            }

            // Pagination
            $perPage = $request->get('per_page', 10);
            $perPage = min($perPage, 100); // Limit to 100 per page

            return $query->paginate($perPage);
        });
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'excerpt' => 'nullable|string',
            'content' => 'required|string',
            'featured_image' => 'nullable|string',
            'category_id' => 'required|exists:categories,id',
            'is_published' => 'boolean',
            'meta_description' => 'nullable|string',
            'meta_keywords' => 'nullable|string|max:255',
            'tags' => 'nullable|array',
            'tags.*' => 'exists:tags,id',
        ]);

        $post = Post::create([
            'title' => $request->title,
            'slug' => Str::slug($request->title),
            'excerpt' => $request->excerpt,
            'content' => $request->content,
            'featured_image' => $request->featured_image,
            'category_id' => $request->category_id,
            'user_id' => auth('api')->id(),
            'is_published' => $request->is_published ?? false,
            'published_at' => $request->is_published ? now() : null,
            'meta_description' => $request->meta_description,
            'meta_keywords' => $request->meta_keywords,
        ]);

        // Attach tags if provided
        if ($request->has('tags')) {
            $post->tags()->attach($request->tags);
        }

        // Dispatch event for push notifications (only for published posts)
        if ($post->is_published) {
            event(new NewBlogPost($post));
        }

        // Send post creation data to N8n (non-blocking)
        $post->load(['category', 'user', 'tags']);
        $this->sendPostCreatedToN8n($post, $request);

        // Clear related caches - comprehensive cache invalidation
        $this->clearPostsCache();

        return response()->json($post->load(['category', 'user', 'tags']), 201);
    }

    public function show($idOrSlug)
    {
        $cacheKey = "post.{$idOrSlug}";
        
        $post = Cache::remember($cacheKey, 1800, function () use ($idOrSlug) { // 30 minutes cache
            return Post::with(['category', 'user', 'tags'])
                ->where('is_published', true)
                ->where('approval_status', 'approved') // Only show approved posts
                ->where(function($query) use ($idOrSlug) {
                    if (is_numeric($idOrSlug)) {
                        $query->where('id', $idOrSlug);
                    } else {
                        $query->where('slug', $idOrSlug);
                    }
                })
                ->firstOrFail();
        });

        // Increment views (this shouldn't be cached)
        Post::where('id', $post->id)->increment('views');

        return response()->json($post);
    }

    public function update(Request $request, $id)
    {
        $post = Post::findOrFail($id);

        $request->validate([
            'title' => 'required|string|max:255',
            'excerpt' => 'nullable|string',
            'content' => 'nullable|string', // Made optional for updates
            'featured_image' => 'nullable|string',
            'category_id' => 'required|exists:categories,id',
            'is_published' => 'boolean',
            'meta_description' => 'nullable|string',
            'meta_keywords' => 'nullable|string|max:255',
            'approval_status' => 'nullable|in:pending,approved,rejected,draft',
            'approved_by' => 'nullable|integer|exists:users,id',
            'approved_at' => 'nullable|date',
            'rejection_reason' => 'nullable|string',
            'tags' => 'nullable|array',
            'tags.*' => 'exists:tags,id',
        ]);

        // Prepare update data
        $updateData = [
            'title' => $request->title,
            'slug' => Str::slug($request->title),
            'excerpt' => $request->excerpt,
            'featured_image' => $request->featured_image,
            'category_id' => $request->category_id,
            'is_published' => $request->is_published ?? $post->is_published,
            'published_at' => $request->is_published && !$post->is_published ? now() : $post->published_at,
            'meta_description' => $request->meta_description,
            'meta_keywords' => $request->meta_keywords,
            'approval_status' => $request->approval_status ?? $post->approval_status,
            'approved_by' => $request->approved_by ?? $post->approved_by,
            'approved_at' => $request->approved_at ?? $post->approved_at,
            'rejection_reason' => $request->rejection_reason ?? $post->rejection_reason,
        ];

        // Only update content if provided
        if ($request->has('content') && $request->content !== null) {
            $updateData['content'] = $request->content;
        }

        $post->update($updateData);

        // Sync tags if provided
        if ($request->has('tags')) {
            $post->tags()->sync($request->tags);
        }

        // Send post update data to N8n (non-blocking)
        $post->load(['category', 'user', 'tags']);
        $this->sendPostUpdatedToN8n($post, $request);

        // Clear related caches
        $this->clearPostsCache();

        return response()->json($post->load(['category', 'user', 'tags']));
    }

    public function destroy($id)
    {
        $post = Post::findOrFail($id);
        $post->delete();
        
        // Clear related caches
        $this->clearPostsCache();
        
        return response()->json(['message' => 'Post deleted successfully']);
    }

    public function allPosts(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $perPage = min($perPage, 50); // Limit to maximum 50 per page
        
        // Admin API should show all posts regardless of approval status
        $posts = Post::with(['category', 'user', 'tags'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json($posts);
    }

    public function stats()
    {
        $total = Post::count();
        $published = Post::where('is_published', true)->count();
        $drafts = Post::where('is_published', false)->count();

        return response()->json([
            'total' => $total,
            'published' => $published,
            'drafts' => $drafts
        ]);
    }

    /**
     * Clear all posts-related caches
     */
    private function clearPostsCache()
    {
        // Clear popular posts cache
        Cache::forget('posts.popular');
        
        // Clear individual post caches (we'll clear the most recent ones)
        $recentPosts = Post::orderBy('created_at', 'desc')->take(10)->get();
        foreach ($recentPosts as $post) {
            Cache::forget("post.{$post->id}");
            Cache::forget("post.{$post->slug}");
        }
        
        // Clear posts index caches with common parameter combinations
        $commonParams = [
            '', // No parameters
            serialize(['page' => 1]),
            serialize(['page' => 1, 'per_page' => 10]),
            serialize(['search' => '']),
            serialize(['category_id' => null]),
        ];
        
        foreach ($commonParams as $params) {
            $cacheKey = 'posts.index.' . md5($params);
            Cache::forget($cacheKey);
        }
        
        // Clear cache with current timestamp to force refresh
        Cache::put('posts.last_updated', now(), 86400); // 24 hours
        
        // Clear sitemap cache so it regenerates with new posts
        \App\Http\Controllers\Api\SitemapController::clearCache();
    }

    /**
     * Clear posts cache immediately (useful for testing)
     */
    public function clearCache()
    {
        $this->clearPostsCache();
        
        return response()->json([
            'message' => 'Posts cache cleared successfully',
            'cleared_at' => now()
        ]);
    }

    /**
     * Get latest posts since a specific timestamp
     * This is a convenience method for getting only new posts
     */
    public function latest(Request $request)
    {
        $request->validate([
            'since' => 'required|string',
            'limit' => 'nullable|integer|min:1|max:100',
            'include_updated' => 'nullable|boolean'
        ]);

        $since = $request->since;
        $limit = $request->get('limit', 20);
        $includeUpdated = $request->get('include_updated', true);

        // Validate timestamp format
        if (is_numeric($since)) {
            $sinceDate = \Carbon\Carbon::createFromTimestamp($since);
        } else {
            try {
                $sinceDate = \Carbon\Carbon::parse($since);
            } catch (\Exception $e) {
                return response()->json(['error' => 'Invalid since parameter format. Use ISO 8601 or Unix timestamp.'], 400);
            }
        }

        $query = Post::with(['category', 'user', 'tags'])
            ->where('is_published', true)
            ->where('approval_status', 'approved');

        if ($includeUpdated) {
            // Get posts created OR updated after the since timestamp
            $query->where(function($q) use ($sinceDate) {
                $q->where('created_at', '>', $sinceDate)
                  ->orWhere('updated_at', '>', $sinceDate);
            });
        } else {
            // Get only posts created after the since timestamp
            $query->where('created_at', '>', $sinceDate);
        }

        $posts = $query->orderBy('created_at', 'desc')
                      ->limit($limit)
                      ->get();

        return response()->json([
            'posts' => $posts,
            'count' => $posts->count(),
            'since' => $sinceDate->toISOString(),
            'fetched_at' => now()->toISOString()
        ]);
    }

    /**
     * Send post creation data to N8n webhook (non-blocking)
     */
    private function sendPostCreatedToN8n(Post $post, Request $request): void
    {
        try {
            $config = N8nConfiguration::getActive();
            
            if (!$config || !$config->isValidWebhookUrl()) {
                // Silently fail if N8n is not configured
                return;
            }

            $user = Auth::user();
            $postUrl = config('app.url') . '/posts/' . ($post->slug ?? $post->id);

            // Prepare payload
            $payload = [
                'action' => 'post_created',
                'post' => [
                    'id' => $post->id,
                    'title' => $post->title,
                    'slug' => $post->slug,
                    'url' => $postUrl,
                    'excerpt' => $post->excerpt,
                    'content' => substr(strip_tags($post->content ?? ''), 0, 500), // First 500 chars
                    'featured_image' => $post->featured_image,
                    'category_id' => $post->category_id,
                    'category' => $post->category ? [
                        'id' => $post->category->id,
                        'name' => $post->category->name,
                        'slug' => $post->category->slug ?? null,
                    ] : null,
                    'is_published' => $post->is_published,
                    'published_at' => $post->published_at?->toISOString(),
                    'meta_description' => $post->meta_description,
                    'meta_keywords' => $post->meta_keywords,
                    'views' => $post->views ?? 0,
                    'approval_status' => $post->approval_status ?? 'pending',
                    'tags' => $post->tags ? $post->tags->map(function($tag) {
                        return [
                            'id' => $tag->id,
                            'name' => $tag->name,
                            'slug' => $tag->slug ?? null,
                        ];
                    })->toArray() : [],
                    'created_at' => $post->created_at?->toISOString(),
                    'updated_at' => $post->updated_at?->toISOString(),
                ],
                'author' => [
                    'user_id' => $user?->id,
                    'user_name' => $user?->name,
                    'user_type' => $user ? ($user->isAdmin() ? 'admin' : 'user') : 'guest',
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ],
                'timestamp' => now()->toISOString(),
            ];

            // Send to N8n (fire and forget - non-blocking)
            try {
                $this->client->post($config->webhook_url, [
                    'json' => $payload,
                    'timeout' => min(5, $config->webhook_timeout ?? 30),
                    'connect_timeout' => 2,
                    'headers' => [
                        'Content-Type' => 'application/json',
                        'Accept' => 'application/json'
                    ]
                ]);
                
                Log::debug('Post creation data sent to N8n', [
                    'post_id' => $post->id
                ]);
            } catch (RequestException $e) {
                // Silently fail - don't block the response
                Log::debug('N8n webhook call failed (non-critical)', [
                    'post_id' => $post->id,
                    'error' => $e->getMessage()
                ]);
            }

        } catch (\Exception $e) {
            // Log error but don't throw (non-blocking)
            Log::warning('Error sending post creation data to N8n', [
                'post_id' => $post->id ?? null,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Send post update data to N8n webhook (non-blocking)
     */
    private function sendPostUpdatedToN8n(Post $post, Request $request): void
    {
        try {
            $config = N8nConfiguration::getActive();
            
            if (!$config || !$config->isValidWebhookUrl()) {
                // Silently fail if N8n is not configured
                return;
            }

            $user = Auth::user();
            $postUrl = config('app.url') . '/posts/' . ($post->slug ?? $post->id);

            // Prepare payload
            $payload = [
                'action' => 'post_updated',
                'post' => [
                    'id' => $post->id,
                    'title' => $post->title,
                    'slug' => $post->slug,
                    'url' => $postUrl,
                    'excerpt' => $post->excerpt,
                    'content' => substr(strip_tags($post->content ?? ''), 0, 500), // First 500 chars
                    'featured_image' => $post->featured_image,
                    'category_id' => $post->category_id,
                    'category' => $post->category ? [
                        'id' => $post->category->id,
                        'name' => $post->category->name,
                        'slug' => $post->category->slug ?? null,
                    ] : null,
                    'is_published' => $post->is_published,
                    'published_at' => $post->published_at?->toISOString(),
                    'meta_description' => $post->meta_description,
                    'meta_keywords' => $post->meta_keywords,
                    'views' => $post->views ?? 0,
                    'approval_status' => $post->approval_status ?? 'pending',
                    'tags' => $post->tags ? $post->tags->map(function($tag) {
                        return [
                            'id' => $tag->id,
                            'name' => $tag->name,
                            'slug' => $tag->slug ?? null,
                        ];
                    })->toArray() : [],
                    'created_at' => $post->created_at?->toISOString(),
                    'updated_at' => $post->updated_at?->toISOString(),
                ],
                'author' => [
                    'user_id' => $user?->id,
                    'user_name' => $user?->name,
                    'user_type' => $user ? ($user->isAdmin() ? 'admin' : 'user') : 'guest',
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ],
                'timestamp' => now()->toISOString(),
            ];

            // Send to N8n (fire and forget - non-blocking)
            try {
                $this->client->post($config->webhook_url, [
                    'json' => $payload,
                    'timeout' => min(5, $config->webhook_timeout ?? 30),
                    'connect_timeout' => 2,
                    'headers' => [
                        'Content-Type' => 'application/json',
                        'Accept' => 'application/json'
                    ]
                ]);
                
                Log::debug('Post update data sent to N8n', [
                    'post_id' => $post->id
                ]);
            } catch (RequestException $e) {
                // Silently fail - don't block the response
                Log::debug('N8n webhook call failed (non-critical)', [
                    'post_id' => $post->id,
                    'error' => $e->getMessage()
                ]);
            }

        } catch (\Exception $e) {
            // Log error but don't throw (non-blocking)
            Log::warning('Error sending post update data to N8n', [
                'post_id' => $post->id ?? null,
                'error' => $e->getMessage()
            ]);
        }
    }
}
