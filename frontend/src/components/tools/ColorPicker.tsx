import { useRef, useState } from 'react';

interface RGB {
  r: number;
  g: number;
  b: number;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const toHex = ({ r, g, b }: RGB) => `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;

function parseHex(input: string): RGB | null {
  const m = input.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(m)) return { r: parseInt(m[0] + m[0], 16), g: parseInt(m[1] + m[1], 16), b: parseInt(m[2] + m[2], 16) };
  if (/^[0-9a-f]{6}$/i.test(m)) return { r: parseInt(m.slice(0, 2), 16), g: parseInt(m.slice(2, 4), 16), b: parseInt(m.slice(4, 6), 16) };
  return null;
}

function rgbToHsl({ r, g, b }: RGB) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h /= 6;
  }
  return { h: Math.round(h * 360) % 360, s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h: number, s: number, l: number): RGB {
  const sn = s / 100;
  const ln = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => ln - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}

function rgbToCmyk({ r, g, b }: RGB) {
  const k = 1 - Math.max(r, g, b) / 255;
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  const c = (1 - r / 255 - k) / (1 - k);
  const m = (1 - g / 255 - k) / (1 - k);
  const y = (1 - b / 255 - k) / (1 - k);
  return { c: Math.round(c * 100), m: Math.round(m * 100), y: Math.round(y * 100), k: Math.round(k * 100) };
}

function luminance({ r, g, b }: RGB) {
  const ch = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}
const contrast = (a: RGB, b: RGB) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const mix = (a: RGB, b: RGB, t: number): RGB => ({
  r: Math.round(a.r + (b.r - a.r) * t),
  g: Math.round(a.g + (b.g - a.g) * t),
  b: Math.round(a.b + (b.b - a.b) * t),
});

const WHITE = { r: 255, g: 255, b: 255 };
const BLACK = { r: 0, g: 0, b: 0 };

type EyeDropperCtor = new () => { open: () => Promise<{ sRGBHex: string }> };

function Swatch({ color, onPick, label }: { color: RGB; onPick: (c: RGB) => void; label?: string }) {
  const hex = toHex(color);
  return (
    <button
      type="button"
      onClick={() => onPick(color)}
      title={`Use ${hex}`}
      aria-label={`Use ${label ? `${label} ` : ''}${hex}`}
      className="group min-w-0 text-center focus:outline-none"
    >
      <span className="block h-10 w-full rounded-md border border-gray-300 group-focus-visible:ring-2 group-focus-visible:ring-blue-500" style={{ backgroundColor: hex }} />
      <span className="mt-1 block truncate font-mono text-[11px] text-gray-600">{hex}</span>
    </button>
  );
}

export default function ColorPicker() {
  const [rgb, setRgb] = useState<RGB>({ r: 59, g: 130, b: 246 });
  // Text typed in the HEX box (null = show the current colour).
  const [hexInput, setHexInput] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [imageColors, setImageColors] = useState<RGB[]>([]);
  const [hasImage, setHasImage] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const eyeDropper = typeof window !== 'undefined' ? (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper : undefined;

  const hex = toHex(rgb);
  const hsl = rgbToHsl(rgb);
  const cmyk = rgbToCmyk(rgb);

  const hexDraft = hexInput ?? hex;

  const setColor = (c: RGB, fromHexInput = false) => {
    if (!fromHexInput) setHexInput(null);
    setRgb({ r: clamp(c.r, 0, 255), g: clamp(c.g, 0, 255), b: clamp(c.b, 0, 255) });
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(`Copied ${text}`);
    } catch {
      setStatus('Copy failed. Select the value and copy it manually.');
    }
  };

  const formats = [
    { label: 'HEX', value: hex.toUpperCase() },
    { label: 'RGB', value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
    { label: 'HSL', value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
    { label: 'CMYK', value: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)` },
  ];

  const tints = [0.8, 0.6, 0.4, 0.2].map((t) => mix(rgb, WHITE, t));
  const shades = [0.2, 0.4, 0.6, 0.8].map((t) => mix(rgb, BLACK, t));
  const harmonies = [
    { label: 'Complementary', colors: [180] },
    { label: 'Analogous', colors: [-30, 30] },
    { label: 'Triadic', colors: [120, 240] },
  ];

  const loadImage = (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) {
      setStatus('Please choose an image file.');
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const scale = Math.min(1, 800 / img.naturalWidth);
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      setHasImage(true);
      // Dominant colours: bucket pixels by 4 bits per channel and keep the most common buckets.
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
      const step = Math.max(1, Math.floor(data.length / 4 / 40000)) * 4;
      for (let i = 0; i < data.length; i += step) {
        if (data[i + 3] < 128) continue;
        const key = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
        const bkt = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
        bkt.n++;
        bkt.r += data[i];
        bkt.g += data[i + 1];
        bkt.b += data[i + 2];
        buckets.set(key, bkt);
      }
      setImageColors(
        [...buckets.values()]
          .sort((a, b) => b.n - a.n)
          .slice(0, 6)
          .map((b) => ({ r: Math.round(b.r / b.n), g: Math.round(b.g / b.n), b: Math.round(b.b / b.n) })),
      );
      setStatus('Click the image to pick a colour.');
    };
    img.onerror = () => setStatus('This image could not be opened.');
    img.src = url;
  };

  const pickFromCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height);
    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
    setColor({ r, g, b });
  };

  return (
    <div className="rounded-lg bg-white p-4 shadow-lg sm:p-6">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-stretch gap-4">
              <div>
                <label htmlFor="cp-native" className="mb-2 block text-sm font-medium text-gray-700">
                  Pick a colour
                </label>
                <input id="cp-native" type="color" value={hex} onChange={(e) => setColor(parseHex(e.target.value)!)} className="h-24 w-24 cursor-pointer rounded-lg border-2 border-gray-300" />
              </div>
              <div className="min-w-0 flex-1 rounded-lg border-2 border-gray-300" style={{ backgroundColor: hex }} data-testid="color-preview" aria-hidden="true" />
            </div>
            {eyeDropper && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await new eyeDropper().open();
                    const c = parseHex(res.sRGBHex);
                    if (c) setColor(c);
                  } catch {
                    /* cancelled */
                  }
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Pick from screen (eyedropper)
              </button>
            )}

            <div>
              <label htmlFor="cp-hex" className="mb-1 block text-sm font-medium text-gray-700">
                HEX
              </label>
              <input
                id="cp-hex"
                type="text"
                value={hexDraft}
                onChange={(e) => {
                  setHexInput(e.target.value);
                  const c = parseHex(e.target.value);
                  if (c) setColor(c, true);
                }}
                aria-invalid={!parseHex(hexDraft)}
                spellCheck={false}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
              {!parseHex(hexDraft) && <p className="mt-1 text-xs text-red-700">Enter 3 or 6 hex digits, e.g. #1e90ff or #09f.</p>}
            </div>

            <fieldset>
              <legend className="mb-1 text-sm font-medium text-gray-700">RGB</legend>
              <div className="grid grid-cols-3 gap-2">
                {(['r', 'g', 'b'] as const).map((k) => (
                  <label key={k} className="text-xs text-gray-600">
                    {k.toUpperCase()}
                    <input
                      type="number"
                      min={0}
                      max={255}
                      value={rgb[k]}
                      onChange={(e) => !Number.isNaN(e.target.valueAsNumber) && setColor({ ...rgb, [k]: Math.round(e.target.valueAsNumber) })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
                    />
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-1 text-sm font-medium text-gray-700">HSL</legend>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ['h', 'H (°)', 360],
                    ['s', 'S (%)', 100],
                    ['l', 'L (%)', 100],
                  ] as const
                ).map(([k, label, max]) => (
                  <label key={k} className="text-xs text-gray-600">
                    {label}
                    <input
                      type="number"
                      min={0}
                      max={max}
                      value={hsl[k]}
                      onChange={(e) => {
                        const v = e.target.valueAsNumber;
                        if (Number.isNaN(v)) return;
                        const next = { ...hsl, [k]: clamp(Math.round(v), 0, max) };
                        setColor(hslToRgb(next.h % 360, next.s, next.l));
                      }}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
                    />
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="mb-2 text-sm font-semibold text-gray-900">Colour codes</h2>
              <ul className="space-y-2">
                {formats.map((f) => (
                  <li key={f.label} className="flex items-center gap-2">
                    <span className="w-12 flex-none text-xs font-semibold text-gray-600">{f.label}</span>
                    <code className="min-w-0 flex-1 truncate rounded bg-gray-50 px-2 py-1.5 font-mono text-sm" data-testid={`color-${f.label.toLowerCase()}`}>
                      {f.value}
                    </code>
                    <button type="button" onClick={() => copy(f.value)} aria-label={`Copy ${f.label}`} className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">
                      Copy
                    </button>
                  </li>
                ))}
              </ul>
              <p aria-live="polite" className="mt-2 min-h-[1.25rem] text-sm text-green-700">
                {status}
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-sm font-semibold text-gray-900">Contrast (WCAG 2)</h2>
              <ul className="space-y-2 text-sm">
                {[
                  { name: 'white', bg: WHITE },
                  { name: 'black', bg: BLACK },
                ].map(({ name, bg }) => {
                  const ratio = contrast(rgb, bg);
                  return (
                    <li key={name} className="flex flex-wrap items-center gap-2">
                      <span className="rounded px-2 py-1 font-medium" style={{ backgroundColor: toHex(bg), color: hex, border: '1px solid #e5e7eb' }}>
                        Text on {name}
                      </span>
                      <span className="font-mono" data-testid={`contrast-${name}`}>
                        {ratio.toFixed(2)}:1
                      </span>
                      <span className={ratio >= 4.5 ? 'text-green-700' : ratio >= 3 ? 'text-amber-700' : 'text-red-700'}>
                        {ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA large text only' : 'Fails'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-gray-900">Tints and shades</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-9">
            {tints.map((c, i) => (
              <Swatch key={`t${i}`} color={c} onPick={setColor} label="tint" />
            ))}
            <Swatch color={rgb} onPick={setColor} label="current colour" />
            {shades.map((c, i) => (
              <Swatch key={`s${i}`} color={c} onPick={setColor} label="shade" />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {harmonies.map((h) => (
            <div key={h.label}>
              <h2 className="mb-2 text-sm font-semibold text-gray-900">{h.label}</h2>
              <div className="grid grid-cols-3 gap-2">
                <Swatch color={rgb} onPick={setColor} label="current colour" />
                {h.colors.map((deg) => (
                  <Swatch key={deg} color={hslToRgb((hsl.h + deg + 360) % 360, hsl.s, hsl.l)} onPick={setColor} label={h.label.toLowerCase()} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-gray-200 p-4">
          <h2 className="mb-2 text-sm font-semibold text-gray-900">Pick a colour from an image</h2>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-label="Image to pick colours from"
            data-testid="image-file-input"
            onChange={(e) => {
              loadImage(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              loadImage(e.dataTransfer.files?.[0]);
            }}
            className="flex flex-wrap items-center gap-3"
          >
            <button type="button" onClick={() => fileRef.current?.click()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Choose image
            </button>
            <span className="text-sm text-gray-500">or drop one here. The image stays on your device.</span>
          </div>
          <canvas
            ref={canvasRef}
            onClick={pickFromCanvas}
            className={hasImage ? 'mt-3 max-h-96 max-w-full cursor-crosshair rounded border border-gray-200' : 'hidden'}
            data-testid="color-image-canvas"
          />
          {imageColors.length > 0 && (
            <div className="mt-3">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">Dominant colours</h3>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6" data-testid="image-palette">
                {imageColors.map((c, i) => (
                  <Swatch key={i} color={c} onPick={setColor} label="image colour" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
