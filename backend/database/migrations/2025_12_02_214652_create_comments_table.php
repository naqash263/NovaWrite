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
        if (!Schema::hasTable('comments')) {
            Schema::create('comments', function (Blueprint $table) {
                $table->id();
                $table->string('commentable_type'); // Post, Workflow, Course, Lesson, Project
                $table->unsignedBigInteger('commentable_id');
                $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade');
                $table->foreignId('parent_id')->nullable()->constrained('comments')->onDelete('cascade');
                $table->text('content');
                $table->string('guest_name')->nullable();
                $table->string('guest_email')->nullable();
                $table->boolean('is_approved')->default(true);
                $table->boolean('is_edited')->default(false);
                $table->timestamp('edited_at')->nullable();
                $table->integer('likes_count')->default(0);
                $table->integer('replies_count')->default(0);
                $table->boolean('is_pinned')->default(false);
                $table->boolean('is_spam')->default(false);
                $table->string('ip_address')->nullable();
                $table->text('user_agent')->nullable();
                $table->timestamps();
                
                // Composite index for polymorphic relationship
                $table->index(['commentable_type', 'commentable_id']);
                $table->index('user_id');
                $table->index('parent_id');
                $table->index('is_approved');
                $table->index('created_at');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('comments');
    }
};
