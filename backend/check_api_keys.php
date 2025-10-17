<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "🔍 Checking API Keys\n";
echo "==================\n\n";

$apiKeys = DB::table('gemini_api_keys')->get(['id', 'name', 'is_active', 'total_requests', 'used_requests', 'created_at']);

if ($apiKeys->isEmpty()) {
    echo "❌ No API keys found in database\n";
} else {
    foreach ($apiKeys as $key) {
        echo "ID: {$key->id}\n";
        echo "Name: {$key->name}\n";
        echo "Active: " . ($key->is_active ? 'Yes' : 'No') . "\n";
        echo "Total Requests: {$key->total_requests}\n";
        echo "Used Requests: {$key->used_requests}\n";
        echo "Created: {$key->created_at}\n";
        echo "---\n";
    }
}

echo "\n✅ Check complete!\n";
