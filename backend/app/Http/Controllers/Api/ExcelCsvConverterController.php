<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Csv as CsvWriter;

class ExcelCsvConverterController extends Controller
{
    public function convert(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240',
            'target_format' => 'required|string|in:xlsx,csv',
        ], [
            'file.required' => 'Please upload a file.',
            'file.mimes' => 'File must be Excel (XLSX, XLS) or CSV format.',
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
            $path = 'converted-files/' . $filename;
            
            // Ensure directory exists
            $directory = Storage::disk('public')->path('converted-files');
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
            \Log::error('Excel/CSV conversion error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to convert file: ' . $e->getMessage()
            ], 500);
        }
    }

    private function detectFormat($file): string
    {
        $extension = strtolower($file->getClientOriginalExtension());
        
        if (in_array($extension, ['xlsx', 'xls'])) {
            return 'xlsx';
        }
        
        return 'csv';
    }

    private function performConversion($file, string $sourceFormat, string $targetFormat)
    {
        // Excel to CSV
        if ($sourceFormat === 'xlsx' && $targetFormat === 'csv') {
            return $this->excelToCsv($file);
        }
        
        // CSV to Excel
        if ($sourceFormat === 'csv' && $targetFormat === 'xlsx') {
            return $this->csvToExcel($file);
        }

        return null;
    }

    private function excelToCsv($file)
    {
        try {
            // Load Excel file
            $tempPath = $file->store('temp');
            $fullPath = Storage::path($tempPath);
            
            $spreadsheet = IOFactory::load($fullPath);
            $worksheet = $spreadsheet->getActiveSheet();
            
            // Get highest row and column
            $highestRow = $worksheet->getHighestRow();
            $highestColumn = $worksheet->getHighestColumn();
            
            // Create CSV content
            $csvData = [];
            for ($row = 1; $row <= $highestRow; $row++) {
                $rowData = [];
                for ($col = 'A'; $col <= $highestColumn; $col++) {
                    $cellValue = $worksheet->getCell($col . $row)->getFormattedValue();
                    // Escape quotes and wrap in quotes if contains comma, quote, or newline
                    if (strpos($cellValue, ',') !== false || strpos($cellValue, '"') !== false || strpos($cellValue, "\n") !== false) {
                        $cellValue = '"' . str_replace('"', '""', $cellValue) . '"';
                    }
                    $rowData[] = $cellValue;
                }
                $csvData[] = implode(',', $rowData);
            }
            
            // Clean up temp file
            Storage::delete($tempPath);
            
            return implode("\n", $csvData);
        } catch (\Exception $e) {
            \Log::error('Excel to CSV conversion error: ' . $e->getMessage());
            throw new \Exception('Failed to convert Excel to CSV: ' . $e->getMessage());
        }
    }

    private function csvToExcel($file)
    {
        try {
            // Read CSV file line by line
            $handle = fopen($file->getRealPath(), 'r');
            if ($handle === false) {
                throw new \Exception('Failed to open CSV file');
            }
            
            // Create new spreadsheet
            $spreadsheet = new Spreadsheet();
            $worksheet = $spreadsheet->getActiveSheet();
            
            $row = 1;
            while (($data = fgetcsv($handle)) !== false) {
                $col = 'A';
                foreach ($data as $cellValue) {
                    $worksheet->setCellValue($col . $row, $cellValue);
                    $col++;
                }
                $row++;
            }
            fclose($handle);
            
            // Save to temporary file
            $tempFile = tempnam(sys_get_temp_dir(), 'xlsx_');
            $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
            $writer->save($tempFile);
            
            // Read and return content
            $content = file_get_contents($tempFile);
            unlink($tempFile);
            
            return $content;
        } catch (\Exception $e) {
            \Log::error('CSV to Excel conversion error: ' . $e->getMessage());
            throw new \Exception('Failed to convert CSV to Excel: ' . $e->getMessage());
        }
    }
}

