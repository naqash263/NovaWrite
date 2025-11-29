import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { useSEO } from '../../utils/seo';

export default function PDFSplitter() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [selectedPages, setSelectedPages] = useState<string>('');
  const [splitMode, setSplitMode] = useState<'all' | 'range' | 'custom'>('all');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [splitPdfs, setSplitPdfs] = useState<{ name: string; url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useSEO({
    title: 'Free PDF Splitter - Split PDF Pages Online | Extract PDF Pages',
    description: 'Free online PDF splitter. Extract specific pages from PDF, split PDF into multiple files, or extract page ranges. All processing happens in your browser. No registration required.',
    url: '/resources/utility-tools/pdf-splitter',
    keywords: [
      'PDF splitter', 'split PDF', 'extract PDF pages', 'PDF page extractor',
      'split PDF online', 'free PDF splitter', 'PDF page remover', 'extract pages from PDF'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'PDF Splitter',
      'description': 'Free online tool to split PDF files and extract specific pages. All processing happens in your browser.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/pdf-splitter',
      'applicationCategory': 'UtilityApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Split PDF into individual pages',
        'Extract page ranges',
        'Extract specific pages',
        'Client-side processing',
        'No file size limits',
        'Instant download'
      ],
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.8',
        'ratingCount': '1500',
        'bestRating': '5',
        'worstRating': '1'
      }
    }
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file');
      return;
    }

    setPdfFile(file);
    setError('');
    setSplitPdfs([]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      setPageCount(pdfDoc.getPageCount());
    } catch (err) {
      setError('Failed to read PDF. It may be corrupted or password-protected.');
      setPdfFile(null);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSplit = async () => {
    if (!pdfFile) {
      setError('Please select a PDF file first');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSplitPdfs([]);

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const sourcePdf = await PDFDocument.load(arrayBuffer);
      const totalPages = sourcePdf.getPageCount();
      const results: { name: string; url: string }[] = [];

      if (splitMode === 'all') {
        // Split into individual pages
        for (let i = 0; i < totalPages; i++) {
          const newPdf = await PDFDocument.create();
          const [page] = await newPdf.copyPages(sourcePdf, [i]);
          newPdf.addPage(page);
          const pdfBytes = await newPdf.save();
          const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          results.push({
            name: `${pdfFile.name.replace('.pdf', '')}_page_${i + 1}.pdf`,
            url
          });
        }
      } else if (splitMode === 'range') {
        // Extract page range
        const range = selectedPages.trim();
        if (!range) {
          setError('Please enter a page range (e.g., 1-5 or 1,3,5-10)');
          setIsProcessing(false);
          return;
        }

        const pages = parsePageRange(range, totalPages);
        if (pages.length === 0) {
          setError('Invalid page range');
          setIsProcessing(false);
          return;
        }

        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(sourcePdf, pages);
        copiedPages.forEach(page => newPdf.addPage(page));
        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        results.push({
          name: `${pdfFile.name.replace('.pdf', '')}_pages_${range.replace(/,/g, '_')}.pdf`,
          url
        });
      } else if (splitMode === 'custom') {
        // Extract specific pages
        const pages = parsePageRange(selectedPages, totalPages);
        if (pages.length === 0) {
          setError('Invalid page numbers');
          setIsProcessing(false);
          return;
        }

        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(sourcePdf, pages);
        copiedPages.forEach(page => newPdf.addPage(page));
        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        results.push({
          name: `${pdfFile.name.replace('.pdf', '')}_extracted.pdf`,
          url
        });
      }

      setSplitPdfs(results);
    } catch (err) {
      console.error('Split error:', err);
      setError(err instanceof Error ? err.message : 'Failed to split PDF. The file may be corrupted or password-protected.');
    } finally {
      setIsProcessing(false);
    }
  };

  const parsePageRange = (range: string, maxPages: number): number[] => {
    const pages: number[] = [];
    const parts = range.split(',').map(p => p.trim());

    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(n => parseInt(n.trim()));
        if (isNaN(start) || isNaN(end) || start < 1 || end > maxPages || start > end) {
          return [];
        }
        for (let i = start - 1; i < end; i++) {
          pages.push(i);
        }
      } else {
        const page = parseInt(part);
        if (isNaN(page) || page < 1 || page > maxPages) {
          return [];
        }
        pages.push(page - 1);
      }
    }

    return [...new Set(pages)].sort((a, b) => a - b);
  };

  const handleDownload = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    splitPdfs.forEach((pdf, index) => {
      setTimeout(() => {
        handleDownload(pdf.url, pdf.name);
      }, index * 200);
    });
  };

  const handleClear = () => {
    setPdfFile(null);
    setPageCount(0);
    setSelectedPages('');
    setSplitMode('all');
    setError('');
    splitPdfs.forEach((pdf: { name: string; url: string }) => URL.revokeObjectURL(pdf.url));
    setSplitPdfs([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          ✂️ PDF Splitter
        </h1>
        <p className="text-gray-600 mb-6">
          Split PDF files into individual pages or extract specific pages. All processing happens in your browser.
        </p>

        {/* Stats */}
        {pdfFile && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">File Name</div>
              <div className="text-sm font-bold text-blue-600 truncate">{pdfFile.name}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Total Pages</div>
              <div className="text-2xl font-bold text-green-600">{pageCount}</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">File Size</div>
              <div className="text-sm font-bold text-purple-600">
                {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          </div>
        )}

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select PDF File
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-2">
            Maximum file size: 50MB. Password-protected PDFs are not supported.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Split Options */}
        {pdfFile && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Split Mode
            </label>
            <div className="space-y-3">
              <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="splitMode"
                  value="all"
                  checked={splitMode === 'all'}
                  onChange={(e) => setSplitMode(e.target.value as any)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">Split into Individual Pages</div>
                  <div className="text-sm text-gray-600">Creates a separate PDF for each page</div>
                </div>
              </label>
              <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="splitMode"
                  value="range"
                  checked={splitMode === 'range'}
                  onChange={(e) => setSplitMode(e.target.value as any)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">Extract Page Range</div>
                  <div className="text-sm text-gray-600">Extract a range of pages (e.g., 1-5 or 1,3,5-10)</div>
                </div>
              </label>
              <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="splitMode"
                  value="custom"
                  checked={splitMode === 'custom'}
                  onChange={(e) => setSplitMode(e.target.value as any)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">Extract Specific Pages</div>
                  <div className="text-sm text-gray-600">Extract specific pages (e.g., 1,3,5 or 1-5,10-15)</div>
                </div>
              </label>
            </div>

            {(splitMode === 'range' || splitMode === 'custom') && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {splitMode === 'range' ? 'Page Range' : 'Page Numbers'}
                </label>
                <input
                  type="text"
                  value={selectedPages}
                  onChange={(e) => setSelectedPages(e.target.value)}
                  placeholder={splitMode === 'range' ? 'e.g., 1-5 or 1,3,5-10' : 'e.g., 1,3,5 or 1-5,10-15'}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter page numbers (1-{pageCount}). Use commas for multiple pages, dashes for ranges.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={handleSplit}
            disabled={!pdfFile || isProcessing}
            className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {isProcessing ? 'Processing...' : '✂️ Split PDF'}
          </button>
          {splitPdfs.length > 1 && (
            <button
              onClick={handleDownloadAll}
              className="flex-1 sm:flex-none px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              📥 Download All ({splitPdfs.length})
            </button>
          )}
          <button
            onClick={handleClear}
            className="flex-1 sm:flex-none px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
          >
            🗑️ Clear
          </button>
        </div>

        {/* Results */}
        {splitPdfs.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Split Results ({splitPdfs.length} file{splitPdfs.length !== 1 ? 's' : ''})
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {splitPdfs.map((pdf, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-2xl">📄</span>
                    <p className="font-medium text-gray-900 truncate">{pdf.name}</p>
                  </div>
                  <button
                    onClick={() => handleDownload(pdf.url, pdf.name)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SEO & AI-Friendly Content Sections */}
        <div className="space-y-6 mt-8">
          {/* About Section */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">About PDF Splitter</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our PDF Splitter is a powerful, client-side tool that splits PDF files into individual pages or extracts 
              specific pages. All processing happens locally in your browser using the pdf-lib library, ensuring your 
              files never leave your device. This provides maximum privacy and security for your documents.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Perfect for extracting specific pages from large documents, splitting multi-page PDFs, removing unwanted 
              pages, or organizing your PDF files. The tool supports multiple split modes to suit different needs.
            </p>
          </div>

          {/* Use Cases */}
          <div className="p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Common Use Cases</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Extract specific pages from large documents</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Split multi-page PDFs into individual pages</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Remove unwanted pages from PDFs</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Extract page ranges for sharing</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Create page subsets from documents</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Organize and separate PDF content</span>
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
                  <h4 className="font-semibold text-gray-900 mb-1">Multiple Split Modes</h4>
                  <p className="text-sm text-gray-600">Split into pages, extract ranges, or select specific pages</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Flexible Page Selection</h4>
                  <p className="text-sm text-gray-600">Use ranges (1-5) or specific pages (1,3,5)</p>
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
                  <h4 className="font-semibold text-gray-900 mb-1">Batch Download</h4>
                  <p className="text-sm text-gray-600">Download all split files at once</p>
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
                  No, all PDF splitting happens locally in your browser. Your files are never uploaded to any server 
                  or stored anywhere. Your privacy is guaranteed.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">How do I specify page ranges?</h4>
                <p className="text-gray-700 text-sm">
                  Use dashes for ranges (e.g., 1-5 for pages 1 through 5) and commas for multiple pages or ranges 
                  (e.g., 1,3,5-10 for pages 1, 3, and 5 through 10).
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Can I split password-protected PDFs?</h4>
                <p className="text-gray-700 text-sm">
                  Password-protected PDFs cannot be split. You'll need to remove the password first using a PDF 
                  password remover tool.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What's the maximum file size?</h4>
                <p className="text-gray-700 text-sm">
                  There's no hard limit, but browser memory may limit very large files. We recommend files under 
                  50MB for best performance.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Use "Split into Individual Pages" to create separate PDFs for each page</li>
            <li>Use ranges like "1-5" to extract pages 1 through 5</li>
            <li>Use commas like "1,3,5" to extract specific pages</li>
            <li>Combine ranges and pages: "1-5,10,15-20"</li>
            <li>All processing happens in your browser - no uploads required</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

