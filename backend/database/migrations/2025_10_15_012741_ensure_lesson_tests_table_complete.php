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
        // Create table if it doesn't exist
        if (!Schema::hasTable('lesson_tests')) {
            Schema::create('lesson_tests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('lesson_id')->constrained()->onDelete('cascade');
                $table->string('title');
                $table->text('description')->nullable();
                $table->json('questions');
                $table->integer('passing_score')->default(70);
                $table->integer('time_limit_minutes')->nullable();
                $table->boolean('is_active')->default(true);
                $table->integer('order')->default(0);
                $table->timestamps();
            });
        } else {
            // Add missing columns if table exists
            Schema::table('lesson_tests', function (Blueprint $table) {
                if (!Schema::hasColumn('lesson_tests', 'title')) {
                    $table->string('title')->after('lesson_id');
                }
                if (!Schema::hasColumn('lesson_tests', 'description')) {
                    $table->text('description')->nullable()->after('title');
                }
                if (!Schema::hasColumn('lesson_tests', 'questions')) {
                    $table->json('questions')->after('description');
                }
                if (!Schema::hasColumn('lesson_tests', 'passing_score')) {
                    $table->integer('passing_score')->default(70)->after('questions');
                }
                if (!Schema::hasColumn('lesson_tests', 'time_limit_minutes')) {
                    $table->integer('time_limit_minutes')->nullable()->after('passing_score');
                }
                if (!Schema::hasColumn('lesson_tests', 'is_active')) {
                    $table->boolean('is_active')->default(true)->after('time_limit_minutes');
                }
                if (!Schema::hasColumn('lesson_tests', 'order')) {
                    $table->integer('order')->default(0)->after('is_active');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Don't drop the table or columns in rollback - too risky
        // This is a safety migration that only adds missing columns
    }
};
