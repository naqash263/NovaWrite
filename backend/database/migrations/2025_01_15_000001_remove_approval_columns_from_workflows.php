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
        Schema::table('workflows', function (Blueprint $table) {
            // Drop foreign key constraint first if it exists
            if ($this->constraintExists('workflows', 'workflows_approved_by_foreign')) {
                $table->dropForeign(['approved_by']);
            }
            
            // Drop columns if they exist
            if (Schema::hasColumn('workflows', 'approval_status')) {
                $table->dropColumn('approval_status');
            }
            if (Schema::hasColumn('workflows', 'rejection_reason')) {
                $table->dropColumn('rejection_reason');
            }
            if (Schema::hasColumn('workflows', 'approved_by')) {
                $table->dropColumn('approved_by');
            }
            if (Schema::hasColumn('workflows', 'approved_at')) {
                $table->dropColumn('approved_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('workflows', function (Blueprint $table) {
            // Re-add columns
            if (!Schema::hasColumn('workflows', 'approval_status')) {
                $table->enum('approval_status', ['pending', 'approved', 'rejected'])->default('pending')->after('status');
            }
            if (!Schema::hasColumn('workflows', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable()->after('approval_status');
            }
            if (!Schema::hasColumn('workflows', 'approved_by')) {
                $table->unsignedBigInteger('approved_by')->nullable()->after('rejection_reason');
            }
            if (!Schema::hasColumn('workflows', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()->after('approved_by');
            }
        });
        
        // Re-add foreign key constraint
        if (Schema::hasColumn('workflows', 'approved_by') && !$this->constraintExists('workflows', 'workflows_approved_by_foreign')) {
            Schema::table('workflows', function (Blueprint $table) {
                $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
            });
        }
    }

    private function constraintExists($table, $constraint)
    {
        // SQLite doesn't have information_schema.table_constraints
        if (DB::getDriverName() === 'sqlite') {
            return false;
        }
        
        $constraints = DB::select("
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = ? AND constraint_name = ?
        ", [$table, $constraint]);
        
        return count($constraints) > 0;
    }
};
