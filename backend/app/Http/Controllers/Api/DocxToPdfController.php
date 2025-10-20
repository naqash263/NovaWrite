<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

class DocxToPdfController extends Controller
{
    /**
     * Convert a DOCX file to PDF
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function convert(Request $request)
    {
        // Validate the request
        $request->validate([
            'docx' => 'required|file|mimes:docx',
        ]);

        try {
            // Store the uploaded DOCX file
            $docxFile = $request->file('docx');
            $docxFileName = 'cv-' . Str::random(10) . '.docx';
            $docxPath = $docxFile->storeAs('temp', $docxFileName, 'local');
            
            // Define the output PDF path
            $pdfFileName = pathinfo($docxFileName, PATHINFO_FILENAME) . '.pdf';
            $pdfPath = 'temp/' . $pdfFileName;
            $fullDocxPath = storage_path('app/' . $docxPath);
            $fullPdfPath = storage_path('app/' . $pdfPath);

            // Use LibreOffice to convert DOCX to PDF (if installed)
            if ($this->isLibreOfficeInstalled()) {
                $this->convertUsingLibreOffice($fullDocxPath, $fullPdfPath);
            } 
            // Fallback to Pandoc (if installed)
            else if ($this->isPandocInstalled()) {
                $this->convertUsingPandoc($fullDocxPath, $fullPdfPath);
            } 
            // No conversion tool available
            else {
                // Return a more detailed error message
                return response()->json([
                    'success' => false,
                    'message' => 'No conversion tools available on the server',
                    'error' => 'Please install LibreOffice or Pandoc on the server to enable PDF conversion.',
                    'fallback_to_docx' => true
                ], 422); // Use 422 instead of 500 to indicate it's a known issue
            }

            // Check if the PDF was created successfully
            if (!file_exists($fullPdfPath)) {
                throw new \Exception('Failed to create PDF file.');
            }

            // Create a download URL for the PDF
            $downloadUrl = url('api/cv/download-pdf/' . $pdfFileName);

            // Return the download URL
            return response()->json([
                'success' => true,
                'message' => 'DOCX converted to PDF successfully',
                'download_url' => $downloadUrl,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to convert DOCX to PDF',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Download the converted PDF file
     *
     * @param string $filename
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse|\Illuminate\Http\JsonResponse
     */
    public function downloadPdf($filename)
    {
        $path = 'temp/' . $filename;
        
        if (Storage::disk('local')->exists($path)) {
            $fullPath = storage_path('app/' . $path);
            
            // Delete the file after sending it (cleanup)
            register_shutdown_function(function () use ($path) {
                Storage::disk('local')->delete($path);
                
                // Also delete the original DOCX file if it exists
                $docxFile = str_replace('.pdf', '.docx', $path);
                if (Storage::disk('local')->exists($docxFile)) {
                    Storage::disk('local')->delete($docxFile);
                }
            });
            
            return response()->download($fullPath, $filename)->deleteFileAfterSend(true);
        }
        
        return response()->json([
            'success' => false,
            'message' => 'PDF file not found',
        ], 404);
    }

    /**
     * Check if LibreOffice is installed
     *
     * @return bool
     */
    private function isLibreOfficeInstalled()
    {
        $process = new Process(['which', 'libreoffice']);
        $process->run();
        
        return $process->isSuccessful();
    }

    /**
     * Check if Pandoc is installed
     *
     * @return bool
     */
    private function isPandocInstalled()
    {
        $process = new Process(['which', 'pandoc']);
        $process->run();
        
        return $process->isSuccessful();
    }

    /**
     * Convert DOCX to PDF using LibreOffice
     *
     * @param string $docxPath
     * @param string $pdfPath
     * @return void
     * @throws \Exception
     */
    private function convertUsingLibreOffice($docxPath, $pdfPath)
    {
        $outputDir = dirname($pdfPath);
        
        $process = new Process([
            'libreoffice',
            '--headless',
            '--convert-to',
            'pdf',
            '--outdir',
            $outputDir,
            $docxPath
        ]);
        
        $process->run();
        
        if (!$process->isSuccessful()) {
            throw new ProcessFailedException($process);
        }
    }

    /**
     * Convert DOCX to PDF using Pandoc
     *
     * @param string $docxPath
     * @param string $pdfPath
     * @return void
     * @throws \Exception
     */
    private function convertUsingPandoc($docxPath, $pdfPath)
    {
        $process = new Process([
            'pandoc',
            $docxPath,
            '-o',
            $pdfPath
        ]);
        
        $process->run();
        
        if (!$process->isSuccessful()) {
            throw new ProcessFailedException($process);
        }
    }
}
