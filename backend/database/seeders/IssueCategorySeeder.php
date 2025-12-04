<?php

namespace Database\Seeders;

use App\Models\IssueCategory;
use Illuminate\Database\Seeder;

class IssueCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Technical Support',
                'slug' => 'technical-support',
                'description' => 'Get help with technical issues, troubleshooting, and technical questions',
                'color' => '#3B82F6', // Blue
                'icon' => 'wrench',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Programming Help',
                'slug' => 'programming-help',
                'description' => 'Ask questions about coding, programming languages, and development',
                'color' => '#10B981', // Green
                'icon' => 'code',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'System Administration',
                'slug' => 'system-administration',
                'description' => 'Server management, deployment, and system administration questions',
                'color' => '#F59E0B', // Amber
                'icon' => 'server',
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'name' => 'Database Questions',
                'slug' => 'database-questions',
                'description' => 'Database design, queries, optimization, and database-related issues',
                'color' => '#8B5CF6', // Purple
                'icon' => 'database',
                'is_active' => true,
                'sort_order' => 4,
            ],
            [
                'name' => 'Networking & Security',
                'slug' => 'networking-security',
                'description' => 'Network configuration, security best practices, and cybersecurity questions',
                'color' => '#EF4444', // Red
                'icon' => 'shield',
                'is_active' => true,
                'sort_order' => 5,
            ],
            [
                'name' => 'Cloud Services',
                'slug' => 'cloud-services',
                'description' => 'AWS, Azure, GCP, and other cloud platform questions',
                'color' => '#06B6D4', // Cyan
                'icon' => 'cloud',
                'is_active' => true,
                'sort_order' => 6,
            ],
            [
                'name' => 'DevOps & CI/CD',
                'slug' => 'devops-cicd',
                'description' => 'DevOps practices, CI/CD pipelines, and automation tools',
                'color' => '#6366F1', // Indigo
                'icon' => 'rocket',
                'is_active' => true,
                'sort_order' => 7,
            ],
            [
                'name' => 'General IT Discussion',
                'slug' => 'general-it-discussion',
                'description' => 'General IT topics, career advice, and industry discussions',
                'color' => '#64748B', // Slate
                'icon' => 'chat',
                'is_active' => true,
                'sort_order' => 8,
            ],
            [
                'name' => 'Other',
                'slug' => 'other',
                'description' => 'Other questions and topics not covered by other categories',
                'color' => '#94A3B8', // Gray
                'icon' => 'more',
                'is_active' => true,
                'sort_order' => 99,
            ],
        ];

        foreach ($categories as $categoryData) {
            IssueCategory::firstOrCreate(
                ['slug' => $categoryData['slug']],
                $categoryData
            );
        }
    }
}

