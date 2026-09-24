import { useEffect, useRef, useState } from 'react';
import { PDFDocument } from 'pdf-lib';

type SplitMode = 'all' | 'extract' | 'ranges' | 'every';

interface SplitResult {
  name: string;
  url: string;
  pages: number;
}

const isPdf = (file: File) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name);

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : `${(bytes / 1024).toFixed(1)} KB`;

/**
 * Parses "1-3, 5, 8-" into groups of zero-based page indices (one group per comma-separated part).
 * Returns an error message instead when the input is invalid.
 */
function parsePageGroups(input: string, maxPages: number): number[][] | string {
  const parts = input
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return 'Enter at least one page number or range, for example 1-3, 5.';

  const groups: number[][] = [];
  for (const part of parts) {
    const match = part.match(/^(\d+)\s*(?:[-–]\s*(\d*))?$/);
    if (!match) return `"${part}" is not a valid page or range. Use numbers like 3 or ranges like 2-5.`;
    const start = parseInt(match[1], 10);
    const isRange = part.includes('-') || part.includes('–');
    const end = isRange ? (match[2] ? parseInt(match[2], 10) : maxPages) : start;
    if (start < 1 || end < 1) return 'Page numbers start at 1.';
    if (start > maxPages || end > maxPages) return `This PDF has ${maxPages} page${maxPages !== 1 ? 's' : ''}. "${part}" is out of range.`;
    if (start > end) return `"${part}" is reversed. Write the lower page number first.`;
    const group: number[] = [];
    for (let i = start; i <= end; i++) group.push(i - 1);
    groups.push(group);
  }
  return groups;
}

export default function PDFSplitter() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [selectedPages, setSelectedPages] = useState('');
  const [everyN, setEveryN] = useState('2');
  const [splitMode, setSplitMode] = useState<SplitMode>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [splitPdfs, setSplitPdfs] = useState<SplitResult[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Free object URLs of old results.
  useEffect(() => {
    return () => splitPdfs.forEach((pdf) => URL.revokeObjectURL(pdf.url));
  }, [splitPdfs]);

  const baseName = pdfFile ? pdfFile.name.replace(/\.pdf$/i, '') : 'document';

  const loadFile = async (file: File | undefined) => {
    if (!file) return;
    if (!isPdf(file)) {
      setError(`${file.name} is not a PDF file. Please choose a .pdf file.`);
      return;
    }
    setError('');
    setSplitPdfs([]);
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

  const buildGroups = (): number[][] | string => {
    if (splitMode === 'all') return Array.from({ length: pageCount }, (_, i) => [i]);
    if (splitMode === 'every') {
      const n = Number(everyN);
      if (!Number.isInteger(n) || n < 1) return 'Enter a whole number of pages (1 or more) for each file.';
      const groups: number[][] = [];
      for (let i = 0; i < pageCount; i += n) groups.push(Array.from({ length: Math.min(n, pageCount - i) }, (_, k) => i + k));
      return groups;
    }
    const parsed = parsePageGroups(selectedPages, pageCount);
    if (typeof parsed === 'string') return parsed;
    if (splitMode === 'ranges') return parsed;
    // extract: all selected pages into one file, in document order, without duplicates
    return [[...new Set(parsed.flat())].sort((a, b) => a - b)];
  };

  const groupLabel = (group: number[]) =>
    group.length === 1 ? `page_${group[0] + 1}` : `pages_${group[0] + 1}-${group[group.length - 1] + 1}`;

  const handleSplit = async () => {
    if (!pdfFile) {
      setError('Please select a PDF file first.');
      return;
    }
    const groups = buildGroups();
    if (typeof groups === 'string') {
      setError(groups);
      return;
    }

    setIsProcessing(true);
    setError('');
    setSplitPdfs([]);

    try {
      const sourcePdf = await PDFDocument.load(await pdfFile.arrayBuffer());
      const results: SplitResult[] = [];
      for (const group of groups) {
        const newPdf = await PDFDocument.create();
        const copied = await newPdf.copyPages(sourcePdf, group);
        copied.forEach((page) => newPdf.addPage(page));
        const bytes = await newPdf.save();
        const contiguous = group.every((p, i) => i === 0 || p === group[i - 1] + 1);
        const label = splitMode === 'extract' && !contiguous ? 'extracted' : groupLabel(group);
        results.push({
          name: `${baseName}_${label}.pdf`,
          url: URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' })),
          pages: group.length,
        });
      }
      setSplitPdfs(results);
    } catch (err) {
      console.error('Split error:', err);
      setError('Failed to split the PDF. The file may be corrupted or password-protected.');
    } finally {
      setIsProcessing(false);
    }
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
      setTimeout(() => handleDownload(pdf.url, pdf.name), index * 250);
    });
  };

  const handleClear = () => {
    setPdfFile(null);
    setPageCount(0);
    setSelectedPages('');
    setSplitMode('all');
    setError('');
    setSplitPdfs([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const modes: { value: SplitMode; title: string; text: string }[] = [
    { value: 'all', title: 'Split into single pages', text: 'Creates one PDF for every page' },
    { value: 'extract', title: 'Extract pages into one PDF', text: 'Pick pages such as 1-3, 7 and get a single file' },
    { value: 'ranges', title: 'Split by custom ranges', text: 'Each range becomes its own PDF, e.g. 1-3, 4-6' },
    { value: 'every', title: 'Split every N pages', text: 'Fixed-size chunks, e.g. every 2 pages' },
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
              <div className="text-2xl font-bold text-green-600" data-testid="split-page-count">{pageCount}</div>
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
          <label htmlFor="pdf-splitter-input" className="block text-sm font-medium text-gray-700 mb-2">
            Select a PDF file (or drop it here)
          </label>
          <input
            id="pdf-splitter-input"
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

        {/* Split Options */}
        {pdfFile && (
          <fieldset className="mb-6">
            <legend className="block text-sm font-medium text-gray-700 mb-3">Split mode</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {modes.map((mode) => (
                <label
                  key={mode.value}
                  className={`flex items-start p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 ${
                    splitMode === mode.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="splitMode"
                    value={mode.value}
                    checked={splitMode === mode.value}
                    onChange={() => {
                      setSplitMode(mode.value);
                      setError('');
                    }}
                    className="mr-3 mt-1"
                  />
                  <span>
                    <span className="block font-medium text-gray-900">{mode.title}</span>
                    <span className="block text-sm text-gray-600">{mode.text}</span>
                  </span>
                </label>
              ))}
            </div>

            {(splitMode === 'extract' || splitMode === 'ranges') && (
              <div className="mt-4">
                <label htmlFor="pdf-splitter-pages" className="block text-sm font-medium text-gray-700 mb-2">
                  {splitMode === 'extract' ? 'Pages to extract' : 'Ranges (one PDF per range)'}
                </label>
                <input
                  id="pdf-splitter-pages"
                  type="text"
                  inputMode="numeric"
                  value={selectedPages}
                  onChange={(e) => setSelectedPages(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleSplit();
                  }}
                  placeholder={splitMode === 'extract' ? 'e.g. 1-3, 5, 8-' : 'e.g. 1-3, 4-6, 7-'}
                  aria-describedby="pdf-splitter-pages-hint"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p id="pdf-splitter-pages-hint" className="text-xs text-gray-500 mt-1">
                  Pages 1–{pageCount}. Separate with commas; use a dash for ranges. “8-” means page 8 to the end.
                </p>
              </div>
            )}

            {splitMode === 'every' && (
              <div className="mt-4">
                <label htmlFor="pdf-splitter-every" className="block text-sm font-medium text-gray-700 mb-2">
                  Pages per file
                </label>
                <input
                  id="pdf-splitter-every"
                  type="number"
                  min={1}
                  max={pageCount}
                  step={1}
                  value={everyN}
                  onChange={(e) => setEveryN(e.target.value)}
                  className="w-full sm:w-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </fieldset>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            type="button"
            onClick={handleSplit}
            disabled={!pdfFile || isProcessing}
            className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {isProcessing ? 'Processing…' : 'Split PDF'}
          </button>
          {splitPdfs.length > 1 && (
            <button
              type="button"
              onClick={handleDownloadAll}
              className="flex-1 sm:flex-none px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              Download all ({splitPdfs.length})
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

        {/* Results */}
        {splitPdfs.length > 0 && (
          <div>
            <h2 className="block text-sm font-medium text-gray-700 mb-2" role="status">
              Result: {splitPdfs.length} file{splitPdfs.length !== 1 ? 's' : ''}
            </h2>
            <ul className="space-y-2 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-2 sm:p-4" data-testid="split-results">
              {splitPdfs.map((pdf) => (
                <li key={pdf.url} className="flex items-center justify-between gap-2 p-3 bg-gray-50 rounded-lg">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{pdf.name}</p>
                    <p className="text-xs text-gray-500">
                      {pdf.pages} page{pdf.pages !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownload(pdf.url, pdf.name)}
                    aria-label={`Download ${pdf.name}`}
                    className="flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                  >
                    Download
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
