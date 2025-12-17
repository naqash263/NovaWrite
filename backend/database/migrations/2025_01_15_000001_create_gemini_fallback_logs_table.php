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
        if (!Schema::hasTable('gemini_fallback_logs')) {
            Schema::create('gemini_fallback_logs', function (Blueprint $table) {
                $table->id();
                $table->string('tool_type', 50)->index();
                $table->string('prompt_hash', 64)->nullable();
                $table->string('fallback_reason', 50)->index();
                $table->string('gemini_error_code', 20)->nullable();
                $table->text('gemini_error_message')->nullable();
                $table->decimal('n8n_response_time', 10, 3)->nullable();
                $table->boolean('success')->default(false);
                $table->integer('response_size')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamp('created_at')->index();
                
                $table->index(['tool_type', 'created_at']);
                $table->index(['fallback_reason', 'created_at']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gemini_fallback_logs');
    }
};
