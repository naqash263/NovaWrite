<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ImageResizerController extends Controller
{
    /**
     * Resize image via API
     */
    public function resize(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'image' => 'required|image|mimes:jpeg,jpg,png,gif,webp,avif,bmp|max:10240', // 10MB max
            'width' => 'nullable|integer|min:1|max:10000',
            'height' => 'nullable|integer|min:1|max:10000',
            'preset' => 'nullable|string|in:instagram-post,instagram-story,instagram-reel,facebook-post,facebook-cover,twitter-post,twitter-header,linkedin-post,linkedin-cover,youtube-thumbnail,pinterest-pin,default',
            'maintain_aspect_ratio' => 'nullable|boolean',
            'quality' => 'nullable|numeric|min:0.1|max:1.0',
            'format' => 'nullable|string|in:jpeg,png,webp,avif',
        ], [
            'image.required' => 'Please upload an image file.',
            'image.image' => 'The uploaded file must be an image.',
            'image.mimes' => 'Only JPEG, PNG, GIF, WebP, AVIF, and BMP images are allowed.',
            'image.max' => 'Image size must not exceed 10MB.',
            'width.integer' => 'Width must be a number.',
            'width.min' => 'Width must be at least 1 pixel.',
            'width.max' => 'Width must not exceed 10,000 pixels.',
            'height.integer' => 'Height must be a number.',
            'height.min' => 'Height must be at least 1 pixel.',
            'height.max' => 'Height must not exceed 10,000 pixels.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $image = $request->file('image');
            $preset = $request->input('preset', 'default');
            $width = $request->input('width');
            $height = $request->input('height');
            $maintainAspectRatio = $request->input('maintain_aspect_ratio', true);
            $quality = $request->input('quality', 0.9);
            $format = $request->input('format', 'jpeg');

            // Get preset dimensions if preset is specified
            $presets = $this->getPresets();
            if ($preset !== 'default' && isset($presets[$preset])) {
                $presetData = $presets[$preset];
                $width = $presetData['width'];
                $height = $presetData['height'];
            }

            // Validate dimensions
            if (!$width && !$height) {
                return response()->json([
                    'success' => false,
                    'message' => 'Either width, height, or preset must be provided.'
                ], 422);
            }

            // Get image info
            $imagePath = $image->getRealPath();
            $imageInfo = getimagesize($imagePath);
            $originalWidth = $imageInfo[0];
            $originalHeight = $imageInfo[1];
            $originalSize = $image->getSize();
            $mimeType = $imageInfo['mime'];

            // Calculate target dimensions
            if ($maintainAspectRatio) {
                $aspectRatio = $originalWidth / $originalHeight;
                
                if ($width && $height) {
                    // Both specified - fit within bounds
                    if ($width / $height > $aspectRatio) {
                        $width = round($height * $aspectRatio);
                    } else {
                        $height = round($width / $aspectRatio);
                    }
                } elseif ($width) {
                    $height = round($width / $aspectRatio);
                } elseif ($height) {
                    $width = round($height * $aspectRatio);
                }
            }

            // Load source image based on mime type
            $sourceImage = null;
            if ($mimeType === 'image/jpeg') {
                $sourceImage = imagecreatefromjpeg($imagePath);
            } elseif ($mimeType === 'image/png') {
                $sourceImage = imagecreatefrompng($imagePath);
            } elseif ($mimeType === 'image/gif') {
                $sourceImage = imagecreatefromgif($imagePath);
            } elseif ($mimeType === 'image/webp') {
                $sourceImage = imagecreatefromwebp($imagePath);
            } elseif ($mimeType === 'image/avif' && function_exists('imagecreatefromavif')) {
                $sourceImage = imagecreatefromavif($imagePath);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Unsupported image format. Please use JPEG, PNG, GIF, WebP, or AVIF.'
                ], 422);
            }

            if (!$sourceImage) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to load image.'
                ], 500);
            }

            // Create resized image
            $resizedImage = imagecreatetruecolor($width, $height);
            
            // Preserve transparency for PNG and GIF
            if ($format === 'png' || $mimeType === 'image/png' || $mimeType === 'image/gif') {
                imagealphablending($resizedImage, false);
                imagesavealpha($resizedImage, true);
                $transparent = imagecolorallocatealpha($resizedImage, 0, 0, 0, 127);
                imagefill($resizedImage, 0, 0, $transparent);
            }

            // Resize image
            imagecopyresampled(
                $resizedImage,
                $sourceImage,
                0, 0, 0, 0,
                $width,
                $height,
                $originalWidth,
                $originalHeight
            );

            // Generate unique filename
            $filename = 'resized_' . Str::random(10) . '_' . time() . '.' . $format;
            $path = 'resized/' . $filename;
            
            // Ensure directory exists
            $directory = Storage::disk('public')->path('resized');
            if (!is_dir($directory)) {
                mkdir($directory, 0755, true);
            }
            
            $fullPath = Storage::disk('public')->path($path);

            // Save resized image
            if ($format === 'jpeg') {
                imagejpeg($resizedImage, $fullPath, (int)($quality * 100));
            } elseif ($format === 'png') {
                imagepng($resizedImage, $fullPath, 9);
            } elseif ($format === 'webp') {
                imagewebp($resizedImage, $fullPath, (int)($quality * 100));
            } elseif ($format === 'avif' && function_exists('imageavif')) {
                imageavif($resizedImage, $fullPath, (int)($quality * 100));
            }

            // Free memory
            imagedestroy($sourceImage);
            imagedestroy($resizedImage);

            // Get file size
            $resizedSize = Storage::disk('public')->size($path);
            $url = Storage::disk('public')->url($path);

            return response()->json([
                'success' => true,
                'message' => 'Image resized successfully',
                'data' => [
                    'url' => $url,
                    'path' => $path,
                    'original_dimensions' => [
                        'width' => $originalWidth,
                        'height' => $originalHeight,
                    ],
                    'resized_dimensions' => [
                        'width' => $width,
                        'height' => $height,
                    ],
                    'original_size' => $originalSize,
                    'resized_size' => $resizedSize,
                    'size_reduction' => round((1 - $resizedSize / $originalSize) * 100, 2),
                    'format' => $format,
                    'quality' => $quality,
                    'preset' => $preset !== 'default' ? $presets[$preset]['name'] : null,
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Image resize error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to resize image: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available presets
     */
    public function presets(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'presets' => $this->getPresets()
        ]);
    }

    /**
     * Get preset definitions
     */
    private function getPresets(): array
    {
        return [
            'instagram-post' => [
                'name' => 'Instagram Post',
                'width' => 1080,
                'height' => 1080,
                'description' => 'Square format for Instagram feed posts',
                'category' => 'social-media'
            ],
            'instagram-story' => [
                'name' => 'Instagram Story',
                'width' => 1080,
                'height' => 1920,
                'description' => 'Vertical format for Instagram stories',
                'category' => 'social-media'
            ],
            'instagram-reel' => [
                'name' => 'Instagram Reel',
                'width' => 1080,
                'height' => 1920,
                'description' => 'Vertical format for Instagram reels',
                'category' => 'social-media'
            ],
            'facebook-post' => [
                'name' => 'Facebook Post',
                'width' => 1200,
                'height' => 630,
                'description' => 'Recommended size for Facebook posts',
                'category' => 'social-media'
            ],
            'facebook-cover' => [
                'name' => 'Facebook Cover',
                'width' => 1640,
                'height' => 859,
                'description' => 'Facebook page cover photo',
                'category' => 'social-media'
            ],
            'twitter-post' => [
                'name' => 'Twitter Post',
                'width' => 1200,
                'height' => 675,
                'description' => 'Recommended size for Twitter posts',
                'category' => 'social-media'
            ],
            'twitter-header' => [
                'name' => 'Twitter Header',
                'width' => 1500,
                'height' => 500,
                'description' => 'Twitter profile header image',
                'category' => 'social-media'
            ],
            'linkedin-post' => [
                'name' => 'LinkedIn Post',
                'width' => 1200,
                'height' => 627,
                'description' => 'Recommended size for LinkedIn posts',
                'category' => 'social-media'
            ],
            'linkedin-cover' => [
                'name' => 'LinkedIn Cover',
                'width' => 1584,
                'height' => 396,
                'description' => 'LinkedIn company page cover image',
                'category' => 'social-media'
            ],
            'youtube-thumbnail' => [
                'name' => 'YouTube Thumbnail',
                'width' => 1280,
                'height' => 720,
                'description' => 'YouTube video thumbnail (16:9)',
                'category' => 'social-media'
            ],
            'pinterest-pin' => [
                'name' => 'Pinterest Pin',
                'width' => 1000,
                'height' => 1500,
                'description' => 'Vertical format for Pinterest pins',
                'category' => 'social-media'
            ],
            'default' => [
                'name' => 'Custom Size',
                'width' => 800,
                'height' => 600,
                'description' => 'Custom dimensions',
                'category' => 'custom'
            ],
        ];
    }
}

