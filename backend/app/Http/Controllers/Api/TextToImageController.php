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

            // Validate that at least heading or summary is provided
            if (empty(trim($heading)) && empty(trim($summary))) {
                return response()->json([
                    'success' => false,
                    'message' => 'Either heading or summary must be provided.'
                ], 422);
            }

            // Create image using GD library
            $image = imagecreatetruecolor($width, $height);
            
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

            // Calculate text area
            $textAreaWidth = $width - ($padding * 2);
            $textX = $padding;

            // Measure and wrap heading text
            $headingLines = [];
            if (!empty(trim($heading))) {
                $headingLines = $this->wrapText($heading, $fontFamily, $headingSize, $textAreaWidth, true);
            }

            // Measure and wrap summary text
            $summaryLines = [];
            if (!empty(trim($summary))) {
                $summaryLines = $this->wrapText($summary, $fontFamily, $summarySize, $textAreaWidth, false);
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
                    $x = $this->getTextX($textAlign, $textX, $width, $line, $fontFamily, $headingSize, true);
                    $y = $textY + ($index * $headingSize * 1.2);
                    
                    if ($textShadow) {
                        // Draw shadow
                        imagettftext($image, $headingSize, 0, $x + 2, $y + 2, $shadowColorAlloc, $this->getFontPath($fontFamily), $line);
                    }
                    // Draw text
                    imagettftext($image, $headingSize, 0, $x, $y, $headingColorAlloc, $this->getFontPath($fontFamily), $line);
                }
                $textY += count($headingLines) * $headingSize * 1.2 + $headingSpacing;
            }

            // Draw summary with shadow
            if (count($summaryLines) > 0) {
                foreach ($summaryLines as $index => $line) {
                    $x = $this->getTextX($textAlign, $textX, $width, $line, $fontFamily, $summarySize, false);
                    $y = $textY + ($index * $summarySize * $lineSpacing);
                    
                    if ($textShadow) {
                        // Draw shadow
                        imagettftext($image, $summarySize, 0, $x + 1, $y + 1, $shadowColorAlloc, $this->getFontPath($fontFamily), $line);
                    }
                    // Draw text
                    imagettftext($image, $summarySize, 0, $x, $y, $summaryColorAlloc, $this->getFontPath($fontFamily), $line);
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
    private function wrapText($text, $fontFamily, $fontSize, $maxWidth, $isBold): array
    {
        // For now, use simple word wrapping
        // In production, you'd use imagettfbbox for accurate measurement
        $words = explode(' ', $text);
        $lines = [];
        $currentLine = '';

        foreach ($words as $word) {
            $testLine = $currentLine . ($currentLine ? ' ' : '') . $word;
            // Approximate width (rough estimate: 0.6 * fontSize per character)
            $estimatedWidth = strlen($testLine) * $fontSize * 0.6;
            
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
    private function getTextX($align, $textX, $width, $text, $fontFamily, $fontSize, $isBold): int
    {
        $fontPath = $this->getFontPath($fontFamily);
        $bbox = imagettfbbox($fontSize, 0, $fontPath, $text);
        $textWidth = $bbox[4] - $bbox[0];

        if ($align === 'left') {
            return $textX;
        } elseif ($align === 'right') {
            return $width - $textX - $textWidth;
        } else {
            return ($width - $textWidth) / 2;
        }
    }

    /**
     * Get font path (fallback to system fonts)
     */
    private function getFontPath($fontFamily): string
    {
        // Map common font families to system font paths
        $fontMap = [
            'Arial' => '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
            'Helvetica' => '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
            'Times New Roman' => '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf',
            'Courier New' => '/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf',
        ];

        // Try to find font in common locations
        if (isset($fontMap[$fontFamily]) && file_exists($fontMap[$fontFamily])) {
            return $fontMap[$fontFamily];
        }

        // Fallback to DejaVu Sans (usually available on Linux servers)
        $fallback = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
        if (file_exists($fallback)) {
            return $fallback;
        }

        // Last resort: try to find any TTF font
        $possiblePaths = [
            '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
            '/System/Library/Fonts/Helvetica.ttc', // macOS
            'C:/Windows/Fonts/arial.ttf', // Windows
        ];

        foreach ($possiblePaths as $path) {
            if (file_exists($path)) {
                return $path;
            }
        }

        // If no font found, we'll use built-in fonts (but they won't support TTF)
        // This is a fallback - in production, you should ensure fonts are available
        throw new \Exception('No suitable font found. Please ensure TTF fonts are installed on the server.');
    }
}

