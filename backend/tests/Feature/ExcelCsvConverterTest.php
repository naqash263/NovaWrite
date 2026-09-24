<?php

namespace Tests\Feature;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

class ExcelCsvConverterTest extends TestCase
{
    public function test_sheets_wider_than_column_z_are_fully_exported(): void
    {
        Storage::fake('public');
        $sheet = (new Spreadsheet())->getActiveSheet();
        for ($c = 1; $c <= 28; $c++) { // A .. AB
            $sheet->setCellValue([$c, 1], "H{$c}");
            $sheet->setCellValue([$c, 2], $c);
        }
        $path = tempnam(sys_get_temp_dir(), 'xlsx').'.xlsx';
        (new Xlsx($sheet->getParent()))->save($path);

        $this->post('/api/utility-tools/excel-csv-converter/convert', [
            'file' => new UploadedFile($path, 'wide.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true),
            'target_format' => 'csv',
        ])->assertOk();

        $files = Storage::disk('public')->files('converted-files');
        $this->assertCount(1, $files);
        $lines = preg_split('/\r?\n/', trim(Storage::disk('public')->get($files[0])));
        $this->assertCount(28, explode(',', $lines[0]), 'header row should have 28 columns');
        $this->assertSame('H1', trim(explode(',', $lines[0])[0], '"'));
        $this->assertSame('H28', trim(explode(',', $lines[0])[27], '"'));
    }
}
