import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'tool:word-counter:draft';
const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu;
const HAS_WORD_CHAR = /[\p{L}\p{N}]/u;
const STOP_WORDS = new Set(
  'a an and are as at be but by for from has have he her his i in is it its of on or our she so that the their them they this to was we were will with you your not can do if my me all been than then there these those into out up about what which who how when'.split(
    ' ',
  ),
);

const LIMITS = [
  { label: 'SEO title', max: 60 },
  { label: 'Meta description', max: 160 },
  { label: 'X (Twitter) post', max: 280 },
];

function countGraphemes(text: string): number {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].length;
  }
  return Array.from(text).length;
}

/** Whitespace-separated words that contain a letter or digit; each CJK ideograph/kana counts as one word. */
function getWords(text: string): string[] {
  return text
    .replace(CJK, (c) => ` ${c} `)
    .split(/\s+/)
    .filter((w) => HAS_WORD_CHAR.test(w));
}

function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const groups = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '').match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0 sec';
  const totalSec = Math.max(1, Math.round(minutes * 60));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m ? `${m} min${s ? ` ${s} sec` : ''}` : `${s} sec`;
}

function analyze(text: string) {
  const words = getWords(text);
  const sentences = text.split(/[.!?。！？]+(?=\s|$)/).filter((s) => HAS_WORD_CHAR.test(s)).length;
  const paragraphs = text.split(/\n+/).filter((p) => HAS_WORD_CHAR.test(p)).length;
  const lines = text ? text.split('\n').length : 0;
  const latinWords = words.filter((w) => /[a-z]/i.test(w));
  const syl = latinWords.reduce((sum, w) => sum + syllables(w), 0);
  const flesch =
    latinWords.length >= 10 && sentences > 0
      ? Math.round(206.835 - 1.015 * (latinWords.length / sentences) - 84.6 * (syl / latinWords.length))
      : null;

  const freq = new Map<string, number>();
  for (const raw of words) {
    const w = raw.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
    if (!w || STOP_WORDS.has(w) || (/^[a-z]+$/.test(w) && w.length < 3)) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  const keywords = [...freq.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 10);

  return {
    words: words.length,
    characters: countGraphemes(text),
    charactersNoSpaces: countGraphemes(text.replace(/\s/g, '')),
    sentences,
    paragraphs,
    lines,
    readingMinutes: words.length / 200,
    speakingMinutes: words.length / 150,
    flesch,
    keywords,
  };
}

function fleschLabel(score: number) {
  if (score >= 80) return 'Easy';
  if (score >= 60) return 'Plain English';
  if (score >= 50) return 'Fairly difficult';
  if (score >= 30) return 'Difficult';
  return 'Very difficult';
}

export default function WordCounter() {
  const [text, setText] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? '';
    } catch {
      return '';
    }
  });
  const [status, setStatus] = useState('');
  const stats = useMemo(() => analyze(text), [text]);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        if (text) localStorage.setItem(STORAGE_KEY, text);
        else localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* storage unavailable: ignore */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [text]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('Text copied to clipboard.');
    } catch {
      setStatus('Copy failed. Select the text and copy it manually.');
    }
  };

  const primary = [
    { label: 'Words', value: stats.words, testId: 'stat-words', color: 'text-green-700 bg-green-50' },
    { label: 'Characters', value: stats.characters, testId: 'stat-characters', color: 'text-blue-700 bg-blue-50' },
    { label: 'Characters (no spaces)', value: stats.charactersNoSpaces, testId: 'stat-characters-no-spaces', color: 'text-sky-700 bg-sky-50' },
    { label: 'Sentences', value: stats.sentences, testId: 'stat-sentences', color: 'text-purple-700 bg-purple-50' },
    { label: 'Paragraphs', value: stats.paragraphs, testId: 'stat-paragraphs', color: 'text-orange-700 bg-orange-50' },
    { label: 'Lines', value: stats.lines, testId: 'stat-lines', color: 'text-gray-700 bg-gray-50' },
  ];

  return (
    <div className="rounded-lg bg-white p-4 shadow-lg sm:p-6">
      <div className="space-y-6">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-live="polite">
          {primary.map((s) => (
            <div key={s.label} className={`rounded-lg p-3 ${s.color}`}>
              <dt className="text-xs text-gray-600 sm:text-sm">{s.label}</dt>
              <dd className="text-2xl font-bold" data-testid={s.testId}>
                {s.value.toLocaleString()}
              </dd>
            </div>
          ))}
        </dl>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="wc-text" className="block text-sm font-medium text-gray-700">
              Your text
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copy}
                disabled={!text}
                className="rounded-lg bg-gray-700 px-3 py-1.5 text-sm text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                Copy
              </button>
              <button
                type="button"
                onClick={() => setText('')}
                disabled={!text}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          </div>
          <textarea
            id="wc-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Start typing or paste your text here…"
            className="h-64 w-full resize-y rounded-lg border border-gray-300 p-4 text-base focus:border-transparent focus:ring-2 focus:ring-blue-500 sm:h-80"
          />
          <p aria-live="polite" className="mt-1 min-h-[1.25rem] text-sm text-green-700">
            {status}
          </p>
          <p className="text-xs text-gray-500">Your draft is kept only in this browser (local storage) so it survives a page refresh.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-lg bg-gray-50 p-4">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Time and readability</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-gray-600">Reading time (200 wpm)</dt>
                <dd className="font-semibold" data-testid="stat-reading-time">
                  {formatDuration(stats.readingMinutes)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-600">Speaking time (150 wpm)</dt>
                <dd className="font-semibold">{formatDuration(stats.speakingMinutes)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-600">Average word length</dt>
                <dd className="font-semibold">{stats.words ? (stats.charactersNoSpaces / stats.words).toFixed(1) : 0} chars</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-600">Average sentence length</dt>
                <dd className="font-semibold">{stats.sentences ? (stats.words / stats.sentences).toFixed(1) : 0} words</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-600">Flesch reading ease (English, approx.)</dt>
                <dd className="font-semibold">{stats.flesch === null ? '—' : `${stats.flesch} · ${fleschLabel(stats.flesch)}`}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Top keywords</h2>
            {stats.keywords.length ? (
              <ol className="space-y-1 text-sm" data-testid="keyword-list">
                {stats.keywords.map(([word, count]) => (
                  <li key={word} className="flex justify-between gap-2">
                    <span className="break-all text-gray-800">{word}</span>
                    <span className="whitespace-nowrap font-semibold text-blue-700">
                      {count} · {((count / stats.words) * 100).toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-gray-500">Keywords appear here once you add text (common words like “the” are skipped).</p>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-gray-50 p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Character limits</h2>
          <ul className="space-y-3">
            {LIMITS.map((l) => {
              const over = stats.characters > l.max;
              return (
                <li key={l.label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-700">{l.label}</span>
                    <span className={over ? 'font-semibold text-red-700' : 'text-gray-600'}>
                      {stats.characters} / {l.max}
                      {over ? ` (${stats.characters - l.max} over)` : ''}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200" aria-hidden="true">
                    <div
                      className={`h-2 rounded-full ${over ? 'bg-red-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(100, (stats.characters / l.max) * 100)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
