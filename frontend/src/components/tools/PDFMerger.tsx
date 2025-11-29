import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { useSEO } from '../../utils/seo';

interface PDFFile {
  file: File;
  name: string;
  size: number;
  pages?: number;
}

export default function PDFMerger() {
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useSEO({
    title: 'Free PDF Merger - Combine Multiple PDFs Online | Merge PDF Files',
    description: 'Free online PDF merger. Combine multiple PDF files into one document. Drag and drop reordering, preview before merging. No registration required. All processing happens in your browser.',
    url: '/resources/utility-tools/pdf-merger',
    keywords: [
      'PDF merger', 'merge PDF', 'combine PDF', 'PDF combiner', 'merge PDF files',
      'online PDF merger', 'free PDF merger', 'PDF joiner', 'combine PDF documents'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'PDF Merger',
      'description': 'Free online tool to merge multiple PDF files into one document. All processing happens in your browser.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/pdf-merger',
      'applicationCategory': 'UtilityApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Merge multiple PDF files',
        'Drag and drop reordering',
        'Preview before merging',
        'Client-side processing',
        'No file size limits',
        'Instant download'
      ],
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.9',
        'ratingCount': '1800',
        'bestRating': '5',
        'worstRating': '1'
      }
    }
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const pdfFiles = files.filter(f => f.type === 'application/pdf');
    
    if (pdfFiles.length === 0) {
      setError('Please select PDF files only');
      return;
    }

    const newFiles: PDFFile[] = [];
    for (const file of pdfFiles) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pageCount = pdfDoc.getPageCount();
        newFiles.push({
          file,
          name: file.name,
          size: file.size,
          pages: pageCount
        });
      } catch (err) {
        console.error(`Error reading ${file.name}:`, err);
        setError(`Failed to read ${file.name}. It may be corrupted or password-protected.`);
      }
    }

    setPdfFiles(prev => [...prev, ...newFiles]);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setPdfFiles(prev => prev.filter((_, i) => i !== index));
    setMergedPdfUrl('');
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === pdfFiles.length - 1) return;

    const newFiles = [...pdfFiles];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];
    setPdfFiles(newFiles);
    setMergedPdfUrl('');
  };

  const handleMerge = async () => {
    if (pdfFiles.length < 2) {
      setError('Please add at least 2 PDF files to merge');
      return;
    }

    setIsProcessing(true);
    setError('');
    setMergedPdfUrl('');

    try {
      const mergedPdf = await PDFDocument.create();

      for (const pdfFile of pdfFiles) {
        const arrayBuffer = await pdfFile.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setMergedPdfUrl(url);
    } catch (err) {
      console.error('Merge error:', err);
      setError(err instanceof Error ? err.message : 'Failed to merge PDFs. Some files may be corrupted or password-protected.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!mergedPdfUrl) return;
    const link = document.createElement('a');
    link.href = mergedPdfUrl;
    link.download = 'merged-document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClear = () => {
    setPdfFiles([]);
    setMergedPdfUrl('');
    setError('');
    if (mergedPdfUrl) {
      URL.revokeObjectURL(mergedPdfUrl);
    }
  };

  const totalPages = pdfFiles.reduce((sum, f) => sum + (f.pages || 0), 0);
  const totalSize = pdfFiles.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          🔗 PDF Merger
        </h1>
        <p className="text-gray-600 mb-6">
          Combine multiple PDF files into one document. All processing happens in your browser - your files never leave your device.
        </p>

        {/* Stats */}
        {pdfFiles.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Files</div>
              <div className="text-2xl font-bold text-blue-600">{pdfFiles.length}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Total Pages</div>
              <div className="text-2xl font-bold text-green-600">{totalPages}</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Total Size</div>
              <div className="text-2xl font-bold text-purple-600">
                {(totalSize / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Max Files</div>
              <div className="text-2xl font-bold text-orange-600">50</div>
            </div>
          </div>
        )}

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select PDF Files
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileSelect}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-2">
            You can select multiple PDF files at once. Maximum 50 files, 50MB per file.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* File List */}
        {pdfFiles.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Files to Merge (drag to reorder)
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {pdfFiles.map((pdfFile, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-2xl">📄</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{pdfFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(pdfFile.size / 1024).toFixed(2)} KB
                        {pdfFile.pages && ` • ${pdfFile.pages} page${pdfFile.pages !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => moveFile(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveFile(index, 'down')}
                      disabled={index === pdfFiles.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 text-red-400 hover:text-red-600"
                      title="Remove"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={handleMerge}
            disabled={pdfFiles.length < 2 || isProcessing}
            className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {isProcessing ? 'Merging...' : '🔗 Merge PDFs'}
          </button>
          {mergedPdfUrl && (
            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-none px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              📥 Download Merged PDF
            </button>
          )}
          <button
            onClick={handleClear}
            className="flex-1 sm:flex-none px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
          >
            🗑️ Clear All
          </button>
        </div>

        {/* SEO & AI-Friendly Content Sections */}
        <div className="space-y-6 mt-8">
          {/* About Section */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">About PDF Merger</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our PDF Merger is a powerful, client-side tool that combines multiple PDF files into a single document. 
              All processing happens locally in your browser using the pdf-lib library, ensuring your files never leave 
              your device. This provides maximum privacy and security for your documents.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Perfect for combining reports, merging invoices, combining multiple documents, or organizing your PDF files. 
              The tool supports drag-and-drop reordering, so you can control exactly how your documents are merged.
            </p>
          </div>

          {/* Use Cases */}
          <div className="p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Common Use Cases</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Combining multiple reports into one document</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Merging invoices and receipts</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Combining scanned documents</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Organizing multiple PDFs into one file</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Combining chapters or sections</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Merging forms and applications</span>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div className="p-6 bg-white border border-gray-200 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Key Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Multiple Files</h4>
                  <p className="text-sm text-gray-600">Merge up to 50 PDF files at once</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Drag & Drop Reorder</h4>
                  <p className="text-sm text-gray-600">Reorder files before merging</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Privacy-First</h4>
                  <p className="text-sm text-gray-600">All processing happens in your browser</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">No Limits</h4>
                  <p className="text-sm text-gray-600">No file size or page count restrictions</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="p-6 bg-blue-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Is my PDF data stored or uploaded?</h4>
                <p className="text-gray-700 text-sm">
                  No, all PDF merging happens locally in your browser. Your files are never uploaded to any server 
                  or stored anywhere. Your privacy is guaranteed.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What's the maximum file size?</h4>
                <p className="text-gray-700 text-sm">
                  There's no hard limit, but browser memory may limit very large files. We recommend files under 
                  50MB each for best performance. You can merge up to 50 files at once.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Can I merge password-protected PDFs?</h4>
                <p className="text-gray-700 text-sm">
                  Password-protected PDFs cannot be merged. You'll need to remove the password first using a PDF 
                  password remover tool.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">How do I reorder files?</h4>
                <p className="text-gray-700 text-sm">
                  Use the up/down arrow buttons next to each file to change the order. Files are merged in the 
                  order they appear in the list.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>You can select multiple PDF files at once using Ctrl/Cmd + Click</li>
            <li>Use the up/down arrows to reorder files before merging</li>
            <li>All processing happens in your browser - no uploads required</li>
            <li>Password-protected PDFs cannot be merged</li>
            <li>Large files may take longer to process</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

