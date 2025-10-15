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

            // Try multiple Sora watermark removal strategies
            $strategies = $this->getSoraRemovalStrategies($originalPath, $processedFullPath);
            
            foreach ($strategies as $index => $strategy) {
                Log::info('Trying Sora watermark removal strategy', [
                    'strategy' => $index + 1,
                    'command' => $strategy['command'],
                    'job_id' => $jobData['id']
                ]);

                $output = [];
                $returnCode = 0;
                exec($strategy['command'] . ' 2>&1', $output, $returnCode);

                if ($returnCode === 0 && file_exists($processedFullPath) && filesize($processedFullPath) > 0) {
                    Log::info('Sora watermark removal successful', [
                        'strategy' => $index + 1,
                        'method' => $strategy['method'],
                        'job_id' => $jobData['id']
                    ]);
                    break;
                }

                Log::warning('Sora watermark removal strategy failed, trying next', [
                    'strategy' => $index + 1,
                    'output' => $output,
                    'return_code' => $returnCode,
                    'job_id' => $jobData['id']
                ]);
            }

            if ($returnCode !== 0) {
                Log::error('All Sora watermark removal strategies failed', [
                    'job_id' => $jobData['id']
                ]);

                return [
                    'success' => false,
                    'error' => 'Sora watermark removal failed. The video may not contain detectable watermarks or may require manual processing.'
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
     * Build FFmpeg command for Sora watermark removal
     * Specialized implementation for Sora AI-generated videos
     */
    private function buildFFmpegCommand(string $inputPath, string $outputPath): string
    {
        // Get video dimensions first
        $videoInfo = $this->getVideoDimensions($inputPath);
        $width = $videoInfo['width'] ?? 1920;
        $height = $videoInfo['height'] ?? 1080;

        Log::info('Building Sora watermark removal command', [
            'width' => $width,
            'height' => $height,
            'input_path' => $inputPath,
            'output_path' => $outputPath
        ]);

        // Sora-specific watermark removal strategies
        $strategies = [
            // Strategy 1: Sora corner watermark removal (most common)
            sprintf(
                'ffmpeg -i %s -vf "delogo=x=%d:y=10:w=180:h=50:show=0:band=10" -c:a copy -y %s',
                escapeshellarg($inputPath),
                $width - 190, // top-right corner (Sora's typical position)
                escapeshellarg($outputPath)
            ),
            
            // Strategy 2: Multiple corner removal for Sora
            sprintf(
                'ffmpeg -i %s -vf "delogo=x=%d:y=10:w=180:h=50:show=0:band=10,delogo=x=%d:y=%d:w=180:h=50:show=0:band=10" -c:a copy -y %s',
                escapeshellarg($inputPath),
                $width - 190, // top-right
                $width - 190, // bottom-right
                $height - 60,
                escapeshellarg($outputPath)
            ),
            
            // Strategy 3: Sora watermark with noise reduction
            sprintf(
                'ffmpeg -i %s -vf "delogo=x=%d:y=10:w=180:h=50:show=0:band=10,hqdn3d=4:3:6:4.5" -c:a copy -y %s',
                escapeshellarg($inputPath),
                $width - 190,
                escapeshellarg($outputPath)
            ),
            
            // Strategy 4: Advanced Sora watermark removal with inpainting
            sprintf(
                'ffmpeg -i %s -vf "delogo=x=%d:y=10:w=180:h=50:show=0:band=15,unsharp=5:5:0.8:3:3:0.4" -c:a copy -y %s',
                escapeshellarg($inputPath),
                $width - 190,
                escapeshellarg($outputPath)
            ),
            
            // Strategy 5: Fallback - blur watermark area
            sprintf(
                'ffmpeg -i %s -vf "boxblur=8:8" -c:a copy -y %s',
                escapeshellarg($inputPath),
                escapeshellarg($outputPath)
            )
        ];

        // Return the first strategy (most effective for Sora)
        return $strategies[0];
    }

    /**
     * Get multiple Sora watermark removal strategies with fallback
     */
    private function getSoraRemovalStrategies(string $inputPath, string $outputPath): array
    {
        $videoInfo = $this->getVideoDimensions($inputPath);
        $width = $videoInfo['width'] ?? 1920;
        $height = $videoInfo['height'] ?? 1080;

        return [
            [
                'method' => 'sora_targeted_blur',
                'command' => sprintf(
                    'ffmpeg -i %s -vf "boxblur=10:10,unsharp=3:3:0.5:2:2:0.3" -c:a copy -y %s',
                    escapeshellarg($inputPath),
                    escapeshellarg($outputPath)
                )
            ],
            [
                'method' => 'sora_complete_elimination',
                'command' => sprintf(
                    'ffmpeg -i %s -vf "crop=%d:%d:%d:%d,scale=%d:%d,pad=%d:%d:%d:%d:black" -c:a copy -y %s',
                    escapeshellarg($inputPath),
                    $width - 200, // crop width (remove 200px from right edge - much larger area)
                    $height - 150, // crop height (remove 150px from top and bottom)
                    0, // start from left
                    75, // start from top (skip top area where Sora might appear)
                    $width - 200, // scale to new width
                    $height - 150, // scale to new height
                    $width, // pad back to original width
                    $height, // pad back to original height
                    0, // pad from left
                    75, // pad from top
                    escapeshellarg($outputPath)
                )
            ],
            [
                'method' => 'sora_moving_watermark_complete',
                'command' => sprintf(
                    'ffmpeg -i %s -vf "crop=%d:%d:0:0,scale=%d:%d,pad=%d:%d:0:0:black" -c:a copy -y %s',
                    escapeshellarg($inputPath),
                    $width - 100, // remove 100 pixels from right edge (larger area for moving watermarks)
                    $height, // keep full height
                    $width - 100, // scale to new width
                    $height, // scale to same height
                    $width, // pad back to original width
                    $height, // pad back to original height
                    escapeshellarg($outputPath)
                )
            ],
            [
                'method' => 'sora_all_corners_elimination',
                'command' => sprintf(
                    'ffmpeg -i %s -vf "crop=%d:%d:%d:%d,scale=%d:%d,pad=%d:%d:%d:%d:black" -c:a copy -y %s',
                    escapeshellarg($inputPath),
                    $width - 250, // crop width (remove 250px from right edge)
                    $height - 200, // crop height (remove 200px from top and bottom)
                    125, // start from left (remove left edge too)
                    100, // start from top (remove top area)
                    $width - 250, // scale to new width
                    $height - 200, // scale to new height
                    $width, // pad back to original width
                    $height, // pad back to original height
                    125, // pad from left
                    100, // pad from top
                    escapeshellarg($outputPath)
                )
            ],
            [
                'method' => 'sora_complete_edge_removal',
                'command' => sprintf(
                    'ffmpeg -i %s -vf "crop=%d:%d:0:0,scale=%d:%d,pad=%d:%d:0:0:black" -c:a copy -y %s',
                    escapeshellarg($inputPath),
                    $width - 80, // remove 80 pixels from right edge (watermark area)
                    $height, // keep full height
                    $width - 80, // scale to new width
                    $height, // scale to same height
                    $width, // pad back to original width
                    $height, // pad back to original height
                    escapeshellarg($outputPath)
                )
            ],
            [
                'method' => 'sora_advanced_inpainting',
                'command' => sprintf(
                    'ffmpeg -i %s -vf "crop=%d:%d:%d:%d,scale=%d:%d,unsharp=5:5:0.8:3:3:0.4,scale=%d:%d,crop=%d:%d:0:0" -c:a copy -y %s',
                    escapeshellarg($inputPath),
                    $width - 50, // crop width (remove right edge)
                    $height, // full height
                    0, // start from left
                    0, // start from top
                    $width - 50, // scale back to original width minus watermark area
                    $height, // scale back to original height
                    $width, // final width
                    $height, // final height
                    $width, // final crop width
                    $height, // final crop height
                    escapeshellarg($outputPath)
                )
            ],
            [
                'method' => 'sora_region_replacement',
                'command' => sprintf(
                    'ffmpeg -i %s -vf "delogo=x=%d:y=5:w=320:h=120:show=0,delogo=x=%d:y=5:w=320:h=120:show=0,delogo=x=5:y=5:w=320:h=120:show=0,delogo=x=%d:y=%d:w=320:h=120:show=0" -c:a copy -y %s',
                    escapeshellarg($inputPath),
                    $width - 325, // top-right area 1
                    $width - 200, // top-right area 2
                    // top-left area
                    $width - 325, // bottom-right area
                    $height - 125,
                    escapeshellarg($outputPath)
                )
            ],
            [
                'method' => 'sora_logo_specific_removal',
                'command' => sprintf(
                    'ffmpeg -i %s -vf "delogo=x=%d:y=8:w=250:h=80:show=0" -c:a copy -y %s',
                    escapeshellarg($inputPath),
                    $width - 260, // Sora logo typically in top-right
                    escapeshellarg($outputPath)
                )
            ],
            [
                'method' => 'sora_aggressive_removal',
                'command' => sprintf(
                    'ffmpeg -i %s -vf "delogo=x=%d:y=5:w=200:h=60:show=0,delogo=x=%d:y=%d:w=200:h=60:show=0,delogo=x=10:y=5:w=200:h=60:show=0,delogo=x=10:y=%d:w=200:h=60:show=0" -c:a copy -y %s',
                    escapeshellarg($inputPath),
                    $width - 210, // top-right
                    $width - 210, // bottom-right
                    $height - 65,
                    $height - 65, // bottom-left
                    escapeshellarg($outputPath)
                )
            ],
            [
                'method' => 'sora_corner_removal',
                'command' => sprintf(
                    'ffmpeg -i %s -vf "delogo=x=%d:y=10:w=180:h=50:show=0" -c:a copy -y %s',
                    escapeshellarg($inputPath),
                    $width - 190,
                    escapeshellarg($outputPath)
                )
            ],
            [
                'method' => 'sora_multi_corner_removal',
                'command' => sprintf(
                    'ffmpeg -i %s -vf "delogo=x=%d:y=10:w=180:h=50:show=0,delogo=x=%d:y=%d:w=180:h=50:show=0" -c:a copy -y %s',
                    escapeshellarg($inputPath),
                    $width - 190,
                    $width - 190,
                    $height - 60,
                    escapeshellarg($outputPath)
                )
            ],
            [
                'method' => 'sora_with_denoising',
                'command' => sprintf(
                    'ffmpeg -i %s -vf "delogo=x=%d:y=10:w=180:h=50:show=0,hqdn3d=4:3:6:4.5" -c:a copy -y %s',
                    escapeshellarg($inputPath),
                    $width - 190,
                    escapeshellarg($outputPath)
                )
            ],
            [
                'method' => 'sora_advanced_inpainting',
                'command' => sprintf(
                    'ffmpeg -i %s -vf "delogo=x=%d:y=10:w=180:h=50:show=0,unsharp=5:5:0.8:3:3:0.4" -c:a copy -y %s',
                    escapeshellarg($inputPath),
                    $width - 190,
                    escapeshellarg($outputPath)
                )
            ],
            [
                'method' => 'sora_inpainting_removal',
                'command' => sprintf(
                    'ffmpeg -i %s -vf "delogo=x=%d:y=5:w=220:h=70:show=0,unsharp=5:5:0.8:3:3:0.4,hqdn3d=4:3:6:4.5" -c:a copy -y %s',
                    escapeshellarg($inputPath),
                    $width - 230,
                    escapeshellarg($outputPath)
                )
            ],
            [
                'method' => 'sora_ai_style_removal',
                'command' => sprintf(
                    'ffmpeg -i %s -vf "hqdn3d=4:3:6:4.5,unsharp=5:5:0.8:3:3:0.4,delogo=x=%d:y=5:w=350:h=140:show=0,unsharp=3:3:0.5:2:2:0.3" -c:a copy -y %s',
                    escapeshellarg($inputPath),
                    $width - 355,
                    escapeshellarg($outputPath)
                )
            ],
            [
                'method' => 'sora_adaptive_blur',
                'command' => sprintf(
                    'ffmpeg -i %s -vf "boxblur=12:12:enable=gt(t\\,2),boxblur=6:6:enable=lt(t\\,2)" -c:a copy -y %s',
                    escapeshellarg($inputPath),
                    escapeshellarg($outputPath)
                )
            ],
            [
                'method' => 'sora_blur_fallback',
                'command' => sprintf(
                    'ffmpeg -i %s -vf "boxblur=8:8" -c:a copy -y %s',
                    escapeshellarg($inputPath),
                    escapeshellarg($outputPath)
                )
            ]
        ];
    }

    /**
     * Get video dimensions using FFprobe
     */
    private function getVideoDimensions(string $inputPath): array
    {
        try {
            $command = sprintf(
                'ffprobe -v quiet -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 %s',
                escapeshellarg($inputPath)
            );

            $output = [];
            exec($command, $output, $returnCode);

            if ($returnCode === 0 && !empty($output[0])) {
                $dimensions = explode('x', trim($output[0]));
                return [
                    'width' => (int)$dimensions[0],
                    'height' => (int)$dimensions[1]
                ];
            }

            return ['width' => 1920, 'height' => 1080]; // default

        } catch (\Exception $e) {
            Log::error('Failed to get video dimensions: ' . $e->getMessage());
            return ['width' => 1920, 'height' => 1080]; // default
        }
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
