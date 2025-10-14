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
        if (!Schema::hasTable('home_settings')) {
        Schema::create('home_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // e.g., 'hero_image', 'notification_message', 'featured_courses_banner'
            $table->string('type')->default('text'); // text, image, boolean, json
            $table->text('value')->nullable(); // The actual content
            $table->string('title')->nullable(); // Display title for admin
            $table->text('description')->nullable(); // Description for admin
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('home_settings');
    }
};
