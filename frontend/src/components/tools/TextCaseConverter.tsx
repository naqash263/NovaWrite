import { useMemo, useState } from 'react';

type CaseType =
  | 'sentence'
  | 'lower'
  | 'upper'
  | 'capitalized'
  | 'title'
  | 'camel'
  | 'pascal'
  | 'snake'
  | 'kebab'
  | 'constant'
  | 'dot'
  | 'alternating'
  | 'inverse';

const SMALL_WORDS = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'nor', 'for', 'so', 'yet', 'as', 'at', 'by', 'in', 'of', 'off', 'on', 'per', 'to', 'up', 'via', 'vs']);

const cap = (w: string) => (w ? w.charAt(0).toLocaleUpperCase() + w.slice(1) : w);

/** Splits an identifier or phrase into words, including camelCase / PascalCase boundaries. */
function splitWords(line: string): string[] {
  return line
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2')
    .replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, '$1 $2')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

const perLine = (text: string, fn: (line: string) => string) => text.split('\n').map(fn).join('\n');

function convert(text: string, type: CaseType): string {
  switch (type) {
    case 'lower':
      return text.toLocaleLowerCase();
    case 'upper':
      return text.toLocaleUpperCase();
    case 'sentence':
      return text
        .toLocaleLowerCase()
        .replace(/(^\s*|[.!?]\s+|\n\s*)(\p{L})/gu, (_, pre: string, ch: string) => pre + ch.toLocaleUpperCase())
        .replace(/\bi\b/g, 'I');
    case 'capitalized':
      return text.toLocaleLowerCase().replace(/[\p{L}\p{N}]+(?:['’][\p{L}]+)?/gu, cap);
    case 'title':
      return perLine(text, (line) => {
        const re = /[\p{L}\p{N}]+(?:['’][\p{L}]+)?/gu;
        const lower = line.toLocaleLowerCase();
        const total = (lower.match(re) ?? []).length;
        let i = -1;
        return lower.replace(re, (word) => {
          i++;
          return SMALL_WORDS.has(word) && i !== 0 && i !== total - 1 ? word : cap(word);
        });
      });
    case 'camel':
      return perLine(text, (l) => splitWords(l).map((w, i) => (i ? cap(w.toLocaleLowerCase()) : w.toLocaleLowerCase())).join(''));
    case 'pascal':
      return perLine(text, (l) => splitWords(l).map((w) => cap(w.toLocaleLowerCase())).join(''));
    case 'snake':
      return perLine(text, (l) => splitWords(l).map((w) => w.toLocaleLowerCase()).join('_'));
    case 'kebab':
      return perLine(text, (l) => splitWords(l).map((w) => w.toLocaleLowerCase()).join('-'));
    case 'constant':
      return perLine(text, (l) => splitWords(l).map((w) => w.toLocaleUpperCase()).join('_'));
    case 'dot':
      return perLine(text, (l) => splitWords(l).map((w) => w.toLocaleLowerCase()).join('.'));
    case 'alternating': {
      let i = 0;
      return Array.from(text)
        .map((ch) => (/\p{L}/u.test(ch) ? (i++ % 2 ? ch.toLocaleUpperCase() : ch.toLocaleLowerCase()) : ch))
        .join('');
    }
    case 'inverse':
      return Array.from(text)
        .map((ch) => (ch === ch.toLocaleUpperCase() ? ch.toLocaleLowerCase() : ch.toLocaleUpperCase()))
        .join('');
  }
}

const OPTIONS: { value: CaseType; label: string; example: string }[] = [
  { value: 'sentence', label: 'Sentence case', example: 'The quick brown fox.' },
  { value: 'lower', label: 'lower case', example: 'the quick brown fox' },
  { value: 'upper', label: 'UPPER CASE', example: 'THE QUICK BROWN FOX' },
  { value: 'capitalized', label: 'Capitalized Case', example: 'The Quick Brown Fox' },
  { value: 'title', label: 'Title Case', example: 'The Fox and the Hound' },
  { value: 'camel', label: 'camelCase', example: 'quickBrownFox' },
  { value: 'pascal', label: 'PascalCase', example: 'QuickBrownFox' },
  { value: 'snake', label: 'snake_case', example: 'quick_brown_fox' },
  { value: 'kebab', label: 'kebab-case', example: 'quick-brown-fox' },
  { value: 'constant', label: 'CONSTANT_CASE', example: 'QUICK_BROWN_FOX' },
  { value: 'dot', label: 'dot.case', example: 'quick.brown.fox' },
  { value: 'alternating', label: 'aLtErNaTiNg', example: 'tHe QuIcK' },
  { value: 'inverse', label: 'iNVERSE cASE', example: 'swap upper/lower' },
];

export default function TextCaseConverter() {
  const [input, setInput] = useState('');
  const [type, setType] = useState<CaseType>('sentence');
  const [status, setStatus] = useState('');
  const output = useMemo(() => (input ? convert(input, type) : ''), [input, type]);
  const label = OPTIONS.find((o) => o.value === type)!.label;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setStatus('Converted text copied to clipboard.');
    } catch {
      setStatus('Copy failed. Select the text and copy it manually.');
    }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([output], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted-${type}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-lg bg-white p-4 shadow-lg sm:p-6">
      <div className="space-y-6">
        <div>
          <label htmlFor="case-input" className="mb-2 block text-sm font-medium text-gray-700">
            Text to convert
          </label>
          <textarea
            id="case-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type or paste your text…"
            className="h-32 w-full resize-y rounded-lg border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
          />
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>
              {input.length.toLocaleString()} characters · {input ? input.split('\n').length : 0} lines
            </span>
            <button type="button" onClick={() => setInput('')} className="text-blue-700 hover:underline">
              Clear
            </button>
          </div>
        </div>

        <fieldset>
          <legend className="mb-3 text-sm font-medium text-gray-700">Convert to</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                aria-pressed={type === o.value}
                onClick={() => setType(o.value)}
                className={`min-w-0 rounded-lg border-2 p-2 text-left transition-colors ${
                  type === o.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="block truncate font-semibold text-gray-900">{o.label}</span>
                <span className="block truncate text-xs text-gray-500">{o.example}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="case-output" className="block text-sm font-medium text-gray-700">
              Result ({label})
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copy}
                disabled={!output}
                className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Copy
              </button>
              <button
                type="button"
                onClick={download}
                disabled={!output}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Download .txt
              </button>
            </div>
          </div>
          <textarea
            id="case-output"
            data-testid="case-output"
            value={output}
            readOnly
            placeholder="The converted text appears here as you type."
            className="h-32 w-full resize-y rounded-lg border border-gray-300 bg-gray-50 p-3 font-mono text-sm"
          />
          <p aria-live="polite" className="mt-1 min-h-[1.25rem] text-sm text-green-700">
            {status}
          </p>
        </div>
      </div>
    </div>
  );
}
