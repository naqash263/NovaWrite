<?php
/**
 * Namecheap Connection Test Script
 * 
 * This script helps you test your Namecheap hosting configuration
 * before deploying the full application.
 * 
 * Instructions:
 * 1. Fill in your database and email details below
 * 2. Upload this file to your Namecheap hosting
 * 3. Access it via your browser to test connections
 * 4. Delete this file after testing for security
 */

// ========================================
// CONFIGURATION - Fill in your details
// ========================================

// Database Configuration
$db_host = 'localhost'; // Your database host
$db_name = 'timesovh_naqashthaheem'; // Your database name
$db_user = 'timesovh_naqash_thaheem'; // Your database username
$db_pass = 'mg08.Rcrld}N'; // Your database password
$db_port = 5432; // Your database port

// Email Configuration
$smtp_host = 'naqashthaheem.com'; // Your SMTP host
$smtp_port = 465; // Your SMTP port
$smtp_user = 'contact@naqashthaheem.com'; // Your email address
$smtp_pass = 'aeQi*(M99Hf'; // Your email password

// ========================================
// TEST FUNCTIONS
// ========================================

function testDatabaseConnection($host, $dbname, $user, $pass, $port) {
    try {
        $dsn = "pgsql:host=$host;port=$port;dbname=$dbname";
        $pdo = new PDO($dsn, $user, $pass);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Test query
        $stmt = $pdo->query("SELECT version()");
        $version = $stmt->fetchColumn();
        
        return [
            'success' => true,
            'message' => 'Database connection successful!',
            'version' => $version
        ];
    } catch (PDOException $e) {
        return [
            'success' => false,
            'message' => 'Database connection failed: ' . $e->getMessage()
        ];
    }
}

function testEmailConfiguration($host, $port, $user, $pass) {
    // This is a basic test - actual email sending would require PHPMailer or similar
    $connection = @fsockopen($host, $port, $errno, $errstr, 30);
    
    if ($connection) {
        fclose($connection);
        return [
            'success' => true,
            'message' => 'SMTP server is reachable!'
        ];
    } else {
        return [
            'success' => false,
            'message' => "SMTP connection failed: $errstr ($errno)"
        ];
    }
}

function testPHPExtensions() {
    $required_extensions = [
        'pdo_pgsql',
        'openssl',
        'mbstring',
        'tokenizer',
        'xml',
        'ctype',
        'json',
        'bcmath',
        'fileinfo',
        'curl'
    ];
    
    $results = [];
    foreach ($required_extensions as $ext) {
        $results[$ext] = extension_loaded($ext);
    }
    
    return $results;
}

function testServerInfo() {
    return [
        'php_version' => PHP_VERSION,
        'memory_limit' => ini_get('memory_limit'),
        'max_execution_time' => ini_get('max_execution_time'),
        'upload_max_filesize' => ini_get('upload_max_filesize'),
        'post_max_size' => ini_get('post_max_size'),
        'disk_free_space' => disk_free_space('.') ? round(disk_free_space('.') / 1024 / 1024, 2) . ' MB' : 'Unknown'
    ];
}

// ========================================
// RUN TESTS
// ========================================

$db_test = testDatabaseConnection($db_host, $db_name, $db_user, $db_pass, $db_port);
$email_test = testEmailConfiguration($smtp_host, $smtp_port, $smtp_user, $smtp_pass);
$extensions = testPHPExtensions();
$server_info = testServerInfo();

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Namecheap Connection Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .test-section { margin: 20px 0; padding: 15px; border-radius: 5px; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
        h1 { color: #333; text-align: center; }
        h2 { color: #666; border-bottom: 2px solid #eee; padding-bottom: 5px; }
        .status { font-weight: bold; }
        .extension-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
        .extension { padding: 5px; border-radius: 3px; text-align: center; }
        .extension.available { background: #d4edda; color: #155724; }
        .extension.missing { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Namecheap Connection Test</h1>
        <p><strong>Domain:</strong> <?php echo $_SERVER['HTTP_HOST'] ?? 'Unknown'; ?></p>
        <p><strong>Test Date:</strong> <?php echo date('Y-m-d H:i:s'); ?></p>
        
        <h2>🗄️ Database Connection Test</h2>
        <div class="test-section <?php echo $db_test['success'] ? 'success' : 'error'; ?>">
            <div class="status"><?php echo $db_test['success'] ? '✅ SUCCESS' : '❌ FAILED'; ?></div>
            <p><?php echo $db_test['message']; ?></p>
            <?php if ($db_test['success'] && isset($db_test['version'])): ?>
                <p><strong>PostgreSQL Version:</strong> <?php echo $db_test['version']; ?></p>
            <?php endif; ?>
        </div>
        
        <h2>📧 Email Configuration Test</h2>
        <div class="test-section <?php echo $email_test['success'] ? 'success' : 'error'; ?>">
            <div class="status"><?php echo $email_test['success'] ? '✅ SUCCESS' : '❌ FAILED'; ?></div>
            <p><?php echo $email_test['message']; ?></p>
        </div>
        
        <h2>🔧 PHP Extensions Test</h2>
        <div class="test-section info">
            <p>Required extensions for NovaWrite:</p>
            <div class="extension-list">
                <?php foreach ($extensions as $ext => $available): ?>
                    <div class="extension <?php echo $available ? 'available' : 'missing'; ?>">
                        <?php echo $ext; ?>: <?php echo $available ? '✅' : '❌'; ?>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
        
        <h2>🖥️ Server Information</h2>
        <div class="test-section info">
            <p><strong>PHP Version:</strong> <?php echo $server_info['php_version']; ?></p>
            <p><strong>Memory Limit:</strong> <?php echo $server_info['memory_limit']; ?></p>
            <p><strong>Max Execution Time:</strong> <?php echo $server_info['max_execution_time']; ?> seconds</p>
            <p><strong>Upload Max Filesize:</strong> <?php echo $server_info['upload_max_filesize']; ?></p>
            <p><strong>Post Max Size:</strong> <?php echo $server_info['post_max_size']; ?></p>
            <p><strong>Available Disk Space:</strong> <?php echo $server_info['disk_free_space']; ?></p>
        </div>
        
        <h2>📋 Next Steps</h2>
        <div class="test-section info">
            <?php if ($db_test['success'] && $email_test['success']): ?>
                <p>✅ <strong>Great!</strong> Your hosting environment is ready for NovaWrite deployment.</p>
                <p>You can now proceed with the deployment process.</p>
            <?php else: ?>
                <p>⚠️ <strong>Please fix the issues above</strong> before proceeding with deployment.</p>
                <p>Contact Namecheap support if you need help with database or email configuration.</p>
            <?php endif; ?>
            
            <p><strong>Important:</strong> Delete this test file after you're done for security reasons.</p>
        </div>
    </div>
</body>
</html>
