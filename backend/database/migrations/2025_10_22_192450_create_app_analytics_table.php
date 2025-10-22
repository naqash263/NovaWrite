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
        Schema::create('app_analytics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('event_type'); // 'install', 'uninstall', 'launch', 'background'
            $table->string('session_id')->nullable(); // Track user sessions
            $table->string('device_id')->nullable(); // Unique device identifier
            
            // Location data
            $table->string('country')->nullable();
            $table->string('region')->nullable();
            $table->string('city')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->string('timezone')->nullable();
            
            // Device information
            $table->string('user_agent')->nullable();
            $table->string('platform')->nullable(); // 'ios', 'android', 'desktop', 'unknown'
            $table->string('browser')->nullable();
            $table->string('browser_version')->nullable();
            $table->string('os')->nullable();
            $table->string('os_version')->nullable();
            $table->string('device_type')->nullable(); // 'mobile', 'tablet', 'desktop'
            $table->string('screen_resolution')->nullable();
            $table->boolean('is_mobile')->default(false);
            $table->boolean('is_tablet')->default(false);
            $table->boolean('is_desktop')->default(false);
            
            // App-specific data
            $table->string('app_version')->nullable();
            $table->string('install_source')->nullable(); // 'banner', 'header_button', 'browser_prompt'
            $table->string('uninstall_reason')->nullable(); // 'user_action', 'system', 'unknown'
            $table->integer('session_duration')->nullable(); // in seconds
            $table->integer('page_views')->nullable();
            $table->json('custom_data')->nullable(); // Additional tracking data
            
            // Network information
            $table->string('ip_address')->nullable();
            $table->string('referrer')->nullable();
            $table->string('utm_source')->nullable();
            $table->string('utm_medium')->nullable();
            $table->string('utm_campaign')->nullable();
            
            $table->timestamp('event_timestamp');
            $table->timestamps();
            
            // Indexes for better performance
            $table->index(['event_type', 'created_at']);
            $table->index(['user_id', 'event_type']);
            $table->index(['device_id', 'event_type']);
            $table->index(['country', 'event_type']);
            $table->index(['platform', 'event_type']);
            $table->index('event_timestamp');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('app_analytics');
    }
};