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
        if (!Schema::hasTable('issues')) {
            Schema::create('issues', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->string('slug')->unique();
                $table->text('description');
                $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
                $table->string('guest_name')->nullable();
                $table->string('guest_email')->nullable();
                $table->unsignedBigInteger('category_id')->nullable();
                $table->enum('status', ['open', 'in_progress', 'resolved', 'closed', 'duplicate'])->default('open');
                $table->enum('priority', ['low', 'medium', 'high', 'critical'])->default('medium');
                $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null');
                $table->json('labels')->nullable(); // Array of label strings
                $table->integer('views_count')->default(0);
                $table->integer('upvotes_count')->default(0);
                $table->integer('comments_count')->default(0); // From comments system
                $table->boolean('is_pinned')->default(false);
                $table->boolean('is_locked')->default(false); // Lock resolved issues
                $table->text('resolution_notes')->nullable(); // How it was resolved
                $table->timestamp('resolved_at')->nullable();
                $table->foreignId('resolved_by')->nullable()->constrained('users')->onDelete('set null');
                $table->string('ip_address')->nullable();
                $table->timestamps();
                
                $table->index('user_id');
                $table->index('status');
                $table->index('priority');
                $table->index('category_id');
                $table->index('created_at');
                $table->index('slug');
            });
            
            // Add foreign key constraint for category_id if issue_categories table exists
            if (Schema::hasTable('issue_categories')) {
                Schema::table('issues', function (Blueprint $table) {
                    $table->foreign('category_id')->references('id')->on('issue_categories')->onDelete('set null');
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('issues');
    }
};
