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
        if (Schema::hasTable('cv_templates')) {
            Schema::table('cv_templates', function (Blueprint $table) {
                if (!Schema::hasColumn('cv_templates', 'thumbnail')) {
                    $table->string('thumbnail')->nullable()->after('description');
                }
                if (!Schema::hasColumn('cv_templates', 'html_content')) {
                    $table->text('html_content')->nullable()->after('thumbnail');
                }
                if (!Schema::hasColumn('cv_templates', 'json_config')) {
                    $table->json('json_config')->nullable()->after('html_content');
                }
                if (!Schema::hasColumn('cv_templates', 'category')) {
                    $table->string('category')->default('general')->after('json_config');
                }
                if (!Schema::hasColumn('cv_templates', 'ats_score')) {
                    $table->integer('ats_score')->default(8)->after('category');
                }
                if (!Schema::hasColumn('cv_templates', 'is_default')) {
                    $table->boolean('is_default')->default(false)->after('is_active');
                }
                if (!Schema::hasColumn('cv_templates', 'customizable_options')) {
                    $table->json('customizable_options')->nullable()->after('is_default');
                }
                if (!Schema::hasColumn('cv_templates', 'created_by')) {
                    $table->foreignId('created_by')->nullable()->constrained('users')->after('customizable_options');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('cv_templates')) {
            Schema::table('cv_templates', function (Blueprint $table) {
                $columns = ['thumbnail', 'html_content', 'json_config', 'category', 'ats_score', 'is_default', 'customizable_options', 'created_by'];
                foreach ($columns as $column) {
                    if (Schema::hasColumn('cv_templates', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};

