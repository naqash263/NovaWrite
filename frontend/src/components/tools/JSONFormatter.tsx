import { useMemo, useRef, useState, type ChangeEvent } from 'react';

type Mode = 'beautify' | 'minify';
type Indent = '2' | '4' | 'tab';

interface JsonError {
  message: string;
  position?: number;
  line?: number;
  column?: number;
  suggestion: string;
}

const SAMPLE = `{"name":"Ada Lovelace","born":1815,"languages":["English","French"],"address":{"city":"London","country":"UK"},"active":true,"notes":null}`;

/** Converts an offset in `text` to a 1-based line / column pair. */
function lineCol(text: string, position: number) {
  const before = text.slice(0, position).split('\n');
  return { line: before.length, column: before[before.length - 1].length + 1 };
}

/** Normalises JSON.parse errors from Chromium, Firefox and WebKit into one shape. */
function describeJsonError(err: unknown, text: string): JsonError {
  const message = err instanceof Error ? err.message : String(err);
  let position: number | undefined;
  let line: number | undefined;
  let column: number | undefined;

  const pos = message.match(/position (\d+)/i);
  if (pos) {
    position = Number(pos[1]);
    ({ line, column } = lineCol(text, position));
  }
  const lc = message.match(/line (\d+) column (\d+)/i);
  if (lc) {
    line = Number(lc[1]);
    column = Number(lc[2]);
  }
  if (position === undefined && line !== undefined && column !== undefined) {
    const lines = text.split('\n');
    position = lines.slice(0, line - 1).reduce((n, l) => n + l.length + 1, 0) + column - 1;
  }

  const m = message.toLowerCase();
  let suggestion = 'Check the JSON syntax: keys and strings need double quotes, and trailing commas or comments are not allowed.';
  if (m.includes('property name')) suggestion = 'Property names must be wrapped in double quotes, e.g. "key": "value". A trailing comma before } also causes this.';
  else if (m.includes('unexpected end') || m.includes('end of data')) suggestion = 'The JSON ends too early. Check for a missing closing bracket, brace or quote.';
  else if (m.includes('unterminated string') || m.includes('bad control character')) suggestion = 'A string is not closed or contains a raw line break. Close the quote or escape line breaks as \\n.';
  else if (m.includes('bad escaped') || m.includes('bad escape')) suggestion = 'Invalid escape sequence. Valid escapes are \\n, \\t, \\", \\\\, \\/ and \\uXXXX.';
  else if (m.includes("expected ','") || m.includes('after property value') || m.includes('after array element')) suggestion = 'A comma is missing between two values, or a closing bracket is missing.';
  else if (m.includes("'") && m.includes('unexpected token')) suggestion = 'Unexpected character. Single quotes, comments and unquoted words are not valid JSON.';
  else if (m.includes('non-whitespace')) suggestion = 'There is extra content after the JSON value. Wrap multiple values in an array.';

  return { message, position, line, column, suggestion };
}

/** Index of the next character that is not whitespace or a comment. */
function skipSpace(text: string, i: number) {
  while (i < text.length) {
    if (/\s/.test(text[i])) i++;
    else if (text.startsWith('//', i)) {
      const nl = text.indexOf('\n', i);
      i = nl === -1 ? text.length : nl;
    } else if (text.startsWith('/*', i)) {
      const end = text.indexOf('*/', i + 2);
      i = end === -1 ? text.length : end + 2;
    } else break;
  }
  return i;
}

/**
 * Repairs common "almost JSON" input (JavaScript object literals): comments, single-quoted
 * strings, unquoted keys and trailing commas. String contents are never modified.
 */
function repairJson(text: string): string {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === '"' || c === "'") {
      let j = i + 1;
      let s = '';
      while (j < text.length && text[j] !== c) {
        if (text[j] === '\\' && j + 1 < text.length) {
          const next = text[j + 1];
          s += c === "'" && next === "'" ? "'" : text[j] + next;
          j += 2;
          continue;
        }
        s += c === "'" && text[j] === '"' ? '\\"' : text[j];
        j++;
      }
      out += `"${s}"`;
      i = j + 1;
      continue;
    }
    if (text.startsWith('//', i) || text.startsWith('/*', i)) {
      i = skipSpace(text, i);
      continue;
    }
    if (/[A-Za-z_$]/.test(c)) {
      let j = i;
      while (j < text.length && /[\w$]/.test(text[j])) j++;
      const word = text.slice(i, j);
      const after = skipSpace(text, j);
      out += text[after] === ':' && !['true', 'false', 'null'].includes(word) ? `"${word}"` : word;
      i = j;
      continue;
    }
    if (c === ',') {
      const next = text[skipSpace(text, i + 1)];
      if (next === '}' || next === ']' || next === undefined) {
        i++;
        continue;
      }
    }
    out += c;
    i++;
  }
  return out;
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((k) => [k, sortKeys((value as Record<string, unknown>)[k])]),
    );
  }
  return value;
}

function downloadText(text: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const btn = 'rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export default function JSONFormatter() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('beautify');
  const [indent, setIndent] = useState<Indent>('2');
  const [sort, setSort] = useState(false);
  const [notice, setNotice] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const result = useMemo((): { output: string; error: JsonError | null } => {
    if (!input.trim()) return { output: '', error: null };
    try {
      let parsed: unknown = JSON.parse(input);
      if (sort) parsed = sortKeys(parsed);
      const space = mode === 'minify' ? undefined : indent === 'tab' ? '\t' : Number(indent);
      return { output: JSON.stringify(parsed, null, space), error: null };
    } catch (err) {
      return { output: '', error: describeJsonError(err, input) };
    }
  }, [input, mode, indent, sort]);

  const { output, error } = result;
  const repaired = useMemo(() => (error ? repairJson(input) : input), [error, input]);
  const canRepair = Boolean(error) && repaired !== input;

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

  const goToError = () => {
    const el = textareaRef.current;
    if (!el || error?.position === undefined) return;
    el.focus();
    el.setSelectionRange(error.position, Math.min(error.position + 1, input.length));
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      flash('File is larger than 20 MB.');
      return;
    }
    setInput(await file.text());
    flash(`Loaded ${file.name}.`);
  };

  const inputBytes = new Blob([input]).size;
  const outputBytes = new Blob([output]).size;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Output style" className="inline-flex rounded-lg border border-slate-300 p-0.5">
          {(['beautify', 'minify'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={`${btn} py-1.5 ${mode === m ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              {m === 'beautify' ? 'Beautify' : 'Minify'}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          Indent
          <select
            value={indent}
            onChange={(e) => setIndent(e.target.value as Indent)}
            disabled={mode === 'minify'}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="tab">Tab</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={sort} onChange={(e) => setSort(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
          Sort keys A–Z
        </label>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <button type="button" onClick={() => setInput(SAMPLE)} className={`${btn} bg-slate-100 text-slate-800 hover:bg-slate-200`}>
            Load sample
          </button>
          <label className={`${btn} cursor-pointer bg-slate-100 text-slate-800 hover:bg-slate-200 focus-within:ring-2 focus-within:ring-blue-500`}>
            Open file
            <input type="file" accept=".json,application/json,text/plain" onChange={onFile} className="sr-only" />
          </label>
          <button type="button" onClick={() => setInput('')} disabled={!input} className={`${btn} bg-slate-100 text-slate-800 hover:bg-slate-200`}>
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor="json-input" className="mb-1.5 block text-sm font-medium text-slate-700">
            JSON input
          </label>
          <textarea
            id="json-input"
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'json-error' : undefined}
            placeholder={'Paste JSON here, e.g. {"key": "value"}'}
            className={`h-80 w-full resize-y rounded-lg border p-3 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-300 bg-red-50/40' : 'border-slate-300'
            }`}
          />
          <p className="mt-1 text-xs text-slate-500">
            {input.length.toLocaleString()} characters · {inputBytes.toLocaleString()} bytes
          </p>
        </div>

        <div className="min-w-0">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label htmlFor="json-output" className="block text-sm font-medium text-slate-700">
              {mode === 'minify' ? 'Minified JSON' : 'Formatted JSON'}
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => copy(output)} disabled={!output} className={`${btn} bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700`}>
                Copy
              </button>
              <button
                type="button"
                onClick={() => downloadText(output, mode === 'minify' ? 'data.min.json' : 'data.json', 'application/json')}
                disabled={!output}
                className={`${btn} bg-slate-100 px-3 py-1 text-xs text-slate-800 hover:bg-slate-200`}
              >
                Download
              </button>
            </div>
          </div>
          <textarea
            id="json-output"
            value={output}
            readOnly
            spellCheck={false}
            placeholder="Formatted JSON appears here as you type."
            className="h-80 w-full resize-y rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-slate-500">
            {output ? `${output.split('\n').length.toLocaleString()} lines · ${outputBytes.toLocaleString()} bytes` : ' '}
          </p>
        </div>
      </div>

      {output && !error && (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800" data-testid="json-valid">
          Valid JSON{inputBytes > 0 && mode === 'minify' ? ` · ${Math.max(0, Math.round((1 - outputBytes / inputBytes) * 100))}% smaller than the input` : ''}
        </p>
      )}

      {error && (
        <div id="json-error" role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          <p className="font-semibold">
            Invalid JSON{error.line !== undefined ? ` at line ${error.line}${error.column !== undefined ? `, column ${error.column}` : ''}` : ''}
          </p>
          <p className="mt-1 break-words font-mono text-xs">{error.message}</p>
          <p className="mt-2">{error.suggestion}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {error.position !== undefined && (
              <button type="button" onClick={goToError} className={`${btn} bg-white px-3 py-1.5 text-red-800 ring-1 ring-red-200 hover:bg-red-100`}>
                Go to error
              </button>
            )}
            {canRepair && (
              <button type="button" onClick={() => setInput(repaired)} className={`${btn} bg-orange-600 px-3 py-1.5 text-white hover:bg-orange-700`}>
                Auto-fix common issues
              </button>
            )}
          </div>
        </div>
      )}

      <p aria-live="polite" className="mt-2 min-h-[1.25rem] text-sm text-slate-600">
        {notice}
      </p>
    </div>
  );
}
