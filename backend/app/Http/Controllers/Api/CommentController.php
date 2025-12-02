<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\CommentLike;
use App\Models\CommentReport;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class CommentController extends Controller
{
    /**
     * List comments for a specific resource
     */
    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'commentable_type' => 'required|string|in:Post,Workflow,Project,Issue',
            'commentable_id' => 'required|integer',
            'parent_id' => 'nullable|integer|exists:comments,id',
            'approved_only' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $query = Comment::with(['user', 'parent', 'replies.user'])
                ->where('commentable_type', $request->commentable_type)
                ->where('commentable_id', $request->commentable_id);

            // Filter by parent (for nested replies)
            if ($request->has('parent_id')) {
                $query->where('parent_id', $request->parent_id);
            } else {
                // Top-level comments only
                $query->whereNull('parent_id');
            }

            // Filter approved comments only (default: true)
            $approvedOnly = $request->input('approved_only', true);
            if ($approvedOnly) {
                $query->where('is_approved', true);
            }

            // Order: pinned first, then by created_at
            $comments = $query->orderByPinned()
                ->orderBy('created_at', 'desc')
                ->get();

            // Load likes for authenticated user
            $userId = Auth::id();
            $guestIp = $request->ip();
            
            $comments->each(function ($comment) use ($userId, $guestIp) {
                $comment->is_liked = $comment->isLikedBy($userId, $guestIp);
            });

            return response()->json([
                'success' => true,
                'data' => $comments,
                'count' => $comments->count()
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching comments: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch comments'
            ], 500);
        }
    }

    /**
     * Store a newly created comment
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $validator = Validator::make($request->all(), [
            'commentable_type' => 'required|string|in:Post,Workflow,Project,Issue',
            'commentable_id' => 'required|integer',
            'parent_id' => 'nullable|integer|exists:comments,id',
            'content' => 'required|string|min:3|max:5000',
            'guest_name' => 'nullable|required_without:user_id|string|max:255',
            'guest_email' => 'nullable|required_without:user_id|email|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // If not authenticated, require guest name and email
        if (!$user) {
            if (!$request->guest_name || !$request->guest_email) {
                return response()->json([
                    'success' => false,
                    'message' => 'Guest name and email are required for unauthenticated users'
                ], 422);
            }
        }

        try {
            // Verify the commentable resource exists
            $commentableClass = 'App\\Models\\' . $request->commentable_type;
            if (!class_exists($commentableClass)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid commentable type'
                ], 422);
            }

            $commentable = $commentableClass::find($request->commentable_id);
            if (!$commentable) {
                return response()->json([
                    'success' => false,
                    'message' => 'Resource not found'
                ], 404);
            }

            // Check if parent comment exists (for replies)
            if ($request->parent_id) {
                $parent = Comment::find($request->parent_id);
                if (!$parent) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Parent comment not found'
                    ], 404);
                }
            }

            // Rate limiting: max 10 comments per hour per IP
            $ipAddress = $request->ip();
            $recentComments = Comment::where('ip_address', $ipAddress)
                ->where('created_at', '>=', now()->subHour())
                ->count();

            if ($recentComments >= 10) {
                return response()->json([
                    'success' => false,
                    'message' => 'Rate limit exceeded. Please wait before posting another comment.'
                ], 429);
            }

            // Create comment
            $comment = Comment::create([
                'commentable_type' => $request->commentable_type,
                'commentable_id' => $request->commentable_id,
                'user_id' => $user?->id,
                'parent_id' => $request->parent_id,
                'content' => $request->content,
                'guest_name' => $request->guest_name,
                'guest_email' => $request->guest_email,
                'is_approved' => $user ? true : false, // Auto-approve authenticated users
                'ip_address' => $ipAddress,
                'user_agent' => $request->userAgent(),
            ]);

            // Increment parent's replies count
            if ($request->parent_id) {
                $parent = Comment::find($request->parent_id);
                if ($parent) {
                    $parent->incrementRepliesCount();
                }
            }

            // Load relationships
            $comment->load(['user', 'parent', 'commentable']);

            return response()->json([
                'success' => true,
                'message' => $user ? 'Comment posted successfully' : 'Comment submitted for review',
                'data' => $comment
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating comment: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create comment'
            ], 500);
        }
    }

    /**
     * Display the specified comment
     */
    public function show(string $id): JsonResponse
    {
        try {
            $comment = Comment::with(['user', 'parent', 'replies.user', 'commentable'])
                ->findOrFail($id);

            $userId = Auth::id();
            $guestIp = request()->ip();
            $comment->is_liked = $comment->isLikedBy($userId, $guestIp);

            return response()->json([
                'success' => true,
                'data' => $comment
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Comment not found'
            ], 404);
        }
    }

    /**
     * Update the specified comment
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $comment = Comment::findOrFail($id);
            $user = Auth::user();

            // Check permissions
            if (!$comment->canBeEditedBy($user)) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to edit this comment'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'content' => 'required|string|min:3|max:5000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $comment->update([
                'content' => $request->content,
            ]);

            $comment->markAsEdited();
            $comment->load(['user', 'parent']);

            return response()->json([
                'success' => true,
                'message' => 'Comment updated successfully',
                'data' => $comment
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating comment: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update comment'
            ], 500);
        }
    }

    /**
     * Remove the specified comment
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $comment = Comment::findOrFail($id);
            $user = Auth::user();

            // Check permissions
            if (!$comment->canBeDeletedBy($user)) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to delete this comment'
                ], 403);
            }

            $parentId = $comment->parent_id;

            // Delete comment (cascade will handle likes and reports)
            $comment->delete();

            // Decrement parent's replies count
            if ($parentId) {
                $parent = Comment::find($parentId);
                if ($parent) {
                    $parent->decrementRepliesCount();
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Comment deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting comment: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete comment'
            ], 500);
        }
    }

    /**
     * Like or unlike a comment
     */
    public function like(Request $request, string $id): JsonResponse
    {
        try {
            $comment = Comment::findOrFail($id);
            $user = Auth::user();
            $guestIp = $request->ip();

            // Check if already liked
            $existingLike = CommentLike::where('comment_id', $comment->id);
            
            if ($user) {
                $existingLike->where('user_id', $user->id);
            } else {
                $existingLike->where('guest_ip', $guestIp)->whereNull('user_id');
            }

            $existingLike = $existingLike->first();

            if ($existingLike) {
                // Unlike: delete the like
                $existingLike->delete();
                $comment->decrementLikesCount();
                
                return response()->json([
                    'success' => true,
                    'message' => 'Comment unliked',
                    'liked' => false,
                    'likes_count' => $comment->fresh()->likes_count
                ]);
            } else {
                // Like: create new like
                CommentLike::create([
                    'comment_id' => $comment->id,
                    'user_id' => $user?->id,
                    'guest_ip' => $user ? null : $guestIp,
                ]);

                $comment->incrementLikesCount();

                return response()->json([
                    'success' => true,
                    'message' => 'Comment liked',
                    'liked' => true,
                    'likes_count' => $comment->fresh()->likes_count
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Error toggling like: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to toggle like'
            ], 500);
        }
    }

    /**
     * Report a comment
     */
    public function report(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|in:spam,inappropriate,harassment,other',
            'description' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $comment = Comment::findOrFail($id);
            $user = Auth::user();

            // Check if already reported by this user
            $existingReport = CommentReport::where('comment_id', $comment->id);
            
            if ($user) {
                $existingReport->where('user_id', $user->id);
            } else {
                // For guests, we'll allow multiple reports (can be improved with IP tracking)
                // For now, we'll just check if user_id is null
                $existingReport->whereNull('user_id');
            }

            if ($existingReport->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'You have already reported this comment'
                ], 400);
            }

            // Create report
            $report = CommentReport::create([
                'comment_id' => $comment->id,
                'user_id' => $user?->id,
                'reason' => $request->reason,
                'description' => $request->description,
                'status' => 'pending',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Comment reported successfully. Our team will review it.',
                'data' => $report
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error reporting comment: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to report comment'
            ], 500);
        }
    }

    /**
     * Get replies for a comment
     */
    public function replies(Request $request, string $id): JsonResponse
    {
        try {
            $comment = Comment::findOrFail($id);
            
            $replies = Comment::with(['user'])
                ->where('parent_id', $comment->id)
                ->where('is_approved', true)
                ->orderBy('created_at', 'asc')
                ->get();

            $userId = Auth::id();
            $guestIp = $request->ip();
            
            $replies->each(function ($reply) use ($userId, $guestIp) {
                $reply->is_liked = $reply->isLikedBy($userId, $guestIp);
            });

            return response()->json([
                'success' => true,
                'data' => $replies,
                'count' => $replies->count()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch replies'
            ], 500);
        }
    }
}
