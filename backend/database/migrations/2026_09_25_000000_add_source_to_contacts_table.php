<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Where a lead came from (e.g. "tool:json-formatter", "booking:AI & Automation"),
     * so the admin Leads page can show which pages and tools produce enquiries.
     */
    public function up(): void
    {
        if (Schema::hasTable('contacts') && !Schema::hasColumn('contacts', 'source')) {
            Schema::table('contacts', function (Blueprint $table) {
                $table->string('source', 120)->nullable()->after('inquiry_type');
                $table->index('source');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('contacts') && Schema::hasColumn('contacts', 'source')) {
            Schema::table('contacts', function (Blueprint $table) {
                $table->dropIndex(['source']);
                $table->dropColumn('source');
            });
        }
    }
};
