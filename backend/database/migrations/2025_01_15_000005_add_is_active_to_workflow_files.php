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
        if (Schema::hasTable('workflow_files')) {
            Schema::table('workflow_files', function (Blueprint $table) {
                if (!Schema::hasColumn('workflow_files', 'is_active')) {
                    $table->boolean('is_active')->default(true)->after('description');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('workflow_files')) {
            Schema::table('workflow_files', function (Blueprint $table) {
                if (Schema::hasColumn('workflow_files', 'is_active')) {
                    $table->dropColumn('is_active');
                }
            });
        }
    }
};

