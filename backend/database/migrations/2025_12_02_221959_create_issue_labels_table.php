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
        if (!Schema::hasTable('issue_labels')) {
            Schema::create('issue_labels', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();
                $table->string('color')->default('#6B7280'); // Hex color
                $table->text('description')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('issue_labels');
    }
};
