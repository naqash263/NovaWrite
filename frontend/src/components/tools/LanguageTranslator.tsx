import { useState } from 'react';
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

// The backend accepts 50,000 characters, but the AI reply is capped at about 2,048 tokens,
// so a longer text would come back partly untranslated. 5,000 characters keeps it complete.
const MIN_CHARS = 1;
const MAX_CHARS = 5000;

const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Russian',
  'Chinese',
  'Japanese',
  'Korean',
  'Arabic',
  'Hindi',
  'Dutch',
  'Polish',
  'Turkish',
  'Swedish',
  'Norwegian',
  'Danish',
  'Finnish',
  'Greek',
  'Czech',
  'Romanian',
  'Hungarian',
  'Thai',
  'Vietnamese',
  'Indonesian',
  'Malay',
  'Hebrew',
  'Ukrainian',
];

const RTL = new Set(['Arabic', 'Hebrew']);

interface TranslateResponse {
  translated_text: string;
}

export default function LanguageTranslator() {
  const { text, setText, onChange, truncated } = useLimitedText(MAX_CHARS);
  const [translatedText, setTranslatedText] = useState('');
  const [translatedTo, setTranslatedTo] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('auto');
  const [targetLanguage, setTargetLanguage] = useState('English');
  const [preserveFormatting, setPreserveFormatting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invalid, setInvalid] = useState(false);
  const nextSignal = useAbortableRequest();
  const { copied, copyError, copy } = useCopyToClipboard();

  const handleTranslate = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setInvalid(true);
      setError('Please enter or paste some text to translate.');
      return;
    }
    if (sourceLanguage === targetLanguage) {
      setError('The source and target languages are the same. Choose a different target language.');
      return;
    }

    setInvalid(false);
    setLoading(true);
    setError('');
    setTranslatedText('');

    try {
      const data = await postAiTool<TranslateResponse>(
        '/ai-tools/language-translator/translate',
        { text: trimmed, source_language: sourceLanguage, target_language: targetLanguage, preserve_formatting: preserveFormatting },
        nextSignal(),
      );
      const result = typeof data.translated_text === 'string' ? data.translated_text.trim() : '';
      if (!result) throw new AiToolError('The AI returned an empty translation. Please try again.', 200);
      setTranslatedTo(targetLanguage);
      setTranslatedText(result);
    } catch (err) {
      if (isAbortError(err)) return;
      setError(err instanceof Error ? err.message : 'Something went wrong while translating your text.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText('');
    setTranslatedText('');
    setError('');
    setInvalid(false);
  };

  const canSwap = sourceLanguage !== 'auto';
  const swapLanguages = () => {
    if (!canSwap) return;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    if (translatedText) {
      setText(translatedText);
      setTranslatedText('');
    }
  };

  return (
    <ToolCard>
      <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <div>
          <label htmlFor="source-language" className="mb-2 block text-sm font-medium text-gray-700">
            Translate from
          </label>
          <select id="source-language" value={sourceLanguage} onChange={(e) => setSourceLanguage(e.target.value)} className={inputClass}>
            <option value="auto">Detect language</option>
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={swapLanguages}
          disabled={!canSwap}
          aria-label="Swap languages"
          title={canSwap ? 'Swap languages' : 'Choose a source language to swap'}
          className={`${secondaryButtonClass} h-[50px] justify-self-center px-4 text-lg sm:justify-self-auto`}
        >
          <span aria-hidden="true">⇄</span>
        </button>
        <div>
          <label htmlFor="target-language" className="mb-2 block text-sm font-medium text-gray-700">
            Translate to
          </label>
          <select id="target-language" value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} className={inputClass}>
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-300 p-3 hover:bg-gray-50">
        <input
          type="checkbox"
          checked={preserveFormatting}
          onChange={(e) => setPreserveFormatting(e.target.checked)}
          className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">Keep formatting (line breaks and paragraphs)</span>
      </label>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between gap-2">
            <label htmlFor="translator-input" className="block text-sm font-medium text-gray-700">
              Text to translate
            </label>
            <button type="button" onClick={handleClear} disabled={!text && !translatedText && !error} className={secondaryButtonClass}>
              Clear
            </button>
          </div>
          <textarea
            id="translator-input"
            value={text}
            onChange={(e) => {
              onChange(e);
              if (invalid) setInvalid(false);
            }}
            onKeyDown={(e) => {
              if (isSubmitShortcut(e)) {
                e.preventDefault();
                if (!loading) void handleTranslate();
              }
            }}
            dir="auto"
            aria-invalid={invalid}
            aria-describedby="translator-counter"
            placeholder="Type or paste text to translate…"
            className={`${inputClass} h-64 resize-y sm:h-80`}
          />
          <TextCounter id="translator-counter" text={text} min={MIN_CHARS} max={MAX_CHARS} truncated={truncated} />
        </div>

        <div className="min-w-0" data-testid={translatedText ? 'ai-result' : undefined}>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-gray-700">Translation{translatedText ? ` (${translatedTo})` : ''}</h2>
            {translatedText && (
              <div className="flex flex-wrap items-center gap-2">
                <CopyFeedback copied={copied === 'translation'} copyError={copyError} />
                <button type="button" onClick={() => copy(translatedText, 'translation')} className={secondaryButtonClass}>
                  Copy translation
                </button>
                <button
                  type="button"
                  onClick={() => downloadTextFile(translatedText, `translation-${translatedTo.toLowerCase()}.txt`)}
                  className={secondaryButtonClass}
                >
                  Download .txt
                </button>
              </div>
            )}
          </div>
          <div className="h-64 w-full overflow-y-auto rounded-lg border border-gray-300 bg-gray-50 p-4 sm:h-80" aria-live="polite">
            {translatedText ? (
              <p
                className="whitespace-pre-wrap break-words leading-relaxed text-gray-800"
                dir={RTL.has(translatedTo) ? 'rtl' : 'auto'}
                data-testid="ai-result-text"
              >
                {translatedText}
              </p>
            ) : (
              <p className="italic text-gray-500">{loading ? 'Translating…' : 'The translation will appear here.'}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button type="button" onClick={handleTranslate} disabled={loading} className={primaryButtonClass}>
          {loading ? 'Translating…' : 'Translate'}
        </button>
        <AiNotice />
      </div>

      {loading && <LoadingNotice label="Translating your text with AI." />}
      <ErrorAlert message={error} />
    </ToolCard>
  );
}
