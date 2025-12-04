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
        if (!Schema::hasTable('issue_upvotes')) {
            // Check if issues table exists first
            if (!Schema::hasTable('issues')) {
                throw new \Exception('The issues table must be created before issue_upvotes table');
            }
            
            Schema::create('issue_upvotes', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('issue_id');
                $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade');
                $table->string('guest_ip')->nullable();
                $table->timestamps();
                
                // Unique constraint handled in application logic
                $table->index('issue_id');
                $table->index('user_id');
            });
            
            // Add foreign key constraint after table creation
            Schema::table('issue_upvotes', function (Blueprint $table) {
                $table->foreign('issue_id')->references('id')->on('issues')->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('issue_upvotes');
    }
};
