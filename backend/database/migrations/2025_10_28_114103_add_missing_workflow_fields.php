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
                // Add instructions if it doesn't exist
                if (!Schema::hasColumn('workflows', 'instructions')) {
                    $table->text('instructions')->nullable()->after('description');
                }
                
                // Add estimated_time if it doesn't exist
                if (!Schema::hasColumn('workflows', 'estimated_time')) {
                    $table->string('estimated_time')->nullable()->after('benefits');
                }
                
                // Add difficulty if it doesn't exist
                if (!Schema::hasColumn('workflows', 'difficulty')) {
                    $table->enum('difficulty', ['beginner', 'intermediate', 'advanced'])
                        ->nullable()
                        ->after('estimated_time');
                }
                
                // Add tags if it doesn't exist
                if (!Schema::hasColumn('workflows', 'tags')) {
                    $table->json('tags')->nullable()->after('difficulty');
                }
                
                // Add image_url if it doesn't exist
                if (!Schema::hasColumn('workflows', 'image_url')) {
                    $table->string('image_url')->nullable()->after('slug');
                }
                
                // Add is_premium if it doesn't exist
                if (!Schema::hasColumn('workflows', 'is_premium')) {
                    $table->boolean('is_premium')->default(false)->after('published_at');
                }
                
                // Add is_published if it doesn't exist
                if (!Schema::hasColumn('workflows', 'is_published')) {
                    $table->boolean('is_published')->default(false)->after('status');
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
                $columns = ['instructions', 'estimated_time', 'difficulty', 'tags', 'image_url', 'is_premium', 'is_published'];
                foreach ($columns as $column) {
                    if (Schema::hasColumn('workflows', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
