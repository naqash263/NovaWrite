import { useMemo, useState, type ChangeEvent } from 'react';
import { format, type SqlLanguage, type KeywordCase } from 'sql-formatter';

type Indent = '2' | '4' | 'tab';

const DIALECTS: { value: SqlLanguage; label: string }[] = [
  { value: 'sql', label: 'Standard SQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'mariadb', label: 'MariaDB' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'transactsql', label: 'SQL Server (T-SQL)' },
  { value: 'plsql', label: 'Oracle PL/SQL' },
  { value: 'bigquery', label: 'Google BigQuery' },
  { value: 'snowflake', label: 'Snowflake' },
  { value: 'redshift', label: 'Amazon Redshift' },
  { value: 'spark', label: 'Spark SQL' },
  { value: 'trino', label: 'Trino / Presto' },
  { value: 'duckdb', label: 'DuckDB' },
  { value: 'db2', label: 'IBM Db2' },
];

const SAMPLE = `select u.id, u.name, count(o.id) as orders, sum(o.total) as revenue from users u left join orders o on o.user_id = u.id and o.status = 'paid' -- only paid orders
where u.created_at >= '2026-01-01' and u.country in ('GB', 'PK', 'US') group by u.id, u.name having count(o.id) > 2 order by revenue desc limit 20;`;

/**
 * Minifies SQL: removes comments and collapses whitespace, but never touches the contents
 * of string literals or quoted identifiers.
 */
function minifySql(sql: string): string {
  let out = '';
  let i = 0;
  const space = () => {
    if (out && !out.endsWith(' ')) out += ' ';
  };
  while (i < sql.length) {
    const c = sql[i];
    if (c === "'" || c === '"' || c === '`' || c === '[') {
      const close = c === '[' ? ']' : c;
      let j = i + 1;
      while (j < sql.length) {
        if (sql[j] === '\\' && c !== '[') j += 2;
        else if (sql[j] === close) {
          if (sql[j + 1] === close && c !== '[') j += 2;
          else break;
        } else j++;
      }
      out += sql.slice(i, j + 1);
      i = j + 1;
    } else if (c === '-' && sql[i + 1] === '-') {
      const nl = sql.indexOf('\n', i);
      i = nl === -1 ? sql.length : nl;
      space();
    } else if (c === '/' && sql[i + 1] === '*') {
      const end = sql.indexOf('*/', i + 2);
      i = end === -1 ? sql.length : end + 2;
      space();
    } else if (/\s/.test(c)) {
      space();
      i++;
    } else {
      if ((c === ',' || c === ')' || c === ';') && out.endsWith(' ')) out = out.slice(0, -1);
      out += c;
      if (c === '(') {
        while (/\s/.test(sql[i + 1] ?? '')) i++;
      }
      i++;
    }
  }
  return out.trim();
}

function downloadText(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/sql' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const btn = 'rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
const field = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function SQLFormatter() {
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<SqlLanguage>('sql');
  const [indent, setIndent] = useState<Indent>('2');
  const [keywordCase, setKeywordCase] = useState<KeywordCase>('upper');
  const [minify, setMinify] = useState(false);
  const [notice, setNotice] = useState('');

  const result = useMemo(() => {
    if (!input.trim()) return { output: '', error: '' };
    try {
      const formatted = format(input, {
        language,
        tabWidth: indent === 'tab' ? 2 : Number(indent),
        useTabs: indent === 'tab',
        keywordCase,
      });
      return { output: minify ? minifySql(formatted) : formatted, error: '' };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not parse this SQL.';
      return { output: minify ? minifySql(input) : '', error: message.split('\n')[0] };
    }
  }, [input, language, indent, keywordCase, minify]);

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

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="sql-dialect" className="mb-1.5 block text-sm font-medium text-slate-700">
            Dialect
          </label>
          <select id="sql-dialect" value={language} onChange={(e) => setLanguage(e.target.value as SqlLanguage)} className={field}>
            {DIALECTS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sql-keyword-case" className="mb-1.5 block text-sm font-medium text-slate-700">
            Keyword case
          </label>
          <select id="sql-keyword-case" value={keywordCase} onChange={(e) => setKeywordCase(e.target.value as KeywordCase)} className={field}>
            <option value="upper">UPPERCASE</option>
            <option value="lower">lowercase</option>
            <option value="preserve">Keep as typed</option>
          </select>
        </div>
        <div>
          <label htmlFor="sql-indent" className="mb-1.5 block text-sm font-medium text-slate-700">
            Indentation
          </label>
          <select id="sql-indent" value={indent} onChange={(e) => setIndent(e.target.value as Indent)} disabled={minify} className={field}>
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="tab">Tab</option>
          </select>
        </div>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-700">
          <input type="checkbox" checked={minify} onChange={(e) => setMinify(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
          Minify to one line
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="sql-input" className="block text-sm font-medium text-slate-700">
              SQL input
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setInput(SAMPLE)} className={`${btn} bg-slate-100 px-3 py-1 text-xs text-slate-800 hover:bg-slate-200`}>
                Load sample
              </button>
              <label className={`${btn} cursor-pointer bg-slate-100 px-3 py-1 text-xs text-slate-800 hover:bg-slate-200 focus-within:ring-2 focus-within:ring-blue-500`}>
                Open .sql file
                <input type="file" accept=".sql,text/plain" onChange={onFile} className="sr-only" />
              </label>
              <button type="button" onClick={() => setInput('')} disabled={!input} className={`${btn} bg-slate-100 px-3 py-1 text-xs text-slate-800 hover:bg-slate-200`}>
                Clear
              </button>
            </div>
          </div>
          <textarea
            id="sql-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            aria-invalid={Boolean(result.error)}
            aria-describedby={result.error ? 'sql-error' : undefined}
            placeholder="Paste a SQL query, e.g. select * from users where id = 1"
            className="h-80 w-full resize-y rounded-lg border border-slate-300 p-3 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label htmlFor="sql-output" className="block text-sm font-medium text-slate-700">
              {minify ? 'Minified SQL' : 'Formatted SQL'}
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => copy(result.output)} disabled={!result.output} className={`${btn} bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700`}>
                Copy
              </button>
              <button type="button" onClick={() => downloadText(result.output + '\n', 'query.sql')} disabled={!result.output} className={`${btn} bg-slate-100 px-3 py-1 text-xs text-slate-800 hover:bg-slate-200`}>
                Download
              </button>
            </div>
          </div>
          <textarea
            id="sql-output"
            value={result.output}
            readOnly
            spellCheck={false}
            placeholder="Formatted SQL appears here as you type."
            className="h-80 w-full resize-y rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {result.error && (
        <div id="sql-error" role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          <p className="font-semibold">This SQL could not be parsed for the selected dialect.</p>
          <p className="mt-1 break-words font-mono text-xs">{result.error}</p>
          <p className="mt-1">Check for unclosed quotes or brackets, or try a different dialect.</p>
        </div>
      )}

      <p aria-live="polite" className="mt-2 min-h-[1.25rem] text-sm text-slate-600">
        {notice}
      </p>
    </div>
  );
}
