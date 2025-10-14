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
        Schema::table('cv_templates', function (Blueprint $table) {
            if (!Schema::hasColumn('cv_templates', 'field_mappings')) {
                $table->json('field_mappings')->nullable()->after('customizable_options');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cv_templates', function (Blueprint $table) {
            $table->dropColumn('field_mappings');
        });
    }
};