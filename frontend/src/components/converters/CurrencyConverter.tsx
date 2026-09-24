import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { CopyButton, formatNumber, parseNumberInput } from './UnitConverter';

/**
 * Rates come from ExchangeRate-API's free open endpoint (mid-market reference rates,
 * published once per day). We fetch the USD table once and derive any cross rate
 * from it, so switching currencies does not trigger new requests. The amount the
 * user types never leaves the browser.
 */
const RATES_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

const currencies = [
  { code: 'USD', name: 'US Dollar', region: 'Major' },
  { code: 'EUR', name: 'Euro', region: 'Major' },
  { code: 'GBP', name: 'British Pound', region: 'Major' },
  { code: 'JPY', name: 'Japanese Yen', region: 'Major' },
  { code: 'CNY', name: 'Chinese Yuan', region: 'Major' },
  { code: 'CHF', name: 'Swiss Franc', region: 'Major' },
  { code: 'CAD', name: 'Canadian Dollar', region: 'Americas' },
  { code: 'MXN', name: 'Mexican Peso', region: 'Americas' },
  { code: 'BRL', name: 'Brazilian Real', region: 'Americas' },
  { code: 'ARS', name: 'Argentine Peso', region: 'Americas' },
  { code: 'CLP', name: 'Chilean Peso', region: 'Americas' },
  { code: 'COP', name: 'Colombian Peso', region: 'Americas' },
  { code: 'PEN', name: 'Peruvian Sol', region: 'Americas' },
  { code: 'AUD', name: 'Australian Dollar', region: 'Asia Pacific' },
  { code: 'NZD', name: 'New Zealand Dollar', region: 'Asia Pacific' },
  { code: 'SGD', name: 'Singapore Dollar', region: 'Asia Pacific' },
  { code: 'HKD', name: 'Hong Kong Dollar', region: 'Asia Pacific' },
  { code: 'INR', name: 'Indian Rupee', region: 'Asia Pacific' },
  { code: 'KRW', name: 'South Korean Won', region: 'Asia Pacific' },
  { code: 'TWD', name: 'Taiwan Dollar', region: 'Asia Pacific' },
  { code: 'THB', name: 'Thai Baht', region: 'Asia Pacific' },
  { code: 'MYR', name: 'Malaysian Ringgit', region: 'Asia Pacific' },
  { code: 'IDR', name: 'Indonesian Rupiah', region: 'Asia Pacific' },
  { code: 'PHP', name: 'Philippine Peso', region: 'Asia Pacific' },
  { code: 'VND', name: 'Vietnamese Dong', region: 'Asia Pacific' },
  { code: 'PKR', name: 'Pakistani Rupee', region: 'Asia Pacific' },
  { code: 'BDT', name: 'Bangladeshi Taka', region: 'Asia Pacific' },
  { code: 'LKR', name: 'Sri Lankan Rupee', region: 'Asia Pacific' },
  { code: 'AED', name: 'UAE Dirham', region: 'Middle East' },
  { code: 'SAR', name: 'Saudi Riyal', region: 'Middle East' },
  { code: 'QAR', name: 'Qatari Riyal', region: 'Middle East' },
  { code: 'KWD', name: 'Kuwaiti Dinar', region: 'Middle East' },
  { code: 'OMR', name: 'Omani Rial', region: 'Middle East' },
  { code: 'BHD', name: 'Bahraini Dinar', region: 'Middle East' },
  { code: 'ILS', name: 'Israeli New Shekel', region: 'Middle East' },
  { code: 'JOD', name: 'Jordanian Dinar', region: 'Middle East' },
  { code: 'EGP', name: 'Egyptian Pound', region: 'Middle East' },
  { code: 'TRY', name: 'Turkish Lira', region: 'Middle East' },
  { code: 'NOK', name: 'Norwegian Krone', region: 'Europe' },
  { code: 'SEK', name: 'Swedish Krona', region: 'Europe' },
  { code: 'DKK', name: 'Danish Krone', region: 'Europe' },
  { code: 'PLN', name: 'Polish Zloty', region: 'Europe' },
  { code: 'CZK', name: 'Czech Koruna', region: 'Europe' },
  { code: 'HUF', name: 'Hungarian Forint', region: 'Europe' },
  { code: 'RON', name: 'Romanian Leu', region: 'Europe' },
  { code: 'BGN', name: 'Bulgarian Lev', region: 'Europe' },
  { code: 'RUB', name: 'Russian Ruble', region: 'Europe' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', region: 'Europe' },
  { code: 'ZAR', name: 'South African Rand', region: 'Africa' },
  { code: 'NGN', name: 'Nigerian Naira', region: 'Africa' },
  { code: 'KES', name: 'Kenyan Shilling', region: 'Africa' },
  { code: 'GHS', name: 'Ghanaian Cedi', region: 'Africa' },
  { code: 'MAD', name: 'Moroccan Dirham', region: 'Africa' },
  { code: 'ETB', name: 'Ethiopian Birr', region: 'Africa' },
];

const regions = Array.from(new Set(currencies.map((c) => c.region)));
const QUICK_TARGETS = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR', 'CAD', 'AUD', 'AED', 'PKR'];

type RatesTable = { rates: Record<string, number>; asOf: string | null };
type Status = 'loading' | 'ready' | 'error';

function formatMoney(amount: number, code: string): string {
  try {
    const digits = new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).resolvedOptions().maximumFractionDigits ?? 2;
    // Keep more precision for tiny amounts (e.g. 1 IDR in USD) instead of showing 0.00.
    const fraction = Math.abs(amount) > 0 && Math.abs(amount) < 1 ? Math.max(digits, 4) : digits;
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: fraction })} ${code}`;
  } catch {
    return `${formatNumber(amount, '2')} ${code}`;
  }
}

function parseRates(data: unknown): RatesTable {
  if (!data || typeof data !== 'object' || !('rates' in data)) throw new Error('bad-response');
  const { rates } = data as { rates: unknown };
  if (!rates || typeof rates !== 'object') throw new Error('bad-response');
  const clean: Record<string, number> = {};
  for (const [code, value] of Object.entries(rates as Record<string, unknown>)) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) clean[code] = value;
  }
  if (!clean.USD) clean.USD = 1;
  if (Object.keys(clean).length < 2) throw new Error('bad-response');
  const d = data as { date?: unknown; time_last_updated?: unknown };
  let asOf: string | null = null;
  if (typeof d.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.date)) asOf = d.date;
  else if (typeof d.time_last_updated === 'number') asOf = new Date(d.time_last_updated * 1000).toISOString().slice(0, 10);
  return { rates: clean, asOf };
}

export default function CurrencyConverter() {
  const id = useId();
  const [raw, setRaw] = useState('1');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('EUR');
  const [table, setTable] = useState<RatesTable | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 10_000);
    setStatus('loading');
    try {
      const response = await fetch(RATES_URL, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`http-${response.status}`);
      const parsed = parseRates(await response.json());
      if (abortRef.current !== controller) return;
      setTable(parsed);
      setStatus('ready');
    } catch {
      if (abortRef.current !== controller) return;
      setStatus('error');
    } finally {
      window.clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => abortRef.current?.abort();
  }, [load]);

  const amount = parseNumberInput(raw);
  const amountError =
    amount === null ? 'Enter an amount to convert.' : Number.isNaN(amount) || !Number.isFinite(amount) ? 'Enter a valid amount, for example 250 or 1,250.50.' : amount < 0 ? 'Enter a positive amount.' : null;

  const rateFor = (a: string, b: string): number | null => {
    if (!table) return null;
    const ra = table.rates[a];
    const rb = table.rates[b];
    return ra && rb ? rb / ra : null;
  };
  const rate = rateFor(from, to);
  const result = rate !== null && amount !== null && !amountError ? amount * rate : null;
  const missing = status === 'ready' && rate === null ? [from, to].filter((c) => !table?.rates[c]) : [];

  const inputClass =
    'w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-3 text-base focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500';

  const currencyOptions = regions.map((region) => (
    <optgroup key={region} label={region}>
      {currencies
        .filter((c) => c.region === region)
        .map((c) => (
          <option key={c.code} value={c.code}>
            {c.code} – {c.name}
          </option>
        ))}
    </optgroup>
  ));

  const sentence = result !== null && amount !== null ? `${formatMoney(amount, from)} = ${formatMoney(result, to)}` : '';

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto_minmax(0,1.3fr)] md:items-end">
        <div className="min-w-0">
          <label htmlFor={`${id}-amount`} className="mb-1.5 block text-sm font-medium text-gray-700">
            Amount
          </label>
          <input
            id={`${id}-amount`}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            className={inputClass}
            placeholder="Enter amount"
          />
        </div>
        <div className="min-w-0">
          <label htmlFor={`${id}-from`} className="mb-1.5 block text-sm font-medium text-gray-700">
            From
          </label>
          <select id={`${id}-from`} value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass}>
            {currencyOptions}
          </select>
        </div>
        <button
          type="button"
          onClick={() => {
            setFrom(to);
            setTo(from);
          }}
          aria-label="Swap currencies"
          title="Swap currencies"
          className="h-12 rounded-lg border border-gray-300 bg-white px-4 text-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <span aria-hidden="true">⇄</span>
        </button>
        <div className="min-w-0">
          <label htmlFor={`${id}-to`} className="mb-1.5 block text-sm font-medium text-gray-700">
            To
          </label>
          <select id={`${id}-to`} value={to} onChange={(e) => setTo(e.target.value)} className={inputClass}>
            {currencyOptions}
          </select>
        </div>
      </div>

      <div aria-live="polite" className="rounded-xl border border-blue-100 bg-blue-50 p-4 sm:p-5">
        {status === 'loading' && <p className="text-sm text-blue-800">Loading today’s exchange rates…</p>}
        {status === 'error' && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" data-testid="currency-error">
            <p className="font-semibold">Live exchange rates are unavailable right now.</p>
            <p className="mt-1">
              We couldn’t reach the exchange rate provider, so no conversion is shown rather than an out-of-date estimate. Check your connection and
              try again.
            </p>
          </div>
        )}
        {status === 'ready' && missing.length > 0 && (
          <p className="text-sm font-medium text-red-700" data-testid="currency-error">
            The provider has no rate for {missing.join(' and ')} today. Please choose another currency.
          </p>
        )}
        {status === 'ready' && missing.length === 0 && amountError && <p className="text-sm text-gray-700">{amountError}</p>}
        {status === 'ready' && result !== null && rate !== null && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-700">Result</p>
              <p className="break-words text-2xl font-semibold text-blue-950" data-testid="currency-result">
                {formatMoney(result, to)}
              </p>
              <p className="mt-1 text-sm text-blue-800" data-testid="currency-rate">
                1 {from} = {formatNumber(rate, 'auto')} {to} · 1 {to} = {formatNumber(1 / rate, 'auto')} {from}
              </p>
              {table?.asOf && (
                <p className="mt-1 text-xs text-blue-700" data-testid="currency-asof">
                  Mid-market rates as of {table.asOf} (UTC), from ExchangeRate-API. Updated once a day.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <CopyButton text={result.toFixed(6).replace(/\.?0+$/, '')} label="Copy result" />
              <CopyButton text={sentence} label="Copy equation" />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void load()}
          disabled={status === 'loading'}
          className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {status === 'error' ? 'Try again' : 'Refresh rates'}
        </button>
      </div>

      {status === 'ready' && amount !== null && !amountError && (
        <details className="rounded-xl border border-gray-200 bg-white" open>
          <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-gray-900">
            {formatMoney(amount, from)} in popular currencies
          </summary>
          <div className="overflow-x-auto px-4 pb-4">
            <table className="w-full text-left text-sm" data-testid="currency-table">
              <tbody>
                {QUICK_TARGETS.filter((c) => c !== from).map((code) => {
                  const r = rateFor(from, code);
                  return (
                    <tr key={code} className="border-t border-gray-100">
                      <th scope="row" className="py-2 pr-3 font-normal text-gray-600">
                        {code} – {currencies.find((c) => c.code === code)?.name}
                      </th>
                      <td className="py-2 text-right font-mono text-gray-900">{r === null ? 'n/a' : formatMoney(amount * r, code)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      )}

      <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
        Rates are mid-market reference rates for information only. Banks, card issuers and transfer services add a margin or fee, so the rate you get
        will usually be lower. Your amount is calculated in your browser; only the daily rate table is downloaded.
      </p>
    </div>
  );
}
