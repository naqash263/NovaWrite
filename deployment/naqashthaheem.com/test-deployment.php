<?php
// Test script for deployed application
echo "<h1>NovaWrite Deployment Test</h1>";
echo "<p>Domain: " . $_SERVER['HTTP_HOST'] . "</p>";
echo "<p>Time: " . date('Y-m-d H:i:s') . "</p>";

// Test database connection
try {
    $pdo = new PDO("pgsql:host=localhost;port=5432;dbname=timesovh_naqashthaheem", "timesovh_naqash_thaheem", "mg08.Rcrld}N");
    echo "<p style='color: green;'>✅ Database connection successful!</p>";
} catch (PDOException $e) {
    echo "<p style='color: red;'>❌ Database connection failed: " . $e->getMessage() . "</p>";
}

// Test email configuration
$mail_host = 'naqashthaheem.com';
$mail_port = 465;
$connection = @fsockopen($mail_host, $mail_port, $errno, $errstr, 30);
if ($connection) {
    fclose($connection);
    echo "<p style='color: green;'>✅ Email server reachable!</p>";
} else {
    echo "<p style='color: red;'>❌ Email server not reachable: $errstr ($errno)</p>";
}

echo "<p><strong>Delete this file after testing for security!</strong></p>";
?>
