<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop all existing tables if they exist (for fresh start)
        $this->dropAllTables();
        
        // Create all tables from scratch
        $this->createUsersTable();
        $this->createCacheTable();
        $this->createJobsTable();
        $this->createCategoriesTable();
        $this->createPostsTable();
        $this->createFilesTable();
        $this->createActivityLogsTable();
        $this->createWorkflowCategoriesTable();
        $this->createWorkflowsTable();
        $this->createWorkflowFilesTable();
        $this->createWorkflowDownloadsTable();
        $this->createCoursesTable();
        $this->createLessonsTable();
        $this->createEnrollmentsTable();
        $this->createLessonProgressTable();
        $this->createLessonTestsTable();
        $this->createTestAttemptsTable();
        $this->createEmailTemplatesTable();
        $this->createSmtpConfigurationsTable();
        $this->createHomeSettingsTable();
        $this->createGeminiApiKeysTable();
        $this->createUserApiKeysTable();
        $this->createCvTemplatesTable();
        $this->createUserActivitiesTable();
        $this->createApiTokensTable();
        $this->createCourseFilesTable();
        $this->createLessonFilesTable();
        
        // Add indexes and constraints
        $this->addIndexesAndConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $this->dropAllTables();
    }

    private function dropAllTables(): void
    {
        $tables = [
            'user_activities', 'cv_templates', 'user_api_keys', 'gemini_api_keys',
            'home_settings', 'smtp_configurations', 'email_templates', 'test_attempts',
            'lesson_tests', 'lesson_progress', 'lesson_files', 'course_files',
            'enrollments', 'lessons', 'courses', 'workflow_downloads', 'workflow_files',
            'workflows', 'workflow_categories', 'activity_logs', 'files', 'posts',
            'categories', 'jobs', 'cache', 'users'
        ];

        foreach ($tables as $table) {
            Schema::dropIfExists($table);
        }
    }

    private function createUsersTable(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('role')->default('user');
            $table->boolean('two_factor_enabled')->default(false);
            $table->timestamp('two_factor_confirmed_at')->nullable();
            $table->string('google_id')->nullable();
            $table->string('avatar')->nullable();
            $table->string('email_verification_token')->nullable();
            $table->string('password_reset_token')->nullable();
            $table->timestamp('password_reset_expires_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });
    }

    private function createCacheTable(): void
    {
        Schema::create('cache', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->mediumText('value');
            $table->integer('expiration');
        });
    }

    private function createJobsTable(): void
    {
        Schema::create('jobs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('queue')->index();
            $table->longText('payload');
            $table->unsignedTinyInteger('attempts');
            $table->unsignedInteger('reserved_at')->nullable();
            $table->unsignedInteger('available_at');
            $table->unsignedInteger('created_at');
        });
    }

    private function createCategoriesTable(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    private function createPostsTable(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('content');
            $table->text('excerpt')->nullable();
            $table->string('featured_image')->nullable();
            $table->enum('status', ['draft', 'pending', 'published', 'rejected'])->default('draft');
            $table->foreignId('category_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });
    }

    private function createFilesTable(): void
    {
        Schema::create('files', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('original_name');
            $table->string('path');
            $table->string('mime_type');
            $table->bigInteger('size');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });
    }

    private function createActivityLogsTable(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->string('action');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->text('description')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    private function createWorkflowCategoriesTable(): void
    {
        Schema::create('workflow_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    private function createWorkflowsTable(): void
    {
        Schema::create('workflows', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description');
            $table->text('instructions');
            $table->foreignId('category_id')->constrained('workflow_categories')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('status', ['draft', 'pending', 'approved', 'rejected'])->default('draft');
            $table->boolean('is_premium')->default(false);
            $table->boolean('is_published')->default(false);
            $table->timestamps();
        });
    }

    private function createWorkflowFilesTable(): void
    {
        Schema::create('workflow_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_id')->constrained()->onDelete('cascade');
            $table->foreignId('file_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });
    }

    private function createWorkflowDownloadsTable(): void
    {
        Schema::create('workflow_downloads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('download_token')->unique();
            $table->timestamp('downloaded_at');
            $table->timestamps();
        });
    }

    private function createCoursesTable(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description');
            $table->text('content');
            $table->string('featured_image')->nullable();
            $table->decimal('price', 10, 2)->default(0);
            $table->boolean('is_published')->default(false);
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });
    }

    private function createLessonsTable(): void
    {
        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('content');
            $table->integer('order');
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });
    }

    private function createEnrollmentsTable(): void
    {
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->timestamp('enrolled_at');
            $table->timestamps();
        });
    }

    private function createLessonProgressTable(): void
    {
        Schema::create('lesson_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('lesson_id')->constrained()->onDelete('cascade');
            $table->boolean('is_completed')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    private function createLessonTestsTable(): void
    {
        Schema::create('lesson_tests', function (Blueprint $table) {
            $table->id();
            $table->string('question');
            $table->json('options');
            $table->string('correct_answer');
            $table->foreignId('lesson_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });
    }

    private function createTestAttemptsTable(): void
    {
        Schema::create('test_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('test_id')->constrained('lesson_tests')->onDelete('cascade');
            $table->string('user_answer');
            $table->boolean('is_correct');
            $table->timestamps();
        });
    }

    private function createEmailTemplatesTable(): void
    {
        Schema::create('email_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('subject');
            $table->text('body');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    private function createSmtpConfigurationsTable(): void
    {
        Schema::create('smtp_configurations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('host');
            $table->integer('port');
            $table->string('username');
            $table->string('password');
            $table->string('encryption');
            $table->boolean('is_active')->default(false);
            $table->timestamps();
        });
    }

    private function createHomeSettingsTable(): void
    {
        Schema::create('home_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value');
            $table->timestamps();
        });
    }

    private function createGeminiApiKeysTable(): void
    {
        Schema::create('gemini_api_keys', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('api_key');
            $table->integer('max_requests')->default(100);
            $table->integer('total_requests')->default(100);
            $table->integer('used_requests')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    private function createUserApiKeysTable(): void
    {
        Schema::create('user_api_keys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->text('api_key');
            $table->integer('max_requests')->default(50);
            $table->integer('used_requests')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    private function createCvTemplatesTable(): void
    {
        Schema::create('cv_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->text('template_html');
            $table->text('template_css');
            $table->json('field_mappings');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    private function createUserActivitiesTable(): void
    {
        Schema::create('user_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('action');
            $table->text('description');
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    private function createApiTokensTable(): void
    {
        Schema::create('api_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->json('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    private function createCourseFilesTable(): void
    {
        Schema::create('course_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->foreignId('file_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });
    }

    private function createLessonFilesTable(): void
    {
        Schema::create('lesson_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lesson_id')->constrained()->onDelete('cascade');
            $table->foreignId('file_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });
    }

    private function addIndexesAndConstraints(): void
    {
        // Add performance indexes
        Schema::table('posts', function (Blueprint $table) {
            $table->index(['status', 'published_at']);
            $table->index(['category_id', 'status']);
        });

        Schema::table('workflows', function (Blueprint $table) {
            $table->index(['status', 'is_published']);
            $table->index(['category_id', 'status']);
        });

        Schema::table('activity_logs', function (Blueprint $table) {
            $table->index(['user_id', 'created_at']);
        });

        Schema::table('user_activities', function (Blueprint $table) {
            $table->index(['user_id', 'created_at']);
        });
    }
};