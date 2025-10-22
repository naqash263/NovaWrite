<?php

namespace App\Services;

use Smalot\PdfParser\Parser;
use PhpOffice\PhpWord\IOFactory;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class FileProcessingService
{
    /**
     * Extract text content from uploaded file
     */
    public function extractTextContent($file, string $fileType): string
    {
        try {
            switch (strtolower($fileType)) {
                case 'pdf':
                    return $this->extractPdfContent($file);
                
                case 'docx':
                    return $this->extractDocxContent($file);
                
                case 'doc':
                    return $this->extractDocContent($file);
                
                case 'txt':
                    return $this->extractTxtContent($file);
                
                default:
                    throw new \Exception("Unsupported file type: {$fileType}");
            }
        } catch (\Exception $e) {
            Log::error('File content extraction failed: ' . $e->getMessage());
            throw new \Exception("Failed to extract content from {$fileType} file: " . $e->getMessage());
        }
    }

    /**
     * Extract text from PDF file
     */
    private function extractPdfContent($file): string
    {
        $tempPath = null;
        $fullPath = null;
        
        try {
            // Store file temporarily
            $tempPath = $file->store('temp');
            $fullPath = Storage::path($tempPath);
            
            // Check if file exists and is readable
            if (!file_exists($fullPath)) {
                throw new \Exception('Temporary file was not created properly');
            }
            
            Log::info('Temporary file created: ' . $fullPath . ' (size: ' . filesize($fullPath) . ' bytes)');
            
            // Try multiple PDF parsing approaches with smart deduplication
            $text = '';
            $bestMethod = '';
            $allResults = [];
            
            // Method 1: Standard Smalot PDF Parser
            try {
                Log::info('=== METHOD 1: Standard Smalot PDF Parser ===');
            $parser = new Parser();
            $pdf = $parser->parseFile($fullPath);
                Log::info('PDF parsed successfully with Smalot parser');
                
                $method1Text = $this->extractWithSmalotParser($pdf);
                if (!empty(trim($method1Text))) {
                    $allResults[] = [
                        'method' => 'Smalot Parser',
                        'text' => $method1Text,
                        'length' => strlen(trim($method1Text))
                    ];
                    Log::info('Method 1 (Smalot) found ' . strlen(trim($method1Text)) . ' characters');
                }
            } catch (\Exception $e) {
                Log::warning('Method 1 (Smalot) failed: ' . $e->getMessage());
            }
            
            // Method 2: pdftotext command line tool
            try {
                Log::info('=== METHOD 2: pdftotext Command Line ===');
                $method2Text = $this->extractWithPdftotext($fullPath);
                if (!empty(trim($method2Text))) {
                    $allResults[] = [
                        'method' => 'pdftotext',
                        'text' => $method2Text,
                        'length' => strlen(trim($method2Text))
                    ];
                    Log::info('Method 2 (pdftotext) found ' . strlen(trim($method2Text)) . ' characters');
                }
            } catch (\Exception $e) {
                Log::warning('Method 2 (pdftotext) failed: ' . $e->getMessage());
            }
            
            // Method 3: Try different pdftotext options
            try {
                Log::info('=== METHOD 3: pdftotext with different options ===');
                $method3Text = $this->extractWithPdftotextOptions($fullPath);
                if (!empty(trim($method3Text))) {
                    $allResults[] = [
                        'method' => 'pdftotext (options)',
                        'text' => $method3Text,
                        'length' => strlen(trim($method3Text))
                    ];
                    Log::info('Method 3 (pdftotext options) found ' . strlen(trim($method3Text)) . ' characters');
                }
            } catch (\Exception $e) {
                Log::warning('Method 3 (pdftotext options) failed: ' . $e->getMessage());
            }
            
            // Select the best result and deduplicate if needed
            if (!empty($allResults)) {
                // Sort by length (longest first)
                usort($allResults, function($a, $b) {
                    return $b['length'] - $a['length'];
                });
                
                $text = $allResults[0]['text'];
                $bestMethod = $allResults[0]['method'];
                
                // Check if we need to deduplicate (if results are very similar)
                if (count($allResults) > 1) {
                    $text = $this->deduplicateText($allResults);
                    Log::info('Applied deduplication to remove duplicate content');
                }
                
                Log::info('Best extraction method: ' . $bestMethod . ' with ' . strlen(trim($text)) . ' characters');
            }
            
            // If no text or minimal text extracted, try OCR
            if (empty(trim($text)) || strlen(trim($text)) < 500) {
                Log::info('No or minimal text found in PDF, attempting OCR...');
                $ocrText = $this->extractPdfWithOCR($fullPath);
                
                if (!empty(trim($ocrText))) {
                    $text = $ocrText;
                    Log::info('OCR extraction successful, text length: ' . strlen($text));
                }
            } else {
                // Even if we got some text, check if it seems incomplete
                // (e.g., very short text for what should be a multi-page CV)
                $textLength = strlen(trim($text));
                Log::info('Text extraction successful, length: ' . $textLength);
                
                // If text seems too short for a CV, try OCR as backup
                if ($textLength < 1000) {
                    Log::info('Text seems short for a CV, trying OCR as backup...');
                    $ocrText = $this->extractPdfWithOCR($fullPath);
                    
                    if (!empty(trim($ocrText)) && strlen(trim($ocrText)) > $textLength) {
                        Log::info('OCR found more text (' . strlen(trim($ocrText)) . ' chars), using OCR result');
                        $text = $ocrText;
                    }
                }
            }
            
            // If still no text after all attempts
            if (empty(trim($text))) {
                Log::warning('No text extracted from PDF after all attempts');
                return "The system could not extract any text from this PDF. It may be an image-based PDF with poor quality or no text content. Please try uploading a clearer scan or a text-based PDF.";
            }
            
            // Clean and normalize text
            $result = $this->cleanText($text);
            
            return $result;
            
        } catch (\Exception $e) {
            Log::error('PDF extraction error: ' . $e->getMessage());
            throw new \Exception('Failed to extract text from PDF: ' . $e->getMessage());
        } finally {
            // Clean up temp file
            if ($tempPath) {
                Storage::delete($tempPath);
            }
        }
    }

    /**
     * Extract text from DOCX file
     */
    private function extractDocxContent($file): string
    {
        try {
            // Store file temporarily
            $tempPath = $file->store('temp');
            $fullPath = Storage::path($tempPath);
            
            // Load DOCX file
            $phpWord = IOFactory::load($fullPath);
            
            // Extract text from all sections
            $text = '';
            foreach ($phpWord->getSections() as $section) {
                foreach ($section->getElements() as $element) {
                    if (method_exists($element, 'getText')) {
                        $text .= $element->getText() . "\n";
                    }
                }
            }
            
            // Clean up temp file
            Storage::delete($tempPath);
            
            // Clean and normalize text
            return $this->cleanText($text);
            
        } catch (\Exception $e) {
            Log::error('DOCX extraction error: ' . $e->getMessage());
            throw new \Exception('Failed to extract text from DOCX: ' . $e->getMessage());
        }
    }

    /**
     * Extract text from DOC file (legacy format)
     * Note: DOC files are complex binary format, this is a basic attempt
     */
    private function extractDocContent($file): string
    {
        try {
            // Store file temporarily
            $tempPath = $file->store('temp');
            $fullPath = Storage::path($tempPath);
            
            // Try to load as DOCX first (some DOC files can be read this way)
            try {
                $phpWord = IOFactory::load($fullPath);
                $text = '';
                foreach ($phpWord->getSections() as $section) {
                    foreach ($section->getElements() as $element) {
                        if (method_exists($element, 'getText')) {
                            $text .= $element->getText() . "\n";
                        }
                    }
                }
                
                Storage::delete($tempPath);
                return $this->cleanText($text);
                
            } catch (\Exception $e) {
                // If DOCX loading fails, try alternative method
                Log::warning('DOC file could not be processed as DOCX: ' . $e->getMessage());
                
                // For now, return an error message suggesting conversion
                Storage::delete($tempPath);
                throw new \Exception('DOC files are not fully supported. Please convert to DOCX or PDF format.');
            }
            
        } catch (\Exception $e) {
            Log::error('DOC extraction error: ' . $e->getMessage());
            throw new \Exception('Failed to extract text from DOC: ' . $e->getMessage());
        }
    }

    /**
     * Extract text from TXT file
     */
    private function extractTxtContent($file): string
    {
        try {
            $content = file_get_contents($file->getRealPath());
            return $this->cleanText($content);
            
        } catch (\Exception $e) {
            Log::error('TXT extraction error: ' . $e->getMessage());
            throw new \Exception('Failed to extract text from TXT: ' . $e->getMessage());
        }
    }

    /**
     * Clean and normalize extracted text
     */
    private function cleanText(string $text): string
    {
        // Memory optimization: limit text size to prevent memory issues
        if (strlen($text) > 100000) { // 100KB limit
            $text = substr($text, 0, 100000);
            $text .= "\n\n[Text truncated due to size limit]";
        }
        
        // Remove excessive whitespace
        $text = preg_replace('/\s+/', ' ', $text);
        
        // Remove control characters except newlines and tabs
        $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $text);
        
        // Normalize line breaks
        $text = preg_replace('/\r\n|\r/', "\n", $text);
        
        // Remove excessive line breaks
        $text = preg_replace('/\n{3,}/', "\n\n", $text);
        
        // Trim whitespace
        $text = trim($text);
        
        return $text;
    }

    /**
     * Validate file type and size
     */
    public function validateFile($file): array
    {
        $errors = [];
        
        // Check file size (5MB limit for memory efficiency)
        if ($file->getSize() > 5 * 1024 * 1024) {
            $errors[] = 'File size must be less than 5MB for optimal processing';
        }
        
        // Check file type
        $allowedTypes = ['pdf', 'doc', 'docx', 'txt'];
        $extension = strtolower($file->getClientOriginalExtension());
        
        if (!in_array($extension, $allowedTypes)) {
            $errors[] = 'Only PDF, DOC, DOCX, and TXT files are allowed';
        }
        
        // Check MIME type
        $allowedMimes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];
        
        if (!in_array($file->getMimeType(), $allowedMimes)) {
            $errors[] = 'Invalid file type detected';
        }
        
        return $errors;
    }

    /**
     * Get file type from filename
     */
    public function getFileType(string $filename): string
    {
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        
        switch ($extension) {
            case 'pdf':
                return 'pdf';
            case 'doc':
                return 'doc';
            case 'docx':
                return 'docx';
            case 'txt':
                return 'txt';
            default:
                throw new \Exception("Unsupported file extension: {$extension}");
        }
    }

    /**
     * Extract text from PDF using Tesseract OCR for image-based PDFs
     * This method attempts multiple approaches to extract text from PDFs
     */
    private function extractPdfWithOCR(string $pdfPath): string
    {
        try {
            // Create a temporary directory for OCR processing
            $tempDir = dirname($pdfPath) . '/ocr_temp_' . uniqid();
            if (!mkdir($tempDir, 0755, true)) {
                throw new \Exception('Failed to create OCR temp directory');
            }
            
            $outputFile = $tempDir . '/output.txt';
            $combinedText = '';
            
            // First try with pdftotext (faster, works for some PDFs)
            $command = sprintf(
                'pdftotext -layout "%s" "%s" 2>/dev/null',
                escapeshellarg($pdfPath),
                escapeshellarg($outputFile)
            );
            
            exec($command, $output, $returnCode);
            
            $initialText = '';
            if (file_exists($outputFile) && filesize($outputFile) > 0) {
                $text = file_get_contents($outputFile);
                if (!empty(trim($text)) && strlen(trim($text)) > 500) {
                    // If we have substantial text content (more than 500 chars), use it
                    // Clean up
                    unlink($outputFile);
                    rmdir($tempDir);
                    return trim($text);
                }
                // Store this text for later comparison if it's not empty
                $initialText = !empty(trim($text)) ? trim($text) : '';
                unlink($outputFile);
            }
            
            // If pdftotext failed, try pdftotext with different options
            Log::info('Standard pdftotext failed, trying with different options...');
            $command = sprintf(
                'pdftotext -raw "%s" "%s" 2>/dev/null',
                escapeshellarg($pdfPath),
                escapeshellarg($outputFile)
            );
            
            exec($command, $output, $returnCode);
            
            if (file_exists($outputFile) && filesize($outputFile) > 0) {
                $text = file_get_contents($outputFile);
                if (!empty(trim($text)) && strlen(trim($text)) > 500) {
                    // If we have substantial text content (more than 500 chars), use it
                    // Clean up
                    unlink($outputFile);
                    rmdir($tempDir);
                    return trim($text);
                }
                // If this attempt got more text than the initial one, store it
                if (strlen(trim($text)) > strlen($initialText)) {
                    $initialText = trim($text);
                }
                unlink($outputFile);
            }
            
            // If still failed, use Tesseract OCR on PDF images
            Log::info('All pdftotext attempts failed, trying Tesseract OCR...');
            
            // Check if tesseract is available
            exec('which tesseract 2>/dev/null', $tesseractOutput, $tesseractCode);
            if ($tesseractCode !== 0) {
                Log::warning('Tesseract OCR not found on system');
                // Try one more pdftotext attempt with -bbox option
                $command = sprintf(
                    'pdftotext -bbox "%s" "%s" 2>/dev/null',
                    escapeshellarg($pdfPath),
                    escapeshellarg($outputFile)
                );
                
                exec($command, $output, $returnCode);
                
                if (file_exists($outputFile) && filesize($outputFile) > 0) {
                    $text = file_get_contents($outputFile);
                    if (!empty(trim($text)) && strlen(trim($text)) > 500) {
                        // If we have substantial text content (more than 500 chars), use it
                        // Clean up
                        unlink($outputFile);
                        rmdir($tempDir);
                        return trim($text);
                    }
                    // If this attempt got more text than previous ones, store it
                    if (strlen(trim($text)) > strlen($initialText)) {
                        $initialText = trim($text);
                    }
                    unlink($outputFile);
                }
                
                // If all attempts failed
                rmdir($tempDir);
                return "This appears to be an image-based PDF. The system attempted to extract text but was unsuccessful. Please try converting to a text-based PDF or DOCX format.";
            }
            
            // Check if pdftoppm is available (for converting PDF pages to images)
            exec('which pdftoppm 2>/dev/null', $pdftoppmOutput, $pdftoppmCode);
            if ($pdftoppmCode !== 0) {
                Log::warning('pdftoppm not found on system');
                rmdir($tempDir);
                return "This appears to be an image-based PDF. The system attempted to extract text but was unsuccessful. Please try converting to a text-based PDF or DOCX format.";
            }
            
            // Extract images from PDF (first 20 pages max to avoid excessive processing)
            $imagePrefix = $tempDir . '/page';
            $extractCommand = sprintf(
                'pdftoppm -png -r 300 -f 1 -l 20 "%s" "%s"',
                escapeshellarg($pdfPath),
                escapeshellarg($imagePrefix)
            );
            
            exec($extractCommand, $extractOutput, $extractCode);
            if ($extractCode !== 0) {
                Log::error('Failed to extract images from PDF');
                // Try one last method - pdfimages
                exec('which pdfimages 2>/dev/null', $pdfimagesOutput, $pdfimagesCode);
                if ($pdfimagesCode === 0) {
                    $extractCommand = sprintf(
                        'pdfimages -png "%s" "%s/img"',
                        escapeshellarg($pdfPath),
                        escapeshellarg($tempDir)
                    );
                    exec($extractCommand);
                    $pageFiles = glob($tempDir . '/img*.png');
                    if (!empty($pageFiles)) {
                        goto process_images; // Jump to image processing
                    }
                }
                
                rmdir($tempDir);
                return "The system attempted to extract text from this PDF but was unsuccessful. Please try a different file format.";
            }
            
            // Process each image with Tesseract OCR
            $pageFiles = glob($tempDir . '/page*.png');
            if (empty($pageFiles)) {
                Log::error('No images extracted from PDF');
                rmdir($tempDir);
                return "The system attempted to extract images from this PDF but was unsuccessful. Please try a different file format.";
            }
            
            // Label for goto statement
            process_images:
            
            // Process each page with Tesseract (limit to 20 pages)
            foreach ($pageFiles as $index => $pageFile) {
                if ($index >= 20) break; // Limit to 20 pages to avoid excessive processing
                
                $pageOutputBase = $tempDir . '/ocr_output_' . $index;
                
                // Try different Tesseract configurations for best results
                $ocrConfigs = [
                    // Default configuration - good general purpose
                    [
                        'params' => '-l eng --psm 1 --oem 3',
                        'description' => 'default'
                    ],
                    // Optimized for dense text
                    [
                        'params' => '-l eng --psm 6 --oem 3',
                        'description' => 'dense_text'
                    ],
                    // Optimized for single column text
                    [
                        'params' => '-l eng --psm 4 --oem 3',
                        'description' => 'single_column'
                    ]
                ];
                
                $bestText = '';
                $bestConfig = '';
                
                // Try each configuration and keep the best result
                foreach ($ocrConfigs as $config) {
                    try {
                        $configOutputBase = $pageOutputBase . '_' . $config['description'];
                        $ocrCommand = sprintf(
                            'tesseract "%s" "%s" %s 2>/dev/null',
                            escapeshellarg($pageFile),
                            escapeshellarg($configOutputBase),
                            $config['params']
                        );
                        
                        exec($ocrCommand, $ocrOutput, $ocrCode);
                        
                        // Read OCR output
                        $configOutputFile = $configOutputBase . '.txt';
                        if (file_exists($configOutputFile)) {
                            $configText = file_get_contents($configOutputFile);
                            if ($configText && strlen(trim($configText)) > strlen(trim($bestText))) {
                                $bestText = $configText;
                                $bestConfig = $config['description'];
                            }
                            unlink($configOutputFile);
                        }
                    } catch (\Exception $e) {
                        Log::warning("OCR config {$config['description']} failed for page {$index}: " . $e->getMessage());
                        continue;
                    }
                }
                
                // Add the best text to the combined result
                if (!empty($bestText)) {
                    Log::info("Page {$index} best OCR config: {$bestConfig}");
                    $combinedText .= $bestText . "\n\n";
                }
                
                // Clean up image file
                unlink($pageFile);
            }
            
            // Clean up temp directory
            rmdir($tempDir);
            
            // If still no text, provide a helpful message
            if (empty(trim($combinedText))) {
                // If we have some text from pdftotext attempts, use that instead
                if (!empty($initialText)) {
                    Log::info('OCR failed but using text from pdftotext');
                    return $initialText;
                }
                
                return "This appears to be an image-based PDF with no recognizable text. The system attempted OCR but could not extract any text. Please try converting to a text-based PDF or DOCX format.";
            }
            
            // Compare OCR result with pdftotext result and use the longer one
            if (!empty($initialText) && strlen($initialText) > strlen(trim($combinedText)) * 1.2) {
                // If pdftotext result is at least 20% longer, use that
                Log::info('Using pdftotext result instead of OCR (longer text)');
                return $initialText;
            }
            
            // Log success
            Log::info('Successfully extracted text from image-based PDF using OCR');
            
            return trim($combinedText);
            
        } catch (\Exception $e) {
            Log::error('OCR extraction failed: ' . $e->getMessage());
            return "Unable to extract text from this PDF. The system attempted OCR but encountered an error. Please try converting to a text-based format for better results.";
        }
    }
    
    /**
     * Extract text using Smalot PDF Parser with multiple approaches
     */
    private function extractWithSmalotParser($pdf): string
    {
        $text = '';
        
        // Approach 1: Simple getText()
        try {
            $simpleText = $pdf->getText();
            if (!empty(trim($simpleText))) {
                $text = $simpleText;
                Log::info('Smalot simple extraction: ' . strlen(trim($text)) . ' chars');
            }
        } catch (\Exception $e) {
            Log::warning('Smalot simple extraction failed: ' . $e->getMessage());
        }
        
        // Approach 2: Page-by-page extraction
        try {
            $pages = $pdf->getPages();
            if (is_array($pages) && count($pages) > 0) {
                $pageText = '';
                Log::info('Smalot page-by-page: processing ' . count($pages) . ' pages');
                
                for ($i = 0; $i < count($pages); $i++) {
                    $page = $pages[$i];
                    if ($page && method_exists($page, 'getText')) {
                        try {
                            $currentPageText = $page->getText();
                            if ($currentPageText && trim($currentPageText)) {
                                $pageText .= "=== PAGE " . ($i + 1) . " ===\n";
                                $pageText .= $currentPageText . "\n\n";
                            }
                        } catch (\Exception $pageError) {
                            Log::warning("Smalot page {$i} error: " . $pageError->getMessage());
                        }
                    }
                }
                
                if (strlen(trim($pageText)) > strlen(trim($text))) {
                    $text = $pageText;
                    Log::info('Smalot page-by-page: ' . strlen(trim($text)) . ' chars');
                }
            }
        } catch (\Exception $e) {
            Log::warning('Smalot page-by-page failed: ' . $e->getMessage());
        }
        
        return $text;
    }
    
    /**
     * Extract text using pdftotext command line tool
     */
    private function extractWithPdftotext(string $pdfPath): string
    {
        $tempFile = tempnam(sys_get_temp_dir(), 'pdftotext_') . '.txt';
        
        // Try different pdftotext options
        $commands = [
            "pdftotext -layout \"{$pdfPath}\" \"{$tempFile}\" 2>/dev/null",
            "pdftotext -raw \"{$pdfPath}\" \"{$tempFile}\" 2>/dev/null",
            "pdftotext -bbox \"{$pdfPath}\" \"{$tempFile}\" 2>/dev/null"
        ];
        
        $bestText = '';
        
        foreach ($commands as $index => $command) {
            exec($command, $output, $returnCode);
            
            if (file_exists($tempFile) && filesize($tempFile) > 0) {
                $text = file_get_contents($tempFile);
                if (strlen(trim($text)) > strlen(trim($bestText))) {
                    $bestText = $text;
                    Log::info("pdftotext option " . ($index + 1) . ": " . strlen(trim($text)) . " chars");
                }
            }
        }
        
        if (file_exists($tempFile)) {
            unlink($tempFile);
        }
        
        return $bestText;
    }
    
    /**
     * Extract text using pdftotext with various options for multi-page PDFs
     */
    private function extractWithPdftotextOptions(string $pdfPath): string
    {
        $tempFile = tempnam(sys_get_temp_dir(), 'pdftotext_options_') . '.txt';
        
        // Try more aggressive options for multi-page PDFs
        $commands = [
            "pdftotext -layout -f 1 -l 20 \"{$pdfPath}\" \"{$tempFile}\" 2>/dev/null",
            "pdftotext -raw -f 1 -l 20 \"{$pdfPath}\" \"{$tempFile}\" 2>/dev/null",
            "pdftotext -table \"{$pdfPath}\" \"{$tempFile}\" 2>/dev/null",
            "pdftotext -lineprinter \"{$pdfPath}\" \"{$tempFile}\" 2>/dev/null"
        ];
        
        $bestText = '';
        
        foreach ($commands as $index => $command) {
            exec($command, $output, $returnCode);
            
            if (file_exists($tempFile) && filesize($tempFile) > 0) {
                $text = file_get_contents($tempFile);
                if (strlen(trim($text)) > strlen(trim($bestText))) {
                    $bestText = $text;
                    Log::info("pdftotext options " . ($index + 1) . ": " . strlen(trim($text)) . " chars");
                }
            }
        }
        
        if (file_exists($tempFile)) {
            unlink($tempFile);
        }
        
        return $bestText;
    }
    
    /**
     * Deduplicate text from multiple extraction methods
     */
    private function deduplicateText(array $results): string
    {
        if (count($results) < 2) {
            return $results[0]['text'];
        }
        
        // Start with the longest result
        $bestResult = $results[0];
        $text = $bestResult['text'];
        
        // Check if other results have significantly different content
        for ($i = 1; $i < count($results); $i++) {
            $currentResult = $results[$i];
            $similarity = $this->calculateTextSimilarity($text, $currentResult['text']);
            
            Log::info("Similarity between {$bestResult['method']} and {$currentResult['method']}: " . round($similarity * 100, 2) . "%");
            
            // If similarity is low (< 80%), the results are different enough to consider merging
            if ($similarity < 0.8) {
                // Check if the current result has unique content not in the best result
                $uniqueContent = $this->extractUniqueContent($text, $currentResult['text']);
                if (!empty(trim($uniqueContent))) {
                    Log::info("Found unique content in {$currentResult['method']}: " . strlen($uniqueContent) . " chars");
                    $text .= "\n\n" . $uniqueContent;
                }
            }
        }
        
        return $text;
    }
    
    /**
     * Calculate similarity between two texts (0-1 scale)
     */
    private function calculateTextSimilarity(string $text1, string $text2): float
    {
        // Normalize texts for comparison
        $normalize = function($text) {
            return strtolower(preg_replace('/\s+/', ' ', trim($text)));
        };
        
        $norm1 = $normalize($text1);
        $norm2 = $normalize($text2);
        
        // If one is much shorter, they're probably not similar
        $len1 = strlen($norm1);
        $len2 = strlen($norm2);
        
        if ($len1 == 0 || $len2 == 0) {
            return 0;
        }
        
        $ratio = min($len1, $len2) / max($len1, $len2);
        if ($ratio < 0.5) {
            return 0;
        }
        
        // Use similar_text for similarity calculation
        similar_text($norm1, $norm2, $percent);
        return $percent / 100;
    }
    
    /**
     * Extract unique content from text2 that's not in text1
     */
    private function extractUniqueContent(string $text1, string $text2): string
    {
        // Split texts into sentences for better comparison
        $sentences1 = preg_split('/[.!?]+/', $text1);
        $sentences2 = preg_split('/[.!?]+/', $text2);
        
        $uniqueSentences = [];
        
        foreach ($sentences2 as $sentence2) {
            $sentence2 = trim($sentence2);
            if (empty($sentence2)) continue;
            
            $isUnique = true;
            $norm2 = strtolower(preg_replace('/\s+/', ' ', $sentence2));
            
            foreach ($sentences1 as $sentence1) {
                $sentence1 = trim($sentence1);
                if (empty($sentence1)) continue;
                
                $norm1 = strtolower(preg_replace('/\s+/', ' ', $sentence1));
                
                // If sentences are very similar, it's not unique
                similar_text($norm1, $norm2, $percent);
                if ($percent > 85) {
                    $isUnique = false;
                    break;
                }
            }
            
            if ($isUnique) {
                $uniqueSentences[] = $sentence2;
            }
        }
        
        return implode('. ', $uniqueSentences);
    }
}


