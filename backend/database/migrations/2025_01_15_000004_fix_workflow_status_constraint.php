<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop the old constraint
        DB::statement('ALTER TABLE workflows DROP CONSTRAINT IF EXISTS workflows_status_check');
        
        // Add new constraint with 'published' included
        DB::statement("
            ALTER TABLE workflows 
            ADD CONSTRAINT workflows_status_check 
            CHECK ((status::text = ANY (ARRAY['draft', 'pending', 'approved', 'rejected', 'published']::text[])))
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE workflows DROP CONSTRAINT IF EXISTS workflows_status_check');
        
        DB::statement("
            ALTER TABLE workflows 
            ADD CONSTRAINT workflows_status_check 
            CHECK ((status::text = ANY (ARRAY['draft', 'pending', 'approved', 'rejected']::text[])))
        ");
    }
};

