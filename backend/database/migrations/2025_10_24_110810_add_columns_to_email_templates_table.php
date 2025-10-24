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
        Schema::table('email_templates', function (Blueprint $table) {
            // Add missing columns if they don't exist
            if (!Schema::hasColumn('email_templates', 'type')) {
                $table->string('type')->default('html')->after('body');
            }
            if (!Schema::hasColumn('email_templates', 'category')) {
                $table->string('category')->default('general')->after('type');
            }
            if (!Schema::hasColumn('email_templates', 'variables')) {
                $table->json('variables')->nullable()->after('category');
            }
            if (!Schema::hasColumn('email_templates', 'description')) {
                $table->text('description')->nullable()->after('variables');
            }
            if (!Schema::hasColumn('email_templates', 'metadata')) {
                $table->json('metadata')->nullable()->after('description');
            }
            if (!Schema::hasColumn('email_templates', 'is_system')) {
                $table->boolean('is_system')->default(false)->after('is_active');
            }
            if (!Schema::hasColumn('email_templates', 'language')) {
                $table->string('language', 5)->default('en')->after('is_system');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('email_templates', function (Blueprint $table) {
            $table->dropColumn([
                'type',
                'category', 
                'variables',
                'description',
                'metadata',
                'is_system',
                'language'
            ]);
        });
    }
};