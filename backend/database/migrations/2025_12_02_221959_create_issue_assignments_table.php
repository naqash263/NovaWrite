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
            Schema::create('issue_assignments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('issue_id')->constrained('issues')->onDelete('cascade');
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->foreignId('assigned_by')->constrained('users')->onDelete('cascade');
                $table->timestamp('assigned_at')->useCurrent();
                $table->text('notes')->nullable();
                $table->timestamps();
                
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
        Schema::dropIfExists('issue_assignments');
    }
};
