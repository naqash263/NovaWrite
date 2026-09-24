import { useId, useState } from 'react';
import { CopyButton } from './UnitConverter';

type ConversionType = 'case' | 'url' | 'base64' | 'binary';
type CaseType = 'upper' | 'lower' | 'title' | 'sentence' | 'camel' | 'pascal' | 'snake' | 'kebab' | 'constant';
type Direction = 'encode' | 'decode';

const caseOptions: { id: CaseType; label: string }[] = [
  { id: 'upper', label: 'UPPERCASE' },
  { id: 'lower', label: 'lowercase' },
  { id: 'title', label: 'Title Case' },
  { id: 'sentence', label: 'Sentence case' },
  { id: 'camel', label: 'camelCase' },
  { id: 'pascal', label: 'PascalCase' },
  { id: 'snake', label: 'snake_case' },
  { id: 'kebab', label: 'kebab-case' },
  { id: 'constant', label: 'CONSTANT_CASE' },
];

const encoder = new TextEncoder();
const strictDecoder = new TextDecoder('utf-8', { fatal: true });

const capitalize = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
const words = (text: string) =>
  text
    .replace(/(\p{Ll}|\p{N})(\p{Lu})/gu, '$1 $2')
    .replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, '$1 $2')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

function convertCase(text: string, type: CaseType): string {
  switch (type) {
    case 'upper':
      return text.toUpperCase();
    case 'lower':
      return text.toLowerCase();
    case 'title':
      return text.toLowerCase().replace(/(^|[\s\-–—(["“‘/])(\p{L})/gu, (_, pre: string, ch: string) => pre + ch.toUpperCase());
    case 'sentence':
      return text
        .toLowerCase()
        .replace(/(^\s*|[.!?]\s+|\n\s*)(\p{L})/gu, (_, pre: string, ch: string) => pre + ch.toUpperCase())
        .replace(/(^|\s)i(?=[\s.,!?;:'’]|$)/g, '$1I');
    case 'camel':
      return words(text)
        .map((w, i) => (i === 0 ? w.toLowerCase() : capitalize(w)))
        .join('');
    case 'pascal':
      return words(text).map(capitalize).join('');
    case 'snake':
      return words(text).map((w) => w.toLowerCase()).join('_');
    case 'kebab':
      return words(text).map((w) => w.toLowerCase()).join('-');
    case 'constant':
      return words(text).map((w) => w.toUpperCase()).join('_');
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

function decodeUtf8(bytes: Uint8Array): string {
  try {
    return strictDecoder.decode(bytes);
  } catch {
    throw new Error('The decoded bytes are not valid UTF-8 text (the data may be a binary file).');
  }
}

function base64Decode(input: string): string {
  let clean = input.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean) || clean.length % 4 === 1) {
    throw new Error('This is not valid Base64. Base64 uses only A–Z, a–z, 0–9, +, / (or - and _) and = padding.');
  }
  clean = clean.padEnd(Math.ceil(clean.length / 4) * 4, '=');
  const binary = atob(clean);
  return decodeUtf8(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

function binaryDecode(input: string): string {
  const compact = input.trim();
  const groups = /\s/.test(compact) ? compact.split(/\s+/) : compact.match(/.{1,8}/g) ?? [];
  if (!groups.every((g) => /^[01]{1,8}$/.test(g))) {
    throw new Error('Binary input must contain only 0 and 1, in groups of up to 8 bits separated by spaces.');
  }
  if (!/\s/.test(compact) && compact.length % 8 !== 0) throw new Error('Binary without spaces must be a multiple of 8 bits long.');
  return decodeUtf8(Uint8Array.from(groups, (g) => parseInt(g, 2)));
}

function transform(text: string, type: ConversionType, caseType: CaseType, direction: Direction): string {
  if (type === 'case') return convertCase(text, caseType);
  if (type === 'url') {
    if (direction === 'encode') return encodeURIComponent(text);
    try {
      return decodeURIComponent(text);
    } catch {
      throw new Error('This is not valid URL-encoded text: every % must be followed by two hexadecimal digits that form valid UTF-8.');
    }
  }
  if (type === 'base64') return direction === 'encode' ? bytesToBase64(encoder.encode(text)) : base64Decode(text);
  return direction === 'encode'
    ? Array.from(encoder.encode(text), (b) => b.toString(2).padStart(8, '0')).join(' ')
    : binaryDecode(text);
}

const inputClass =
  'w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-3 text-base focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function TextConverter() {
  const id = useId();
  const [type, setType] = useState<ConversionType>('case');
  const [caseType, setCaseType] = useState<CaseType>('upper');
  const [direction, setDirection] = useState<Direction>('encode');
  const [input, setInput] = useState('');

  let output = '';
  let error: string | null = null;
  if (input) {
    try {
      output = transform(input, type, caseType, direction);
    } catch (e) {
      error = e instanceof Error ? e.message : 'This text could not be converted.';
    }
  }

  const download = () => {
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted-text.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const buttonClass = (active: boolean) =>
    `flex-1 rounded-lg px-5 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
      active ? 'bg-blue-600 text-white' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
    }`;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor={`${id}-type`} className="mb-1.5 block text-sm font-medium text-gray-700">
            Conversion type
          </label>
          <select id={`${id}-type`} value={type} onChange={(e) => setType(e.target.value as ConversionType)} className={inputClass}>
            <option value="case">Case converter</option>
            <option value="url">URL encode / decode</option>
            <option value="base64">Base64 encode / decode</option>
            <option value="binary">Text ↔ binary</option>
          </select>
        </div>
        {type === 'case' ? (
          <div className="min-w-0">
            <label htmlFor={`${id}-case`} className="mb-1.5 block text-sm font-medium text-gray-700">
              Case
            </label>
            <select id={`${id}-case`} value={caseType} onChange={(e) => setCaseType(e.target.value as CaseType)} className={inputClass}>
              {caseOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="min-w-0">
            <span className="mb-1.5 block text-sm font-medium text-gray-700" id={`${id}-dir`}>
              Direction
            </span>
            <div className="flex gap-2" role="group" aria-labelledby={`${id}-dir`}>
              <button type="button" aria-pressed={direction === 'encode'} onClick={() => setDirection('encode')} className={buttonClass(direction === 'encode')}>
                Encode
              </button>
              <button type="button" aria-pressed={direction === 'decode'} onClick={() => setDirection('decode')} className={buttonClass(direction === 'decode')}>
                Decode
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label htmlFor={`${id}-input`} className="text-sm font-medium text-gray-700">
            Input text
          </label>
          <span className="text-xs text-gray-500">{input.length.toLocaleString('en-US')} characters</span>
        </div>
        <textarea
          id={`${id}-input`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={6}
          spellCheck={false}
          className={`${inputClass} font-mono text-sm`}
          placeholder={type === 'case' || direction === 'encode' ? 'Type or paste text to convert…' : 'Paste encoded text to decode…'}
        />
      </div>

      <div aria-live="polite">
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700" data-testid="text-error">
            {error}
          </p>
        )}
      </div>

      <div>
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
          <label htmlFor={`${id}-output`} className="text-sm font-medium text-gray-700">
            Output
          </label>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={output} label="Copy" className="px-2.5 py-1.5" />
            <button
              type="button"
              onClick={download}
              disabled={!output}
              className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Download .txt
            </button>
            <button
              type="button"
              onClick={() => {
                setInput(output);
                if (type !== 'case') setDirection(direction === 'encode' ? 'decode' : 'encode');
              }}
              disabled={!output}
              className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Use as input
            </button>
          </div>
        </div>
        <textarea
          id={`${id}-output`}
          value={output}
          readOnly
          rows={6}
          data-testid="text-output"
          className="w-full min-w-0 rounded-lg border border-gray-300 bg-gray-50 px-3 py-3 font-mono text-sm"
          placeholder="The result appears here as you type."
        />
      </div>

      <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
        Base64 and binary use UTF-8, so emoji and non-Latin text round-trip correctly. URL encoding follows encodeURIComponent (spaces become %20).
      </p>
    </div>
  );
}
