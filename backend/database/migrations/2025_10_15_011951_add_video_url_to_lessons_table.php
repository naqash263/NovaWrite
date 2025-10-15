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
        if (Schema::hasTable('lessons')) {
            Schema::table('lessons', function (Blueprint $table) {
                if (!Schema::hasColumn('lessons', 'video_url')) {
                    $table->string('video_url', 500)->nullable()->after('content');
                }
                if (!Schema::hasColumn('lessons', 'duration_minutes')) {
                    $table->integer('duration_minutes')->nullable()->after('video_url');
                }
                if (!Schema::hasColumn('lessons', 'is_free_preview')) {
                    $table->boolean('is_free_preview')->default(false)->after('order');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('lessons')) {
            Schema::table('lessons', function (Blueprint $table) {
                if (Schema::hasColumn('lessons', 'video_url')) {
                    $table->dropColumn('video_url');
                }
                if (Schema::hasColumn('lessons', 'duration_minutes')) {
                    $table->dropColumn('duration_minutes');
                }
                if (Schema::hasColumn('lessons', 'is_free_preview')) {
                    $table->dropColumn('is_free_preview');
                }
            });
        }
    }
};
