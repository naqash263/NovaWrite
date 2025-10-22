<?php

return [
    'vapid' => [
        'public_key' => env('VAPID_PUBLIC_KEY'),
        'private_key' => env('VAPID_PRIVATE_KEY'),
    ],
    
    'default_preferences' => [
        'blogPosts' => true,
        'courses' => true,
        'workflows' => true,
        'careerTools' => true,
    ],
    
    'cleanup' => [
        'inactive_days' => env('PUSH_CLEANUP_INACTIVE_DAYS', 30),
    ],
];
