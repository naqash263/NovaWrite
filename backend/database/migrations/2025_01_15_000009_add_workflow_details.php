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
        if (Schema::hasTable('workflows')) {
            Schema::table('workflows', function (Blueprint $table) {
                // Add estimated_time if it doesn't exist
                if (!Schema::hasColumn('workflows', 'estimated_time')) {
                    $table->string('estimated_time')->nullable()->after('benefits');
                }
                
                // Add difficulty if it doesn't exist
                if (!Schema::hasColumn('workflows', 'difficulty')) {
                    $table->enum('difficulty', ['beginner', 'intermediate', 'advanced'])
                        ->nullable()
                        ->default('intermediate')
                        ->after('estimated_time');
                }
                
                // Add tags if it doesn't exist
                if (!Schema::hasColumn('workflows', 'tags')) {
                    $table->json('tags')->nullable()->after('difficulty');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('workflows')) {
            Schema::table('workflows', function (Blueprint $table) {
                if (Schema::hasColumn('workflows', 'tags')) {
                    $table->dropColumn('tags');
                }
                if (Schema::hasColumn('workflows', 'difficulty')) {
                    $table->dropColumn('difficulty');
                }
                if (Schema::hasColumn('workflows', 'estimated_time')) {
                    $table->dropColumn('estimated_time');
                }
            });
        }
    }
};

