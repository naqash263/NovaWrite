import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { copyToClipboard } from '../../utils/clipboard';

/**
 * Shared building blocks for the measurement converters (length, weight, volume,
 * area, speed, temperature, file size). Each unit is defined by an exact factor to
 * a base unit, so a conversion is value × from.factor ÷ to.factor.
 */
export interface ConverterUnit {
  /** ASCII id used as the <option> value, e.g. "ft2". */
  id: string;
  name: string;
  symbol: string;
  /** Multiply a value in this unit by `factor` to get the base unit. Ignored when `convert` is supplied. */
  factor: number;
  /** Optional <optgroup> label. */
  group?: string;
}

export type Precision = 'auto' | '0' | '2' | '4' | '6' | '8';

/**
 * Formats a number for display. "auto" rounds to 12 significant digits (removes
 * binary floating-point noise such as 0.30000000000000004) and switches to
 * scientific notation for very large or very small magnitudes.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function formatNumber(value: number, precision: Precision = 'auto', grouping = true): string {
  if (!Number.isFinite(value)) return '—';
  if (Object.is(value, -0)) value = 0;
  if (precision !== 'auto') {
    const digits = Number(precision);
    return value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: grouping });
  }
  if (value === 0) return '0';
  const abs = Math.abs(value);
  if (abs >= 1e15 || abs < 1e-6) {
    const [mantissa, exponent] = value.toExponential(9).split('e');
    return `${String(Number(mantissa))}e${exponent}`;
  }
  const rounded = Number(value.toPrecision(12));
  return rounded.toLocaleString('en-US', { maximumFractionDigits: 12, useGrouping: grouping });
}

/**
 * Parses a user-typed number. Accepts "1,234.5", "1 234.5", "-3", "2.5e3".
 * Returns null for empty input and NaN for anything that is not a number.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function parseNumberInput(raw: string): number | null {
  const trimmed = raw.trim().replace(/[\s_]/g, '');
  if (!trimmed) return null;
  const withoutGrouping = /^[+-]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(trimmed) ? trimmed.replace(/,/g, '') : trimmed;
  if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(withoutGrouping)) return NaN;
  return Number(withoutGrouping);
}

const copyIcon = (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

/** Copy button with visible "Copied" feedback. */
export function CopyButton({ text, label = 'Copy', className = '', disabled = false }: { text: string; label?: string; className?: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <button
      type="button"
      disabled={disabled || !text}
      onClick={async () => {
        const ok = await copyToClipboard(text);
        if (!ok) return;
        setCopied(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(false), 1500);
      }}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {copyIcon}
      <span aria-live="polite">{copied ? 'Copied' : label}</span>
    </button>
  );
}

function UnitOptions({ units }: { units: ConverterUnit[] }) {
  const groups = units.reduce<Record<string, ConverterUnit[]>>((acc, unit) => {
    const key = unit.group ?? '';
    (acc[key] ??= []).push(unit);
    return acc;
  }, {});
  return (
    <>
      {Object.entries(groups).map(([group, list]) => {
        const options = list.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} ({u.symbol})
          </option>
        ));
        return group ? (
          <optgroup key={group} label={group}>
            {options}
          </optgroup>
        ) : (
          options
        );
      })}
    </>
  );
}

export interface UnitConverterProps {
  /** Lower-case quantity name used in labels and messages, e.g. "length". */
  quantity: string;
  units: ConverterUnit[];
  defaultFrom: string;
  defaultTo: string;
  defaultValue?: string;
  /** Non-linear conversion (temperature). Defaults to factor-based conversion. */
  convert?: (value: number, from: ConverterUnit, to: ConverterUnit) => number;
  /** Return an error message for values that are out of range for the chosen unit. */
  validate?: (value: number, from: ConverterUnit) => string | null;
  /** Human-readable formula for the chosen pair. Defaults to "1 a = x b". */
  formula?: (from: ConverterUnit, to: ConverterUnit) => string;
  /** Extra rows appended to the "all units" table, e.g. feet + inches. */
  extraRows?: (value: number, from: ConverterUnit) => { label: string; value: string }[];
  /** Inline help shown under the converter. */
  note?: ReactNode;
  /** Common conversions offered as one-click presets. */
  presets?: { label: string; value: string; from: string; to: string }[];
}

export default function UnitConverter({
  quantity,
  units,
  defaultFrom,
  defaultTo,
  defaultValue = '1',
  convert,
  validate,
  formula,
  extraRows,
  note,
  presets,
}: UnitConverterProps) {
  const id = useId();
  const [raw, setRaw] = useState(defaultValue);
  const [fromId, setFromId] = useState(defaultFrom);
  const [toId, setToId] = useState(defaultTo);
  const [precision, setPrecision] = useState<Precision>('auto');

  const from = units.find((u) => u.id === fromId) ?? units[0];
  const to = units.find((u) => u.id === toId) ?? units[1] ?? units[0];

  const doConvert = useMemo(
    () => convert ?? ((value: number, a: ConverterUnit, b: ConverterUnit) => (value * a.factor) / b.factor),
    [convert],
  );

  const parsed = parseNumberInput(raw);
  let error: string | null = null;
  if (parsed === null) error = `Enter a ${quantity} value to convert.`;
  else if (Number.isNaN(parsed)) error = 'Enter a valid number, for example 12.5 or 1,250.';
  else if (!Number.isFinite(parsed)) error = 'That number is too large to convert.';
  else if (validate) error = validate(parsed, from);

  const value = error || parsed === null ? null : parsed;
  const result = value === null ? null : doConvert(value, from, to);
  const resultText = result === null ? '' : formatNumber(result, precision);
  const sentence = value === null ? '' : `${formatNumber(value)} ${from.symbol} = ${resultText} ${to.symbol}`;
  const formulaText = formula ? formula(from, to) : `1 ${from.symbol} = ${formatNumber(doConvert(1, from, to))} ${to.symbol}`;

  const swap = () => {
    setFromId(to.id);
    setToId(from.id);
  };

  const inputClass =
    'w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-3 text-base focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_minmax(0,1fr)] md:items-end">
        <div className="min-w-0">
          <label htmlFor={`${id}-value`} className="mb-1.5 block text-sm font-medium text-gray-700">
            Value
          </label>
          <input
            id={`${id}-value`}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            aria-invalid={Boolean(error && parsed !== null)}
            aria-describedby={`${id}-message`}
            className={inputClass}
            placeholder="Enter a number"
          />
        </div>
        <div className="min-w-0">
          <label htmlFor={`${id}-from`} className="mb-1.5 block text-sm font-medium text-gray-700">
            From
          </label>
          <select id={`${id}-from`} value={from.id} onChange={(e) => setFromId(e.target.value)} className={inputClass}>
            <UnitOptions units={units} />
          </select>
        </div>
        <button
          type="button"
          onClick={swap}
          aria-label="Swap units"
          title="Swap units"
          className="h-12 rounded-lg border border-gray-300 bg-white px-4 text-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <span aria-hidden="true">⇄</span>
        </button>
        <div className="min-w-0">
          <label htmlFor={`${id}-to`} className="mb-1.5 block text-sm font-medium text-gray-700">
            To
          </label>
          <select id={`${id}-to`} value={to.id} onChange={(e) => setToId(e.target.value)} className={inputClass}>
            <UnitOptions units={units} />
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 sm:p-5" aria-live="polite" id={`${id}-message`}>
        {error ? (
          <p className={parsed === null ? 'text-sm text-gray-600' : 'text-sm font-medium text-red-700'} data-testid="converter-error">
            {error}
          </p>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-700">Result</p>
              <p className="break-words text-2xl font-semibold text-blue-950" data-testid="converter-result">
                {resultText} <span className="text-lg font-medium text-blue-800">{to.symbol}</span>
              </p>
              <p className="mt-1 break-words text-sm text-blue-800" data-testid="converter-sentence">
                {sentence}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <CopyButton text={resultText.replace(/,/g, '')} label="Copy result" />
              <CopyButton text={sentence} label="Copy equation" />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
        <p className="min-w-0 break-words" data-testid="converter-formula">
          <span className="font-medium text-gray-800">Formula:</span> {formulaText}
        </p>
        <label className="flex items-center gap-2">
          <span>Precision</span>
          <select
            value={precision}
            onChange={(e) => setPrecision(e.target.value as Precision)}
            className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="auto">Auto</option>
            <option value="0">0 decimals</option>
            <option value="2">2 decimals</option>
            <option value="4">4 decimals</option>
            <option value="6">6 decimals</option>
            <option value="8">8 decimals</option>
          </select>
        </label>
      </div>

      {presets && presets.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Common conversions" role="group">
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setRaw(p.value);
                setFromId(p.from);
                setToId(p.to);
              }}
              className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-blue-400 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {value !== null && (
        <details className="rounded-xl border border-gray-200 bg-white" open>
          <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-gray-900">
            {formatNumber(value)} {from.symbol} in all {quantity} units
          </summary>
          <div className="overflow-x-auto px-4 pb-4">
            <table className="w-full text-left text-sm" data-testid="all-units-table">
              <tbody>
                {units.map((u) => (
                  <tr key={u.id} className={`border-t border-gray-100 ${u.id === to.id ? 'bg-blue-50/60' : ''}`}>
                    <th scope="row" className="py-2 pr-3 font-normal text-gray-600">
                      {u.name}
                    </th>
                    <td className="break-all py-2 text-right font-mono text-gray-900" data-unit={u.id}>
                      {formatNumber(doConvert(value, from, u), precision)} {u.symbol}
                    </td>
                  </tr>
                ))}
                {extraRows?.(value, from).map((row) => (
                  <tr key={row.label} className="border-t border-gray-100">
                    <th scope="row" className="py-2 pr-3 font-normal text-gray-600">
                      {row.label}
                    </th>
                    <td className="break-all py-2 text-right font-mono text-gray-900">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      {note && <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">{note}</div>}
    </div>
  );
}
