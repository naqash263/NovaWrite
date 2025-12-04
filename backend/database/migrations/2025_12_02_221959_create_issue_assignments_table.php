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
        if (!Schema::hasTable('issue_assignments')) {
            // Check if issues table exists first
            if (!Schema::hasTable('issues')) {
                throw new \Exception('The issues table must be created before issue_assignments table');
            }
            
            Schema::create('issue_assignments', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('issue_id');
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->foreignId('assigned_by')->constrained('users')->onDelete('cascade');
                $table->timestamp('assigned_at')->useCurrent();
                $table->text('notes')->nullable();
                $table->timestamps();
                
                $table->index('issue_id');
                $table->index('user_id');
            });
            
            // Add foreign key constraint after table creation
            Schema::table('issue_assignments', function (Blueprint $table) {
                $table->foreign('issue_id')->references('id')->on('issues')->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('issue_assignments');
    }
};
