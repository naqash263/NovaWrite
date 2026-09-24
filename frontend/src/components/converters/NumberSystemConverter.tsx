import { useId, useState } from 'react';
import { CopyButton } from './UnitConverter';

// Arbitrary-precision base conversion with BigInt, so large values (e.g. 2^64) stay exact.

const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';
const NAMED: Record<number, string> = { 2: 'Binary', 8: 'Octal', 10: 'Decimal', 16: 'Hexadecimal' };
const PREFIX: Record<number, RegExp> = { 2: /^0b/i, 8: /^0o/i, 16: /^0x/i };
const baseOptions = [2, 8, 10, 16, ...Array.from({ length: 35 }, (_, i) => i + 2).filter((b) => !NAMED[b])];
const baseLabel = (b: number) => (NAMED[b] ? `${NAMED[b]} (base ${b})` : `Base ${b}`);

type Parsed = { value: bigint } | { error: string } | null;

function parseInBase(raw: string, base: number): Parsed {
  let text = raw.trim().replace(/[\s_]/g, '');
  if (!text) return null;
  let negative = false;
  if (text[0] === '-' || text[0] === '+') {
    negative = text[0] === '-';
    text = text.slice(1);
  }
  if (PREFIX[base]) text = text.replace(PREFIX[base], '');
  if (!text) return { error: 'Enter at least one digit.' };
  if (text.includes('.')) return { error: 'Only whole numbers are supported (no fractional part).' };
  const bigBase = BigInt(base);
  let value = 0n;
  for (const ch of text.toLowerCase()) {
    const digit = DIGITS.indexOf(ch);
    if (digit < 0 || digit >= base) {
      const allowed = base <= 10 ? `0–${base - 1}` : `0–9 and A–${DIGITS[base - 1].toUpperCase()}`;
      return { error: `“${ch}” is not a valid ${baseLabel(base).toLowerCase()} digit. Allowed digits: ${allowed}.` };
    }
    value = value * bigBase + BigInt(digit);
  }
  return { value: negative ? -value : value };
}

function toBase(value: bigint, base: number): string {
  const s = value.toString(base);
  return base > 10 ? s.toUpperCase() : s;
}

function group(text: string, size: number, sep: string) {
  const negative = text.startsWith('-');
  const digits = negative ? text.slice(1) : text;
  const padded = digits.padStart(Math.ceil(digits.length / size) * size, '0');
  const groups = padded.match(new RegExp(`.{1,${size}}`, 'g')) ?? [];
  return (negative ? '-' : '') + groups.join(sep);
}

const inputClass =
  'w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-3 text-base focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function NumberSystemConverter() {
  const id = useId();
  const [raw, setRaw] = useState('255');
  const [fromBase, setFromBase] = useState(10);
  const [toBaseValue, setToBaseValue] = useState(2);

  const parsed = parseInBase(raw, fromBase);
  const value = parsed && 'value' in parsed ? parsed.value : null;
  const result = value === null ? '' : toBase(value, toBaseValue);

  const swap = () => {
    if (value !== null) setRaw(result);
    setFromBase(toBaseValue);
    setToBaseValue(fromBase);
  };

  const rows = value === null ? [] : [2, 8, 10, 16].map((b) => ({ base: b, text: toBase(value, b) }));

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto_minmax(0,1fr)] md:items-end">
        <div className="min-w-0">
          <label htmlFor={`${id}-value`} className="mb-1.5 block text-sm font-medium text-gray-700">
            Number
          </label>
          <input
            id={`${id}-value`}
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            aria-invalid={Boolean(parsed && 'error' in parsed)}
            aria-describedby={`${id}-result`}
            className={`${inputClass} font-mono text-lg`}
            placeholder={fromBase === 16 ? 'e.g. FF or 0xFF' : fromBase === 2 ? 'e.g. 1010 or 0b1010' : 'Enter a number'}
          />
        </div>
        <div className="min-w-0">
          <label htmlFor={`${id}-from`} className="mb-1.5 block text-sm font-medium text-gray-700">
            From
          </label>
          <select id={`${id}-from`} value={fromBase} onChange={(e) => setFromBase(Number(e.target.value))} className={inputClass}>
            {baseOptions.map((b) => (
              <option key={b} value={b}>
                {baseLabel(b)}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={swap}
          aria-label="Swap bases"
          title="Swap bases (uses the result as the new input)"
          className="h-12 rounded-lg border border-gray-300 bg-white px-4 text-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <span aria-hidden="true">⇄</span>
        </button>
        <div className="min-w-0">
          <label htmlFor={`${id}-to`} className="mb-1.5 block text-sm font-medium text-gray-700">
            To
          </label>
          <select id={`${id}-to`} value={toBaseValue} onChange={(e) => setToBaseValue(Number(e.target.value))} className={inputClass}>
            {baseOptions.map((b) => (
              <option key={b} value={b}>
                {baseLabel(b)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div id={`${id}-result`} aria-live="polite" className="rounded-xl border border-blue-100 bg-blue-50 p-4 sm:p-5">
        {parsed === null && <p className="text-sm text-gray-700">Enter a number to convert.</p>}
        {parsed && 'error' in parsed && (
          <p className="text-sm font-medium text-red-700" data-testid="number-error">
            {parsed.error}
          </p>
        )}
        {value !== null && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-700">{baseLabel(toBaseValue)}</p>
              <p className="break-all font-mono text-2xl font-semibold text-blue-950" data-testid="number-result">
                {result}
              </p>
            </div>
            <CopyButton text={result} label="Copy result" />
          </div>
        )}
      </div>

      {value !== null && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm" data-testid="number-table">
            <tbody>
              {rows.map((row) => (
                <tr key={row.base} className="border-t border-gray-100 first:border-t-0">
                  <th scope="row" className="whitespace-nowrap px-4 py-2 font-normal text-gray-600">
                    {baseLabel(row.base)}
                  </th>
                  <td className="break-all px-4 py-2 font-mono text-gray-900" data-base={row.base}>
                    {row.base === 2 && row.text.replace('-', '').length > 4 ? group(row.text, 4, ' ') : row.text}
                  </td>
                  <td className="px-2 py-2 text-right">
                    <CopyButton text={row.text} label="Copy" className="px-2 py-1" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
        Supports whole numbers of any size in bases 2 to 36, including negative numbers (shown with a minus sign, not two’s complement). Prefixes 0b, 0o
        and 0x, spaces and underscores are ignored. Binary output is grouped in 4-bit nibbles for readability.
      </p>
    </div>
  );
}
