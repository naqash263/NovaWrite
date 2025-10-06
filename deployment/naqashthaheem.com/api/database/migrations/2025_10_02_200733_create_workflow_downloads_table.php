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
        Schema::create('workflow_downloads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_id')->constrained()->onDelete('cascade');
            $table->foreignId('workflow_file_id')->constrained()->onDelete('cascade');
            $table->string('email');
            $table->timestamp('downloaded_at');
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->boolean('marketing_opt_in')->default(false);
            $table->timestamps();
            
            $table->index('email');
            $table->index('workflow_id');
            $table->index('downloaded_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workflow_downloads');
    }
};
