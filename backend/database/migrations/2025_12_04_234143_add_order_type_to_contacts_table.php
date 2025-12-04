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
        if (Schema::hasTable('contacts')) {
            if (!Schema::hasColumn('contacts', 'order_type')) {
                Schema::table('contacts', function (Blueprint $table) {
                    $table->string('order_type')->nullable()->after('inquiry_type');
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('contacts')) {
            if (Schema::hasColumn('contacts', 'order_type')) {
                Schema::table('contacts', function (Blueprint $table) {
                    $table->dropColumn('order_type');
                });
            }
        }
    }
};
