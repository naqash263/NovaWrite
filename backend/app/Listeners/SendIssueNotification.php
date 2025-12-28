<?php

namespace App\Listeners;

use App\Events\NewIssue;
use App\Services\PushNotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class SendIssueNotification
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
    public function handle(NewIssue $event): void
    {
        try {
            $issue = $event->issue;
            
            $title = "New Issue: {$issue->title}";
            $body = substr(strip_tags($issue->description ?? ''), 0, 100) . "...";
            $url = config('app.url') . "/community/issues/" . ($issue->slug ?? $issue->id);
            $imageUrl = null; // Issues don't have images, but we can add category icon later

            $this->pushService->sendToSubscribersByType('issues', $title, $body, $url, $imageUrl);
            
            Log::info('Issue notification sent', [
                'issue_id' => $issue->id,
                'title' => $issue->title
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send issue notification', [
                'issue_id' => $event->issue->id,
                'error' => $e->getMessage()
            ]);
        }
    }
}

