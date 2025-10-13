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
        // Create gemini_api_keys table if it doesn't exist
        if (!Schema::hasTable('gemini_api_keys')) {
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
            
            // Insert sample API key
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
        }
        
        // Create user_api_keys table if it doesn't exist
        if (!Schema::hasTable('user_api_keys')) {
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
        
        // Create user_activities table if it doesn't exist
        if (!Schema::hasTable('user_activities')) {
            Schema::create('user_activities', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->string('action');
                $table->text('description');
                $table->json('metadata')->nullable();
                $table->timestamps();
                
                $table->index(['user_id', 'created_at']);
            });
        }
        
        // Create cv_templates table if it doesn't exist
        if (!Schema::hasTable('cv_templates')) {
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
        
        // Create home_settings table if it doesn't exist
        if (!Schema::hasTable('home_settings')) {
            Schema::create('home_settings', function (Blueprint $table) {
                $table->id();
                $table->string('key')->unique();
                $table->text('value');
                $table->timestamps();
            });
        }
        
        // Create smtp_configurations table if it doesn't exist
        if (!Schema::hasTable('smtp_configurations')) {
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
        
        // Create email_templates table if it doesn't exist
        if (!Schema::hasTable('email_templates')) {
            Schema::create('email_templates', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('subject');
                $table->text('body');
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }
        
        // Create course_files table if it doesn't exist
        if (!Schema::hasTable('course_files')) {
            Schema::create('course_files', function (Blueprint $table) {
                $table->id();
                $table->foreignId('course_id')->constrained()->onDelete('cascade');
                $table->foreignId('file_id')->constrained()->onDelete('cascade');
                $table->timestamps();
            });
        }
        
        // Create lesson_files table if it doesn't exist
        if (!Schema::hasTable('lesson_files')) {
            Schema::create('lesson_files', function (Blueprint $table) {
                $table->id();
                $table->foreignId('lesson_id')->constrained()->onDelete('cascade');
                $table->foreignId('file_id')->constrained()->onDelete('cascade');
                $table->timestamps();
            });
        }
        
        // Create lesson_progress table if it doesn't exist
        if (!Schema::hasTable('lesson_progress')) {
            Schema::create('lesson_progress', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->foreignId('lesson_id')->constrained()->onDelete('cascade');
                $table->boolean('is_completed')->default(false);
                $table->timestamp('completed_at')->nullable();
                $table->timestamps();
            });
        }
        
        // Create lesson_tests table if it doesn't exist
        if (!Schema::hasTable('lesson_tests')) {
            Schema::create('lesson_tests', function (Blueprint $table) {
                $table->id();
                $table->string('question');
                $table->json('options');
                $table->string('correct_answer');
                $table->foreignId('lesson_id')->constrained()->onDelete('cascade');
                $table->timestamps();
            });
        }
        
        // Create test_attempts table if it doesn't exist
        if (!Schema::hasTable('test_attempts')) {
            Schema::create('test_attempts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->foreignId('test_id')->constrained('lesson_tests')->onDelete('cascade');
                $table->string('user_answer');
                $table->boolean('is_correct');
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('test_attempts');
        Schema::dropIfExists('lesson_tests');
        Schema::dropIfExists('lesson_progress');
        Schema::dropIfExists('lesson_files');
        Schema::dropIfExists('course_files');
        Schema::dropIfExists('email_templates');
        Schema::dropIfExists('smtp_configurations');
        Schema::dropIfExists('home_settings');
        Schema::dropIfExists('cv_templates');
        Schema::dropIfExists('user_activities');
        Schema::dropIfExists('user_api_keys');
        Schema::dropIfExists('gemini_api_keys');
    }
};