<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class TextToImageController extends Controller
{
    /**
     * Generate image from text via API
     */
    public function generate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'heading' => 'nullable|string|max:500',
            'summary' => 'nullable|string|max:2000',
            'width' => 'nullable|integer|min:100|max:5000',
            'height' => 'nullable|integer|min:100|max:5000',
            'backgroundColor' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'headingColor' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'summaryColor' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'headingSize' => 'nullable|integer|min:20|max:120',
            'summarySize' => 'nullable|integer|min:12|max:60',
            'fontFamily' => 'nullable|string|max:50',
            'textAlign' => 'nullable|string|in:left,center,right',
            'padding' => 'nullable|integer|min:20|max:200',
            'useGradient' => 'nullable|boolean',
            'gradientColor' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'textShadow' => 'nullable|boolean',
            'textShadowBlur' => 'nullable|integer|min:0|max:20',
            'lineSpacing' => 'nullable|numeric|min:1.0|max:3.0',
            'headingSpacing' => 'nullable|integer|min:20|max:100',
            'useBackgroundImage' => 'nullable|boolean',
            'backgroundImage' => 'nullable|image|mimes:jpeg,jpg,png,gif,webp|max:10240',
            'backgroundImageUrl' => 'nullable|url|max:2048',
            'backgroundOverlay' => 'nullable|boolean',
            'backgroundOverlayOpacity' => 'nullable|numeric|min:0|max:0.8',
            'useHtmlMode' => 'nullable|boolean',
        ], [
            'heading.max' => 'Heading must not exceed 500 characters.',
            'summary.max' => 'Summary must not exceed 2000 characters.',
            'width.integer' => 'Width must be a number.',
            'width.min' => 'Width must be at least 100 pixels.',
            'width.max' => 'Width must not exceed 5000 pixels.',
            'height.integer' => 'Height must be a number.',
            'height.min' => 'Height must be at least 100 pixels.',
            'height.max' => 'Height must not exceed 5000 pixels.',
            'backgroundColor.regex' => 'Background color must be a valid hex color (e.g., #3B82F6).',
            'headingColor.regex' => 'Heading color must be a valid hex color (e.g., #FFFFFF).',
            'summaryColor.regex' => 'Summary color must be a valid hex color (e.g., #F3F4F6).',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Get parameters with defaults
            $heading = $request->input('heading', '');
            $summary = $request->input('summary', '');
            $width = $request->input('width', 1200);
            $height = $request->input('height', 630);
            $backgroundColor = $request->input('backgroundColor', '#3B82F6');
            $headingColor = $request->input('headingColor', '#FFFFFF');
            $summaryColor = $request->input('summaryColor', '#F3F4F6');
            $headingSize = $request->input('headingSize', 56);
            $summarySize = $request->input('summarySize', 28);
            $fontFamily = $request->input('fontFamily', 'Arial');
            $textAlign = $request->input('textAlign', 'center');
            $padding = $request->input('padding', 80);
            $useGradient = $request->input('useGradient', false);
            $gradientColor = $request->input('gradientColor', '#1E40AF');
            $textShadow = $request->input('textShadow', true);
            $textShadowBlur = $request->input('textShadowBlur', 8);
            $lineSpacing = $request->input('lineSpacing', 1.5);
            $headingSpacing = $request->input('headingSpacing', 50);
            $useBackgroundImage = $request->input('useBackgroundImage', false);
            $backgroundImageUrl = $request->input('backgroundImageUrl');
            $backgroundOverlay = $request->input('backgroundOverlay', true);
            $backgroundOverlayOpacity = $request->input('backgroundOverlayOpacity', 0.3);

            // Validate that at least heading or summary is provided
            if (empty(trim($heading)) && empty(trim($summary))) {
                return response()->json([
                    'success' => false,
                    'message' => 'Either heading or summary must be provided.'
                ], 422);
            }

            // Create image using GD library
            $image = imagecreatetruecolor($width, $height);
            
            // Handle background image if provided
            $backgroundImageResource = null;
            $backgroundImagePath = null;
            
            if ($useBackgroundImage) {
                // Check if image is provided as file upload
                if ($request->hasFile('backgroundImage')) {
                    $backgroundFile = $request->file('backgroundImage');
                    $backgroundImagePath = $backgroundFile->getRealPath();
                }
                // Check if image is provided as URL
                elseif ($backgroundImageUrl) {
                    try {
                        // Download image from URL
                        $tempPath = $this->downloadImageFromUrl($backgroundImageUrl);
                        if ($tempPath) {
                            $backgroundImagePath = $tempPath;
                        } else {
                            return response()->json([
                                'success' => false,
                                'message' => 'Failed to download background image from URL. Please ensure the URL is accessible and points to a valid image file.',
                                'error' => 'IMAGE_DOWNLOAD_FAILED'
                            ], 422);
                        }
                    } catch (\Exception $e) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Error downloading background image: ' . $e->getMessage(),
                            'error' => 'IMAGE_DOWNLOAD_ERROR'
                        ], 422);
                    }
                }
                
                // Process the image if we have a path
                if ($backgroundImagePath) {
                    $backgroundImageInfo = @getimagesize($backgroundImagePath);
                    
                    if ($backgroundImageInfo) {
                        $mimeType = $backgroundImageInfo['mime'];
                        if ($mimeType === 'image/jpeg') {
                            $backgroundImageResource = @imagecreatefromjpeg($backgroundImagePath);
                        } elseif ($mimeType === 'image/png') {
                            $backgroundImageResource = @imagecreatefrompng($backgroundImagePath);
                        } elseif ($mimeType === 'image/gif') {
                            $backgroundImageResource = @imagecreatefromgif($backgroundImagePath);
                        } elseif ($mimeType === 'image/webp') {
                            $backgroundImageResource = @imagecreatefromwebp($backgroundImagePath);
                        }
                        
                        if ($backgroundImageResource) {
                            // Resize background image to fit canvas
                            imagecopyresampled(
                                $image,
                                $backgroundImageResource,
                                0, 0, 0, 0,
                                $width,
                                $height,
                                imagesx($backgroundImageResource),
                                imagesy($backgroundImageResource)
                            );
                            
                            // Add overlay if enabled
                            if ($backgroundOverlay) {
                                $overlayColor = imagecolorallocatealpha($image, 0, 0, 0, (int)((1 - $backgroundOverlayOpacity) * 127));
                                imagefilledrectangle($image, 0, 0, $width, $height, $overlayColor);
                            }
                            
                            imagedestroy($backgroundImageResource);
                        } else {
                            return response()->json([
                                'success' => false,
                                'message' => 'Failed to process background image. Please ensure it is a valid image file (JPEG, PNG, GIF, or WebP).',
                                'error' => 'IMAGE_PROCESSING_FAILED'
                            ], 422);
                        }
                    } else {
                        return response()->json([
                            'success' => false,
                            'message' => 'Invalid background image. Please ensure it is a valid image file.',
                            'error' => 'INVALID_IMAGE'
                        ], 422);
                    }
                    
                    // Clean up temporary file if it was downloaded from URL
                    if ($backgroundImageUrl && file_exists($backgroundImagePath) && strpos($backgroundImagePath, sys_get_temp_dir()) !== false) {
                        @unlink($backgroundImagePath);
                    }
                }
            }
            
            // If no background image was set, use color/gradient
            if (!$backgroundImageResource) {
                // Convert hex colors to RGB
                $bgColor = $this->hexToRgb($backgroundColor);
                $headingRgb = $this->hexToRgb($headingColor);
                $summaryRgb = $this->hexToRgb($summaryColor);
                $gradientRgb = $this->hexToRgb($gradientColor);

                // Allocate colors
                $bgColorAlloc = imagecolorallocate($image, $bgColor['r'], $bgColor['g'], $bgColor['b']);
                $headingColorAlloc = imagecolorallocate($image, $headingRgb['r'], $headingRgb['g'], $headingRgb['b']);
                $summaryColorAlloc = imagecolorallocate($image, $summaryRgb['r'], $summaryRgb['g'], $summaryRgb['b']);
                $shadowColorAlloc = imagecolorallocatealpha($image, 0, 0, 0, 50);

                // Fill background with gradient or solid color
                if ($useGradient) {
                    $this->drawGradient($image, $bgColor, $gradientRgb, $width, $height);
                } else {
                    imagefill($image, 0, 0, $bgColorAlloc);
                }
            } else {
                // Allocate colors for text (still needed even with background image)
                $headingRgb = $this->hexToRgb($headingColor);
                $summaryRgb = $this->hexToRgb($summaryColor);
                $headingColorAlloc = imagecolorallocate($image, $headingRgb['r'], $headingRgb['g'], $headingRgb['b']);
                $summaryColorAlloc = imagecolorallocate($image, $summaryRgb['r'], $summaryRgb['g'], $summaryRgb['b']);
                $shadowColorAlloc = imagecolorallocatealpha($image, 0, 0, 0, 50);
            }

            // Calculate text area
            $textAreaWidth = $width - ($padding * 2);
            $textX = $padding;

            // Get font path first (needed for text wrapping and rendering)
            try {
                $fontPath = $this->getFontPath($fontFamily);
            } catch (\Exception $e) {
                // If font not found, try to use a default
                \Log::warning('Font not found: ' . $fontFamily . ' - ' . $e->getMessage());
                try {
                    $fontPath = $this->getFontPath('Arial');
                } catch (\Exception $e2) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Font system error: ' . $e2->getMessage() . '. Please contact administrator to install TTF fonts on the server.',
                        'error' => 'FONT_NOT_FOUND'
                    ], 500);
                }
            }

            // Measure and wrap heading text
            $headingLines = [];
            if (!empty(trim($heading))) {
                $headingLines = $this->wrapText($heading, $fontFamily, $headingSize, $textAreaWidth, true, $fontPath);
            }

            // Measure and wrap summary text
            $summaryLines = [];
            if (!empty(trim($summary))) {
                $summaryLines = $this->wrapText($summary, $fontFamily, $summarySize, $textAreaWidth, false, $fontPath);
            }

            // Calculate total text height for vertical centering
            $headingHeight = count($headingLines) * $headingSize * 1.2;
            $summaryHeight = count($summaryLines) * $summarySize * $lineSpacing;
            $totalTextHeight = $headingHeight + (count($headingLines) > 0 && count($summaryLines) > 0 ? $headingSpacing : 0) + $summaryHeight;
            
            // Start Y position (centered vertically)
            $startY = ($height - $totalTextHeight) / 2;
            $textY = $startY;

            // Draw heading with shadow
            if (count($headingLines) > 0) {
                foreach ($headingLines as $index => $line) {
                    $x = $this->getTextX($textAlign, $textX, $width, $line, $fontPath, $headingSize, true);
                    $y = (int)($textY + ($index * $headingSize * 1.2));
                    
                    if ($textShadow) {
                        // Draw shadow
                        imagettftext($image, $headingSize, 0, $x + 2, $y + 2, $shadowColorAlloc, $fontPath, $line);
                    }
                    // Draw text
                    imagettftext($image, $headingSize, 0, $x, $y, $headingColorAlloc, $fontPath, $line);
                }
                $textY += count($headingLines) * $headingSize * 1.2 + $headingSpacing;
            }

            // Draw summary with shadow
            if (count($summaryLines) > 0) {
                foreach ($summaryLines as $index => $line) {
                    $x = $this->getTextX($textAlign, $textX, $width, $line, $fontPath, $summarySize, false);
                    $y = (int)($textY + ($index * $summarySize * $lineSpacing));
                    
                    if ($textShadow) {
                        // Draw shadow
                        imagettftext($image, $summarySize, 0, $x + 1, $y + 1, $shadowColorAlloc, $fontPath, $line);
                    }
                    // Draw text
                    imagettftext($image, $summarySize, 0, $x, $y, $summaryColorAlloc, $fontPath, $line);
                }
            }

            // Generate unique filename
            $filename = 'text-image_' . Str::random(10) . '_' . time() . '.png';
            $path = 'text-images/' . $filename;
            
            // Ensure directory exists
            $directory = Storage::disk('public')->path('text-images');
            if (!is_dir($directory)) {
                mkdir($directory, 0755, true);
            }
            
            $fullPath = Storage::disk('public')->path($path);

            // Save image
            imagepng($image, $fullPath, 9);
            imagedestroy($image);

            // Get file size
            $fileSize = Storage::disk('public')->size($path);
            $url = Storage::disk('public')->url($path);

            return response()->json([
                'success' => true,
                'message' => 'Image generated successfully',
                'data' => [
                    'url' => $url,
                    'path' => $path,
                    'dimensions' => [
                        'width' => $width,
                        'height' => $height,
                    ],
                    'file_size' => $fileSize,
                    'format' => 'png',
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Text to image generation error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate image: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Convert hex color to RGB
     */
    private function hexToRgb($hex): array
    {
        $hex = ltrim($hex, '#');
        return [
            'r' => hexdec(substr($hex, 0, 2)),
            'g' => hexdec(substr($hex, 2, 2)),
            'b' => hexdec(substr($hex, 4, 2)),
        ];
    }

    /**
     * Draw gradient background
     */
    private function drawGradient($image, $color1, $color2, $width, $height): void
    {
        for ($y = 0; $y < $height; $y++) {
            $ratio = $y / $height;
            $r = (int)($color1['r'] + ($color2['r'] - $color1['r']) * $ratio);
            $g = (int)($color1['g'] + ($color2['g'] - $color1['g']) * $ratio);
            $b = (int)($color1['b'] + ($color2['b'] - $color1['b']) * $ratio);
            
            $color = imagecolorallocate($image, $r, $g, $b);
            imageline($image, 0, $y, $width, $y, $color);
        }
    }

    /**
     * Wrap text to fit within width
     */
    private function wrapText($text, $fontFamily, $fontSize, $maxWidth, $isBold, $fontPath = null): array
    {
        $words = explode(' ', $text);
        $lines = [];
        $currentLine = '';

        foreach ($words as $word) {
            $testLine = $currentLine . ($currentLine ? ' ' : '') . $word;
            
            // Try to get accurate width if font path is available
            $estimatedWidth = strlen($testLine) * $fontSize * 0.6; // Default estimate
            
            if ($fontPath && function_exists('imagettfbbox')) {
                try {
                    $bbox = imagettfbbox($fontSize, 0, $fontPath, $testLine);
                    if ($bbox !== false) {
                        $estimatedWidth = $bbox[4] - $bbox[0];
                    }
                } catch (\Exception $e) {
                    // Use estimate if measurement fails
                }
            }
            
            if ($estimatedWidth > $maxWidth && $currentLine) {
                $lines[] = $currentLine;
                $currentLine = $word;
            } else {
                $currentLine = $testLine;
            }
        }
        
        if ($currentLine) {
            $lines[] = $currentLine;
        }

        return $lines;
    }

    /**
     * Get X position for text based on alignment
     */
    private function getTextX($align, $textX, $width, $text, $fontPath, $fontSize, $isBold): int
    {
        try {
            $bbox = imagettfbbox($fontSize, 0, $fontPath, $text);
            if ($bbox === false) {
                // Fallback to approximate width
                $textWidth = strlen($text) * $fontSize * 0.6;
            } else {
                $textWidth = $bbox[4] - $bbox[0];
            }
        } catch (\Exception $e) {
            // Fallback to approximate width if font not found
            $textWidth = strlen($text) * $fontSize * 0.6;
        }

        if ($align === 'left') {
            return $textX;
        } elseif ($align === 'right') {
            return $width - $textX - $textWidth;
        } else {
            return (int)(($width - $textWidth) / 2);
        }
    }

    /**
     * Get font path (fallback to system fonts)
     */
    private function getFontPath($fontFamily): string
    {
        // Map common font families to system font paths
        $fontMap = [
            'Arial' => [
                '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
                '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
                '/usr/share/fonts/TTF/DejaVuSans.ttf',
                '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
            ],
            'Helvetica' => [
                '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
                '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
                '/usr/share/fonts/TTF/DejaVuSans.ttf',
            ],
            'Times New Roman' => [
                '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf',
                '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf',
                '/usr/share/fonts/TTF/DejaVuSerif.ttf',
            ],
            'Courier New' => [
                '/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf',
                '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',
                '/usr/share/fonts/TTF/DejaVuSansMono.ttf',
            ],
        ];

        // Try font-specific paths first
        if (isset($fontMap[$fontFamily])) {
            foreach ($fontMap[$fontFamily] as $path) {
                if (file_exists($path)) {
                    return $path;
                }
            }
        }

        // Search common font directories
        $fontDirectories = [
            '/usr/share/fonts/truetype/liberation/',
            '/usr/share/fonts/truetype/dejavu/',
            '/usr/share/fonts/TTF/',
            '/usr/share/fonts/',
            '/System/Library/Fonts/', // macOS
            'C:/Windows/Fonts/', // Windows
        ];

        // Try to find any TTF font in common directories
        foreach ($fontDirectories as $dir) {
            if (is_dir($dir)) {
                // Try common font names
                $commonFonts = [
                    'LiberationSans-Regular.ttf',
                    'DejaVuSans.ttf',
                    'arial.ttf',
                    'Arial.ttf',
                    'helvetica.ttf',
                    'Helvetica.ttf',
                ];
                
                foreach ($commonFonts as $fontFile) {
                    $path = $dir . $fontFile;
                    if (file_exists($path)) {
                        return $path;
                    }
                }
                
                // Try to find any .ttf file in the directory
                $files = glob($dir . '*.ttf');
                if (!empty($files)) {
                    return $files[0];
                }
                
                // Try .ttc files (TrueType Collection)
                $files = glob($dir . '*.ttc');
                if (!empty($files)) {
                    return $files[0];
                }
            }
        }

        // Last resort: search recursively in /usr/share/fonts
        $foundFont = $this->findFontRecursive('/usr/share/fonts');
        if ($foundFont) {
            return $foundFont;
        }

        // If still no font found, throw exception with helpful message
        throw new \Exception('No suitable TTF font found. Please install fonts on the server. Common locations: /usr/share/fonts/truetype/liberation/ or /usr/share/fonts/truetype/dejavu/');
    }

    /**
     * Recursively search for TTF fonts
     */
    private function findFontRecursive($directory, $maxDepth = 3, $currentDepth = 0): ?string
    {
        if ($currentDepth >= $maxDepth || !is_dir($directory) || !is_readable($directory)) {
            return null;
        }

        $files = glob($directory . '/*.ttf');
        if (!empty($files)) {
            return $files[0];
        }

        $files = glob($directory . '/*.ttc');
        if (!empty($files)) {
            return $files[0];
        }

        // Search subdirectories
        $subdirs = glob($directory . '/*', GLOB_ONLYDIR);
        foreach ($subdirs as $subdir) {
            $found = $this->findFontRecursive($subdir, $maxDepth, $currentDepth + 1);
            if ($found) {
                return $found;
            }
        }

        return null;
    }
}

