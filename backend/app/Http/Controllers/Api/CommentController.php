<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\CommentLike;
use App\Models\CommentReport;
use App\Services\EmailService;
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
        // Normalize request data for validation
        $requestData = $request->all();
        if (isset($requestData['commentable_id'])) {
            $requestData['commentable_id'] = (int) $requestData['commentable_id'];
        }
        if (isset($requestData['parent_id'])) {
            $requestData['parent_id'] = (int) $requestData['parent_id'];
        }

        $validator = Validator::make($requestData, [
            'commentable_type' => 'required|string|in:Post,Workflow,Project,Issue',
            'commentable_id' => 'required|integer',
            'parent_id' => 'nullable|integer|exists:comments,id',
            'approved_only' => 'nullable',
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
                ->where('commentable_type', $requestData['commentable_type'])
                ->where('commentable_id', $requestData['commentable_id']);

            // Filter by parent (for nested replies)
            if (isset($requestData['parent_id'])) {
                $query->where('parent_id', $requestData['parent_id']);
            } else {
                // Top-level comments only
                $query->whereNull('parent_id');
            }

            // Filter approved comments only (default: true)
            // Handle string boolean values from query parameters
            $approvedOnly = $request->input('approved_only', 'true');
            if (is_string($approvedOnly)) {
                $approvedOnly = in_array(strtolower($approvedOnly), ['true', '1', 'yes'], true);
            }
            if ($approvedOnly !== false) {
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
        try {
            // Try to authenticate user if token is provided
            $user = Auth::user();
            
            // If no user from Auth, try to authenticate with API token manually
            if (!$user) {
                $token = $request->bearerToken();
                if ($token) {
                    try {
                        $apiToken = \App\Models\ApiToken::where('token', $token)->first();
                        if ($apiToken && !$apiToken->isExpired()) {
                            $apiToken->update(['last_used_at' => now()]);
                            $user = $apiToken->user;
                            if ($user) {
                                Auth::guard('api')->setUser($user);
                            }
                        }
                    } catch (\Exception $e) {
                        Log::warning('API token authentication failed in comment creation', [
                            'error' => $e->getMessage(),
                            'trace' => $e->getTraceAsString()
                        ]);
                    }
                }
            }
            
            // Require authentication - no guest comments allowed
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required. Please login or use an API token to create comments.'
                ], 401);
            }
            
            // Validation rules (no guest fields needed since authentication is required)
            $validator = Validator::make($request->all(), [
                'commentable_type' => 'required|string|in:Post,Workflow,Project,Issue',
                'commentable_id' => 'required|integer',
                'parent_id' => 'nullable|integer|exists:comments,id',
                'content' => 'required|string|min:3|max:5000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
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

            // Rate limiting: max 50 comments per hour per user (user-based, not IP-based)
            $recentComments = Comment::where('user_id', $user->id)
                ->where('created_at', '>=', now()->subHour())
                ->count();

            if ($recentComments >= 50) {
                return response()->json([
                    'success' => false,
                    'message' => 'Rate limit exceeded. Maximum 50 comments per hour. Please wait before posting another comment.'
                ], 429);
            }

            // Create comment (only authenticated users)
            $comment = Comment::create([
                'commentable_type' => $request->commentable_type,
                'commentable_id' => $request->commentable_id,
                'user_id' => $user->id,
                'parent_id' => $request->parent_id,
                'content' => $request->content,
                'guest_name' => null, // No guest comments
                'guest_email' => null, // No guest comments
                'is_approved' => true, // Auto-approve authenticated users
                'ip_address' => $request->ip(),
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

            // Send email notifications via N8n
            try {
                $emailService = app(EmailService::class);
                $commentable = $comment->commentable;
                
                // 1. Notify parent comment author if this is a reply
                if ($request->parent_id) {
                    $parent = Comment::find($request->parent_id);
                    if ($parent) {
                        $parentAuthorEmail = $parent->user ? $parent->user->email : $parent->guest_email;
                        $parentAuthorName = $parent->user ? $parent->user->name : $parent->guest_name;
                        
                        if ($parentAuthorEmail && $parentAuthorEmail !== $user->email) {
                        // Don't notify if replying to own comment
                        // Get unsubscribe token for email link
                        $unsubscribeToken = $this->getUnsubscribeToken($parentAuthorEmail);
                        
                        $emailService->sendTemplateEmail('comment_reply', [
                            'commenter_name' => $user ? $user->name : $request->guest_name,
                            'comment_content' => substr(strip_tags($request->content), 0, 200),
                            'parent_comment' => substr(strip_tags($parent->content), 0, 200),
                            'resource_type' => strtolower($request->commentable_type),
                            'resource_title' => $this->getResourceTitle($commentable),
                            'resource_url' => $this->getResourceUrl($commentable, $request->commentable_type),
                            'comment_url' => $this->getResourceUrl($commentable, $request->commentable_type) . '#comment-' . $comment->id,
                            'unsubscribe_url' => config('app.url') . '/email/unsubscribe/' . $unsubscribeToken . '?types[]=comment_reply',
                        ], $parentAuthorEmail, $parentAuthorName);
                    }
                }
                
                // 2. Notify resource owner (if different from commenter)
                $resourceOwnerEmail = null;
                $resourceOwnerName = null;
                
                if ($commentable) {
                    if (method_exists($commentable, 'user') && $commentable->user) {
                        $resourceOwnerEmail = $commentable->user->email;
                        $resourceOwnerName = $commentable->user->name;
                    } elseif (method_exists($commentable, 'guest_email') && $commentable->guest_email) {
                        $resourceOwnerEmail = $commentable->guest_email;
                        $resourceOwnerName = $commentable->guest_name ?? 'Guest';
                    }
                    
                    // Only notify if owner is different from commenter and it's not a reply
                    if ($resourceOwnerEmail && $resourceOwnerEmail !== $user->email && !$request->parent_id) {
                        // Get unsubscribe token for email link
                        $unsubscribeToken = $this->getUnsubscribeToken($resourceOwnerEmail);
                        
                        $emailService->sendTemplateEmail('new_comment', [
                            'commenter_name' => $user->name,
                            'comment_content' => substr(strip_tags($request->content), 0, 200),
                            'resource_type' => strtolower($request->commentable_type),
                            'resource_title' => $this->getResourceTitle($commentable),
                            'resource_url' => $this->getResourceUrl($commentable, $request->commentable_type),
                            'comment_url' => $this->getResourceUrl($commentable, $request->commentable_type) . '#comment-' . $comment->id,
                            'unsubscribe_url' => config('app.url') . '/email/unsubscribe/' . $unsubscribeToken . '?types[]=new_comment',
                        ], $resourceOwnerEmail, $resourceOwnerName);
                    }
                }
            } catch (\Exception $e) {
                // Log but don't fail the request if email fails
                Log::warning('Failed to send comment email notification: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Comment posted successfully',
                'data' => $comment
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating comment', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to create comment',
                'error' => config('app.debug') ? $e->getMessage() : null
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

    /**
     * Get resource title for email notifications
     */
    private function getResourceTitle($resource): string
    {
        if (!$resource) {
            return 'Unknown Resource';
        }
        
        if (isset($resource->title)) {
            return $resource->title;
        }
        
        if (isset($resource->name)) {
            return $resource->name;
        }
        
        return 'Resource';
    }

    /**
     * Get resource URL for email notifications
     */
    private function getResourceUrl($resource, string $type): string
    {
        if (!$resource) {
            return config('app.url');
        }
        
        $baseUrl = config('app.url');
        $slug = $resource->slug ?? $resource->id;
        
        return match(strtolower($type)) {
            'post' => "{$baseUrl}/blog/{$slug}",
            'workflow' => "{$baseUrl}/workflows/{$slug}",
            'project' => "{$baseUrl}/projects/{$slug}",
            'issue' => "{$baseUrl}/community/issues/{$slug}",
            default => $baseUrl,
        };
    }

    /**
     * Get or create unsubscribe token for email
     */
    private function getUnsubscribeToken(string $email): string
    {
        $unsubscribe = \App\Models\EmailUnsubscribe::where('email', $email)->first();
        
        if ($unsubscribe) {
            return $unsubscribe->token;
        }

        // Create new unsubscribe record with token
        $unsubscribe = \App\Models\EmailUnsubscribe::create([
            'email' => $email,
            'unsubscribed_types' => [],
            'unsubscribe_all' => false,
        ]);

        return $unsubscribe->token;
    }
}
