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
                // Add user_id column if it doesn't exist
                if (!Schema::hasColumn('workflow_downloads', 'user_id')) {
                    $table->unsignedBigInteger('user_id')->nullable()->after('email');
                    $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
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
                if (Schema::hasColumn('workflow_downloads', 'user_id')) {
                    $table->dropForeign(['user_id']);
                    $table->dropColumn('user_id');
                }
            });
        }
    }
};
