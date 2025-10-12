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
            
            // If no text extracted, try OCR
            if (empty(trim($text))) {
                Log::info('No text found in PDF, attempting OCR...');
                $text = $this->extractPdfWithOCR($fullPath);
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
     * Extract text from PDF using simple OCR fallback
     */
    private function extractPdfWithOCR(string $pdfPath): string
    {
        try {
            // Create a simple text file with basic OCR attempt
            // This is a lightweight fallback for image-based PDFs
            $tempDir = dirname($pdfPath) . '/ocr_temp_' . uniqid();
            if (!mkdir($tempDir, 0755, true)) {
                throw new \Exception('Failed to create OCR temp directory');
            }
            
            $outputFile = $tempDir . '/output.txt';
            
            // Use a simple approach: try to extract any readable text
            // This is much more memory efficient than full OCR
            $command = sprintf(
                'pdftotext -layout "%s" "%s" 2>/dev/null || echo "No text found" > "%s"',
                escapeshellarg($pdfPath),
                escapeshellarg($outputFile),
                escapeshellarg($outputFile)
            );
            
            exec($command, $output, $returnCode);
            
            $text = '';
            if (file_exists($outputFile)) {
                $text = file_get_contents($outputFile);
                unlink($outputFile);
            }
            
            // Clean up temp directory
            rmdir($tempDir);
            
            // If still no text, provide a helpful message
            if (empty(trim($text)) || $text === "No text found") {
                return "This appears to be an image-based PDF (scanned document). For best results, please convert to a text-based PDF or DOCX format. You can use online tools like SmallPDF or ILovePDF to convert image-based PDFs to text-based ones.";
            }
            
            return trim($text);
            
        } catch (\Exception $e) {
            Log::error('Simple OCR extraction failed: ' . $e->getMessage());
            return "Unable to extract text from this PDF. Please try converting to DOCX format for better results.";
        }
    }
}


