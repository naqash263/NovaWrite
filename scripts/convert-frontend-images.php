<?php

/**
 * Script to convert frontend images to WebP/AVIF format
 * Usage: php scripts/convert-frontend-images.php [format] [image_path]
 * Example: php scripts/convert-frontend-images.php webp frontend/public/images/SEO.png
 */

require __DIR__ . '/../backend/vendor/autoload.php';

use App\Services\ImageConversionService;
use Illuminate\Support\Facades\Storage;

// Bootstrap Laravel
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$format = $argv[1] ?? 'webp'; // webp or avif
$imagePath = $argv[2] ?? null;

if (!$imagePath || !file_exists($imagePath)) {
    echo "Usage: php scripts/convert-frontend-images.php [webp|avif] [image_path]\n";
    echo "Example: php scripts/convert-frontend-images.php webp frontend/public/images/SEO.png\n\n";
    
    // List available images
    echo "Available images in frontend/public/images:\n";
    $imagesDir = __DIR__ . '/../frontend/public/images';
    if (is_dir($imagesDir)) {
        $files = glob($imagesDir . '/*.{png,jpg,jpeg}', GLOB_BRACE);
        foreach ($files as $file) {
            $size = filesize($file);
            $sizeKB = round($size / 1024, 2);
            echo "  - " . basename($file) . " ({$sizeKB} KB)\n";
        }
    }
    exit(1);
}

if (!in_array($format, ['webp', 'avif'])) {
    echo "Error: Format must be 'webp' or 'avif'\n";
    exit(1);
}

echo "Converting: {$imagePath}\n";
echo "Format: {$format}\n\n";

try {
    $conversionService = new ImageConversionService();
    
    // Check format support
    if ($format === 'avif' && !$conversionService->isAvifSupported()) {
        echo "Error: AVIF conversion is not supported on this server.\n";
        echo "Please use WebP instead.\n";
        exit(1);
    }
    
    if ($format === 'webp' && !$conversionService->isWebpSupported()) {
        echo "Error: WebP conversion is not supported on this server.\n";
        exit(1);
    }
    
    // Create a mock UploadedFile
    $fileInfo = pathinfo($imagePath);
    $uploadedFile = new \Illuminate\Http\UploadedFile(
        $imagePath,
        $fileInfo['basename'],
        mime_content_type($imagePath),
        null,
        true
    );
    
    $originalSize = filesize($imagePath);
    echo "Original size: " . formatBytes($originalSize) . "\n";
    
    // Convert image
    $tempPath = 'temp/' . $fileInfo['filename'] . '.' . $fileInfo['extension'];
    $conversionResult = null;
    
    if ($format === 'webp') {
        $conversionResult = $conversionService->convertToWebP($uploadedFile, $tempPath, 85);
    } else {
        $conversionResult = $conversionService->convertToAvif($uploadedFile, $tempPath, 80);
    }
    
    if (!$conversionResult) {
        echo "Error: Conversion failed\n";
        exit(1);
    }
    
    // Get converted file path
    $convertedPath = Storage::disk('public')->path($conversionResult['path']);
    $convertedSize = $conversionResult['size'];
    $reduction = $conversionResult['reduction_percent'];
    
    // Generate output filename
    $outputPath = $fileInfo['dirname'] . '/' . $fileInfo['filename'] . '.' . $format;
    
    // Copy converted file to output location
    if (copy($convertedPath, $outputPath)) {
        echo "✓ Conversion successful!\n\n";
        echo "Original: " . formatBytes($originalSize) . "\n";
        echo "Converted: " . formatBytes($convertedSize) . "\n";
        echo "Reduction: {$reduction}%\n";
        echo "Output: {$outputPath}\n";
        
        // Clean up temp file
        Storage::disk('public')->delete($conversionResult['path']);
    } else {
        echo "Error: Failed to save converted file to {$outputPath}\n";
        exit(1);
    }
    
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
    exit(1);
}

function formatBytes($bytes, $precision = 2) {
    $units = ['B', 'KB', 'MB', 'GB'];
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    $bytes /= pow(1024, $pow);
    return round($bytes, $precision) . ' ' . $units[$pow];
}

