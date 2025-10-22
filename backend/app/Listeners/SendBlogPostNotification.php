<?php

namespace App\Listeners;

use App\Events\NewBlogPost;
use App\Services\PushNotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class SendBlogPostNotification
{
    protected $pushService;

    /**
     * Create the event listener.
     */
    public function __construct(PushNotificationService $pushService)
    {
        $this->pushService = $pushService;
    }

    /**
     * Handle the event.
     */
    public function handle(NewBlogPost $event): void
    {
        try {
            $post = $event->post;
            
            $title = "New Blog Post: {$post->title}";
            $body = "Check out our latest blog post: " . substr($post->excerpt, 0, 100) . "...";
            $url = config('app.url') . "/posts/{$post->slug}";
            $imageUrl = $post->featured_image ? Storage::url($post->featured_image) : null;

            $this->pushService->sendToSubscribersByType('blogPosts', $title, $body, $url, $imageUrl);
            
            Log::info('Blog post notification sent', [
                'post_id' => $post->id,
                'title' => $post->title
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send blog post notification', [
                'post_id' => $event->post->id,
                'error' => $e->getMessage()
            ]);
        }
    }
}
