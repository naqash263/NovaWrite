<?php

namespace App\Services;

use App\Models\PushSubscription;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;
use Illuminate\Support\Facades\Log;
use Exception;

class PushNotificationService
{
    private WebPush $webPush;

    public function __construct()
    {
        $this->webPush = new WebPush([
            'VAPID' => [
                'subject' => config('app.url'),
                'publicKey' => config('push.vapid.public_key'),
                'privateKey' => config('push.vapid.private_key'),
            ],
        ]);
    }

    /**
     * Send a notification to all active subscribers.
     */
    public function sendToAll(string $title, string $body, array $options = []): array
    {
        $subscriptions = PushSubscription::active()->get();
        return $this->sendToSubscriptions($subscriptions, $title, $body, $options);
    }

    /**
     * Send a notification to subscribers of a specific type.
     */
    public function sendToType(string $type, string $title, string $body, array $options = []): array
    {
        $subscriptions = PushSubscription::active()
            ->forNotificationType($type)
            ->get();
        
        return $this->sendToSubscriptions($subscriptions, $title, $body, $options);
    }

    /**
     * Send a notification to a specific user.
     */
    public function sendToUser(int $userId, string $title, string $body, array $options = []): array
    {
        $subscriptions = PushSubscription::active()
            ->forUser($userId)
            ->get();
        
        return $this->sendToSubscriptions($subscriptions, $title, $body, $options);
    }

    /**
     * Send a test notification to the current user.
     */
    public function sendTestNotification(int $userId, string $title = 'Test Notification', string $body = 'This is a test notification from NovaWrite!'): array
    {
        return $this->sendToUser($userId, $title, $body, [
            'url' => config('app.url'),
            'icon' => config('app.url') . '/pwa-192x192.png',
            'badge' => config('app.url') . '/pwa-192x192.png',
        ]);
    }

    /**
     * Send notifications to a collection of subscriptions.
     */
    private function sendToSubscriptions($subscriptions, string $title, string $body, array $options = []): array
    {
        $results = [];
        $successCount = 0;
        $failureCount = 0;

        foreach ($subscriptions as $subscription) {
            try {
                $payload = json_encode([
                    'title' => $title,
                    'body' => $body,
                    'icon' => $options['icon'] ?? config('app.url') . '/pwa-192x192.png',
                    'badge' => $options['badge'] ?? config('app.url') . '/pwa-192x192.png',
                    'url' => $options['url'] ?? config('app.url'),
                    'data' => $options['data'] ?? [],
                ]);

                $webPushSubscription = Subscription::create($subscription->getSubscriptionData());
                $this->webPush->queueNotification($webPushSubscription, $payload);
                
                $subscription->markAsUsed();
                $successCount++;
                
            } catch (Exception $e) {
                Log::error('Failed to queue push notification', [
                    'subscription_id' => $subscription->id,
                    'error' => $e->getMessage(),
                ]);
                $failureCount++;
            }
        }

        // Send all queued notifications
        $report = $this->webPush->flush();

        foreach ($report as $result) {
            if (!$result->isSuccess()) {
                Log::error('Failed to send push notification', [
                    'error' => $result->getReason(),
                ]);
                $failureCount++;
            } else {
                $successCount++;
            }
        }

        return [
            'success_count' => $successCount,
            'failure_count' => $failureCount,
            'total_sent' => $successCount + $failureCount,
        ];
    }

    /**
     * Send notification to subscribers by type.
     */
    public function sendToSubscribersByType(string $type, string $title, string $body, ?string $url = null, ?string $imageUrl = null): array
    {
        $subscriptions = PushSubscription::where('is_active', true)
            ->whereJsonContains('preferences->' . $type, true)
            ->get();

        return $this->sendToSubscriptions($subscriptions, $title, $body, [
            'url' => $url,
            'icon' => config('app.url') . '/pwa-192x192.png',
            'badge' => config('app.url') . '/pwa-192x192.png',
            'image' => $imageUrl,
        ]);
    }

    /**
     * Get notification statistics.
     */
    public function getStatistics(): array
    {
        $totalSubscribers = PushSubscription::count();
        $activeSubscribers = PushSubscription::active()->count();
        
        $notificationTypes = [
            'blogPosts' => PushSubscription::active()->forNotificationType('blogPosts')->count(),
            'courses' => PushSubscription::active()->forNotificationType('courses')->count(),
            'workflows' => PushSubscription::active()->forNotificationType('workflows')->count(),
            'careerTools' => PushSubscription::active()->forNotificationType('careerTools')->count(),
        ];

        return [
            'total_subscribers' => $totalSubscribers,
            'active_subscribers' => $activeSubscribers,
            'notification_types' => $notificationTypes,
        ];
    }

    /**
     * Send notification to subscribers by type.
     */
    public function sendToSubscribersByType(string $type, string $title, string $body, ?string $url = null, ?string $imageUrl = null): array
    {
        $subscriptions = PushSubscription::where('is_active', true)
            ->whereJsonContains('preferences->' . $type, true)
            ->get();

        return $this->sendToSubscriptions($subscriptions, $title, $body, [
            'url' => $url,
            'icon' => config('app.url') . '/pwa-192x192.png',
            'badge' => config('app.url') . '/pwa-192x192.png',
            'image' => $imageUrl,
        ]);
    }

    /**
     * Clean up inactive subscriptions.
     */
    public function cleanupInactiveSubscriptions(int $daysInactive = 30): int
    {
        $cutoffDate = now()->subDays($daysInactive);
        
        return PushSubscription::where('last_used_at', '<', $cutoffDate)
            ->orWhere(function ($query) use ($cutoffDate) {
                $query->whereNull('last_used_at')
                      ->where('created_at', '<', $cutoffDate);
            })
            ->update(['is_active' => false]);
    }
}
