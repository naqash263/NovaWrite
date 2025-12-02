import { useState, useRef } from 'react';
import { useSEO } from '../../utils/seo';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

type DocumentFormat = 'pdf' | 'docx' | 'txt';

export default function DocumentConverter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceFormat, setSourceFormat] = useState<DocumentFormat | null>(null);
  const [targetFormat, setTargetFormat] = useState<DocumentFormat>('pdf');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useSEO({
    title: 'Free Document Converter - Word to PDF, PDF to Word, DOCX Converter Online | Document Format Converter',
    description: 'Free online document converter. Convert Word to PDF, PDF to Word, DOCX to PDF, PDF to DOCX, and more. All conversions happen securely on our server. No registration required.',
    url: '/resources/utility-tools/document-converter',
    keywords: [
      'document converter', 'word to pdf', 'pdf to word', 'docx to pdf', 'pdf to docx',
      'word converter', 'pdf converter', 'document format converter', 'online document converter',
      'free document converter', 'docx converter', 'file converter'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Document Converter',
      'description': 'Free online document converter. Convert Word to PDF, PDF to Word, and more.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/document-converter',
      'applicationCategory': 'UtilityApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Convert Word to PDF',
        'Convert PDF to Word',
        'Convert DOCX to PDF',
        'Convert PDF to DOCX',
        'Convert to TXT',
        'Download converted files'
      ]
    }
  });

  const detectFormat = (filename: string): DocumentFormat | null => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    if (extension === 'pdf') return 'pdf';
    if (extension === 'docx') return 'docx';
    if (extension === 'doc') return 'docx'; // Treat DOC as DOCX
    if (extension === 'txt') return 'txt';
    
    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSelectedFile(file);
    setDownloadUrl('');
    setFilename('');

    const format = detectFormat(file.name);
    if (!format) {
      setError('Unsupported file format. Please upload PDF, DOCX, DOC, or TXT files.');
      return;
    }

    setSourceFormat(format);
    
    // Set default target format
    if (format === 'pdf') {
      setTargetFormat('docx');
    } else if (format === 'docx') {
      setTargetFormat('pdf');
    } else {
      setTargetFormat('docx');
    }
  };

  const convertDocument = async () => {
    if (!selectedFile || !sourceFormat) {
      setError('Please select a file first');
      return;
    }

    if (sourceFormat === targetFormat) {
      setError('Source and target formats are the same. Please select a different target format.');
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
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to convert document');
      }

      if (data.success && data.data) {
        setDownloadUrl(data.data.url);
        setFilename(data.data.filename);
      } else {
        throw new Error(data.message || 'Failed to convert document');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while converting the document');
      setDownloadUrl('');
      setFilename('');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadConverted = () => {
    if (!downloadUrl) return;
    window.open(downloadUrl, '_blank');
  };

  const reset = () => {
    setSelectedFile(null);
    setSourceFormat(null);
    setDownloadUrl('');
    setFilename('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getConversionDescription = () => {
    if (!sourceFormat || !targetFormat) return '';
    
    const conversions: Record<string, string> = {
      'pdf-docx': 'Convert PDF to Word document (DOCX)',
      'docx-pdf': 'Convert Word document (DOCX) to PDF',
      'pdf-txt': 'Extract text from PDF to TXT file',
      'docx-txt': 'Extract text from Word document to TXT file',
      'txt-docx': 'Convert TXT file to Word document (DOCX)',
      'txt-pdf': 'Convert TXT file to PDF',
    };
    
    return conversions[`${sourceFormat}-${targetFormat}`] || 'Convert document';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Converter</h1>
        <p className="text-gray-600 mb-6">
          Convert documents between PDF, Word (DOCX), and TXT formats. Secure server-side processing.
        </p>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Document to Convert
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {sourceFormat && (
            <p className="text-sm text-gray-600 mt-2">
              Detected format: <span className="font-semibold">{sourceFormat.toUpperCase()}</span>
            </p>
          )}
        </div>

        {/* Format Selection */}
        {selectedFile && sourceFormat && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Format
              </label>
              <input
                type="text"
                value={sourceFormat.toUpperCase()}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Format
              </label>
              <select
                value={targetFormat}
                onChange={(e) => setTargetFormat(e.target.value as DocumentFormat)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {sourceFormat !== 'pdf' && <option value="pdf">PDF (Portable Document Format)</option>}
                {sourceFormat !== 'docx' && <option value="docx">DOCX (Word Document)</option>}
                {sourceFormat !== 'txt' && <option value="txt">TXT (Plain Text)</option>}
              </select>
            </div>
          </div>
        )}

        {/* Conversion Description */}
        {selectedFile && sourceFormat && targetFormat && sourceFormat !== targetFormat && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Conversion:</strong> {getConversionDescription()}
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {downloadUrl && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm mb-3">
              ✅ Document converted successfully!
            </p>
            <button
              onClick={downloadConverted}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Download Converted File ({filename})
            </button>
          </div>
        )}

        {/* Action Buttons */}
        {selectedFile && sourceFormat && (
          <div className="flex gap-4">
            <button
              onClick={convertDocument}
              disabled={isProcessing || sourceFormat === targetFormat}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Converting...' : 'Convert Document'}
            </button>
            <button
              onClick={reset}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Reset
            </button>
          </div>
        )}

        {/* Supported Conversions */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Supported Conversions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-700">
            <div>✅ PDF → Word (DOCX)</div>
            <div>✅ Word (DOCX) → PDF</div>
            <div>✅ PDF → TXT</div>
            <div>✅ Word (DOCX) → TXT</div>
            <div>✅ TXT → Word (DOCX)</div>
            <div>⚠️ TXT → PDF (Coming soon)</div>
          </div>
        </div>
      </div>

      {/* SEO Content */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">About Document Converter</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 mb-4">
            Document Converter is a free online tool that converts documents between PDF, Word (DOCX), 
            and TXT formats. All conversions happen securely on our server.
          </p>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Supported Formats</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>PDF:</strong> Portable Document Format</li>
            <li><strong>DOCX:</strong> Microsoft Word Document (2007+)</li>
            <li><strong>DOC:</strong> Microsoft Word Document (legacy - converted to DOCX)</li>
            <li><strong>TXT:</strong> Plain text files</li>
          </ul>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Features</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Convert PDF to Word documents</li>
            <li>Convert Word documents to PDF</li>
            <li>Extract text from PDFs and Word documents</li>
            <li>Convert TXT files to Word documents</li>
            <li>Secure server-side processing</li>
            <li>Download converted files instantly</li>
          </ul>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Use Cases</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Convert PDFs to editable Word documents</li>
            <li>Convert Word documents to PDF for sharing</li>
            <li>Extract text from PDFs for editing</li>
            <li>Convert text files to formatted Word documents</li>
            <li>Prepare documents for different applications</li>
            <li>Migrate documents between formats</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

