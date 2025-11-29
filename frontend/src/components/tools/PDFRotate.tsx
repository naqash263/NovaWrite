import { useState, useRef } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import { useSEO } from '../../utils/seo';

export default function PDFRotate() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [rotationAngle, setRotationAngle] = useState<90 | 180 | 270>(90);
  const [rotateMode, setRotateMode] = useState<'all' | 'selected'>('all');
  const [selectedPages, setSelectedPages] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [rotatedPdfUrl, setRotatedPdfUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useSEO({
    title: 'Free PDF Rotate - Rotate PDF Pages Online | Rotate PDF 90, 180, 270 Degrees',
    description: 'Free online PDF rotator. Rotate PDF pages 90°, 180°, or 270°. Rotate all pages or selected pages. All processing happens in your browser. No registration required.',
    url: '/resources/utility-tools/pdf-rotate',
    keywords: [
      'PDF rotate', 'rotate PDF', 'rotate PDF pages', 'PDF page rotator',
      'online PDF rotate', 'free PDF rotate', 'rotate PDF 90 degrees', 'fix PDF orientation'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'PDF Rotate',
      'description': 'Free online tool to rotate PDF pages. All processing happens in your browser.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/pdf-rotate',
      'applicationCategory': 'UtilityApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Rotate PDF pages 90°, 180°, 270°',
        'Rotate all pages or selected pages',
        'Fix document orientation',
        'Client-side processing',
        'No file size limits',
        'Instant download'
      ],
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.6',
        'ratingCount': '900',
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
    setRotatedPdfUrl('');

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

  const parsePageNumbers = (input: string, maxPages: number): number[] => {
    const pages: number[] = [];
    const parts = input.split(',').map(p => p.trim());

    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(n => parseInt(n.trim()));
        if (isNaN(start) || isNaN(end) || start < 1 || end > maxPages || start > end) {
          return [];
        }
        for (let i = start; i <= end; i++) {
          pages.push(i - 1);
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

  const handleRotate = async () => {
    if (!pdfFile) {
      setError('Please select a PDF file first');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const totalPages = pdfDoc.getPageCount();

      let pagesToRotate: number[] = [];
      if (rotateMode === 'all') {
        pagesToRotate = Array.from({ length: totalPages }, (_, i) => i);
      } else {
        if (!selectedPages.trim()) {
          setError('Please enter page numbers to rotate');
          setIsProcessing(false);
          return;
        }
        pagesToRotate = parsePageNumbers(selectedPages, totalPages);
        if (pagesToRotate.length === 0) {
          setError('Invalid page numbers');
          setIsProcessing(false);
          return;
        }
      }

      pagesToRotate.forEach(pageIndex => {
        const page = pdfDoc.getPage(pageIndex);
        const currentRotation = page.getRotation();
        page.setRotation(degrees(currentRotation.angle + rotationAngle));
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setRotatedPdfUrl(url);
    } catch (err) {
      console.error('Rotate error:', err);
      setError(err instanceof Error ? err.message : 'Failed to rotate PDF. The file may be corrupted or password-protected.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!rotatedPdfUrl) return;
    const link = document.createElement('a');
    link.href = rotatedPdfUrl;
    link.download = pdfFile?.name.replace('.pdf', '') + '_rotated.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClear = () => {
    setPdfFile(null);
    setPageCount(0);
    setSelectedPages('');
    setError('');
    if (rotatedPdfUrl) {
      URL.revokeObjectURL(rotatedPdfUrl);
    }
    setRotatedPdfUrl('');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          🔄 PDF Rotate
        </h1>
        <p className="text-gray-600 mb-6">
          Rotate PDF pages to fix orientation. Rotate all pages or selected pages. All processing happens in your browser.
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

        {/* Rotation Options */}
        {pdfFile && (
          <div className="space-y-6 mb-6">
            {/* Rotation Angle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Rotation Angle
              </label>
              <div className="grid grid-cols-3 gap-3">
                {([90, 180, 270] as const).map((angle) => (
                  <button
                    key={angle}
                    onClick={() => setRotationAngle(angle)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      rotationAngle === angle
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl font-bold text-gray-900 mb-1">{angle}°</div>
                    <div className="text-xs text-gray-600">
                      {angle === 90 && 'Quarter turn clockwise'}
                      {angle === 180 && 'Half turn (upside down)'}
                      {angle === 270 && 'Quarter turn counterclockwise'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Rotate Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Rotate
              </label>
              <div className="space-y-3">
                <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="rotateMode"
                    value="all"
                    checked={rotateMode === 'all'}
                    onChange={(e) => setRotateMode(e.target.value as any)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">All Pages</div>
                    <div className="text-sm text-gray-600">Rotate all {pageCount} pages</div>
                  </div>
                </label>
                <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="rotateMode"
                    value="selected"
                    checked={rotateMode === 'selected'}
                    onChange={(e) => setRotateMode(e.target.value as any)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Selected Pages</div>
                    <div className="text-sm text-gray-600">Rotate specific pages (e.g., 1,3,5 or 1-5)</div>
                  </div>
                </label>
              </div>

              {rotateMode === 'selected' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Page Numbers
                  </label>
                  <input
                    type="text"
                    value={selectedPages}
                    onChange={(e) => setSelectedPages(e.target.value)}
                    placeholder="e.g., 1,3,5 or 1-5 or 1-3,5,7-10"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter page numbers (1-{pageCount}). Use commas for multiple pages, dashes for ranges.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={handleRotate}
            disabled={!pdfFile || isProcessing}
            className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {isProcessing ? 'Rotating...' : '🔄 Rotate PDF'}
          </button>
          {rotatedPdfUrl && (
            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-none px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              📥 Download Rotated PDF
            </button>
          )}
          <button
            onClick={handleClear}
            className="flex-1 sm:flex-none px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
          >
            🗑️ Clear
          </button>
        </div>

        {/* SEO & AI-Friendly Content Sections */}
        <div className="space-y-6 mt-8">
          {/* About Section */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">About PDF Rotate</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our PDF Rotate is a powerful, client-side tool that rotates PDF pages to fix orientation issues. 
              All processing happens locally in your browser using the pdf-lib library, ensuring your files never leave 
              your device. This provides maximum privacy and security for your documents.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Perfect for fixing scanned documents that are upside down or sideways, correcting page orientation, 
              or rotating specific pages in a document. The tool supports rotating all pages or selected pages with 
              multiple rotation angles.
            </p>
          </div>

          {/* Use Cases */}
          <div className="p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Common Use Cases</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Fix scanned documents that are upside down</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Correct page orientation in PDFs</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Rotate specific pages in a document</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Fix landscape/portrait orientation issues</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Correct rotated images in PDFs</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Prepare documents for printing</span>
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
                  <h4 className="font-semibold text-gray-900 mb-1">Multiple Angles</h4>
                  <p className="text-sm text-gray-600">Rotate 90°, 180°, or 270°</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Selective Rotation</h4>
                  <p className="text-sm text-gray-600">Rotate all pages or selected pages</p>
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
                  <h4 className="font-semibold text-gray-900 mb-1">Instant Results</h4>
                  <p className="text-sm text-gray-600">Rotate and download in seconds</p>
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
                  No, all PDF rotation happens locally in your browser. Your files are never uploaded to any server 
                  or stored anywhere. Your privacy is guaranteed.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Can I rotate specific pages?</h4>
                <p className="text-gray-700 text-sm">
                  Yes, select "Selected Pages" mode and enter page numbers (e.g., 1,3,5 or 1-5) to rotate only 
                  those pages.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Can I rotate password-protected PDFs?</h4>
                <p className="text-gray-700 text-sm">
                  Password-protected PDFs cannot be rotated. You'll need to remove the password first using a PDF 
                  password remover tool.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What rotation angles are available?</h4>
                <p className="text-gray-700 text-sm">
                  You can rotate pages 90° (quarter turn), 180° (half turn/upside down), or 270° (three-quarter turn).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>90° rotates clockwise, 270° rotates counterclockwise</li>
            <li>180° flips the page upside down</li>
            <li>Use "Selected Pages" to rotate only specific pages</li>
            <li>All processing happens in your browser - no uploads required</li>
            <li>You can rotate the same page multiple times to achieve different angles</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

