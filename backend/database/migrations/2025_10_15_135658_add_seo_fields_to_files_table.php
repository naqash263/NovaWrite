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
        if (Schema::hasTable('files')) {
            Schema::table('files', function (Blueprint $table) {
                if (!Schema::hasColumn('files', 'seo_name')) {
                    $table->string('seo_name')->nullable()->after('original_name');
                }
                if (!Schema::hasColumn('files', 'ai_metadata')) {
                    $table->json('ai_metadata')->nullable()->after('seo_name');
                }
                if (!Schema::hasColumn('files', 'keywords')) {
                    $table->json('keywords')->nullable()->after('ai_metadata');
                }
                if (!Schema::hasColumn('files', 'description')) {
                    $table->text('description')->nullable()->after('keywords');
                }
                if (!Schema::hasColumn('files', 'seo_score')) {
                    $table->integer('seo_score')->default(0)->after('description');
                }
                if (!Schema::hasColumn('files', 'content_category')) {
                    $table->string('content_category')->nullable()->after('seo_score');
                }
                if (!Schema::hasColumn('files', 'file_type_category')) {
                    $table->string('file_type_category')->nullable()->after('content_category');
                }
                if (!Schema::hasColumn('files', 'content_purpose')) {
                    $table->string('content_purpose')->nullable()->after('file_type_category');
                }
                if (!Schema::hasColumn('files', 'target_audience')) {
                    $table->string('target_audience')->nullable()->after('content_purpose');
                }
                if (!Schema::hasColumn('files', 'ai_tags')) {
                    $table->json('ai_tags')->nullable()->after('target_audience');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('files')) {
            Schema::table('files', function (Blueprint $table) {
                if (Schema::hasColumn('files', 'seo_name')) {
                    $table->dropColumn('seo_name');
                }
                if (Schema::hasColumn('files', 'ai_metadata')) {
                    $table->dropColumn('ai_metadata');
                }
                if (Schema::hasColumn('files', 'keywords')) {
                    $table->dropColumn('keywords');
                }
                if (Schema::hasColumn('files', 'description')) {
                    $table->dropColumn('description');
                }
                if (Schema::hasColumn('files', 'seo_score')) {
                    $table->dropColumn('seo_score');
                }
                if (Schema::hasColumn('files', 'content_category')) {
                    $table->dropColumn('content_category');
                }
                if (Schema::hasColumn('files', 'file_type_category')) {
                    $table->dropColumn('file_type_category');
                }
                if (Schema::hasColumn('files', 'content_purpose')) {
                    $table->dropColumn('content_purpose');
                }
                if (Schema::hasColumn('files', 'target_audience')) {
                    $table->dropColumn('target_audience');
                }
                if (Schema::hasColumn('files', 'ai_tags')) {
                    $table->dropColumn('ai_tags');
                }
            });
        }
    }
};