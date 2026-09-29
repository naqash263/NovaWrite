import { useMemo, useState, type ReactNode } from 'react';
import {
  calculateGratuity,
  dailyWageMethods,
  describeService,
  formatDecimal,
  formatRatio,
  parseFils,
  parseHundredths,
  serviceFromDates,
  serviceFromParts,
  UNITS_PER_DAY,
  UNITS_PER_YEAR,
  type DailyWageMethod,
} from './uaeMoney';

type EntryMode = 'dates' | 'parts';

const inputClass = (error?: string) =>
  `w-full min-w-0 rounded-lg border px-2 py-2 sm:px-3.5 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-400' : 'border-gray-300'}`;

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-gray-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

const describedBy = (id: string, error?: string, hint?: string) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined);

const isWhole = (s: string) => /^\d+$/.test(s.trim());

const sources = [
  { href: 'https://u.ae/en/information-and-services/jobs/end-of-service-benefits-for-employees-in-the-private-sector/calculations-for-gratuity-pay-', label: 'u.ae: Calculations for gratuity pay' },
  {
    href: 'https://www.mohre.gov.ae/en/laws-and-regulations/Laws/faq.aspx',
    label: 'MOHRE: Laws & regulations FAQ (Federal Decree-Law No. 33 of 2021, Article 51)',
  },
  { href: 'https://en.adgm.thomsonreuters.com/rulebook/59-end-service-gratuity', label: 'ADGM Employment Regulations: end-of-service gratuity' },
  { href: 'https://global.lockton.com/us/en/news-insights/uae-to-replace-end-of-service-gratuity-with-funded-workplace-savings-plan', label: 'DIFC DEWS savings plan (replaced gratuity from February 2020)' },
];

export default function UaeGratuityCalculator() {
  const [salary, setSalary] = useState('10000');
  const [mode, setMode] = useState<EntryMode>('dates');
  const [start, setStart] = useState('2021-01-01');
  const [end, setEnd] = useState('2023-12-31');
  const [years, setYears] = useState('3');
  const [months, setMonths] = useState('0');
  const [days, setDays] = useState('0');
  const [unpaid, setUnpaid] = useState('');
  const [method, setMethod] = useState<DailyWageMethod>('thirty');
  const [partTime, setPartTime] = useState('100');
  const [notice, setNotice] = useState('');

  // ---- validation
  const salaryFils = parseFils(salary);
  const salaryError =
    salary.trim() === ''
      ? 'Enter your basic monthly salary.'
      : Number(salary) <= 0 || Number.isNaN(Number(salary))
        ? 'The basic salary must be greater than 0.'
        : salaryFils === null
          ? 'Use a number with at most 2 decimal places.'
          : salaryFils > 1_000_000_000n
            ? 'Enter a basic salary up to AED 10,000,000.'
            : '';

  const dateService = mode === 'dates' ? serviceFromDates(start, end) : null;
  const startError = mode === 'dates' && !start ? 'Enter the first working day.' : '';
  const endError = mode === 'dates' && !startError ? (!end ? 'Enter the last working day.' : !dateService ? 'The end date must be after the start date.' : '') : '';

  const partsErrors =
    mode === 'parts'
      ? {
          years: !isWhole(years) || Number(years) > 60 ? 'Enter whole years from 0 to 60.' : '',
          months: !isWhole(months) || Number(months) > 11 ? 'Enter whole months from 0 to 11.' : '',
          days: !isWhole(days) || Number(days) > 364 ? 'Enter whole days from 0 to 364.' : '',
        }
      : { years: '', months: '', days: '' };

  const totalUnits =
    mode === 'dates'
      ? (dateService?.units ?? null)
      : partsErrors.years || partsErrors.months || partsErrors.days
        ? null
        : serviceFromParts(Number(years), Number(months), Number(days));

  const unpaidDays = unpaid.trim() === '' ? 0 : isWhole(unpaid) ? Number(unpaid) : NaN;
  const unpaidUnits = Number.isNaN(unpaidDays) ? null : BigInt(unpaidDays) * UNITS_PER_DAY;
  let unpaidError = Number.isNaN(unpaidDays) ? 'Enter unpaid leave as a whole number of days.' : '';
  let serviceError = '';
  if (!unpaidError && totalUnits !== null && unpaidUnits !== null) {
    if (unpaidUnits > totalUnits) unpaidError = 'Unpaid leave cannot be longer than the service period.';
    else if (totalUnits - unpaidUnits > 60n * UNITS_PER_YEAR) serviceError = 'This calculator covers up to 60 years of service.';
    else if (mode === 'parts' && totalUnits === 0n) serviceError = 'Enter the length of service.';
  }

  const partBp = parseHundredths(partTime);
  const partTimeError = partBp === null || partBp < 100n || partBp > 10000n ? 'Enter a percentage from 1 to 100.' : '';

  const serviceUnits = totalUnits !== null && unpaidUnits !== null && !unpaidError && !serviceError ? totalUnits - unpaidUnits : null;
  const valid = !salaryError && serviceUnits !== null && !partTimeError && salaryFils !== null && partBp !== null;

  const result = useMemo(
    () => (valid && salaryFils !== null && serviceUnits !== null && partBp !== null ? calculateGratuity(salaryFils, serviceUnits, method, partBp) : null),
    [valid, salaryFils, serviceUnits, method, partBp],
  );

  // ---- display helpers
  const money = (n: bigint) => (result ? formatRatio(n, result.denominator) : '');
  /** Table cells: the AED unit is in the column header. */
  const cell = (n: bigint) => money(n).replace('AED ', '');
  const daysOfWage = (dayUnits: bigint) => formatDecimal(dayUnits, UNITS_PER_YEAR, 2);
  const yearsLabel = (units: bigint) => formatDecimal(units, UNITS_PER_YEAR, 4);
  const partTimeApplied = result ? result.partTimeBasisPoints !== 10000n : false;
  const dailyWage = result ? formatRatio(result.dailyN, result.dailyD) : '';
  const total = result ? formatRatio(result.total, result.totalDenominator) : '';

  const summary = () => {
    if (!result) return '';
    const lines = [
      'UAE gratuity estimate (Article 51, Federal Decree-Law No. 33 of 2021)',
      `Basic monthly salary: ${formatRatio(salaryFils ?? 0n, 1n)}`,
      `Eligible service: ${describeService(result.serviceUnits)} (${yearsLabel(result.serviceUnits)} years)${unpaidDays ? `, after ${unpaidDays} unpaid leave days` : ''}`,
      `Daily wage: ${dailyWage} (${dailyWageMethods[method].formula})`,
    ];
    if (result.eligible) {
      lines.push(
        `Years 1-5: ${daysOfWage(result.band1.dayUnits)} days x daily wage = ${money(result.band1.amount)}`,
        `After year 5: ${daysOfWage(result.band2.dayUnits)} days x daily wage = ${money(result.band2.amount)}`,
        `Two-year cap: ${money(result.cap)}${result.capApplied ? ' (applied)' : ' (not reached)'}`,
      );
      if (partTimeApplied) lines.push(`Part-time share: ${formatDecimal(result.partTimeBasisPoints, 100n, 2)}%`);
    } else lines.push('Not eligible: less than one year of continuous service.');
    lines.push(`Estimated gratuity: ${total}`, 'Estimate only, not legal advice.');
    return lines.join('\n');
  };

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice((n) => (n === msg ? '' : n)), 2500);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary());
      flash('Copied to clipboard.');
    } catch {
      flash('Copy failed. Select the result and copy it manually.');
    }
  };

  return (
    <div className="min-w-0">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Inputs */}
          <form className="min-w-0 space-y-5" onSubmit={(e) => e.preventDefault()} noValidate>
            <Field id="gratuity-salary" label="Basic monthly salary (AED)" error={salaryError} hint="Basic pay only: exclude housing, transport and other allowances.">
              <input
                id="gratuity-salary"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                aria-invalid={Boolean(salaryError)}
                aria-describedby={describedBy('gratuity-salary', salaryError, 'hint')}
                className={inputClass(salaryError)}
              />
            </Field>

            <fieldset className="min-w-0">
              <legend className="mb-1.5 block text-sm font-medium text-gray-700">Length of service</legend>
              <div className="mb-3 inline-flex overflow-hidden rounded-lg border border-gray-300" role="group" aria-label="How to enter service">
                {(
                  [
                    ['dates', 'Start and end dates'],
                    ['parts', 'Years, months, days'],
                  ] as const
                ).map(([m, label]) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={mode === m}
                    onClick={() => setMode(m)}
                    className={`px-3 py-1.5 text-sm font-medium ${mode === m ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {mode === 'dates' ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field id="gratuity-start" label="Start date (first working day)" error={startError}>
                    <input
                      id="gratuity-start"
                      type="date"
                      value={start}
                      onChange={(e) => setStart(e.target.value)}
                      aria-invalid={Boolean(startError)}
                      aria-describedby={describedBy('gratuity-start', startError)}
                      className={inputClass(startError)}
                    />
                  </Field>
                  <Field id="gratuity-end" label="End date (last working day)" error={endError}>
                    <input
                      id="gratuity-end"
                      type="date"
                      value={end}
                      onChange={(e) => setEnd(e.target.value)}
                      aria-invalid={Boolean(endError)}
                      aria-describedby={describedBy('gratuity-end', endError)}
                      className={inputClass(endError)}
                    />
                  </Field>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      ['gratuity-years', 'Years', years, setYears, partsErrors.years],
                      ['gratuity-months', 'Months', months, setMonths, partsErrors.months],
                      ['gratuity-days', 'Days', days, setDays, partsErrors.days],
                    ] as const
                  ).map(([id, label, value, set, error]) => (
                    <Field key={id} id={id} label={label} error={error}>
                      <input
                        id={id}
                        type="number"
                        inputMode="numeric"
                        min="0"
                        step="1"
                        value={value}
                        onChange={(e) => set(e.target.value)}
                        aria-invalid={Boolean(error)}
                        aria-describedby={describedBy(id, error)}
                        className={inputClass(error)}
                      />
                    </Field>
                  ))}
                </div>
              )}
              {serviceError && (
                <p className="mt-2 text-sm text-red-700" role="alert">
                  {serviceError}
                </p>
              )}
            </fieldset>

            <Field id="gratuity-unpaid" label="Unpaid leave days (optional)" error={unpaidError} hint="Days of unpaid absence are not counted as service (Article 51).">
              <input
                id="gratuity-unpaid"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={unpaid}
                onChange={(e) => setUnpaid(e.target.value)}
                aria-invalid={Boolean(unpaidError)}
                aria-describedby={describedBy('gratuity-unpaid', unpaidError, 'hint')}
                className={inputClass(unpaidError)}
              />
            </Field>

            <details className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <summary className="cursor-pointer text-sm font-medium text-gray-800">Advanced options</summary>
              <div className="mt-3 space-y-4">
                <Field id="gratuity-method" label="Daily wage method" hint="Basic ÷ 30 is the common UAE practice. Some employers annualise; ADGM uses ÷ 365.">
                  <select
                    id="gratuity-method"
                    value={method}
                    onChange={(e) => setMethod(e.target.value as DailyWageMethod)}
                    aria-describedby="gratuity-method-hint"
                    className={inputClass()}
                  >
                    {(Object.keys(dailyWageMethods) as DailyWageMethod[]).map((m) => (
                      <option key={m} value={m}>
                        {dailyWageMethods[m].label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  id="gratuity-part-time"
                  label="Working hours as % of full time"
                  error={partTimeError}
                  hint="For part-time contracts the full-time gratuity is pro-rated by contracted hours. Leave at 100 for full time."
                >
                  <input
                    id="gratuity-part-time"
                    type="number"
                    inputMode="decimal"
                    min="1"
                    max="100"
                    step="1"
                    value={partTime}
                    onChange={(e) => setPartTime(e.target.value)}
                    aria-invalid={Boolean(partTimeError)}
                    aria-describedby={describedBy('gratuity-part-time', partTimeError, 'hint')}
                    className={inputClass(partTimeError)}
                  />
                </Field>
              </div>
            </details>
          </form>

          {/* Results */}
          <div className="min-w-0" aria-live="polite">
            {!result ? (
              <p className="rounded-lg bg-gray-50 p-4 text-gray-600" data-testid="gratuity-empty">
                Enter a valid basic salary and service period to see your gratuity.
              </p>
            ) : (
              <div className="space-y-4" data-testid="gratuity-result">
                <div className="rounded-xl bg-blue-50 p-4">
                  <div className="text-sm text-gray-600">Estimated gratuity</div>
                  <div className="break-words text-3xl font-bold text-blue-800 tabular-nums" data-testid="gratuity-total">
                    {total}
                  </div>
                  {result.eligible ? (
                    <div className="mt-1 text-xs text-gray-600">
                      {daysOfWage(result.dayUnits)} days of basic wage{result.capApplied ? ', limited by the two-year cap' : ''}
                      {partTimeApplied ? `, × ${formatDecimal(result.partTimeBasisPoints, 100n, 2)}% part-time` : ''}
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-amber-900" data-testid="gratuity-not-eligible">
                      Not eligible yet: gratuity needs at least one year of continuous service (after unpaid leave).
                    </p>
                  )}
                </div>

                <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <dt className="text-gray-600">Eligible service</dt>
                    <dd className="font-semibold text-gray-900" data-testid="gratuity-service">
                      {describeService(result.serviceUnits)}
                    </dd>
                    <dd className="text-xs text-gray-500" data-testid="gratuity-service-years">
                      {yearsLabel(result.serviceUnits)} years
                      {unpaidDays ? ` after ${unpaidDays} unpaid day${unpaidDays === 1 ? '' : 's'}` : ''}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <dt className="text-gray-600">Daily basic wage</dt>
                    <dd className="font-semibold text-gray-900 tabular-nums" data-testid="gratuity-daily-wage">
                      {dailyWage}
                    </dd>
                    <dd className="text-xs text-gray-500">{dailyWageMethods[method].formula}</dd>
                  </div>
                </dl>

                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full whitespace-normal text-xs sm:text-sm" data-testid="gratuity-bands">
                    <caption className="sr-only">Gratuity by band</caption>
                    <thead className="bg-gray-50 text-left text-gray-600">
                      <tr>
                        <th scope="col" className="px-2 py-2 sm:px-3 font-medium">Band</th>
                        <th scope="col" className="px-2 py-2 sm:px-3 text-right font-medium">Days</th>
                        <th scope="col" className="px-2 py-2 sm:px-3 text-right font-medium">Amount (AED)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <th scope="row" className="px-2 py-2 sm:px-3 text-left font-normal">
                          Years 1–5 <span className="block text-xs text-gray-500">(21 days/yr × {yearsLabel(result.band1.units)})</span>
                        </th>
                        <td className="px-2 py-2 sm:px-3 text-right tabular-nums" data-testid="gratuity-band1-days">
                          {daysOfWage(result.band1.dayUnits)}
                        </td>
                        <td className="px-2 py-2 sm:px-3 text-right tabular-nums" data-testid="gratuity-band1">
                          {cell(result.band1.amount)}
                        </td>
                      </tr>
                      <tr>
                        <th scope="row" className="px-2 py-2 sm:px-3 text-left font-normal">
                          After year 5 <span className="block text-xs text-gray-500">(30 days/yr × {yearsLabel(result.band2.units)})</span>
                        </th>
                        <td className="px-2 py-2 sm:px-3 text-right tabular-nums" data-testid="gratuity-band2-days">
                          {daysOfWage(result.band2.dayUnits)}
                        </td>
                        <td className="px-2 py-2 sm:px-3 text-right tabular-nums" data-testid="gratuity-band2">
                          {cell(result.band2.amount)}
                        </td>
                      </tr>
                      <tr>
                        <th scope="row" className="px-2 py-2 sm:px-3 text-left font-normal">
                          Two-year cap <span className="block text-xs text-gray-500">(24 × basic salary)</span>
                        </th>
                        <td className="px-2 py-2 sm:px-3 text-right text-gray-600" data-testid="gratuity-cap-status">
                          {result.capApplied ? 'Applied' : 'Not reached'}
                        </td>
                        <td className="px-2 py-2 sm:px-3 text-right tabular-nums" data-testid="gratuity-cap">
                          {cell(result.cap)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={copy} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                    Copy result
                  </button>
                  <button type="button" onClick={() => window.print()} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100">
                    Print
                  </button>
                  <span aria-live="polite" className="text-sm text-gray-600" data-testid="gratuity-notice">
                    {notice}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {result && result.schedule.length > 0 && (
          <section className="mt-6" aria-labelledby="gratuity-schedule-heading">
            <h2 id="gratuity-schedule-heading" className="mb-2 text-lg font-semibold text-gray-900">
              Year-by-year schedule
            </h2>
            <div className="max-h-96 overflow-auto rounded-lg border border-gray-200">
              <table className="w-full text-xs sm:text-sm" data-testid="gratuity-schedule">
                <thead className="sticky top-0 bg-gray-50 text-gray-600">
                  <tr>
                    <th scope="col" className="px-2 py-2 text-left font-medium">Year</th>
                    <th scope="col" className="hidden px-2 py-2 text-right font-medium sm:table-cell">Service</th>
                    <th scope="col" className="hidden px-2 py-2 text-right font-medium sm:table-cell">Rate</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">Days</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">Amount (AED)</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">Total (AED)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {result.schedule.map((row) => (
                    <tr key={row.year} className={row.capped ? 'bg-amber-50' : undefined}>
                      <td className="px-2 py-1.5">{row.year}</td>
                      <td className="hidden px-2 py-1.5 text-right tabular-nums sm:table-cell">{row.units === UNITS_PER_YEAR ? 'Full year' : `${formatDecimal(row.units, UNITS_PER_DAY, row.units % UNITS_PER_DAY ? 2 : 0)} days`}</td>
                      <td className="hidden px-2 py-1.5 text-right sm:table-cell">{row.rate} d/yr</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{daysOfWage(row.dayUnits)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{cell(row.amount)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">
                        {cell(row.cumulative)}
                        {row.capped ? ' (cap)' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Amounts are exact and rounded to the fils only for display, so a column may differ from the total by AED 0.01.
              {partTimeApplied ? ' The schedule shows full-time amounts before the part-time percentage.' : ''}
            </p>
          </section>
        )}

        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" data-testid="gratuity-disclaimer">
          <strong>Estimate only, not legal advice.</strong> This follows the mainland UAE labour law (Federal Decree-Law No. 33 of 2021) for
          private-sector employees. DIFC (DEWS savings plan) and ADGM (own Employment Regulations) use different rules, and deductions,
          contract terms or a MOHRE or court decision can change the final amount.
        </p>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6" aria-labelledby="gratuity-formula-heading">
        <h2 id="gratuity-formula-heading" className="text-xl font-semibold text-gray-900">
          How UAE gratuity is calculated
        </h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-gray-700">
          <li>Eligible service = days from the first to the last working day (both included) minus unpaid absence days. Under one year: no gratuity.</li>
          <li>Daily wage = basic monthly salary ÷ 30 (or × 12 ÷ 365 if your employer annualises). Allowances are excluded.</li>
          <li>Days of wage = 21 × years of service up to 5, plus 30 × years after the fifth. Part years count pro-rata (days ÷ 365).</li>
          <li>Gratuity = daily wage × days of wage, capped at two years&rsquo; wage (24 × basic monthly salary).</li>
        </ol>
        <h3 className="mt-5 text-lg font-semibold text-gray-900">Worked example</h3>
        <p className="mt-2 text-gray-700">
          Basic salary AED 10,000, 7 years of service, no unpaid leave. Daily wage = 10,000 ÷ 30 = AED 333.33. Years 1–5: 5 × 21 = 105 days = AED
          35,000. Years 6–7: 2 × 30 = 60 days = AED 20,000. Total: 165 days = <strong>AED 55,000</strong>, below the cap of AED 240,000. With 90
          days of unpaid leave, service falls to 6 years 275 days and the gratuity to about AED 52,534.25.
        </p>
        <h3 className="mt-5 text-lg font-semibold text-gray-900">Sources</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {sources.map((s) => (
            <li key={s.href}>
              <a href={s.href} target="_blank" rel="noopener noreferrer" className="break-words text-blue-700 underline hover:text-blue-800">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
