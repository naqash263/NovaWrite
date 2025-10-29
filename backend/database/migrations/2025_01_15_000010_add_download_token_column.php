<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('workflow_downloads')) {
            // Add download_token column if it doesn't exist
            if (!Schema::hasColumn('workflow_downloads', 'download_token')) {
                Schema::table('workflow_downloads', function (Blueprint $table) {
                    $table->uuid('download_token')->nullable()->unique();
                });
            }

            // Copy data from token to download_token if token exists and download_token is null
            if (Schema::hasColumn('workflow_downloads', 'token') && Schema::hasColumn('workflow_downloads', 'download_token')) {
                DB::statement('UPDATE workflow_downloads SET download_token = token WHERE download_token IS NULL AND token IS NOT NULL');
            }

            // Make download_token non-nullable after copying data (only if column exists)
            if (Schema::hasColumn('workflow_downloads', 'download_token')) {
                Schema::table('workflow_downloads', function (Blueprint $table) {
                    $table->uuid('download_token')->nullable(false)->change();
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('workflow_downloads')) {
            Schema::table('workflow_downloads', function (Blueprint $table) {
                if (Schema::hasColumn('workflow_downloads', 'download_token')) {
                    $table->dropColumn('download_token');
                }
            });
        }
    }
};

