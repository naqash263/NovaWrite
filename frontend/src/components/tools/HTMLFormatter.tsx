import { useMemo, useState, type ChangeEvent } from 'react';

type Indent = '2' | '4' | 'tab';

type Token =
  | { type: 'open'; name: string; raw: string; selfClosing: boolean; line: number }
  | { type: 'close'; name: string; raw: string; line: number }
  | { type: 'text'; text: string }
  | { type: 'comment'; raw: string }
  | { type: 'doctype'; raw: string }
  | { type: 'raw'; name: string; content: string };

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const RAW = new Set(['script', 'style', 'pre', 'textarea']);
const INLINE = new Set([
  'a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'code', 'data', 'dfn', 'em', 'i', 'img', 'input', 'kbd', 'label', 'mark', 'q', 's', 'samp',
  'small', 'span', 'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr', 'button', 'select', 'option', 'svg', 'path',
]);
/** Elements whose end tag may be omitted, and the open tags that implicitly close them. */
const IMPLICIT_CLOSE: Record<string, string[]> = {
  li: ['li'],
  dt: ['dt', 'dd'],
  dd: ['dt', 'dd'],
  option: ['option'],
  tr: ['tr', 'td', 'th'],
  td: ['td', 'th'],
  th: ['td', 'th'],
};
const OPTIONAL_END = new Set(['p', 'li', 'dt', 'dd', 'option', 'optgroup', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot', 'colgroup', 'html', 'head', 'body']);

const SAMPLE = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Demo page</title><style>body{margin:0;font-family:system-ui}</style></head><body><!-- main navigation --><nav class="top"><ul><li><a href="/">Home</a></li><li><a href="/about" title="About > us">About</a></li></ul></nav><main><h2>Hello, <em>world</em>!</h2><p>This paragraph has <strong>bold</strong> and <a href="#">a link</a>.</p><img src="logo.png" alt="Logo"><pre>  keep   this
    spacing</pre></main><script>document.querySelector('nav').dataset.ready = 'yes';</script></body></html>`;

/** Collapses whitespace in a tag's attribute list without touching quoted values. */
function normaliseTag(raw: string) {
  return raw
    .split(/("[^"]*"|'[^']*')/)
    .map((part, i) => (i % 2 ? part : part.replace(/\s+/g, ' ')))
    .join('')
    .replace(/\s+(\/?>)$/, (_m, end: string) => (end === '/>' ? ' />' : '>'))
    .replace(/^<\s+/, '<');
}

function tokenize(html: string, warnings: string[]): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const lineAt = (pos: number) => html.slice(0, pos).split('\n').length;
  while (i < html.length) {
    if (html.startsWith('<!--', i)) {
      let end = html.indexOf('-->', i + 4);
      if (end === -1) {
        warnings.push(`Line ${lineAt(i)}: comment is never closed with -->.`);
        end = html.length;
      }
      tokens.push({ type: 'comment', raw: html.slice(i, end + 3) });
      i = end + 3;
      continue;
    }
    if (html.startsWith('<!', i) || html.startsWith('<?', i)) {
      const end = html.indexOf('>', i);
      const stop = end === -1 ? html.length : end + 1;
      tokens.push({ type: 'doctype', raw: html.slice(i, stop).replace(/\s+/g, ' ') });
      i = stop;
      continue;
    }
    if (html[i] === '<' && /[A-Za-z/]/.test(html[i + 1] ?? '')) {
      let j = i + 1;
      let quote = '';
      while (j < html.length) {
        const c = html[j];
        if (quote) {
          if (c === quote) quote = '';
        } else if (c === '"' || c === "'") quote = c;
        else if (c === '>') break;
        j++;
      }
      const line = lineAt(i);
      if (j >= html.length) {
        warnings.push(`Line ${line}: tag "${html.slice(i, i + 30)}…" is never closed with '>'.`);
        tokens.push({ type: 'text', text: html.slice(i) });
        break;
      }
      const raw = normaliseTag(html.slice(i, j + 1));
      i = j + 1;
      if (raw[1] === '/') {
        const name = (raw.slice(2).match(/^[\w:-]+/)?.[0] ?? '').toLowerCase();
        tokens.push({ type: 'close', name, raw, line });
        continue;
      }
      const name = (raw.slice(1).match(/^[\w:-]+/)?.[0] ?? '').toLowerCase();
      const selfClosing = /\/>$/.test(raw);
      tokens.push({ type: 'open', name, raw, selfClosing, line });
      if (RAW.has(name) && !selfClosing) {
        const closeRe = new RegExp(`</${name}\\s*>`, 'i');
        const m = closeRe.exec(html.slice(i));
        const end = m ? i + m.index : html.length;
        tokens.push({ type: 'raw', name, content: html.slice(i, end) });
        if (m) tokens.push({ type: 'close', name, raw: `</${name}>`, line: lineAt(end) });
        else warnings.push(`Line ${line}: <${name}> is never closed.`);
        i = m ? end + m[0].length : html.length;
      }
      continue;
    }
    let next = i + 1;
    while (next < html.length && !(html[next] === '<' && /[A-Za-z/!?]/.test(html[next + 1] ?? ''))) next++;
    tokens.push({ type: 'text', text: html.slice(i, next) });
    i = next;
  }
  return tokens;
}

const isBlockTag = (t: Token | undefined) =>
  !!t && ((t.type === 'open' || t.type === 'close') ? !INLINE.has(t.name) : t.type !== 'text');

/** Re-indents script/style content relative to the enclosing tag. */
function reindent(content: string, pad: string) {
  const lines = content.replace(/^\s*\n|\s+$/g, '').split('\n');
  const common = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^\s*/)![0].length));
  return lines.map((l) => (l.trim() ? pad + l.slice(Number.isFinite(common) ? common : 0) : '')).join('\n');
}

function beautify(tokens: Token[], unit: string, warnings: string[]): string {
  const out: string[] = [];
  const stack: { name: string; line: number }[] = [];
  const pad = () => unit.repeat(stack.length);

  /** If the element opened at k contains only text/inline elements and is short, return its one-line form. */
  const inline = (k: number): { text: string; end: number } | null => {
    const open = tokens[k] as Extract<Token, { type: 'open' }>;
    let depth = 0;
    let text = '';
    for (let n = k + 1; n < tokens.length && n < k + 60; n++) {
      const t = tokens[n];
      if (t.type === 'close' && t.name === open.name && depth === 0) {
        const inner = text.replace(/\s+/g, ' ').trim();
        const full = `${open.raw}${inner}${t.raw}`;
        return full.length <= 120 ? { text: full, end: n } : null;
      }
      if (t.type === 'comment' || t.type === 'doctype' || t.type === 'raw') return null;
      if ((t.type === 'open' || t.type === 'close') && !INLINE.has(t.name) && t.name !== open.name) return null;
      if (t.type === 'open' && t.name === open.name && !t.selfClosing) depth++;
      if (t.type === 'close' && t.name === open.name) depth--;
      text += t.type === 'text' ? t.text : t.raw;
    }
    return null;
  };

  for (let k = 0; k < tokens.length; k++) {
    const t = tokens[k];
    if (t.type === 'text') {
      const text = t.text.replace(/\s+/g, ' ').trim();
      if (text) out.push(pad() + text);
    } else if (t.type === 'comment' || t.type === 'doctype') {
      out.push(pad() + t.raw.trim());
    } else if (t.type === 'raw') {
      if (t.name === 'pre' || t.name === 'textarea') {
        out[out.length - 1] += t.content;
      } else if (t.content.trim()) {
        out.push(reindent(t.content, unit.repeat(stack.length)));
      }
    } else if (t.type === 'open') {
      const top = stack[stack.length - 1];
      if (top && IMPLICIT_CLOSE[t.name]?.includes(top.name)) stack.pop();
      if (VOID.has(t.name) || t.selfClosing) {
        out.push(pad() + t.raw);
        continue;
      }
      const next = tokens[k + 1];
      if (RAW.has(t.name)) {
        out.push(pad() + t.raw);
        stack.push({ name: t.name, line: t.line });
        if (next?.type === 'raw' && (t.name === 'pre' || t.name === 'textarea' || !next.content.trim())) {
          const close = tokens[k + 2];
          out[out.length - 1] += next.content + (close?.type === 'close' ? close.raw : '');
          if (close?.type === 'close') {
            stack.pop();
            k += 2;
          } else k += 1;
        }
        continue;
      }
      const one = inline(k);
      if (one) {
        out.push(pad() + one.text);
        k = one.end;
        continue;
      }
      out.push(pad() + t.raw);
      stack.push({ name: t.name, line: t.line });
    } else if (t.type === 'close') {
      const idx = stack.map((s) => s.name).lastIndexOf(t.name);
      if (idx === -1) {
        if (!VOID.has(t.name)) warnings.push(`Line ${t.line}: closing tag </${t.name}> has no matching opening tag.`);
        out.push(pad() + t.raw);
        continue;
      }
      for (const s of stack.splice(idx + 1)) if (!OPTIONAL_END.has(s.name)) warnings.push(`Line ${s.line}: <${s.name}> is not closed before </${t.name}>.`);
      stack.pop();
      out.push(pad() + t.raw);
    }
  }
  for (const s of stack) if (!OPTIONAL_END.has(s.name)) warnings.push(`Line ${s.line}: <${s.name}> is never closed.`);
  return out.join('\n');
}

function minify(tokens: Token[]): string {
  let out = '';
  tokens.forEach((t, k) => {
    if (t.type === 'comment') {
      if (/^<!--\[if/i.test(t.raw)) out += t.raw;
    } else if (t.type === 'text') {
      let text = t.text.replace(/\s+/g, ' ');
      if (isBlockTag(tokens[k - 1]) || k === 0) text = text.trimStart();
      if (isBlockTag(tokens[k + 1]) || k === tokens.length - 1) text = text.trimEnd();
      out += text;
    } else if (t.type === 'raw') {
      out += t.name === 'pre' || t.name === 'textarea' ? t.content : t.content.trim();
    } else {
      out += t.raw;
    }
  });
  return out;
}

function downloadText(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/html' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const btn = 'rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export default function HTMLFormatter() {
  const [input, setInput] = useState('');
  const [indent, setIndent] = useState<Indent>('2');
  const [isMin, setIsMin] = useState(false);
  const [notice, setNotice] = useState('');

  const result = useMemo(() => {
    const warnings: string[] = [];
    if (!input.trim()) return { output: '', warnings };
    const tokens = tokenize(input, warnings);
    const output = isMin ? minify(tokens) : beautify(tokens, indent === 'tab' ? '\t' : ' '.repeat(Number(indent)), warnings);
    return { output, warnings: Array.from(new Set(warnings)) };
  }, [input, indent, isMin]);

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
              aria-pressed={isMin === m}
              onClick={() => setIsMin(m)}
              className={`${btn} py-1.5 ${isMin === m ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
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
            disabled={isMin}
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
            Open .html file
            <input type="file" accept=".html,.htm,text/html,text/plain" onChange={onFile} className="sr-only" />
          </label>
          <button type="button" onClick={() => setInput('')} disabled={!input} className={`${btn} bg-slate-100 text-slate-800 hover:bg-slate-200`}>
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor="html-input" className="mb-1.5 block text-sm font-medium text-slate-700">
            HTML input
          </label>
          <textarea
            id="html-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder="Paste HTML here, e.g. <div><p>Hello</p></div>"
            className="h-80 w-full resize-y rounded-lg border border-slate-300 p-3 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-slate-500">{inBytes.toLocaleString()} bytes</p>
        </div>
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label htmlFor="html-output" className="block text-sm font-medium text-slate-700">
              {isMin ? 'Minified HTML' : 'Formatted HTML'}
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => copy(result.output)} disabled={!result.output} className={`${btn} bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700`}>
                Copy
              </button>
              <button type="button" onClick={() => downloadText(result.output + '\n', isMin ? 'page.min.html' : 'page.html')} disabled={!result.output} className={`${btn} bg-slate-100 px-3 py-1 text-xs text-slate-800 hover:bg-slate-200`}>
                Download
              </button>
            </div>
          </div>
          <textarea
            id="html-output"
            value={result.output}
            readOnly
            spellCheck={false}
            wrap="off"
            placeholder="Formatted HTML appears here as you type."
            className="h-80 w-full resize-y rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-slate-500">
            {outBytes.toLocaleString()} bytes{isMin && inBytes > 0 && result.output ? ` · ${Math.max(0, Math.round((1 - outBytes / inBytes) * 100))}% smaller` : ''}
          </p>
        </div>
      </div>

      {result.warnings.length > 0 && (
        <div role="alert" data-testid="html-warnings" className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold">Markup problems found</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {result.warnings.slice(0, 10).map((w) => (
              <li key={w}>{w}</li>
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
