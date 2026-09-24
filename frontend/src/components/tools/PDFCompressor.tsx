import { useEffect, useRef, useState } from 'react';
import { PDFArray, PDFDocument, PDFName, PDFNumber, PDFRawStream, PDFStream, type PDFObject } from 'pdf-lib';

type Level = 'low' | 'medium' | 'high';

const levels: Record<Level, { label: string; text: string; quality: number; maxDim: number }> = {
  low: { label: 'Light', text: 'Best quality. JPEG quality 85%, images up to 4000 px.', quality: 0.85, maxDim: 4000 },
  medium: { label: 'Recommended', text: 'JPEG quality 70%, images up to 2000 px.', quality: 0.7, maxDim: 2000 },
  high: { label: 'Strong', text: 'Smallest file. JPEG quality 50%, images up to 1400 px.', quality: 0.5, maxDim: 1400 },
};

interface CompressResult {
  url: string;
  size: number;
  imagesFound: number;
  imagesRecompressed: number;
}

const isPdf = (file: File) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name);

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : `${(bytes / 1024).toFixed(1)} KB`;

const N = (name: string) => PDFName.of(name);

/** Number of colour components for colour spaces we can safely re-encode through a canvas. */
function colorComponents(cs: PDFObject | undefined, doc: PDFDocument): number | null {
  if (cs === N('DeviceRGB')) return 3;
  if (cs === N('DeviceGray')) return 1;
  if (cs instanceof PDFArray && cs.size() === 2 && cs.lookup(0) === N('ICCBased')) {
    const profile = doc.context.lookup(cs.get(1));
    const n = profile instanceof PDFStream ? profile.dict.lookup(N('N')) : undefined;
    if (n instanceof PDFNumber && (n.asNumber() === 3 || n.asNumber() === 1)) return n.asNumber();
  }
  return null;
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Uint8Array | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return resolve(null);
        blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)), () => resolve(null));
      },
      'image/jpeg',
      quality,
    );
  });
}

/**
 * Re-encodes baseline JPEG (DCTDecode) images at a lower quality and resolution.
 * Only images that get smaller are replaced; text, vectors and other image types are left untouched.
 */
async function recompressJpegImages(doc: PDFDocument, quality: number, maxDim: number) {
  let found = 0;
  let replaced = 0;
  const ctx = doc.context;
  for (const [ref, obj] of ctx.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue;
    const dict = obj.dict;
    if (dict.lookup(N('Subtype')) !== N('Image')) continue;
    const filter = dict.lookup(N('Filter'));
    const isJpeg = filter === N('DCTDecode') || (filter instanceof PDFArray && filter.size() === 1 && filter.lookup(0) === N('DCTDecode'));
    if (!isJpeg) continue;
    found++;
    const bpc = dict.lookup(N('BitsPerComponent'));
    if (dict.has(N('Decode')) || dict.has(N('ImageMask')) || (bpc instanceof PDFNumber && bpc.asNumber() !== 8)) continue;
    if (colorComponents(dict.lookup(N('ColorSpace')), doc) === null) continue;

    const original = obj.getContents();
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(new Blob([original as BlobPart], { type: 'image/jpeg' }), { imageOrientation: 'none' });
    } catch {
      continue;
    }
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const g = canvas.getContext('2d');
    if (!g) {
      bitmap.close();
      continue;
    }
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, width, height);
    g.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const jpeg = await canvasToJpeg(canvas, quality);
    if (!jpeg || jpeg.length >= original.length * 0.95) continue;

    const newStream = ctx.stream(jpeg, {
      Type: 'XObject',
      Subtype: 'Image',
      Width: width,
      Height: height,
      ColorSpace: 'DeviceRGB',
      BitsPerComponent: 8,
      Filter: 'DCTDecode',
    });
    for (const key of ['SMask', 'Intent', 'Interpolate', 'OC', 'Metadata']) {
      const value = dict.get(N(key));
      if (value) newStream.dict.set(N(key), value);
    }
    ctx.assign(ref, newStream);
    replaced++;
  }
  return { found, replaced };
}

export default function PDFCompressor() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<Level>('medium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<CompressResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  const loadFile = (file: File | undefined) => {
    if (!file) return;
    if (!isPdf(file)) {
      setError(`${file.name} is not a PDF file. Please choose a .pdf file.`);
      return;
    }
    setPdfFile(file);
    setError('');
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCompress = async () => {
    if (!pdfFile) {
      setError('Please select a PDF file first.');
      return;
    }
    setIsProcessing(true);
    setError('');
    setResult(null);

    try {
      const { quality, maxDim } = levels[compressionLevel];
      const pdfDoc = await PDFDocument.load(await pdfFile.arrayBuffer());
      const { found, replaced } = await recompressJpegImages(pdfDoc, quality, maxDim);
      const bytes = await pdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      setResult({ url: URL.createObjectURL(blob), size: blob.size, imagesFound: found, imagesRecompressed: replaced });
    } catch (err) {
      console.error('Compress error:', err);
      setError('Failed to compress the PDF. The file may be corrupted or password-protected.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !pdfFile) return;
    const link = document.createElement('a');
    link.href = result.url;
    link.download = `${pdfFile.name.replace(/\.pdf$/i, '')}_compressed.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClear = () => {
    setPdfFile(null);
    setError('');
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const originalSize = pdfFile?.size ?? 0;
  const smaller = result !== null && result.size < originalSize;
  const reduction = result && originalSize > 0 ? (1 - result.size / originalSize) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8">
        {/* Stats */}
        {pdfFile && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Original</div>
              <div className="text-base sm:text-lg font-bold text-blue-600" data-testid="original-size">
                {formatSize(originalSize)}
              </div>
            </div>
            {result && (
              <>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">Compressed</div>
                  <div className="text-base sm:text-lg font-bold text-green-600" data-testid="compressed-size">
                    {formatSize(result.size)}
                  </div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">Saved</div>
                  <div className="text-base sm:text-lg font-bold text-purple-600" data-testid="reduction">
                    {smaller ? `${reduction.toFixed(1)}%` : '0%'}
                  </div>
                </div>
              </>
            )}
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
            loadFile(e.dataTransfer.files?.[0]);
          }}
        >
          <label htmlFor="pdf-compressor-input" className="block text-sm font-medium text-gray-700 mb-2">
            Select a PDF file (or drop it here)
          </label>
          <input
            id="pdf-compressor-input"
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => loadFile(e.target.files?.[0])}
            className="w-full min-w-0 p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-2">
            Works best on scanned documents and PDFs with photos. Text-only PDFs usually shrink very little.
          </p>
        </div>

        {/* Compression Level */}
        {pdfFile && (
          <fieldset className="mb-6">
            <legend className="block text-sm font-medium text-gray-700 mb-3">Compression level</legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.keys(levels) as Level[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => {
                    setCompressionLevel(level);
                    setResult(null);
                  }}
                  aria-pressed={compressionLevel === level}
                  className={`p-4 rounded-lg border-2 text-left transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    compressionLevel === level ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="block font-semibold text-gray-900 mb-1">{levels[level].label}</span>
                  <span className="block text-xs text-gray-600">{levels[level].text}</span>
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {/* Error Message */}
        {error && (
          <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCompress}
            disabled={!pdfFile || isProcessing}
            className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {isProcessing ? 'Compressing…' : 'Compress PDF'}
          </button>
          {smaller && (
            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 sm:flex-none px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              Download compressed PDF
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

        {result && (
          <div
            role="status"
            data-testid="compress-result"
            className={`mt-4 p-3 rounded-lg border text-sm ${smaller ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-900'}`}
          >
            {smaller ? (
              <p>
                Reduced from {formatSize(originalSize)} to {formatSize(result.size)} ({reduction.toFixed(1)}% smaller).{' '}
                {result.imagesRecompressed > 0
                  ? `Re-encoded ${result.imagesRecompressed} of ${result.imagesFound} JPEG image${result.imagesFound !== 1 ? 's' : ''}.`
                  : 'Savings come from optimising the PDF structure; no images were changed.'}
              </p>
            ) : (
              <p>
                This PDF could not be made smaller in your browser
                {result.imagesFound === 0 ? ': it contains no JPEG images to re-encode' : ' at this level'}. Your original file is
                already the smallest version, so there is nothing to download.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
