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
        Schema::table('workflows', function (Blueprint $table) {
            if (Schema::hasColumn('workflows', 'is_featured')) {
                $table->dropColumn('is_featured');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('workflows', function (Blueprint $table) {
            if (!Schema::hasColumn('workflows', 'is_featured')) {
                $table->boolean('is_featured')->default(false)->after('is_premium');
            }
        });
    }
};

