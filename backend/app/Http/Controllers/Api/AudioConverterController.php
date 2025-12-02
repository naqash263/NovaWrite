<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AudioConverterController extends Controller
{
    public function convert(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:mp3,wav,aac,ogg,flac,m4a|max:51200',
            'target_format' => 'required|string|in:mp3,wav',
        ], [
            'file.required' => 'Please upload a file.',
            'file.mimes' => 'File must be MP3, WAV, AAC, OGG, FLAC, or M4A format.',
            'file.max' => 'File size must not exceed 50MB.',
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
                    'message' => 'Conversion not supported. Audio conversion requires FFmpeg on the server.'
                ], 422);
            }

            $filename = 'converted_' . Str::random(10) . '_' . time() . '.' . $targetFormat;
            $path = 'converted-audio/' . $filename;
            
            // Ensure directory exists
            $directory = Storage::disk('public')->path('converted-audio');
            if (!is_dir($directory)) {
                mkdir($directory, 0755, true);
            }
            
            Storage::disk('public')->put($path, $convertedFile);
            
            // Generate URL using API route instead of storage URL
            $apiUrl = config('app.url') . '/api/storage/' . $path;

            return response()->json([
                'success' => true,
                'message' => 'File converted successfully',
                'data' => [
                    'url' => $apiUrl,
                    'path' => $path,
                    'filename' => $filename,
                    'source_format' => $sourceFormat,
                    'target_format' => $targetFormat,
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Audio conversion error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to convert file: ' . $e->getMessage()
            ], 500);
        }
    }

    private function detectFormat($file): string
    {
        $extension = strtolower($file->getClientOriginalExtension());
        
        if ($extension === 'wav') {
            return 'wav';
        }
        
        // Default to MP3 for mp3, aac, ogg, flac, m4a
        return 'mp3';
    }

    private function performConversion($file, string $sourceFormat, string $targetFormat)
    {
        // MP3 to WAV
        if ($sourceFormat === 'mp3' && $targetFormat === 'wav') {
            return $this->mp3ToWav($file);
        }
        
        // WAV to MP3
        if ($sourceFormat === 'wav' && $targetFormat === 'mp3') {
            return $this->wavToMp3($file);
        }
        
        // Other formats to MP3/WAV
        if (in_array($sourceFormat, ['aac', 'ogg', 'flac', 'm4a'])) {
            if ($targetFormat === 'mp3') {
                return $this->audioToMp3($file, $sourceFormat);
            } elseif ($targetFormat === 'wav') {
                return $this->audioToWav($file, $sourceFormat);
            }
        }

        return null;
    }

    private function mp3ToWav($file)
    {
        return $this->convertAudio($file, 'mp3', 'wav');
    }

    private function wavToMp3($file)
    {
        return $this->convertAudio($file, 'wav', 'mp3');
    }

    private function audioToMp3($file, $sourceFormat)
    {
        return $this->convertAudio($file, $sourceFormat, 'mp3');
    }

    private function audioToWav($file, $sourceFormat)
    {
        return $this->convertAudio($file, $sourceFormat, 'wav');
    }

    private function convertAudio($file, $sourceFormat, $targetFormat)
    {
        try {
            // On shared hosting, FFmpeg is typically not available
            // Check if exec is allowed and FFmpeg exists
            if (!function_exists('exec') || ini_get('safe_mode')) {
                throw new \Exception('Audio conversion requires command-line access, which is typically not available on shared hosting. Please use a desktop application or online service for audio conversion.');
            }
            
            // Check if FFmpeg is available
            exec('ffmpeg -version 2>&1', $output, $returnCode);
            if ($returnCode !== 0) {
                // Try alternative: check if ffmpeg is in common paths
                $ffmpegPaths = ['/usr/bin/ffmpeg', '/usr/local/bin/ffmpeg', 'ffmpeg'];
                $ffmpegFound = false;
                
                foreach ($ffmpegPaths as $path) {
                    exec($path . ' -version 2>&1', $testOutput, $testReturn);
                    if ($testReturn === 0) {
                        $ffmpegFound = true;
                        break;
                    }
                }
                
                if (!$ffmpegFound) {
                    throw new \Exception('FFmpeg is not installed on this server. Audio conversion requires FFmpeg, which is typically not available on shared hosting. Please contact your hosting provider or use a desktop application for audio conversion.');
                }
            }
            
            $tempPath = $file->store('temp');
            $fullPath = Storage::path($tempPath);
            $outputPath = $fullPath . '.' . $targetFormat;
            
            // Build FFmpeg command with timeout and resource limits
            $bitrate = $targetFormat === 'mp3' ? '192k' : null;
            $command = sprintf(
                'timeout 60 ffmpeg -i "%s" %s "%s" -y 2>&1',
                escapeshellarg($fullPath),
                $bitrate ? '-b:a ' . $bitrate : '',
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
            $errorMsg = !empty($output) ? implode("\n", array_slice($output, -5)) : 'Unknown error';
            throw new \Exception('Audio conversion failed. FFmpeg error: ' . $errorMsg);
            
        } catch (\Exception $e) {
            \Log::error('Audio conversion error: ' . $e->getMessage());
            throw $e;
        }
    }
}

