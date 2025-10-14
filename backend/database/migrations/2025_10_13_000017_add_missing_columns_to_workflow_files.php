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
                if (!Schema::hasColumn('workflow_files', 'display_name')) {
                    $table->string('display_name')->after('file_id');
                }
                if (!Schema::hasColumn('workflow_files', 'description')) {
                    $table->text('description')->nullable()->after('display_name');
                }
                if (!Schema::hasColumn('workflow_files', 'sort_order')) {
                    $table->integer('sort_order')->default(0)->after('description');
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
                if (Schema::hasColumn('workflow_files', 'display_name')) {
                    $table->dropColumn('display_name');
                }
                if (Schema::hasColumn('workflow_files', 'description')) {
                    $table->dropColumn('description');
                }
                if (Schema::hasColumn('workflow_files', 'sort_order')) {
                    $table->dropColumn('sort_order');
                }
            });
        }
    }
};

