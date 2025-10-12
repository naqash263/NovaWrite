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
        Schema::create('gemini_api_keys', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('api_key'); // Encrypted
            $table->integer('max_requests')->default(5);
            $table->integer('total_requests')->default(5);
            $table->integer('used_requests')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gemini_api_keys');
    }
};