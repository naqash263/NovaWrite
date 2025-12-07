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
    title: 'Free Document Converter Word PDF - Convert Word to PDF Online | No Signup',
    description: 'Free document converter word pdf - no signup required. Convert Word to PDF, PDF to Word, DOCX to PDF, PDF to DOCX instantly. Secure server-side processing, download converted files. Perfect for document management.',
    url: '/resources/utility-tools/document-converter',
    keywords: [
      'free document converter word pdf', 'document converter', 'free document converter', 'document converter word pdf', 'word to pdf converter',
      'word to pdf', 'pdf to word', 'docx to pdf', 'pdf to docx',
      'word converter', 'pdf converter', 'document format converter', 'online document converter',
      'docx converter', 'file converter', 'free online document converter'
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Free Document Converter Word PDF</h1>
        <p className="text-gray-600 mb-6">
          Free document converter word pdf - no signup required. Convert Word to PDF, PDF to Word, DOCX to PDF, PDF to DOCX instantly. Secure server-side processing, download converted files. Perfect for document management and sharing.
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
            <div>✅ TXT → PDF</div>
          </div>
        </div>
      </div>

      {/* SEO Content */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">About Document Converter</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 mb-4">
            Document Converter is a free, secure online tool that converts documents between PDF, Word (DOCX), 
            and TXT formats. All conversions happen securely on our server with no file size limits for most conversions. 
            Perfect for professionals, students, and anyone who needs to convert documents between different formats.
          </p>
          
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Supported Formats</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>PDF (Portable Document Format):</strong> Industry-standard format for document sharing and archiving. Supports text extraction and conversion to Word or TXT formats.</li>
            <li><strong>DOCX (Microsoft Word Document):</strong> Modern Word document format (2007+). Supports conversion to PDF, TXT, and other formats while preserving text content.</li>
            <li><strong>DOC (Legacy Word Document):</strong> Older Word document format. Automatically converted to DOCX for processing.</li>
            <li><strong>TXT (Plain Text):</strong> Simple text files without formatting. Can be converted to Word documents or PDFs with proper formatting.</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Complete Conversion Matrix</h3>
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left">From</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">To</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">PDF</td>
                  <td className="border border-gray-300 px-4 py-2">Word (DOCX)</td>
                  <td className="border border-gray-300 px-4 py-2 text-green-600">✅ Supported</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">PDF</td>
                  <td className="border border-gray-300 px-4 py-2">TXT</td>
                  <td className="border border-gray-300 px-4 py-2 text-green-600">✅ Supported</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Word (DOCX)</td>
                  <td className="border border-gray-300 px-4 py-2">PDF</td>
                  <td className="border border-gray-300 px-4 py-2 text-green-600">✅ Supported</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Word (DOCX)</td>
                  <td className="border border-gray-300 px-4 py-2">TXT</td>
                  <td className="border border-gray-300 px-4 py-2 text-green-600">✅ Supported</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">TXT</td>
                  <td className="border border-gray-300 px-4 py-2">Word (DOCX)</td>
                  <td className="border border-gray-300 px-4 py-2 text-green-600">✅ Supported</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">TXT</td>
                  <td className="border border-gray-300 px-4 py-2">PDF</td>
                  <td className="border border-gray-300 px-4 py-2 text-green-600">✅ Supported</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Key Features</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>Secure Server-Side Processing:</strong> All conversions happen on our secure servers. Files are automatically deleted after processing for your privacy.</li>
            <li><strong>High-Quality Conversions:</strong> Advanced algorithms ensure text extraction and formatting preservation where possible.</li>
            <li><strong>Fast Processing:</strong> Most conversions complete in seconds, even for large documents.</li>
            <li><strong>No Registration Required:</strong> Start converting documents immediately without creating an account.</li>
            <li><strong>Multiple Format Support:</strong> Convert between PDF, Word, and TXT formats seamlessly.</li>
            <li><strong>Instant Downloads:</strong> Download converted files immediately after processing.</li>
            <li><strong>Automatic Format Detection:</strong> Our system automatically detects the input file format.</li>
            <li><strong>Error Handling:</strong> Clear error messages help you understand and resolve any conversion issues.</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Use Cases</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>Document Editing:</strong> Convert PDFs to Word documents for easy editing and formatting changes.</li>
            <li><strong>Document Sharing:</strong> Convert Word documents to PDF for universal compatibility and professional presentation.</li>
            <li><strong>Text Extraction:</strong> Extract text from PDFs and Word documents for use in other applications or analysis.</li>
            <li><strong>Format Migration:</strong> Migrate documents between different formats for compatibility with various software.</li>
            <li><strong>Content Repurposing:</strong> Convert documents to different formats for use in presentations, websites, or other media.</li>
            <li><strong>Archival:</strong> Convert documents to PDF for long-term archival and preservation.</li>
            <li><strong>Accessibility:</strong> Convert documents to TXT format for screen readers and accessibility tools.</li>
            <li><strong>Data Processing:</strong> Extract text from documents for data analysis, text mining, or natural language processing.</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">How It Works</h3>
          <ol className="list-decimal list-inside text-gray-700 space-y-2">
            <li><strong>Upload Your Document:</strong> Select a PDF, Word (DOCX/DOC), or TXT file from your device.</li>
            <li><strong>Select Target Format:</strong> Choose the format you want to convert your document to (PDF, DOCX, or TXT).</li>
            <li><strong>Automatic Processing:</strong> Our server processes your document using advanced conversion algorithms.</li>
            <li><strong>Download Result:</strong> Download your converted document instantly. Files are automatically deleted from our servers after processing.</li>
          </ol>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Privacy & Security</h3>
          <p className="text-gray-700 mb-2">
            Your privacy is our priority. All document conversions are processed securely on our servers, and files are automatically 
            deleted immediately after processing. We do not store, share, or access your documents beyond the conversion process.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Is the Document Converter free to use?</h4>
              <p className="text-gray-700">Yes, our Document Converter is completely free to use. No registration, no hidden fees, no limits on the number of conversions.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">What file sizes are supported?</h4>
              <p className="text-gray-700">We support files up to 10MB in size. For larger files, consider splitting them into smaller parts or using specialized software.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Are my documents secure?</h4>
              <p className="text-gray-700">Yes, all conversions happen on secure servers, and files are automatically deleted immediately after processing. We never store or access your documents.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Can I convert scanned PDFs?</h4>
              <p className="text-gray-700">Our converter works best with text-based PDFs. Scanned PDFs (image-based) may require OCR (Optical Character Recognition) for text extraction.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Will formatting be preserved?</h4>
              <p className="text-gray-700">Text content is preserved, but complex formatting (images, tables, advanced layouts) may not be fully preserved in all conversions. Simple text formatting is generally maintained.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">What if my conversion fails?</h4>
              <p className="text-gray-700">If a conversion fails, you'll receive a clear error message. Common issues include corrupted files, unsupported formats, or files that are too large. Try a different file or format if needed.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

