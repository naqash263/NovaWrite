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
        if (Schema::hasTable('lesson_tests')) {
            Schema::table('lesson_tests', function (Blueprint $table) {
                // Remove old conflicting columns that shouldn't exist
                if (Schema::hasColumn('lesson_tests', 'question')) {
                    $table->dropColumn('question');
                }
                if (Schema::hasColumn('lesson_tests', 'options')) {
                    $table->dropColumn('options');
                }
                if (Schema::hasColumn('lesson_tests', 'correct_answer')) {
                    $table->dropColumn('correct_answer');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('lesson_tests')) {
            Schema::table('lesson_tests', function (Blueprint $table) {
                // Add back the old columns if needed for rollback
                if (!Schema::hasColumn('lesson_tests', 'question')) {
                    $table->string('question')->nullable();
                }
                if (!Schema::hasColumn('lesson_tests', 'options')) {
                    $table->json('options')->nullable();
                }
                if (!Schema::hasColumn('lesson_tests', 'correct_answer')) {
                    $table->string('correct_answer')->nullable();
                }
            });
        }
    }
};