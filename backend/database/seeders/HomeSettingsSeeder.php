<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\HomeSettings;

class HomeSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $defaultSettings = [
            // Hero Section
            [
                'key' => 'hero_title',
                'type' => 'text',
                'value' => 'Welcome to Naqash Thaheem',
                'title' => 'Hero Title',
                'description' => 'Main title displayed on the home page hero section',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'key' => 'hero_subtitle',
                'type' => 'text',
                'value' => 'Your gateway to professional development and learning excellence',
                'title' => 'Hero Subtitle',
                'description' => 'Subtitle text displayed below the main title',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'key' => 'hero_image',
                'type' => 'image',
                'value' => 'home-images/hero-default.jpg',
                'title' => 'Hero Background Image',
                'description' => 'Background image for the hero section',
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'key' => 'hero_cta_text',
                'type' => 'text',
                'value' => 'Get Started',
                'title' => 'Hero Call-to-Action Text',
                'description' => 'Text for the main call-to-action button',
                'is_active' => true,
                'sort_order' => 4,
            ],

            // Notification Banner
            [
                'key' => 'notification_enabled',
                'type' => 'boolean',
                'value' => '1',
                'title' => 'Show Notification Banner',
                'description' => 'Enable or disable the notification banner on the home page',
                'is_active' => true,
                'sort_order' => 10,
            ],
            [
                'key' => 'notification_message',
                'type' => 'text',
                'value' => 'Welcome to our new platform! Check out our latest courses and workflows.',
                'title' => 'Notification Message',
                'description' => 'Message text displayed in the notification banner',
                'is_active' => true,
                'sort_order' => 11,
            ],
            [
                'key' => 'notification_type',
                'type' => 'text',
                'value' => 'info',
                'title' => 'Notification Type',
                'description' => 'Type of notification (info, success, warning, error)',
                'is_active' => true,
                'sort_order' => 12,
            ],

            // Featured Content
            [
                'key' => 'featured_courses_title',
                'type' => 'text',
                'value' => 'Featured Courses',
                'title' => 'Featured Courses Section Title',
                'description' => 'Title for the featured courses section',
                'is_active' => true,
                'sort_order' => 20,
            ],
            [
                'key' => 'featured_workflows_title',
                'type' => 'text',
                'value' => 'Popular Workflows',
                'title' => 'Featured Workflows Section Title',
                'description' => 'Title for the featured workflows section',
                'is_active' => true,
                'sort_order' => 21,
            ],

            // About Section
            [
                'key' => 'about_title',
                'type' => 'text',
                'value' => 'About Naqash Thaheem',
                'title' => 'About Section Title',
                'description' => 'Title for the about section',
                'is_active' => true,
                'sort_order' => 30,
            ],
            [
                'key' => 'about_content',
                'type' => 'text',
                'value' => 'We are dedicated to providing high-quality educational content and professional development resources to help you achieve your goals.',
                'title' => 'About Section Content',
                'description' => 'Main content for the about section',
                'is_active' => true,
                'sort_order' => 31,
            ],
            [
                'key' => 'about_image',
                'type' => 'image',
                'value' => 'home-images/about-default.jpg',
                'title' => 'About Section Image',
                'description' => 'Image displayed in the about section',
                'is_active' => true,
                'sort_order' => 32,
            ],

            // Contact Information
            [
                'key' => 'contact_email',
                'type' => 'text',
                'value' => 'naqash263@gmail.com',
                'title' => 'Contact Email',
                'description' => 'Primary contact email address',
                'is_active' => true,
                'sort_order' => 40,
            ],
            [
                'key' => 'contact_phone',
                'type' => 'text',
                'value' => '+971 XX XXX XXXX',
                'title' => 'Contact Phone',
                'description' => 'Primary contact phone number',
                'is_active' => true,
                'sort_order' => 41,
            ],
        ];

        foreach ($defaultSettings as $setting) {
            HomeSettings::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}