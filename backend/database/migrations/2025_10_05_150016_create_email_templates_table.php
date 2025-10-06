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
        Schema::create('email_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // Template identifier (e.g., 'welcome', 'password_reset')
            $table->string('subject'); // Email subject line
            $table->text('body'); // Email body content (HTML/Markdown)
            $table->string('type')->default('markdown'); // 'markdown' or 'html'
            $table->json('variables')->nullable(); // Available variables for this template
            $table->text('description')->nullable(); // Template description
            $table->boolean('is_active')->default(true); // Whether template is active
            $table->string('category')->default('general'); // Template category
            $table->json('metadata')->nullable(); // Additional metadata
            $table->timestamps();
            
            $table->index(['is_active', 'category']);
            $table->index('name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_templates');
    }
};
