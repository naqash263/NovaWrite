<?php
// Simple upload test script
ini_set('upload_max_filesize', '50M');
ini_set('post_max_size', '50M');
ini_set('memory_limit', '256M');
ini_set('max_execution_time', 300);

echo "PHP Settings:\n";
echo "upload_max_filesize: " . ini_get('upload_max_filesize') . "\n";
echo "post_max_size: " . ini_get('post_max_size') . "\n";
echo "memory_limit: " . ini_get('memory_limit') . "\n";
echo "max_execution_time: " . ini_get('max_execution_time') . "\n\n";

echo "Request Info:\n";
echo "Content-Length: " . ($_SERVER['CONTENT_LENGTH'] ?? 'Not set') . "\n";
echo "Content-Type: " . ($_SERVER['CONTENT_TYPE'] ?? 'Not set') . "\n";
echo "Request Method: " . $_SERVER['REQUEST_METHOD'] . "\n\n";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    echo "Files received:\n";
    print_r($_FILES);
    
    if (isset($_FILES['video'])) {
        $file = $_FILES['video'];
        echo "\nFile details:\n";
        echo "Name: " . $file['name'] . "\n";
        echo "Size: " . $file['size'] . " bytes\n";
        echo "Type: " . $file['type'] . "\n";
        echo "Error: " . $file['error'] . "\n";
        echo "Tmp name: " . $file['tmp_name'] . "\n";
        
        if ($file['error'] === UPLOAD_ERR_OK) {
            echo "\nUpload successful!\n";
        } else {
            echo "\nUpload error: " . $file['error'] . "\n";
            $errors = [
                UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize',
                UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE',
                UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
                UPLOAD_ERR_NO_FILE => 'No file was uploaded',
                UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
                UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
                UPLOAD_ERR_EXTENSION => 'File upload stopped by extension'
            ];
            echo "Error meaning: " . ($errors[$file['error']] ?? 'Unknown error') . "\n";
        }
    }
}
?>

