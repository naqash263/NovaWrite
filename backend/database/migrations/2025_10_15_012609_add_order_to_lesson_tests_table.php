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
                if (!Schema::hasColumn('lesson_tests', 'order')) {
                    $table->integer('order')->default(0)->after('is_active');
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
                if (Schema::hasColumn('lesson_tests', 'order')) {
                    $table->dropColumn('order');
                }
            });
        }
    }
};
