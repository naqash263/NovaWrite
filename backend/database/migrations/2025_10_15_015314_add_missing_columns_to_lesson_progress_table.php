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
        if (Schema::hasTable('lesson_progress')) {
            Schema::table('lesson_progress', function (Blueprint $table) {
                if (!Schema::hasColumn('lesson_progress', 'time_spent_minutes')) {
                    $table->integer('time_spent_minutes')->default(0)->after('completed_at');
                }
                if (!Schema::hasColumn('lesson_progress', 'progress_data')) {
                    $table->json('progress_data')->nullable()->after('time_spent_minutes');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('lesson_progress')) {
            Schema::table('lesson_progress', function (Blueprint $table) {
                if (Schema::hasColumn('lesson_progress', 'time_spent_minutes')) {
                    $table->dropColumn('time_spent_minutes');
                }
                if (Schema::hasColumn('lesson_progress', 'progress_data')) {
                    $table->dropColumn('progress_data');
                }
            });
        }
    }
};
