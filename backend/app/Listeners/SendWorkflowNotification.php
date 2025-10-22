<?php

namespace App\Listeners;

use App\Events\NewWorkflow;
use App\Services\PushNotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class SendWorkflowNotification
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
    public function handle(NewWorkflow $event): void
    {
        try {
            $workflow = $event->workflow;
            
            $title = "New Workflow: {$workflow->title}";
            $body = "Discover our new workflow: " . substr($workflow->description, 0, 100) . "...";
            $url = config('app.url') . "/workflows/{$workflow->slug}";
            $imageUrl = $workflow->image ? Storage::url($workflow->image) : null;

            $this->pushService->sendToSubscribersByType('workflows', $title, $body, $url, $imageUrl);
            
            Log::info('Workflow notification sent', [
                'workflow_id' => $workflow->id,
                'title' => $workflow->title
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send workflow notification', [
                'workflow_id' => $event->workflow->id,
                'error' => $e->getMessage()
            ]);
        }
    }
}
