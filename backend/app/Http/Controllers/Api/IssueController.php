<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Issue;
use App\Models\IssueCategory;
use App\Models\IssueUpvote;
use App\Models\IssueLabel;
use App\Models\IssueAssignment;
use App\Models\Comment;
use App\Services\EmailService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class IssueController extends Controller
{
    /**
     * List issues with filtering, sorting, and pagination
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Issue::with(['user', 'category', 'assignee', 'resolver']);

            // Search filter - optimized for performance and word-based search
            if ($request->has('search') && !empty(trim($request->search))) {
                $search = trim($request->search);
                
                // Limit search length to prevent abuse
                if (strlen($search) > 100) {
                    $search = substr($search, 0, 100);
                }
                
                // Escape special characters for LIKE queries
                $searchEscaped = str_replace(['%', '_', '\\'], ['\\%', '\\_', '\\\\'], $search);
                
                // Split search into individual words for better matching
                $searchWords = array_filter(
                    preg_split('/\s+/', $search),
                    function($word) {
                        return strlen(trim($word)) >= 2; // Ignore words shorter than 2 characters
                    }
                );
                
                if (!empty($searchWords)) {
                    $query->where(function($q) use ($searchWords, $searchEscaped) {
                        // Use ILIKE for PostgreSQL (case-insensitive, can use indexes)
                        // Falls back to LIKE for other databases
                        $dbDriver = \DB::connection()->getDriverName();
                        $isPostgres = ($dbDriver === 'pgsql');
                        
                        if ($isPostgres) {
                            // PostgreSQL: Use ILIKE for case-insensitive search (can use indexes)
                            $q->whereRaw('title ILIKE ?', ["%{$searchEscaped}%"]);
                            $q->orWhereRaw('description ILIKE ?', ["%{$searchEscaped}%"]);
                            
                            // If multiple words, search for each word individually
                            if (count($searchWords) > 1) {
                                foreach ($searchWords as $word) {
                                    $word = trim($word);
                                    if (strlen($word) >= 2) {
                                        $wordEscaped = str_replace(['%', '_', '\\'], ['\\%', '\\_', '\\\\'], $word);
                                        $q->orWhereRaw('title ILIKE ?', ["%{$wordEscaped}%"]);
                                        $q->orWhereRaw('description ILIKE ?', ["%{$wordEscaped}%"]);
                                    }
                                }
                            }
                        } else {
                            // Other databases: Use LIKE (case-sensitive)
                            $q->where('title', 'like', "%{$searchEscaped}%");
                            $q->orWhere('description', 'like', "%{$searchEscaped}%");
                            
                            // If multiple words, search for each word individually
                            if (count($searchWords) > 1) {
                                foreach ($searchWords as $word) {
                                    $word = trim($word);
                                    if (strlen($word) >= 2) {
                                        $wordEscaped = str_replace(['%', '_', '\\'], ['\\%', '\\_', '\\\\'], $word);
                                        $q->orWhere('title', 'like', "%{$wordEscaped}%");
                                        $q->orWhere('description', 'like', "%{$wordEscaped}%");
                                    }
                                }
                            }
                        }
                    });
                }
            }

            // Status filter
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // Priority filter
            if ($request->has('priority')) {
                $query->where('priority', $request->priority);
            }

            // Category filter
            if ($request->has('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            // Assigned to filter
            if ($request->has('assigned_to')) {
                $query->where('assigned_to', $request->assigned_to);
            }

            // Label filter (check if labels JSON contains the label)
            if ($request->has('label')) {
                $query->whereJsonContains('labels', $request->label);
            }

            // Pinned filter
            if ($request->has('pinned')) {
                $query->where('is_pinned', $request->boolean('pinned'));
            }

            // User's issues only
            if ($request->has('my_issues') && $request->boolean('my_issues')) {
                $userId = Auth::id();
                if ($userId) {
                    $query->where('user_id', $userId);
                } else {
                    return response()->json([
                        'success' => false,
                        'message' => 'Authentication required'
                    ], 401);
                }
            }

            // Sorting
            $sortBy = $request->input('sort_by', 'created_at');
            $sortOrder = $request->input('sort_order', 'desc');
            
            $allowedSorts = ['created_at', 'updated_at', 'upvotes_count', 'comments_count', 'priority', 'status'];
            if (in_array($sortBy, $allowedSorts)) {
                if ($sortBy === 'priority') {
                    // Custom priority sorting: critical > high > medium > low
                    $query->orderByRaw("CASE priority 
                        WHEN 'critical' THEN 1 
                        WHEN 'high' THEN 2 
                        WHEN 'medium' THEN 3 
                        WHEN 'low' THEN 4 
                        END");
                } else {
                    $query->orderBy($sortBy, $sortOrder);
                }
            } else {
                $query->orderByPinned()->orderBy('created_at', 'desc');
            }

            // Pagination
            $perPage = min($request->input('per_page', 15), 50); // Max 50 per page
            $issues = $query->paginate($perPage);

            // Load upvote status for authenticated user
            $userId = Auth::id();
            $guestIp = $request->ip();
            
            $issues->getCollection()->transform(function ($issue) use ($userId, $guestIp) {
                $issue->is_upvoted = $issue->isUpvotedBy($userId, $guestIp);
                
                // Always verify and update comments_count if it seems wrong
                try {
                    // Force fresh query to get accurate count
                    $actualCount = \App\Models\Comment::where('commentable_type', 'Issue')
                        ->where('commentable_id', $issue->id)
                        ->count();
                    
                    $storedCount = $issue->comments_count ?? 0;
                    
                    // If stored count doesn't match actual count, update it
                    if ($storedCount != $actualCount || $storedCount < 0 || $storedCount === null) {
                        // Update the model instance immediately for the response
                        $issue->comments_count = max(0, $actualCount);
                        // Update in database asynchronously (don't block the response)
                        $issue->updateQuietly(['comments_count' => $issue->comments_count]);
                        
                        Log::debug('Updated comments count for issue ' . $issue->id . ' from ' . $storedCount . ' to ' . $actualCount);
                    }
                } catch (\Exception $e) {
                    // If count check fails, log but don't break the response
                    Log::warning('Could not verify comments count for issue ' . $issue->id . ': ' . $e->getMessage());
                    // Ensure count is at least 0
                    if ($issue->comments_count < 0 || $issue->comments_count === null) {
                        $issue->comments_count = 0;
                    }
                }
                
                return $issue;
            });

            return response()->json([
                'success' => true,
                'data' => $issues->items(),
                'pagination' => [
                    'current_page' => $issues->currentPage(),
                    'last_page' => $issues->lastPage(),
                    'per_page' => $issues->perPage(),
                    'total' => $issues->total(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching issues: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch issues'
            ], 500);
        }
    }

    /**
     * Store a newly created issue
     */
    public function store(Request $request): JsonResponse
    {
        // Try to authenticate user if token is provided (optional authentication)
        $user = Auth::user();
        
        // If no user from Auth, try to authenticate with API token manually
        if (!$user) {
            $token = $request->bearerToken();
            if ($token) {
                Log::info('Attempting API token authentication for issue creation', [
                    'token_prefix' => substr($token, 0, 20)
                ]);
                
                $apiToken = \App\Models\ApiToken::where('token', $token)->first();
                
                if ($apiToken) {
                    Log::info('API token found', [
                        'token_id' => $apiToken->id,
                        'user_id' => $apiToken->user_id,
                        'is_expired' => $apiToken->isExpired()
                    ]);
                    
                    if (!$apiToken->isExpired()) {
                        $apiToken->update(['last_used_at' => now()]);
                        $user = $apiToken->user;
                        
                        if ($user) {
                            Auth::guard('api')->setUser($user);
                            Log::info('API token authentication successful', [
                                'user_id' => $user->id,
                                'user_email' => $user->email
                            ]);
                        } else {
                            Log::warning('API token found but user is null', [
                                'token_id' => $apiToken->id,
                                'user_id' => $apiToken->user_id
                            ]);
                        }
                    } else {
                        Log::warning('API token is expired', ['token_id' => $apiToken->id]);
                    }
                } else {
                    Log::warning('API token not found in database', [
                        'token_prefix' => substr($token, 0, 20)
                    ]);
                }
            }
        }
        
        // Build validation rules based on whether user is authenticated
        $validationRules = [
            'title' => 'required|string|min:5|max:255',
            'description' => 'required|string|min:10|max:10000',
            'category_id' => 'nullable|integer|exists:issue_categories,id|required_without:category_name',
            'category_name' => 'nullable|string|max:255|required_without:category_id',
            'priority' => 'nullable|string|in:low,medium,high,critical',
            'labels' => 'nullable|array',
            'labels.*' => 'required|string|max:50',
        ];
        
        // Only require guest fields if user is not authenticated
        if (!$user) {
            $validationRules['guest_name'] = 'required|string|max:255';
            $validationRules['guest_email'] = 'required|email|max:255';
        } else {
            $validationRules['guest_name'] = 'nullable|string|max:255';
            $validationRules['guest_email'] = 'nullable|email|max:255';
        }
        
        $validator = Validator::make($request->all(), $validationRules);

        if ($validator->fails()) {
            Log::warning('Issue creation validation failed', [
                'errors' => $validator->errors()->toArray(),
                'request_data' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
                'debug' => [
                    'received_data' => $request->all(),
                    'labels_type' => gettype($request->labels),
                    'labels_value' => $request->labels
                ]
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
            // Resolve category_id from category_name if provided
            $categoryId = $request->category_id;
            if ($request->category_name && !$categoryId) {
                // Try exact match first
                $category = IssueCategory::where('name', $request->category_name)->first();
                
                // If not found, try case-insensitive match
                if (!$category) {
                    $category = IssueCategory::whereRaw('LOWER(name) = ?', [strtolower($request->category_name)])->first();
                }
                
                if ($category) {
                    $categoryId = $category->id;
                } else {
                    // Get available categories for better error message
                    $availableCategories = IssueCategory::where('is_active', true)
                        ->orderBy('sort_order')
                        ->pluck('name')
                        ->toArray();
                    
                    return response()->json([
                        'success' => false,
                        'message' => 'Category not found',
                        'errors' => [
                            'category_name' => [
                                'The selected category name is invalid.',
                                'Available categories: ' . implode(', ', $availableCategories)
                            ]
                        ]
                    ], 422);
                }
            }

            // Rate limiting: max 5 issues per hour per IP
            $ipAddress = $request->ip();
            $recentIssues = Issue::where('ip_address', $ipAddress)
                ->where('created_at', '>=', now()->subHour())
                ->count();

            if ($recentIssues >= 5) {
                return response()->json([
                    'success' => false,
                    'message' => 'Rate limit exceeded. Please wait before creating another issue.'
                ], 429);
            }

            // Normalize labels - ensure they're strings and filter out empty values
            $labels = [];
            if ($request->has('labels') && is_array($request->labels)) {
                $labels = array_filter(
                    array_map('trim', $request->labels),
                    function($label) {
                        return !empty($label) && is_string($label) && strlen($label) <= 50;
                    }
                );
                $labels = array_values($labels); // Re-index array
            }

            // Create issue
            $issue = Issue::create([
                'title' => $request->title,
                'description' => $request->description,
                'user_id' => $user?->id,
                'guest_name' => $request->guest_name,
                'guest_email' => $request->guest_email,
                'category_id' => $categoryId,
                'priority' => $request->priority ?? 'medium',
                'labels' => $labels,
                'status' => 'open',
                'ip_address' => $ipAddress,
            ]);

            // Send confirmation email via N8n
            try {
                $emailService = app(EmailService::class);
                $recipientEmail = $user ? $user->email : $request->guest_email;
                $recipientName = $user ? $user->name : $request->guest_name;

                if ($recipientEmail) {
                    // Get unsubscribe token
                    $unsubscribeToken = $this->getUnsubscribeToken($recipientEmail);
                    
                    Log::info('Attempting to send issue_created email notification', [
                        'recipient' => $recipientEmail,
                        'issue_id' => $issue->id,
                        'issue_title' => $issue->title,
                    ]);
                    
                    $result = $emailService->sendTemplateEmail('issue_created', [
                        'issue_title' => $issue->title,
                        'issue_url' => config('app.url') . '/community/issues/' . ($issue->slug ?? $issue->id),
                        'issue_description' => substr(strip_tags($issue->description), 0, 200) . '...',
                        'created_at' => $issue->created_at->format('F j, Y \a\t g:i A'),
                        'unsubscribe_url' => config('app.url') . '/email/unsubscribe/' . $unsubscribeToken . '?types[]=issue_created',
                    ], $recipientEmail, $recipientName);
                    
                    if ($result) {
                        Log::info('Issue created email notification sent successfully', [
                            'recipient' => $recipientEmail,
                            'issue_id' => $issue->id,
                        ]);
                    } else {
                        Log::warning('Issue created email notification failed to send', [
                            'recipient' => $recipientEmail,
                            'issue_id' => $issue->id,
                            'check_n8n_config' => 'Verify N8n configuration is active and webhook URL is correct',
                            'check_template' => 'Verify issue_created template exists in N8n',
                        ]);
                    }
                } else {
                    Log::warning('Cannot send issue created email - no recipient email', [
                        'issue_id' => $issue->id,
                        'user_id' => $user?->id,
                        'guest_email' => $request->guest_email,
                    ]);
                }
            } catch (\Exception $e) {
                // Log but don't fail the request if email fails
                Log::error('Failed to send issue created email notification', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                    'issue_id' => $issue->id,
                    'recipient' => $user ? $user->email : $request->guest_email,
                ]);
            }

            // Return only the created issue data (without relationships)
            return response()->json([
                'success' => true,
                'message' => 'Issue created successfully',
                'data' => [
                    'id' => $issue->id,
                    'title' => $issue->title,
                    'slug' => $issue->slug,
                    'description' => $issue->description,
                    'category_id' => $issue->category_id,
                    'priority' => $issue->priority,
                    'status' => $issue->status,
                    'labels' => $issue->labels,
                    'user_id' => $issue->user_id,
                    'guest_name' => $issue->guest_name,
                    'guest_email' => $issue->guest_email,
                    'views_count' => $issue->views_count,
                    'upvotes_count' => $issue->upvotes_count,
                    'comments_count' => $issue->comments_count,
                    'is_pinned' => $issue->is_pinned,
                    'is_locked' => $issue->is_locked,
                    'created_at' => $issue->created_at,
                    'updated_at' => $issue->updated_at,
                ]
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating issue: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create issue'
            ], 500);
        }
    }

    /**
     * Display the specified issue
     */
    public function show(Request $request, string $id): JsonResponse
    {
        try {
            // Try to find by ID first (if numeric), then by slug
            $issue = null;
            if (is_numeric($id)) {
                $issue = Issue::with(['user', 'category', 'assignee', 'resolver', 'upvotes'])
                    ->where('id', $id)
                    ->first();
            }
            
            // If not found by ID or ID is not numeric, try slug
            if (!$issue) {
                $issue = Issue::with(['user', 'category', 'assignee', 'resolver', 'upvotes'])
                    ->where('slug', $id)
                    ->first();
            }
            
            if (!$issue) {
                Log::warning('Issue not found', [
                    'id_or_slug' => $id,
                    'is_numeric' => is_numeric($id),
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Issue not found'
                ], 404);
            }

            // Ensure comments_count is accurate (recalculate if needed)
            try {
                // Use direct query for more reliable count
                $actualCount = Comment::where('commentable_type', 'Issue')
                    ->where('commentable_id', $issue->id)
                    ->count();
                
                $storedCount = $issue->comments_count ?? 0;
                
                // If stored count doesn't match actual count, update it
                if ($storedCount != $actualCount || $storedCount < 0 || $storedCount === null) {
                    $issue->comments_count = max(0, $actualCount);
                    $issue->updateQuietly(['comments_count' => $issue->comments_count]);
                    $issue->refresh();
                }
            } catch (\Exception $e) {
                Log::warning('Could not verify comments count for issue ' . $issue->id . ': ' . $e->getMessage());
            }

            // Increment views
            $issue->incrementViews();

            // Load upvote status
            $userId = Auth::id();
            $guestIp = $request->ip();
            $issue->is_upvoted = $issue->isUpvotedBy($userId, $guestIp);

            return response()->json([
                'success' => true,
                'data' => $issue
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Issue not found'
            ], 404);
        }
    }

    /**
     * Update the specified issue
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $issue = Issue::findOrFail($id);
            
            // Get user from API guard or default guard
            $user = Auth::guard('api')->user() ?? Auth::user();

            // Check permissions (owner or admin)
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required'
                ], 401);
            }

            if ($issue->user_id !== $user->id && $user->role !== 'admin') {
                Log::warning('Issue update denied', [
                    'user_id' => $user->id,
                    'user_role' => $user->role,
                    'issue_id' => $issue->id,
                    'issue_user_id' => $issue->user_id,
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to update this issue'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|required|string|min:5|max:255',
                'description' => 'sometimes|required|string|min:10|max:10000',
                'category_id' => 'nullable|integer|exists:issue_categories,id',
                'priority' => 'nullable|string|in:low,medium,high,critical',
                'labels' => 'nullable|array',
                'labels.*' => 'string|max:50',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $issue->update($request->only([
                'title', 'description', 'category_id', 'priority', 'labels'
            ]));

            $issue->load(['user', 'category', 'assignee']);

            return response()->json([
                'success' => true,
                'message' => 'Issue updated successfully',
                'data' => $issue
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating issue: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update issue'
            ], 500);
        }
    }

    /**
     * Remove the specified issue
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $issue = Issue::findOrFail($id);
            
            // Get user from API guard or default guard
            $user = Auth::guard('api')->user() ?? Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required'
                ], 401);
            }

            // Only admin can delete issues
            if ($user->role !== 'admin') {
                Log::warning('Issue delete denied', [
                    'user_id' => $user->id,
                    'user_role' => $user->role,
                    'issue_id' => $issue->id,
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Only administrators can delete issues'
                ], 403);
            }

            $issue->delete();

            return response()->json([
                'success' => true,
                'message' => 'Issue deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting issue: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete issue'
            ], 500);
        }
    }

    /**
     * Upvote or downvote an issue
     */
    public function upvote(Request $request, string $id): JsonResponse
    {
        try {
            $issue = Issue::findOrFail($id);
            $user = Auth::user();
            $guestIp = $request->ip();

            // Check if already upvoted
            $existingUpvote = IssueUpvote::where('issue_id', $issue->id);
            
            if ($user) {
                $existingUpvote->where('user_id', $user->id);
            } else {
                $existingUpvote->where('guest_ip', $guestIp)->whereNull('user_id');
            }

            $existingUpvote = $existingUpvote->first();

            if ($existingUpvote) {
                // Downvote: delete the upvote
                $existingUpvote->delete();
                $issue->decrementUpvotesCount();
                
                return response()->json([
                    'success' => true,
                    'message' => 'Issue downvoted',
                    'upvoted' => false,
                    'upvotes_count' => $issue->fresh()->upvotes_count
                ]);
            } else {
                // Upvote: create new upvote
                IssueUpvote::create([
                    'issue_id' => $issue->id,
                    'user_id' => $user?->id,
                    'guest_ip' => $user ? null : $guestIp,
                ]);

                $issue->incrementUpvotesCount();

                return response()->json([
                    'success' => true,
                    'message' => 'Issue upvoted',
                    'upvoted' => true,
                    'upvotes_count' => $issue->fresh()->upvotes_count
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Error toggling upvote: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to toggle upvote'
            ], 500);
        }
    }

    /**
     * Update issue status (admin only)
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|string|in:open,in_progress,resolved,closed,duplicate',
            'resolution_notes' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $issue = Issue::findOrFail($id);
            $user = Auth::user();

            // Only admin can update status
            if (!$user || $user->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only administrators can update issue status'
                ], 403);
            }

            $updateData = ['status' => $request->status];

            if ($request->status === 'resolved') {
                $updateData['resolved_at'] = now();
                $updateData['resolved_by'] = $user->id;
                if ($request->resolution_notes) {
                    $updateData['resolution_notes'] = $request->resolution_notes;
                }
            }

            $issue->update($updateData);
            $issue->load(['resolver']);

            // Send email notification via N8n when status changes
            try {
                $emailService = app(EmailService::class);
                $recipientEmail = $issue->user ? $issue->user->email : $issue->guest_email;
                $recipientName = $issue->user ? $issue->user->name : $issue->guest_name;

                if ($recipientEmail && in_array($request->status, ['resolved', 'closed', 'in_progress'])) {
                    // Get unsubscribe token
                    $unsubscribeToken = $this->getUnsubscribeToken($recipientEmail);
                    
                    $emailService->sendTemplateEmail('issue_status_changed', [
                        'issue_title' => $issue->title,
                        'issue_url' => config('app.url') . '/community/issues/' . ($issue->slug ?? $issue->id),
                        'old_status' => $issue->getOriginal('status'),
                        'new_status' => $request->status,
                        'changed_by' => $user->name,
                        'resolution_notes' => $request->resolution_notes ?? null,
                        'changed_at' => now()->format('F j, Y \a\t g:i A'),
                        'unsubscribe_url' => config('app.url') . '/email/unsubscribe/' . $unsubscribeToken . '?types[]=issue_status_changed',
                    ], $recipientEmail, $recipientName);
                }
            } catch (\Exception $e) {
                // Log but don't fail the request if email fails
                Log::warning('Failed to send issue status change email notification: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Issue status updated successfully',
                'data' => $issue
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating issue status: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update issue status'
            ], 500);
        }
    }

    /**
     * Mark issue as resolved by the creator (user can mark their own issue as solved)
     */
    public function markAsSolved(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'solution' => 'required|string|min:10|max:10000', // Increased limit for detailed solutions
            'guest_email' => 'nullable|email|max:255', // Required for guest users
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $issue = Issue::findOrFail($id);
            
            // Try to get authenticated user (supports both JWT and API tokens)
            $user = Auth::guard('api')->user();
            
            // If no user from guard, try manual API token authentication
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
                        Log::debug('API token authentication failed in markAsSolved: ' . $e->getMessage());
                    }
                }
            }

            // Check if user is the creator (authenticated or guest) OR if user is admin
            $isOwner = false;
            $isAdmin = false;
            
            // Admins can always mark issues as solved
            if ($user && $user->role === 'admin') {
                $isAdmin = true;
            } elseif ($user && $issue->user_id === $user->id) {
                // Authenticated user owns the issue
                $isOwner = true;
            } elseif (!$user && $issue->guest_email) {
                // For guest users, verify email matches
                if (!$request->guest_email) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Email is required to verify ownership for guest-created issues'
                    ], 422);
                }
                
                if (strtolower($request->guest_email) === strtolower($issue->guest_email)) {
                    $isOwner = true;
                }
            }

            if (!$isOwner && !$isAdmin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only the issue creator or administrators can mark it as solved. Please provide the correct email if you created this issue as a guest.'
                ], 403);
            }

            // Check if already resolved
            if ($issue->status === 'resolved' || $issue->status === 'closed') {
                return response()->json([
                    'success' => false,
                    'message' => 'This issue is already marked as resolved'
                ], 400);
            }

            // Mark as resolved
            $updateData = [
                'status' => 'resolved',
                'resolved_at' => now(),
                'resolved_by' => $user?->id,
                'resolution_notes' => $request->solution,
            ];

            $issue->update($updateData);
            $issue->load(['resolver']);

            // Send email notification via N8n
            try {
                $emailService = app(EmailService::class);
                $recipientEmail = $issue->user ? $issue->user->email : $issue->guest_email;
                $recipientName = $issue->user ? $issue->user->name : $issue->guest_name;

                if ($recipientEmail) {
                    // Get unsubscribe token
                    $unsubscribeToken = $this->getUnsubscribeToken($recipientEmail);
                    
                    $emailService->sendTemplateEmail('issue_solved', [
                        'issue_title' => $issue->title,
                        'issue_url' => config('app.url') . '/community/issues/' . ($issue->slug ?? $issue->id),
                        'solution' => $request->solution,
                        'resolved_by' => $user ? $user->name : ($issue->guest_name ?? 'You'),
                        'resolved_at' => now()->format('F j, Y \a\t g:i A'),
                        'unsubscribe_url' => config('app.url') . '/email/unsubscribe/' . $unsubscribeToken . '?types[]=issue_solved',
                    ], $recipientEmail, $recipientName);
                }
            } catch (\Exception $e) {
                // Log but don't fail the request if email fails
                Log::warning('Failed to send issue solved email notification: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Issue marked as solved successfully',
                'data' => $issue
            ]);
        } catch (\Exception $e) {
            Log::error('Error marking issue as solved: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark issue as solved'
            ], 500);
        }
    }

    /**
     * Assign issue to user (admin only)
     */
    public function assign(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|integer|exists:users,id',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $issue = Issue::findOrFail($id);
            $user = Auth::user();

            // Only admin can assign issues
            if (!$user || $user->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only administrators can assign issues'
                ], 403);
            }

            // Create assignment record
            IssueAssignment::create([
                'issue_id' => $issue->id,
                'user_id' => $request->user_id,
                'assigned_by' => $user->id,
                'notes' => $request->notes,
            ]);

            // Update issue assigned_to
            $issue->update(['assigned_to' => $request->user_id]);

            $issue->load(['assignee']);

            return response()->json([
                'success' => true,
                'message' => 'Issue assigned successfully',
                'data' => $issue
            ]);
        } catch (\Exception $e) {
            Log::error('Error assigning issue: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to assign issue'
            ], 500);
        }
    }

    /**
     * Get issue statistics
     */
    public function stats(): JsonResponse
    {
        try {
            $stats = [
                'total' => Issue::count(),
                'open' => Issue::where('status', 'open')->count(),
                'in_progress' => Issue::where('status', 'in_progress')->count(),
                'resolved' => Issue::where('status', 'resolved')->count(),
                'closed' => Issue::where('status', 'closed')->count(),
                'by_priority' => [
                    'critical' => Issue::where('priority', 'critical')->count(),
                    'high' => Issue::where('priority', 'high')->count(),
                    'medium' => Issue::where('priority', 'medium')->count(),
                    'low' => Issue::where('priority', 'low')->count(),
                ],
                'total_upvotes' => Issue::sum('upvotes_count'),
                'total_comments' => Issue::sum('comments_count'),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching issue stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch statistics'
            ], 500);
        }
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
