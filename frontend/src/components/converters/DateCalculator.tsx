import { useId, useState, type ReactNode } from 'react';
import { CopyButton } from './UnitConverter';

// All arithmetic uses calendar dates in UTC (no time of day), so results never shift
// by a day because of the visitor's time zone or a daylight saving change.

type Mode = 'difference' | 'add' | 'age';
type Ymd = { y: number; m: number; d: number };

const DAY = 86_400_000;

function parseYmd(value: string): Ymd | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const ymd = { y: +match[1], m: +match[2], d: +match[3] };
  if (ymd.y < 1 || ymd.m < 1 || ymd.m > 12 || ymd.d < 1 || ymd.d > monthLength(ymd.y, ymd.m)) return null;
  return ymd;
}

const toMs = (v: Ymd) => {
  const date = new Date(Date.UTC(2000, v.m - 1, v.d));
  date.setUTCFullYear(v.y); // Date.UTC maps years 0-99 to 1900-1999; set the year explicitly.
  return date.getTime();
};
const fromMs = (ms: number): Ymd => {
  const date = new Date(ms);
  return { y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate() };
};
function monthLength(y: number, m: number) {
  if (m === 2) return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28;
  return [4, 6, 9, 11].includes(m) ? 30 : 31;
}

/** Adds calendar months, clamping to the last day of the target month (Jan 31 + 1 month = Feb 28/29). */
function addMonths(v: Ymd, months: number): Ymd {
  const total = v.y * 12 + (v.m - 1) + months;
  const y = Math.floor(total / 12);
  const m = total - y * 12 + 1;
  return { y, m, d: Math.min(v.d, monthLength(y, m)) };
}
const addDays = (v: Ymd, days: number) => fromMs(toMs(v) + days * DAY);
const diffDays = (a: Ymd, b: Ymd) => Math.round((toMs(b) - toMs(a)) / DAY);

/** Calendar difference a → b (a <= b) as years, months, days. */
function calendarDiff(a: Ymd, b: Ymd) {
  let months = (b.y - a.y) * 12 + (b.m - a.m);
  if (diffDays(addMonths(a, months), b) < 0) months -= 1;
  const days = diffDays(addMonths(a, months), b);
  return { years: Math.floor(months / 12), months: months % 12, days };
}

/** Monday–Friday count in [a, b). */
function weekdaysBetween(a: Ymd, b: Ymd) {
  const total = diffDays(a, b);
  const fullWeeks = Math.floor(total / 7);
  let count = fullWeeks * 5;
  const startDow = new Date(toMs(a)).getUTCDay();
  for (let i = 0; i < total % 7; i += 1) {
    const dow = (startDow + i) % 7;
    if (dow !== 0 && dow !== 6) count += 1;
  }
  return count;
}

const plural = (n: number, word: string) => `${n.toLocaleString('en-US')} ${word}${n === 1 ? '' : 's'}`;
const longDate = (v: Ymd) => new Date(toMs(v)).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
const ymdString = (v: Ymd) => `${String(v.y).padStart(4, '0')}-${String(v.m).padStart(2, '0')}-${String(v.d).padStart(2, '0')}`;
const describe = ({ years, months, days }: { years: number; months: number; days: number }) =>
  [years && plural(years, 'year'), months && plural(months, 'month'), (days || (!years && !months)) && plural(days, 'day')].filter(Boolean).join(', ');

function todayLocal(): string {
  const now = new Date();
  return ymdString({ y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() });
}

const inputClass =
  'w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-3 text-base focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500';

function Field({ id, label, children }: { id: string; label: string; children: (id: string) => ReactNode }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children(id)}
    </div>
  );
}

function ResultBox({ title, lines, copy }: { title: string; lines: { label: string; value: string; testId?: string }[]; copy: string }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 sm:p-5" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-blue-700">Result</p>
          <p className="break-words text-2xl font-semibold text-blue-950" data-testid="date-result">
            {title}
          </p>
        </div>
        <CopyButton text={copy} label="Copy" />
      </div>
      {lines.length > 0 && (
        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          {lines.map((line) => (
            <div key={line.label} className="flex justify-between gap-3 border-t border-blue-100 py-1.5">
              <dt className="text-blue-800">{line.label}</dt>
              <dd className="text-right font-medium text-blue-950" data-testid={line.testId}>
                {line.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

const Message = ({ children, error = false }: { children: ReactNode; error?: boolean }) => (
  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4" aria-live="polite">
    <p className={error ? 'text-sm font-medium text-red-700' : 'text-sm text-gray-700'} data-testid={error ? 'date-error' : undefined}>
      {children}
    </p>
  </div>
);

export default function DateCalculator() {
  const id = useId();
  const [mode, setMode] = useState<Mode>('difference');
  const today = todayLocal();

  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(ymdString(addMonths(parseYmd(today)!, 1)));
  const [includeEnd, setIncludeEnd] = useState(false);

  const [base, setBase] = useState(today);
  const [operation, setOperation] = useState<'add' | 'subtract'>('add');
  const [amounts, setAmounts] = useState({ years: '0', months: '0', weeks: '0', days: '30' });

  const [birth, setBirth] = useState('');
  const [ageOn, setAgeOn] = useState(today);

  const modes: { id: Mode; label: string }[] = [
    { id: 'difference', label: 'Days between dates' },
    { id: 'add', label: 'Add or subtract' },
    { id: 'age', label: 'Age calculator' },
  ];

  let output: ReactNode = null;
  if (mode === 'difference') {
    const a = parseYmd(start);
    const b = parseYmd(end);
    if (!a || !b) output = <Message>Choose a start date and an end date.</Message>;
    else {
      const reversed = diffDays(a, b) < 0;
      const [s, e0] = reversed ? [b, a] : [a, b];
      const e = includeEnd ? addDays(e0, 1) : e0;
      const total = diffDays(s, e);
      const cal = calendarDiff(s, e);
      output = (
        <ResultBox
          title={plural(total, 'day')}
          copy={`${plural(total, 'day')} (${describe(cal)}) from ${longDate(a)} to ${longDate(b)}${includeEnd ? ', end date included' : ''}`}
          lines={[
            { label: 'Years, months, days', value: describe(cal), testId: 'date-ymd' },
            { label: 'Weeks and days', value: `${plural(Math.floor(total / 7), 'week')}, ${plural(total % 7, 'day')}`, testId: 'date-weeks' },
            { label: 'Weekdays (Mon–Fri)', value: plural(weekdaysBetween(s, e), 'day'), testId: 'date-weekdays' },
            { label: 'Hours', value: (total * 24).toLocaleString('en-US') },
            ...(reversed ? [{ label: 'Note', value: 'End date is before start date' }] : []),
          ]}
        />
      );
    }
  } else if (mode === 'add') {
    const a = parseYmd(base);
    const nums = Object.fromEntries(Object.entries(amounts).map(([k, v]) => [k, v.trim() === '' ? 0 : Number(v)])) as Record<keyof typeof amounts, number>;
    const invalid = Object.values(nums).some((n) => !Number.isInteger(n) || Math.abs(n) > 100_000);
    if (!a) output = <Message>Choose a start date.</Message>;
    else if (invalid) output = <Message error>Use whole numbers only (for example 3 or 45).</Message>;
    else {
      const sign = operation === 'add' ? 1 : -1;
      const afterMonths = addMonths(a, sign * (nums.years * 12 + nums.months));
      const result = addDays(afterMonths, sign * (nums.weeks * 7 + nums.days));
      if (result.y < 1 || result.y > 9999) output = <Message error>The result is outside the supported range (years 1–9999).</Message>;
      else {
        const clamped = afterMonths.d !== a.d && (nums.years || nums.months);
        output = (
          <ResultBox
            title={longDate(result)}
            copy={`${longDate(a)} ${operation === 'add' ? '+' : '−'} ${describe({ years: nums.years, months: nums.months, days: 0 }) || ''}${nums.weeks ? ` ${plural(nums.weeks, 'week')}` : ''}${nums.days ? ` ${plural(nums.days, 'day')}` : ''} = ${longDate(result)}`.replace(/\s+/g, ' ')}
            lines={[
              { label: 'ISO date', value: ymdString(result), testId: 'date-iso' },
              { label: 'Days from start date', value: plural(diffDays(a, result), 'day') },
              ...(clamped ? [{ label: 'Note', value: 'Day adjusted to the last day of the month' }] : []),
            ]}
          />
        );
      }
    }
  } else {
    const b = parseYmd(birth);
    const on = parseYmd(ageOn);
    if (!b || !on) output = <Message>Enter a date of birth to calculate age.</Message>;
    else if (diffDays(b, on) < 0) output = <Message error>The date of birth is after the “age on” date.</Message>;
    else {
      const cal = calendarDiff(b, on);
      const total = diffDays(b, on);
      let next = addMonths(b, (cal.years + 1) * 12);
      if (cal.months === 0 && cal.days === 0) next = on;
      const toNext = diffDays(on, next);
      output = (
        <ResultBox
          title={plural(cal.years, 'year')}
          copy={`Age on ${longDate(on)}: ${describe(cal)}`}
          lines={[
            { label: 'Exact age', value: describe(cal), testId: 'age-exact' },
            { label: 'Total months', value: plural(cal.years * 12 + cal.months, 'month') },
            { label: 'Total weeks', value: plural(Math.floor(total / 7), 'week') },
            { label: 'Total days', value: plural(total, 'day'), testId: 'age-days' },
            { label: 'Next birthday', value: toNext === 0 ? 'Today – happy birthday!' : `${longDate(next)} (in ${plural(toNext, 'day')})`, testId: 'age-next' },
          ]}
        />
      );
    }
  }

  const tabClass = (active: boolean) =>
    `rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      active ? 'bg-blue-600 text-white' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
    }`;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Calculation">
        {modes.map((m) => (
          <button key={m.id} type="button" aria-pressed={mode === m.id} onClick={() => setMode(m.id)} className={tabClass(mode === m.id)}>
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'difference' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field id={`${id}-start`} label="Start date">
              {(fid) => <input id={fid} type="date" value={start} onChange={(e) => setStart(e.target.value)} className={inputClass} />}
            </Field>
            <Field id={`${id}-end`} label="End date">
              {(fid) => <input id={fid} type="date" value={end} onChange={(e) => setEnd(e.target.value)} className={inputClass} />}
            </Field>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={includeEnd} onChange={(e) => setIncludeEnd(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
            Include end date (add 1 day)
          </label>
        </div>
      )}

      {mode === 'add' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field id={`${id}-base`} label="Start date">
              {(fid) => <input id={fid} type="date" value={base} onChange={(e) => setBase(e.target.value)} className={inputClass} />}
            </Field>
            <Field id={`${id}-op`} label="Operation">
              {(fid) => (
                <select id={fid} value={operation} onChange={(e) => setOperation(e.target.value as 'add' | 'subtract')} className={inputClass}>
                  <option value="add">Add (+)</option>
                  <option value="subtract">Subtract (−)</option>
                </select>
              )}
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(['years', 'months', 'weeks', 'days'] as const).map((key) => (
              <Field key={key} id={`${id}-${key}`} label={key[0].toUpperCase() + key.slice(1)}>
                {(fid) => (
                  <input
                    id={fid}
                    type="number"
                    inputMode="numeric"
                    step={1}
                    min={0}
                    value={amounts[key]}
                    onChange={(e) => setAmounts((prev) => ({ ...prev, [key]: e.target.value }))}
                    className={inputClass}
                  />
                )}
              </Field>
            ))}
          </div>
        </div>
      )}

      {mode === 'age' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field id={`${id}-birth`} label="Date of birth">
            {(fid) => <input id={fid} type="date" value={birth} onChange={(e) => setBirth(e.target.value)} className={inputClass} />}
          </Field>
          <Field id={`${id}-on`} label="Age on date">
            {(fid) => <input id={fid} type="date" value={ageOn} onChange={(e) => setAgeOn(e.target.value)} className={inputClass} />}
          </Field>
        </div>
      )}

      {output}

      <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
        Leap years are handled automatically. The end date is not counted unless you tick “Include end date”. Adding months keeps the day of the month
        and moves to the month’s last day when needed (31 January + 1 month = 28 or 29 February). Weekday counts exclude Saturdays and Sundays but not
        public holidays.
      </p>
    </div>
  );
}
