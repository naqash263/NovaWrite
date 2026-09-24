import { useEffect, useMemo, useState, type ReactNode } from 'react';

const FLAGS = [
  { flag: 'g', label: 'global', hint: 'Find all matches, not just the first' },
  { flag: 'i', label: 'ignore case', hint: 'Case-insensitive matching' },
  { flag: 'm', label: 'multiline', hint: '^ and $ match at line breaks' },
  { flag: 's', label: 'dotAll', hint: '. also matches line breaks' },
  { flag: 'u', label: 'unicode', hint: 'Full Unicode matching and stricter syntax' },
  { flag: 'y', label: 'sticky', hint: 'Match only at lastIndex' },
] as const;

const PRESETS = [
  { name: 'Email address', pattern: '[\\w.+-]+@[\\w-]+\\.[\\w.-]+', sample: 'Contact ada@example.com or grace.hopper+news@navy.mil today' },
  { name: 'URL', pattern: 'https?:\\/\\/[^\\s/$.?#][^\\s]*', sample: 'Visit https://example.com/docs?page=2 or http://test.org today' },
  { name: 'IPv4 address', pattern: '\\b(?:(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\b', sample: 'Hosts: 192.168.0.1, 10.0.0.255 and 999.1.1.1' },
  { name: 'Date (YYYY-MM-DD)', pattern: '\\b(\\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])\\b', sample: 'Released 2026-09-24, patched 2026-10-01.' },
  { name: 'Hex colour', pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b', sample: 'Brand colours: #1d4ed8, #fff and #10B981.' },
  { name: 'Named groups', pattern: '(?<key>\\w+)=(?<value>[^&\\s]+)', sample: 'utm_source=newsletter&utm_medium=email' },
];

const MAX_TEXT = 200_000;
const MAX_MATCHES = 2_000;

interface Match {
  text: string;
  index: number;
  groups: (string | undefined)[];
}

type Outcome =
  | { kind: 'idle' }
  | { kind: 'error'; message: string }
  | { kind: 'ok'; matches: Match[]; truncated: boolean; ms: number; replaced?: string };

/**
 * Heuristic for patterns that can backtrack exponentially in JavaScript's regex engine,
 * such as (a+)+, (\w*)* or (a|a)*. Browsers cannot interrupt a running regex, so these are
 * only run on demand.
 */
function riskyPattern(pattern: string) {
  return /\((?:[^()\\]|\\.)*(?:[+*]|,\})(?:[^()\\]|\\.)*\)(?:[+*]|\{\d+,\})/.test(pattern) || /\(([^()|]+)\|\1\)[+*{]/.test(pattern);
}

/** Names of capture groups in order (undefined for unnamed groups). */
function groupNames(pattern: string): (string | undefined)[] {
  const names: (string | undefined)[] = [];
  let inClass = false;
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === '\\') {
      i++;
      continue;
    }
    if (inClass) {
      if (c === ']') inClass = false;
      continue;
    }
    if (c === '[') inClass = true;
    else if (c === '(') {
      if (pattern[i + 1] !== '?') names.push(undefined);
      else {
        const named = pattern.slice(i).match(/^\(\?<([A-Za-z_$][\w$]*)>/);
        if (named) names.push(named[1]);
      }
    }
  }
  return names;
}

function runRegex(pattern: string, flags: string, text: string, replacement: string | null): Outcome {
  let re: RegExp;
  try {
    re = new RegExp(pattern, flags);
  } catch (e) {
    return { kind: 'error', message: e instanceof Error ? e.message : 'Invalid regular expression' };
  }
  const start = performance.now();
  const matches: Match[] = [];
  const repeat = flags.includes('g');
  let truncated = false;
  re.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    matches.push({ text: m[0], index: m.index, groups: m.slice(1) });
    if (!repeat) break;
    if (matches.length >= MAX_MATCHES) {
      truncated = true;
      break;
    }
    if (m[0] === '') {
      const code = text.codePointAt(re.lastIndex) ?? 0;
      re.lastIndex += flags.includes('u') && code > 0xffff ? 2 : 1;
    }
  }
  let replaced: string | undefined;
  if (replacement !== null) {
    re.lastIndex = 0;
    replaced = text.replace(re, replacement);
  }
  return { kind: 'ok', matches, truncated, ms: performance.now() - start, replaced };
}

function Highlighted({ text, matches }: { text: string; matches: Match[] }) {
  const parts: ReactNode[] = [];
  let pos = 0;
  matches.forEach((m, i) => {
    if (m.index < pos) return;
    if (m.index > pos) parts.push(text.slice(pos, m.index));
    parts.push(
      <mark key={i} title={`Match ${i + 1}`} className={`rounded px-0.5 ${i % 2 ? 'bg-amber-200' : 'bg-yellow-300'}`}>
        {m.text || '​'}
      </mark>,
    );
    pos = m.index + m.text.length;
  });
  parts.push(text.slice(pos));
  return <>{parts}</>;
}

const btn = 'rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export default function RegexTester() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('');
  const [useReplace, setUseReplace] = useState(false);
  const [replacement, setReplacement] = useState('');
  const [outcome, setOutcome] = useState<Outcome>({ kind: 'idle' });
  const [notice, setNotice] = useState('');

  const risky = useMemo(() => riskyPattern(pattern), [pattern]);
  const tooLong = text.length > MAX_TEXT;
  const live = !risky && !tooLong;

  const run = () => {
    if (!pattern) {
      setOutcome({ kind: 'idle' });
      return;
    }
    setOutcome(runRegex(pattern, flags, text.slice(0, MAX_TEXT), useReplace ? replacement : null));
  };

  useEffect(() => {
    if (!pattern) {
      setOutcome({ kind: 'idle' });
      return;
    }
    // Syntax errors are reported instantly even when live matching is paused.
    try {
      new RegExp(pattern, flags);
    } catch (e) {
      setOutcome({ kind: 'error', message: e instanceof Error ? e.message : 'Invalid regular expression' });
      return;
    }
    if (!live) {
      setOutcome({ kind: 'idle' });
      return;
    }
    const t = window.setTimeout(() => setOutcome(runRegex(pattern, flags, text, useReplace ? replacement : null)), 120);
    return () => window.clearTimeout(t);
  }, [pattern, flags, text, useReplace, replacement, live]);

  const onPatternChange = (value: string) => {
    // Accept a pasted literal such as /ab+c/gi and split it into pattern + flags.
    const literal = value.match(/^\/(.+)\/([dgimsuvy]*)$/s);
    if (literal && !pattern) {
      setPattern(literal[1]);
      setFlags(Array.from(new Set(literal[2].replace(/[dv]/g, ''))).join(''));
      return;
    }
    setPattern(value);
  };

  const toggleFlag = (flag: string) => setFlags((f) => (f.includes(flag) ? f.replace(flag, '') : FLAGS.map((x) => x.flag).filter((x) => f.includes(x) || x === flag).join('')));

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice((n) => (n === msg ? '' : n)), 2500);
  };

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      flash('Copied to clipboard.');
    } catch {
      flash('Copy failed. Select the text and press Ctrl+C.');
    }
  };

  const matches = outcome.kind === 'ok' ? outcome.matches : [];
  const names = useMemo(() => groupNames(pattern), [pattern]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <div>
            <label htmlFor="regex-pattern" className="mb-1.5 block text-sm font-medium text-slate-700">
              Regular expression
            </label>
            <div className="flex items-stretch overflow-hidden rounded-lg border border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500">
              <span className="flex items-center bg-slate-50 px-2 font-mono text-slate-400" aria-hidden="true">/</span>
              <input
                id="regex-pattern"
                type="text"
                value={pattern}
                onChange={(e) => onPatternChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') run();
                }}
                spellCheck={false}
                autoComplete="off"
                aria-invalid={outcome.kind === 'error'}
                aria-describedby={outcome.kind === 'error' ? 'regex-error' : undefined}
                placeholder="e.g. (\w+)@(\w+)\.com"
                className="min-w-0 flex-1 px-1 py-2.5 font-mono text-sm focus:outline-none"
              />
              <span className="flex items-center bg-slate-50 px-2 font-mono text-slate-500" data-testid="regex-flags-display">
                /{flags}
              </span>
            </div>
          </div>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-slate-700">Flags</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {FLAGS.map(({ flag, label, hint }) => (
                <label key={flag} className="flex items-center gap-1.5 text-sm text-slate-700" title={hint}>
                  <input type="checkbox" checked={flags.includes(flag)} onChange={() => toggleFlag(flag)} className="h-4 w-4 rounded border-slate-300" />
                  <span className="font-mono font-semibold">{flag}</span>
                  <span className="text-slate-500">{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="regex-text" className="mb-1.5 block text-sm font-medium text-slate-700">
              Test string
            </label>
            <textarea
              id="regex-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              spellCheck={false}
              placeholder="Paste the text to search…"
              className="h-40 w-full resize-y rounded-lg border border-slate-300 p-3 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={useReplace} onChange={(e) => setUseReplace(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
              Replace matches
            </label>
            {useReplace && (
              <div className="mt-2">
                <label htmlFor="regex-replacement" className="sr-only">
                  Replacement
                </label>
                <input
                  id="regex-replacement"
                  type="text"
                  value={replacement}
                  onChange={(e) => setReplacement(e.target.value)}
                  spellCheck={false}
                  placeholder="Replacement, e.g. $2 or $<name>"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-slate-500">Use $1, $2 … for numbered groups, $&lt;name&gt; for named groups and $&amp; for the whole match.</p>
              </div>
            )}
          </div>

          {(risky || tooLong) && pattern && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" data-testid="regex-risky">
              {tooLong
                ? `The test string is longer than ${MAX_TEXT.toLocaleString()} characters, so live matching is paused and only the first ${MAX_TEXT.toLocaleString()} characters are tested.`
                : 'This pattern has nested quantifiers (like (a+)+) that can cause catastrophic backtracking and freeze the page on some inputs. Live matching is paused.'}
              <button type="button" onClick={run} className={`${btn} ml-0 mt-2 block bg-amber-600 px-3 py-1.5 text-white hover:bg-amber-700`}>
                Run once
              </button>
            </div>
          )}

          {outcome.kind === 'error' && (
            <div id="regex-error" role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
              <p className="font-semibold">Invalid pattern</p>
              <p className="mt-1 break-words font-mono text-xs">{outcome.message}</p>
            </div>
          )}

          {outcome.kind === 'ok' && (
            <div className="space-y-3">
              <p
                data-testid="regex-summary"
                className={`rounded-lg border px-3 py-2 text-sm ${matches.length ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}
              >
                {matches.length
                  ? `${matches.length.toLocaleString()}${outcome.truncated ? '+' : ''} match${matches.length === 1 ? '' : 'es'}${!flags.includes('g') && matches.length ? ' (first match only – enable g for all)' : ''}`
                  : 'No matches'}
                <span className="text-slate-500"> · {outcome.ms < 1 ? '<1' : Math.round(outcome.ms)} ms</span>
              </p>

              {text && matches.length > 0 && (
                <div>
                  <h2 className="mb-1.5 text-sm font-semibold text-slate-700">Highlighted matches</h2>
                  <div data-testid="regex-highlight" className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-sm">
                    <Highlighted text={text.slice(0, MAX_TEXT)} matches={matches} />
                  </div>
                </div>
              )}

              {outcome.replaced !== undefined && (
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-700">Replacement result</h2>
                    <button type="button" onClick={() => copy(outcome.replaced ?? '')} className={`${btn} bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700`}>
                      Copy
                    </button>
                  </div>
                  <pre data-testid="regex-replaced" className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-sm">
                    {outcome.replaced}
                  </pre>
                </div>
              )}

              {matches.length > 0 && (
                <div>
                  <h2 className="mb-1.5 text-sm font-semibold text-slate-700">Match details</h2>
                  <ol className="max-h-72 space-y-2 overflow-auto" data-testid="regex-matches">
                    {matches.slice(0, 200).map((m, i) => (
                      <li key={i} className="rounded-lg border border-slate-200 p-2.5 text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 font-mono">
                            <span className="text-slate-500">#{i + 1}</span> <span className="break-all font-semibold text-emerald-700">{m.text === '' ? '(empty)' : m.text}</span>
                            <span className="ml-2 text-xs text-slate-500">
                              index {m.index}–{m.index + m.text.length}
                            </span>
                          </div>
                          <button type="button" onClick={() => copy(m.text)} className="rounded px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label={`Copy match ${i + 1}`}>
                            Copy
                          </button>
                        </div>
                        {m.groups.length > 0 && (
                          <ul className="mt-1.5 space-y-0.5 pl-4 font-mono text-xs text-slate-700">
                            {m.groups.map((g, gi) => {
                              const name = names[gi];
                              return (
                                <li key={gi} className="break-all">
                                  Group {gi + 1}
                                  {name ? ` (${name})` : ''}: <span className="text-blue-800">{g === undefined ? 'undefined' : g === '' ? '(empty)' : g}</span>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ol>
                  {matches.length > 200 && <p className="mt-1 text-xs text-slate-500">Showing the first 200 matches.</p>}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="rounded-lg bg-slate-50 p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Common patterns</h2>
            <div className="space-y-2">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    setPattern(p.pattern);
                    setFlags('g');
                    if (!text) setText(p.sample);
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-left transition-colors hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <span className="block text-sm font-semibold text-slate-900">{p.name}</span>
                  <span className="block break-all font-mono text-xs text-slate-600">{p.pattern}</span>
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setPattern('');
              setText('');
              setReplacement('');
              setFlags('g');
            }}
            className={`${btn} mt-3 w-full bg-slate-100 text-slate-800 hover:bg-slate-200`}
          >
            Clear all
          </button>
        </div>
      </div>

      <p aria-live="polite" className="mt-2 min-h-[1.25rem] text-sm text-slate-600">
        {notice}
      </p>
    </div>
  );
}
