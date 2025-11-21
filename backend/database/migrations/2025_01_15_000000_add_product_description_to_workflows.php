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
                if (!Schema::hasColumn('workflows', 'product_description')) {
                    $table->text('product_description')->nullable()->after('description');
                }
                if (!Schema::hasColumn('workflows', 'meta_description')) {
                    $table->text('meta_description')->nullable()->after('product_description');
                }
                if (!Schema::hasColumn('workflows', 'meta_keywords')) {
                    $table->text('meta_keywords')->nullable()->after('meta_description');
                }
                if (!Schema::hasColumn('workflows', 'seo_title')) {
                    $table->string('seo_title')->nullable()->after('meta_keywords');
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
                if (Schema::hasColumn('workflows', 'product_description')) {
                    $table->dropColumn('product_description');
                }
                if (Schema::hasColumn('workflows', 'meta_description')) {
                    $table->dropColumn('meta_description');
                }
                if (Schema::hasColumn('workflows', 'meta_keywords')) {
                    $table->dropColumn('meta_keywords');
                }
                if (Schema::hasColumn('workflows', 'seo_title')) {
                    $table->dropColumn('seo_title');
                }
            });
        }
    }
};

