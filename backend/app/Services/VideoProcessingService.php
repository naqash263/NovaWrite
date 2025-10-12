<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class VideoProcessingService
{
    /**
     * Remove watermark from video using FFmpeg
     */
    public function removeWatermark(array $jobData): array
    {
        try {
            $originalPath = Storage::disk('public')->path($jobData['original_file_path']);
            $processedFilename = 'processed_' . time() . '_' . Str::random(10) . '.mp4';
            $processedPath = 'watermark-removal/processed/' . $processedFilename;
            $processedFullPath = Storage::disk('public')->path($processedPath);

            // Ensure the processed directory exists
            $processedDir = dirname($processedFullPath);
            if (!is_dir($processedDir)) {
                mkdir($processedDir, 0755, true);
            }

            // Check if FFmpeg is available
            if (!$this->isFFmpegAvailable()) {
                return [
                    'success' => false,
                    'error' => 'FFmpeg is not installed on the server. Please contact administrator.'
                ];
            }

            // For now, we'll implement a simple approach that attempts to remove common watermark patterns
            // In a production environment, you might want to use more sophisticated AI-based approaches
            
            $command = $this->buildFFmpegCommand($originalPath, $processedFullPath);
            
            Log::info('Executing FFmpeg command', [
                'command' => $command,
                'job_id' => $jobData['id']
            ]);

            $output = [];
            $returnCode = 0;
            exec($command . ' 2>&1', $output, $returnCode);

            if ($returnCode !== 0) {
                Log::error('FFmpeg command failed', [
                    'command' => $command,
                    'output' => $output,
                    'return_code' => $returnCode,
                    'job_id' => $jobData['id']
                ]);

                return [
                    'success' => false,
                    'error' => 'Video processing failed: ' . implode("\n", $output)
                ];
            }

            // Verify the processed file was created and has content
            if (!file_exists($processedFullPath) || filesize($processedFullPath) === 0) {
                return [
                    'success' => false,
                    'error' => 'Processed video file was not created or is empty'
                ];
            }

            Log::info('Video processing completed successfully', [
                'job_id' => $jobData['id'],
                'processed_path' => $processedPath,
                'file_size' => filesize($processedFullPath)
            ]);

            return [
                'success' => true,
                'processed_path' => $processedPath,
                'file_size' => filesize($processedFullPath)
            ];

        } catch (\Exception $e) {
            Log::error('Video processing error', [
                'error' => $e->getMessage(),
                'job_id' => $jobData['id'] ?? 'unknown'
            ]);

            return [
                'success' => false,
                'error' => 'Video processing failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Check if FFmpeg is available on the system
     */
    private function isFFmpegAvailable(): bool
    {
        $output = [];
        $returnCode = 0;
        exec('ffmpeg -version 2>&1', $output, $returnCode);
        
        return $returnCode === 0;
    }

    /**
     * Build FFmpeg command for watermark removal
     * This is a basic implementation - in production, you'd want more sophisticated approaches
     */
    private function buildFFmpegCommand(string $inputPath, string $outputPath): string
    {
        // Basic command that attempts to remove watermarks using various filters
        // This is a simplified approach - real watermark removal would require more complex techniques
        
        $command = sprintf(
            'ffmpeg -i %s -vf "delogo=x=0:y=0:w=200:h=50:show=0" -c:a copy -y %s',
            escapeshellarg($inputPath),
            escapeshellarg($outputPath)
        );

        return $command;
    }

    /**
     * Alternative method using AI-based watermark removal
     * This would integrate with external AI services
     */
    public function removeWatermarkWithAI(array $jobData): array
    {
        try {
            // This is a placeholder for AI-based watermark removal
            // You would integrate with services like:
            // - Custom trained models
            // - Third-party AI APIs
            // - Cloud-based video processing services
            
            $originalPath = Storage::disk('public')->path($jobData['original_file_path']);
            
            // For now, we'll simulate AI processing
            // In a real implementation, you would:
            // 1. Upload video to AI service
            // 2. Process with AI model
            // 3. Download processed video
            // 4. Save to storage
            
            Log::info('AI watermark removal not implemented yet', [
                'job_id' => $jobData['id'],
                'note' => 'This would integrate with AI services for better watermark removal'
            ]);

            // Fallback to basic FFmpeg approach
            return $this->removeWatermark($jobData);

        } catch (\Exception $e) {
            Log::error('AI watermark removal error', [
                'error' => $e->getMessage(),
                'job_id' => $jobData['id'] ?? 'unknown'
            ]);

            return [
                'success' => false,
                'error' => 'AI watermark removal failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get video information using FFprobe
     */
    public function getVideoInfo(string $filePath): array
    {
        try {
            if (!$this->isFFprobeAvailable()) {
                return [
                    'success' => false,
                    'error' => 'FFprobe is not available'
                ];
            }

            $command = sprintf(
                'ffprobe -v quiet -print_format json -show_format -show_streams %s',
                escapeshellarg($filePath)
            );

            $output = [];
            $returnCode = 0;
            exec($command, $output, $returnCode);

            if ($returnCode !== 0) {
                return [
                    'success' => false,
                    'error' => 'Failed to get video information'
                ];
            }

            $info = json_decode(implode('', $output), true);

            return [
                'success' => true,
                'data' => $info
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Failed to get video information: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Check if FFprobe is available
     */
    private function isFFprobeAvailable(): bool
    {
        $output = [];
        $returnCode = 0;
        exec('ffprobe -version 2>&1', $output, $returnCode);
        
        return $returnCode === 0;
    }

    /**
     * Clean up old processed files
     */
    public function cleanupOldFiles(int $hoursOld = 24): int
    {
        try {
            $processedDir = Storage::disk('public')->path('watermark-removal/processed');
            $originalDir = Storage::disk('public')->path('watermark-removal/original');
            
            $cutoffTime = now()->subHours($hoursOld)->timestamp;
            $deletedCount = 0;

            // Clean up processed files
            if (is_dir($processedDir)) {
                $files = glob($processedDir . '/*');
                foreach ($files as $file) {
                    if (is_file($file) && filemtime($file) < $cutoffTime) {
                        unlink($file);
                        $deletedCount++;
                    }
                }
            }

            // Clean up original files
            if (is_dir($originalDir)) {
                $files = glob($originalDir . '/*');
                foreach ($files as $file) {
                    if (is_file($file) && filemtime($file) < $cutoffTime) {
                        unlink($file);
                        $deletedCount++;
                    }
                }
            }

            Log::info('Cleaned up old watermark removal files', [
                'deleted_count' => $deletedCount,
                'hours_old' => $hoursOld
            ]);

            return $deletedCount;

        } catch (\Exception $e) {
            Log::error('Failed to cleanup old files', [
                'error' => $e->getMessage(),
                'hours_old' => $hoursOld
            ]);

            return 0;
        }
    }
}
