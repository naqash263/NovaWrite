# DOCX to PDF Conversion

This document explains how the DOCX to PDF conversion works in the CV export feature.

## Overview

The system uses a two-step process for PDF generation:
1. Generate a DOCX file on the client side using the `docx` library
2. Send the DOCX file to the server for conversion to PDF using LibreOffice or Pandoc

This approach provides several benefits:
- Better quality PDFs compared to HTML-to-PDF or image-based approaches
- More consistent formatting across different browsers and devices
- Proper text selection and search in the resulting PDF
- Better accessibility for screen readers

## Requirements

The server needs to have one of the following installed:
- LibreOffice (preferred): `sudo apt-get install libreoffice-common`
- Pandoc (fallback): `sudo apt-get install pandoc`

## API Endpoints

### Convert DOCX to PDF
- **URL**: `/api/cv-export/docx-to-pdf`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  - `docx`: DOCX file to convert

**Response**:
```json
{
  "success": true,
  "message": "DOCX converted to PDF successfully",
  "download_url": "https://example.com/api/cv-export/download-pdf/cv-12345.pdf"
}
```

### Download PDF
- **URL**: `/api/cv-export/download-pdf/{filename}`
- **Method**: `GET`
- **Response**: PDF file download

## Implementation Details

### Backend

The `DocxToPdfController` handles the conversion process:
1. Validates the uploaded DOCX file
2. Stores it temporarily in the `storage/app/temp` directory
3. Detects available conversion tools (LibreOffice or Pandoc)
4. Converts the DOCX to PDF using the available tool
5. Returns a download URL for the generated PDF
6. Cleans up temporary files after download

### Frontend

The `exportAsPDF` function in `CVBuilder.tsx`:
1. Generates a DOCX file using the `docx` library with CV data
2. Sends the DOCX file to the server for conversion
3. Redirects the user to the PDF download URL
4. Falls back to DOCX export if PDF conversion fails

## Error Handling

- If no conversion tools are available on the server, an error is returned
- If the conversion fails, an error is returned with details
- If the PDF file is not found during download, a 404 error is returned
- The frontend falls back to DOCX export if PDF conversion fails

## Cleanup

Temporary files are automatically deleted after:
- Successful PDF download
- Failed conversion
- Server restart (via Laravel's temporary file handling)
