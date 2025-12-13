<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add indexes to improve search performance
     */
    public function up(): void
    {
        if (Schema::hasTable('issues')) {
            Schema::table('issues', function (Blueprint $table) {
                // Add index on title for faster title searches
                // Note: PostgreSQL supports indexes on text columns
                if (!$this->indexExists('issues', 'issues_title_idx')) {
                    $table->index('title', 'issues_title_idx');
                }
            });
            
            // For PostgreSQL, we can create a more efficient text search index
            // This will help with LIKE queries on title and description
            try {
                DB::statement('CREATE INDEX IF NOT EXISTS issues_title_search_idx ON issues USING gin(to_tsvector(\'english\', title))');
            } catch (\Exception $e) {
                // If full-text search index fails, regular index is still created above
                \Log::info('Full-text search index not created (may not be PostgreSQL): ' . $e->getMessage());
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('issues')) {
            Schema::table('issues', function (Blueprint $table) {
                $table->dropIndex('issues_title_idx');
            });
            
            try {
                DB::statement('DROP INDEX IF EXISTS issues_title_search_idx');
            } catch (\Exception $e) {
                // Ignore if index doesn't exist
            }
        }
    }
    
    /**
     * Check if index exists
     */
    private function indexExists(string $table, string $index): bool
    {
        $connection = Schema::getConnection();
        $database = $connection->getDatabaseName();
        
        if ($connection->getDriverName() === 'pgsql') {
            $result = $connection->select(
                "SELECT 1 FROM pg_indexes WHERE tablename = ? AND indexname = ?",
                [$table, $index]
            );
            return !empty($result);
        }
        
        return false;
    }
};
