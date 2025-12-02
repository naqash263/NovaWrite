<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FileProcessingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\Shared\Html;
use Smalot\PdfParser\Parser;

class DocumentConverterController extends Controller
{
    protected $fileProcessingService;

    public function __construct(FileProcessingService $fileProcessingService)
    {
        $this->fileProcessingService = $fileProcessingService;
    }

    public function convert(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf,doc,docx,txt|max:10240',
            'target_format' => 'required|string|in:pdf,docx,txt',
        ], [
            'file.required' => 'Please upload a file.',
            'file.mimes' => 'File must be PDF, DOC, DOCX, or TXT.',
            'file.max' => 'File size must not exceed 10MB.',
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
                    'message' => 'Conversion not supported or failed.'
                ], 422);
            }

            $filename = 'converted_' . Str::random(10) . '_' . time() . '.' . $targetFormat;
            $path = 'converted-documents/' . $filename;
            
            // Ensure directory exists
            $directory = Storage::disk('public')->path('converted-documents');
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
            \Log::error('Document conversion error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to convert file: ' . $e->getMessage()
            ], 500);
        }
    }

    private function detectFormat($file): string
    {
        $extension = strtolower($file->getClientOriginalExtension());
        
        if (in_array($extension, ['doc', 'docx'])) {
            return $extension === 'docx' ? 'docx' : 'doc';
        }
        
        if ($extension === 'pdf') {
            return 'pdf';
        }
        
        return 'txt';
    }

    private function performConversion($file, string $sourceFormat, string $targetFormat)
    {
        // PDF to Word
        if ($sourceFormat === 'pdf' && $targetFormat === 'docx') {
            return $this->pdfToWord($file);
        }
        
        // Word to PDF
        if (in_array($sourceFormat, ['doc', 'docx']) && $targetFormat === 'pdf') {
            return $this->wordToPdf($file);
        }
        
        // PDF to TXT
        if ($sourceFormat === 'pdf' && $targetFormat === 'txt') {
            return $this->pdfToTxt($file);
        }
        
        // Word to TXT
        if (in_array($sourceFormat, ['doc', 'docx']) && $targetFormat === 'txt') {
            return $this->wordToTxt($file);
        }
        
        // TXT to Word
        if ($sourceFormat === 'txt' && $targetFormat === 'docx') {
            return $this->txtToWord($file);
        }
        
        // TXT to PDF (basic)
        if ($sourceFormat === 'txt' && $targetFormat === 'pdf') {
            return $this->txtToPdf($file);
        }

        return null;
    }

    private function pdfToWord($file)
    {
        try {
            // Extract text from PDF
            $text = $this->fileProcessingService->extractTextContent($file, 'pdf');
            
            // Create Word document
            $phpWord = new PhpWord();
            $section = $phpWord->addSection();
            $section->addText($text);
            
            // Save to temporary file
            $tempFile = tempnam(sys_get_temp_dir(), 'docx_');
            $objWriter = IOFactory::createWriter($phpWord, 'Word2007');
            $objWriter->save($tempFile);
            
            // Read and return content
            $content = file_get_contents($tempFile);
            unlink($tempFile);
            
            return $content;
        } catch (\Exception $e) {
            \Log::error('PDF to Word conversion error: ' . $e->getMessage());
            throw new \Exception('Failed to convert PDF to Word: ' . $e->getMessage());
        }
    }

    private function wordToPdf($file)
    {
        try {
            // Extract text from Word
            $text = $this->fileProcessingService->extractTextContent($file, 'docx');
            
            // For now, create a simple PDF using basic HTML to PDF approach
            // Note: This is a basic implementation. For better results, consider installing dompdf
            $html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
        p { margin: 10px 0; }
    </style>
</head>
<body>
    <pre>' . htmlspecialchars($text) . '</pre>
</body>
</html>';
            
            // Use a simple approach: return HTML that can be converted to PDF client-side
            // Or use a library like dompdf if available
            // For now, we'll create a basic PDF structure
            // Note: This requires dompdf or similar library for proper PDF generation
            
            // Temporary solution: Return text content and let frontend handle PDF generation
            // Or use a service that can convert HTML to PDF
            
            throw new \Exception('Word to PDF conversion requires additional setup. Please use PDF to Word or Word to TXT conversions.');
        } catch (\Exception $e) {
            \Log::error('Word to PDF conversion error: ' . $e->getMessage());
            throw $e;
        }
    }

    private function pdfToTxt($file)
    {
        try {
            $text = $this->fileProcessingService->extractTextContent($file, 'pdf');
            return $text;
        } catch (\Exception $e) {
            \Log::error('PDF to TXT conversion error: ' . $e->getMessage());
            throw new \Exception('Failed to convert PDF to TXT: ' . $e->getMessage());
        }
    }

    private function wordToTxt($file)
    {
        try {
            $text = $this->fileProcessingService->extractTextContent($file, 'docx');
            return $text;
        } catch (\Exception $e) {
            \Log::error('Word to TXT conversion error: ' . $e->getMessage());
            throw new \Exception('Failed to convert Word to TXT: ' . $e->getMessage());
        }
    }

    private function txtToWord($file)
    {
        try {
            $text = file_get_contents($file->getRealPath());
            
            // Create Word document
            $phpWord = new PhpWord();
            $section = $phpWord->addSection();
            
            // Split text into paragraphs
            $paragraphs = explode("\n", $text);
            foreach ($paragraphs as $paragraph) {
                if (trim($paragraph)) {
                    $section->addText(trim($paragraph));
                } else {
                    $section->addTextBreak();
                }
            }
            
            // Save to temporary file
            $tempFile = tempnam(sys_get_temp_dir(), 'docx_');
            $objWriter = IOFactory::createWriter($phpWord, 'Word2007');
            $objWriter->save($tempFile);
            
            // Read and return content
            $content = file_get_contents($tempFile);
            unlink($tempFile);
            
            return $content;
        } catch (\Exception $e) {
            \Log::error('TXT to Word conversion error: ' . $e->getMessage());
            throw new \Exception('Failed to convert TXT to Word: ' . $e->getMessage());
        }
    }

    private function txtToPdf($file)
    {
        try {
            $text = file_get_contents($file->getRealPath());
            
            // Create HTML representation
            $html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
        pre { white-space: pre-wrap; word-wrap: break-word; }
    </style>
</head>
<body>
    <pre>' . htmlspecialchars($text) . '</pre>
</body>
</html>';
            
            // Note: For proper PDF generation, we'd need dompdf or similar
            // For now, return HTML that can be converted client-side
            throw new \Exception('TXT to PDF conversion requires additional setup. Please use TXT to Word conversion.');
        } catch (\Exception $e) {
            \Log::error('TXT to PDF conversion error: ' . $e->getMessage());
            throw $e;
        }
    }
}

