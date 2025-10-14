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
        Schema::table('home_settings', function (Blueprint $table) {
            if (!Schema::hasColumn('home_settings', 'type')) {
                $table->string('type')->default('text')->after('key');
            }
            if (!Schema::hasColumn('home_settings', 'title')) {
                $table->string('title')->nullable()->after('value');
            }
            if (!Schema::hasColumn('home_settings', 'description')) {
                $table->text('description')->nullable()->after('title');
            }
            if (!Schema::hasColumn('home_settings', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('description');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('home_settings', function (Blueprint $table) {
            if (Schema::hasColumn('home_settings', 'type')) {
                $table->dropColumn('type');
            }
            if (Schema::hasColumn('home_settings', 'title')) {
                $table->dropColumn('title');
            }
            if (Schema::hasColumn('home_settings', 'description')) {
                $table->dropColumn('description');
            }
            if (Schema::hasColumn('home_settings', 'is_active')) {
                $table->dropColumn('is_active');
            }
        });
    }
};

