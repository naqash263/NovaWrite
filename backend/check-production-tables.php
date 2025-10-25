<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "🔍 Checking Production Database Tables\n";
echo "=====================================\n";

try {
    // Get all table names
    $tables = DB::select("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    
    echo "📊 Total tables found: " . count($tables) . "\n\n";
    
    echo "📋 All Tables:\n";
    foreach ($tables as $table) {
        echo "  ✓ " . $table->table_name . "\n";
    }
    
    // Check specific tables we're interested in
    $importantTables = [
        'email_templates',
        'system_email_settings',
        'smtp_configurations',
        'users',
        'posts',
        'workflows',
        'courses'
    ];
    
    echo "\n🔍 Checking Important Tables:\n";
    foreach ($importantTables as $tableName) {
        $exists = DB::select("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ?)", [$tableName]);
        $status = $exists[0]->exists ? '✅ EXISTS' : '❌ MISSING';
        echo "  {$status} {$tableName}\n";
    }
    
    // Check email_templates table structure if it exists
    $emailTemplatesExists = DB::select("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_templates')");
    if ($emailTemplatesExists[0]->exists) {
        echo "\n📧 Email Templates Table Structure:\n";
        $columns = DB::select("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'email_templates' ORDER BY ordinal_position");
        foreach ($columns as $column) {
            $nullable = $column->is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
            echo "  - {$column->column_name} ({$column->data_type}) {$nullable}\n";
        }
        
        // Check if there are any records
        $count = DB::table('email_templates')->count();
        echo "  📊 Records: {$count}\n";
    }
    
    // Check system_email_settings table structure if it exists
    $systemEmailSettingsExists = DB::select("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_email_settings')");
    if ($systemEmailSettingsExists[0]->exists) {
        echo "\n⚙️ System Email Settings Table Structure:\n";
        $columns = DB::select("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'system_email_settings' ORDER BY ordinal_position");
        foreach ($columns as $column) {
            $nullable = $column->is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
            echo "  - {$column->column_name} ({$column->data_type}) {$nullable}\n";
        }
        
        // Check if there are any records
        $count = DB::table('system_email_settings')->count();
        echo "  📊 Records: {$count}\n";
    }
    
    // Check migrations table
    echo "\n🗄️ Migration Status:\n";
    $migrations = DB::table('migrations')->orderBy('id')->get();
    echo "  Total migrations: " . $migrations->count() . "\n";
    
    // Show recent migrations
    $recentMigrations = $migrations->take(10);
    echo "  Recent migrations:\n";
    foreach ($recentMigrations as $migration) {
        echo "    - {$migration->migration} (Batch: {$migration->batch})\n";
    }
    
    echo "\n✅ Database check completed successfully!\n";

} catch (Exception $e) {
    echo "❌ Error checking database: " . $e->getMessage() . "\n";
    exit(1);
}