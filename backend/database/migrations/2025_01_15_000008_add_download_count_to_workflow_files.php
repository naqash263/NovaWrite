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
                if (!Schema::hasColumn('workflow_files', 'download_count')) {
                    $table->integer('download_count')->default(0)->after('is_active');
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
                if (Schema::hasColumn('workflow_files', 'download_count')) {
                    $table->dropColumn('download_count');
                }
            });
        }
    }
};

