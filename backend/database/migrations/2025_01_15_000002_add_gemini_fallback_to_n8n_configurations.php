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
        if (Schema::hasTable('n8n_configurations')) {
            Schema::table('n8n_configurations', function (Blueprint $table) {
                if (!Schema::hasColumn('n8n_configurations', 'gemini_fallback_enabled')) {
                    $table->boolean('gemini_fallback_enabled')->default(false)->after('auto_notify_on_failure');
                }
                if (!Schema::hasColumn('n8n_configurations', 'gemini_webhook_url')) {
                    $table->string('gemini_webhook_url', 500)->nullable()->after('gemini_fallback_enabled');
                }
                if (!Schema::hasColumn('n8n_configurations', 'gemini_fallback_timeout')) {
                    $table->integer('gemini_fallback_timeout')->default(60)->after('gemini_webhook_url');
                }
                if (!Schema::hasColumn('n8n_configurations', 'gemini_fallback_retry_attempts')) {
                    $table->integer('gemini_fallback_retry_attempts')->default(2)->after('gemini_fallback_timeout');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('n8n_configurations')) {
            Schema::table('n8n_configurations', function (Blueprint $table) {
                if (Schema::hasColumn('n8n_configurations', 'gemini_fallback_retry_attempts')) {
                    $table->dropColumn('gemini_fallback_retry_attempts');
                }
                if (Schema::hasColumn('n8n_configurations', 'gemini_fallback_timeout')) {
                    $table->dropColumn('gemini_fallback_timeout');
                }
                if (Schema::hasColumn('n8n_configurations', 'gemini_webhook_url')) {
                    $table->dropColumn('gemini_webhook_url');
                }
                if (Schema::hasColumn('n8n_configurations', 'gemini_fallback_enabled')) {
                    $table->dropColumn('gemini_fallback_enabled');
                }
            });
        }
    }
};
