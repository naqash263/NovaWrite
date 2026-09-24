import { useEffect, useRef, useState } from 'react';

type Algorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';
const ALGORITHMS: Algorithm[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
const WEAK: Algorithm[] = ['MD5', 'SHA-1'];

const toHex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

// MD5 (RFC 1321). Web Crypto does not provide MD5, so it is implemented here for checksums.
const MD5_S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
const MD5_K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0);

function md5(bytes: Uint8Array): string {
  const len = bytes.length;
  const padded = Math.ceil((len + 9) / 64) * 64;
  const buf = new Uint8Array(padded);
  buf.set(bytes);
  buf[len] = 0x80;
  const view = new DataView(buf.buffer);
  view.setUint32(padded - 8, (len * 8) >>> 0, true);
  view.setUint32(padded - 4, Math.floor(len / 0x20000000), true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;
  for (let off = 0; off < padded; off += 64) {
    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;
    for (let i = 0; i < 64; i++) {
      let f: number;
      let g: number;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }
      f = (f + a + MD5_K[i] + view.getUint32(off + g * 4, true)) | 0;
      a = d;
      d = c;
      c = b;
      const s = MD5_S[(i >> 4) * 4 + (i % 4)];
      b = (b + ((f << s) | (f >>> (32 - s)))) | 0;
    }
    a0 = (a0 + a) | 0;
    b0 = (b0 + b) | 0;
    c0 = (c0 + c) | 0;
    d0 = (d0 + d) | 0;
  }
  const out = new DataView(new ArrayBuffer(16));
  [a0, b0, c0, d0].forEach((v, i) => out.setUint32(i * 4, v, true));
  return toHex(new Uint8Array(out.buffer));
}

async function hashAll(data: Uint8Array): Promise<Record<Algorithm, string>> {
  const result = {} as Record<Algorithm, string>;
  for (const algo of ALGORITHMS) {
    result[algo] = algo === 'MD5' ? md5(data) : toHex(new Uint8Array(await crypto.subtle.digest(algo, data as BufferSource)));
  }
  return result;
}

const formatBytes = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(2)} MB`);

export default function HashGenerator() {
  const [mode, setMode] = useState<'text' | 'file'>('text');
  const [inputText, setInputText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [hashes, setHashes] = useState<Record<Algorithm, string> | null>(null);
  const [uppercase, setUppercase] = useState(false);
  const [expected, setExpected] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Text hashing (runs as you type; whitespace counts, so " " has its own hash).
  useEffect(() => {
    if (mode !== 'text') return;
    let cancelled = false;
    if (!inputText) {
      setHashes(null);
      return;
    }
    hashAll(new TextEncoder().encode(inputText))
      .then((h) => !cancelled && setHashes(h))
      .catch(() => !cancelled && setError('Your browser could not compute the hash. Try a current version of Chrome, Firefox, Safari or Edge.'));
    return () => {
      cancelled = true;
    };
  }, [inputText, mode]);

  const handleFile = async (f: File) => {
    setMode('file');
    setFile(f);
    setError('');
    setHashes(null);
    setProcessing(true);
    try {
      setHashes(await hashAll(new Uint8Array(await f.arrayBuffer())));
    } catch {
      setError('Could not read this file. It may be too large for your browser’s memory.');
    } finally {
      setProcessing(false);
    }
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(`${label} hash copied to clipboard.`);
    } catch {
      setStatus('Copy failed. Select the hash and copy it manually.');
    }
  };

  const show = (h: string) => (uppercase ? h.toUpperCase() : h);
  const cleanExpected = expected.trim().toLowerCase();
  const match = hashes && cleanExpected ? ALGORITHMS.find((a) => hashes[a] === cleanExpected) : undefined;

  return (
    <div className="rounded-lg bg-white p-4 shadow-lg sm:p-6">
      <div className="space-y-6">
        <div role="tablist" aria-label="Input type" className="inline-flex rounded-lg border border-gray-200 p-1">
          {(['text', 'file'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m);
                setHashes(null);
                setError('');
                if (m === 'file' && file) handleFile(file);
              }}
              className={`rounded-md px-4 py-2 text-sm font-medium ${mode === m ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              {m === 'text' ? 'Text' : 'File'}
            </button>
          ))}
        </div>

        {mode === 'text' ? (
          <div>
            <label htmlFor="hash-input" className="mb-2 block text-sm font-medium text-gray-700">
              Text to hash
            </label>
            <textarea
              id="hash-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type or paste text…"
              spellCheck={false}
              className="h-32 w-full resize-y rounded-lg border border-gray-300 p-3 font-mono focus:border-transparent focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>
                {inputText.length.toLocaleString()} characters · {new TextEncoder().encode(inputText).length.toLocaleString()} bytes (UTF-8)
              </span>
              <button type="button" onClick={() => setInputText('')} className="text-blue-700 hover:underline">
                Clear
              </button>
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            className={`rounded-lg border-2 border-dashed p-6 text-center ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              tabIndex={-1}
              aria-label="File to hash"
              data-testid="hash-file-input"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              Choose file
            </button>
            <p className="mt-2 text-sm text-gray-500">or drag and drop any file here. It is read locally and never uploaded.</p>
            {file && (
              <p className="mt-2 break-all text-sm text-gray-700">
                {file.name} · {formatBytes(file.size)}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={uppercase} onChange={(e) => setUppercase(e.target.checked)} className="h-4 w-4 rounded" />
            Uppercase hex
          </label>
        </div>

        {processing && (
          <p className="text-sm text-gray-600">
            Hashing file…
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <div className="space-y-3" data-testid="hash-results">
          {ALGORITHMS.map((algo) => (
            <div key={algo} className="rounded-lg border border-gray-200 p-3">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-gray-900">
                  {algo}
                  {WEAK.includes(algo) && <span className="ml-2 text-xs font-normal text-amber-700">checksums only, not for security</span>}
                </span>
                <button
                  type="button"
                  disabled={!hashes}
                  onClick={() => hashes && copy(show(hashes[algo]), algo)}
                  aria-label={`Copy ${algo} hash`}
                  className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  Copy
                </button>
              </div>
              <code data-testid={`hash-${algo}`} className="block min-h-[1.25rem] break-all font-mono text-sm text-gray-900">
                {hashes ? show(hashes[algo]) : ''}
              </code>
            </div>
          ))}
        </div>
        <p aria-live="polite" className="min-h-[1.25rem] text-sm text-green-700">
          {status}
        </p>

        <div>
          <label htmlFor="hash-expected" className="mb-2 block text-sm font-medium text-gray-700">
            Verify against an expected hash (optional)
          </label>
          <input
            id="hash-expected"
            type="text"
            value={expected}
            onChange={(e) => setExpected(e.target.value)}
            placeholder="Paste a checksum to compare"
            spellCheck={false}
            className="w-full rounded-lg border border-gray-300 p-3 font-mono text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
          />
          {cleanExpected && hashes && (
            <p
              data-testid="hash-verify"
              className={`mt-2 text-sm font-medium ${match ? 'text-green-700' : 'text-red-700'}`}
            >
              {match ? `Match: the ${match} hash is identical.` : 'No match with any of the hashes above.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
