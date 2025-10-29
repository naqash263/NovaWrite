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
        if (Schema::hasTable('workflow_downloads')) {
            Schema::table('workflow_downloads', function (Blueprint $table) {
                if (Schema::hasColumn('workflow_downloads', 'token')) {
                    $table->dropColumn('token');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('workflow_downloads')) {
            Schema::table('workflow_downloads', function (Blueprint $table) {
                if (!Schema::hasColumn('workflow_downloads', 'token')) {
                    $table->string('token')->nullable()->after('workflow_file_id');
                }
            });
        }
    }
};