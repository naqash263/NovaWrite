import { useMemo, useState, type ChangeEvent } from 'react';

type Mode = 'encode' | 'decode';

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function toUrlSafe(b64: string) {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Decodes standard or URL-safe Base64 (whitespace and missing padding tolerated). */
function base64ToBytes(input: string): Uint8Array {
  const clean = input.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean)) {
    const bad = clean.match(/[^A-Za-z0-9+/=]/)?.[0];
    throw new Error(bad ? `"${bad}" is not a Base64 character.` : 'Padding (=) may only appear at the end.');
  }
  const unpadded = clean.replace(/=+$/, '');
  if (unpadded.length % 4 === 1) throw new Error('The Base64 string has an invalid length (one character too many or too few).');
  const padded = unpadded + '='.repeat((4 - (unpadded.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const btn = 'rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export default function Base64Encoder() {
  const [mode, setMode] = useState<Mode>('encode');
  const [input, setInput] = useState('');
  const [urlSafe, setUrlSafe] = useState(false);
  const [notice, setNotice] = useState('');
  const [file, setFile] = useState<{ name: string; type: string; base64: string; size: number } | null>(null);
  const [dataUri, setDataUri] = useState(false);

  const result = useMemo((): { output: string; error: string; bytes?: Uint8Array; binary?: boolean } => {
    if (!input) return { output: '', error: '' };
    if (mode === 'encode') {
      try {
        const b64 = bytesToBase64(new TextEncoder().encode(input));
        return { output: urlSafe ? toUrlSafe(b64) : b64, error: '' };
      } catch {
        return { output: '', error: 'This text could not be encoded.' };
      }
    }
    if (!input.trim()) return { output: '', error: '' };
    let bytes: Uint8Array;
    try {
      bytes = base64ToBytes(input.replace(/^data:[^,]*;base64,/i, ''));
    } catch (e) {
      return { output: '', error: `Invalid Base64: ${e instanceof Error ? e.message : 'could not decode.'}` };
    }
    try {
      return { output: new TextDecoder('utf-8', { fatal: true }).decode(bytes), error: '', bytes };
    } catch {
      return {
        output: '',
        error: `Decoded ${bytes.length.toLocaleString()} bytes, but they are not UTF-8 text (probably a binary file). Use "Download decoded file" to save them.`,
        bytes,
        binary: true,
      };
    }
  }, [input, mode, urlSafe]);

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice((n) => (n === msg ? '' : n)), 2500);
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flash('Copied to clipboard.');
    } catch {
      flash('Copy failed. Select the text and press Ctrl+C.');
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setFile(null);
  };

  const swap = () => {
    if (!result.output) return;
    setInput(result.output);
    setMode(mode === 'encode' ? 'decode' : 'encode');
    setFile(null);
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > MAX_FILE_BYTES) {
      flash('Files up to 10 MB are supported.');
      return;
    }
    const b64 = bytesToBase64(new Uint8Array(await f.arrayBuffer()));
    setFile({ name: f.name, type: f.type || 'application/octet-stream', base64: b64, size: f.size });
  };

  const fileOutput = file ? (dataUri ? `data:${file.type};base64,${file.base64}` : urlSafe ? toUrlSafe(file.base64) : file.base64) : '';
  const output = file ? fileOutput : result.output;
  const encoding = mode === 'encode';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div role="group" aria-label="Mode" className="mb-4 grid grid-cols-2 gap-2">
        {(['encode', 'decode'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => switchMode(m)}
            className={`${btn} py-2.5 ${mode === m ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            {m === 'encode' ? 'Encode to Base64' : 'Decode from Base64'}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-700">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={urlSafe} onChange={(e) => setUrlSafe(e.target.checked)} disabled={!encoding || dataUri} className="h-4 w-4 rounded border-slate-300" />
          URL-safe output (Base64URL, no padding)
        </label>
        {encoding && (
          <label className={`${btn} cursor-pointer bg-slate-100 text-slate-800 hover:bg-slate-200 focus-within:ring-2 focus-within:ring-blue-500`}>
            Encode a file…
            <input type="file" onChange={onFile} className="sr-only" data-testid="base64-file" />
          </label>
        )}
        {!encoding && <span className="text-xs text-slate-500">Standard and URL-safe Base64 are both accepted; whitespace and missing padding are ignored.</span>}
      </div>

      {file && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
          <span className="min-w-0 break-all">
            Encoded file <strong>{file.name}</strong> ({file.size.toLocaleString()} bytes)
          </span>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={dataUri} onChange={(e) => setDataUri(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            Output as data URI
          </label>
          <button type="button" onClick={() => setFile(null)} className="text-blue-700 underline hover:text-blue-900">
            Back to text
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {!file && (
          <div className="min-w-0">
            <label htmlFor="b64-input" className="mb-1.5 block text-sm font-medium text-slate-700">
              {encoding ? 'Text to encode' : 'Base64 to decode'}
            </label>
            <textarea
              id="b64-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
              aria-invalid={Boolean(result.error)}
              aria-describedby={result.error ? 'b64-error' : undefined}
              placeholder={encoding ? 'Type or paste text (any language, emoji supported)…' : 'Paste a Base64 string, e.g. aGVsbG8='}
              className="h-56 w-full resize-y rounded-lg border border-slate-300 p-3 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-slate-500">
              {input.length.toLocaleString()} characters · {new TextEncoder().encode(input).length.toLocaleString()} bytes (UTF-8)
            </p>
          </div>
        )}

        <div className={`min-w-0 ${file ? 'md:col-span-2' : ''}`}>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label htmlFor="b64-output" className="block text-sm font-medium text-slate-700">
              {encoding ? 'Base64 output' : 'Decoded text'}
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => copy(output)} disabled={!output} className={`${btn} bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700`}>
                Copy
              </button>
              {!file && (
                <button type="button" onClick={swap} disabled={!result.output} className={`${btn} bg-slate-100 px-3 py-1 text-xs text-slate-800 hover:bg-slate-200`}>
                  Swap
                </button>
              )}
            </div>
          </div>
          <textarea
            id="b64-output"
            value={output}
            readOnly
            spellCheck={false}
            placeholder={encoding ? 'Base64 appears here as you type.' : 'Decoded text appears here as you type.'}
            className="h-56 w-full resize-y rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-slate-500">{output.length.toLocaleString()} characters</p>
        </div>
      </div>

      {result.error && !file && (
        <div id="b64-error" role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {result.error}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {!encoding && result.bytes && (
          <button type="button" onClick={() => downloadBlob(new Blob([result.bytes as BlobPart]), 'decoded.bin')} className={`${btn} bg-slate-800 text-white hover:bg-slate-900`}>
            Download decoded file
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setInput('');
            setFile(null);
          }}
          disabled={!input && !file}
          className={`${btn} bg-slate-100 text-slate-800 hover:bg-slate-200`}
        >
          Clear
        </button>
      </div>

      <p aria-live="polite" className="mt-2 min-h-[1.25rem] text-sm text-slate-600">
        {notice}
      </p>
    </div>
  );
}
