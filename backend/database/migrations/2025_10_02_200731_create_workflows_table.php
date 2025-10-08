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
        Schema::create('workflows', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('workflow_category_id');
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('summary')->nullable();
            $table->text('description');
            $table->json('tools')->nullable();
            $table->json('benefits')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->enum('status', ['draft', 'published'])->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            
            $table->index('workflow_category_id');
            $table->index('slug');
            $table->index('status');
        });

        // Add foreign key constraints after table creation
        Schema::table('workflows', function (Blueprint $table) {
            $table->foreign('workflow_category_id')->references('id')->on('workflow_categories')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop foreign key constraints first
        Schema::table('workflows', function (Blueprint $table) {
            $table->dropForeign(['workflow_category_id']);
            $table->dropForeign(['created_by']);
            $table->dropForeign(['updated_by']);
        });
        
        Schema::dropIfExists('workflows');
    }
};
