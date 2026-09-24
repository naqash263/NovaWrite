import { useEffect, useRef, useState } from 'react';
import { PDFDocument } from 'pdf-lib';

interface PDFFile {
  id: string;
  file: File;
  name: string;
  size: number;
  pages: number;
}

const MAX_FILES = 50;

const isPdf = (file: File) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name);

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : `${(bytes / 1024).toFixed(1)} KB`;

export default function PDFMerger() {
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mergedPdfUrl, setMergedPdfUrl] = useState('');
  const [mergedPages, setMergedPages] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke the previous object URL whenever it changes or the tool unmounts.
  useEffect(() => {
    return () => {
      if (mergedPdfUrl) URL.revokeObjectURL(mergedPdfUrl);
    };
  }, [mergedPdfUrl]);

  const addFiles = async (files: File[]) => {
    if (files.length === 0) return;
    const problems: string[] = [];
    const pdfs = files.filter((f) => {
      if (isPdf(f)) return true;
      problems.push(`${f.name} is not a PDF file.`);
      return false;
    });

    const room = MAX_FILES - pdfFiles.length;
    if (pdfs.length > room) {
      problems.push(`You can merge up to ${MAX_FILES} files. ${pdfs.length - room} file(s) were not added.`);
      pdfs.splice(Math.max(0, room));
    }

    setIsLoading(true);
    const newFiles: PDFFile[] = [];
    for (const file of pdfs) {
      try {
        const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
        newFiles.push({
          id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
          file,
          name: file.name,
          size: file.size,
          pages: pdfDoc.getPageCount(),
        });
      } catch {
        problems.push(`Could not read ${file.name}. It may be corrupted or password-protected.`);
      }
    }
    setIsLoading(false);

    if (newFiles.length) {
      setPdfFiles((prev) => [...prev, ...newFiles]);
      setMergedPdfUrl('');
    }
    setError(problems.join(' '));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    void addFiles(Array.from(e.target.files || []));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.length) void addFiles(Array.from(e.dataTransfer.files));
  };

  const removeFile = (index: number) => {
    setPdfFiles((prev) => prev.filter((_, i) => i !== index));
    setMergedPdfUrl('');
  };

  const moveFile = (from: number, to: number) => {
    if (to < 0 || to >= pdfFiles.length || from === to) return;
    setPdfFiles((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setMergedPdfUrl('');
  };

  const handleMerge = async () => {
    if (pdfFiles.length < 2) {
      setError('Please add at least 2 PDF files to merge.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setMergedPdfUrl('');

    try {
      const mergedPdf = await PDFDocument.create();
      for (const pdfFile of pdfFiles) {
        const pdf = await PDFDocument.load(await pdfFile.file.arrayBuffer());
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((page) => mergedPdf.addPage(page));
      }
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      setMergedPages(mergedPdf.getPageCount());
      setMergedPdfUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error('Merge error:', err);
      setError('Failed to merge PDFs. One of the files may be corrupted or password-protected.');
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const totalPages = pdfFiles.reduce((sum, f) => sum + f.pages, 0);
  const totalSize = pdfFiles.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8">
        {/* Stats */}
        {pdfFiles.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6" data-testid="merge-stats">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Files</div>
              <div className="text-2xl font-bold text-blue-600">{pdfFiles.length}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Total pages</div>
              <div className="text-2xl font-bold text-green-600">{totalPages}</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Total size</div>
              <div className="text-lg sm:text-2xl font-bold text-purple-600">{formatSize(totalSize)}</div>
            </div>
          </div>
        )}

        {/* File Upload */}
        <div
          className={`mb-6 rounded-lg border-2 border-dashed p-4 transition-colors ${
            isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          <label htmlFor="pdf-merger-input" className="block text-sm font-medium text-gray-700 mb-2">
            Select PDF files (or drop them here)
          </label>
          <input
            id="pdf-merger-input"
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            onChange={handleFileSelect}
            aria-describedby="pdf-merger-hint"
            className="w-full min-w-0 p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p id="pdf-merger-hint" className="text-sm text-gray-500 mt-2">
            Add up to {MAX_FILES} PDFs. You can add more files at any time; password-protected PDFs are not supported.
          </p>
          {isLoading && (
            <p className="text-sm text-blue-700 mt-2" role="status">
              Reading files…
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* File List */}
        {pdfFiles.length > 0 && (
          <div className="mb-6">
            <h2 className="block text-sm font-medium text-gray-700 mb-2">
              Merge order (drag a file or use the arrows to reorder)
            </h2>
            <ol className="space-y-2 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-2 sm:p-4" data-testid="merge-list">
              {pdfFiles.map((pdfFile, index) => (
                <li
                  key={pdfFile.id}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (dragIndex !== null) moveFile(dragIndex, index);
                    setDragIndex(null);
                  }}
                  onDragEnd={() => setDragIndex(null)}
                  className={`flex items-center justify-between gap-2 p-3 rounded-lg transition-colors cursor-move ${
                    dragIndex === index ? 'bg-blue-100' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="font-mono text-xs text-gray-500 w-5 text-right" aria-hidden="true">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{pdfFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatSize(pdfFile.size)} • {pdfFile.pages} page{pdfFile.pages !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-none">
                    <button
                      type="button"
                      onClick={() => moveFile(index, index - 1)}
                      disabled={index === 0}
                      className="p-2 text-gray-500 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label={`Move ${pdfFile.name} up`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveFile(index, index + 1)}
                      disabled={index === pdfFiles.length - 1}
                      className="p-2 text-gray-500 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label={`Move ${pdfFile.name} down`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-2 text-red-500 hover:text-red-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label={`Remove ${pdfFile.name}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleMerge}
            disabled={pdfFiles.length < 2 || isProcessing}
            className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {isProcessing ? 'Merging…' : 'Merge PDFs'}
          </button>
          {mergedPdfUrl && (
            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 sm:flex-none px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              Download merged PDF
            </button>
          )}
          <button
            type="button"
            onClick={handleClear}
            disabled={pdfFiles.length === 0 && !error}
            className="flex-1 sm:flex-none px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
          >
            Clear all
          </button>
        </div>
        {pdfFiles.length === 1 && <p className="mt-3 text-sm text-gray-600">Add at least one more PDF to merge.</p>}

        {mergedPdfUrl && (
          <p role="status" className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800" data-testid="merge-result">
            Merged {pdfFiles.length} files into one PDF with {mergedPages} page{mergedPages !== 1 ? 's' : ''}.
          </p>
        )}
      </div>
    </div>
  );
}
