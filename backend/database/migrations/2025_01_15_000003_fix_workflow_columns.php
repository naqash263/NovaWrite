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
        // Ensure status column exists and has correct constraint
        if (Schema::hasTable('workflows')) {
            Schema::table('workflows', function (Blueprint $table) {
                // If status column doesn't exist, add it
                if (!Schema::hasColumn('workflows', 'status')) {
                    $table->enum('status', ['draft', 'published'])->default('draft')->after('benefits');
                }
                
                // Ensure status has valid default
                DB::statement("ALTER TABLE workflows ALTER COLUMN status SET DEFAULT 'draft'");
            });
        }
        
        // Ensure is_premium column exists
        if (Schema::hasTable('workflows')) {
            Schema::table('workflows', function (Blueprint $table) {
                if (!Schema::hasColumn('workflows', 'is_premium')) {
                    $table->boolean('is_premium')->default(false)->after('is_published');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // We can't safely undo this migration
    }
};

