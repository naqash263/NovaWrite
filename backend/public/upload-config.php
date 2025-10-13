<?php
// Custom PHP configuration for large file uploads
ini_set('upload_max_filesize', '50M');
ini_set('post_max_size', '50M');
ini_set('memory_limit', '256M');
ini_set('max_execution_time', 300);
ini_set('max_input_time', 300);
ini_set('max_file_uploads', 20);

// Force these settings
if (function_exists('ini_set')) {
    ini_set('upload_max_filesize', '50M');
    ini_set('post_max_size', '50M');
    ini_set('memory_limit', '256M');
    ini_set('max_execution_time', 300);
    ini_set('max_input_time', 300);
}

// Log current settings for debugging
error_log('PHP Upload Settings:');
error_log('upload_max_filesize: ' . ini_get('upload_max_filesize'));
error_log('post_max_size: ' . ini_get('post_max_size'));
error_log('memory_limit: ' . ini_get('memory_limit'));
error_log('max_execution_time: ' . ini_get('max_execution_time'));
?>

