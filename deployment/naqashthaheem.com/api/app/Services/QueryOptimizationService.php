<?php

namespace App\Services;

use App\Models\Post;
use App\Models\Workflow;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class QueryOptimizationService
{
    /**
     * Get posts with optimized query using joins instead of separate queries
     */
    public function getOptimizedPosts($limit = 10, $categoryId = null)
    {
        $query = DB::table('posts')
            ->join('users', 'posts.user_id', '=', 'users.id')
            ->join('categories', 'posts.category_id', '=', 'categories.id')
            ->select([
                'posts.id',
                'posts.title',
                'posts.slug',
                'posts.excerpt',
                'posts.featured_image',
                'posts.published_at',
                'posts.views',
                'posts.meta_description',
                'users.name as author_name',
                'categories.name as category_name',
                'categories.slug as category_slug'
            ])
            ->where('posts.is_published', true);

        if ($categoryId) {
            $query->where('posts.category_id', $categoryId);
        }

        return $query->orderBy('posts.published_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get workflows with optimized query
     */
    public function getOptimizedWorkflows($limit = 10, $categoryId = null)
    {
        $query = DB::table('workflows')
            ->join('workflow_categories', 'workflows.category_id', '=', 'workflow_categories.id')
            ->leftJoin('users', 'workflows.user_id', '=', 'users.id')
            ->select([
                'workflows.id',
                'workflows.title',
                'workflows.slug',
                'workflows.description',
                'workflows.steps',
                'workflows.status',
                'workflows.created_at',
                'workflow_categories.name as category_name',
                'workflow_categories.slug as category_slug',
                'users.name as author_name'
            ])
            ->where('workflows.status', 'active');

        if ($categoryId) {
            $query->where('workflows.category_id', $categoryId);
        }

        return $query->orderBy('workflows.created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get dashboard statistics with a single optimized query
     */
    public function getDashboardStats()
    {
        $stats = DB::select("
            SELECT 
                (SELECT COUNT(*) FROM posts WHERE is_published = true) as published_posts,
                (SELECT COUNT(*) FROM posts WHERE is_published = false) as draft_posts,
                (SELECT COUNT(*) FROM workflows WHERE status = 'active') as active_workflows,
                (SELECT COUNT(*) FROM workflows WHERE status = 'inactive') as inactive_workflows,
                (SELECT COUNT(*) FROM users WHERE role = 'user') as regular_users,
                (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_users,
                (SELECT COUNT(*) FROM posts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as recent_posts,
                (SELECT COUNT(*) FROM workflows WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as recent_workflows
        ");

        return $stats[0] ?? null;
    }

    /**
     * Get popular content based on views and recent activity
     */
    public function getPopularContent($limit = 5)
    {
        return DB::table('posts')
            ->join('categories', 'posts.category_id', '=', 'categories.id')
            ->join('users', 'posts.user_id', '=', 'users.id')
            ->select([
                'posts.id',
                'posts.title',
                'posts.slug',
                'posts.views',
                'posts.published_at',
                'categories.name as category_name',
                'users.name as author_name'
            ])
            ->where('posts.is_published', true)
            ->orderByDesc('posts.views')
            ->orderByDesc('posts.published_at')
            ->limit($limit)
            ->get();
    }

    /**
     * Search posts with full-text search optimization
     */
    public function searchPosts($searchTerm, $limit = 20)
    {
        return DB::table('posts')
            ->join('categories', 'posts.category_id', '=', 'categories.id')
            ->join('users', 'posts.user_id', '=', 'users.id')
            ->select([
                'posts.id',
                'posts.title',
                'posts.slug',
                'posts.excerpt',
                'posts.featured_image',
                'posts.published_at',
                'categories.name as category_name',
                'users.name as author_name'
            ])
            ->where('posts.is_published', true)
            ->where(function($query) use ($searchTerm) {
                $query->where('posts.title', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('posts.excerpt', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('posts.content', 'LIKE', "%{$searchTerm}%");
            })
            ->orderByDesc('posts.published_at')
            ->limit($limit)
            ->get();
    }

    /**
     * Get related posts based on category and tags
     */
    public function getRelatedPosts($postId, $categoryId, $limit = 5)
    {
        return DB::table('posts')
            ->join('categories', 'posts.category_id', '=', 'categories.id')
            ->select([
                'posts.id',
                'posts.title',
                'posts.slug',
                'posts.excerpt',
                'posts.featured_image',
                'posts.published_at',
                'categories.name as category_name'
            ])
            ->where('posts.is_published', true)
            ->where('posts.id', '!=', $postId)
            ->where('posts.category_id', $categoryId)
            ->orderByDesc('posts.published_at')
            ->limit($limit)
            ->get();
    }

    /**
     * Get user activity summary
     */
    public function getUserActivitySummary($userId)
    {
        return DB::select("
            SELECT 
                (SELECT COUNT(*) FROM posts WHERE user_id = ? AND is_published = true) as published_posts,
                (SELECT COUNT(*) FROM posts WHERE user_id = ? AND is_published = false) as draft_posts,
                (SELECT COUNT(*) FROM workflows WHERE user_id = ? AND status = 'active') as active_workflows,
                (SELECT SUM(views) FROM posts WHERE user_id = ?) as total_views
        ", [$userId, $userId, $userId, $userId]);
    }
}