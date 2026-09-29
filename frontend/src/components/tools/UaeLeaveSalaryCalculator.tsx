import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  completedMonths,
  dailyWageMethods,
  describeService,
  formatDecimal,
  formatFils,
  formatRatio,
  LEAVE_DAY_D,
  leaveDaysFromHundredths,
  leaveEntitlement,
  leavePay,
  parseFils,
  parseHundredths,
  serviceFromDates,
  shiftIsoDate,
  UNITS_PER_DAY,
  UNITS_PER_YEAR,
  type DailyWageMethod,
  type UnderSixMonths,
} from './uaeMoney';

type Mode = 'leave' | 'exit';
type Source = 'dates' | 'balance';
type Basis = 'full' | 'basic';

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

/** Validates a day count with up to 2 decimals, returning hundredths or an error. */
function daysValue(raw: string, label: string, { required, max, allowZero }: { required: boolean; max: number; allowZero: boolean }) {
  if (raw.trim() === '') return required ? { error: `Enter the ${label}.`, value: null } : { error: '', value: 0n };
  const v = parseHundredths(raw);
  if (v === null || Number.isNaN(Number(raw))) return { error: `Enter the ${label} as a number with at most 2 decimals.`, value: null };
  if (!allowZero && v === 0n) return { error: `The ${label} must be greater than 0.`, value: null };
  if (v > BigInt(max) * 100n) return { error: `Enter up to ${max.toLocaleString('en-US')} days.`, value: null };
  return { error: '', value: v };
}

const days = (n: bigint) => formatDecimal(n, LEAVE_DAY_D, 2);

const basisLabel: Record<Basis, string> = { full: 'basic salary + allowances', basic: 'basic salary only' };

const sources = [
  {
    href: 'https://u.ae/en/information-and-services/jobs/employment-in-the-private-sector/types-of-leaves-and-entitlements-in-the-private-sector/annual-leave',
    label: 'u.ae: Annual leave in the private sector',
  },
  {
    href: 'https://www.mohre.gov.ae/assets/download/e82f7872/Federal%20Decree-Law%20No.%2033%20of%202021%20Regarding%20the%20Regulation%20of%20Employment%20Relationship%20and%20its%20amendments_638990571068264034.pdf.aspx',
    label: 'MOHRE: Federal Decree-Law No. 33 of 2021 (Article 1 wage definitions, Article 29 annual leave)',
  },
  { href: 'https://uaelegislation.gov.ae/en/legislations/1547/download', label: 'Cabinet Resolution No. 1 of 2022 (Executive Regulations)' },
  {
    href: 'https://www.khaleejtimes.com/uae/legal/annual-leave-in-uae-how-many-days-you-can-take-carry-forward-all-you-need-to-know',
    label: 'Khaleej Times: carrying forward up to half of the annual leave',
  },
  {
    href: 'https://gulfnews.com/ask-gulf-news/uae-annual-leave-pay-are-you-entitled-to-your-full-salary-including-allowances-1.500620286',
    label: 'Gulf News: full wage during leave, basic wage for unused leave at exit',
  },
];

export default function UaeLeaveSalaryCalculator() {
  const [mode, setMode] = useState<Mode>('leave');
  const [salary, setSalary] = useState('10000');
  const [allowances, setAllowances] = useState('5000');
  const [source, setSource] = useState<Source>('dates');
  const [start, setStart] = useState('2023-01-01');
  const [end, setEnd] = useState('2025-12-31');
  const [unpaid, setUnpaid] = useState('');
  const [taken, setTaken] = useState('60');
  const [balance, setBalance] = useState('30');
  const [leaveDays, setLeaveDays] = useState('30');
  const [method, setMethod] = useState<DailyWageMethod>('thirty');
  const [leaveBasis, setLeaveBasis] = useState<Basis>('full');
  const [exitBasis, setExitBasis] = useState<Basis>('basic');
  const [underSix, setUnderSix] = useState<UnderSixMonths>('none');
  const [notice, setNotice] = useState('');

  const basis = mode === 'leave' ? leaveBasis : exitBasis;
  const setBasis = mode === 'leave' ? setLeaveBasis : setExitBasis;

  // ---- wage
  const salaryError = moneyError(salary, 'basic monthly salary', true);
  const allowancesError = moneyError(allowances, 'monthly allowances', false);
  const salaryFils = salaryError ? null : parseFils(salary);
  const allowanceFils = allowancesError ? null : allowances.trim() === '' ? 0n : parseFils(allowances);
  const wageFils = salaryFils !== null && allowanceFils !== null ? salaryFils + (basis === 'full' ? allowanceFils : 0n) : null;

  // ---- leave balance
  const service = source === 'dates' ? serviceFromDates(start, end) : null;
  const startError = source === 'dates' && !start ? 'Enter your joining date.' : '';
  const endError =
    source === 'dates' && !startError ? (!end ? `Enter the ${mode === 'exit' ? 'last working day' : 'date to calculate up to'}.` : !service ? 'The end date must be after the joining date.' : '') : '';
  const unpaidDays = unpaid.trim() === '' ? 0 : isWhole(unpaid) ? Number(unpaid) : NaN;
  let unpaidError = source === 'dates' && Number.isNaN(unpaidDays) ? 'Enter unpaid leave as a whole number of days.' : '';
  if (!unpaidError && service && unpaidDays >= service.calendarDays) unpaidError = 'Unpaid leave must be shorter than the service period.';
  const takenV = daysValue(taken, 'leave days taken', { required: false, max: 3650, allowZero: true });
  const balanceV = daysValue(balance, 'unused leave days', { required: true, max: 3650, allowZero: true });
  const leaveV = daysValue(leaveDays, 'leave days', { required: true, max: 365, allowZero: false });

  let serviceUnits: bigint | null = null;
  let entitlement: ReturnType<typeof leaveEntitlement> | null = null;
  let takenDays = 0n;
  let available: bigint | null = null;
  if (source === 'dates') {
    if (service && !unpaidError && !takenV.error && takenV.value !== null) {
      serviceUnits = service.units - BigInt(unpaidDays) * UNITS_PER_DAY;
      const months = completedMonths(start, shiftIsoDate(end, unpaidDays) ?? end);
      entitlement = leaveEntitlement(serviceUnits, months, underSix);
      takenDays = leaveDaysFromHundredths(takenV.value);
      available = entitlement.days - takenDays;
    }
  } else if (!balanceV.error && balanceV.value !== null) {
    available = leaveDaysFromHundredths(balanceV.value);
  }
  const overdrawn = available !== null && available < 0n;
  const availableDays = available === null ? null : overdrawn ? 0n : available;

  const paidDays = mode === 'leave' ? (leaveV.error || leaveV.value === null ? null : leaveDaysFromHundredths(leaveV.value)) : availableDays;
  const overBalance = mode === 'leave' && paidDays !== null && availableDays !== null && paidDays > availableDays;

  // Invalid service dates or balance inputs block the result in both modes.
  const result = wageFils !== null && paidDays !== null && available !== null ? leavePay(wageFils, paidDays, method) : null;
  const total = result ? formatRatio(result.amountN, result.amountD) : '';
  const dailyWage = result ? formatRatio(result.dailyN, result.dailyD) : '';
  const monthlyWage = wageFils !== null ? formatFils(wageFils) : '';

  const ruleText = entitlement
    ? entitlement.rule === 'annual'
      ? `30 days a year × ${formatDecimal(serviceUnits ?? 0n, UNITS_PER_YEAR, 4)} years`
      : entitlement.rule === 'monthly'
        ? `2 days × ${entitlement.months} completed month${entitlement.months === 1 ? '' : 's'}`
        : 'Under 6 months: no statutory paid leave yet'
    : '';

  const headline = mode === 'leave' ? 'Leave salary' : 'Unused leave payout';

  const summary = () => {
    if (!result || paidDays === null) return '';
    const lines = [
      `UAE ${mode === 'leave' ? 'leave salary' : 'unused leave encashment'} estimate (Article 29, Federal Decree-Law No. 33 of 2021)`,
      `Monthly wage used: ${monthlyWage} (${basisLabel[basis]})`,
      `Daily wage: ${dailyWage} (${dailyWageMethods[method].formula.replace('basic monthly salary', 'monthly wage')})`,
    ];
    if (entitlement && serviceUnits !== null) {
      lines.push(`Service: ${describeService(serviceUnits)}${unpaidDays ? ` after ${unpaidDays} unpaid days` : ''}`, `Leave earned: ${days(entitlement.days)} days (${ruleText})`, `Leave taken: ${days(takenDays)} days`);
    }
    if (availableDays !== null) lines.push(`Leave balance: ${days(availableDays)} days`);
    lines.push(`Days paid: ${days(paidDays)}`, `${headline}: ${total}`, 'Estimate only, not legal advice.');
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

  const toggle = <T extends string>(value: T, current: T, set: (v: T) => void, label: string) => (
    <button
      key={value}
      type="button"
      aria-pressed={current === value}
      onClick={() => set(value)}
      className={`grow px-3 py-1.5 text-sm font-medium sm:grow-0 ${current === value ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-w-0">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-wrap overflow-hidden rounded-lg border border-gray-300 sm:inline-flex" role="group" aria-label="What to calculate">
          {toggle<Mode>('leave', mode, setMode, 'Leave salary for planned leave')}
          {toggle<Mode>('exit', mode, setMode, 'Unused leave at exit')}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Inputs */}
          <form className="min-w-0 space-y-5" onSubmit={(e) => e.preventDefault()} noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="leave-salary" label="Basic monthly salary (AED)" error={salaryError}>
                <input
                  id="leave-salary"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  aria-invalid={Boolean(salaryError)}
                  aria-describedby={describedBy('leave-salary', salaryError)}
                  className={inputClass(salaryError)}
                />
              </Field>
              <Field id="leave-allowances" label="Monthly allowances (AED, optional)" error={allowancesError} hint="Housing, transport and other fixed allowances.">
                <input
                  id="leave-allowances"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={allowances}
                  onChange={(e) => setAllowances(e.target.value)}
                  aria-invalid={Boolean(allowancesError)}
                  aria-describedby={describedBy('leave-allowances', allowancesError, 'hint')}
                  className={inputClass(allowancesError)}
                />
              </Field>
            </div>

            <fieldset className="min-w-0">
              <legend className="mb-1.5 block text-sm font-medium text-gray-700">Leave balance</legend>
              <div className="mb-3 flex flex-wrap overflow-hidden rounded-lg border border-gray-300 sm:inline-flex" role="group" aria-label="How to work out the leave balance">
                {toggle<Source>('dates', source, setSource, 'From my service dates')}
                {toggle<Source>('balance', source, setSource, 'I know my balance')}
              </div>
              {source === 'dates' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field id="leave-start" label="Joining date (first working day)" error={startError}>
                      <input
                        id="leave-start"
                        type="date"
                        value={start}
                        onChange={(e) => setStart(e.target.value)}
                        aria-invalid={Boolean(startError)}
                        aria-describedby={describedBy('leave-start', startError)}
                        className={inputClass(startError)}
                      />
                    </Field>
                    <Field id="leave-end" label={mode === 'exit' ? 'Last working day' : 'Calculate balance up to'} error={endError}>
                      <input
                        id="leave-end"
                        type="date"
                        value={end}
                        onChange={(e) => setEnd(e.target.value)}
                        aria-invalid={Boolean(endError)}
                        aria-describedby={describedBy('leave-end', endError)}
                        className={inputClass(endError)}
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field id="leave-taken" label="Annual leave days already taken" error={takenV.error} hint="All paid annual leave used since joining.">
                      <input
                        id="leave-taken"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.5"
                        value={taken}
                        onChange={(e) => setTaken(e.target.value)}
                        aria-invalid={Boolean(takenV.error)}
                        aria-describedby={describedBy('leave-taken', takenV.error, 'hint')}
                        className={inputClass(takenV.error)}
                      />
                    </Field>
                    <Field id="leave-unpaid" label="Unpaid leave days (optional)" error={unpaidError} hint="Unpaid leave is not counted as service.">
                      <input
                        id="leave-unpaid"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        step="1"
                        value={unpaid}
                        onChange={(e) => setUnpaid(e.target.value)}
                        aria-invalid={Boolean(unpaidError)}
                        aria-describedby={describedBy('leave-unpaid', unpaidError, 'hint')}
                        className={inputClass(unpaidError)}
                      />
                    </Field>
                  </div>
                </div>
              ) : (
                <Field id="leave-balance" label="Unused annual leave days" error={balanceV.error} hint="Your current balance, including any days carried forward.">
                  <input
                    id="leave-balance"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.5"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    aria-invalid={Boolean(balanceV.error)}
                    aria-describedby={describedBy('leave-balance', balanceV.error, 'hint')}
                    className={inputClass(balanceV.error)}
                  />
                </Field>
              )}
            </fieldset>

            {mode === 'leave' && (
              <Field id="leave-days" label="Leave days you plan to take" error={leaveV.error} hint="Annual leave is counted in calendar days, including weekends.">
                <input
                  id="leave-days"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="1"
                  value={leaveDays}
                  onChange={(e) => setLeaveDays(e.target.value)}
                  aria-invalid={Boolean(leaveV.error)}
                  aria-describedby={describedBy('leave-days', leaveV.error, 'hint')}
                  className={inputClass(leaveV.error)}
                />
              </Field>
            )}

            <details className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <summary className="cursor-pointer text-sm font-medium text-gray-800">Advanced options</summary>
              <div className="mt-3 space-y-4">
                <Field
                  id="leave-basis"
                  label={mode === 'leave' ? 'Wage paid during leave' : 'Wage used for unused leave'}
                  hint={
                    mode === 'leave'
                      ? 'Article 29 pays your wage during leave; "wage" in Article 1 includes allowances. Choose basic only if your contract says so.'
                      : 'Article 29 pays unused leave at exit on the basic wage. Choose allowances too only if your contract is more generous.'
                  }
                >
                  <select id="leave-basis" value={basis} onChange={(e) => setBasis(e.target.value as Basis)} aria-describedby="leave-basis-hint" className={inputClass()}>
                    <option value="full">Basic salary + allowances{mode === 'leave' ? ' (default)' : ''}</option>
                    <option value="basic">Basic salary only{mode === 'exit' ? ' (default)' : ''}</option>
                  </select>
                </Field>
                <Field id="leave-method" label="Daily wage method" hint="Monthly wage ÷ 30 is the common UAE practice. Some employers annualise (× 12 ÷ 365).">
                  <select id="leave-method" value={method} onChange={(e) => setMethod(e.target.value as DailyWageMethod)} aria-describedby="leave-method-hint" className={inputClass()}>
                    <option value="thirty">Monthly wage ÷ 30 (standard)</option>
                    <option value="annual">Monthly wage × 12 ÷ 365 (annualised)</option>
                  </select>
                </Field>
                {source === 'dates' && (
                  <Field id="leave-under-six" label="Service under 6 months" hint="The law gives paid leave after 6 months. Some employers still pay 2 days per month worked at exit.">
                    <select id="leave-under-six" value={underSix} onChange={(e) => setUnderSix(e.target.value as UnderSixMonths)} aria-describedby="leave-under-six-hint" className={inputClass()}>
                      <option value="none">No leave earned (statutory)</option>
                      <option value="prorata">2 days per completed month</option>
                    </select>
                  </Field>
                )}
              </div>
            </details>
          </form>

          {/* Results */}
          <div className="min-w-0" aria-live="polite">
            {!result || paidDays === null ? (
              <p className="rounded-lg bg-gray-50 p-4 text-gray-600" data-testid="leave-empty">
                Enter a valid salary and leave details to see the result.
              </p>
            ) : (
              <div className="space-y-4" data-testid="leave-result">
                <div className="rounded-xl bg-blue-50 p-4">
                  <div className="text-sm text-gray-600">
                    {headline} for {days(paidDays)} days
                  </div>
                  <div className="break-words text-3xl font-bold text-blue-800 tabular-nums" data-testid="leave-total">
                    {total}
                  </div>
                  <div className="mt-1 text-xs text-gray-600" data-testid="leave-wage-basis">
                    Based on {basisLabel[basis]}: {monthlyWage} a month
                  </div>
                </div>

                {entitlement?.rule === 'none' && (
                  <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900" data-testid="leave-not-entitled">
                    Not entitled yet: paid annual leave starts after 6 months of service. Check your contract, or change the under-6-months rule in Advanced options.
                  </p>
                )}
                {overdrawn && (
                  <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900" data-testid="leave-overdrawn">
                    You have taken {days(-(available ?? 0n))} more days than you earned, so there is no balance to pay. Your employer may treat the extra days as unpaid or deduct them.
                  </p>
                )}
                {overBalance && availableDays !== null && (
                  <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900" data-testid="leave-over-balance">
                    This is more than your balance of {days(availableDays)} days. Extra days need your employer&rsquo;s agreement and may be unpaid.
                  </p>
                )}

                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full whitespace-normal text-xs sm:text-sm" data-testid="leave-breakdown">
                    <caption className="sr-only">Leave calculation breakdown</caption>
                    <tbody className="divide-y divide-gray-100">
                      {entitlement && serviceUnits !== null && (
                        <>
                          <tr>
                            <th scope="row" className="px-2 py-2 text-left font-normal text-gray-600 sm:px-3">
                              Service{unpaidDays ? ` (after ${unpaidDays} unpaid day${unpaidDays === 1 ? '' : 's'})` : ''}
                            </th>
                            <td className="px-2 py-2 text-right sm:px-3" data-testid="leave-service">
                              {describeService(serviceUnits)}
                            </td>
                          </tr>
                          <tr>
                            <th scope="row" className="px-2 py-2 text-left font-normal text-gray-600 sm:px-3">
                              Leave earned <span className="block text-xs text-gray-500" data-testid="leave-rule">{ruleText}</span>
                            </th>
                            <td className="px-2 py-2 text-right tabular-nums sm:px-3" data-testid="leave-earned">
                              {days(entitlement.days)} days
                            </td>
                          </tr>
                          <tr>
                            <th scope="row" className="px-2 py-2 text-left font-normal text-gray-600 sm:px-3">
                              Leave taken
                            </th>
                            <td className="px-2 py-2 text-right tabular-nums sm:px-3" data-testid="leave-taken-days">
                              {days(takenDays)} days
                            </td>
                          </tr>
                        </>
                      )}
                      {availableDays !== null && (
                        <tr>
                          <th scope="row" className="px-2 py-2 text-left font-normal text-gray-600 sm:px-3">
                            Leave balance
                          </th>
                          <td className="px-2 py-2 text-right font-semibold tabular-nums sm:px-3" data-testid="leave-balance-days">
                            {days(availableDays)} days
                          </td>
                        </tr>
                      )}
                      <tr>
                        <th scope="row" className="px-2 py-2 text-left font-normal text-gray-600 sm:px-3">
                          Daily wage <span className="block text-xs text-gray-500">{dailyWageMethods[method].formula.replace('basic monthly salary', 'monthly wage')}</span>
                        </th>
                        <td className="px-2 py-2 text-right tabular-nums sm:px-3" data-testid="leave-daily-wage">
                          {dailyWage}
                        </td>
                      </tr>
                      <tr>
                        <th scope="row" className="px-2 py-2 text-left font-normal text-gray-600 sm:px-3">
                          Days paid
                        </th>
                        <td className="px-2 py-2 text-right tabular-nums sm:px-3" data-testid="leave-days-paid">
                          {days(paidDays)}
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
                  <span aria-live="polite" className="text-sm text-gray-600" data-testid="leave-notice">
                    {notice}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" data-testid="leave-disclaimer">
          <strong>Estimate only, not legal advice.</strong> This follows the mainland UAE labour law (Federal Decree-Law No. 33 of 2021 and Cabinet
          Resolution No. 1 of 2022) for private-sector employees. DIFC and ADGM have their own employment laws, and your contract, company policy
          or a MOHRE or court decision can change the amount.
        </p>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6" aria-labelledby="leave-formula-heading">
        <h2 id="leave-formula-heading" className="text-xl font-semibold text-gray-900">
          How UAE leave salary is calculated
        </h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-gray-700">
          <li>
            Leave earned (Article 29): 30 calendar days for each year of service once you complete one year, with the last part year pro-rata
            (30 × days ÷ 365). Between 6 months and 1 year: 2 days per completed month. Under 6 months: no statutory paid leave.
          </li>
          <li>Unpaid leave days are not counted as service. Balance = leave earned − paid leave already taken.</li>
          <li>
            Daily wage = monthly wage ÷ 30 (or × 12 ÷ 365). During annual leave you receive your <em>wage</em>, which the law defines as basic salary
            plus allowances. Unused leave paid out when you leave is calculated on the <em>basic</em> salary only.
          </li>
          <li>Leave salary = daily wage × leave days. Unused leave payout = daily basic wage × unused days.</li>
        </ol>
        <h3 className="mt-5 text-lg font-semibold text-gray-900">Worked example</h3>
        <p className="mt-2 text-gray-700">
          Basic salary AED 10,000 and allowances AED 5,000. A 30-day leave is paid on the full wage: 15,000 ÷ 30 × 30 = <strong>AED 15,000</strong>.
          Someone who joined on 1 January 2023, leaves on 31 December 2025 and took 75 days has earned 90 days, so 15 are unused: 10,000 ÷ 30 × 15 ={' '}
          <strong>AED 5,000</strong> on basic salary. Leaving on 30 June 2026 instead adds 30 × 181 ÷ 365 = 14.88 days, for about AED 9,958.90.
        </p>
        <h3 className="mt-5 text-lg font-semibold text-gray-900">Carrying leave forward</h3>
        <p className="mt-2 text-gray-700">
          With your employer&rsquo;s agreement you can carry forward up to half of a year&rsquo;s leave, or take a cash allowance for it at the wage
          you earned when the leave fell due (Executive Regulations). Your employer cannot stop you from using accrued leave for more than two
          years. Whatever is still unused when employment ends is paid out with your final settlement, within 14 days, together with your{' '}
          <Link to="/resources/utility-tools/uae-gratuity-calculator" className="text-blue-700 underline hover:text-blue-800">
            end-of-service gratuity
          </Link>{' '}
          and any unpaid{' '}
          <Link to="/resources/utility-tools/uae-overtime-calculator" className="text-blue-700 underline hover:text-blue-800">
            overtime
          </Link>
          .
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
