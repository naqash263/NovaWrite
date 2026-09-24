import { useDeferredValue, useMemo, useRef, useState } from 'react';

type SourceFormat = 'txt' | 'csv' | 'json' | 'xml' | 'html';
type TargetFormat = 'txt' | 'csv' | 'json' | 'xml' | 'yaml' | 'html';
type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

const sourceLabels: Record<SourceFormat, string> = {
  csv: 'CSV / TSV',
  json: 'JSON',
  xml: 'XML',
  html: 'HTML (tables or text)',
  txt: 'Plain text (one item per line)',
};

const targetLabels: Record<TargetFormat, string> = {
  json: 'JSON',
  csv: 'CSV',
  xml: 'XML',
  yaml: 'YAML',
  html: 'HTML',
  txt: 'Plain text',
};

const mimeTypes: Record<TargetFormat, string> = {
  json: 'application/json',
  csv: 'text/csv',
  xml: 'application/xml',
  yaml: 'application/yaml',
  html: 'text/html',
  txt: 'text/plain',
};

const SAMPLE = 'name,city,age\n"Smith, Anna",London,34\nJosé Pérez,Madrid,29\n';

const isPlainObject = (v: unknown): v is { [key: string]: Json } => typeof v === 'object' && v !== null && !Array.isArray(v);

// ---------- detection ----------

function detectFormat(fileName: string, content: string): SourceFormat {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'csv' || ext === 'tsv') return 'csv';
  if (ext === 'json') return 'json';
  if (ext === 'xml') return 'xml';
  if (ext === 'html' || ext === 'htm') return 'html';
  const t = content.trim();
  if (/^[[{]/.test(t)) {
    try {
      JSON.parse(t);
      return 'json';
    } catch {
      /* not JSON */
    }
  }
  if (/^<!doctype html|<html[\s>]|<table[\s>]|<body[\s>]/i.test(t)) return 'html';
  if (t.startsWith('<')) return 'xml';
  const firstLine = t.split(/\r?\n/)[0] ?? '';
  if (t.includes('\n') && /[,;\t]/.test(firstLine)) return 'csv';
  return 'txt';
}

// ---------- parsers ----------

function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/)[0] ?? '';
  const counts = [',', ';', '\t'].map((d) => ({ d, n: firstLine.split(d).length - 1 }));
  counts.sort((a, b) => b.n - a.n);
  return counts[0].n > 0 ? counts[0].d : ',';
}

/** RFC 4180 CSV parser: quoted fields, escaped quotes, CRLF and newlines inside quotes. */
function parseCsvRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"' && field === '') inQuotes = true;
    else if (c === delimiter) {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (inQuotes) throw new Error('CSV error: a quoted field is not closed.');
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ''));
}

function parseCsv(text: string): Json {
  const rows = parseCsvRows(text.replace(/^\uFEFF/, ''), detectDelimiter(text));
  if (rows.length === 0) return [];
  const seen = new Map<string, number>();
  const headers = rows[0].map((h, i) => {
    let key = h.trim() || `column_${i + 1}`;
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);
    if (count) key = `${key}_${count + 1}`;
    return key;
  });
  return rows.slice(1).map((r) => {
    const obj: { [key: string]: Json } = {};
    headers.forEach((h, i) => {
      obj[h] = r[i] ?? '';
    });
    return obj;
  });
}

function xmlElementToJson(el: Element): Json {
  const obj: { [key: string]: Json } = {};
  for (const attr of Array.from(el.attributes)) obj[`@${attr.name}`] = attr.value;
  const children = Array.from(el.children);
  const text = Array.from(el.childNodes)
    .filter((n) => n.nodeType === Node.TEXT_NODE || n.nodeType === Node.CDATA_SECTION_NODE)
    .map((n) => n.textContent ?? '')
    .join('')
    .trim();
  if (children.length === 0 && el.attributes.length === 0) return text;
  for (const child of children) {
    const value = xmlElementToJson(child);
    const key = child.tagName;
    if (key in obj) {
      const existing = obj[key];
      obj[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
    } else obj[key] = value;
  }
  if (text) obj['#text'] = text;
  return obj;
}

function parseXml(text: string): Json {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  const err = doc.getElementsByTagName('parsererror')[0];
  if (err) throw new Error(`XML error: ${(err.textContent ?? 'the document is not well-formed').split('\n')[0].trim()}`);
  return { [doc.documentElement.tagName]: xmlElementToJson(doc.documentElement) };
}

function parseHtml(text: string): Json {
  const doc = new DOMParser().parseFromString(text, 'text/html');
  const table = doc.querySelector('table');
  if (table) {
    const rows = Array.from(table.querySelectorAll('tr')).map((tr) =>
      Array.from(tr.querySelectorAll('th,td')).map((c) => (c.textContent ?? '').replace(/\s+/g, ' ').trim()),
    );
    if (rows.length === 0) return [];
    const headers = rows[0].map((h, i) => h || `column_${i + 1}`);
    return rows.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])));
  }
  return (doc.body?.innerText || doc.body?.textContent || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function parseSource(format: SourceFormat, text: string): Json {
  switch (format) {
    case 'json':
      try {
        return JSON.parse(text) as Json;
      } catch (e) {
        throw new Error(`JSON error: ${e instanceof Error ? e.message : 'invalid JSON'}`);
      }
    case 'csv':
      return parseCsv(text);
    case 'xml':
      return parseXml(text);
    case 'html':
      return parseHtml(text);
    case 'txt':
      return text.replace(/\r\n?/g, '\n').replace(/\n+$/, '').split('\n');
  }
}

// ---------- serializers ----------

/** Unwraps single-key wrappers such as {"root": {"item": [...]}} to reach tabular data. */
function unwrap(v: Json): Json {
  let cur = v;
  for (let depth = 0; depth < 4 && isPlainObject(cur); depth++) {
    const keys = Object.keys(cur);
    if (keys.length !== 1) break;
    const inner = cur[keys[0]];
    if (!Array.isArray(inner) && !isPlainObject(inner)) break;
    cur = inner;
  }
  return cur;
}

const cellText = (v: Json | undefined): string =>
  v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);

function toTable(v: Json): { headers: string[]; rows: string[][] } {
  const data = unwrap(v);
  const list: Json[] = Array.isArray(data) ? data : [data];
  if (list.every((item) => !isPlainObject(item))) {
    return { headers: ['value'], rows: list.map((item) => [cellText(item)]) };
  }
  const headers: string[] = [];
  for (const item of list) if (isPlainObject(item)) for (const k of Object.keys(item)) if (!headers.includes(k)) headers.push(k);
  const rows = list.map((item) => (isPlainObject(item) ? headers.map((h) => cellText(item[h])) : [cellText(item)]));
  return { headers, rows };
}

const csvField = (s: string) => (/[",\r\n]|^\s|\s$/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

function toCsv(v: Json): string {
  const { headers, rows } = toTable(v);
  return [headers, ...rows].map((r) => r.map(csvField).join(',')).join('\r\n');
}

const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function xmlName(key: string): string {
  let name = key.replace(/[^A-Za-z0-9_.-]/g, '_');
  if (!/^[A-Za-z_]/.test(name) || /^xml/i.test(name)) name = `_${name}`;
  return name;
}

function toXml(v: Json): string {
  const render = (value: Json, tag: string, indent: string): string => {
    const name = xmlName(tag);
    if (Array.isArray(value)) return value.map((item) => render(item, tag, indent)).join('\n');
    if (isPlainObject(value)) {
      const attrs = Object.entries(value)
        .filter(([k, val]) => k.startsWith('@') && !isPlainObject(val) && !Array.isArray(val))
        .map(([k, val]) => ` ${xmlName(k.slice(1))}="${escapeXml(cellText(val))}"`)
        .join('');
      const text = value['#text'];
      const children = Object.entries(value).filter(([k]) => !k.startsWith('@') && k !== '#text');
      if (children.length === 0) return `${indent}<${name}${attrs}>${text !== undefined ? escapeXml(cellText(text)) : ''}</${name}>`;
      const inner = children.map(([k, val]) => render(val, k, `${indent}  `)).join('\n');
      const textLine = text !== undefined ? `\n${indent}  ${escapeXml(cellText(text))}` : '';
      return `${indent}<${name}${attrs}>${textLine}\n${inner}\n${indent}</${name}>`;
    }
    return `${indent}<${name}>${escapeXml(cellText(value))}</${name}>`;
  };
  let body: string;
  if (isPlainObject(v) && Object.keys(v).length === 1 && !Array.isArray(Object.values(v)[0])) {
    const [key, value] = Object.entries(v)[0];
    body = render(value, key, '');
  } else if (Array.isArray(v)) {
    body = `<root>\n${v.map((item) => render(item, 'item', '  ')).join('\n')}\n</root>`;
  } else {
    body = render(v, 'root', '');
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n${body}`;
}

function yamlScalar(v: Json): string {
  if (v === null) return 'null';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  const s = String(v);
  const needsQuotes =
    s === '' ||
    /^\s|\s$/.test(s) ||
    /[:#\n\r\t"'{}[\],&*!|>%@`]/.test(s) ||
    /^[-?]/.test(s) ||
    /^(true|false|yes|no|on|off|null|~)$/i.test(s) ||
    /^[-+]?(\d[\d_]*(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/.test(s);
  return needsQuotes ? JSON.stringify(s) : s;
}

function toYaml(v: Json, indent = ''): string {
  if (Array.isArray(v)) {
    if (v.length === 0) return '[]';
    return v
      .map((item) => {
        if ((Array.isArray(item) && item.length) || (isPlainObject(item) && Object.keys(item).length)) {
          const nested = toYaml(item, `${indent}  `);
          return `${indent}- ${nested.trimStart()}`;
        }
        return `${indent}- ${Array.isArray(item) ? '[]' : isPlainObject(item) ? '{}' : yamlScalar(item)}`;
      })
      .join('\n');
  }
  if (isPlainObject(v)) {
    const entries = Object.entries(v);
    if (entries.length === 0) return '{}';
    return entries
      .map(([k, val]) => {
        const key = yamlScalar(k);
        if ((Array.isArray(val) && val.length) || (isPlainObject(val) && Object.keys(val).length)) {
          return `${indent}${key}:\n${toYaml(val, `${indent}  `)}`;
        }
        return `${indent}${key}: ${Array.isArray(val) ? '[]' : isPlainObject(val) ? '{}' : yamlScalar(val)}`;
      })
      .join('\n');
  }
  return `${indent}${yamlScalar(v)}`;
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function toHtml(v: Json): string {
  const data = unwrap(v);
  let body: string;
  const list = Array.isArray(data) ? data : null;
  if (list && list.length && list.every((i) => !isPlainObject(i) && !Array.isArray(i))) {
    body = `<ul>\n${list.map((i) => `  <li>${escapeHtml(cellText(i))}</li>`).join('\n')}\n</ul>`;
  } else if (list || isPlainObject(data)) {
    const { headers, rows } = toTable(data);
    body = `<table>\n  <thead>\n    <tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr>\n  </thead>\n  <tbody>\n${rows
      .map((r) => `    <tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`)
      .join('\n')}\n  </tbody>\n</table>`;
  } else {
    body = `<p>${escapeHtml(cellText(data))}</p>`;
  }
  return `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<title>Converted data</title>\n</head>\n<body>\n${body}\n</body>\n</html>`;
}

function toText(v: Json): string {
  const data = unwrap(v);
  if (typeof data === 'string') return data;
  if (Array.isArray(data) && data.every((i) => !isPlainObject(i) && !Array.isArray(i))) return data.map(cellText).join('\n');
  if (Array.isArray(data)) {
    const { headers, rows } = toTable(data);
    return [headers, ...rows].map((r) => r.join('\t')).join('\n');
  }
  return JSON.stringify(data, null, 2);
}

function convert(text: string, source: SourceFormat, target: TargetFormat): string {
  const data = parseSource(source, text);
  switch (target) {
    case 'json':
      return JSON.stringify(data, null, 2);
    case 'csv':
      return toCsv(data);
    case 'xml':
      return toXml(data);
    case 'yaml':
      return `${toYaml(data)}\n`;
    case 'html':
      return toHtml(data);
    case 'txt':
      return toText(data);
  }
}

// ---------- component ----------

export default function FileConverter() {
  const [input, setInput] = useState('');
  const [fileName, setFileName] = useState('');
  const [sourceChoice, setSourceChoice] = useState<'auto' | SourceFormat>('auto');
  const [targetFormat, setTargetFormat] = useState<TargetFormat>('json');
  const [readError, setReadError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deferredInput = useDeferredValue(input);

  const detected = useMemo(() => detectFormat(fileName, deferredInput), [fileName, deferredInput]);
  const sourceFormat = sourceChoice === 'auto' ? detected : sourceChoice;

  const { output, error } = useMemo(() => {
    if (!deferredInput.trim()) return { output: '', error: '' };
    try {
      return { output: convert(deferredInput, sourceFormat, targetFormat), error: '' };
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : 'Conversion failed.' };
    }
  }, [deferredInput, sourceFormat, targetFormat]);

  const loadFile = (file: File | undefined) => {
    if (!file) return;
    setReadError('');
    if (file.size > 20 * 1024 * 1024) {
      setReadError(`${file.name} is larger than 20 MB. Please use a smaller text file.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      if (text.includes('\u0000')) {
        setReadError(`${file.name} looks like a binary file. This tool converts text formats only.`);
        return;
      }
      setFileName(file.name);
      setSourceChoice('auto');
      setInput(text);
      const fmt = detectFormat(file.name, text);
      setTargetFormat(fmt === 'json' ? 'csv' : 'json');
    };
    reader.onerror = () => setReadError(`Could not read ${file.name}.`);
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const baseName = fileName ? fileName.replace(/\.[^.]+$/, '') : 'converted';

  const download = () => {
    if (!output) return;
    const blob = new Blob([output], { type: `${mimeTypes[targetFormat]};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}.${targetFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const copy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const reset = () => {
    setInput('');
    setFileName('');
    setSourceChoice('auto');
    setReadError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const shownError = readError || error;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        {/* File Upload */}
        <div
          className={`mb-4 rounded-lg border-2 border-dashed p-4 transition-colors ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            loadFile(e.dataTransfer.files?.[0]);
          }}
        >
          <label htmlFor="file-converter-input" className="block text-sm font-medium text-gray-700 mb-2">
            Open a file (or drop it here), or paste content below
          </label>
          <input
            id="file-converter-input"
            ref={fileInputRef}
            type="file"
            accept=".txt,.csv,.tsv,.json,.xml,.html,.htm"
            onChange={(e) => loadFile(e.target.files?.[0])}
            className="block w-full min-w-0 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Format Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="file-converter-source" className="block text-sm font-medium text-gray-700 mb-2">
              From
            </label>
            <select
              id="file-converter-source"
              value={sourceChoice}
              onChange={(e) => setSourceChoice(e.target.value as 'auto' | SourceFormat)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="auto">Auto-detect{input.trim() ? ` (${sourceLabels[detected]})` : ''}</option>
              {(Object.keys(sourceLabels) as SourceFormat[]).map((f) => (
                <option key={f} value={f}>
                  {sourceLabels[f]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="file-converter-target" className="block text-sm font-medium text-gray-700 mb-2">
              To
            </label>
            <select
              id="file-converter-target"
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value as TargetFormat)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {(Object.keys(targetLabels) as TargetFormat[]).map((f) => (
                <option key={f} value={f}>
                  {targetLabels[f]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {shownError && (
          <div role="alert" className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{shownError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="min-w-0">
            <div className="flex justify-between items-center mb-2 gap-2">
              <label htmlFor="file-converter-text" className="text-sm font-medium text-gray-700">
                Input{fileName ? ` · ${fileName}` : ''}
              </label>
              <button type="button" onClick={() => setInput(SAMPLE)} className="text-sm text-blue-700 hover:underline">
                Load sample
              </button>
            </div>
            <textarea
              id="file-converter-text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
              placeholder={'Paste CSV, JSON, XML, HTML or text here…\n\nname,city\nAnna,London'}
              className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">{input.length.toLocaleString()} characters</p>
          </div>
          <div className="min-w-0">
            <div className="flex justify-between items-center mb-2 gap-2">
              <label htmlFor="file-converter-output" className="text-sm font-medium text-gray-700">
                Output ({targetLabels[targetFormat]})
              </label>
              <div className="flex gap-3">
                <button type="button" onClick={copy} disabled={!output} className="text-sm text-blue-700 hover:underline disabled:text-gray-400 disabled:no-underline">
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button type="button" onClick={download} disabled={!output} className="text-sm text-blue-700 hover:underline disabled:text-gray-400 disabled:no-underline">
                  Download .{targetFormat}
                </button>
              </div>
            </div>
            <textarea
              id="file-converter-output"
              value={output}
              readOnly
              spellCheck={false}
              placeholder="The converted result appears here as you type."
              className="w-full h-64 p-3 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={download}
            disabled={!output}
            className="flex-1 sm:flex-none bg-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Download converted file
          </button>
          <button type="button" onClick={reset} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors">
            Reset
          </button>
        </div>
        <p className="mt-4 text-xs text-gray-500">
          CSV headers become keys; XML attributes appear as “@name”. HTML input uses the first table, or the page text when there is no table.
          YAML is available as an output format only.
        </p>
      </div>
    </div>
  );
}
