<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ImageConversionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class WebPConverterController extends Controller
{
    protected $conversionService;

    public function __construct(ImageConversionService $conversionService)
    {
        $this->conversionService = $conversionService;
    }

    /**
     * Convert image to WebP or AVIF format
     */
    public function convert(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'image' => 'required|image|mimes:jpeg,jpg,png,gif,webp,avif,bmp|max:10240',
            'format' => 'required|string|in:webp,avif',
            'quality' => 'nullable|numeric|min:0.1|max:1.0',
        ], [
            'image.required' => 'Please upload an image file.',
            'image.image' => 'The uploaded file must be an image.',
            'image.mimes' => 'Only JPEG, PNG, GIF, WebP, AVIF, and BMP images are allowed.',
            'image.max' => 'Image size must not exceed 10MB.',
            'format.required' => 'Target format is required.',
            'format.in' => 'Format must be either webp or avif.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $file = $request->file('image');
            $format = $request->input('format');
            $quality = $request->input('quality', $format === 'avif' ? 0.8 : 0.85);

            // Check format support
            if ($format === 'avif' && !$this->conversionService->isAvifSupported()) {
                return response()->json([
                    'success' => false,
                    'message' => 'AVIF conversion is not supported on this server. Please use WebP instead.',
                ], 422);
            }

            if ($format === 'webp' && !$this->conversionService->isWebpSupported()) {
                return response()->json([
                    'success' => false,
                    'message' => 'WebP conversion is not supported on this server.',
                ], 422);
            }

            // Store original file temporarily
            $originalPath = $file->storeAs('temp', Str::random(10) . '_' . time() . '.' . $file->getClientOriginalExtension(), 'public');
            $originalSize = $file->getSize();
            $originalMimeType = $file->getMimeType();

            // Convert image
            $conversionResult = null;
            if ($format === 'webp') {
                $conversionResult = $this->conversionService->convertToWebP($file, $originalPath, (int)($quality * 100));
            } elseif ($format === 'avif') {
                $conversionResult = $this->conversionService->convertToAvif($file, $originalPath, (int)($quality * 100));
            }

            // Clean up original file
            Storage::disk('public')->delete($originalPath);

            if (!$conversionResult) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to convert image. Please try again.',
                ], 500);
            }

            // Get converted file URL
            $convertedUrl = Storage::disk('public')->url($conversionResult['path']);

            return response()->json([
                'success' => true,
                'message' => 'Image converted successfully',
                'data' => [
                    'url' => $convertedUrl,
                    'path' => $conversionResult['path'],
                    'format' => $format,
                    'original_size' => $originalSize,
                    'converted_size' => $conversionResult['size'],
                    'reduction_percent' => $conversionResult['reduction_percent'],
                    'original_mime_type' => $originalMimeType,
                    'converted_mime_type' => $conversionResult['mime_type'],
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('WebP/AVIF conversion error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to convert image: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get supported formats
     */
    public function getSupportedFormats(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'formats' => [
                'webp' => [
                    'supported' => $this->conversionService->isWebpSupported(),
                    'description' => 'WebP format provides excellent compression with wide browser support',
                ],
                'avif' => [
                    'supported' => $this->conversionService->isAvifSupported(),
                    'description' => 'AVIF format offers the best compression but requires modern browsers',
                ],
            ],
            'all_supported' => $this->conversionService->getSupportedFormats(),
        ]);
    }
}

