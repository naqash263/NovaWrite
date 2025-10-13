<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class FreshDatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user
        $admin = DB::table('users')->insertGetId([
            'name' => 'Naqash Thaheem',
            'email' => 'naqash263@gmail.com',
            'email_verified_at' => now(),
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'two_factor_enabled' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create sample categories
        $categories = [
            ['name' => 'Technology', 'slug' => 'technology', 'description' => 'Technology related content'],
            ['name' => 'Business', 'slug' => 'business', 'description' => 'Business and entrepreneurship'],
            ['name' => 'Education', 'slug' => 'education', 'description' => 'Educational content'],
        ];

        foreach ($categories as $category) {
            DB::table('categories')->insert(array_merge($category, [
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        // Create workflow categories
        $workflowCategories = [
            ['name' => 'Automation', 'slug' => 'automation', 'description' => 'Workflow automation tools'],
            ['name' => 'Productivity', 'slug' => 'productivity', 'description' => 'Productivity enhancement workflows'],
            ['name' => 'Data Processing', 'slug' => 'data-processing', 'description' => 'Data processing workflows'],
        ];

        foreach ($workflowCategories as $category) {
            DB::table('workflow_categories')->insert(array_merge($category, [
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        // Create sample Gemini API key
        DB::table('gemini_api_keys')->insert([
            'name' => 'admin',
            'api_key' => encrypt('AIzaSyDummyKeyReplaceWithYourActualKey123456789'),
            'max_requests' => 100,
            'total_requests' => 100,
            'used_requests' => 0,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create home settings
        $homeSettings = [
            ['key' => 'site_title', 'value' => 'NovaWrite - AI-Powered Content Platform'],
            ['key' => 'site_description', 'value' => 'Professional content creation and workflow automation platform'],
            ['key' => 'hero_title', 'value' => 'Transform Your Content Creation'],
            ['key' => 'hero_subtitle', 'value' => 'AI-powered tools for modern professionals'],
        ];

        foreach ($homeSettings as $setting) {
            DB::table('home_settings')->insert(array_merge($setting, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        // Create email templates
        $emailTemplates = [
            [
                'name' => 'welcome_email',
                'subject' => 'Welcome to NovaWrite!',
                'body' => '<h1>Welcome to NovaWrite!</h1><p>Thank you for joining our platform. We\'re excited to have you on board!</p>',
                'is_active' => true,
            ],
            [
                'name' => 'email_verification',
                'subject' => 'Verify Your Email Address',
                'body' => '<h1>Verify Your Email</h1><p>Please click the link below to verify your email address.</p>',
                'is_active' => true,
            ],
        ];

        foreach ($emailTemplates as $template) {
            DB::table('email_templates')->insert(array_merge($template, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        // Create SMTP configuration
        DB::table('smtp_configurations')->insert([
            'name' => 'default',
            'host' => 'smtp.gmail.com',
            'port' => 587,
            'username' => 'your-email@gmail.com',
            'password' => 'your-app-password',
            'encryption' => 'tls',
            'is_active' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create sample CV template
        DB::table('cv_templates')->insert([
            'name' => 'Professional Template',
            'description' => 'Clean and professional CV template',
            'template_html' => '<div class="cv-template"><h1>{{name}}</h1><p>{{email}}</p></div>',
            'template_css' => '.cv-template { font-family: Arial, sans-serif; }',
            'field_mappings' => json_encode([
                'name' => 'Full Name',
                'email' => 'Email Address',
                'phone' => 'Phone Number',
                'address' => 'Address',
            ]),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->command->info('Fresh database seeded successfully!');
        $this->command->info('Admin user created: naqash263@gmail.com / password123');
        $this->command->info('Sample data created for categories, workflows, and settings');
    }
}