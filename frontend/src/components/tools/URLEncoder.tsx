import { useMemo, useState } from 'react';

type Mode = 'encode' | 'decode';
type Scope = 'component' | 'uri';

const btn = 'rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

function encode(text: string, scope: Scope, plusForSpace: boolean) {
  const encoded = scope === 'component' ? encodeURIComponent(text) : encodeURI(text);
  return plusForSpace ? encoded.replace(/%20/g, '+') : encoded;
}

function decode(text: string, plusAsSpace: boolean) {
  const source = plusAsSpace ? text.replace(/\+/g, ' ') : text;
  try {
    return decodeURIComponent(source);
  } catch {
    const bad = source.match(/%(?![0-9A-Fa-f]{2})..?|%$/)?.[0];
    throw new Error(
      bad
        ? `"${bad}" is not a valid percent-escape. A % must be followed by two hexadecimal digits (use %25 for a literal %).`
        : 'The percent-escapes do not form valid UTF-8 text.',
    );
  }
}

/** Splits a URL or query string into decoded key/value pairs (for the parameter table). */
function queryParams(text: string): [string, string][] {
  const trimmed = text.trim();
  if (!trimmed.includes('=')) return [];
  let query = trimmed;
  try {
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) query = new URL(trimmed).search;
    else if (trimmed.includes('?')) query = trimmed.slice(trimmed.indexOf('?'));
  } catch {
    return [];
  }
  if (/\s/.test(query.replace(/^\?/, ''))) return [];
  try {
    return Array.from(new URLSearchParams(query.replace(/#.*$/, '')).entries()).slice(0, 100);
  } catch {
    return [];
  }
}

export default function URLEncoder() {
  const [mode, setMode] = useState<Mode>('encode');
  const [input, setInput] = useState('');
  const [scope, setScope] = useState<Scope>('component');
  const [plus, setPlus] = useState(false);
  const [notice, setNotice] = useState('');

  const result = useMemo(() => {
    if (!input) return { output: '', error: '' };
    try {
      return { output: mode === 'encode' ? encode(input, scope, plus) : decode(input, plus), error: '' };
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      return {
        output: '',
        error: mode === 'encode' ? 'This text contains an unpaired surrogate character and cannot be URL-encoded.' : `Cannot decode: ${msg}`,
      };
    }
  }, [input, mode, scope, plus]);

  const params = useMemo(() => queryParams(mode === 'decode' ? input : result.output || input), [input, mode, result.output]);

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

  const swap = () => {
    if (!result.output) return;
    setInput(result.output);
    setMode(mode === 'encode' ? 'decode' : 'encode');
  };

  const encoding = mode === 'encode';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div role="group" aria-label="Mode" className="mb-4 grid grid-cols-2 gap-2">
        {(['encode', 'decode'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
            className={`${btn} py-2.5 ${mode === m ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            {m === 'encode' ? 'Encode' : 'Decode'}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-700">
        {encoding && (
          <label className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
            Encode as
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as Scope)}
              className="min-w-0 max-w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="component">Component – query value (encodeURIComponent)</option>
              <option value="uri">Full URL (encodeURI)</option>
            </select>
          </label>
        )}
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={plus} onChange={(e) => setPlus(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
          {encoding ? 'Encode spaces as + (form encoding)' : 'Treat + as a space (form encoding)'}
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor="url-input" className="mb-1.5 block text-sm font-medium text-slate-700">
            {encoding ? 'Text or URL to encode' : 'Encoded text to decode'}
          </label>
          <textarea
            id="url-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            aria-invalid={Boolean(result.error)}
            aria-describedby={result.error ? 'url-error' : undefined}
            placeholder={encoding ? 'e.g. café & crème?size=large' : 'e.g. caf%C3%A9%20%26%20cr%C3%A8me'}
            className="h-48 w-full resize-y rounded-lg border border-slate-300 p-3 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-slate-500">{input.length.toLocaleString()} characters</p>
        </div>
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label htmlFor="url-output" className="block text-sm font-medium text-slate-700">
              {encoding ? 'Encoded result' : 'Decoded text'}
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => copy(result.output)} disabled={!result.output} className={`${btn} bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700`}>
                Copy
              </button>
              <button type="button" onClick={swap} disabled={!result.output} className={`${btn} bg-slate-100 px-3 py-1 text-xs text-slate-800 hover:bg-slate-200`}>
                Swap
              </button>
            </div>
          </div>
          <textarea
            id="url-output"
            value={result.output}
            readOnly
            spellCheck={false}
            placeholder="The result appears here as you type."
            className="h-48 w-full resize-y rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-slate-500">{result.output.length.toLocaleString()} characters</p>
        </div>
      </div>

      {result.error && (
        <div id="url-error" role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {result.error}
        </div>
      )}

      {params.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-0 table-fixed text-left text-sm" data-testid="url-params">
            <caption className="bg-slate-50 px-3 py-2 text-left text-sm font-medium text-slate-700">Query parameters (decoded)</caption>
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th scope="col" className="w-1/3 px-3 py-2">Name</th>
                <th scope="col" className="px-3 py-2">Value</th>
              </tr>
            </thead>
            <tbody>
              {params.map(([k, v], i) => (
                <tr key={`${k}-${i}`} className="border-t border-slate-100">
                  <td className="break-all px-3 py-1.5 font-mono">{k}</td>
                  <td className="break-all px-3 py-1.5 font-mono">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setInput('')} disabled={!input} className={`${btn} bg-slate-100 text-slate-800 hover:bg-slate-200`}>
          Clear
        </button>
      </div>

      <p aria-live="polite" className="mt-2 min-h-[1.25rem] text-sm text-slate-600">
        {notice}
      </p>
    </div>
  );
}
