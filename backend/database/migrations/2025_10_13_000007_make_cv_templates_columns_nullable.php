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
        if (Schema::hasTable('cv_templates')) {
            // Use raw SQL for PostgreSQL to change columns to nullable
            DB::statement('ALTER TABLE cv_templates ALTER COLUMN description DROP NOT NULL');
            DB::statement('ALTER TABLE cv_templates ALTER COLUMN template_html DROP NOT NULL');
            DB::statement('ALTER TABLE cv_templates ALTER COLUMN template_css DROP NOT NULL');
            DB::statement('ALTER TABLE cv_templates ALTER COLUMN field_mappings DROP NOT NULL');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('cv_templates')) {
            DB::statement('ALTER TABLE cv_templates ALTER COLUMN description SET NOT NULL');
            DB::statement('ALTER TABLE cv_templates ALTER COLUMN template_html SET NOT NULL');
            DB::statement('ALTER TABLE cv_templates ALTER COLUMN template_css SET NOT NULL');
            DB::statement('ALTER TABLE cv_templates ALTER COLUMN field_mappings SET NOT NULL');
        }
    }
};

