<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

Route::get('/debug/database', function () {
    try {
        // Test basic database connection
        $connection = DB::connection()->getPdo();
        $result = [
            'database' => DB::connection()->getDatabaseName(),
            'connection_working' => true,
            'test_query' => DB::select("SELECT 1 as test")
        ];
        
        // Get all tables
        $allTables = DB::select("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
        $result['tables'] = array_column($allTables, 'table_name');
        $result['total_tables'] = count($allTables);
        
        // Check if gemini_api_keys table exists
        $geminiTables = DB::select("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gemini_api_keys'");
        $result['gemini_table_exists'] = count($geminiTables) > 0;
        
        if ($result['gemini_table_exists']) {
            // Get table info
            $result['gemini_table_count'] = DB::table('gemini_api_keys')->count();
            $result['gemini_table_structure'] = DB::select("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'gemini_api_keys' ORDER BY ordinal_position");
        }
        
        // Check if users table exists
        $userTables = DB::select("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'");
        $result['users_table_exists'] = count($userTables) > 0;
        
        if ($result['users_table_exists']) {
            $result['users_count'] = DB::table('users')->count();
        }
        
        // Check if migrations table exists
        $migrationTables = DB::select("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'migrations'");
        $result['migrations_table_exists'] = count($migrationTables) > 0;
        
        return response()->json($result);
    } catch (Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});

Route::get('/debug/gemini-api-keys', function () {
    try {
        $apiKeys = DB::table('gemini_api_keys')->get();
        return response()->json([
            'success' => true,
            'count' => $apiKeys->count(),
            'data' => $apiKeys
        ]);
    } catch (Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});

Route::get('/debug/auth-test', function () {
    try {
        // Test if we can access users table
        $users = DB::table('users')->get();
        
        return response()->json([
            'success' => true,
            'users_count' => $users->count(),
            'users' => $users->take(3), // Show first 3 users
            'connection' => DB::connection()->getDatabaseName(),
            'driver' => DB::connection()->getDriverName()
        ]);
    } catch (Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'connection' => DB::connection()->getDatabaseName(),
            'driver' => DB::connection()->getDriverName()
        ], 500);
    }
});

Route::get('/debug/all-connections', function () {
    try {
        $connections = [];
        
        // Check default connection
        $defaultConnection = config('database.default');
        $connections['default'] = [
            'name' => $defaultConnection,
            'database' => config("database.connections.{$defaultConnection}.database"),
            'driver' => config("database.connections.{$defaultConnection}.driver"),
            'host' => config("database.connections.{$defaultConnection}.host"),
        ];
        
        // Check if we can query users
        try {
            $users = DB::table('users')->count();
            $connections['default']['users_count'] = $users;
        } catch (Exception $e) {
            $connections['default']['users_error'] = $e->getMessage();
        }
        
        // Check environment variables
        $connections['env'] = [
            'DB_CONNECTION' => env('DB_CONNECTION'),
            'DB_DATABASE' => env('DB_DATABASE'),
            'DB_HOST' => env('DB_HOST'),
        ];
        
        return response()->json($connections);
    } catch (Exception $e) {
        return response()->json([
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});

Route::post('/debug/create-gemini-table', function () {
    try {
        // Check if gemini_api_keys table exists
        $tables = DB::select("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gemini_api_keys'");
        $tableExists = count($tables) > 0;
        
        if ($tableExists) {
            return response()->json([
                'success' => true,
                'message' => 'gemini_api_keys table already exists',
                'count' => DB::table('gemini_api_keys')->count()
            ]);
        }
        
        // Create the table
        DB::statement("
            CREATE TABLE gemini_api_keys (
                id BIGSERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                api_key TEXT NOT NULL,
                max_requests INTEGER NOT NULL DEFAULT 100,
                total_requests INTEGER NOT NULL DEFAULT 100,
                used_requests INTEGER NOT NULL DEFAULT 0,
                is_active BOOLEAN NOT NULL DEFAULT true,
                created_at TIMESTAMP(0) NULL,
                updated_at TIMESTAMP(0) NULL
            )
        ");
        
        // Insert a sample API key
        $sampleApiKey = "AIzaSyDummyKeyReplaceWithYourActualKey123456789";
        DB::table('gemini_api_keys')->insert([
            'name' => 'admin',
            'api_key' => encrypt($sampleApiKey),
            'max_requests' => 100,
            'total_requests' => 100,
            'used_requests' => 0,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'gemini_api_keys table created successfully with sample data',
            'count' => DB::table('gemini_api_keys')->count()
        ]);
        
    } catch (Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});
