<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('fallback_webhooks')) {
            Schema::create('fallback_webhooks', function (Blueprint $table) {
                $table->id();
                $table->string('url', 1000);
                $table->string('description', 255)->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (Schema::hasTable('n8n_configurations') && !Schema::hasColumn('n8n_configurations', 'auto_notify_on_failure')) {
            Schema::table('n8n_configurations', function (Blueprint $table) {
                $table->boolean('auto_notify_on_failure')->default(false);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('fallback_webhooks')) {
            Schema::dropIfExists('fallback_webhooks');
        }
        if (Schema::hasTable('n8n_configurations') && Schema::hasColumn('n8n_configurations', 'auto_notify_on_failure')) {
            Schema::table('n8n_configurations', function (Blueprint $table) {
                $table->dropColumn('auto_notify_on_failure');
            });
        }
    }
};


