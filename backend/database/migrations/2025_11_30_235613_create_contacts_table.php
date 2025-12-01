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
        if (!Schema::hasTable('contacts')) {
            Schema::create('contacts', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('email');
                $table->string('phone')->nullable();
                $table->string('company')->nullable();
                $table->string('subject');
                $table->text('message');
                $table->enum('inquiry_type', ['general', 'consultation', 'project', 'partnership', 'other'])->default('general');
                $table->foreignId('file_id')->nullable()->constrained('files')->onDelete('set null');
                $table->string('ip_address')->nullable();
                $table->text('user_agent')->nullable();
                $table->boolean('is_read')->default(false);
                $table->timestamp('read_at')->nullable();
                $table->timestamps();
                
                $table->index('email');
                $table->index('inquiry_type');
                $table->index('is_read');
                $table->index('created_at');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contacts');
    }
};
