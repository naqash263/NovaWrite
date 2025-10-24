<?php

namespace App\Providers;

use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;

// Import events
use App\Events\NewBlogPost;
use App\Events\NewCourse;
use App\Events\NewWorkflow;
use App\Events\CareerToolUpdate;
use App\Events\UserRegistered;
use App\Events\UserLoggedIn;
use App\Events\PasswordResetRequested;

// Import listeners
use App\Listeners\SendBlogPostNotification;
use App\Listeners\SendCourseNotification;
use App\Listeners\SendWorkflowNotification;
use App\Listeners\SendCareerToolNotification;
use App\Listeners\SendWelcomeEmail;
use App\Listeners\SendPasswordResetEmail;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        Registered::class => [
            SendEmailVerificationNotification::class,
        ],

        // Push notification events
        NewBlogPost::class => [
            SendBlogPostNotification::class,
        ],

        NewCourse::class => [
            SendCourseNotification::class,
        ],

        NewWorkflow::class => [
            SendWorkflowNotification::class,
        ],

        CareerToolUpdate::class => [
            SendCareerToolNotification::class,
        ],

        // Email template events
        UserRegistered::class => [
            SendWelcomeEmail::class,
        ],

        PasswordResetRequested::class => [
            SendPasswordResetEmail::class,
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        //
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
