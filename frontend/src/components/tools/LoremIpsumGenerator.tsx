import { useCallback, useEffect, useState } from 'react';

const LOREM_WORDS =
  'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum curabitur pretium tincidunt lacus nulla gravida orci a odio nullam varius turpis et commodo pharetra est eros bibendum elit nec luctus magna felis sollicitudin mauris integer'.split(
    ' ',
  );

const TEXT_TYPES = {
  lorem: { name: 'Lorem Ipsum', words: LOREM_WORDS },
  bacon: {
    name: 'Bacon Ipsum',
    words: 'bacon ipsum dolor amet short loin ribeye pork chop tenderloin brisket sirloin meatball belly ham hock shank turkey chicken beef ribs sausage jerky pastrami brisket flank salami prosciutto kielbasa'.split(' '),
  },
  cupcake: {
    name: 'Cupcake Ipsum',
    words: 'cupcake ipsum dolor sit amet chocolate cake sweet sugar frosting sprinkles vanilla buttercream cherry strawberry muffin donut cookie brownie pie tart pastry cream icing glaze caramel toffee marzipan'.split(' '),
  },
  hipster: {
    name: 'Hipster Ipsum',
    words: 'hipster ipsum artisan organic sustainable vegan locally sourced farm-to-table craft beer coffee vinyl vintage retro indie minimalist aesthetic authentic handmade bespoke curated sourdough kombucha fixie'.split(' '),
  },
};
type TextType = keyof typeof TEXT_TYPES;
type Unit = 'paragraphs' | 'sentences' | 'words' | 'list';

const LIMITS: Record<Unit, number> = { paragraphs: 50, sentences: 100, words: 1000, list: 50 };
const UNIT_LABELS: Record<Unit, string> = { paragraphs: 'Paragraphs', sentences: 'Sentences', words: 'Words', list: 'List items' };
const CLASSIC = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

const rand = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function sentence(words: string[]): string {
  const n = rand(6, 14);
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(words[rand(0, words.length - 1)]);
  // Add a comma in longer sentences for a more natural rhythm.
  if (n > 9) out[rand(3, n - 4)] += ',';
  const s = out.join(' ');
  return s.charAt(0).toUpperCase() + s.slice(1) + '.';
}

const paragraph = (words: string[]) => Array.from({ length: rand(4, 7) }, () => sentence(words)).join(' ');

export default function LoremIpsumGenerator() {
  const [textType, setTextType] = useState<TextType>('lorem');
  const [unit, setUnit] = useState<Unit>('paragraphs');
  const [count, setCount] = useState(3);
  const [startClassic, setStartClassic] = useState(true);
  const [html, setHtml] = useState(false);
  const [blocks, setBlocks] = useState<string[]>([]);
  const [status, setStatus] = useState('');

  const safeCount = Math.min(LIMITS[unit], Math.max(1, count || 1));

  const generate = useCallback(() => {
    const words = TEXT_TYPES[textType].words;
    const classic = startClassic && textType === 'lorem';
    let result: string[];
    if (unit === 'words') {
      const list = Array.from({ length: safeCount }, () => words[rand(0, words.length - 1)]);
      if (classic) CLASSIC.replace(/[.,]/g, '').toLowerCase().split(' ').slice(0, safeCount).forEach((w, i) => (list[i] = w));
      const text = list.join(' ');
      result = [text.charAt(0).toUpperCase() + text.slice(1) + '.'];
    } else if (unit === 'sentences') {
      const list = Array.from({ length: safeCount }, () => sentence(words));
      if (classic) list[0] = CLASSIC;
      result = [list.join(' ')];
    } else if (unit === 'list') {
      result = Array.from({ length: safeCount }, () => sentence(words).replace(/\.$/, ''));
      if (classic) result[0] = CLASSIC.replace(/\.$/, '');
    } else {
      result = Array.from({ length: safeCount }, () => paragraph(words));
      if (classic) result[0] = `${CLASSIC} ${result[0]}`;
    }
    setBlocks(result);
    setStatus('');
  }, [textType, unit, safeCount, startClassic]);

  useEffect(() => {
    generate();
  }, [generate]);

  const output = html
    ? unit === 'list'
      ? `<ul>\n${blocks.map((b) => `  <li>${escapeHtml(b)}</li>`).join('\n')}\n</ul>`
      : blocks.map((b) => `<p>${escapeHtml(b)}</p>`).join('\n')
    : unit === 'list'
      ? blocks.map((b) => `• ${b}`).join('\n')
      : blocks.join('\n\n');

  const wordCount = blocks.join(' ').split(/\s+/).filter(Boolean).length;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setStatus(html ? 'HTML copied to clipboard.' : 'Text copied to clipboard.');
    } catch {
      setStatus('Copy failed. Select the text and copy it manually.');
    }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([output], { type: html ? 'text/html;charset=utf-8' : 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = html ? 'lorem-ipsum.html' : 'lorem-ipsum.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-lg bg-white p-4 shadow-lg sm:p-6">
      <div className="space-y-6">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-gray-700">Text style</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.keys(TEXT_TYPES) as TextType[]).map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={textType === key}
                onClick={() => setTextType(key)}
                className={`rounded-lg border-2 px-3 py-2 transition-colors ${
                  textType === key ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {TEXT_TYPES[key].name}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="lorem-unit" className="mb-2 block text-sm font-medium text-gray-700">
              Generate
            </label>
            <select
              id="lorem-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value as Unit)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            >
              {(Object.keys(UNIT_LABELS) as Unit[]).map((u) => (
                <option key={u} value={u}>
                  {UNIT_LABELS[u]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="lorem-count" className="mb-2 block text-sm font-medium text-gray-700">
              How many (1–{LIMITS[unit]})
            </label>
            <input
              id="lorem-count"
              type="number"
              min={1}
              max={LIMITS[unit]}
              value={count}
              onChange={(e) => setCount(e.target.valueAsNumber)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            />
            {count > LIMITS[unit] && <p className="mt-1 text-xs text-amber-700">Limited to {LIMITS[unit]}.</p>}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <label className={`flex items-center gap-2 text-sm ${textType === 'lorem' ? 'text-gray-700' : 'text-gray-400'}`}>
            <input
              type="checkbox"
              checked={startClassic}
              disabled={textType !== 'lorem'}
              onChange={(e) => setStartClassic(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            Start with “Lorem ipsum dolor sit amet…”
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={html} onChange={(e) => setHtml(e.target.checked)} className="h-4 w-4 rounded" />
            Wrap in HTML tags ({unit === 'list' ? '<ul><li>' : '<p>'})
          </label>
        </div>

        <button
          type="button"
          onClick={generate}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
        >
          Generate new text
        </button>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="lorem-output" className="block text-sm font-medium text-gray-700">
              Generated text
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={copy} className="rounded bg-gray-800 px-3 py-1.5 text-sm text-white hover:bg-gray-900">
                Copy
              </button>
              <button type="button" onClick={download} className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                Download
              </button>
            </div>
          </div>
          <textarea
            id="lorem-output"
            data-testid="lorem-output"
            value={output}
            readOnly
            className="h-64 w-full resize-y rounded-lg border border-gray-300 p-3 font-mono text-sm"
          />
          <div className="mt-1 flex flex-wrap justify-between gap-2 text-xs text-gray-500">
            <span data-testid="lorem-stats">
              {wordCount.toLocaleString()} words · {output.length.toLocaleString()} characters
            </span>
            <span aria-live="polite" className="text-green-700">
              {status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
