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
        // Add order and published_at to courses
        if (Schema::hasTable('courses')) {
            Schema::table('courses', function (Blueprint $table) {
                if (!Schema::hasColumn('courses', 'order')) {
                    $table->integer('order')->default(0)->after('is_published');
                }
                if (!Schema::hasColumn('courses', 'published_at')) {
                    $table->timestamp('published_at')->nullable()->after('is_published');
                }
            });
        }

        // Add published_at to workflows (if not already added)
        if (Schema::hasTable('workflows')) {
            Schema::table('workflows', function (Blueprint $table) {
                if (!Schema::hasColumn('workflows', 'published_at')) {
                    $table->timestamp('published_at')->nullable()->after('is_published');
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
                if (Schema::hasColumn('courses', 'order')) {
                    $table->dropColumn('order');
                }
                if (Schema::hasColumn('courses', 'published_at')) {
                    $table->dropColumn('published_at');
                }
            });
        }

        if (Schema::hasTable('workflows')) {
            Schema::table('workflows', function (Blueprint $table) {
                if (Schema::hasColumn('workflows', 'published_at')) {
                    $table->dropColumn('published_at');
                }
            });
        }
    }
};

