import { useMemo, useState, type ChangeEvent } from 'react';
import { marked } from 'marked';

const SAMPLE = `# Hello World

This is **bold**, this is *italic* and this is \`inline code\`.

## A list

- [x] Write markdown
- [ ] Preview it live
- Copy the HTML

| Tool | Runs in |
| ---- | ------- |
| Markdown Preview | Your browser |

> Tip: raw HTML is allowed, but scripts and event handlers are removed.

\`\`\`js
console.log('Hello');
\`\`\`

[Visit the example site](https://example.com)
`;

/* ---------- Sanitiser: rebuilds the document from an allow-list of tags and attributes ---------- */

const ALLOWED_TAGS = new Set([
  'a', 'abbr', 'b', 'blockquote', 'br', 'caption', 'code', 'dd', 'del', 'details', 'div', 'dl', 'dt', 'em', 'figcaption', 'figure',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'input', 'ins', 'kbd', 'li', 'mark', 'ol', 'p', 'pre', 's', 'small', 'span',
  'strong', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'u', 'ul',
]);
/** Removed together with their content. */
const DROP_TAGS = new Set(['script', 'style', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet', 'form', 'svg', 'math', 'template', 'noscript', 'link', 'meta', 'base', 'title', 'head', 'textarea', 'select', 'button', 'audio', 'video']);
const ALLOWED_ATTRS: Record<string, string[]> = {
  '*': ['title', 'lang', 'dir'],
  a: ['href'],
  img: ['src', 'alt', 'width', 'height'],
  ol: ['start'],
  td: ['align', 'colspan', 'rowspan'],
  th: ['align', 'colspan', 'rowspan', 'scope'],
  code: ['class'],
  input: ['type', 'checked', 'disabled'],
  details: ['open'],
};

function safeUrl(value: string, forImage: boolean) {
  // Strip control characters and whitespace that browsers ignore inside schemes ("java\tscript:").
  // eslint-disable-next-line no-control-regex
  const v = value.replace(/[\u0000- \u007f-\u009f]/g, '');
  if (/^(https?:|mailto:|tel:|#|\/|\.\/|\.\.\/)/i.test(v)) return true;
  if (forImage && /^data:image\/(png|gif|jpe?g|webp|avif);/i.test(v)) return true;
  return !/^[a-z][a-z0-9+.-]*:/i.test(v); // relative URL without a scheme
}

function cleanNode(node: Node, doc: Document, shiftHeadings: boolean): Node | null {
  if (node.nodeType === Node.TEXT_NODE) return doc.createTextNode(node.textContent ?? '');
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  if (DROP_TAGS.has(tag)) return null;
  const children = () => {
    const frag = doc.createDocumentFragment();
    el.childNodes.forEach((child) => {
      const c = cleanNode(child, doc, shiftHeadings);
      if (c) frag.appendChild(c);
    });
    return frag;
  };
  if (!ALLOWED_TAGS.has(tag)) return children(); // unwrap unknown elements, keep their text
  if (tag === 'input' && el.getAttribute('type') !== 'checkbox') return null;

  let outTag = tag;
  const level = /^h([1-6])$/.exec(tag);
  if (level && shiftHeadings) outTag = `h${Math.min(6, Number(level[1]) + 1)}`;
  const out = doc.createElement(outTag);
  if (level && shiftHeadings) out.setAttribute('data-md-level', level[1]);

  const allowed = [...ALLOWED_ATTRS['*'], ...(ALLOWED_ATTRS[tag] ?? [])];
  for (const { name, value } of Array.from(el.attributes)) {
    if (!allowed.includes(name)) continue;
    if ((name === 'href' || name === 'src') && !safeUrl(value, name === 'src')) continue;
    if (name === 'class' && !/^language-[\w-]+$/.test(value)) continue;
    out.setAttribute(name, value);
  }
  if (tag === 'input') out.setAttribute('disabled', '');
  if (tag === 'a' && shiftHeadings && out.hasAttribute('href') && !out.getAttribute('href')!.startsWith('#')) {
    out.setAttribute('target', '_blank');
    out.setAttribute('rel', 'noopener noreferrer nofollow');
  }
  out.appendChild(children());
  return out;
}

/** Parses untrusted HTML in an inert document (no scripts run, no images load) and returns safe HTML. */
function sanitize(html: string, shiftHeadings: boolean): string {
  const parsed = new DOMParser().parseFromString(`<!doctype html><body>${html}</body>`, 'text/html');
  const target = document.implementation.createHTMLDocument('');
  const container = target.createElement('div');
  parsed.body.childNodes.forEach((n) => {
    const c = cleanNode(n, target, shiftHeadings);
    if (c) container.appendChild(c);
  });
  return container.innerHTML;
}

function downloadText(text: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const btn = 'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export default function MarkdownPreview() {
  const [markdown, setMarkdown] = useState(SAMPLE);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [view, setView] = useState<'preview' | 'html'>('preview');
  const [notice, setNotice] = useState('');

  const { exportHtml, previewHtml, error } = useMemo(() => {
    if (!markdown.trim()) return { exportHtml: '', previewHtml: '', error: '' };
    try {
      const raw = marked.parse(markdown, { async: false, gfm: true, breaks: false }) as string;
      return { exportHtml: sanitize(raw, false), previewHtml: sanitize(raw, true), error: '' };
    } catch (e) {
      return { exportHtml: '', previewHtml: '', error: e instanceof Error ? e.message : 'Could not parse this Markdown.' };
    }
  }, [markdown]);

  const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice((n) => (n === msg ? '' : n)), 2500);
  };

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flash(`${what} copied to clipboard.`);
    } catch {
      flash('Copy failed. Select the text and press Ctrl+C.');
    }
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      flash('Files up to 2 MB are supported.');
      return;
    }
    setMarkdown(await file.text());
  };

  const standalone = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>Document</title>\n</head>\n<body>\n${exportHtml}\n</body>\n</html>\n`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <fieldset className="flex items-center gap-3 text-sm text-slate-700">
          <legend className="sr-only">Preview theme</legend>
          {(['light', 'dark'] as const).map((t) => (
            <label key={t} className="flex items-center gap-1.5">
              <input type="radio" name="md-theme" value={t} checked={theme === t} onChange={() => setTheme(t)} className="h-4 w-4" />
              {t === 'light' ? 'Light' : 'Dark'} theme
            </label>
          ))}
        </fieldset>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <label className={`${btn} cursor-pointer bg-slate-100 text-slate-800 hover:bg-slate-200 focus-within:ring-2 focus-within:ring-blue-500`}>
            Open .md file
            <input type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" onChange={onFile} className="sr-only" />
          </label>
          <button type="button" onClick={() => setMarkdown(SAMPLE)} className={`${btn} bg-slate-100 text-slate-800 hover:bg-slate-200`}>
            Load sample
          </button>
          <button type="button" onClick={() => setMarkdown('')} disabled={!markdown} className={`${btn} bg-slate-100 text-slate-800 hover:bg-slate-200`}>
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label htmlFor="md-input" className="block text-sm font-medium text-slate-700">
              Markdown
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => copy(markdown, 'Markdown')} disabled={!markdown} className={`${btn} bg-slate-100 px-2.5 py-1 text-xs text-slate-800 hover:bg-slate-200`}>
                Copy
              </button>
              <button type="button" onClick={() => downloadText(markdown, 'document.md', 'text/markdown')} disabled={!markdown} className={`${btn} bg-slate-100 px-2.5 py-1 text-xs text-slate-800 hover:bg-slate-200`}>
                Download .md
              </button>
            </div>
          </div>
          <textarea
            id="md-input"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            spellCheck
            placeholder="Write Markdown here…"
            className="h-96 w-full resize-y rounded-lg border border-slate-300 p-3 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-slate-500">
            {words.toLocaleString()} words · {markdown.length.toLocaleString()} characters
          </p>
        </div>

        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <div role="group" aria-label="Output view" className="inline-flex rounded-lg border border-slate-300 p-0.5">
              {(['preview', 'html'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className={`${btn} px-2.5 py-1 text-xs ${view === v ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                >
                  {v === 'preview' ? 'Preview' : 'HTML code'}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => copy(exportHtml, 'HTML')} disabled={!exportHtml} className={`${btn} bg-blue-600 px-2.5 py-1 text-xs text-white hover:bg-blue-700`}>
                Copy HTML
              </button>
              <button type="button" onClick={() => downloadText(standalone, 'document.html', 'text/html')} disabled={!exportHtml} className={`${btn} bg-slate-100 px-2.5 py-1 text-xs text-slate-800 hover:bg-slate-200`}>
                Download .html
              </button>
            </div>
          </div>
          {view === 'preview' ? (
            <div
              role="document"
              aria-label="Rendered Markdown preview"
              tabIndex={0}
              data-testid="md-preview"
              className={`prose h-96 max-w-none prose-code:before:content-none prose-code:after:content-none [&>:first-child]:mt-0 overflow-auto break-words rounded-lg border border-slate-300 p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 [&_[data-md-level='1']]:text-[2.25em] [&_[data-md-level='1']]:font-extrabold [&_[data-md-level='2']]:text-[1.5em] [&_[data-md-level='3']]:text-[1.25em] [&_table]:block [&_table]:overflow-x-auto ${
                theme === 'dark' ? 'prose-invert bg-slate-900' : 'bg-white'
              }`}
              dangerouslySetInnerHTML={{ __html: previewHtml || '<p><em>Nothing to preview yet.</em></p>' }}
            />
          ) : (
            <>
              <label htmlFor="md-html" className="sr-only">
                Generated HTML
              </label>
              <textarea
                id="md-html"
                value={exportHtml}
                readOnly
                spellCheck={false}
                className="h-96 w-full resize-y rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </>
          )}
          <p className="mt-1 text-xs text-slate-500">GitHub Flavored Markdown. Scripts, event handlers and unsafe links are removed.</p>
        </div>
      </div>

      {error && (
        <div role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </div>
      )}

      <details className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
        <summary className="cursor-pointer font-medium text-slate-900">Markdown cheat sheet</summary>
        <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 font-mono text-xs sm:grid-cols-2">
          {[
            ['Heading', '# H1  ## H2  ### H3'],
            ['Bold / italic', '**bold**  *italic*'],
            ['Link', '[text](https://…)'],
            ['Image', '![alt](image.png)'],
            ['Code', '`code`  or  ```lang fences'],
            ['List', '- item   1. item   - [ ] task'],
            ['Quote', '> quoted text'],
            ['Table', '| a | b |  then  |---|---|'],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <dt className="w-28 flex-none font-sans font-semibold">{k}</dt>
              <dd className="min-w-0 break-all">{v}</dd>
            </div>
          ))}
        </dl>
      </details>

      <p aria-live="polite" className="mt-2 min-h-[1.25rem] text-sm text-slate-600">
        {notice}
      </p>
    </div>
  );
}
