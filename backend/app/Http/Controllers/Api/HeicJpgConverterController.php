<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class HeicJpgConverterController extends Controller
{
    public function convert(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:heic,heif,jpg,jpeg,png|max:20480',
            'target_format' => 'required|string|in:jpg,heic',
        ], [
            'file.required' => 'Please upload a file.',
            'file.mimes' => 'File must be HEIC, HEIF, JPG, or JPEG format.',
            'file.max' => 'File size must not exceed 20MB.',
            'target_format.required' => 'Please select target format.',
        ]);

        try {
            $file = $request->file('file');
            $targetFormat = $request->input('target_format');
            $sourceFormat = $this->detectFormat($file);
            
            if ($sourceFormat === $targetFormat) {
                return response()->json([
                    'success' => false,
                    'message' => 'Source and target formats are the same.'
                ], 422);
            }

            $convertedFile = $this->performConversion($file, $sourceFormat, $targetFormat);

            if (!$convertedFile) {
                return response()->json([
                    'success' => false,
                    'message' => 'Conversion not supported. HEIC conversion requires ImageMagick with HEIC support on the server.'
                ], 422);
            }

            $filename = 'converted_' . Str::random(10) . '_' . time() . '.' . $targetFormat;
            $path = 'converted-images/' . $filename;
            
            // Ensure directory exists
            $directory = Storage::disk('public')->path('converted-images');
            if (!is_dir($directory)) {
                mkdir($directory, 0755, true);
            }
            
            Storage::disk('public')->put($path, $convertedFile);
            $url = Storage::disk('public')->url($path);

            return response()->json([
                'success' => true,
                'message' => 'File converted successfully',
                'data' => [
                    'url' => $url,
                    'path' => $path,
                    'filename' => $filename,
                    'source_format' => $sourceFormat,
                    'target_format' => $targetFormat,
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('HEIC/JPG conversion error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to convert file: ' . $e->getMessage()
            ], 500);
        }
    }

    private function detectFormat($file): string
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $mimeType = $file->getMimeType();
        
        if (in_array($extension, ['heic', 'heif']) || strpos($mimeType, 'heic') !== false) {
            return 'heic';
        }
        
        return 'jpg';
    }

    private function performConversion($file, string $sourceFormat, string $targetFormat)
    {
        // HEIC to JPG
        if ($sourceFormat === 'heic' && $targetFormat === 'jpg') {
            return $this->heicToJpg($file);
        }
        
        // JPG to HEIC (Note: This is less common and may require additional setup)
        if ($sourceFormat === 'jpg' && $targetFormat === 'heic') {
            return $this->jpgToHeic($file);
        }

        return null;
    }

    private function heicToJpg($file)
    {
        try {
            // On shared hosting, we'll try multiple methods
            $tempPath = $file->store('temp');
            $fullPath = Storage::path($tempPath);
            $outputPath = $fullPath . '.jpg';
            
            // Method 1: Try ImageMagick convert command (if available on shared hosting)
            if (function_exists('exec') && !ini_get('safe_mode')) {
                $command = sprintf(
                    'convert "%s" "%s" 2>&1',
                    escapeshellarg($fullPath),
                    escapeshellarg($outputPath)
                );
                
                exec($command, $output, $returnCode);
                
                if ($returnCode === 0 && file_exists($outputPath)) {
                    $content = file_get_contents($outputPath);
                    unlink($outputPath);
                    Storage::delete($tempPath);
                    return $content;
                }
            }
            
            // Method 2: Try using PHP GD library (limited HEIC support)
            if (extension_loaded('gd')) {
                try {
                    // GD doesn't natively support HEIC, but we can try
                    // Note: This will likely fail, but we try anyway
                    $imageInfo = @getimagesize($fullPath);
                    if ($imageInfo !== false) {
                        // If GD can read it, convert to JPG
                        $image = imagecreatefromstring(file_get_contents($fullPath));
                        if ($image !== false) {
                            ob_start();
                            imagejpeg($image, null, 90);
                            $jpgContent = ob_get_clean();
                            imagedestroy($image);
                            Storage::delete($tempPath);
                            return $jpgContent;
                        }
                    }
                } catch (\Exception $e) {
                    \Log::warning('GD library HEIC conversion failed: ' . $e->getMessage());
                }
            }
            
            // If all methods fail, provide helpful error message
            Storage::delete($tempPath);
            throw new \Exception('HEIC conversion is not supported on this server. HEIC files require ImageMagick with HEIC support or specialized libraries. For shared hosting, consider using a client-side converter or converting HEIC files on your device before uploading.');
            
        } catch (\Exception $e) {
            \Log::error('HEIC to JPG conversion error: ' . $e->getMessage());
            throw $e;
        }
    }

    private function jpgToHeic($file)
    {
        try {
            // JPG to HEIC requires ImageMagick with HEIC support (rarely available on shared hosting)
            if (!function_exists('exec') || ini_get('safe_mode')) {
                throw new \Exception('JPG to HEIC conversion is not available on this server configuration.');
            }
            
            $tempPath = $file->store('temp');
            $fullPath = Storage::path($tempPath);
            $outputPath = $fullPath . '.heic';
            
            $command = sprintf(
                'convert "%s" "%s" 2>&1',
                escapeshellarg($fullPath),
                escapeshellarg($outputPath)
            );
            
            exec($command, $output, $returnCode);
            
            if ($returnCode === 0 && file_exists($outputPath)) {
                $content = file_get_contents($outputPath);
                unlink($outputPath);
                Storage::delete($tempPath);
                return $content;
            }
            
            Storage::delete($tempPath);
            throw new \Exception('JPG to HEIC conversion requires ImageMagick with HEIC support, which is typically not available on shared hosting. Consider using a desktop application for this conversion.');
            
        } catch (\Exception $e) {
            \Log::error('JPG to HEIC conversion error: ' . $e->getMessage());
            throw $e;
        }
    }
}

