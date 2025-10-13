<?php
// Custom chunked upload handler to bypass PHP limits
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Set PHP limits
ini_set('upload_max_filesize', '50M');
ini_set('post_max_size', '50M');
ini_set('memory_limit', '256M');
ini_set('max_execution_time', 300);
ini_set('max_input_time', 300);

// Check if file was uploaded
if (!isset($_FILES['video']) || $_FILES['video']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode([
        'success' => false,
        'message' => 'No file uploaded or upload error',
        'error_code' => $_FILES['video']['error'] ?? 'unknown'
    ]);
    exit;
}

$file = $_FILES['video'];
$allowedExtensions = ['mp4', 'mov', 'avi', 'webm'];
$extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

// Validate file extension
if (!in_array($extension, $allowedExtensions)) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid file type. Only MP4, MOV, AVI, and WebM files are allowed.'
    ]);
    exit;
}

// Generate unique filename
$jobId = uniqid();
$filename = $jobId . '_' . $file['name'];
$uploadPath = '../storage/app/watermark_remover/' . $filename;

// Create directory if it doesn't exist
$uploadDir = dirname($uploadPath);
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Move uploaded file
if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
    echo json_encode([
        'success' => true,
        'message' => 'Video uploaded successfully',
        'data' => [
            'job_id' => $jobId,
            'filename' => $file['name'],
            'file_size' => $file['size'],
            'status' => 'uploaded'
        ]
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to save uploaded file'
    ]);
}
?>


