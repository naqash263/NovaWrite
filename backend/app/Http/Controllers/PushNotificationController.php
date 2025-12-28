<?php

namespace App\Http\Controllers;

use App\Models\PushSubscription;
use App\Services\PushNotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Exception;

class PushNotificationController extends Controller
{
    private PushNotificationService $pushService;

    public function __construct(PushNotificationService $pushService)
    {
        $this->pushService = $pushService;
    }

    /**
     * Subscribe to push notifications.
     */
    public function subscribe(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'subscription.endpoint' => 'required|url',
            'subscription.keys.p256dh' => 'required|string',
            'subscription.keys.auth' => 'required|string',
            'preferences' => 'sometimes|array',
            'preferences.blogPosts' => 'sometimes|boolean',
            'preferences.issues' => 'sometimes|boolean',
            'preferences.workflows' => 'sometimes|boolean',
            'preferences.careerTools' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $subscriptionData = $request->input('subscription');
            $preferences = $request->input('preferences', [
                'blogPosts' => true,
                'issues' => true,
                'workflows' => true,
                'careerTools' => true,
            ]);

            // Check if subscription already exists
            $existingSubscription = PushSubscription::where('endpoint', $subscriptionData['endpoint'])->first();

            if ($existingSubscription) {
                // Update existing subscription
                $existingSubscription->update([
                    'user_id' => Auth::id(),
                    'p256dh' => $subscriptionData['keys']['p256dh'],
                    'auth' => $subscriptionData['keys']['auth'],
                    'preferences' => $preferences,
                    'is_active' => true,
                    'last_used_at' => now(),
                ]);

                return response()->json([
                    'message' => 'Subscription updated successfully',
                    'subscription' => $existingSubscription
                ]);
            }

            // Create new subscription
            $subscription = PushSubscription::create([
                'user_id' => Auth::id(),
                'endpoint' => $subscriptionData['endpoint'],
                'p256dh' => $subscriptionData['keys']['p256dh'],
                'auth' => $subscriptionData['keys']['auth'],
                'preferences' => $preferences,
                'is_active' => true,
                'last_used_at' => now(),
            ]);

            return response()->json([
                'message' => 'Subscription created successfully',
                'subscription' => $subscription
            ], 201);

        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to create subscription',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Unsubscribe from push notifications.
     */
    public function unsubscribe(Request $request): JsonResponse
    {
        try {
            $userId = Auth::id();
            
            if (!$userId) {
                return response()->json([
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Deactivate all subscriptions for the user
            $deactivatedCount = PushSubscription::where('user_id', $userId)
                ->update(['is_active' => false]);

            return response()->json([
                'message' => 'Successfully unsubscribed from push notifications',
                'deactivated_count' => $deactivatedCount
            ]);

        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to unsubscribe',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update notification preferences.
     */
    public function updatePreferences(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'blogPosts' => 'sometimes|boolean',
            'courses' => 'sometimes|boolean',
            'workflows' => 'sometimes|boolean',
            'careerTools' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $userId = Auth::id();
            
            if (!$userId) {
                return response()->json([
                    'message' => 'User not authenticated'
                ], 401);
            }

            $preferences = $request->only(['blogPosts', 'courses', 'workflows', 'careerTools']);
            
            // Update preferences for all user subscriptions
            $updatedCount = PushSubscription::where('user_id', $userId)
                ->where('is_active', true)
                ->update(['preferences' => $preferences]);

            return response()->json([
                'message' => 'Preferences updated successfully',
                'updated_count' => $updatedCount,
                'preferences' => $preferences
            ]);

        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to update preferences',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get subscription status and preferences.
     */
    public function status(): JsonResponse
    {
        try {
            $userId = Auth::id();
            
            if (!$userId) {
                return response()->json([
                    'message' => 'User not authenticated'
                ], 401);
            }

            $subscription = PushSubscription::where('user_id', $userId)
                ->where('is_active', true)
                ->first();

            if (!$subscription) {
                return response()->json([
                    'is_subscribed' => false,
                    'preferences' => null
                ]);
            }

            return response()->json([
                'is_subscribed' => true,
                'preferences' => $subscription->preferences,
                'last_used_at' => $subscription->last_used_at,
            ]);

        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to get subscription status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send a notification (Admin only).
     */
    public function send(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'body' => 'required|string|max:1000',
            'type' => 'required|in:all,blogPosts,issues,workflows,careerTools',
            'url' => 'nullable|url',
            'imageUrl' => 'nullable|url',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $title = $request->input('title');
            $body = $request->input('body');
            $type = $request->input('type');
            $url = $request->input('url');
            $imageUrl = $request->input('imageUrl');

            $options = [];
            if ($url) {
                $options['url'] = $url;
            }
            if ($imageUrl) {
                $options['icon'] = $imageUrl;
                $options['badge'] = $imageUrl;
            }

            if ($type === 'all') {
                $result = $this->pushService->sendToAll($title, $body, $options);
            } else {
                $result = $this->pushService->sendToType($type, $title, $body, $options);
            }

            return response()->json([
                'message' => 'Notification sent successfully',
                'result' => $result
            ]);

        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to send notification',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send a test notification (Admin only).
     */
    public function sendTest(Request $request): JsonResponse
    {
        try {
            $userId = Auth::guard('api')->id();
            
            if (!$userId) {
                return response()->json([
                    'message' => 'User not authenticated',
                    'error' => 'Authentication required'
                ], 401);
            }

            // Check if sending to all subscribers or just current user
            $sendToAll = $request->input('send_to_all', false);
            
            if ($sendToAll) {
                // Send to all active subscribers
                $result = $this->pushService->sendToAll(
                    'Test Notification',
                    'This is a test notification from the admin panel',
                    [
                        'url' => config('app.url'),
                        'icon' => config('app.url') . '/pwa-192x192.png',
                        'badge' => config('app.url') . '/pwa-192x192.png',
                    ]
                );
            } else {
                // Send to current user only
                $result = $this->pushService->sendTestNotification($userId);
                
                // Check if user has subscription
                $userSubscription = \App\Models\PushSubscription::where('user_id', $userId)
                    ->where('is_active', true)
                    ->first();
                
                if (!$userSubscription) {
                    return response()->json([
                        'message' => 'No active subscription found for current user',
                        'result' => $result,
                        'debug' => [
                            'user_id' => $userId,
                            'has_subscription' => false,
                            'total_subscriptions' => \App\Models\PushSubscription::where('is_active', true)->count(),
                            'hint' => 'Please subscribe to notifications first, or use send_to_all=true to test with all subscribers'
                        ]
                    ], 200);
                }
            }

            return response()->json([
                'message' => 'Test notification sent successfully',
                'result' => $result,
                'debug' => [
                    'user_id' => $userId,
                    'send_to_all' => $sendToAll,
                    'total_active_subscriptions' => \App\Models\PushSubscription::where('is_active', true)->count(),
                ]
            ]);

        } catch (Exception $e) {
            \Log::error('Test notification error', [
                'user_id' => Auth::guard('api')->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Failed to send test notification',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get notification statistics (Admin only).
     */
    public function getStatistics(): JsonResponse
    {
        try {
            // Debug: Check authentication
            if (!Auth::guard('api')->check()) {
                return response()->json(['message' => 'Not authenticated'], 401);
            }
            
            $user = Auth::guard('api')->user();
            if (!$user->isAdmin()) {
                return response()->json(['message' => 'Admin access required'], 403);
            }
            
            $stats = $this->pushService->getStatistics();

            // Add debugging information
            $currentUserId = $user->id;
            $userSubscription = PushSubscription::where('user_id', $currentUserId)
                ->where('is_active', true)
                ->first();

            $stats['debug'] = [
                'current_user_id' => $currentUserId,
                'current_user_has_subscription' => $userSubscription ? true : false,
                'current_user_subscription_preferences' => $userSubscription ? $userSubscription->preferences : null,
                'all_subscriptions' => PushSubscription::select('id', 'user_id', 'is_active', 'preferences', 'created_at')
                    ->orderBy('created_at', 'desc')
                    ->limit(10)
                    ->get()
                    ->map(function($sub) {
                        return [
                            'id' => $sub->id,
                            'user_id' => $sub->user_id,
                            'is_active' => $sub->is_active,
                            'preferences' => $sub->preferences,
                            'created_at' => $sub->created_at,
                        ];
                    }),
            ];

            return response()->json($stats);

        } catch (Exception $e) {
            \Log::error('Push notification stats error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Failed to get statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}