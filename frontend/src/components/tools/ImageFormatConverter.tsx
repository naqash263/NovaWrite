import { useEffect, useRef, useState } from 'react';

type Target = 'jpeg' | 'png' | 'webp' | 'bmp' | 'avif';
const TARGETS: { value: Target; label: string; mime: string; ext: string; lossy: boolean }[] = [
  { value: 'jpeg', label: 'JPG / JPEG', mime: 'image/jpeg', ext: 'jpg', lossy: true },
  { value: 'png', label: 'PNG', mime: 'image/png', ext: 'png', lossy: false },
  { value: 'webp', label: 'WebP', mime: 'image/webp', ext: 'webp', lossy: true },
  { value: 'avif', label: 'AVIF', mime: 'image/avif', ext: 'avif', lossy: true },
  { value: 'bmp', label: 'BMP', mime: 'image/bmp', ext: 'bmp', lossy: false },
];
const MAX_FILES = 20;

interface Item {
  id: number;
  file: File;
  status: 'pending' | 'done' | 'error';
  blob?: Blob;
  url?: string;
  ext?: string;
  error?: string;
}

const formatBytes = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(2)} MB`);

/** Canvas can only *encode* some formats; detect them once. */
function canEncode(mime: string): boolean {
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    return c.toDataURL(mime).startsWith(`data:${mime}`);
  } catch {
    return false;
  }
}

/** Minimal 24-bit BMP encoder (canvas has no native BMP export). Transparency is flattened onto white. */
function encodeBmp(ctx: CanvasRenderingContext2D, w: number, h: number): Blob {
  const { data } = ctx.getImageData(0, 0, w, h);
  const rowSize = Math.ceil((w * 3) / 4) * 4;
  const size = 54 + rowSize * h;
  const buf = new ArrayBuffer(size);
  const v = new DataView(buf);
  v.setUint8(0, 0x42);
  v.setUint8(1, 0x4d);
  v.setUint32(2, size, true);
  v.setUint32(10, 54, true);
  v.setUint32(14, 40, true);
  v.setInt32(18, w, true);
  v.setInt32(22, h, true);
  v.setUint16(26, 1, true);
  v.setUint16(28, 24, true);
  v.setUint32(34, rowSize * h, true);
  v.setInt32(38, 2835, true);
  v.setInt32(42, 2835, true);
  const bytes = new Uint8Array(buf);
  for (let y = 0; y < h; y++) {
    const row = 54 + (h - 1 - y) * rowSize;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const a = data[i + 3] / 255;
      const o = row + x * 3;
      bytes[o] = Math.round(data[i + 2] * a + 255 * (1 - a));
      bytes[o + 1] = Math.round(data[i + 1] * a + 255 * (1 - a));
      bytes[o + 2] = Math.round(data[i] * a + 255 * (1 - a));
    }
  }
  return new Blob([buf], { type: 'image/bmp' });
}

async function convert(file: File, target: Target, quality: number): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Your browser cannot open this image format.'));
      i.src = url;
    });
    const t = TARGETS.find((x) => x.value === target)!;
    const canvas = document.createElement('canvas');
    // SVGs without intrinsic size report 0x0: fall back to 1024px wide.
    canvas.width = img.naturalWidth || 1024;
    canvas.height = img.naturalHeight || 1024;
    const ctx = canvas.getContext('2d', { willReadFrequently: target === 'bmp' });
    if (!ctx) throw new Error('Canvas is not available in this browser.');
    if (target === 'jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    if (target === 'bmp') return encodeBmp(ctx, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, t.mime, quality / 100));
    if (!blob) throw new Error('Conversion failed. The image may be too large.');
    if (blob.type !== t.mime) throw new Error(`Your browser cannot create ${t.label} files.`);
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function ImageFormatConverter() {
  const [support] = useState<Record<Target, boolean>>(() => ({
    jpeg: true,
    png: true,
    bmp: true,
    webp: canEncode('image/webp'),
    avif: canEncode('image/avif'),
  }));
  const [target, setTarget] = useState<Target>('png');
  const [quality, setQuality] = useState(90);
  const [items, setItems] = useState<Item[]>([]);
  const [notice, setNotice] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);
  const itemsRef = useRef<Item[]>([]);
  itemsRef.current = items;
  const t = TARGETS.find((x) => x.value === target)!;

  const addFiles = (list: FileList | File[]) => {
    const all = Array.from(list);
    const images = all.filter((f) => f.type.startsWith('image/'));
    const accepted = images.slice(0, Math.max(0, MAX_FILES - itemsRef.current.length));
    const msgs: string[] = [];
    if (all.length > images.length) msgs.push(`${all.length - images.length} file(s) skipped because they are not images.`);
    if (images.length > accepted.length) msgs.push(`Up to ${MAX_FILES} images can be converted at once.`);
    setNotice(msgs.join(' '));
    if (accepted.length) setItems((prev) => [...prev, ...accepted.map((file) => ({ id: nextId.current++, file, status: 'pending' as const }))]);
  };

  const fileKey = items.map((i) => i.id).join(',');
  useEffect(() => {
    if (!fileKey) return;
    let cancelled = false;
    setItems((prev) => prev.map((p) => ({ ...p, status: 'pending' })));
    const ext = TARGETS.find((x) => x.value === target)!.ext;
    const timer = setTimeout(async () => {
      for (const item of itemsRef.current) {
        if (cancelled) return;
        try {
          const blob = await convert(item.file, target, quality);
          if (cancelled) return;
          setItems((prev) =>
            prev.map((p) => {
              if (p.id !== item.id) return p;
              if (p.url) URL.revokeObjectURL(p.url);
              return { ...p, status: 'done', blob, ext, url: URL.createObjectURL(blob), error: undefined };
            }),
          );
        } catch (err) {
          if (!cancelled) setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, status: 'error', error: (err as Error).message } : p)));
        }
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [fileKey, target, quality]);

  const outName = (item: Item) => `${item.file.name.replace(/\.[^.]+$/, '') || 'image'}.${item.ext ?? t.ext}`;
  const download = (item: Item) => {
    if (!item.url) return;
    const a = document.createElement('a');
    a.href = item.url;
    a.download = outName(item);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  const done = items.filter((i) => i.status === 'done');

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
            accept="image/*"
            multiple
            className="sr-only"
            tabIndex={-1}
            aria-label="Images to convert"
            data-testid="image-file-input"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <button type="button" onClick={() => inputRef.current?.click()} className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700">
            Choose images
          </button>
          <p className="mt-2 text-sm text-gray-500">or drag and drop JPG, PNG, WebP, GIF, BMP, SVG or AVIF files (up to {MAX_FILES}). Nothing is uploaded.</p>
        </div>

        {notice && (
          <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {notice}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-gray-700">Convert to</legend>
            <div className="flex flex-wrap gap-2">
              {TARGETS.map((x) => (
                <button
                  key={x.value}
                  type="button"
                  aria-pressed={target === x.value}
                  disabled={!support[x.value]}
                  title={support[x.value] ? undefined : `Your browser cannot create ${x.label} files`}
                  onClick={() => setTarget(x.value)}
                  className={`rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    target === x.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {x.label}
                </button>
              ))}
            </div>
            {!support.avif && <p className="mt-2 text-xs text-gray-500">AVIF output needs a browser that can encode AVIF; yours cannot, so it is disabled.</p>}
          </fieldset>
          {t.lossy && (
            <div>
              <label htmlFor="fc-quality" className="mb-2 block text-sm font-medium text-gray-700">
                Quality: {quality}%
              </label>
              <input id="fc-quality" type="range" min={10} max={100} step={5} value={quality} onChange={(e) => setQuality(e.target.valueAsNumber)} className="w-full" />
            </div>
          )}
        </div>
        {target === 'jpeg' && <p className="text-sm text-gray-600">JPEG has no transparency, so transparent areas become white.</p>}
        <p className="text-xs text-gray-500">Animated GIFs are converted using their first frame.</p>

        {items.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-gray-700" aria-live="polite">
                {done.length} of {items.length} converted to {t.label}
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
                  }}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Clear all
                </button>
              </div>
            </div>
            <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
              {items.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center gap-3 p-3" data-testid="convert-item">
                  {item.url && target !== 'bmp' ? (
                    <img src={item.url} alt="" className="h-14 w-14 flex-none rounded object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 flex-none items-center justify-center rounded bg-gray-100 text-xs text-gray-500" aria-hidden="true">
                      {t.ext.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{item.file.name}</p>
                    {item.status === 'pending' && <p className="text-xs text-gray-500">Converting…</p>}
                    {item.status === 'error' && <p className="text-xs text-red-700">{item.error}</p>}
                    {item.status === 'done' && item.blob && (
                      <p className="text-xs text-gray-600" data-testid="convert-result">
                        {formatBytes(item.file.size)} → {outName(item)} · {formatBytes(item.blob.size)}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => download(item)}
                    disabled={item.status !== 'done'}
                    aria-label={`Download ${outName(item)}`}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
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
