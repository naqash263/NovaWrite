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
        // Add failure tracking to email_queue table
        if (Schema::hasTable('email_queue')) {
            Schema::table('email_queue', function (Blueprint $table) {
                if (!Schema::hasColumn('email_queue', 'failure_reason_code')) {
                    $table->string('failure_reason_code')->nullable()->after('last_error');
                }
                if (!Schema::hasColumn('email_queue', 'failure_category')) {
                    $table->enum('failure_category', [
                        'network',
                        'authentication',
                        'rate_limit',
                        'invalid_email',
                        'server_error',
                        'timeout',
                        'unknown'
                    ])->nullable()->after('failure_reason_code');
                }
                if (!Schema::hasColumn('email_queue', 'error_details')) {
                    $table->json('error_details')->nullable()->after('failure_category');
                }
                if (!Schema::hasColumn('email_queue', 'http_status_code')) {
                    $table->integer('http_status_code')->nullable()->after('error_details');
                }
                if (!Schema::hasColumn('email_queue', 'provider_name')) {
                    $table->string('provider_name')->default('n8n')->after('http_status_code');
                }
            });
        }

        // Add failure tracking to email_logs table
        if (Schema::hasTable('email_logs')) {
            Schema::table('email_logs', function (Blueprint $table) {
                if (!Schema::hasColumn('email_logs', 'failure_reason_code')) {
                    $table->string('failure_reason_code')->nullable()->after('error_message');
                }
                if (!Schema::hasColumn('email_logs', 'failure_category')) {
                    $table->enum('failure_category', [
                        'network',
                        'authentication',
                        'rate_limit',
                        'invalid_email',
                        'server_error',
                        'timeout',
                        'unknown'
                    ])->nullable()->after('failure_reason_code');
                }
                if (!Schema::hasColumn('email_logs', 'error_details')) {
                    $table->json('error_details')->nullable()->after('failure_category');
                }
                if (!Schema::hasColumn('email_logs', 'http_status_code')) {
                    $table->integer('http_status_code')->nullable()->after('error_details');
                }
                if (!Schema::hasColumn('email_logs', 'provider_name')) {
                    $table->string('provider_name')->default('n8n')->after('http_status_code');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove failure tracking from email_queue table
        if (Schema::hasTable('email_queue')) {
            Schema::table('email_queue', function (Blueprint $table) {
                if (Schema::hasColumn('email_queue', 'provider_name')) {
                    $table->dropColumn('provider_name');
                }
                if (Schema::hasColumn('email_queue', 'http_status_code')) {
                    $table->dropColumn('http_status_code');
                }
                if (Schema::hasColumn('email_queue', 'error_details')) {
                    $table->dropColumn('error_details');
                }
                if (Schema::hasColumn('email_queue', 'failure_category')) {
                    $table->dropColumn('failure_category');
                }
                if (Schema::hasColumn('email_queue', 'failure_reason_code')) {
                    $table->dropColumn('failure_reason_code');
                }
            });
        }

        // Remove failure tracking from email_logs table
        if (Schema::hasTable('email_logs')) {
            Schema::table('email_logs', function (Blueprint $table) {
                if (Schema::hasColumn('email_logs', 'provider_name')) {
                    $table->dropColumn('provider_name');
                }
                if (Schema::hasColumn('email_logs', 'http_status_code')) {
                    $table->dropColumn('http_status_code');
                }
                if (Schema::hasColumn('email_logs', 'error_details')) {
                    $table->dropColumn('error_details');
                }
                if (Schema::hasColumn('email_logs', 'failure_category')) {
                    $table->dropColumn('failure_category');
                }
                if (Schema::hasColumn('email_logs', 'failure_reason_code')) {
                    $table->dropColumn('failure_reason_code');
                }
            });
        }
    }
};
