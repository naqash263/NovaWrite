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
