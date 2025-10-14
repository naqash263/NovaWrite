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
                if (!Schema::hasColumn('courses', 'image_url')) {
                    $table->string('image_url')->nullable()->after('description');
                }
                if (!Schema::hasColumn('courses', 'what_you_learn')) {
                    $table->text('what_you_learn')->nullable()->after('image_url');
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
                if (Schema::hasColumn('courses', 'image_url')) {
                    $table->dropColumn('image_url');
                }
                if (Schema::hasColumn('courses', 'what_you_learn')) {
                    $table->dropColumn('what_you_learn');
                }
            });
        }
    }
};

