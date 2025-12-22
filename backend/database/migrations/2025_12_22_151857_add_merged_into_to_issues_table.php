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
        Schema::table('issues', function (Blueprint $table) {
            $table->foreignId('merged_into')->nullable()->after('resolved_by')->constrained('issues')->onDelete('set null');
            $table->index('merged_into');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('issues', function (Blueprint $table) {
            $table->dropForeign(['merged_into']);
            $table->dropIndex(['merged_into']);
            $table->dropColumn('merged_into');
        });
    }
};
