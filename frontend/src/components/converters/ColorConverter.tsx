import { useId, useState } from 'react';
import { CopyButton } from './UnitConverter';

type Rgb = { r: number; g: number; b: number };
type Field = 'hex' | 'r' | 'g' | 'b' | 'h' | 's' | 'l';
type Drafts = Record<Field, string>;

function parseHex(input: string): Rgb | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input.trim());
  if (!m) return null;
  const hex = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
  return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
}

const toHex = ({ r, g, b }: Rgb) => `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`.toUpperCase();

function rgbToHsl({ r, g, b }: Rgb) {
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

function hslToRgb(h: number, s: number, l: number): Rgb {
  const sn = s / 100;
  const ln = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => ln - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}

function rgbToHsv({ r, g, b }: Rgb) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const d = max - Math.min(rn, gn, bn);
  let h = 0;
  if (d) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
  }
  return { h: Math.round((h * 60 + 360) % 360), s: Math.round(max ? (d / max) * 100 : 0), v: Math.round(max * 100) };
}

function rgbToCmyk({ r, g, b }: Rgb) {
  const k = 1 - Math.max(r, g, b) / 255;
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  const c = (1 - r / 255 - k) / (1 - k);
  const m = (1 - g / 255 - k) / (1 - k);
  const y = (1 - b / 255 - k) / (1 - k);
  return { c: Math.round(c * 100), m: Math.round(m * 100), y: Math.round(y * 100), k: Math.round(k * 100) };
}

function luminance({ r, g, b }: Rgb) {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

function draftsFrom(rgb: Rgb, hsl = rgbToHsl(rgb)): Drafts {
  return { hex: toHex(rgb), r: String(rgb.r), g: String(rgb.g), b: String(rgb.b), h: String(hsl.h), s: String(hsl.s), l: String(hsl.l) };
}

const limits: Record<Exclude<Field, 'hex'>, number> = { r: 255, g: 255, b: 255, h: 360, s: 100, l: 100 };

const inputClass =
  'w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function ColorConverter() {
  const id = useId();
  const initial = { r: 37, g: 99, b: 235 };
  const [rgb, setRgb] = useState<Rgb>(initial);
  const [drafts, setDrafts] = useState<Drafts>(draftsFrom(initial));
  const [invalid, setInvalid] = useState<Field | null>(null);

  const apply = (next: Rgb, edited: Field | null, hsl?: { h: number; s: number; l: number }) => {
    setRgb(next);
    setDrafts((prev) => {
      const fresh = draftsFrom(next, hsl);
      return edited ? { ...fresh, [edited]: prev[edited] } : fresh;
    });
  };

  const onHex = (value: string) => {
    setDrafts((prev) => ({ ...prev, hex: value }));
    const parsed = parseHex(value);
    if (parsed) {
      setInvalid(null);
      setRgb(parsed);
      setDrafts((prev) => ({ ...draftsFrom(parsed), hex: prev.hex }));
    } else setInvalid('hex');
  };

  const onChannel = (field: Exclude<Field, 'hex'>, value: string) => {
    setDrafts((prev) => ({ ...prev, [field]: value }));
    const n = Number(value);
    if (value.trim() === '' || !Number.isFinite(n) || n < 0 || n > limits[field]) {
      setInvalid(field);
      return;
    }
    setInvalid(null);
    const v = Math.round(n);
    if (field === 'r' || field === 'g' || field === 'b') {
      apply({ ...rgb, [field]: v }, field);
    } else {
      const hsl = { h: Number(drafts.h) || 0, s: Number(drafts.s) || 0, l: Number(drafts.l) || 0, [field]: v };
      apply(hslToRgb(hsl.h % 360, hsl.s, hsl.l), field, hsl);
    }
  };

  const hex = toHex(rgb);
  const hsl = rgbToHsl(rgb);
  const hsv = rgbToHsv(rgb);
  const cmyk = rgbToCmyk(rgb);
  const lum = luminance(rgb);
  const onWhite = contrast(lum, 1);
  const onBlack = contrast(lum, 0);

  const outputs = [
    { label: 'HEX', value: hex },
    { label: 'RGB', value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
    { label: 'HSL', value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
    { label: 'HSV / HSB', value: `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)` },
    { label: 'CMYK', value: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)` },
  ];

  const channel = (field: Exclude<Field, 'hex'>, label: string) => (
    <div className="min-w-0">
      <label htmlFor={`${id}-${field}`} className="mb-1 block text-xs text-gray-600">
        {label} (0–{limits[field]})
      </label>
      <input
        id={`${id}-${field}`}
        type="number"
        inputMode="numeric"
        min={0}
        max={limits[field]}
        value={drafts[field]}
        aria-invalid={invalid === field}
        onChange={(e) => onChannel(field, e.target.value)}
        className={`${inputClass} ${invalid === field ? 'border-red-400' : ''}`}
      />
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
        <div
          className="h-28 w-full rounded-xl border border-gray-200 shadow-inner sm:w-40"
          style={{ backgroundColor: hex }}
          role="img"
          aria-label={`Color preview ${hex}`}
          data-testid="color-preview"
        />
        <div className="min-w-0 space-y-2">
          <label htmlFor={`${id}-hex`} className="block text-sm font-medium text-gray-700">
            HEX color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              aria-label="Pick a color"
              value={hex.toLowerCase()}
              onChange={(e) => {
                setInvalid(null);
                apply(parseHex(e.target.value)!, null);
              }}
              className="h-12 w-14 flex-none cursor-pointer rounded-lg border border-gray-300 bg-white p-1"
            />
            <input
              id={`${id}-hex`}
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={drafts.hex}
              aria-invalid={invalid === 'hex'}
              aria-describedby={`${id}-hex-help`}
              onChange={(e) => onHex(e.target.value)}
              className={`${inputClass} font-mono ${invalid === 'hex' ? 'border-red-400' : ''}`}
              placeholder="#2563EB"
            />
          </div>
          <p id={`${id}-hex-help`} className={`text-xs ${invalid === 'hex' ? 'font-medium text-red-700' : 'text-gray-500'}`} data-testid="hex-help">
            {invalid === 'hex' ? 'Enter a 3- or 6-digit hex code such as #F00 or #FF0000.' : 'Accepts #RGB or #RRGGBB, with or without #.'}
          </p>
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-gray-700">RGB</legend>
        <div className="grid grid-cols-3 gap-3">
          {channel('r', 'Red')}
          {channel('g', 'Green')}
          {channel('b', 'Blue')}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-gray-700">HSL</legend>
        <div className="grid grid-cols-3 gap-3">
          {channel('h', 'Hue °')}
          {channel('s', 'Sat %')}
          {channel('l', 'Light %')}
        </div>
      </fieldset>
      {invalid && invalid !== 'hex' && (
        <p className="text-sm font-medium text-red-700" aria-live="polite">
          Enter a number between 0 and {limits[invalid]}.
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm" data-testid="color-outputs">
          <tbody>
            {outputs.map((o) => (
              <tr key={o.label} className="border-t border-gray-100 first:border-t-0">
                <th scope="row" className="whitespace-nowrap px-4 py-2 font-medium text-gray-600">
                  {o.label}
                </th>
                <td className="break-all px-2 py-2 font-mono text-gray-900" data-format={o.label}>
                  {o.value}
                </td>
                <td className="px-3 py-2 text-right">
                  <CopyButton text={o.value} label="Copy" className="px-2 py-1" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600" data-testid="color-contrast">
        Contrast ratio: {onWhite.toFixed(2)}:1 on white ({onWhite >= 4.5 ? 'passes' : 'fails'} WCAG AA for body text), {onBlack.toFixed(2)}:1 on black (
        {onBlack >= 4.5 ? 'passes' : 'fails'}). CMYK values are a simple device-independent conversion; print colors depend on the printer profile.
      </p>
    </div>
  );
}
