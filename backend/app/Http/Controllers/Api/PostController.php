<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;

class PostController extends Controller
{
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
            'approval_status' => 'nullable|in:pending,approved,rejected,draft',
            'approved_by' => 'nullable|integer|exists:users,id',
            'approved_at' => 'nullable|date',
            'rejection_reason' => 'nullable|string',
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
            'approval_status' => $request->approval_status ?? 'pending',
            'approved_by' => $request->approved_by,
            'approved_at' => $request->approved_at,
            'rejection_reason' => $request->rejection_reason,
        ]);

        // Attach tags if provided
        if ($request->has('tags')) {
            $post->tags()->attach($request->tags);
        }

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
            'content' => 'required|string',
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

        $post->update([
            'title' => $request->title,
            'slug' => Str::slug($request->title),
            'excerpt' => $request->excerpt,
            'content' => $request->content,
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
        ]);

        // Sync tags if provided
        if ($request->has('tags')) {
            $post->tags()->sync($request->tags);
        }

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
}
