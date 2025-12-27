<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Exception;

class ImageConversionService
{
    /**
     * Convert image to WebP format automatically
     * 
     * @param UploadedFile $file
     * @param string $originalPath Original stored path
     * @param int $quality WebP quality (0-100, default 85)
     * @return array|null Returns array with 'path', 'size', 'mime_type' or null if conversion failed
     */
    public function convertToWebP(UploadedFile $file, string $originalPath, int $quality = 85): ?array
    {
        try {
            // Check if file is an image
            $mimeType = $file->getMimeType();
            if (!str_starts_with($mimeType, 'image/')) {
                return null;
            }

            // Skip if already WebP
            if ($mimeType === 'image/webp') {
                return null;
            }

            // Skip SVG (vector, no conversion needed)
            if ($mimeType === 'image/svg+xml') {
                return null;
            }

            // Check if WebP is supported
            if (!function_exists('imagewebp')) {
                Log::warning('WebP conversion not available - imagewebp() function not found');
                return null;
            }

            // Get image info
            $imagePath = $file->getRealPath();
            $imageInfo = getimagesize($imagePath);
            
            if (!$imageInfo) {
                Log::warning('Failed to get image info for WebP conversion', ['path' => $imagePath]);
                return null;
            }

            $originalMimeType = $imageInfo['mime'];
            $width = $imageInfo[0];
            $height = $imageInfo[1];

            // Load source image based on mime type
            $sourceImage = $this->loadImage($imagePath, $originalMimeType);
            
            if (!$sourceImage) {
                Log::warning('Failed to load image for WebP conversion', [
                    'path' => $imagePath,
                    'mime_type' => $originalMimeType
                ]);
                return null;
            }

            // Generate WebP filename
            $originalFilename = pathinfo($originalPath, PATHINFO_FILENAME);
            $webpPath = 'uploads/' . $originalFilename . '.webp';
            $fullWebpPath = Storage::disk('public')->path($webpPath);

            // Ensure directory exists
            $directory = dirname($fullWebpPath);
            if (!is_dir($directory)) {
                mkdir($directory, 0755, true);
            }

            // Convert to WebP
            $success = imagewebp($sourceImage, $fullWebpPath, $quality);

            // Clean up
            imagedestroy($sourceImage);

            if (!$success) {
                Log::error('Failed to save WebP image', ['path' => $fullWebpPath]);
                return null;
            }

            // Get file size
            $webpSize = filesize($fullWebpPath);

            // Log conversion success
            $originalSize = $file->getSize();
            $reduction = $originalSize > 0 ? round((1 - $webpSize / $originalSize) * 100, 2) : 0;
            
            Log::info('Image converted to WebP', [
                'original_path' => $originalPath,
                'webp_path' => $webpPath,
                'original_size' => $originalSize,
                'webp_size' => $webpSize,
                'reduction_percent' => $reduction,
                'dimensions' => "{$width}x{$height}"
            ]);

            return [
                'path' => $webpPath,
                'size' => $webpSize,
                'mime_type' => 'image/webp',
                'original_size' => $originalSize,
                'reduction_percent' => $reduction
            ];

        } catch (Exception $e) {
            Log::error('WebP conversion error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return null;
        }
    }

    /**
     * Load image resource from file path
     * 
     * @param string $imagePath
     * @param string $mimeType
     * @return resource|false
     */
    private function loadImage(string $imagePath, string $mimeType)
    {
        switch ($mimeType) {
            case 'image/jpeg':
                return imagecreatefromjpeg($imagePath);
            case 'image/png':
                return imagecreatefrompng($imagePath);
            case 'image/gif':
                return imagecreatefromgif($imagePath);
            case 'image/webp':
                return imagecreatefromwebp($imagePath);
            case 'image/bmp':
                if (function_exists('imagecreatefrombmp')) {
                    return imagecreatefrombmp($imagePath);
                }
                break;
            case 'image/avif':
                // AVIF support requires ImageMagick or PHP 8.1+ with GD 2.3.0+
                // For now, we'll try to use imagecreatefromavif if available
                if (function_exists('imagecreatefromavif')) {
                    return imagecreatefromavif($imagePath);
                }
                break;
        }

        return false;
    }

    /**
     * Check if AVIF is supported
     * 
     * @return bool
     */
    public function isAvifSupported(): bool
    {
        return function_exists('imagecreatefromavif') && function_exists('imageavif');
    }

    /**
     * Check if WebP is supported
     * 
     * @return bool
     */
    public function isWebpSupported(): bool
    {
        return function_exists('imagecreatefromwebp') && function_exists('imagewebp');
    }

    /**
     * Get supported image formats
     * 
     * @return array
     */
    public function getSupportedFormats(): array
    {
        $formats = ['jpeg', 'jpg', 'png', 'gif'];

        if ($this->isWebpSupported()) {
            $formats[] = 'webp';
        }

        if ($this->isAvifSupported()) {
            $formats[] = 'avif';
        }

        return $formats;
    }

    /**
     * Convert image to AVIF format (if supported)
     * 
     * @param UploadedFile $file
     * @param string $originalPath
     * @param int $quality AVIF quality (0-100, default 80)
     * @return array|null
     */
    public function convertToAvif(UploadedFile $file, string $originalPath, int $quality = 80): ?array
    {
        if (!$this->isAvifSupported()) {
            Log::warning('AVIF conversion not available');
            return null;
        }

        try {
            $mimeType = $file->getMimeType();
            if (!str_starts_with($mimeType, 'image/') || $mimeType === 'image/svg+xml') {
                return null;
            }

            if ($mimeType === 'image/avif') {
                return null; // Already AVIF
            }

            $imagePath = $file->getRealPath();
            $imageInfo = getimagesize($imagePath);
            
            if (!$imageInfo) {
                return null;
            }

            $originalMimeType = $imageInfo['mime'];
            $sourceImage = $this->loadImage($imagePath, $originalMimeType);
            
            if (!$sourceImage) {
                return null;
            }

            $originalFilename = pathinfo($originalPath, PATHINFO_FILENAME);
            $avifPath = 'uploads/' . $originalFilename . '.avif';
            $fullAvifPath = Storage::disk('public')->path($avifPath);

            $directory = dirname($fullAvifPath);
            if (!is_dir($directory)) {
                mkdir($directory, 0755, true);
            }

            $success = imageavif($sourceImage, $fullAvifPath, $quality);
            imagedestroy($sourceImage);

            if (!$success) {
                return null;
            }

            $avifSize = filesize($fullAvifPath);
            $originalSize = $file->getSize();
            $reduction = $originalSize > 0 ? round((1 - $avifSize / $originalSize) * 100, 2) : 0;

            return [
                'path' => $avifPath,
                'size' => $avifSize,
                'mime_type' => 'image/avif',
                'original_size' => $originalSize,
                'reduction_percent' => $reduction
            ];

        } catch (Exception $e) {
            Log::error('AVIF conversion error', [
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
}

