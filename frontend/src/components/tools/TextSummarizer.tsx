import { useState } from 'react';
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

// Matches the backend validation (max:50000). The summary itself is short, so long input is fine.
const MIN_CHARS = 50;
const MAX_CHARS = 50000;

type Length = 'short' | 'medium' | 'long';
type Focus = 'general' | 'key-points' | 'detailed';

interface SummaryResponse {
  summary: string;
  original_length?: number;
  summary_length?: number;
  compression_ratio?: number;
}

export default function TextSummarizer() {
  const { text, setText, onChange, truncated } = useLimitedText(MAX_CHARS);
  const [summary, setSummary] = useState('');
  const [length, setLength] = useState<Length>('medium');
  const [focus, setFocus] = useState<Focus>('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [sourceWords, setSourceWords] = useState(0);
  const nextSignal = useAbortableRequest();
  const { copied, copyError, copy } = useCopyToClipboard();

  const handleSummarize = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setInvalid(true);
      setError('Please enter or paste some text to summarize.');
      return;
    }
    if (trimmed.length < MIN_CHARS) {
      setInvalid(true);
      setError(`Please enter at least ${MIN_CHARS} characters so there is something to summarize (currently ${trimmed.length}).`);
      return;
    }

    setInvalid(false);
    setLoading(true);
    setError('');
    setSummary('');

    try {
      const data = await postAiTool<SummaryResponse>('/ai-tools/text-summarizer/summarize', { text: trimmed, length, focus }, nextSignal());
      const result = typeof data.summary === 'string' ? data.summary.trim() : '';
      if (!result) throw new AiToolError('The AI returned an empty summary. Please try again.', 200);
      setSourceWords(countWords(trimmed));
      setSummary(result);
    } catch (err) {
      if (isAbortError(err)) return;
      setError(err instanceof Error ? err.message : 'Something went wrong while generating the summary.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText('');
    setSummary('');
    setError('');
    setInvalid(false);
  };

  const originalWords = sourceWords;
  const summaryWords = countWords(summary);
  const reduction = originalWords > 0 && summaryWords > 0 ? Math.max(0, Math.round((1 - summaryWords / originalWords) * 100)) : null;

  return (
    <ToolCard>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="summary-length" className="mb-2 block text-sm font-medium text-gray-700">
            Summary length
          </label>
          <select id="summary-length" value={length} onChange={(e) => setLength(e.target.value as Length)} className={inputClass}>
            <option value="short">Short (2-3 sentences)</option>
            <option value="medium">Medium (1-2 paragraphs)</option>
            <option value="long">Long (3-5 paragraphs)</option>
          </select>
        </div>
        <div>
          <label htmlFor="summary-focus" className="mb-2 block text-sm font-medium text-gray-700">
            Focus
          </label>
          <select id="summary-focus" value={focus} onChange={(e) => setFocus(e.target.value as Focus)} className={inputClass}>
            <option value="general">General summary</option>
            <option value="key-points">Key points</option>
            <option value="detailed">Detailed summary</option>
          </select>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <label htmlFor="summarizer-input" className="block text-sm font-medium text-gray-700">
            Text to summarize
          </label>
          <button type="button" onClick={handleClear} disabled={!text && !summary && !error} className={secondaryButtonClass}>
            Clear
          </button>
        </div>
        <textarea
          id="summarizer-input"
          value={text}
          onChange={(e) => {
            onChange(e);
            if (invalid) setInvalid(false);
          }}
          onKeyDown={(e) => {
            if (isSubmitShortcut(e)) {
              e.preventDefault();
              if (!loading) void handleSummarize();
            }
          }}
          aria-invalid={invalid}
          aria-describedby="summarizer-counter"
          placeholder="Paste an article, report or notes here (at least 50 characters)…"
          className={`${inputClass} h-64 resize-y sm:h-80`}
        />
        <TextCounter id="summarizer-counter" text={text} min={MIN_CHARS} max={MAX_CHARS} truncated={truncated} />
      </div>

      <div className="space-y-3">
        <button type="button" onClick={handleSummarize} disabled={loading} className={primaryButtonClass}>
          {loading ? 'Summarizing…' : 'Generate summary'}
        </button>
        <AiNotice />
      </div>

      {loading && <LoadingNotice label="Generating your summary with AI." />}
      <ErrorAlert message={error} />

      {summary && (
        <section aria-labelledby="summary-heading" data-testid="ai-result">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 id="summary-heading" className="text-lg font-semibold text-gray-900">
              Summary
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <CopyFeedback copied={copied === 'summary'} copyError={copyError} />
              <button type="button" onClick={() => copy(summary, 'summary')} className={secondaryButtonClass}>
                Copy summary
              </button>
              <button type="button" onClick={() => downloadTextFile(summary, 'summary.txt')} className={secondaryButtonClass}>
                Download .txt
              </button>
            </div>
          </div>
          <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
            <p className="whitespace-pre-wrap break-words leading-relaxed text-gray-800" data-testid="ai-result-text">
              {summary}
            </p>
          </div>
          <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-blue-50 p-3">
              <dt className="text-sm text-gray-600">Original</dt>
              <dd className="text-xl font-bold text-blue-700">{originalWords.toLocaleString()} words</dd>
            </div>
            <div className="rounded-lg bg-green-50 p-3">
              <dt className="text-sm text-gray-600">Summary</dt>
              <dd className="text-xl font-bold text-green-700">{summaryWords.toLocaleString()} words</dd>
            </div>
            <div className="rounded-lg bg-purple-50 p-3">
              <dt className="text-sm text-gray-600">Shorter by</dt>
              <dd className="text-xl font-bold text-purple-700">{reduction === null ? '–' : `${reduction}%`}</dd>
            </div>
          </dl>
        </section>
      )}
    </ToolCard>
  );
}
