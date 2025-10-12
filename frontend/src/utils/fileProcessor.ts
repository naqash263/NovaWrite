/**
 * File processing utilities for CV extraction
 * This handles file reading and provides fallback methods for different file types
 */

export interface FileProcessingResult {
  content: string;
  fileType: string;
  success: boolean;
  error?: string;
}

/**
 * Process uploaded file and extract text content
 */
export async function processFile(file: File): Promise<FileProcessingResult> {
  const fileType = getFileType(file.name);
  
  try {
    let content: string;
    
    switch (fileType) {
      case 'txt':
        content = await readTextFile(file);
        break;
      case 'pdf':
        // For PDFs, we'll upload the file to backend for processing
        // since browser PDF parsing is complex
        return {
          content: '',
          fileType,
          success: true,
          error: 'PDF processing will be handled by backend'
        };
      case 'docx':
        // For DOCX files, we'll upload to backend for processing
        return {
          content: '',
          fileType,
          success: true,
          error: 'DOCX processing will be handled by backend'
        };
      case 'doc':
        // For DOC files, we'll upload to backend for processing
        return {
          content: '',
          fileType,
          success: true,
          error: 'DOC processing will be handled by backend'
        };
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
    
    return {
      content,
      fileType,
      success: true
    };
  } catch (error) {
    return {
      content: '',
      fileType,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Read text file content
 */
function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string || '');
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Get file type from filename
 */
export function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext === 'pdf' ? 'pdf' : 
         ext === 'doc' ? 'doc' : 
         ext === 'docx' ? 'docx' : 'txt';
}

/**
 * Validate file before processing
 */
export function validateFile(file: File): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check file size (5MB limit for optimal processing)
  if (file.size > 5 * 1024 * 1024) {
    errors.push('File size must be less than 5MB for optimal processing');
  }

  // Get file type first
  const fileType = getFileType(file.name);
  
  // Warn about potential image-based PDFs
  if (fileType === 'pdf' && file.size > 500 * 1024) { // Files larger than 500KB
    console.warn('Large PDF detected. If this is a scanned document (image-based PDF), text extraction may not work. Consider using a text-based PDF or DOCX file instead.');
  }
  
  // Check file type
  const allowedTypes = ['pdf', 'doc', 'docx', 'txt'];
  
  if (!allowedTypes.includes(fileType)) {
    errors.push('Only PDF, DOC, DOCX, and TXT files are allowed');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Upload file to backend for processing
 */
export async function uploadFileForProcessing(file: File): Promise<Response> {
  const formData = new FormData();
  formData.append('file', file);
  
  return fetch('/api/cv-ai/extract', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: formData
  });
}

/**
 * Process file content (legacy method for backward compatibility)
 */
export async function processFileContent(file: File): Promise<FileProcessingResult> {
  const fileType = getFileType(file.name);
  
  try {
    // For now, only handle TXT files on frontend
    // Other file types will be handled by backend
    if (fileType === 'txt') {
      const content = await readTextFile(file);
      return {
        content,
        fileType,
        success: true
      };
    } else {
      // For PDF/DOC/DOCX, upload to backend
      const response = await uploadFileForProcessing(file);
      const result = await response.json();
      
      if (result.success) {
        return {
          content: '', // Content is processed by backend
          fileType,
          success: true
        };
      } else {
        return {
          content: '',
          fileType,
          success: false,
          error: result.message || 'Failed to process file'
        };
      }
    }
  } catch (error) {
    return {
      content: '',
      fileType,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}


