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
        if (Schema::hasTable('courses')) {
            Schema::table('courses', function (Blueprint $table) {
                if (Schema::hasColumn('courses', 'content')) {
                    $table->text('content')->nullable()->change();
                }
                if (Schema::hasColumn('courses', 'user_id')) {
                    $table->unsignedBigInteger('user_id')->nullable()->change();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('courses')) {
            Schema::table('courses', function (Blueprint $table) {
                if (Schema::hasColumn('courses', 'content')) {
                    $table->text('content')->nullable(false)->change();
                }
                if (Schema::hasColumn('courses', 'user_id')) {
                    $table->unsignedBigInteger('user_id')->nullable(false)->change();
                }
            });
        }
    }
};

