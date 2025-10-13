<?php
// Simple upload handler that works around PHP limits
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Read the raw input data
$input = file_get_contents('php://input');
$boundary = null;

// Parse multipart data manually
if (isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'multipart/form-data') !== false) {
    // Extract boundary
    preg_match('/boundary=(.*)$/', $_SERVER['CONTENT_TYPE'], $matches);
    $boundary = $matches[1];
    
    if ($boundary) {
        // Split the data by boundary
        $parts = explode('--' . $boundary, $input);
        
        foreach ($parts as $part) {
            if (strpos($part, 'Content-Disposition: form-data') !== false) {
                // Extract filename
                if (preg_match('/name="video"; filename="([^"]+)"/', $part, $matches)) {
                    $filename = $matches[1];
                    
                    // Extract file content
                    $fileStart = strpos($part, "\r\n\r\n");
                    if ($fileStart !== false) {
                        $fileContent = substr($part, $fileStart + 4);
                        
                        // Remove trailing boundary markers
                        $fileContent = rtrim($fileContent, "\r\n--");
                        
                        // Generate unique filename
                        $jobId = uniqid();
                        $uploadPath = '../storage/app/watermark_remover/' . $jobId . '_' . $filename;
                        
                        // Create directory if it doesn't exist
                        $uploadDir = dirname($uploadPath);
                        if (!is_dir($uploadDir)) {
                            mkdir($uploadDir, 0755, true);
                        }
                        
                        // Save file
                        if (file_put_contents($uploadPath, $fileContent)) {
                            echo json_encode([
                                'success' => true,
                                'message' => 'Video uploaded successfully',
                                'data' => [
                                    'job_id' => $jobId,
                                    'filename' => $filename,
                                    'file_size' => strlen($fileContent),
                                    'status' => 'uploaded'
                                ]
                            ]);
                            exit;
                        }
                    }
                }
            }
        }
    }
}

echo json_encode([
    'success' => false,
    'message' => 'Failed to process upload'
]);
?>


