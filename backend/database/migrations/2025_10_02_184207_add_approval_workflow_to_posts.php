<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        Schema::table('posts', function (Blueprint $table) {
            if (!Schema::hasColumn('posts', 'approval_status')) {
                $table->enum('approval_status', ['pending', 'approved', 'rejected'])->default('pending')->after('is_published');
            }
            if (!Schema::hasColumn('posts', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable()->after('approval_status');
            }
            if (!Schema::hasColumn('posts', 'approved_by')) {
                $table->unsignedBigInteger('approved_by')->nullable()->after('rejection_reason');
            }
            if (!Schema::hasColumn('posts', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()->after('approved_by');
            }
        });
        
        // Add foreign key constraint only if the column exists and constraint doesn't exist
        if (Schema::hasColumn('posts', 'approved_by') && !$this->constraintExists('posts', 'posts_approved_by_foreign')) {
            Schema::table('posts', function (Blueprint $table) {
                $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
            });
        }
    }

    private function constraintExists($table, $constraint)
    {
        // SQLite doesn't have information_schema.table_constraints
        // For SQLite, we'll assume the constraint doesn't exist and let Laravel handle it
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

    public function down()
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropColumn(['approval_status', 'rejection_reason', 'approved_by', 'approved_at']);
        });
    }
};