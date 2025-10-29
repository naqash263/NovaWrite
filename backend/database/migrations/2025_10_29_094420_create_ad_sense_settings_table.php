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
        if (!Schema::hasTable('ad_sense_settings')) {
            Schema::create('ad_sense_settings', function (Blueprint $table) {
                $table->id();
                $table->string('key')->unique();
                $table->text('value')->nullable();
                $table->string('title')->nullable();
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(false);
                $table->integer('sort_order')->default(0);
                $table->timestamps();
                
                $table->index('key');
                $table->index('is_active');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ad_sense_settings');
    }
};
