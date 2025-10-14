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
        if (Schema::hasTable('posts')) {
            Schema::table('posts', function (Blueprint $table) {
                if (!Schema::hasColumn('posts', 'meta_description')) {
                    $table->text('meta_description')->nullable()->after('published_at');
                }
                if (!Schema::hasColumn('posts', 'meta_keywords')) {
                    $table->text('meta_keywords')->nullable()->after('meta_description');
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
                if (Schema::hasColumn('posts', 'meta_description')) {
                    $table->dropColumn('meta_description');
                }
                if (Schema::hasColumn('posts', 'meta_keywords')) {
                    $table->dropColumn('meta_keywords');
                }
            });
        }
    }
};

