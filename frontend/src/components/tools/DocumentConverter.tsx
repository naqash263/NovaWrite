import { useRef, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';
const MAX_BYTES = 10 * 1024 * 1024;

type SourceFormat = 'pdf' | 'docx' | 'doc' | 'txt';
type TargetFormat = 'pdf' | 'docx' | 'txt';

const targetsFor: Record<SourceFormat, TargetFormat[]> = {
  pdf: ['docx', 'txt'],
  docx: ['pdf', 'txt'],
  doc: ['pdf', 'txt'],
  txt: ['pdf', 'docx'],
};

const formatLabels: Record<SourceFormat | TargetFormat, string> = {
  pdf: 'PDF',
  docx: 'Word (DOCX)',
  doc: 'Word 97-2003 (DOC)',
  txt: 'Plain text (TXT)',
};

const conversionNotes: Record<string, string> = {
  'pdf-docx': 'Extracts the text of the PDF into an editable Word document.',
  'pdf-txt': 'Extracts the text of the PDF into a plain-text file.',
  'docx-pdf': 'Creates a PDF from the text of the Word document.',
  'doc-pdf': 'Creates a PDF from the text of the Word document.',
  'docx-txt': 'Extracts the text of the Word document into a plain-text file.',
  'doc-txt': 'Extracts the text of the Word document into a plain-text file.',
  'txt-pdf': 'Creates an A4 PDF from your text, keeping line breaks.',
  'txt-docx': 'Creates a Word document with one paragraph per line.',
};

const detectFormat = (name: string): SourceFormat | null => {
  const ext = name.split('.').pop()?.toLowerCase();
  return ext === 'pdf' || ext === 'docx' || ext === 'doc' || ext === 'txt' ? ext : null;
};

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : `${(bytes / 1024).toFixed(1)} KB`;

interface ApiResponse {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data?: { url: string; filename: string };
}

export default function DocumentConverter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceFormat, setSourceFormat] = useState<SourceFormat | null>(null);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>('pdf');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [filename, setFilename] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFile = (file: File | undefined) => {
    if (!file) return;
    setError('');
    setDownloadUrl('');
    setFilename('');

    const format = detectFormat(file.name);
    if (!format) {
      setSelectedFile(null);
      setSourceFormat(null);
      setError('Unsupported file type. Please choose a PDF, DOCX, DOC or TXT file.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setSelectedFile(null);
      setSourceFormat(null);
      setError(`${file.name} is ${formatSize(file.size)}. The maximum file size is 10 MB.`);
      return;
    }
    if (file.size === 0) {
      setSelectedFile(null);
      setSourceFormat(null);
      setError(`${file.name} is empty.`);
      return;
    }
    setSelectedFile(file);
    setSourceFormat(format);
    setTargetFormat(targetsFor[format][0]);
  };

  const convertDocument = async () => {
    if (!selectedFile || !sourceFormat) {
      setError('Please select a file first.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setDownloadUrl('');
    setFilename('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('target_format', targetFormat);

      const response = await fetch(`${API_URL}/utility-tools/document-converter/convert`, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      });

      let data: ApiResponse = {};
      try {
        data = (await response.json()) as ApiResponse;
      } catch {
        // Non-JSON response (e.g. proxy error page)
      }

      if (!response.ok || !data.success || !data.data?.url) {
        const firstFieldError = data.errors ? Object.values(data.errors).flat()[0] : '';
        const fallback =
          response.status === 413 ? 'The file is too large for the server. Please use a file under 10 MB.' : 'The conversion failed. Please try again later.';
        throw new Error(firstFieldError || data.message || fallback);
      }

      setDownloadUrl(data.data.url);
      setFilename(data.data.filename);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setError(
        err instanceof TypeError
          ? 'Could not reach the conversion service. Check your connection and try again.'
          : message || 'An error occurred while converting the document.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setSourceFormat(null);
    setDownloadUrl('');
    setFilename('');
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        {/* File Upload */}
        <div
          className={`mb-6 rounded-lg border-2 border-dashed p-4 transition-colors ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            loadFile(e.dataTransfer.files?.[0]);
          }}
        >
          <label htmlFor="document-converter-input" className="block text-sm font-medium text-gray-700 mb-2">
            Select a document to convert (or drop it here)
          </label>
          <input
            id="document-converter-input"
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => loadFile(e.target.files?.[0])}
            aria-describedby="document-converter-hint"
            className="block w-full min-w-0 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p id="document-converter-hint" className="text-sm text-gray-500 mt-2">
            PDF, DOCX, DOC or TXT up to 10 MB.
          </p>
        </div>

        {/* Format Selection */}
        {selectedFile && sourceFormat && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-2">From</span>
              <p className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 truncate" data-testid="source-format">
                {formatLabels[sourceFormat]} · {selectedFile.name}
              </p>
            </div>
            <div>
              <label htmlFor="document-converter-target" className="block text-sm font-medium text-gray-700 mb-2">
                Convert to
              </label>
              <select
                id="document-converter-target"
                value={targetFormat}
                onChange={(e) => {
                  setTargetFormat(e.target.value as TargetFormat);
                  setDownloadUrl('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {targetsFor[sourceFormat].map((t) => (
                  <option key={t} value={t}>
                    {formatLabels[t]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {selectedFile && sourceFormat && (
          <p className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
            {conversionNotes[`${sourceFormat}-${targetFormat}`]} Text is converted; layout, images and tables are not preserved.
          </p>
        )}

        {/* Error Message */}
        {error && (
          <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {downloadUrl && (
          <div role="status" className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm mb-3">Document converted successfully.</p>
            <a
              href={downloadUrl}
              download={filename}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors break-all"
            >
              Download {filename}
            </a>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={convertDocument}
            disabled={isProcessing || !selectedFile}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Converting…' : 'Convert document'}
          </button>
          <button
            type="button"
            onClick={reset}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Reset
          </button>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          Your file is uploaded to our server for conversion, and the converted file is saved there so you can download it. Please
          do not upload confidential documents.
        </p>
      </div>
    </div>
  );
}
