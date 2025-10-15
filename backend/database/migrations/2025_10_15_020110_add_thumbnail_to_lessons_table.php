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
                if (!Schema::hasColumn('lessons', 'thumbnail')) {
                    $table->string('thumbnail', 500)->nullable()->after('title');
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
                if (Schema::hasColumn('lessons', 'thumbnail')) {
                    $table->dropColumn('thumbnail');
                }
            });
        }
    }
};
