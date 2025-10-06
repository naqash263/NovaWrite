<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Post;
use App\Models\Workflow;
use App\Models\WorkflowCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Artisan;

class CacheController extends Controller
{
    public function clearAllCache()
    {
        try {
            // Clear application cache
            Cache::flush();
            
            // Clear configuration cache
            Artisan::call('config:clear');
            
            // Clear route cache
            Artisan::call('route:clear');
            
            // Clear view cache
            Artisan::call('view:clear');
            
            return response()->json([
                'message' => 'All caches cleared successfully',
                'cleared_at' => now()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error clearing cache',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function clearSpecificCache(Request $request)
    {
        $cacheKey = $request->get('key');
        
        if (!$cacheKey) {
            return response()->json(['message' => 'Cache key is required'], 400);
        }

        Cache::forget($cacheKey);
        
        return response()->json([
            'message' => "Cache key '{$cacheKey}' cleared successfully"
        ]);
    }

    public function getCacheStats()
    {
        // Get cache statistics
        $stats = [
            'posts_cached' => Cache::has('posts.popular') ? 'Yes' : 'No',
            'workflows_cached' => Cache::has('workflows.featured') ? 'Yes' : 'No',
            'categories_cached' => Cache::has('categories.all') ? 'Yes' : 'No',
            'workflow_categories_cached' => Cache::has('workflow_categories.all') ? 'Yes' : 'No',
        ];

        return response()->json($stats);
    }

    public function warmCache()
    {
        try {
            // Warm up frequently accessed data
            Cache::remember('categories.all', 3600, function () {
                return Category::orderBy('name')->get();
            });

            Cache::remember('workflow_categories.all', 3600, function () {
                return WorkflowCategory::orderBy('name')->get();
            });

            Cache::remember('posts.popular', 1800, function () {
                return Post::where('status', 'published')
                    ->where('approval_status', 'approved')
                    ->orderBy('created_at', 'desc')
                    ->take(10)
                    ->with(['category', 'user'])
                    ->get();
            });

            Cache::remember('workflows.featured', 1800, function () {
                return Workflow::where('status', 'active')
                    ->where('approval_status', 'approved')
                    ->orderBy('created_at', 'desc')
                    ->take(10)
                    ->with(['category'])
                    ->get();
            });

            return response()->json([
                'message' => 'Cache warmed successfully',
                'warmed_at' => now()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error warming cache',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}