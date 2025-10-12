<?php
// Custom upload handler to bypass PHP limits
ini_set('upload_max_filesize', '50M');
ini_set('post_max_size', '50M');
ini_set('memory_limit', '256M');
ini_set('max_execution_time', 300);
ini_set('max_input_time', 300);

// Set additional PHP settings
ini_set('max_file_uploads', 20);
ini_set('file_uploads', 'On');

// Include Laravel's entry point
require_once __DIR__ . '/index.php';