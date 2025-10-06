<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Post;
use App\Models\WorkflowCategory;
use App\Models\Workflow;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ContentSeeder extends Seeder
{
    public function run(): void
    {
        // Create blog categories (only if they don't exist)
        $categories = [
            [
                'name' => 'AI Automation',
                'slug' => 'ai-automation',
                'description' => 'Articles about artificial intelligence and automation technologies'
            ],
            [
                'name' => 'Business Intelligence',
                'slug' => 'business-intelligence',
                'description' => 'Insights on data analytics and business intelligence solutions'
            ],
            [
                'name' => 'CRM Integration',
                'slug' => 'crm-integration',
                'description' => 'Customer relationship management integration guides'
            ],
            [
                'name' => 'Power BI',
                'slug' => 'power-bi',
                'description' => 'Power BI tutorials and best practices'
            ]
        ];

        foreach ($categories as $categoryData) {
            Category::firstOrCreate(
                ['slug' => $categoryData['slug']],
                $categoryData
            );
        }

        // Create workflow categories (only if they don't exist)
        $workflowCategories = [
            [
                'name' => 'CRM Automation',
                'slug' => 'crm-automation',
                'description' => 'Customer relationship management automation workflows'
            ],
            [
                'name' => 'Data Processing',
                'slug' => 'data-processing',
                'description' => 'Workflows for data collection, processing, and transformation'
            ],
            [
                'name' => 'Email Marketing',
                'slug' => 'email-marketing',
                'description' => 'Automated email marketing and communication workflows'
            ],
            [
                'name' => 'Business Process',
                'slug' => 'business-process',
                'description' => 'General business process automation workflows'
            ]
        ];

        foreach ($workflowCategories as $categoryData) {
            WorkflowCategory::firstOrCreate(
                ['slug' => $categoryData['slug']],
                $categoryData
            );
        }

        // Get user for content creation
        $user = User::first();

        // Create sample blog posts
        $posts = [
            [
                'title' => 'Getting Started with AI Automation in Business',
                'excerpt' => 'Learn how to implement artificial intelligence automation to streamline your business processes and increase efficiency.',
                'content' => 'Artificial intelligence automation is revolutionizing how businesses operate. In this comprehensive guide, we\'ll explore the fundamentals of AI automation and how you can implement it in your organization...',
                'category_id' => 1,
                'is_published' => true,
                'published_at' => now()->subDays(7),
                'featured_image' => '/images/ai-automation.jpg'
            ],
            [
                'title' => 'Building Effective Power BI Dashboards',
                'excerpt' => 'Master the art of creating insightful and actionable Power BI dashboards that drive business decisions.',
                'content' => 'Power BI dashboards are powerful tools for data visualization and business intelligence. This guide will teach you best practices for creating effective dashboards...',
                'category_id' => 4,
                'is_published' => true,
                'published_at' => now()->subDays(5),
                'featured_image' => '/images/powerbi-dashboard.jpg'
            ],
            [
                'title' => 'CRM Integration Best Practices',
                'excerpt' => 'Discover proven strategies for integrating your CRM system with other business tools and platforms.',
                'content' => 'Customer Relationship Management (CRM) integration is crucial for maintaining a unified view of your customers across all touchpoints...',
                'category_id' => 3,
                'is_published' => true,
                'published_at' => now()->subDays(3),
                'featured_image' => '/images/crm-integration.jpg'
            ],
            [
                'title' => 'Data Analytics for Business Growth',
                'excerpt' => 'Learn how to leverage data analytics to identify growth opportunities and make data-driven decisions.',
                'content' => 'Data analytics is the key to understanding your business performance and identifying opportunities for growth...',
                'category_id' => 2,
                'is_published' => true,
                'published_at' => now()->subDays(1),
                'featured_image' => '/images/data-analytics.jpg'
            ]
        ];

        foreach ($posts as $postData) {
            $postData['slug'] = Str::slug($postData['title']);
            $postData['user_id'] = $user->id;
            Post::create($postData);
        }

        // Create sample workflows
        $workflows = [
            [
                'title' => 'Lead Qualification Automation',
                'summary' => 'Automatically qualify and score leads based on multiple criteria',
                'description' => 'This workflow automatically evaluates incoming leads using predefined scoring criteria, assigns lead scores, and routes qualified leads to the appropriate sales team members. It integrates with CRM systems and email marketing platforms.',
                'tools' => ['n8n', 'Zoho CRM', 'Gmail', 'Slack'],
                'benefits' => ['Faster lead processing', 'Consistent scoring criteria', 'Reduced manual work', 'Improved lead conversion'],
                'workflow_category_id' => 1,
                'is_featured' => true,
                'is_premium' => false,
                'is_published' => true,
                'published_at' => now()->subDays(10)
            ],
            [
                'title' => 'Automated Invoice Processing',
                'summary' => 'Streamline invoice processing from receipt to payment',
                'description' => 'This comprehensive workflow handles the entire invoice lifecycle - from email extraction and data validation to approval routing and payment processing. Includes OCR technology for accurate data extraction.',
                'tools' => ['n8n', 'Xero', 'Google Drive', 'Slack', 'OCR API'],
                'benefits' => ['Reduced processing time', 'Improved accuracy', 'Automated approval routing', 'Better audit trail'],
                'workflow_category_id' => 2,
                'is_featured' => false,
                'is_premium' => true,
                'is_published' => true,
                'published_at' => now()->subDays(8)
            ],
            [
                'title' => 'Social Media Content Calendar',
                'summary' => 'Automated content scheduling and engagement tracking',
                'description' => 'This workflow manages your entire social media presence by automatically scheduling posts across multiple platforms, tracking engagement metrics, and generating performance reports.',
                'tools' => ['n8n', 'Buffer', 'Google Sheets', 'Twitter API', 'Facebook API'],
                'benefits' => ['Consistent posting schedule', 'Multi-platform management', 'Engagement tracking', 'Performance analytics'],
                'workflow_category_id' => 3,
                'is_featured' => true,
                'is_premium' => false,
                'is_published' => true,
                'published_at' => now()->subDays(6)
            ],
            [
                'title' => 'Customer Onboarding Sequence',
                'summary' => 'Complete automated customer onboarding experience',
                'description' => 'A sophisticated onboarding workflow that guides new customers through product setup, sends educational content, schedules check-in calls, and tracks completion rates.',
                'tools' => ['n8n', 'Mailchimp', 'Calendly', 'Stripe', 'Airtable'],
                'benefits' => ['Improved customer experience', 'Reduced churn rate', 'Automated follow-ups', 'Progress tracking'],
                'workflow_category_id' => 4,
                'is_featured' => false,
                'is_premium' => true,
                'is_published' => true,
                'published_at' => now()->subDays(4)
            ]
        ];

        foreach ($workflows as $workflowData) {
            $workflowData['slug'] = Str::slug($workflowData['title']);
            Workflow::create($workflowData);
        }
    }
}