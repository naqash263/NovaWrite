import { useMemo, useState, type ChangeEvent } from 'react';

type Indent = '2' | '4' | 'tab';

const SAMPLE = `/* Buttons */
.btn,.btn-primary:hover{color:#fff;background:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'/>") no-repeat;padding:4px 8px}
a:not([href^="http"])>span::after{content:"; {not a rule}";margin:0 auto!important}
@media (max-width:600px){.card{width:calc(100% - 2rem);grid-template-columns:repeat(2,minmax(0,1fr))}}`;

/** Applies `fn` only to the parts of `s` that are outside quoted strings. */
function outsideStrings(s: string, fn: (part: string) => string) {
  return s
    .split(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/)
    .map((part, i) => (i % 2 ? part : fn(part)))
    .join('');
}

/** Index of the first ':' that is not inside a string or parentheses, or -1. */
function topLevelColon(s: string) {
  let depth = 0;
  let quote = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = '';
    } else if (c === '"' || c === "'") quote = c;
    else if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === ':' && depth === 0) return i;
  }
  return -1;
}

function splitSelectors(s: string) {
  const parts: string[] = [];
  let depth = 0;
  let quote = '';
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = '';
    } else if (c === '"' || c === "'") quote = c;
    else if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (c === ',' && depth === 0) {
      parts.push(s.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(s.slice(start).trim());
  return parts.filter(Boolean);
}

/**
 * Formats or minifies CSS with a small tokenizer that understands comments, strings and
 * parentheses, so selectors like a:hover, url(data:…;…) values and quoted content survive intact.
 */
function processCss(css: string, unit: string, minify: boolean): { output: string; errors: string[] } {
  const errors: string[] = [];
  const lines: string[] = [];
  let min = '';
  let buf = '';
  let depth = 0;
  let paren = 0;
  let line = 1;
  let stmtLine = 1;
  const ind = () => unit.repeat(depth);

  const append = (s: string) => {
    if (!buf.trim()) stmtLine = line;
    buf += s;
  };

  const flushDeclaration = () => {
    const stmt = buf.trim();
    buf = '';
    if (!stmt) return;
    if (stmt.startsWith('@')) {
      if (minify) min += `${outsideStrings(stmt, (p) => p.replace(/\s*,\s*/g, ','))};`;
      else lines.push(`${ind()}${stmt};`);
      return;
    }
    const colon = topLevelColon(stmt);
    if (colon === -1) {
      errors.push(`Line ${stmtLine}: "${stmt.slice(0, 40)}" is missing a ':' between property and value.`);
      if (minify) min += `${stmt};`;
      else lines.push(`${ind()}${stmt};`);
      return;
    }
    const prop = stmt.slice(0, colon).trim();
    const value = stmt.slice(colon + 1).trim();
    if (depth === 0) errors.push(`Line ${stmtLine}: declaration "${prop}" is outside of any rule.`);
    if (minify) {
      const v = outsideStrings(value, (p) => p.replace(/\s*,\s*/g, ',').replace(/\s*!\s*important/gi, '!important').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')'));
      min += `${prop}:${v};`;
    } else {
      lines.push(`${ind()}${prop}: ${outsideStrings(value, (p) => p.replace(/\s*!\s*important/gi, ' !important'))};`);
    }
  };

  let i = 0;
  while (i < css.length) {
    const c = css[i];
    if (c === '\n') line++;
    if (c === '/' && css[i + 1] === '*') {
      let end = css.indexOf('*/', i + 2);
      if (end === -1) {
        errors.push(`Line ${line}: comment is never closed with */.`);
        end = css.length;
      }
      const comment = css.slice(i, end + 2);
      line += (comment.match(/\n/g) || []).length;
      i = end + 2;
      if (minify) {
        if (comment.startsWith('/*!')) min += comment;
      } else if (buf.trim()) append(` ${comment} `);
      else lines.push(...comment.split('\n').map((l, n) => (n === 0 ? ind() + l.trim() : `${ind()} ${l.trim()}`)));
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < css.length && css[j] !== c && css[j] !== '\n') j += css[j] === '\\' ? 2 : 1;
      if (css[j] !== c) errors.push(`Line ${line}: string is not closed.`);
      append(css.slice(i, j + 1));
      i = j + 1;
      continue;
    }
    if (/\s/.test(c)) {
      if (buf && !buf.endsWith(' ')) buf += ' ';
      i++;
      continue;
    }
    if (c === '(') paren++;
    if (c === ')') paren = Math.max(0, paren - 1);
    if (paren === 0 && c === '{') {
      const sel = buf.trim().replace(/\s+/g, ' ');
      buf = '';
      if (!sel) errors.push(`Line ${line}: '{' has no selector before it.`);
      if (minify) {
        min += sel.startsWith('@')
          ? outsideStrings(sel, (p) => p.replace(/\s*,\s*/g, ',').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')'))
          : outsideStrings(sel, (p) => p.replace(/\s*([,>~+])\s*/g, '$1'));
        min += '{';
      } else {
        const selectors = sel.startsWith('@') ? [sel] : splitSelectors(sel);
        lines.push(`${ind()}${selectors.join(`,\n${ind()}`)} {`);
      }
      depth++;
      i++;
      continue;
    }
    if (paren === 0 && c === '}') {
      flushDeclaration();
      if (depth === 0) {
        errors.push(`Line ${line}: unexpected '}' with no matching '{'.`);
      } else {
        depth--;
        if (minify) min = `${min.replace(/;$/, '')}}`;
        else {
          lines.push(`${ind()}}`);
          if (depth === 0) lines.push('');
        }
      }
      i++;
      continue;
    }
    if (paren === 0 && c === ';') {
      flushDeclaration();
      i++;
      continue;
    }
    append(c);
    i++;
  }
  if (buf.trim()) {
    if (depth === 0 && !buf.trim().startsWith('@')) errors.push(`Line ${stmtLine}: "${buf.trim().slice(0, 40)}" is not followed by a '{' block.`);
    flushDeclaration();
  }
  if (depth > 0) errors.push(`${depth} rule block${depth === 1 ? ' is' : 's are'} not closed – add the missing '}'.`);
  return { output: minify ? min : lines.join('\n').replace(/\n+$/, ''), errors };
}

function downloadText(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/css' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const btn = 'rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export default function CSSFormatter() {
  const [input, setInput] = useState('');
  const [indent, setIndent] = useState<Indent>('2');
  const [minify, setMinify] = useState(false);
  const [notice, setNotice] = useState('');

  const result = useMemo(() => {
    if (!input.trim()) return { output: '', errors: [] as string[] };
    return processCss(input, indent === 'tab' ? '\t' : ' '.repeat(Number(indent)), minify);
  }, [input, indent, minify]);

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

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      flash('Files up to 5 MB are supported.');
      return;
    }
    setInput(await file.text());
  };

  const inBytes = new Blob([input]).size;
  const outBytes = new Blob([result.output]).size;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Output style" className="inline-flex rounded-lg border border-slate-300 p-0.5">
          {[false, true].map((m) => (
            <button
              key={String(m)}
              type="button"
              aria-pressed={minify === m}
              onClick={() => setMinify(m)}
              className={`${btn} py-1.5 ${minify === m ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              {m ? 'Minify' : 'Beautify'}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          Indent
          <select
            value={indent}
            onChange={(e) => setIndent(e.target.value as Indent)}
            disabled={minify}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="tab">Tab</option>
          </select>
        </label>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <button type="button" onClick={() => setInput(SAMPLE)} className={`${btn} bg-slate-100 text-slate-800 hover:bg-slate-200`}>
            Load sample
          </button>
          <label className={`${btn} cursor-pointer bg-slate-100 text-slate-800 hover:bg-slate-200 focus-within:ring-2 focus-within:ring-blue-500`}>
            Open .css file
            <input type="file" accept=".css,text/css,text/plain" onChange={onFile} className="sr-only" />
          </label>
          <button type="button" onClick={() => setInput('')} disabled={!input} className={`${btn} bg-slate-100 text-slate-800 hover:bg-slate-200`}>
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor="css-input" className="mb-1.5 block text-sm font-medium text-slate-700">
            CSS input
          </label>
          <textarea
            id="css-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder="Paste CSS here, e.g. .btn{color:#fff;padding:4px}"
            className="h-80 w-full resize-y rounded-lg border border-slate-300 p-3 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-slate-500">{inBytes.toLocaleString()} bytes</p>
        </div>
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label htmlFor="css-output" className="block text-sm font-medium text-slate-700">
              {minify ? 'Minified CSS' : 'Formatted CSS'}
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => copy(result.output)} disabled={!result.output} className={`${btn} bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700`}>
                Copy
              </button>
              <button type="button" onClick={() => downloadText(result.output + '\n', minify ? 'styles.min.css' : 'styles.css')} disabled={!result.output} className={`${btn} bg-slate-100 px-3 py-1 text-xs text-slate-800 hover:bg-slate-200`}>
                Download
              </button>
            </div>
          </div>
          <textarea
            id="css-output"
            value={result.output}
            readOnly
            spellCheck={false}
            placeholder="Formatted CSS appears here as you type."
            className="h-80 w-full resize-y rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-slate-500">
            {outBytes.toLocaleString()} bytes{minify && inBytes > 0 && result.output ? ` · ${Math.max(0, Math.round((1 - outBytes / inBytes) * 100))}% smaller` : ''}
          </p>
        </div>
      </div>

      {result.errors.length > 0 && (
        <div role="alert" data-testid="css-errors" className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold">Possible syntax problems</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {result.errors.slice(0, 10).map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <p aria-live="polite" className="mt-2 min-h-[1.25rem] text-sm text-slate-600">
        {notice}
      </p>
    </div>
  );
}
