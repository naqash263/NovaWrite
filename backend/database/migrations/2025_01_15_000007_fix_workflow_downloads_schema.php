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
                // Add missing columns if they don't exist
                if (!Schema::hasColumn('workflow_downloads', 'email')) {
                    $table->string('email')->nullable()->after('workflow_file_id');
                }
                if (!Schema::hasColumn('workflow_downloads', 'ip_address')) {
                    $table->string('ip_address')->nullable()->after('email');
                }
                if (!Schema::hasColumn('workflow_downloads', 'user_agent')) {
                    $table->text('user_agent')->nullable()->after('ip_address');
                }
                if (!Schema::hasColumn('workflow_downloads', 'marketing_opt_in')) {
                    $table->boolean('marketing_opt_in')->default(false)->after('user_agent');
                }
                // Add workflow_file_id if missing
                if (!Schema::hasColumn('workflow_downloads', 'workflow_file_id')) {
                    $table->foreignId('workflow_file_id')->nullable()->after('workflow_id');
                }
                // Make user_id nullable
                if (Schema::hasColumn('workflow_downloads', 'user_id')) {
                    $table->unsignedBigInteger('user_id')->nullable()->change();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // We can't safely reverse this
    }
};

