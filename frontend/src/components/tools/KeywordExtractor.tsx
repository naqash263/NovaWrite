import { useMemo, useState } from 'react';
import {
  AiToolError,
  countWords,
  downloadTextFile,
  isAbortError,
  isSubmitShortcut,
  postAiTool,
  useAbortableRequest,
  useCopyToClipboard,
  useLimitedText,
} from './aiToolClient';
import {
  AiNotice,
  CopyFeedback,
  ErrorAlert,
  LoadingNotice,
  TextCounter,
  ToolCard,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from './AiToolParts';

// Matches the backend validation (min:10, max:10000).
const MIN_CHARS = 10;
const MAX_CHARS = 10000;

interface KeywordResponse {
  keywords?: unknown;
}

/** Cleans the model's list: strips numbering/bullets/quotes, drops labels and duplicates. */
function cleanKeywords(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') continue;
    const kw = item
      .replace(/^\s*(?:\d+[.)]|[-*•])\s*/u, '')
      .replace(/^["'`]+|["'`.]+$/gu, '')
      .replace(/^keywords?:\s*/iu, '')
      .trim();
    const key = kw.toLowerCase();
    if (kw.length < 2 || kw.length > 80 || seen.has(key)) continue;
    seen.add(key);
    out.push(kw);
  }
  return out;
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Whole-word, case-insensitive occurrences of a keyword phrase in the text. */
function countOccurrences(text: string, keyword: string): number {
  try {
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(keyword).replace(/\s+/g, '\\s+')}(?![\\p{L}\\p{N}])`, 'giu');
    return text.match(re)?.length ?? 0;
  } catch {
    return 0;
  }
}

const csvCell = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`;

export default function KeywordExtractor() {
  const { text, setText, onChange, truncated } = useLimitedText(MAX_CHARS);
  const [maxKeywords, setMaxKeywords] = useState(10);
  const [includeRelated, setIncludeRelated] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [sourceText, setSourceText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invalid, setInvalid] = useState(false);
  const nextSignal = useAbortableRequest();
  const { copied, copyError, copy } = useCopyToClipboard();

  const rows = useMemo(() => {
    const total = countWords(sourceText);
    return keywords.map((keyword) => {
      const count = countOccurrences(sourceText, keyword);
      const density = total > 0 ? ((count * countWords(keyword)) / total) * 100 : 0;
      return { keyword, count, density };
    });
  }, [keywords, sourceText]);

  const extractKeywords = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setInvalid(true);
      setError('Please enter or paste some text to extract keywords from.');
      return;
    }
    if (trimmed.length < MIN_CHARS) {
      setInvalid(true);
      setError(`Please enter at least ${MIN_CHARS} characters (currently ${trimmed.length}).`);
      return;
    }

    setInvalid(false);
    setLoading(true);
    setError('');
    setKeywords([]);

    try {
      const data = await postAiTool<KeywordResponse>(
        '/ai-tools/keyword-extractor/extract',
        { text: trimmed, maxKeywords, includeRelated },
        nextSignal(),
      );
      const list = cleanKeywords(data.keywords);
      if (list.length === 0) throw new AiToolError('The AI did not return any keywords. Try a longer or more specific text.', 200);
      setSourceText(trimmed);
      setKeywords(list);
    } catch (err) {
      if (isAbortError(err)) return;
      setError(err instanceof Error ? err.message : 'Something went wrong while extracting keywords.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText('');
    setKeywords([]);
    setError('');
    setInvalid(false);
  };

  const downloadCsv = () => {
    const lines = [['keyword', 'occurrences', 'density_percent'].map(csvCell).join(',')];
    for (const r of rows) lines.push([r.keyword, r.count, r.density.toFixed(2)].map(csvCell).join(','));
    downloadTextFile(`${lines.join('\n')}\n`, 'keywords.csv', 'text/csv');
  };

  return (
    <ToolCard>
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <label htmlFor="keyword-input" className="block text-sm font-medium text-gray-700">
            Text to extract keywords from
          </label>
          <button type="button" onClick={handleClear} disabled={!text && keywords.length === 0 && !error} className={secondaryButtonClass}>
            Clear
          </button>
        </div>
        <textarea
          id="keyword-input"
          value={text}
          onChange={(e) => {
            onChange(e);
            if (invalid) setInvalid(false);
          }}
          onKeyDown={(e) => {
            if (isSubmitShortcut(e)) {
              e.preventDefault();
              if (!loading) void extractKeywords();
            }
          }}
          aria-invalid={invalid}
          aria-describedby="keyword-counter"
          placeholder="Paste a blog post, product page or document…"
          className={`${inputClass} h-48 resize-y`}
        />
        <TextCounter id="keyword-counter" text={text} min={MIN_CHARS} max={MAX_CHARS} truncated={truncated} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="max-keywords" className="mb-2 block text-sm font-medium text-gray-700">
            Maximum keywords: <span data-testid="max-keywords-value">{maxKeywords}</span>
          </label>
          <input
            id="max-keywords"
            type="range"
            min={5}
            max={50}
            step={1}
            value={maxKeywords}
            onChange={(e) => setMaxKeywords(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
          <div className="mt-1 flex justify-between text-xs text-gray-500" aria-hidden="true">
            <span>5</span>
            <span>50</span>
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-3 self-center rounded-lg border border-gray-300 p-3 hover:bg-gray-50">
          <input
            type="checkbox"
            checked={includeRelated}
            onChange={(e) => setIncludeRelated(e.target.checked)}
            className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Include related keywords and synonyms</span>
        </label>
      </div>

      <div className="space-y-3">
        <button type="button" onClick={extractKeywords} disabled={loading} className={primaryButtonClass}>
          {loading ? 'Extracting keywords…' : 'Extract keywords'}
        </button>
        <AiNotice />
      </div>

      {loading && <LoadingNotice label="Extracting keywords with AI." />}
      <ErrorAlert message={error} />

      {rows.length > 0 && (
        <section aria-labelledby="keywords-heading" data-testid="ai-result" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="keywords-heading" className="text-lg font-semibold text-gray-900">
              Keywords ({rows.length})
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <CopyFeedback copied={copied === 'comma' || copied === 'list'} copyError={copyError} />
              <button type="button" onClick={() => copy(keywords.join(', '), 'comma')} className={secondaryButtonClass}>
                Copy comma-separated
              </button>
              <button type="button" onClick={() => copy(keywords.join('\n'), 'list')} className={secondaryButtonClass}>
                Copy as list
              </button>
              <button type="button" onClick={downloadCsv} className={secondaryButtonClass}>
                Download CSV
              </button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Keyword
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    In your text
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Density
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100" data-testid="ai-result-text">
                {rows.map((r) => (
                  <tr key={r.keyword}>
                    <td className="break-words px-3 py-2 font-medium text-gray-900">{r.keyword}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-700">{r.count === 0 ? 'related' : `${r.count}×`}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-700">{r.count === 0 ? '–' : `${r.density.toFixed(1)}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500">
            Occurrences and density are counted in your browser (whole-word, case-insensitive). “related” means the AI suggested a term that
            does not appear in your text. Search volumes are not included.
          </p>
        </section>
      )}
    </ToolCard>
  );
}
