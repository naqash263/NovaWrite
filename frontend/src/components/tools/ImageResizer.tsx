import { useEffect, useRef, useState } from 'react';

type OutputFormat = 'same' | 'jpeg' | 'png' | 'webp';
type Fit = 'stretch' | 'cover' | 'contain';
const MIME: Record<Exclude<OutputFormat, 'same'>, string> = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_SIDE = 10000;

const PRESETS = [
  { id: 'ig-square', name: 'Instagram square post', width: 1080, height: 1080 },
  { id: 'ig-portrait', name: 'Instagram portrait post', width: 1080, height: 1350 },
  { id: 'story', name: 'Story / Reel (9:16)', width: 1080, height: 1920 },
  { id: 'og', name: 'Facebook / Open Graph link image', width: 1200, height: 630 },
  { id: 'x-post', name: 'X (Twitter) post, 16:9', width: 1200, height: 675 },
  { id: 'x-header', name: 'X (Twitter) header', width: 1500, height: 500 },
  { id: 'linkedin-post', name: 'LinkedIn shared image', width: 1200, height: 627 },
  { id: 'linkedin-cover', name: 'LinkedIn cover', width: 1584, height: 396 },
  { id: 'youtube', name: 'YouTube thumbnail', width: 1280, height: 720 },
  { id: 'pinterest', name: 'Pinterest pin (2:3)', width: 1000, height: 1500 },
];

const formatBytes = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(2)} MB`);
const clampSide = (n: number) => Math.min(MAX_SIDE, Math.max(1, Math.round(n || 1)));

export default function ImageResizer() {
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lock, setLock] = useState(true);
  const [fit, setFit] = useState<Fit>('cover');
  const [background, setBackground] = useState('#ffffff');
  const [preset, setPreset] = useState('');
  const [format, setFormat] = useState<OutputFormat>('same');
  const [quality, setQuality] = useState(90);
  const [result, setResult] = useState<{ url: string; blob: Blob; width: number; height: number } | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ratio = img ? img.naturalWidth / img.naturalHeight : 1;

  const loadFile = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Please choose an image file (JPG, PNG, WebP, GIF or BMP).');
      return;
    }
    const url = URL.createObjectURL(f);
    const image = new Image();
    image.onload = () => {
      setError('');
      setFile(f);
      setImg(image);
      setWidth(image.naturalWidth);
      setHeight(image.naturalHeight);
      setPreset('');
      setLock(true);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      setError('Your browser cannot open this image format. Try JPG, PNG or WebP.');
    };
    image.src = url;
  };

  const changeWidth = (w: number) => {
    if (Number.isNaN(w)) return;
    const v = clampSide(w);
    setWidth(v);
    setPreset('');
    if (lock) setHeight(clampSide(v / ratio));
  };
  const changeHeight = (h: number) => {
    if (Number.isNaN(h)) return;
    const v = clampSide(h);
    setHeight(v);
    setPreset('');
    if (lock) setWidth(clampSide(v * ratio));
  };
  const scaleTo = (pct: number) => {
    if (!img) return;
    setPreset('');
    setLock(true);
    setWidth(clampSide((img.naturalWidth * pct) / 100));
    setHeight(clampSide((img.naturalHeight * pct) / 100));
  };
  const applyPreset = (id: string) => {
    setPreset(id);
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    setLock(false);
    setWidth(p.width);
    setHeight(p.height);
  };

  // Render the resized image whenever settings change.
  useEffect(() => {
    if (!img || !file || !width || !height) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      const mime = format === 'same' ? (EXT[file.type] ? file.type : 'image/png') : MIME[format];
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return setError('Canvas is not available in this browser.');
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const sameRatio = Math.abs(width / height - iw / ih) < 0.01;
      if (mime === 'image/jpeg' || (fit === 'contain' && !sameRatio)) {
        ctx.fillStyle = mime === 'image/jpeg' && fit !== 'contain' ? '#ffffff' : background;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.imageSmoothingQuality = 'high';
      if (sameRatio || fit === 'stretch') {
        ctx.drawImage(img, 0, 0, width, height);
      } else if (fit === 'cover') {
        const s = Math.max(width / iw, height / ih);
        const sw = width / s;
        const sh = height / s;
        ctx.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, 0, 0, width, height);
      } else {
        const s = Math.min(width / iw, height / ih);
        const dw = iw * s;
        const dh = ih * s;
        ctx.drawImage(img, (width - dw) / 2, (height - dh) / 2, dw, dh);
      }
      canvas.toBlob(
        (blob) => {
          if (cancelled) return;
          if (!blob) return setError('The image is too large for your browser to resize. Try smaller dimensions.');
          if (blob.type !== mime) return setError(`Your browser cannot save ${EXT[mime].toUpperCase()} files. Choose another format.`);
          setError('');
          setResult((prev) => {
            if (prev) URL.revokeObjectURL(prev.url);
            return { url: URL.createObjectURL(blob), blob, width, height };
          });
        },
        mime,
        quality / 100,
      );
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [img, file, width, height, fit, background, format, quality]);

  const download = () => {
    if (!result || !file) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = `${file.name.replace(/\.[^.]+$/, '') || 'image'}-${result.width}x${result.height}.${EXT[result.blob.type] ?? 'png'}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const aspectDiffers = img && Math.abs(width / height - ratio) >= 0.01;
  const upscaled = img && (width > img.naturalWidth || height > img.naturalHeight);
  const showQuality = format === 'jpeg' || format === 'webp' || (format === 'same' && file && file.type !== 'image/png');

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
            loadFile(e.dataTransfer.files?.[0]);
          }}
          className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-label="Image to resize"
            data-testid="image-file-input"
            onChange={(e) => {
              loadFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <button type="button" onClick={() => inputRef.current?.click()} className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700">
            {file ? 'Choose another image' : 'Choose image'}
          </button>
          <p className="mt-2 text-sm text-gray-500">or drag and drop a JPG, PNG, WebP, GIF or BMP. Nothing is uploaded.</p>
          {file && img && (
            <p className="mt-2 break-all text-sm text-gray-700">
              {file.name} · {img.naturalWidth}×{img.naturalHeight}px · {formatBytes(file.size)}
            </p>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        )}

        {img && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-5">
              <div>
                <span className="mb-2 block text-sm font-medium text-gray-700">Scale by percentage</span>
                <div className="flex flex-wrap gap-2">
                  {[25, 50, 75, 100, 150, 200].map((p) => (
                    <button key={p} type="button" onClick={() => scaleTo(p)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:border-blue-500 hover:bg-blue-50">
                      {p}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="rs-width" className="mb-1 block text-sm font-medium text-gray-700">
                    Width (px)
                  </label>
                  <input
                    id="rs-width"
                    type="number"
                    min={1}
                    max={MAX_SIDE}
                    value={width}
                    onChange={(e) => changeWidth(e.target.valueAsNumber)}
                    className="w-full rounded-lg border border-gray-300 p-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="rs-height" className="mb-1 block text-sm font-medium text-gray-700">
                    Height (px)
                  </label>
                  <input
                    id="rs-height"
                    type="number"
                    min={1}
                    max={MAX_SIDE}
                    value={height}
                    onChange={(e) => changeHeight(e.target.valueAsNumber)}
                    className="w-full rounded-lg border border-gray-300 p-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={lock}
                  onChange={(e) => {
                    setLock(e.target.checked);
                    if (e.target.checked) setHeight(clampSide(width / ratio));
                  }}
                  className="h-4 w-4 rounded"
                />
                Lock aspect ratio
              </label>

              <div>
                <label htmlFor="rs-preset" className="mb-1 block text-sm font-medium text-gray-700">
                  Social media size
                </label>
                <select
                  id="rs-preset"
                  value={preset}
                  onChange={(e) => applyPreset(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Custom size</option>
                  {PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.width}×{p.height})
                    </option>
                  ))}
                </select>
              </div>

              {aspectDiffers && (
                <fieldset>
                  <legend className="mb-1 text-sm font-medium text-gray-700">When the shape changes</legend>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-700">
                    {(
                      [
                        ['cover', 'Crop to fill'],
                        ['contain', 'Fit inside (add background)'],
                        ['stretch', 'Stretch'],
                      ] as [Fit, string][]
                    ).map(([v, l]) => (
                      <label key={v} className="flex items-center gap-2">
                        <input type="radio" name="rs-fit" value={v} checked={fit === v} onChange={() => setFit(v)} />
                        {l}
                      </label>
                    ))}
                  </div>
                  {fit === 'contain' && (
                    <label className="mt-2 flex items-center gap-2 text-sm text-gray-700">
                      Background
                      <input type="color" value={background} onChange={(e) => setBackground(e.target.value)} className="h-8 w-12 rounded border border-gray-300" />
                    </label>
                  )}
                </fieldset>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="rs-format" className="mb-1 block text-sm font-medium text-gray-700">
                    Format
                  </label>
                  <select
                    id="rs-format"
                    value={format}
                    onChange={(e) => setFormat(e.target.value as OutputFormat)}
                    className="w-full rounded-lg border border-gray-300 p-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="same">Same as original</option>
                    <option value="jpeg">JPEG</option>
                    <option value="png">PNG</option>
                    <option value="webp">WebP</option>
                  </select>
                </div>
                {showQuality && (
                  <div>
                    <label htmlFor="rs-quality" className="mb-1 block text-sm font-medium text-gray-700">
                      Quality: {quality}%
                    </label>
                    <input id="rs-quality" type="range" min={10} max={100} step={5} value={quality} onChange={(e) => setQuality(e.target.valueAsNumber)} className="w-full" />
                  </div>
                )}
              </div>
              {upscaled && <p className="text-sm text-amber-700">Enlarging beyond the original size can make the image look soft.</p>}
            </div>

            <div>
              <h2 className="mb-2 text-sm font-medium text-gray-700">Result</h2>
              <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-gray-200 bg-[repeating-conic-gradient(#f3f4f6_0_25%,#fff_0_50%)] bg-[length:20px_20px] p-3">
                {result && <img src={result.url} alt="Resized preview" className="max-h-[420px] max-w-full object-contain" />}
              </div>
              {result && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-gray-700" data-testid="resize-result">
                    {result.width}×{result.height}px · {(EXT[result.blob.type] ?? 'png').toUpperCase()} · {formatBytes(result.blob.size)}
                  </p>
                  <button type="button" onClick={download} className="rounded-lg bg-green-600 px-5 py-2 font-medium text-white hover:bg-green-700">
                    Download
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
