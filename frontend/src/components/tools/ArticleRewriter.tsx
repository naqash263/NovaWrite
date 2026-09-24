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

// The backend accepts 50,000 characters, but the AI model's reply is capped at about
// 2,048 tokens, so longer input would come back cut off. 5,000 characters keeps the
// rewritten text complete.
const MIN_CHARS = 50;
const MAX_CHARS = 5000;

type Style = 'formal' | 'casual' | 'creative' | 'academic' | 'professional';
type Tone = 'neutral' | 'positive' | 'persuasive' | 'informative';

interface RewriteResponse {
  rewritten_text: string;
}

export default function ArticleRewriter() {
  const { text, setText, onChange, truncated } = useLimitedText(MAX_CHARS);
  const [rewrittenText, setRewrittenText] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [style, setStyle] = useState<Style>('formal');
  const [tone, setTone] = useState<Tone>('neutral');
  const [preserveMeaning, setPreserveMeaning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invalid, setInvalid] = useState(false);
  const nextSignal = useAbortableRequest();
  const { copied, copyError, copy } = useCopyToClipboard();

  const handleRewrite = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setInvalid(true);
      setError('Please enter or paste some text to rewrite.');
      return;
    }
    if (trimmed.length < MIN_CHARS) {
      setInvalid(true);
      setError(`Please enter at least ${MIN_CHARS} characters to rewrite (currently ${trimmed.length}).`);
      return;
    }

    setInvalid(false);
    setLoading(true);
    setError('');
    setRewrittenText('');

    try {
      const data = await postAiTool<RewriteResponse>(
        '/ai-tools/article-rewriter/rewrite',
        { text: trimmed, style, tone, preserve_meaning: preserveMeaning },
        nextSignal(),
      );
      const result = typeof data.rewritten_text === 'string' ? data.rewritten_text.trim() : '';
      if (!result) throw new AiToolError('The AI returned an empty rewrite. Please try again.', 200);
      setSourceText(trimmed);
      setRewrittenText(result);
    } catch (err) {
      if (isAbortError(err)) return;
      setError(err instanceof Error ? err.message : 'Something went wrong while rewriting your text.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText('');
    setRewrittenText('');
    setError('');
    setInvalid(false);
  };

  return (
    <ToolCard>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="rewrite-style" className="mb-2 block text-sm font-medium text-gray-700">
            Writing style
          </label>
          <select id="rewrite-style" value={style} onChange={(e) => setStyle(e.target.value as Style)} className={inputClass}>
            <option value="formal">Formal</option>
            <option value="casual">Casual</option>
            <option value="creative">Creative</option>
            <option value="academic">Academic</option>
            <option value="professional">Professional</option>
          </select>
        </div>
        <div>
          <label htmlFor="rewrite-tone" className="mb-2 block text-sm font-medium text-gray-700">
            Tone
          </label>
          <select id="rewrite-tone" value={tone} onChange={(e) => setTone(e.target.value as Tone)} className={inputClass}>
            <option value="neutral">Neutral</option>
            <option value="positive">Positive</option>
            <option value="persuasive">Persuasive</option>
            <option value="informative">Informative</option>
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-gray-300 p-3 hover:bg-gray-50">
            <input
              type="checkbox"
              checked={preserveMeaning}
              onChange={(e) => setPreserveMeaning(e.target.checked)}
              className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Keep the exact meaning</span>
          </label>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <label htmlFor="rewriter-input" className="block text-sm font-medium text-gray-700">
            Text to rewrite
          </label>
          <button type="button" onClick={handleClear} disabled={!text && !rewrittenText && !error} className={secondaryButtonClass}>
            Clear
          </button>
        </div>
        <textarea
          id="rewriter-input"
          value={text}
          onChange={(e) => {
            onChange(e);
            if (invalid) setInvalid(false);
          }}
          onKeyDown={(e) => {
            if (isSubmitShortcut(e)) {
              e.preventDefault();
              if (!loading) void handleRewrite();
            }
          }}
          aria-invalid={invalid}
          aria-describedby="rewriter-counter"
          placeholder="Paste a paragraph or article section to rewrite (at least 50 characters)…"
          className={`${inputClass} h-64 resize-y sm:h-80`}
        />
        <TextCounter id="rewriter-counter" text={text} min={MIN_CHARS} max={MAX_CHARS} truncated={truncated} />
        <p className="mt-1 text-xs text-gray-500">Longer articles? Rewrite them one section at a time so the full text comes back.</p>
      </div>

      <div className="space-y-3">
        <button type="button" onClick={handleRewrite} disabled={loading} className={primaryButtonClass}>
          {loading ? 'Rewriting…' : 'Rewrite text'}
        </button>
        <AiNotice />
      </div>

      {loading && <LoadingNotice label="Rewriting your text with AI." />}
      <ErrorAlert message={error} />

      {rewrittenText && (
        <section aria-labelledby="rewrite-heading" data-testid="ai-result">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 id="rewrite-heading" className="text-lg font-semibold text-gray-900">
              Rewritten text
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <CopyFeedback copied={copied === 'rewrite'} copyError={copyError} />
              <button type="button" onClick={() => copy(rewrittenText, 'rewrite')} className={secondaryButtonClass}>
                Copy rewritten text
              </button>
              <button type="button" onClick={() => downloadTextFile(rewrittenText, 'rewritten-text.txt')} className={secondaryButtonClass}>
                Download .txt
              </button>
              <button type="button" onClick={() => setText(rewrittenText)} className={secondaryButtonClass}>
                Use as input
              </button>
            </div>
          </div>
          <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
            <p className="whitespace-pre-wrap break-words leading-relaxed text-gray-800" data-testid="ai-result-text">
              {rewrittenText}
            </p>
          </div>
          <p className="mt-2 text-sm text-gray-600" data-testid="rewrite-stats">
            {countWords(sourceText).toLocaleString()} words in → {countWords(rewrittenText).toLocaleString()} words out. Check facts, names
            and numbers, and cite original sources where needed.
          </p>
        </section>
      )}
    </ToolCard>
  );
}
