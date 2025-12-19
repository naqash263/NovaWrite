<?php
/**
 * Check Gemini N8N Fallback Configuration
 * Run: php check-fallback-config.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\N8nConfiguration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

echo "🔍 Checking Gemini N8N Fallback Configuration\n\n";

// Check if migrations have been run
echo "1. Checking migrations...\n";
$hasTable = Schema::hasTable('n8n_configurations');
$hasColumns = false;

if ($hasTable) {
    $hasColumns = Schema::hasColumn('n8n_configurations', 'gemini_fallback_enabled') &&
                  Schema::hasColumn('n8n_configurations', 'gemini_webhook_url');
    echo "   ✅ n8n_configurations table exists\n";
    
    if ($hasColumns) {
        echo "   ✅ Gemini fallback columns exist\n";
    } else {
        echo "   ❌ Gemini fallback columns missing - need to run migrations!\n";
        echo "   Run: php artisan migrate\n";
    }
} else {
    echo "   ❌ n8n_configurations table does not exist\n";
    echo "   Run: php artisan migrate\n";
}

echo "\n2. Checking N8N configuration...\n";
$config = N8nConfiguration::getActive();

if (!$config) {
    echo "   ❌ No active N8N configuration found\n";
    echo "   Create one in admin panel or database\n";
} else {
    echo "   ✅ Active configuration found: {$config->name}\n";
    
    if ($hasColumns) {
        $enabled = $config->isGeminiFallbackEnabled();
        $webhookUrl = $config->getGeminiWebhookUrl();
        $isValid = $config->isValidGeminiWebhookUrl();
        
        echo "   Gemini Fallback Enabled: " . ($enabled ? "✅ Yes" : "❌ No") . "\n";
        echo "   Gemini Webhook URL: " . ($webhookUrl ?: "❌ Not set") . "\n";
        echo "   Webhook URL Valid: " . ($isValid ? "✅ Yes" : "❌ No") . "\n";
        
        if ($enabled && $isValid) {
            echo "\n   ✅ Gemini N8N Fallback is properly configured!\n";
        } else {
            echo "\n   ⚠️  Gemini N8N Fallback needs configuration:\n";
            if (!$enabled) {
                echo "      - Enable 'gemini_fallback_enabled'\n";
            }
            if (!$webhookUrl || !$isValid) {
                echo "      - Set valid 'gemini_webhook_url'\n";
            }
            
            echo "\n   Quick fix SQL:\n";
            echo "   UPDATE n8n_configurations SET gemini_fallback_enabled = true, gemini_webhook_url = 'YOUR_WEBHOOK_URL' WHERE id = {$config->id};\n";
        }
    }
}

echo "\n3. Testing error classifier...\n";
$testException = new \Exception('API quota exceeded. Please try again later or add your own API key.');
$shouldFallback = \App\Services\GeminiErrorClassifier::shouldFallback($testException);
echo "   Test error: 'API quota exceeded...'\n";
echo "   Should fallback: " . ($shouldFallback ? "✅ Yes" : "❌ No") . "\n";

if ($shouldFallback) {
    echo "   ✅ Error classifier correctly detects quota errors\n";
} else {
    echo "   ❌ Error classifier NOT detecting quota errors - this is a bug!\n";
}

echo "\n✅ Check complete!\n";
