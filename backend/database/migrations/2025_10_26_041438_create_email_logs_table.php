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
        Schema::create('email_logs', function (Blueprint $table) {
            $table->id();
            $table->string('action');
            $table->string('recipient_email');
            $table->enum('status', ['success', 'failed']);
            $table->text('error_message')->nullable();
            $table->json('payload');
            $table->json('response')->nullable();
            $table->integer('attempts');
            $table->timestamps();
            
            $table->index(['status', 'created_at']);
            $table->index('action');
            $table->index('recipient_email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_logs');
    }
};