import { useMemo, useState } from 'react';
import {
  AiToolError,
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

// The AI reply (corrected text + suggestions as JSON) is capped at about 2,048 tokens,
// so input is limited to 5,000 characters to get the whole text back.
const MIN_CHARS = 10;
const MAX_CHARS = 5000;

interface GrammarResponse {
  corrected_text?: unknown;
  errors_found?: unknown;
  suggestions?: unknown;
  improvements?: unknown;
}

interface GrammarResult {
  original: string;
  corrected: string;
  errorsFound: number;
  suggestions: string[];
  improvements: string[];
}

/** The model sometimes returns objects instead of strings; render them as text. */
function toTextList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object') {
        return Object.values(item as Record<string, unknown>)
          .filter((v) => typeof v === 'string' || typeof v === 'number')
          .join(' → ')
          .trim();
      }
      return item == null ? '' : String(item);
    })
    .filter(Boolean);
}

type DiffPart = { type: 'same' | 'removed' | 'added'; text: string };

/** Word-level diff (LCS) between the original and corrected text. Returns null for very long input. */
function diffWords(before: string, after: string): DiffPart[] | null {
  const a = before.match(/\S+\s*/g) ?? [];
  const b = after.match(/\S+\s*/g) ?? [];
  if (a.length * b.length > 4_000_000) return null;
  const key = (t: string) => t.trim();
  const cols = b.length + 1;
  const table = new Uint16Array((a.length + 1) * cols);
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i * cols + j] =
        key(a[i]) === key(b[j]) ? table[(i + 1) * cols + j + 1] + 1 : Math.max(table[(i + 1) * cols + j], table[i * cols + j + 1]);
    }
  }
  const parts: DiffPart[] = [];
  const push = (type: DiffPart['type'], text: string) => {
    const last = parts[parts.length - 1];
    if (last && last.type === type) last.text += text;
    else parts.push({ type, text });
  };
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (key(a[i]) === key(b[j])) {
      push('same', b[j]);
      i++;
      j++;
    } else if (table[(i + 1) * cols + j] >= table[i * cols + j + 1]) {
      push('removed', a[i++]);
    } else {
      push('added', b[j++]);
    }
  }
  while (i < a.length) push('removed', a[i++]);
  while (j < b.length) push('added', b[j++]);
  return parts;
}

export default function GrammarChecker() {
  const { text, setText, onChange, truncated } = useLimitedText(MAX_CHARS);
  const [checkSpelling, setCheckSpelling] = useState(true);
  const [checkGrammar, setCheckGrammar] = useState(true);
  const [checkStyle, setCheckStyle] = useState(true);
  const [suggestImprovements, setSuggestImprovements] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [result, setResult] = useState<GrammarResult | null>(null);
  const nextSignal = useAbortableRequest();
  const { copied, copyError, copy } = useCopyToClipboard();

  const diff = useMemo(() => (result ? diffWords(result.original, result.corrected) : null), [result]);
  const unchanged = result ? result.original.trim() === result.corrected.trim() : false;

  const handleCheck = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setInvalid(true);
      setError('Please enter or paste some text to check.');
      return;
    }
    if (trimmed.length < MIN_CHARS) {
      setInvalid(true);
      setError(`Please enter at least ${MIN_CHARS} characters to check (currently ${trimmed.length}).`);
      return;
    }

    setInvalid(false);
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await postAiTool<GrammarResponse>(
        '/ai-tools/grammar-checker/check',
        {
          text: trimmed,
          check_spelling: checkSpelling,
          check_grammar: checkGrammar,
          check_style: checkStyle,
          suggest_improvements: suggestImprovements,
        },
        nextSignal(),
      );
      const corrected = typeof data.corrected_text === 'string' ? data.corrected_text.trim() : '';
      if (!corrected) throw new AiToolError('The AI did not return a corrected version. Please try again.', 200);
      const errors = Number(data.errors_found);
      setResult({
        original: trimmed,
        corrected,
        errorsFound: Number.isFinite(errors) && errors >= 0 ? Math.round(errors) : 0,
        suggestions: toTextList(data.suggestions),
        improvements: suggestImprovements ? toTextList(data.improvements) : [],
      });
    } catch (err) {
      if (isAbortError(err)) return;
      setError(err instanceof Error ? err.message : 'Something went wrong while checking your text.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText('');
    setResult(null);
    setError('');
    setInvalid(false);
  };

  const options = [
    { label: 'Spelling', checked: checkSpelling, set: setCheckSpelling },
    { label: 'Grammar', checked: checkGrammar, set: setCheckGrammar },
    { label: 'Style', checked: checkStyle, set: setCheckStyle },
    { label: 'Suggest improvements', checked: suggestImprovements, set: setSuggestImprovements },
  ];

  return (
    <ToolCard>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-gray-700">Check for</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          {options.map((o) => (
            <label key={o.label} className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-300 p-3 hover:bg-gray-50">
              <input
                type="checkbox"
                checked={o.checked}
                onChange={(e) => o.set(e.target.checked)}
                className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{o.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <label htmlFor="grammar-input" className="block text-sm font-medium text-gray-700">
            Text to check
          </label>
          <button type="button" onClick={handleClear} disabled={!text && !result && !error} className={secondaryButtonClass}>
            Clear
          </button>
        </div>
        <textarea
          id="grammar-input"
          value={text}
          onChange={(e) => {
            onChange(e);
            if (invalid) setInvalid(false);
          }}
          onKeyDown={(e) => {
            if (isSubmitShortcut(e)) {
              e.preventDefault();
              if (!loading) void handleCheck();
            }
          }}
          aria-invalid={invalid}
          aria-describedby="grammar-counter"
          spellCheck={false}
          placeholder="Paste an email, essay or post to check spelling, grammar and style…"
          className={`${inputClass} h-64 resize-y sm:h-80`}
        />
        <TextCounter id="grammar-counter" text={text} min={MIN_CHARS} max={MAX_CHARS} truncated={truncated} />
      </div>

      <div className="space-y-3">
        <button type="button" onClick={handleCheck} disabled={loading} className={primaryButtonClass}>
          {loading ? 'Checking…' : 'Check grammar'}
        </button>
        <AiNotice />
      </div>

      {loading && <LoadingNotice label="Checking your text with AI." />}
      <ErrorAlert message={error} />

      {result && (
        <section aria-labelledby="grammar-result-heading" data-testid="ai-result" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="grammar-result-heading" className="text-lg font-semibold text-gray-900">
              Corrected text
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <CopyFeedback copied={copied === 'corrected'} copyError={copyError} />
              <button type="button" onClick={() => copy(result.corrected, 'corrected')} className={secondaryButtonClass}>
                Copy corrected text
              </button>
              <button type="button" onClick={() => downloadTextFile(result.corrected, 'corrected-text.txt')} className={secondaryButtonClass}>
                Download .txt
              </button>
              <button type="button" onClick={() => setText(result.corrected)} className={secondaryButtonClass}>
                Replace my text
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-700" data-testid="grammar-summary">
            {unchanged
              ? 'No changes suggested. The AI did not find errors to correct.'
              : `${result.errorsFound > 0 ? `${result.errorsFound} issue${result.errorsFound === 1 ? '' : 's'} reported by the AI. ` : ''}Changes are highlighted below: removed words are struck through in red, added words are underlined in green.`}
          </p>

          {!unchanged && diff && (
            <div className="rounded-lg border border-gray-300 bg-white p-4" data-testid="grammar-diff">
              <p className="whitespace-pre-wrap break-words leading-relaxed text-gray-800">
                {diff.map((part, i) =>
                  part.type === 'same' ? (
                    <span key={i}>{part.text}</span>
                  ) : part.type === 'removed' ? (
                    <del key={i} className="rounded bg-red-50 text-red-700 line-through">
                      <span className="sr-only">removed: </span>
                      {part.text}
                    </del>
                  ) : (
                    <ins key={i} className="rounded bg-green-50 text-green-800 underline decoration-green-600">
                      <span className="sr-only">added: </span>
                      {part.text}
                    </ins>
                  ),
                )}
              </p>
            </div>
          )}

          <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
            <p className="whitespace-pre-wrap break-words leading-relaxed text-gray-800" data-testid="ai-result-text">
              {result.corrected}
            </p>
          </div>

          {result.suggestions.length > 0 && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <h3 className="mb-2 font-semibold text-gray-900">Suggestions</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                {result.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {result.improvements.length > 0 && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <h3 className="mb-2 font-semibold text-gray-900">Improvements</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                {result.improvements.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </ToolCard>
  );
}
