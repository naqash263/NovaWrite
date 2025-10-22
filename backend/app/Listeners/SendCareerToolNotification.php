<?php

namespace App\Listeners;

use App\Events\CareerToolUpdate;
use App\Services\PushNotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class SendCareerToolNotification
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
    public function handle(CareerToolUpdate $event): void
    {
        try {
            $toolName = $event->toolName;
            $updateType = $event->updateType;
            $data = $event->data;
            
            $title = "Career Tool Update: {$toolName}";
            $body = "We've updated our {$toolName} tool with new features and improvements!";
            $url = config('app.url') . "/resources/" . strtolower(str_replace(' ', '-', $toolName));
            $imageUrl = $data['imageUrl'] ?? null;

            $this->pushService->sendToSubscribersByType('careerTools', $title, $body, $url, $imageUrl);
            
            Log::info('Career tool notification sent', [
                'tool_name' => $toolName,
                'update_type' => $updateType
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send career tool notification', [
                'tool_name' => $event->toolName,
                'error' => $e->getMessage()
            ]);
        }
    }
}
