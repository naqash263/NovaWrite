import { useEffect, useRef, useState } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';

type RotateMode = 'all' | 'odd' | 'even' | 'selected';
type Angle = 90 | 180 | 270;

const isPdf = (file: File) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name);

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : `${(bytes / 1024).toFixed(1)} KB`;

/** Parses "1-3, 5, 8-" into sorted, unique zero-based page indices or returns an error message. */
function parsePageNumbers(input: string, maxPages: number): number[] | string {
  const parts = input
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return 'Enter the pages to rotate, for example 1, 3-5.';
  const pages: number[] = [];
  for (const part of parts) {
    const match = part.match(/^(\d+)\s*(?:[-–]\s*(\d*))?$/);
    if (!match) return `"${part}" is not a valid page or range. Use numbers like 3 or ranges like 2-5.`;
    const start = parseInt(match[1], 10);
    const isRange = /[-–]/.test(part);
    const end = isRange ? (match[2] ? parseInt(match[2], 10) : maxPages) : start;
    if (start < 1 || end < 1) return 'Page numbers start at 1.';
    if (start > maxPages || end > maxPages) return `This PDF has ${maxPages} page${maxPages !== 1 ? 's' : ''}. "${part}" is out of range.`;
    if (start > end) return `"${part}" is reversed. Write the lower page number first.`;
    for (let i = start; i <= end; i++) pages.push(i - 1);
  }
  return [...new Set(pages)].sort((a, b) => a - b);
}

const angleOptions: { value: Angle; label: string; text: string }[] = [
  { value: 90, label: '90° right', text: 'Quarter turn clockwise' },
  { value: 180, label: '180°', text: 'Upside down' },
  { value: 270, label: '90° left', text: 'Quarter turn counter-clockwise' },
];

export default function PDFRotate() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [rotationAngle, setRotationAngle] = useState<Angle>(90);
  const [rotateMode, setRotateMode] = useState<RotateMode>('all');
  const [selectedPages, setSelectedPages] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [rotatedPdfUrl, setRotatedPdfUrl] = useState('');
  const [resultText, setResultText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (rotatedPdfUrl) URL.revokeObjectURL(rotatedPdfUrl);
    };
  }, [rotatedPdfUrl]);

  // Any option change invalidates the previous result.
  const invalidate = () => {
    setRotatedPdfUrl('');
    setResultText('');
  };

  const loadFile = async (file: File | undefined) => {
    if (!file) return;
    if (!isPdf(file)) {
      setError(`${file.name} is not a PDF file. Please choose a .pdf file.`);
      return;
    }
    setError('');
    setRotatedPdfUrl('');
    setResultText('');
    try {
      const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
      setPdfFile(file);
      setPageCount(pdfDoc.getPageCount());
    } catch {
      setError(`Could not read ${file.name}. It may be corrupted or password-protected.`);
      setPdfFile(null);
      setPageCount(0);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRotate = async () => {
    if (!pdfFile) {
      setError('Please select a PDF file first.');
      return;
    }

    let pagesToRotate: number[];
    const every = Array.from({ length: pageCount }, (_, i) => i);
    if (rotateMode === 'all') pagesToRotate = every;
    else if (rotateMode === 'odd') pagesToRotate = every.filter((i) => i % 2 === 0);
    else if (rotateMode === 'even') pagesToRotate = every.filter((i) => i % 2 === 1);
    else {
      const parsed = parsePageNumbers(selectedPages, pageCount);
      if (typeof parsed === 'string') {
        setError(parsed);
        return;
      }
      pagesToRotate = parsed;
    }
    if (pagesToRotate.length === 0) {
      setError('There are no pages that match this selection.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const pdfDoc = await PDFDocument.load(await pdfFile.arrayBuffer());
      pagesToRotate.forEach((pageIndex) => {
        const page = pdfDoc.getPage(pageIndex);
        const next = (((page.getRotation().angle + rotationAngle) % 360) + 360) % 360;
        page.setRotation(degrees(next));
      });
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      setRotatedPdfUrl(URL.createObjectURL(blob));
      const label = angleOptions.find((a) => a.value === rotationAngle)?.label ?? `${rotationAngle}°`;
      setResultText(`Rotated ${pagesToRotate.length} of ${pageCount} page${pageCount !== 1 ? 's' : ''} by ${label}.`);
    } catch (err) {
      console.error('Rotate error:', err);
      setError('Failed to rotate the PDF. The file may be corrupted or password-protected.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!rotatedPdfUrl || !pdfFile) return;
    const link = document.createElement('a');
    link.href = rotatedPdfUrl;
    link.download = `${pdfFile.name.replace(/\.pdf$/i, '')}_rotated.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClear = () => {
    setPdfFile(null);
    setPageCount(0);
    setSelectedPages('');
    setRotateMode('all');
    setError('');
    setRotatedPdfUrl('');
    setResultText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const modes: { value: RotateMode; title: string }[] = [
    { value: 'all', title: `All pages${pageCount ? ` (${pageCount})` : ''}` },
    { value: 'odd', title: 'Odd pages (1, 3, 5…)' },
    { value: 'even', title: 'Even pages (2, 4, 6…)' },
    { value: 'selected', title: 'Specific pages' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8">
        {/* Stats */}
        {pdfFile && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-blue-50 p-3 rounded-lg min-w-0">
              <div className="text-sm text-gray-600">File</div>
              <div className="text-sm font-bold text-blue-600 truncate">{pdfFile.name}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Pages</div>
              <div className="text-2xl font-bold text-green-600">{pageCount}</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Size</div>
              <div className="text-sm font-bold text-purple-600">{formatSize(pdfFile.size)}</div>
            </div>
          </div>
        )}

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
            void loadFile(e.dataTransfer.files?.[0]);
          }}
        >
          <label htmlFor="pdf-rotate-input" className="block text-sm font-medium text-gray-700 mb-2">
            Select a PDF file (or drop it here)
          </label>
          <input
            id="pdf-rotate-input"
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => void loadFile(e.target.files?.[0])}
            className="w-full min-w-0 p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-2">Password-protected PDFs are not supported.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Rotation Options */}
        {pdfFile && (
          <div className="space-y-6 mb-6">
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-3">Rotation</legend>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {angleOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setRotationAngle(opt.value);
                      invalidate();
                    }}
                    aria-pressed={rotationAngle === opt.value}
                    className={`p-3 sm:p-4 rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      rotationAngle === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="block text-lg sm:text-2xl font-bold text-gray-900 mb-1">{opt.label}</span>
                    <span className="block text-xs text-gray-600">{opt.text}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-3">Pages to rotate</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {modes.map((mode) => (
                  <label
                    key={mode.value}
                    className={`flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 ${
                      rotateMode === mode.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="rotateMode"
                      value={mode.value}
                      checked={rotateMode === mode.value}
                      onChange={() => {
                        setRotateMode(mode.value);
                        invalidate();
                      }}
                      className="mr-3"
                    />
                    <span className="font-medium text-gray-900">{mode.title}</span>
                  </label>
                ))}
              </div>

              {rotateMode === 'selected' && (
                <div className="mt-4">
                  <label htmlFor="pdf-rotate-pages" className="block text-sm font-medium text-gray-700 mb-2">
                    Page numbers
                  </label>
                  <input
                    id="pdf-rotate-pages"
                    type="text"
                    inputMode="numeric"
                    value={selectedPages}
                    onChange={(e) => {
                      setSelectedPages(e.target.value);
                      invalidate();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void handleRotate();
                    }}
                    placeholder="e.g. 1, 3-5, 8-"
                    aria-describedby="pdf-rotate-pages-hint"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p id="pdf-rotate-pages-hint" className="text-xs text-gray-500 mt-1">
                    Pages 1–{pageCount}. Separate with commas; use a dash for ranges. “8-” means page 8 to the end.
                  </p>
                </div>
              )}
            </fieldset>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleRotate}
            disabled={!pdfFile || isProcessing}
            className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {isProcessing ? 'Rotating…' : 'Rotate PDF'}
          </button>
          {rotatedPdfUrl && (
            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 sm:flex-none px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              Download rotated PDF
            </button>
          )}
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 sm:flex-none px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
          >
            Clear
          </button>
        </div>

        {resultText && (
          <p role="status" className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800" data-testid="rotate-result">
            {resultText}
          </p>
        )}
      </div>
    </div>
  );
}
