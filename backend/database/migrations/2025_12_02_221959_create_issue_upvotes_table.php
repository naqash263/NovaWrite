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
            Schema::create('issue_upvotes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('issue_id')->constrained('issues')->onDelete('cascade');
                $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade');
                $table->string('guest_ip')->nullable();
                $table->timestamps();
                
                // Unique constraint handled in application logic
                $table->index('issue_id');
                $table->index('user_id');
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
