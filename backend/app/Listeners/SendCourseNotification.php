<?php

namespace App\Listeners;

use App\Events\NewCourse;
use App\Services\PushNotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class SendCourseNotification
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
    public function handle(NewCourse $event): void
    {
        try {
            $course = $event->course;
            
            $title = "New Course: {$course->title}";
            $body = "Enroll in our new course: " . substr($course->description, 0, 100) . "...";
            $url = config('app.url') . "/courses/{$course->slug}";
            $imageUrl = $course->image ? Storage::url($course->image) : null;

            $this->pushService->sendToSubscribersByType('courses', $title, $body, $url, $imageUrl);
            
            Log::info('Course notification sent', [
                'course_id' => $course->id,
                'title' => $course->title
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send course notification', [
                'course_id' => $event->course->id,
                'error' => $e->getMessage()
            ]);
        }
    }
}
