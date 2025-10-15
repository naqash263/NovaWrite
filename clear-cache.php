<?php
/**
 * Clear Laravel Cache Script
 * Upload this file to the production server and run it via browser
 * URL: https://naqashthaheem.com/clear-cache.php
 */

// Security check - only allow from specific IP or with password
$allowed_ips = ['127.0.0.1', '::1']; // Add your IP here
$password = 'clear_cache_2025'; // Change this password

if (!in_array($_SERVER['REMOTE_ADDR'], $allowed_ips) && 
    (!isset($_GET['password']) || $_GET['password'] !== $password)) {
    http_response_code(403);
    die('Access denied. Use ?password=clear_cache_2025');
}

echo "<h1>🧹 Laravel Cache Clearing Script</h1>";
echo "<p>Starting cache clearing process...</p>";

// Change to the backend directory
$backend_path = '/home/timesovh/naqashthaheem.com/backend';
if (!is_dir($backend_path)) {
    die("❌ Backend directory not found: $backend_path");
}

chdir($backend_path);
echo "<p>✅ Changed to backend directory: $backend_path</p>";

// Clear caches
$commands = [
    'php artisan config:clear' => 'Configuration cache cleared',
    'php artisan route:clear' => 'Route cache cleared', 
    'php artisan cache:clear' => 'Application cache cleared',
    'php artisan view:clear' => 'View cache cleared',
    'php artisan config:cache' => 'Configuration cache rebuilt'
];

foreach ($commands as $command => $description) {
    echo "<p>🔄 Running: $command</p>";
    $output = [];
    $return_code = 0;
    exec($command . ' 2>&1', $output, $return_code);
    
    if ($return_code === 0) {
        echo "<p>✅ $description</p>";
    } else {
        echo "<p>❌ Error running $command:</p>";
        echo "<pre>" . implode("\n", $output) . "</pre>";
    }
}

// Verify health routes
echo "<h2>📋 Verifying Health Routes</h2>";
$output = [];
exec('php artisan route:list --path=api/health 2>&1', $output);
echo "<pre>" . implode("\n", $output) . "</pre>";

echo "<h2>✅ Cache clearing completed!</h2>";
echo "<p><a href='/api/health/comprehensive' target='_blank'>Test Health Endpoint</a></p>";
echo "<p><a href='/api/health/database' target='_blank'>Test Database Health</a></p>";
echo "<p><a href='/api/health/storage' target='_blank'>Test Storage Health</a></p>";

// Clean up - remove this file after use
echo "<p>🗑️ <strong>IMPORTANT:</strong> Delete this file after use for security!</p>";
?>
