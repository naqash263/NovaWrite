import { useEffect, useRef, useState } from 'react';

type OutputFormat = 'same' | 'jpeg' | 'webp' | 'png';
const MIME: Record<Exclude<OutputFormat, 'same'>, string> = { jpeg: 'image/jpeg', webp: 'image/webp', png: 'image/png' };
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png' };
const MAX_FILES = 20;

interface Item {
  id: number;
  file: File;
  status: 'pending' | 'done' | 'error';
  blob?: Blob;
  url?: string;
  width?: number;
  height?: number;
  keptOriginal?: boolean;
  error?: string;
}

const formatBytes = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(2)} MB`);
const baseName = (name: string) => name.replace(/\.[^.]+$/, '') || 'image';

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This image format cannot be decoded by your browser.'));
    };
    img.src = url;
  });
}

async function compress(file: File, format: OutputFormat, quality: number, maxWidth: number) {
  const img = await loadImage(file);
  // GIF/BMP/AVIF inputs cannot be re-encoded as themselves by canvas, so "same" falls back to JPEG.
  const mime = format === 'same' ? (EXT[file.type] ? file.type : 'image/jpeg') : MIME[format];
  const scale = maxWidth > 0 && img.naturalWidth > maxWidth ? maxWidth / img.naturalWidth : 1;
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available in this browser.');
  if (mime === 'image/jpeg') {
    // JPEG has no transparency: flatten onto white instead of black.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, mime, quality / 100));
  if (!blob) throw new Error('Compression failed.');
  if (blob.type !== mime) throw new Error(`Your browser cannot encode ${EXT[mime]?.toUpperCase() ?? mime}. Choose another format.`);
  return { blob, width, height, resized: scale < 1 };
}

export default function ImageCompressor() {
  const [items, setItems] = useState<Item[]>([]);
  const [quality, setQuality] = useState(75);
  const [format, setFormat] = useState<OutputFormat>('same');
  const [maxWidth, setMaxWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);
  const itemsRef = useRef<Item[]>([]);
  itemsRef.current = items;

  const addFiles = (list: FileList | File[]) => {
    const all = Array.from(list);
    const images = all.filter((f) => f.type.startsWith('image/'));
    const skipped = all.length - images.length;
    const room = MAX_FILES - itemsRef.current.length;
    const accepted = images.slice(0, Math.max(0, room));
    const messages: string[] = [];
    if (skipped) messages.push(`${skipped} file(s) skipped because they are not images.`);
    if (images.length > accepted.length) messages.push(`Only ${MAX_FILES} images can be compressed at once.`);
    setNotice(messages.join(' '));
    if (!accepted.length) return;
    setItems((prev) => [...prev, ...accepted.map((file) => ({ id: nextId.current++, file, status: 'pending' as const }))]);
  };

  // (Re)compress every image whenever the settings or the file list change.
  const fileKey = items.map((i) => i.id).join(',');
  useEffect(() => {
    if (!fileKey) return;
    let cancelled = false;
    setItems((prev) => prev.map((p) => ({ ...p, status: 'pending' })));
    const timer = setTimeout(async () => {
      for (const item of itemsRef.current) {
        if (cancelled) return;
        try {
          const out = await compress(item.file, format, quality, maxWidth);
          if (cancelled) return;
          const keptOriginal = out.blob.size >= item.file.size && !out.resized && (format === 'same' || MIME[format as keyof typeof MIME] === item.file.type);
          const blob = keptOriginal ? item.file : out.blob;
          const url = URL.createObjectURL(blob);
          setItems((prev) =>
            prev.map((p) => {
              if (p.id !== item.id) return p;
              if (p.url) URL.revokeObjectURL(p.url);
              return { ...p, status: 'done', blob, url, width: out.width, height: out.height, keptOriginal, error: undefined };
            }),
          );
        } catch (err) {
          if (cancelled) return;
          setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, status: 'error', error: (err as Error).message } : p)));
        }
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [fileKey, format, quality, maxWidth]);

  useEffect(() => () => itemsRef.current.forEach((i) => i.url && URL.revokeObjectURL(i.url)), []);

  const fileName = (item: Item) => {
    const mime = item.blob?.type || item.file.type;
    return item.keptOriginal ? item.file.name : `${baseName(item.file.name)}-compressed.${EXT[mime] ?? 'img'}`;
  };

  const download = (item: Item) => {
    if (!item.url) return;
    const a = document.createElement('a');
    a.href = item.url;
    a.download = fileName(item);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const done = items.filter((i) => i.status === 'done' && i.blob);
  const totalBefore = done.reduce((s, i) => s + i.file.size, 0);
  const totalAfter = done.reduce((s, i) => s + (i.blob?.size ?? 0), 0);
  const hasPng = items.some((i) => i.file.type === 'image/png');

  return (
    <div className="rounded-lg bg-white p-4 shadow-lg sm:p-6">
      <div className="space-y-6">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/avif"
            multiple
            className="sr-only"
            tabIndex={-1}
            aria-label="Images to compress"
            data-testid="image-file-input"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
          >
            Choose images
          </button>
          <p className="mt-2 text-sm text-gray-500">or drag and drop up to {MAX_FILES} JPG, PNG, WebP, GIF or BMP files. Nothing is uploaded.</p>
        </div>

        {notice && (
          <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {notice}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="ic-quality" className="mb-2 block text-sm font-medium text-gray-700">
              Quality: {quality}%
            </label>
            <input id="ic-quality" type="range" min={10} max={100} step={5} value={quality} onChange={(e) => setQuality(e.target.valueAsNumber)} className="w-full" />
            <p className="mt-1 text-xs text-gray-500">60–80% usually looks the same with a much smaller file.</p>
          </div>
          <div>
            <label htmlFor="ic-format" className="mb-2 block text-sm font-medium text-gray-700">
              Output format
            </label>
            <select
              id="ic-format"
              value={format}
              onChange={(e) => setFormat(e.target.value as OutputFormat)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            >
              <option value="same">Same as original</option>
              <option value="jpeg">JPEG</option>
              <option value="webp">WebP</option>
              <option value="png">PNG (lossless)</option>
            </select>
          </div>
          <div>
            <label htmlFor="ic-maxwidth" className="mb-2 block text-sm font-medium text-gray-700">
              Max width
            </label>
            <select
              id="ic-maxwidth"
              value={maxWidth}
              onChange={(e) => setMaxWidth(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Keep original size</option>
              {[3840, 2560, 1920, 1280, 1024, 800].map((w) => (
                <option key={w} value={w}>
                  {w}px
                </option>
              ))}
            </select>
          </div>
        </div>
        {hasPng && format === 'same' && (
          <p className="text-sm text-gray-600">Tip: PNG is lossless, so the quality slider has no effect on it. Choose WebP or JPEG for big savings.</p>
        )}

        {items.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-gray-700" data-testid="compress-summary" aria-live="polite">
                {done.length} of {items.length} compressed
                {done.length > 0 && ` · ${formatBytes(totalBefore)} → ${formatBytes(totalAfter)} (${Math.round((1 - totalAfter / totalBefore) * 100)}% smaller)`}
              </p>
              <div className="flex gap-2">
                {done.length > 1 && (
                  <button
                    type="button"
                    onClick={() => done.forEach((i, n) => setTimeout(() => download(i), n * 300))}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                  >
                    Download all
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    items.forEach((i) => i.url && URL.revokeObjectURL(i.url));
                    setItems([]);
                    setNotice('');
                  }}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Clear all
                </button>
              </div>
            </div>
            <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
              {items.map((item) => {
                const saved = item.blob ? Math.round((1 - item.blob.size / item.file.size) * 100) : 0;
                return (
                  <li key={item.id} className="flex flex-wrap items-center gap-3 p-3" data-testid="compress-item">
                    {item.url ? (
                      <img src={item.url} alt="" className="h-14 w-14 flex-none rounded object-cover" />
                    ) : (
                      <div className="h-14 w-14 flex-none rounded bg-gray-100" aria-hidden="true" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{item.file.name}</p>
                      {item.status === 'pending' && <p className="text-xs text-gray-500">Compressing…</p>}
                      {item.status === 'error' && <p className="text-xs text-red-700">{item.error}</p>}
                      {item.status === 'done' && item.blob && (
                        <p className="text-xs text-gray-600" data-testid="compress-result">
                          {formatBytes(item.file.size)} → {formatBytes(item.blob.size)}{' '}
                          {item.keptOriginal ? (
                            <span className="text-amber-700">(already optimised, original kept)</span>
                          ) : (
                            <span className={saved > 0 ? 'font-semibold text-green-700' : 'text-amber-700'}>
                              ({saved > 0 ? `${saved}% smaller` : `${-saved}% larger`})
                            </span>
                          )}
                          {item.width && ` · ${item.width}×${item.height}`}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => download(item)}
                      disabled={item.status !== 'done'}
                      aria-label={`Download ${fileName(item)}`}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      Download
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
