<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use App\Services\FileProcessingService;

class FileProcessingTest extends TestCase
{
    private $fileProcessingService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->fileProcessingService = new FileProcessingService();
    }

    public function test_txt_file_processing()
    {
        // Create a test TXT file
        $content = "John Doe\nSoftware Engineer\njohn@example.com\n+1234567890\n\nExperience:\n- 5 years in software development\n- Led multiple projects\n\nEducation:\n- Bachelor's in Computer Science";
        
        $file = UploadedFile::fake()->createWithContent('test.txt', $content);
        
        $result = $this->fileProcessingService->extractTextContent($file, 'txt');
        
        $this->assertNotEmpty($result);
        $this->assertStringContainsString('John Doe', $result);
        $this->assertStringContainsString('Software Engineer', $result);
    }

    public function test_file_validation()
    {
        // Test valid file
        $validFile = UploadedFile::fake()->create('test.txt', 1000);
        $errors = $this->fileProcessingService->validateFile($validFile);
        $this->assertEmpty($errors);

        // Test file too large
        $largeFile = UploadedFile::fake()->create('test.txt', 11 * 1024 * 1024); // 11MB
        $errors = $this->fileProcessingService->validateFile($largeFile);
        $this->assertNotEmpty($errors);
        $this->assertStringContainsString('File size must be less than 10MB', implode(', ', $errors));

        // Test invalid file type
        $invalidFile = UploadedFile::fake()->create('test.jpg', 1000);
        $errors = $this->fileProcessingService->validateFile($invalidFile);
        $this->assertNotEmpty($errors);
        $this->assertStringContainsString('Only PDF, DOC, DOCX, and TXT files are allowed', implode(', ', $errors));
    }

    public function test_get_file_type()
    {
        $this->assertEquals('pdf', $this->fileProcessingService->getFileType('document.pdf'));
        $this->assertEquals('docx', $this->fileProcessingService->getFileType('resume.docx'));
        $this->assertEquals('doc', $this->fileProcessingService->getFileType('cv.doc'));
        $this->assertEquals('txt', $this->fileProcessingService->getFileType('notes.txt'));
    }
}










