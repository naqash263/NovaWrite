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
        if (Schema::hasTable('smtp_configurations')) {
            Schema::table('smtp_configurations', function (Blueprint $table) {
                if (!Schema::hasColumn('smtp_configurations', 'mailer')) {
                    $table->string('mailer')->default('smtp')->after('name');
                }
                if (!Schema::hasColumn('smtp_configurations', 'from_address')) {
                    $table->string('from_address')->nullable()->after('encryption');
                }
                if (!Schema::hasColumn('smtp_configurations', 'from_name')) {
                    $table->string('from_name')->nullable()->after('from_address');
                }
                if (!Schema::hasColumn('smtp_configurations', 'is_default')) {
                    $table->boolean('is_default')->default(false)->after('is_active');
                }
                if (!Schema::hasColumn('smtp_configurations', 'description')) {
                    $table->text('description')->nullable()->after('is_default');
                }
                if (!Schema::hasColumn('smtp_configurations', 'settings')) {
                    $table->json('settings')->nullable()->after('description');
                }
                if (!Schema::hasColumn('smtp_configurations', 'last_tested_at')) {
                    $table->timestamp('last_tested_at')->nullable()->after('settings');
                }
                if (!Schema::hasColumn('smtp_configurations', 'test_successful')) {
                    $table->boolean('test_successful')->nullable()->after('last_tested_at');
                }
                if (!Schema::hasColumn('smtp_configurations', 'test_error')) {
                    $table->text('test_error')->nullable()->after('test_successful');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('smtp_configurations')) {
            Schema::table('smtp_configurations', function (Blueprint $table) {
                $columns = ['mailer', 'from_address', 'from_name', 'is_default', 'description', 'settings', 'last_tested_at', 'test_successful', 'test_error'];
                foreach ($columns as $column) {
                    if (Schema::hasColumn('smtp_configurations', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};

