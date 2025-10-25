<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\EmailTemplate;
use Illuminate\Support\Facades\DB;

echo "🌱 Seeding Email Templates to Production\n";
echo "========================================\n";

try {
    // Check current count
    $currentCount = EmailTemplate::count();
    echo "📋 Current email templates: {$currentCount}\n\n";

    // Run the EmailTemplateSeeder
    echo "🌱 Running EmailTemplateSeeder...\n";
    $seeder = new \Database\Seeders\EmailTemplateSeeder();
    $seeder->run();

    // Check new count
    $newCount = EmailTemplate::count();
    echo "📊 Total email templates after seeding: {$newCount}\n\n";

    // Show all templates
    echo "📧 Email Templates:\n";
    $templates = EmailTemplate::select('name', 'subject', 'category', 'is_active')->orderBy('category')->get();
    
    $categories = $templates->groupBy('category');
    foreach($categories as $category => $categoryTemplates) {
        echo "\n📁 " . ucfirst($category) . " Templates:\n";
        foreach($categoryTemplates as $template) {
            $status = $template->is_active ? 'Active' : 'Inactive';
            echo "  ✓ {$template->name} - {$template->subject} ({$status})\n";
        }
    }

    echo "\n✅ Email templates seeded successfully!\n";
    echo "Total: {$newCount} email templates\n";

} catch (Exception $e) {
    echo "❌ Error seeding email templates: " . $e->getMessage() . "\n";
    exit(1);
}
