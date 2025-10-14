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
        // Add is_published to posts table
        if (Schema::hasTable('posts')) {
            Schema::table('posts', function (Blueprint $table) {
                if (!Schema::hasColumn('posts', 'is_published')) {
                    $table->boolean('is_published')->default(false)->after('content');
                }
                if (!Schema::hasColumn('posts', 'published_at')) {
                    $table->timestamp('published_at')->nullable()->after('is_published');
                }
            });
        }

        // Add is_featured to workflows table
        if (Schema::hasTable('workflows')) {
            Schema::table('workflows', function (Blueprint $table) {
                if (!Schema::hasColumn('workflows', 'is_featured')) {
                    $table->boolean('is_featured')->default(false)->after('status');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('posts')) {
            Schema::table('posts', function (Blueprint $table) {
                if (Schema::hasColumn('posts', 'is_published')) {
                    $table->dropColumn('is_published');
                }
                if (Schema::hasColumn('posts', 'published_at')) {
                    $table->dropColumn('published_at');
                }
            });
        }

        if (Schema::hasTable('workflows')) {
            Schema::table('workflows', function (Blueprint $table) {
                if (Schema::hasColumn('workflows', 'is_featured')) {
                    $table->dropColumn('is_featured');
                }
            });
        }
    }
};

