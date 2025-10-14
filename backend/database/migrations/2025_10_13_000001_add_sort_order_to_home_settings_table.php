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
        // Check if the column doesn't exist before adding it
        if (!Schema::hasColumn('home_settings', 'sort_order')) {
            Schema::table('home_settings', function (Blueprint $table) {
                $table->integer('sort_order')->default(0)->after('is_active');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('home_settings', 'sort_order')) {
            Schema::table('home_settings', function (Blueprint $table) {
                $table->dropColumn('sort_order');
            });
        }
    }
};

