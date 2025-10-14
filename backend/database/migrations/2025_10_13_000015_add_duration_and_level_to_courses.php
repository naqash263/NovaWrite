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
        if (Schema::hasTable('courses')) {
            Schema::table('courses', function (Blueprint $table) {
                if (!Schema::hasColumn('courses', 'duration_hours')) {
                    $table->decimal('duration_hours', 8, 2)->default(0)->after('what_you_learn');
                }
                if (!Schema::hasColumn('courses', 'level')) {
                    $table->string('level')->default('beginner')->after('duration_hours');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('courses')) {
            Schema::table('courses', function (Blueprint $table) {
                if (Schema::hasColumn('courses', 'duration_hours')) {
                    $table->dropColumn('duration_hours');
                }
                if (Schema::hasColumn('courses', 'level')) {
                    $table->dropColumn('level');
                }
            });
        }
    }
};

