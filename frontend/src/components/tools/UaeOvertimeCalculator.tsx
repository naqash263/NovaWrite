import { useState, type ReactNode } from 'react';
import { calculateOvertime, formatDecimal, formatFils, formatRatio, hourlyMethods, parseFils, parseHundredths, type HourlyMethod, type OvertimeKind } from './uaeMoney';

type Basis = 'basic' | 'full';
type Period = 'month' | 'week' | 'threeWeeks';

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

const MAX_FILS = 1_000_000_000n; // AED 10,000,000

function moneyError(raw: string, label: string, required: boolean) {
  if (raw.trim() === '') return required ? `Enter your ${label}.` : '';
  const n = Number(raw);
  if (Number.isNaN(n) || n < 0 || (required && n === 0)) return required ? `The ${label} must be greater than 0.` : `The ${label} cannot be negative.`;
  const fils = parseFils(raw);
  if (fils === null) return 'Use a number with at most 2 decimal places.';
  if (fils > MAX_FILS) return `Enter ${label} up to AED 10,000,000.`;
  return '';
}

function hoursValue(raw: string, max: number) {
  if (raw.trim() === '') return { error: '', value: 0n };
  const v = parseHundredths(raw);
  if (v === null || Number.isNaN(Number(raw))) return { error: 'Enter hours as a number with at most 2 decimals.', value: null };
  if (v > BigInt(max) * 100n) return { error: `Enter up to ${max} hours.`, value: null };
  return { error: '', value: v };
}

/** Weeks covered by each period; a month is taken as 30 days. */
const periodWeeks: Record<Period, number> = { week: 1, threeWeeks: 3, month: 30 / 7 };
const periodLabel: Record<Period, string> = { month: 'One month (30 days)', week: 'One week', threeWeeks: 'Three weeks' };
const periodMaxHours: Record<Period, number> = { week: 168, threeWeeks: 504, month: 720 };

const kinds: { kind: OvertimeKind; id: string; label: string; hint: string }[] = [
  { kind: 'regular', id: 'overtime-regular', label: 'Regular overtime hours', hint: 'Extra hours on a working day, outside 10 pm–4 am.' },
  { kind: 'night', id: 'overtime-night', label: 'Night overtime hours (10 pm–4 am)', hint: 'Overtime worked between 10 pm and 4 am.' },
  { kind: 'restDay', id: 'overtime-rest', label: 'Rest day or public holiday hours', hint: 'Only if you did not get a substitute day off.' },
];

const kindLabel: Record<OvertimeKind, string> = { regular: 'Regular overtime', night: 'Night (10 pm–4 am)', restDay: 'Rest day / public holiday' };

const sources = [
  { href: 'https://u.ae/en/information-and-services/jobs/Sector-of-employment/employment-in-the-private-sector/working-hours', label: 'u.ae: Working hours and overtime' },
  {
    href: 'https://mohre.gov.ae/en/guidance-and-awareness-portal-new/employee-companies/dear-worker-know-your-rights',
    label: 'MOHRE: Dear Worker – Know Your Rights (overtime, rest days, public holidays)',
  },
  {
    href: 'https://www.mohre.gov.ae/assets/download/e82f7872/Federal%20Decree-Law%20No.%2033%20of%202021%20Regarding%20the%20Regulation%20of%20Employment%20Relationship%20and%20its%20amendments_638990571068264034.pdf.aspx',
    label: 'MOHRE: Federal Decree-Law No. 33 of 2021 (Articles 17, 19 and 28)',
  },
  { href: 'https://uaelegislation.gov.ae/en/legislations/1547/download', label: 'Cabinet Resolution No. 1 of 2022 (Executive Regulations, Article 15)' },
  { href: 'https://www.khaleejtimes.com/uae/legal/overtime-pay-explained', label: 'Khaleej Times: overtime pay explained (Article 19(2) and 19(3))' },
];

export default function UaeOvertimeCalculator() {
  const [salary, setSalary] = useState('6000');
  const [allowances, setAllowances] = useState('');
  const [dailyHours, setDailyHours] = useState('8');
  const [daysPerWeek, setDaysPerWeek] = useState('5');
  const [hours, setHours] = useState<Record<OvertimeKind, string>>({ regular: '10', night: '4', restDay: '8' });
  const [period, setPeriod] = useState<Period>('month');
  const [method, setMethod] = useState<HourlyMethod>('thirty');
  const [basis, setBasis] = useState<Basis>('basic');
  const [shiftWorker, setShiftWorker] = useState(false);
  const [notice, setNotice] = useState('');

  // ---- validation
  const salaryError = moneyError(salary, 'basic monthly salary', true);
  const allowancesError = basis === 'full' ? moneyError(allowances, 'monthly allowances', false) : '';
  const salaryFils = salaryError ? null : parseFils(salary);
  const allowanceFils = basis === 'basic' ? 0n : allowancesError ? null : allowances.trim() === '' ? 0n : parseFils(allowances);
  const wageFils = salaryFils !== null && allowanceFils !== null ? salaryFils + allowanceFils : null;

  const dailyH = parseHundredths(dailyHours);
  const dailyError =
    dailyHours.trim() === '' ? 'Enter your normal daily hours.' : dailyH === null || dailyH === 0n || dailyH > 2400n ? 'Enter normal daily hours from 0.01 to 24.' : '';
  const daysError = /^[1-7]$/.test(daysPerWeek.trim()) ? '' : 'Enter whole working days from 1 to 7.';
  const hourValues = Object.fromEntries(kinds.map(({ kind }) => [kind, hoursValue(hours[kind], periodMaxHours[period])])) as Record<OvertimeKind, ReturnType<typeof hoursValue>>;
  const hoursValid = kinds.every(({ kind }) => hourValues[kind].value !== null);

  const valid = wageFils !== null && !dailyError && !daysError && hoursValid && dailyH !== null;
  const result = valid
    ? calculateOvertime(
        wageFils,
        dailyH,
        BigInt(Number(daysPerWeek)),
        method,
        { regular: hourValues.regular.value!, night: hourValues.night.value!, restDay: hourValues.restDay.value! },
        shiftWorker,
      )
    : null;

  // ---- legal limit warnings (Article 17 and Article 19(1))
  const warnings: { id: string; text: string }[] = [];
  if (result && dailyH !== null) {
    const daily = Number(dailyH) / 100;
    const perWeek = Number(daysPerWeek);
    const weeks = periodWeeks[period];
    const hrs = (k: OvertimeKind) => Number(hourValues[k].value) / 100;
    if (daily > 8) warnings.push({ id: 'daily-hours', text: `Normal hours of ${formatDecimal(dailyH, 100n, 2)} a day are above the 8-hour limit in Article 17 (some sectors and roles are exempt).` });
    if (daily * perWeek > 48)
      warnings.push({ id: 'weekly-hours', text: `Normal hours of ${(daily * perWeek).toFixed(2)} a week are above the 48-hour limit in Article 17.` });
    const workingDays = perWeek * weeks;
    const avgOvertime = (hrs('regular') + hrs('night')) / workingDays;
    if (avgOvertime > 2)
      warnings.push({
        id: 'daily-overtime',
        text: `That is about ${avgOvertime.toFixed(2)} overtime hours per working day. Article 19 allows at most 2 hours a day, unless the work is needed to prevent a serious loss or accident.`,
      });
    const totalPerThreeWeeks = ((daily * workingDays + hrs('regular') + hrs('night') + hrs('restDay')) * 3) / weeks;
    if (totalPerThreeWeeks > 144 + 1e-9)
      warnings.push({
        id: 'three-week-cap',
        text: `Total working hours average ${totalPerThreeWeeks.toFixed(2)} per 3 weeks, above the 144-hour limit in Article 19.`,
      });
  }

  // ---- display helpers
  const money = (n: bigint) => (result ? formatRatio(n, result.denominator) : '');
  const cell = (n: bigint) => money(n).replace('AED ', '');
  const hourly = result ? formatRatio(result.hourlyN, result.hourlyD) : '';
  const rate = (premium: bigint) => (result ? formatRatio(result.hourlyN * (100n + premium), result.hourlyD * 100n).replace('AED ', '') : '');
  const hoursText = (h: bigint) => formatDecimal(h, 100n, 2);
  const total = result ? money(result.total) : '';

  const summary = () => {
    if (!result) return '';
    return [
      'UAE overtime estimate (Article 19, Federal Decree-Law No. 33 of 2021)',
      `Monthly ${basis === 'basic' ? 'basic salary' : 'wage (basic + allowances)'}: ${wageFils !== null ? formatFils(wageFils) : ''}`,
      `Hourly wage: ${hourly} (${hourlyMethods[method].formula})`,
      ...result.lines.map((l) => `${kindLabel[l.kind]}: ${hoursText(l.hours)} h × ${rate(l.premium)} (+${l.premium}%) = ${money(l.amount)}`),
      `Total overtime pay: ${total}`,
      'Estimate only, not legal advice.',
    ].join('\n');
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
            <Field id="overtime-salary" label="Basic monthly salary (AED)" error={salaryError} hint="Overtime is calculated on the basic wage, without allowances.">
              <input
                id="overtime-salary"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                aria-invalid={Boolean(salaryError)}
                aria-describedby={describedBy('overtime-salary', salaryError, 'hint')}
                className={inputClass(salaryError)}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field id="overtime-daily-hours" label="Normal hours per day" error={dailyError}>
                <input
                  id="overtime-daily-hours"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.5"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(e.target.value)}
                  aria-invalid={Boolean(dailyError)}
                  aria-describedby={describedBy('overtime-daily-hours', dailyError)}
                  className={inputClass(dailyError)}
                />
              </Field>
              <Field id="overtime-days" label="Working days per week" error={daysError}>
                <input
                  id="overtime-days"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="7"
                  step="1"
                  value={daysPerWeek}
                  onChange={(e) => setDaysPerWeek(e.target.value)}
                  aria-invalid={Boolean(daysError)}
                  aria-describedby={describedBy('overtime-days', daysError)}
                  className={inputClass(daysError)}
                />
              </Field>
            </div>

            <fieldset className="min-w-0 space-y-4">
              <legend className="mb-1.5 block text-sm font-medium text-gray-700">Overtime worked</legend>
              {kinds.map(({ kind, id, label, hint }) => (
                <Field key={kind} id={id} label={label} error={hourValues[kind].error} hint={hint}>
                  <input
                    id={id}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.5"
                    value={hours[kind]}
                    onChange={(e) => setHours((h) => ({ ...h, [kind]: e.target.value }))}
                    aria-invalid={Boolean(hourValues[kind].error)}
                    aria-describedby={describedBy(id, hourValues[kind].error, 'hint')}
                    className={inputClass(hourValues[kind].error)}
                  />
                </Field>
              ))}
              <Field id="overtime-period" label="Period these hours cover" hint="Used only to check the daily and 3-week limits.">
                <select id="overtime-period" value={period} onChange={(e) => setPeriod(e.target.value as Period)} aria-describedby="overtime-period-hint" className={inputClass()}>
                  {(Object.keys(periodLabel) as Period[]).map((p) => (
                    <option key={p} value={p}>
                      {periodLabel[p]}
                    </option>
                  ))}
                </select>
              </Field>
            </fieldset>

            <details className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <summary className="cursor-pointer text-sm font-medium text-gray-800">Advanced options</summary>
              <div className="mt-3 space-y-4">
                <Field id="overtime-method" label="Hourly wage method" hint="÷ 30 ÷ daily hours is the common UAE payroll practice. The law does not fix a divisor.">
                  <select id="overtime-method" value={method} onChange={(e) => setMethod(e.target.value as HourlyMethod)} aria-describedby="overtime-method-hint" className={inputClass()}>
                    {(Object.keys(hourlyMethods) as HourlyMethod[]).map((m) => (
                      <option key={m} value={m}>
                        {hourlyMethods[m].label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="overtime-basis" label="Wage used for the hourly rate" hint="The law uses the basic wage. Include allowances only if your contract pays overtime on the full wage.">
                  <select id="overtime-basis" value={basis} onChange={(e) => setBasis(e.target.value as Basis)} aria-describedby="overtime-basis-hint" className={inputClass()}>
                    <option value="basic">Basic salary (legal minimum)</option>
                    <option value="full">Basic salary + allowances (contract)</option>
                  </select>
                </Field>
                {basis === 'full' && (
                  <Field id="overtime-allowances" label="Monthly allowances (AED)" error={allowancesError}>
                    <input
                      id="overtime-allowances"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={allowances}
                      onChange={(e) => setAllowances(e.target.value)}
                      aria-invalid={Boolean(allowancesError)}
                      aria-describedby={describedBy('overtime-allowances', allowancesError)}
                      className={inputClass(allowancesError)}
                    />
                  </Field>
                )}
                <label className="flex items-start gap-2 text-sm text-gray-700">
                  <input type="checkbox" className="mt-0.5" checked={shiftWorker} onChange={(e) => setShiftWorker(e.target.checked)} />
                  <span>I work in shifts (the 50% night rate does not apply to shift workers, so night hours are paid at +25%)</span>
                </label>
              </div>
            </details>
          </form>

          {/* Results */}
          <div className="min-w-0" aria-live="polite">
            {!result ? (
              <p className="rounded-lg bg-gray-50 p-4 text-gray-600" data-testid="overtime-empty">
                Enter a valid salary, normal hours and overtime hours to see your overtime pay.
              </p>
            ) : (
              <div className="space-y-4" data-testid="overtime-result">
                <div className="rounded-xl bg-blue-50 p-4">
                  <div className="text-sm text-gray-600">Total overtime pay</div>
                  <div className="break-words text-3xl font-bold text-blue-800 tabular-nums" data-testid="overtime-total">
                    {total}
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    {hoursText(result.totalHours)} hours at an hourly {basis === 'basic' ? 'basic ' : ''}wage of <span data-testid="overtime-hourly">{hourly}</span>
                  </div>
                  {result.totalHours === 0n && (
                    <p className="mt-1 text-sm text-gray-700" data-testid="overtime-no-hours">
                      Enter the overtime hours you worked to see the pay.
                    </p>
                  )}
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full whitespace-normal text-xs sm:text-sm" data-testid="overtime-breakdown">
                    <caption className="sr-only">Overtime pay by type</caption>
                    <thead className="bg-gray-50 text-left text-gray-600">
                      <tr>
                        <th scope="col" className="px-2 py-2 font-medium sm:px-3">Type</th>
                        <th scope="col" className="px-2 py-2 text-right font-medium sm:px-3">Hours</th>
                        <th scope="col" className="px-2 py-2 text-right font-medium sm:px-3">Rate/h</th>
                        <th scope="col" className="px-2 py-2 text-right font-medium sm:px-3">Pay (AED)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {result.lines.map((l) => (
                        <tr key={l.kind}>
                          <th scope="row" className="px-2 py-2 text-left font-normal sm:px-3">
                            {kindLabel[l.kind]} <span className="block text-xs text-gray-500" data-testid={`overtime-premium-${l.kind}`}>+{l.premium.toString()}%</span>
                          </th>
                          <td className="px-2 py-2 text-right tabular-nums sm:px-3">{hoursText(l.hours)}</td>
                          <td className="px-2 py-2 text-right tabular-nums sm:px-3" data-testid={`overtime-rate-${l.kind}`}>
                            {rate(l.premium)}
                          </td>
                          <td className="px-2 py-2 text-right tabular-nums sm:px-3" data-testid={`overtime-pay-${l.kind}`}>
                            {cell(l.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500">Hourly wage = {hourlyMethods[method].formula}. Amounts are exact and rounded to the fils only for display.</p>

                {warnings.length > 0 && (
                  <ul className="space-y-2" data-testid="overtime-warnings">
                    {warnings.map((w) => (
                      <li key={w.id} className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900" data-testid={`overtime-warning-${w.id}`}>
                        {w.text}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={copy} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                    Copy result
                  </button>
                  <button type="button" onClick={() => window.print()} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100">
                    Print
                  </button>
                  <span aria-live="polite" className="text-sm text-gray-600" data-testid="overtime-notice">
                    {notice}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" data-testid="overtime-disclaimer">
          <strong>Estimate only, not legal advice.</strong> This follows the mainland UAE labour law (Federal Decree-Law No. 33 of 2021 and Cabinet
          Resolution No. 1 of 2022) for private-sector employees. Senior managers and some sectors are exempt from the hour limits, DIFC and ADGM
          have their own employment laws, and your contract may pay more than the legal minimum.
        </p>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6" aria-labelledby="overtime-formula-heading">
        <h2 id="overtime-formula-heading" className="text-xl font-semibold text-gray-900">
          How UAE overtime is calculated
        </h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-gray-700">
          <li>Normal working hours are at most 8 a day or 48 a week (Article 17), reduced by 2 hours a day in Ramadan.</li>
          <li>Hourly wage = basic monthly salary ÷ 30 ÷ normal daily hours. Allowances are not included.</li>
          <li>Regular overtime = hourly wage × 125% (at least 25% extra) for each overtime hour.</li>
          <li>Overtime between 10 pm and 4 am = hourly wage × 150%. Shift workers are excluded from this night rate.</li>
          <li>Work on a rest day or public holiday earns a substitute day off, or pay for the hours plus at least 50% (× 150%).</li>
          <li>Overtime may not exceed 2 hours a day, and total working hours may not exceed 144 in any 3 weeks (Article 19).</li>
        </ol>
        <h3 className="mt-5 text-lg font-semibold text-gray-900">Worked example</h3>
        <p className="mt-2 text-gray-700">
          Basic salary AED 6,000 and 8 normal hours a day. Hourly wage = 6,000 ÷ 30 ÷ 8 = AED 25. Ten regular overtime hours pay 10 × 25 × 1.25 = AED
          312.50, four night hours pay 4 × 25 × 1.5 = AED 150, and eight hours on a rest day with no substitute day pay 8 × 25 × 1.5 = AED 300. Total:{' '}
          <strong>AED 762.50</strong>.
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
