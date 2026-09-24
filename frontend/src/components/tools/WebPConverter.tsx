import { useEffect, useRef, useState } from 'react';

type Target = 'webp' | 'avif';
const MIME: Record<Target, string> = { webp: 'image/webp', avif: 'image/avif' };
const MAX_FILES = 30;

interface Item {
  id: number;
  file: File;
  status: 'pending' | 'done' | 'error';
  blob?: Blob;
  url?: string;
  ext?: Target;
  error?: string;
}

const formatBytes = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(2)} MB`);

function canEncode(mime: string): boolean {
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    return c.toDataURL(mime).startsWith(`data:${mime}`);
  } catch {
    return false;
  }
}

async function encode(file: File, target: Target, quality: number): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Your browser cannot open this image format.'));
      i.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 1024;
    canvas.height = img.naturalHeight || 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not available in this browser.');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, MIME[target], quality / 100));
    if (!blob) throw new Error('Conversion failed. The image may be too large.');
    if (blob.type !== MIME[target]) throw new Error(`Your browser cannot create ${target.toUpperCase()} files.`);
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function WebPConverter() {
  const [support] = useState(() => ({ webp: canEncode('image/webp'), avif: canEncode('image/avif') }));
  const [target, setTarget] = useState<Target>('webp');
  const [quality, setQuality] = useState(80);
  const [items, setItems] = useState<Item[]>([]);
  const [notice, setNotice] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);
  const itemsRef = useRef<Item[]>([]);
  itemsRef.current = items;

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
    if (!fileKey || !support[target]) return;
    let cancelled = false;
    setItems((prev) => prev.map((p) => ({ ...p, status: 'pending' })));
    const timer = setTimeout(async () => {
      for (const item of itemsRef.current) {
        if (cancelled) return;
        try {
          const blob = await encode(item.file, target, quality);
          if (cancelled) return;
          setItems((prev) =>
            prev.map((p) => {
              if (p.id !== item.id) return p;
              if (p.url) URL.revokeObjectURL(p.url);
              return { ...p, status: 'done', blob, ext: target, url: URL.createObjectURL(blob), error: undefined };
            }),
          );
        } catch (err) {
          if (!cancelled) setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, status: 'error', error: (err as Error).message } : p)));
        }
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [fileKey, target, quality, support]);

  const outName = (item: Item) => `${item.file.name.replace(/\.[^.]+$/, '') || 'image'}.${item.ext ?? target}`;
  const download = (item: Item) => {
    if (!item.url) return;
    const a = document.createElement('a');
    a.href = item.url;
    a.download = outName(item);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  const done = items.filter((i) => i.status === 'done' && i.blob);
  const before = done.reduce((s, i) => s + i.file.size, 0);
  const after = done.reduce((s, i) => s + (i.blob?.size ?? 0), 0);

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
          <p className="mt-2 text-sm text-gray-500">or drag and drop JPG, PNG, GIF, BMP or SVG files (up to {MAX_FILES}). Conversion happens in your browser.</p>
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
              {(['webp', 'avif'] as Target[]).map((x) => (
                <button
                  key={x}
                  type="button"
                  aria-pressed={target === x}
                  disabled={!support[x]}
                  onClick={() => setTarget(x)}
                  className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    target === x ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {x === 'webp' ? 'WebP' : 'AVIF'}
                </button>
              ))}
            </div>
            {!support.avif && (
              <p className="mt-2 text-xs text-gray-500" data-testid="avif-unsupported">
                AVIF is disabled because this browser cannot encode AVIF images.
              </p>
            )}
            {!support.webp && (
              <p role="alert" className="mt-2 text-sm text-red-700">
                This browser cannot encode WebP. Try the latest Chrome, Edge or Firefox.
              </p>
            )}
          </fieldset>
          <div>
            <label htmlFor="webp-quality" className="mb-2 block text-sm font-medium text-gray-700">
              Quality: {quality}%
            </label>
            <input id="webp-quality" type="range" min={10} max={100} step={5} value={quality} onChange={(e) => setQuality(e.target.valueAsNumber)} className="w-full" />
            <p className="mt-1 text-xs text-gray-500">75–85% is a good balance for photos on websites.</p>
          </div>
        </div>

        {items.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-gray-700" aria-live="polite" data-testid="webp-summary">
                {done.length} of {items.length} converted
                {done.length > 0 && ` · ${formatBytes(before)} → ${formatBytes(after)} (${after <= before ? `${Math.round((1 - after / before) * 100)}% smaller` : `${Math.round((after / before - 1) * 100)}% larger`})`}
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
              {items.map((item) => {
                const pct = item.blob ? Math.round((1 - item.blob.size / item.file.size) * 100) : 0;
                return (
                  <li key={item.id} className="flex flex-wrap items-center gap-3 p-3" data-testid="webp-item">
                    {item.url ? (
                      <img src={item.url} alt="" className="h-14 w-14 flex-none rounded object-cover" />
                    ) : (
                      <div className="h-14 w-14 flex-none rounded bg-gray-100" aria-hidden="true" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{item.file.name}</p>
                      {item.status === 'pending' && <p className="text-xs text-gray-500">Converting…</p>}
                      {item.status === 'error' && <p className="text-xs text-red-700">{item.error}</p>}
                      {item.status === 'done' && item.blob && (
                        <p className="text-xs text-gray-600" data-testid="webp-result">
                          {formatBytes(item.file.size)} → {formatBytes(item.blob.size)}{' '}
                          <span className={pct > 0 ? 'font-semibold text-green-700' : 'text-amber-700'}>
                            ({pct > 0 ? `${pct}% smaller` : `${-pct}% larger – keep the original`})
                          </span>
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
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
