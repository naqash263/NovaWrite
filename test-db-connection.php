<?php
/**
 * Database Connection Test Script
 * Run this on production server to test PostgreSQL credentials
 */

echo "🔍 Testing PostgreSQL Database Connection\n";
echo "=========================================\n\n";

$host = 'localhost';
$port = '5432';
$database = 'timesovh_naqashthaheem';
$username = 'timesovh_naqash_thaheem';
$password = 'mg08.Rcrld}N';

echo "📋 Connection Details:\n";
echo "  Host: $host\n";
echo "  Port: $port\n";
echo "  Database: $database\n";
echo "  Username: $username\n";
echo "  Password: " . str_repeat('*', strlen($password)) . "\n\n";

try {
    // Test PDO connection
    $dsn = "pgsql:host=$host;port=$port;dbname=$database";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    echo "✅ Database connection: SUCCESS\n\n";
    
    // Get PostgreSQL version
    $version = $pdo->query("SELECT version()")->fetchColumn();
    echo "📊 PostgreSQL Version:\n";
    echo "  " . substr($version, 0, 100) . "...\n\n";
    
    // Get all tables
    $stmt = $pdo->query("
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename
    ");
    $tables = $stmt->fetchAll();
    
    echo "📋 Total tables: " . count($tables) . "\n";
    
    if (count($tables) > 0) {
        echo "📝 Tables:\n";
        foreach ($tables as $table) {
            echo "  - " . $table['tablename'] . "\n";
        }
    } else {
        echo "⚠️  No tables found in database\n";
    }
    
    echo "\n";
    
    // Check if specific tables exist
    $requiredTables = ['users', 'gemini_api_keys', 'migrations'];
    echo "🔍 Checking required tables:\n";
    
    foreach ($requiredTables as $tableName) {
        $stmt = $pdo->prepare("
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = ?
            )
        ");
        $stmt->execute([$tableName]);
        $exists = $stmt->fetchColumn();
        
        if ($exists) {
            $count = $pdo->query("SELECT COUNT(*) FROM \"$tableName\"")->fetchColumn();
            echo "  ✅ $tableName (records: $count)\n";
        } else {
            echo "  ❌ $tableName (not found)\n";
        }
    }
    
    echo "\n✅ Database credentials are working!\n";
    echo "🎉 Ready for migration!\n";
    
} catch (PDOException $e) {
    echo "❌ Database connection: FAILED\n\n";
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "\n";
    echo "Possible issues:\n";
    echo "  - PostgreSQL server is not running\n";
    echo "  - Database credentials are incorrect\n";
    echo "  - Database does not exist\n";
    echo "  - User does not have access permissions\n";
    echo "  - Firewall blocking connection\n";
    exit(1);
}
?>
