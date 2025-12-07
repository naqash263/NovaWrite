<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if table exists first
        if (!Schema::hasTable('issue_categories')) {
            Log::warning('issue_categories table does not exist, skipping category seeding');
            return;
        }

        // Only seed if categories don't exist
        $existingCount = DB::table('issue_categories')->count();
        if ($existingCount === 0) {
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
                DB::table('issue_categories')->insert([
                    'name' => $categoryData['name'],
                    'slug' => $categoryData['slug'],
                    'description' => $categoryData['description'],
                    'color' => $categoryData['color'],
                    'icon' => $categoryData['icon'],
                    'is_active' => $categoryData['is_active'],
                    'sort_order' => $categoryData['sort_order'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
            
            Log::info('Issue categories seeded successfully', [
                'count' => count($categories)
            ]);
        } else {
            Log::info('Issue categories already exist, skipping seed', [
                'existing_count' => $existingCount
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Don't delete categories on rollback - they might have issues attached
    }
};

