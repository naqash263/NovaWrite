import { useMemo, useState } from 'react';

/**
 * Heuristic token estimate modelled on how BPE tokenizers (GPT, Claude, Gemini, Llama) pre-split text:
 * words with their leading space, digit groups of up to 3, punctuation runs and whitespace runs.
 * It is an approximation: exact counts need the provider's own tokenizer.
 */
const PRE_TOKEN = /'(?:[sdmt]|ll|ve|re)| ?\p{L}+| ?\p{N}{1,3}| ?[^\s\p{L}\p{N}]+|\s+/giu;
const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;

function estimateChunk(chunk: string): number {
  const body = chunk.startsWith(' ') ? chunk.slice(1) : chunk;
  if (!body) return 1;
  if (/^\s+$/.test(chunk)) return 1;
  if (/^\p{N}+$/u.test(body)) return 1;
  if (/^\p{L}+$/u.test(body)) {
    const chars = Array.from(body);
    if (chars.some((c) => CJK.test(c))) return chars.length;
    // eslint-disable-next-line no-control-regex
    if (/^[\x00-\x7F]+$/.test(body)) return chars.length <= 7 ? 1 : Math.ceil(chars.length / 5);
    return Math.ceil(chars.length / 2);
  }
  // Punctuation / symbols / emoji.
  const chars = Array.from(body);
  // eslint-disable-next-line no-control-regex
  const ascii = chars.filter((c) => /^[\x00-\x7F]$/.test(c)).length;
  return Math.max(1, Math.ceil(ascii / 2) + (chars.length - ascii) * 2);
}

function estimateTokens(text: string): number {
  if (!text) return 0;
  let total = 0;
  for (const m of text.matchAll(PRE_TOKEN)) total += estimateChunk(m[0]);
  return total;
}

const CONTEXT_PRESETS = [8_000, 32_000, 128_000, 200_000, 1_000_000];

const formatUsd = (n: number) => (n === 0 ? '$0' : n < 0.01 ? `$${n.toFixed(6)}` : `$${n.toFixed(4)}`);

export default function TokenCounter() {
  const [text, setText] = useState('');
  const [contextWindow, setContextWindow] = useState(128_000);
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState('');

  const stats = useMemo(() => {
    const tokens = estimateTokens(text);
    return {
      tokens,
      characters: Array.from(text).length,
      words: text.split(/\s+/).filter(Boolean).length,
      lines: text ? text.split('\n').length : 0,
      charsPerToken: tokens ? Array.from(text).length / tokens : 0,
    };
  }, [text]);

  const priceNum = parseFloat(price);
  const cost = Number.isFinite(priceNum) && priceNum >= 0 ? (stats.tokens / 1_000_000) * priceNum : null;
  const usage = contextWindow > 0 ? (stats.tokens / contextWindow) * 100 : 0;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(stats.tokens));
      setStatus('Token estimate copied.');
    } catch {
      setStatus('Copy failed.');
    }
  };

  return (
    <div className="rounded-lg bg-white p-4 shadow-lg sm:p-6">
      <div className="space-y-6">
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <label htmlFor="token-text" className="block text-sm font-medium text-gray-700">
              Prompt or text
            </label>
            <button type="button" onClick={() => setText('')} disabled={!text} className="text-sm text-blue-700 hover:underline disabled:text-gray-400">
              Clear
            </button>
          </div>
          <textarea
            id="token-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste a prompt, document or code…"
            className="h-56 w-full resize-y rounded-lg border border-gray-300 p-3 font-mono text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="col-span-2 rounded-lg border border-blue-200 bg-blue-50 p-3 sm:col-span-1">
            <dt className="text-sm text-blue-900">Estimated tokens</dt>
            <dd className="flex items-center justify-between gap-2">
              <span className="text-2xl font-bold text-blue-700" data-testid="token-count">
                ≈ {stats.tokens.toLocaleString()}
              </span>
              <button
                type="button"
                onClick={copy}
                disabled={!stats.tokens}
                className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:bg-gray-300"
              >
                Copy
              </button>
            </dd>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <dt className="text-sm text-gray-600">Characters</dt>
            <dd className="text-2xl font-bold text-gray-900" data-testid="token-characters">
              {stats.characters.toLocaleString()}
            </dd>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <dt className="text-sm text-gray-600">Words</dt>
            <dd className="text-2xl font-bold text-gray-900" data-testid="token-words">
              {stats.words.toLocaleString()}
            </dd>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <dt className="text-sm text-gray-600">Chars per token</dt>
            <dd className="text-2xl font-bold text-gray-900">{stats.charsPerToken ? stats.charsPerToken.toFixed(1) : '—'}</dd>
          </div>
        </dl>
        <p aria-live="polite" className="min-h-[1.25rem] text-sm text-green-700">
          {status}
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-gray-50 p-4">
            <label htmlFor="token-context" className="mb-2 block text-sm font-medium text-gray-700">
              Context window (tokens)
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                id="token-context"
                type="number"
                min={1}
                value={contextWindow}
                onChange={(e) => setContextWindow(e.target.valueAsNumber || 0)}
                className="w-36 rounded-lg border border-gray-300 px-3 py-2 font-mono"
              />
              {CONTEXT_PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setContextWindow(n)}
                  aria-pressed={contextWindow === n}
                  className={`rounded-lg border px-2 py-1 text-xs ${contextWindow === n ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-700'}`}
                >
                  {n >= 1_000_000 ? `${n / 1_000_000}M` : `${n / 1000}K`}
                </button>
              ))}
            </div>
            <div className="mt-3 h-2 rounded-full bg-gray-200" aria-hidden="true">
              <div className={`h-2 rounded-full ${usage > 100 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, usage)}%` }} />
            </div>
            <p className={`mt-1 text-sm ${usage > 100 ? 'font-semibold text-red-700' : 'text-gray-600'}`} data-testid="token-context-usage">
              {usage.toFixed(usage < 1 ? 2 : 1)}% of the context window{usage > 100 ? ' (too long)' : ''}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <label htmlFor="token-price" className="mb-2 block text-sm font-medium text-gray-700">
              Your model’s price per 1M input tokens (USD)
            </label>
            <input
              id="token-price"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 3"
              className="w-36 rounded-lg border border-gray-300 px-3 py-2 font-mono"
            />
            <p className="mt-3 text-sm text-gray-700" data-testid="token-cost">
              {cost === null ? 'Enter the current price from your provider’s pricing page to estimate cost.' : `Estimated input cost: ${formatUsd(cost)}`}
            </p>
          </div>
        </div>

        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          This is an estimate, not an exact tokenizer. Each AI model family (OpenAI GPT, Anthropic Claude, Google Gemini, Meta Llama)
          uses its own tokenizer, so real counts can differ, especially for code, non-English text and emoji. For exact numbers use the
          provider’s token-counting API or official tokenizer. Your text never leaves your browser.
        </p>
      </div>
    </div>
  );
}
