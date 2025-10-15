<?php

namespace App\Services;

use Illuminate\Support\Str;
use Illuminate\Http\UploadedFile;

class SeoFileNamingService
{
    /**
     * Generate SEO-friendly filename
     */
    public function generateSeoFilename($file, ?string $context = null, ?string $customName = null): array
    {
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $extension = $file->getClientOriginalExtension();
        $mimeType = $file->getMimeType();
        
        // Generate SEO-friendly name
        $seoName = $this->createSeoFriendlyName($originalName, $context, $customName);
        
        // Add timestamp for uniqueness
        $timestamp = now()->format('Y-m-d');
        $uniqueId = substr(md5(uniqid()), 0, 8);
        
        // Create final filename
        $filename = "{$seoName}-{$timestamp}-{$uniqueId}.{$extension}";
        
        // Generate AI-friendly metadata
        $aiMetadata = $this->generateAiFriendlyMetadata($file, $seoName, $context);
        
        return [
            'filename' => $filename,
            'seo_name' => $seoName,
            'original_name' => $file->getClientOriginalName(),
            'ai_metadata' => $aiMetadata,
            'keywords' => $this->extractKeywords($seoName, $context),
            'description' => $this->generateDescription($file, $seoName, $context)
        ];
    }

    /**
     * Create SEO-friendly name from original filename
     */
    private function createSeoFriendlyName(string $originalName, ?string $context = null, ?string $customName = null): string
    {
        // Use custom name if provided
        if ($customName) {
            $baseName = $customName;
        } else {
            $baseName = $originalName;
        }
        
        // Clean and normalize the name
        $seoName = $this->cleanForSeo($baseName);
        
        // Add context if provided
        if ($context) {
            $contextSlug = $this->cleanForSeo($context);
            $seoName = "{$contextSlug}-{$seoName}";
        }
        
        // Add relevant keywords based on file type
        $keywords = $this->getFileTypeKeywords($seoName);
        if ($keywords) {
            $seoName = "{$seoName}-{$keywords}";
        }
        
        return $seoName;
    }

    /**
     * Clean string for SEO
     */
    private function cleanForSeo(string $text): string
    {
        // Convert to lowercase
        $text = strtolower($text);
        
        // Remove special characters and replace with hyphens
        $text = preg_replace('/[^a-z0-9\s-]/', '', $text);
        
        // Replace multiple spaces/hyphens with single hyphen
        $text = preg_replace('/[\s-]+/', '-', $text);
        
        // Remove leading/trailing hyphens
        $text = trim($text, '-');
        
        // Limit length
        $text = Str::limit($text, 50, '');
        
        return $text;
    }

    /**
     * Get file type keywords
     */
    private function getFileTypeKeywords(string $filename): ?string
    {
        $keywords = [
            'image' => 'visual-content',
            'photo' => 'photography',
            'picture' => 'image-graphic',
            'screenshot' => 'screen-capture',
            'diagram' => 'technical-diagram',
            'chart' => 'data-visualization',
            'graph' => 'analytics-chart',
            'logo' => 'brand-logo',
            'icon' => 'ui-icon',
            'banner' => 'promotional-banner',
            'document' => 'text-document',
            'report' => 'business-report',
            'presentation' => 'slide-presentation',
            'spreadsheet' => 'data-sheet',
            'manual' => 'user-guide',
            'tutorial' => 'how-to-guide',
            'template' => 'design-template',
            'resume' => 'cv-resume',
            'cv' => 'curriculum-vitae',
            'certificate' => 'achievement-cert',
            'invoice' => 'billing-document',
            'contract' => 'legal-document',
            'proposal' => 'business-proposal',
            'brochure' => 'marketing-material',
            'flyer' => 'promotional-flyer',
            'poster' => 'advertising-poster',
            'infographic' => 'info-graphic',
            'ebook' => 'digital-book',
            'whitepaper' => 'research-paper',
            'case-study' => 'business-case',
            'checklist' => 'task-checklist',
            'workflow' => 'process-workflow',
            'diagram' => 'flow-diagram',
            'mindmap' => 'concept-map',
            'timeline' => 'project-timeline',
            'calendar' => 'schedule-calendar',
            'form' => 'data-form',
            'survey' => 'feedback-survey',
            'questionnaire' => 'research-questionnaire',
            'test' => 'assessment-test',
            'quiz' => 'knowledge-quiz',
            'exam' => 'evaluation-exam',
            'lesson' => 'learning-lesson',
            'course' => 'training-course',
            'module' => 'learning-module',
            'video' => 'video-content',
            'audio' => 'sound-file',
            'podcast' => 'audio-podcast',
            'webinar' => 'online-seminar',
            'demo' => 'product-demo',
            'sample' => 'example-sample',
            'backup' => 'data-backup',
            'archive' => 'compressed-archive',
            'code' => 'source-code',
            'script' => 'automation-script',
            'config' => 'configuration-file',
            'database' => 'data-database',
            'api' => 'api-documentation',
            'sdk' => 'software-sdk',
            'library' => 'code-library',
            'framework' => 'dev-framework',
            'plugin' => 'extension-plugin',
            'theme' => 'design-theme',
            'font' => 'typography-font',
            'stylesheet' => 'css-stylesheet',
            'javascript' => 'js-script',
            'json' => 'data-json',
            'xml' => 'markup-xml',
            'csv' => 'data-csv',
            'excel' => 'spreadsheet-excel',
            'word' => 'document-word',
            'powerpoint' => 'presentation-ppt',
            'pdf' => 'document-pdf',
            'zip' => 'archive-zip',
            'rar' => 'archive-rar',
            'tar' => 'archive-tar',
            'gzip' => 'compressed-gzip'
        ];
        
        foreach ($keywords as $keyword => $seoKeyword) {
            if (strpos($filename, $keyword) !== false) {
                return $seoKeyword;
            }
        }
        
        return null;
    }

    /**
     * Generate AI-friendly metadata
     */
    private function generateAiFriendlyMetadata($file, string $seoName, ?string $context = null): array
    {
        $mimeType = $file->getMimeType();
        $extension = $file->getClientOriginalExtension();
        
        $metadata = [
            'file_type' => $this->getFileTypeCategory($mimeType),
            'content_category' => $this->getContentCategory($seoName, $context),
            'searchable_keywords' => $this->extractKeywords($seoName, $context),
            'ai_tags' => $this->generateAiTags($seoName, $mimeType, $context),
            'content_purpose' => $this->determineContentPurpose($seoName, $context),
            'target_audience' => $this->determineTargetAudience($seoName, $context),
            'seo_score' => $this->calculateSeoScore($seoName, $context)
        ];
        
        return $metadata;
    }

    /**
     * Get file type category
     */
    private function getFileTypeCategory(string $mimeType): string
    {
        if (str_starts_with($mimeType, 'image/')) {
            return 'visual_content';
        } elseif (str_starts_with($mimeType, 'video/')) {
            return 'video_content';
        } elseif (str_starts_with($mimeType, 'audio/')) {
            return 'audio_content';
        } elseif (str_starts_with($mimeType, 'text/')) {
            return 'text_content';
        } elseif (str_starts_with($mimeType, 'application/pdf')) {
            return 'document_pdf';
        } elseif (str_starts_with($mimeType, 'application/msword') || str_starts_with($mimeType, 'application/vnd.openxmlformats-officedocument.wordprocessingml')) {
            return 'document_word';
        } elseif (str_starts_with($mimeType, 'application/vnd.ms-excel') || str_starts_with($mimeType, 'application/vnd.openxmlformats-officedocument.spreadsheetml')) {
            return 'spreadsheet_excel';
        } elseif (str_starts_with($mimeType, 'application/vnd.ms-powerpoint') || str_starts_with($mimeType, 'application/vnd.openxmlformats-officedocument.presentationml')) {
            return 'presentation_powerpoint';
        } elseif (str_starts_with($mimeType, 'application/zip') || str_starts_with($mimeType, 'application/x-rar-compressed')) {
            return 'archive_compressed';
        } else {
            return 'other_file';
        }
    }

    /**
     * Get content category
     */
    private function getContentCategory(string $seoName, ?string $context = null): string
    {
        $categories = [
            'business' => ['report', 'proposal', 'invoice', 'contract', 'meeting', 'presentation', 'strategy', 'plan'],
            'education' => ['lesson', 'course', 'tutorial', 'guide', 'manual', 'textbook', 'study', 'learning'],
            'marketing' => ['banner', 'flyer', 'poster', 'brochure', 'advertisement', 'campaign', 'promotion'],
            'design' => ['logo', 'icon', 'template', 'mockup', 'wireframe', 'prototype', 'ui', 'ux'],
            'development' => ['code', 'script', 'api', 'sdk', 'library', 'framework', 'plugin', 'theme'],
            'data' => ['chart', 'graph', 'spreadsheet', 'database', 'analytics', 'statistics', 'report'],
            'media' => ['photo', 'image', 'video', 'audio', 'podcast', 'screenshot', 'recording'],
            'documentation' => ['manual', 'guide', 'tutorial', 'api-docs', 'readme', 'specification'],
            'personal' => ['resume', 'cv', 'certificate', 'portfolio', 'profile', 'bio'],
            'technical' => ['diagram', 'flowchart', 'architecture', 'system', 'network', 'infrastructure']
        ];
        
        foreach ($categories as $category => $keywords) {
            foreach ($keywords as $keyword) {
                if (strpos($seoName, $keyword) !== false) {
                    return $category;
                }
            }
        }
        
        return 'general';
    }

    /**
     * Extract keywords from filename and context
     */
    private function extractKeywords(string $seoName, ?string $context = null): array
    {
        $keywords = [];
        
        // Split by hyphens and add individual words
        $words = explode('-', $seoName);
        foreach ($words as $word) {
            if (strlen($word) > 2) {
                $keywords[] = $word;
            }
        }
        
        // Add context keywords if provided
        if ($context) {
            $contextWords = explode('-', $this->cleanForSeo($context));
            foreach ($contextWords as $word) {
                if (strlen($word) > 2) {
                    $keywords[] = $word;
                }
            }
        }
        
        // Add common SEO keywords based on content
        $seoKeywords = $this->getSeoKeywords($seoName);
        $keywords = array_merge($keywords, $seoKeywords);
        
        return array_unique($keywords);
    }

    /**
     * Get SEO keywords based on content
     */
    private function getSeoKeywords(string $seoName): array
    {
        $seoKeywords = [
            'free' => ['free', 'gratis', 'no-cost'],
            'download' => ['download', 'get', 'obtain'],
            'template' => ['template', 'sample', 'example'],
            'guide' => ['guide', 'tutorial', 'how-to', 'instructions'],
            'professional' => ['professional', 'pro', 'expert', 'quality'],
            'modern' => ['modern', 'contemporary', 'updated', 'latest'],
            'business' => ['business', 'corporate', 'commercial', 'enterprise'],
            'creative' => ['creative', 'innovative', 'unique', 'original'],
            'digital' => ['digital', 'online', 'electronic', 'virtual'],
            'premium' => ['premium', 'premium', 'exclusive', 'deluxe']
        ];
        
        $keywords = [];
        foreach ($seoKeywords as $key => $values) {
            if (strpos($seoName, $key) !== false) {
                $keywords = array_merge($keywords, $values);
            }
        }
        
        return $keywords;
    }

    /**
     * Generate AI tags
     */
    private function generateAiTags(string $seoName, string $mimeType, ?string $context = null): array
    {
        $tags = [];
        
        // File type tags
        if (str_starts_with($mimeType, 'image/')) {
            $tags[] = 'visual-content';
            $tags[] = 'image-file';
        } elseif (str_starts_with($mimeType, 'video/')) {
            $tags[] = 'video-content';
            $tags[] = 'multimedia';
        } elseif (str_starts_with($mimeType, 'audio/')) {
            $tags[] = 'audio-content';
            $tags[] = 'sound-file';
        }
        
        // Content tags based on filename
        $contentTags = [
            'document' => ['text-content', 'readable'],
            'image' => ['visual', 'graphic'],
            'video' => ['multimedia', 'motion'],
            'audio' => ['sound', 'listenable'],
            'data' => ['analytics', 'information'],
            'code' => ['programming', 'development'],
            'design' => ['creative', 'aesthetic'],
            'business' => ['professional', 'corporate'],
            'education' => ['learning', 'instructional'],
            'marketing' => ['promotional', 'advertising']
        ];
        
        foreach ($contentTags as $key => $tagValues) {
            if (strpos($seoName, $key) !== false) {
                $tags = array_merge($tags, $tagValues);
            }
        }
        
        // Context tags
        if ($context) {
            $tags[] = $this->cleanForSeo($context);
        }
        
        return array_unique($tags);
    }

    /**
     * Determine content purpose
     */
    private function determineContentPurpose(string $seoName, ?string $context = null): string
    {
        $purposes = [
            'educational' => ['lesson', 'course', 'tutorial', 'guide', 'manual', 'study', 'learning'],
            'marketing' => ['banner', 'flyer', 'poster', 'advertisement', 'promotion', 'campaign'],
            'business' => ['report', 'proposal', 'invoice', 'contract', 'meeting', 'presentation'],
            'creative' => ['design', 'artwork', 'logo', 'icon', 'template', 'mockup'],
            'technical' => ['code', 'script', 'api', 'documentation', 'diagram', 'architecture'],
            'personal' => ['resume', 'cv', 'portfolio', 'profile', 'certificate'],
            'data' => ['chart', 'graph', 'spreadsheet', 'analytics', 'statistics'],
            'media' => ['photo', 'video', 'audio', 'screenshot', 'recording']
        ];
        
        foreach ($purposes as $purpose => $keywords) {
            foreach ($keywords as $keyword) {
                if (strpos($seoName, $keyword) !== false) {
                    return $purpose;
                }
            }
        }
        
        return 'general';
    }

    /**
     * Determine target audience
     */
    private function determineTargetAudience(string $seoName, ?string $context = null): string
    {
        $audiences = [
            'developers' => ['code', 'api', 'sdk', 'programming', 'development', 'technical'],
            'designers' => ['design', 'ui', 'ux', 'mockup', 'prototype', 'creative'],
            'business' => ['business', 'corporate', 'enterprise', 'professional', 'commercial'],
            'students' => ['education', 'learning', 'study', 'academic', 'tutorial', 'course'],
            'marketers' => ['marketing', 'advertising', 'promotion', 'campaign', 'social'],
            'general' => ['general', 'public', 'everyone', 'all-users']
        ];
        
        foreach ($audiences as $audience => $keywords) {
            foreach ($keywords as $keyword) {
                if (strpos($seoName, $keyword) !== false) {
                    return $audience;
                }
            }
        }
        
        return 'general';
    }

    /**
     * Calculate SEO score
     */
    private function calculateSeoScore(string $seoName, ?string $context = null): int
    {
        $score = 0;
        
        // Length score (optimal: 30-60 characters)
        $length = strlen($seoName);
        if ($length >= 30 && $length <= 60) {
            $score += 20;
        } elseif ($length >= 20 && $length <= 80) {
            $score += 10;
        }
        
        // Keyword density
        $words = explode('-', $seoName);
        $uniqueWords = count(array_unique($words));
        if ($uniqueWords >= 3 && $uniqueWords <= 8) {
            $score += 20;
        }
        
        // Hyphen usage (good for SEO)
        $hyphenCount = substr_count($seoName, '-');
        if ($hyphenCount >= 2 && $hyphenCount <= 6) {
            $score += 15;
        }
        
        // No special characters
        if (preg_match('/^[a-z0-9-]+$/', $seoName)) {
            $score += 15;
        }
        
        // Context relevance
        if ($context) {
            $score += 10;
        }
        
        // Descriptive keywords
        $descriptiveKeywords = ['guide', 'tutorial', 'template', 'example', 'professional', 'modern', 'free'];
        foreach ($descriptiveKeywords as $keyword) {
            if (strpos($seoName, $keyword) !== false) {
                $score += 5;
            }
        }
        
        return min($score, 100);
    }

    /**
     * Generate description
     */
    private function generateDescription($file, string $seoName, ?string $context = null): string
    {
        $extension = $file->getClientOriginalExtension();
        $mimeType = $file->getMimeType();
        
        $description = "Download {$seoName} - ";
        
        // Add file type description
        if (str_starts_with($mimeType, 'image/')) {
            $description .= "High-quality image file";
        } elseif (str_starts_with($mimeType, 'video/')) {
            $description .= "Video content file";
        } elseif (str_starts_with($mimeType, 'audio/')) {
            $description .= "Audio file";
        } elseif (str_starts_with($mimeType, 'application/pdf')) {
            $description .= "PDF document";
        } elseif (str_starts_with($mimeType, 'text/')) {
            $description .= "Text document";
        } else {
            $description .= "{$extension} file";
        }
        
        // Add context if provided
        if ($context) {
            $description .= " for {$context}";
        }
        
        $description .= ". Free download available.";
        
        return $description;
    }

    /**
     * Test method for generating SEO filenames from strings
     */
    public static function testGenerateSeoFilename(string $originalName, string $context = 'general', ?string $customName = null): array
    {
        $service = new self();
        
        // Create a mock UploadedFile-like object
        $mockFile = new class($originalName) {
            private $originalName;
            private $extension;
            private $mimeType;
            
            public function __construct($originalName) {
                $this->originalName = $originalName;
                $this->extension = pathinfo($originalName, PATHINFO_EXTENSION);
                $this->mimeType = $this->guessMimeType($this->extension);
            }
            
            public function getClientOriginalName() {
                return $this->originalName;
            }
            
            public function getClientOriginalExtension() {
                return $this->extension;
            }
            
            public function getMimeType() {
                return $this->mimeType;
            }
            
            private function guessMimeType($extension) {
                $mimeTypes = [
                    'jpg' => 'image/jpeg',
                    'jpeg' => 'image/jpeg',
                    'png' => 'image/png',
                    'gif' => 'image/gif',
                    'pdf' => 'application/pdf',
                    'doc' => 'application/msword',
                    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'xls' => 'application/vnd.ms-excel',
                    'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'ppt' => 'application/vnd.ms-powerpoint',
                    'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    'txt' => 'text/plain',
                    'zip' => 'application/zip'
                ];
                
                return $mimeTypes[strtolower($extension)] ?? 'application/octet-stream';
            }
        };
        
        return $service->generateSeoFilename($mockFile, $context, $customName);
    }
}

