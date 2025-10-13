<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

Route::get('/debug/database', function () {
    try {
        // Test basic database connection
        $connection = DB::connection()->getPdo();
        $result = ['status' => 'connected', 'driver' => DB::connection()->getDriverName()];
        
        // Check if gemini_api_keys table exists
        $tables = DB::select("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gemini_api_keys'");
        $result['gemini_table_exists'] = count($tables) > 0;
        
        if ($result['gemini_table_exists']) {
            // Get table info
            $result['gemini_table_count'] = DB::table('gemini_api_keys')->count();
            $result['gemini_table_structure'] = DB::select("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'gemini_api_keys' ORDER BY ordinal_position");
        }
        
        // Check other important tables
        $allTables = DB::select("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
        $result['all_tables'] = array_column($allTables, 'table_name');
        
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
