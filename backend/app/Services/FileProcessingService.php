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
            
            // Try regular PDF parsing first
            $parser = new Parser();
            $pdf = $parser->parseFile($fullPath);
            $text = $pdf->getText();
            
            // If no text or minimal text extracted, try OCR
            if (empty(trim($text)) || strlen(trim($text)) < 500) {
                Log::info('No or minimal text found in PDF, attempting OCR...');
                $ocrText = $this->extractPdfWithOCR($fullPath);
                
                // If OCR found more text than the parser, use OCR result
                if (strlen(trim($ocrText)) > strlen(trim($text)) * 1.2) {
                    Log::info('Using OCR result (more content than parser)');
                    $text = $ocrText;
                } else if (!empty(trim($ocrText)) && empty(trim($text))) {
                    // If parser found nothing but OCR found something, use OCR
                    Log::info('Using OCR result (parser found nothing)');
                    $text = $ocrText;
                } else if (strlen(trim($text)) < 200 && strlen(trim($ocrText)) > 100) {
                    // If parser found very little but OCR found something substantial
                    Log::info('Using OCR result (parser found very little)');
                    $text = $ocrText;
                }
                
                // If OCR returned an error message, use the parser result if available
                if (strpos($ocrText, 'This appears to be an image-based PDF') !== false && !empty(trim($text))) {
                    Log::info('OCR returned an error message, using parser result');
                    // Keep using the parser text
                } else if (strpos($ocrText, 'This appears to be an image-based PDF') !== false && empty(trim($text))) {
                    // Both methods failed, return the OCR error
                    Log::warning('Both parser and OCR failed to extract text');
                    return $ocrText;
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
            
            // Extract images from PDF (first 10 pages max to avoid excessive processing)
            $imagePrefix = $tempDir . '/page';
            $extractCommand = sprintf(
                'pdftoppm -png -r 300 -f 1 -l 10 "%s" "%s"',
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
            
            // Process each page with Tesseract (limit to 10 pages)
            foreach ($pageFiles as $index => $pageFile) {
                if ($index >= 10) break; // Limit to 10 pages to avoid excessive processing
                
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
                        if (strlen(trim($configText)) > strlen(trim($bestText))) {
                            $bestText = $configText;
                            $bestConfig = $config['description'];
                        }
                        unlink($configOutputFile);
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
}


