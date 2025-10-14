<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('api_tokens')) {
            // Check if abilities column exists and permissions doesn't
            if (Schema::hasColumn('api_tokens', 'abilities') && !Schema::hasColumn('api_tokens', 'permissions')) {
                Schema::table('api_tokens', function (Blueprint $table) {
                    $table->renameColumn('abilities', 'permissions');
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('api_tokens')) {
            if (Schema::hasColumn('api_tokens', 'permissions') && !Schema::hasColumn('api_tokens', 'abilities')) {
                Schema::table('api_tokens', function (Blueprint $table) {
                    $table->renameColumn('permissions', 'abilities');
                });
            }
        }
    }
};

