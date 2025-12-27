<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageCompressorController extends Controller
{
    public function compress(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,jpg,png,gif,webp,avif|max:10240',
            'quality' => 'nullable|numeric|min:0.1|max:1.0',
            'maxWidth' => 'nullable|integer|min:100|max:4000',
            'maxHeight' => 'nullable|integer|min:100|max:4000',
            'maintainAspectRatio' => 'nullable|boolean',
            'format' => 'nullable|string|in:jpeg,png,webp,avif',
        ], [
            'image.required' => 'Please upload an image file.',
            'image.image' => 'The file must be an image.',
            'image.mimes' => 'The image must be a JPEG, PNG, GIF, WebP, or AVIF file.',
            'image.max' => 'The image size must not exceed 10MB.',
        ]);

        try {
            $file = $request->file('image');
            $quality = $request->input('quality', 0.8);
            $maxWidth = $request->input('maxWidth', 1920);
            $maxHeight = $request->input('maxHeight', 1080);
            $maintainAspectRatio = $request->input('maintainAspectRatio', true);
            $format = $request->input('format', 'jpeg');

            // Get image info
            $imagePath = $file->getRealPath();
            $imageInfo = getimagesize($imagePath);
            
            if (!$imageInfo) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid image file.'
                ], 422);
            }

            $mimeType = $imageInfo['mime'];
            $originalWidth = $imageInfo[0];
            $originalHeight = $imageInfo[1];

            // Load image based on type
            $image = null;
            if ($mimeType === 'image/jpeg') {
                $image = imagecreatefromjpeg($imagePath);
            } elseif ($mimeType === 'image/png') {
                $image = imagecreatefrompng($imagePath);
            } elseif ($mimeType === 'image/gif') {
                $image = imagecreatefromgif($imagePath);
            } elseif ($mimeType === 'image/webp') {
                $image = imagecreatefromwebp($imagePath);
            } elseif ($mimeType === 'image/avif' && function_exists('imagecreatefromavif')) {
                $image = imagecreatefromavif($imagePath);
            }

            if (!$image) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to load image.'
                ], 422);
            }

            // Calculate new dimensions
            $newWidth = $originalWidth;
            $newHeight = $originalHeight;

            if ($originalWidth > $maxWidth || $originalHeight > $maxHeight) {
                if ($maintainAspectRatio) {
                    $ratio = min($maxWidth / $originalWidth, $maxHeight / $originalHeight);
                    $newWidth = (int)($originalWidth * $ratio);
                    $newHeight = (int)($originalHeight * $ratio);
                } else {
                    $newWidth = min($originalWidth, $maxWidth);
                    $newHeight = min($originalHeight, $maxHeight);
                }
            }

            // Create new image with calculated dimensions
            $compressedImage = imagecreatetruecolor($newWidth, $newHeight);

            // Preserve transparency for PNG and GIF
            if ($mimeType === 'image/png' || $mimeType === 'image/gif') {
                imagealphablending($compressedImage, false);
                imagesavealpha($compressedImage, true);
                $transparent = imagecolorallocatealpha($compressedImage, 255, 255, 255, 127);
                imagefilledrectangle($compressedImage, 0, 0, $newWidth, $newHeight, $transparent);
            }

            // Resize image
            imagecopyresampled(
                $compressedImage,
                $image,
                0, 0, 0, 0,
                $newWidth,
                $newHeight,
                $originalWidth,
                $originalHeight
            );

            // Generate unique filename
            $filename = 'compressed_' . Str::random(10) . '_' . time() . '.' . $format;
            $path = 'compressed-images/' . $filename;
            
            // Ensure directory exists
            $directory = Storage::disk('public')->path('compressed-images');
            if (!is_dir($directory)) {
                mkdir($directory, 0755, true);
            }
            
            $fullPath = Storage::disk('public')->path($path);

            // Save compressed image
            $qualityInt = (int)($quality * 100);
            
            if ($format === 'jpeg') {
                imagejpeg($compressedImage, $fullPath, $qualityInt);
            } elseif ($format === 'png') {
                // PNG quality is 0-9 (inverted)
                $pngQuality = 9 - (int)($quality * 9);
                imagepng($compressedImage, $fullPath, $pngQuality);
            } elseif ($format === 'webp') {
                imagewebp($compressedImage, $fullPath, $qualityInt);
            } elseif ($format === 'avif' && function_exists('imageavif')) {
                imageavif($compressedImage, $fullPath, $qualityInt);
            }

            // Clean up
            imagedestroy($image);
            imagedestroy($compressedImage);

            // Get file size
            $fileSize = Storage::disk('public')->size($path);
            $url = Storage::disk('public')->url($path);

            return response()->json([
                'success' => true,
                'message' => 'Image compressed successfully',
                'data' => [
                    'url' => $url,
                    'path' => $path,
                    'dimensions' => [
                        'width' => $newWidth,
                        'height' => $newHeight,
                        'original_width' => $originalWidth,
                        'original_height' => $originalHeight,
                    ],
                    'file_size' => $fileSize,
                    'format' => $format,
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Image compression error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to compress image: ' . $e->getMessage()
            ], 500);
        }
    }
}

