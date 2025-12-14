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
        if (!Schema::hasTable('email_unsubscribes')) {
            Schema::create('email_unsubscribes', function (Blueprint $table) {
                $table->id();
                $table->string('email');
                $table->string('token'); // For unsubscribe links
                $table->json('unsubscribed_types')->nullable(); // Array of email types to unsubscribe from
                $table->boolean('unsubscribe_all')->default(false); // Unsubscribe from all emails
                $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade');
                $table->timestamp('unsubscribed_at')->useCurrent();
                $table->timestamps();
            });

            // Add indexes using raw SQL with IF NOT EXISTS for PostgreSQL
            $this->createIndexIfNotExists('email_unsubscribes', 'email', 'email_unsubscribes_email_index');
            $this->createUniqueIndexIfNotExists('email_unsubscribes', 'token', 'email_unsubscribes_token_unique');
            $this->createIndexIfNotExists('email_unsubscribes', 'user_id', 'email_unsubscribes_user_id_index');
        } else {
            // Table exists, add indexes only if they don't exist
            $this->createIndexIfNotExists('email_unsubscribes', 'email', 'email_unsubscribes_email_index');
            $this->createUniqueIndexIfNotExists('email_unsubscribes', 'token', 'email_unsubscribes_token_unique');
            $this->createIndexIfNotExists('email_unsubscribes', 'user_id', 'email_unsubscribes_user_id_index');
        }
    }

    /**
     * Create index if it doesn't exist (PostgreSQL)
     */
    private function createIndexIfNotExists(string $table, string $column, string $indexName): void
    {
        if (!$this->indexExists($table, $indexName)) {
            try {
                DB::statement("CREATE INDEX IF NOT EXISTS {$indexName} ON {$table} ({$column})");
            } catch (\Exception $e) {
                // Index might already exist, ignore
            }
        }
    }

    /**
     * Create unique index if it doesn't exist (PostgreSQL)
     */
    private function createUniqueIndexIfNotExists(string $table, string $column, string $indexName): void
    {
        if (!$this->indexExists($table, $indexName)) {
            try {
                DB::statement("CREATE UNIQUE INDEX IF NOT EXISTS {$indexName} ON {$table} ({$column})");
            } catch (\Exception $e) {
                // Index might already exist, ignore
            }
        }
    }

    /**
     * Check if an index exists on a table
     */
    private function indexExists(string $table, string $indexName): bool
    {
        try {
            $result = DB::selectOne(
                "SELECT COUNT(*) as count 
                 FROM pg_indexes 
                 WHERE schemaname = 'public' 
                 AND tablename = ? 
                 AND indexname = ?",
                [$table, $indexName]
            );
            
            return $result && isset($result->count) && $result->count > 0;
        } catch (\Exception $e) {
            // If query fails, assume index doesn't exist
            return false;
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_unsubscribes');
    }
};
