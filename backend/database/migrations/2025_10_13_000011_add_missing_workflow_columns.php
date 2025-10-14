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
        if (Schema::hasTable('workflows')) {
            Schema::table('workflows', function (Blueprint $table) {
                // Rename category_id to workflow_category_id if needed
                if (Schema::hasColumn('workflows', 'category_id') && !Schema::hasColumn('workflows', 'workflow_category_id')) {
                    $table->renameColumn('category_id', 'workflow_category_id');
                }
                
                if (!Schema::hasColumn('workflows', 'summary')) {
                    $table->text('summary')->nullable()->after('slug');
                }
                if (!Schema::hasColumn('workflows', 'tools')) {
                    $table->json('tools')->nullable()->after('description');
                }
                if (!Schema::hasColumn('workflows', 'benefits')) {
                    $table->json('benefits')->nullable()->after('tools');
                }
                if (!Schema::hasColumn('workflows', 'created_by')) {
                    $table->foreignId('created_by')->nullable()->constrained('users')->after('is_featured');
                }
                if (!Schema::hasColumn('workflows', 'updated_by')) {
                    $table->foreignId('updated_by')->nullable()->constrained('users')->after('created_by');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('workflows')) {
            Schema::table('workflows', function (Blueprint $table) {
                if (Schema::hasColumn('workflows', 'workflow_category_id') && !Schema::hasColumn('workflows', 'category_id')) {
                    $table->renameColumn('workflow_category_id', 'category_id');
                }
                
                $columns = ['summary', 'tools', 'benefits', 'created_by', 'updated_by'];
                foreach ($columns as $column) {
                    if (Schema::hasColumn('workflows', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};

