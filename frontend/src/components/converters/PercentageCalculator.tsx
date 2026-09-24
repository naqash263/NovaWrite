import { useId, useState } from 'react';
import { CopyButton, formatNumber, parseNumberInput } from './UnitConverter';

type Mode = 'of' | 'what' | 'change' | 'increase' | 'decrease' | 'reverse' | 'difference';

interface ModeDef {
  label: string;
  a: string;
  b: string;
  defaults: [string, string];
  compute: (a: number, b: number) => { value: number; text: string; formula: string; extra?: string } | { error: string };
}

const f = (n: number) => formatNumber(n, 'auto');

const modes: Record<Mode, ModeDef> = {
  of: {
    label: 'What is X% of Y?',
    a: 'Percentage (%)',
    b: 'Of value',
    defaults: ['20', '150'],
    compute: (p, y) => {
      const value = (p / 100) * y;
      return { value, text: `${f(p)}% of ${f(y)} = ${f(value)}`, formula: `${f(p)} ÷ 100 × ${f(y)}` };
    },
  },
  what: {
    label: 'X is what percent of Y?',
    a: 'Value (X)',
    b: 'Total (Y)',
    defaults: ['30', '120'],
    compute: (x, y) => {
      if (y === 0) return { error: 'The total (Y) cannot be zero.' };
      const value = (x / y) * 100;
      return { value, text: `${f(x)} is ${f(value)}% of ${f(y)}`, formula: `${f(x)} ÷ ${f(y)} × 100` };
    },
  },
  change: {
    label: 'Percentage change from X to Y',
    a: 'From (old value)',
    b: 'To (new value)',
    defaults: ['80', '100'],
    compute: (x, y) => {
      if (x === 0) return { error: 'Percentage change from 0 is undefined. Enter a non-zero starting value.' };
      const value = ((y - x) / Math.abs(x)) * 100;
      const word = value > 0 ? 'increase' : value < 0 ? 'decrease' : 'no change';
      return {
        value,
        text: `From ${f(x)} to ${f(y)} is a ${f(Math.abs(value))}% ${word}`,
        formula: `(${f(y)} − ${f(x)}) ÷ |${f(x)}| × 100`,
        extra: `Difference: ${f(y - x)}`,
      };
    },
  },
  increase: {
    label: 'Increase X by P%',
    a: 'Value',
    b: 'Increase (%)',
    defaults: ['200', '15'],
    compute: (x, p) => {
      const value = x * (1 + p / 100);
      return { value, text: `${f(x)} increased by ${f(p)}% = ${f(value)}`, formula: `${f(x)} × (1 + ${f(p)} ÷ 100)`, extra: `Amount added: ${f(value - x)}` };
    },
  },
  decrease: {
    label: 'Decrease X by P% (discount)',
    a: 'Value or original price',
    b: 'Decrease or discount (%)',
    defaults: ['80', '25'],
    compute: (x, p) => {
      const value = x * (1 - p / 100);
      return { value, text: `${f(x)} decreased by ${f(p)}% = ${f(value)}`, formula: `${f(x)} × (1 − ${f(p)} ÷ 100)`, extra: `You save: ${f(x - value)}` };
    },
  },
  reverse: {
    label: 'X is P% of what number?',
    a: 'Value (X)',
    b: 'Percentage (%)',
    defaults: ['45', '30'],
    compute: (x, p) => {
      if (p === 0) return { error: 'The percentage cannot be zero.' };
      const value = x / (p / 100);
      return { value, text: `${f(x)} is ${f(p)}% of ${f(value)}`, formula: `${f(x)} ÷ (${f(p)} ÷ 100)` };
    },
  },
  difference: {
    label: 'Percentage difference between X and Y',
    a: 'Value X',
    b: 'Value Y',
    defaults: ['40', '60'],
    compute: (x, y) => {
      const mean = (Math.abs(x) + Math.abs(y)) / 2;
      if (mean === 0) return { error: 'Both values are zero, so there is no difference to compare.' };
      const value = (Math.abs(x - y) / mean) * 100;
      return { value, text: `The percentage difference between ${f(x)} and ${f(y)} is ${f(value)}%`, formula: `|${f(x)} − ${f(y)}| ÷ ((|${f(x)}| + |${f(y)}|) ÷ 2) × 100` };
    },
  },
};

const inputClass =
  'w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-3 text-base focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function PercentageCalculator() {
  const id = useId();
  const [mode, setMode] = useState<Mode>('of');
  const [values, setValues] = useState<Record<Mode, [string, string]>>(
    () => Object.fromEntries(Object.entries(modes).map(([k, m]) => [k, m.defaults])) as Record<Mode, [string, string]>,
  );
  const def = modes[mode];
  const [rawA, rawB] = values[mode];
  const a = parseNumberInput(rawA);
  const b = parseNumberInput(rawB);

  let message: string | null = null;
  let result: ReturnType<ModeDef['compute']> | null = null;
  if (a === null || b === null) message = 'Enter both values to calculate.';
  else if (Number.isNaN(a) || Number.isNaN(b) || !Number.isFinite(a) || !Number.isFinite(b)) message = 'Enter valid numbers, for example 12.5 or 1,250.';
  else result = def.compute(a, b);

  const setValue = (index: 0 | 1, value: string) =>
    setValues((prev) => ({ ...prev, [mode]: (index === 0 ? [value, prev[mode][1]] : [prev[mode][0], value]) as [string, string] }));

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <label htmlFor={`${id}-mode`} className="mb-1.5 block text-sm font-medium text-gray-700">
          Calculation
        </label>
        <select id={`${id}-mode`} value={mode} onChange={(e) => setMode(e.target.value as Mode)} className={inputClass}>
          {(Object.keys(modes) as Mode[]).map((m) => (
            <option key={m} value={m}>
              {modes[m].label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[def.a, def.b].map((label, i) => (
          <div key={label} className="min-w-0">
            <label htmlFor={`${id}-v${i}`} className="mb-1.5 block text-sm font-medium text-gray-700">
              {label}
            </label>
            <input
              id={`${id}-v${i}`}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={values[mode][i]}
              onChange={(e) => setValue(i as 0 | 1, e.target.value)}
              className={`${inputClass} text-lg`}
            />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 sm:p-5" aria-live="polite">
        {message && <p className="text-sm text-gray-700">{message}</p>}
        {result && 'error' in result && (
          <p className="text-sm font-medium text-red-700" data-testid="percent-error">
            {result.error}
          </p>
        )}
        {result && 'value' in result && (
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-700">Result</p>
              <p className="break-words text-2xl font-semibold text-blue-950" data-testid="percent-result">
                {result.text}
              </p>
              {result.extra && <p className="mt-1 text-sm text-blue-900">{result.extra}</p>}
              <p className="mt-1 break-words text-sm text-blue-800" data-testid="percent-formula">
                Formula: {result.formula}
              </p>
            </div>
            <CopyButton text={result.text} label="Copy" />
          </div>
        )}
      </div>
    </div>
  );
}
