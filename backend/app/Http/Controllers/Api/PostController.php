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
        // Create cache key based on request parameters
        $cacheKey = 'posts.index.' . md5(serialize($request->all()));
        
        return Cache::remember($cacheKey, 900, function () use ($request) { // 15 minutes cache
            $query = Post::with(['category', 'user'])
                ->where('is_published', true);

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('excerpt', 'like', "%{$search}%")
                      ->orWhere('content', 'like', "%{$search}%");
                });
            }

            if ($request->has('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            return $query->orderBy('published_at', 'desc')->paginate(10);
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

        // Clear related caches
        Cache::forget('posts.popular');
        Cache::forget('posts.index.*'); // This would need a more sophisticated cache invalidation

        return response()->json($post->load(['category', 'user']), 201);
    }

    public function show($idOrSlug)
    {
        $cacheKey = "post.{$idOrSlug}";
        
        $post = Cache::remember($cacheKey, 1800, function () use ($idOrSlug) { // 30 minutes cache
            return Post::with(['category', 'user'])
                ->where('is_published', true)
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
        ]);

        return response()->json($post->load(['category', 'user']));
    }

    public function destroy($id)
    {
        $post = Post::findOrFail($id);
        $post->delete();
        return response()->json(['message' => 'Post deleted successfully']);
    }

    public function allPosts(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $perPage = min($perPage, 50); // Limit to maximum 50 per page
        
        $posts = Post::with(['category', 'user'])
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
}
