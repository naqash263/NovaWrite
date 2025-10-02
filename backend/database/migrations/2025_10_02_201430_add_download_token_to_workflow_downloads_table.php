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
        Schema::table('workflow_downloads', function (Blueprint $table) {
            $table->uuid('token')->unique()->after('id');
            $table->timestamp('expires_at')->nullable()->after('token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('workflow_downloads', function (Blueprint $table) {
            $table->dropColumn(['token', 'expires_at']);
        });
    }
};
