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
        if (Schema::hasTable('files')) {
            Schema::table('files', function (Blueprint $table) {
                if (!Schema::hasColumn('files', 'is_public')) {
                    $table->boolean('is_public')->default(true)->after('size');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('files')) {
            Schema::table('files', function (Blueprint $table) {
                if (Schema::hasColumn('files', 'is_public')) {
                    $table->dropColumn('is_public');
                }
            });
        }
    }
};

