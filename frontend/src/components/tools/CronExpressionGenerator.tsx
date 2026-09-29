import { useEffect, useMemo, useState } from 'react';
import {
  DAY_NAMES,
  FIELD_SPECS,
  FIVE_FIELDS,
  MACROS,
  MONTH_NAMES,
  SIX_FIELDS,
  buildCron,
  dayRuleDiffersInN8n,
  describeCron,
  describeFieldValues,
  formatOffset,
  formatRun,
  isValidTimeZone,
  nextRuns,
  parseCron,
  scheduleTriggerNode,
  usesDayOr,
  usesDayOrInN8n,
  type BuilderMode,
  type BuilderState,
  type CronFieldName,
} from '../../utils/cron';

const btn = 'rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
const field = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500';
const card = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6';

const QUICK_ZONES = ['UTC', 'Asia/Dubai', 'Asia/Karachi'];

const PRESETS: { label: string; expression: string; use: string }[] = [
  { label: 'Every 5 minutes', expression: '*/5 * * * *', use: 'Poll an API or inbox' },
  { label: 'Every 15 min, business hours', expression: '*/15 9-17 * * 1-5', use: 'Sync CRM leads Mon–Fri' },
  { label: 'Every hour', expression: '0 * * * *', use: 'Hourly stock or price sync' },
  { label: 'Daily at 09:00', expression: '0 9 * * *', use: 'Morning sales report' },
  { label: 'Weekdays at 08:30', expression: '30 8 * * 1-5', use: 'Daily stand-up summary' },
  { label: 'Twice a day', expression: '0 9,17 * * *', use: 'Start and end of day digest' },
  { label: 'Sunday–Thursday at 09:00', expression: '0 9 * * 0-4', use: 'Sun–Thu work week (e.g. Saudi Arabia)' },
  { label: 'Every Monday at 09:00', expression: '0 9 * * 1', use: 'Weekly KPI email' },
  { label: 'Friday at 17:00', expression: '0 17 * * 5', use: 'Weekly timesheet reminder' },
  { label: '1st of the month', expression: '0 0 1 * *', use: 'Monthly invoices' },
  { label: 'Quarterly', expression: '0 0 1 1,4,7,10 *', use: 'Quarterly VAT or tax reminder' },
  { label: 'Every 10 seconds (n8n)', expression: '*/10 * * * * *', use: 'n8n 6-field seconds syntax' },
];

const DEFAULT_BUILDER: BuilderState = { mode: 'weekdays', minutes: 5, hours: 1, minuteOfHour: 0, time: '09:00', days: [1], dayOfMonth: 1, month: 1 };

function browserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function allTimeZones(extra: string[]) {
  let zones: string[] = [];
  try {
    const intl = Intl as unknown as { supportedValuesOf?: (key: string) => string[] };
    zones = intl.supportedValuesOf?.('timeZone') ?? [];
  } catch {
    zones = [];
  }
  return [...new Set([...extra, ...zones])].sort((a, b) => a.localeCompare(b));
}

function initialExpression() {
  try {
    const m = window.location.hash.match(/^#expr=(.+)$/);
    if (m) return decodeURIComponent(m[1]).slice(0, 200);
  } catch {
    // Malformed hash: fall back to the default.
  }
  return '0 9 * * 1-5';
}

export default function CronExpressionGenerator() {
  const [expression, setExpression] = useState(initialExpression);
  const [builder, setBuilder] = useState<BuilderState>(DEFAULT_BUILDER);
  const browserZone = useMemo(browserTimeZone, []);
  const [timeZone, setTimeZone] = useState(browserZone);
  const [now, setNow] = useState(() => Date.now());
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  const zones = useMemo(() => allTimeZones([browserZone, ...QUICK_ZONES]), [browserZone]);
  const parsed = useMemo(() => parseCron(expression), [expression]);
  const cron = parsed.ok ? parsed.cron : null;
  const zoneOk = isValidTimeZone(timeZone);
  const runs = useMemo(() => (cron && zoneOk ? nextRuns(cron, now, timeZone, { count: 10 }) : []), [cron, now, timeZone, zoneOk]);
  const n8nRuns = useMemo(
    () => (cron && zoneOk && dayRuleDiffersInN8n(cron) ? nextRuns(cron, now, timeZone, { count: 3, n8nDayRule: true }) : []),
    [cron, now, timeZone, zoneOk],
  );
  const tokens = expression.trim().split(/\s+/);
  const fieldNames: CronFieldName[] = cron ? (cron.hasSeconds ? SIX_FIELDS : FIVE_FIELDS) : tokens.length === 6 ? SIX_FIELDS : FIVE_FIELDS;
  const badFields = new Set(parsed.ok ? [] : parsed.errors.map((e) => e.field).filter(Boolean));
  const nodeJson = cron ? JSON.stringify(scheduleTriggerNode(expression.trim()), null, 2) : '';

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice((n) => (n === msg ? '' : n)), 2500);
  };
  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flash(`${what} copied to clipboard.`);
    } catch {
      flash('Copy failed. Select the text and press Ctrl+C.');
    }
  };

  const updateBuilder = (patch: Partial<BuilderState>) => {
    const next = { ...builder, ...patch };
    setBuilder(next);
    setExpression(buildCron(next));
  };

  const toggleDay = (d: number) => updateBuilder({ days: builder.days.includes(d) ? builder.days.filter((x) => x !== d) : [...builder.days, d] });

  return (
    <div className="space-y-6">
      {/* Expression + explanation */}
      <section aria-labelledby="cron-expr-h" className={card}>
        <h2 id="cron-expr-h" className="text-lg font-semibold text-slate-900">
          Explain a cron expression
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          5 fields (minute hour day-of-month month day-of-week), or 6 with seconds first as n8n allows. Supports <code>*</code>, lists <code>1,15</code>, ranges{' '}
          <code>1-5</code>, steps <code>*/15</code> and names like <code>MON-FRI</code> or <code>JAN</code>.
        </p>
        <label htmlFor="cron-expression" className="mt-4 mb-1.5 block text-sm font-medium text-slate-700">
          Cron expression
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="cron-expression"
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            aria-invalid={!parsed.ok}
            aria-describedby={parsed.ok ? 'cron-explanation' : 'cron-error'}
            className={`${field} min-w-0 font-mono text-base`}
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => copy(expression.trim(), 'Expression')} disabled={!cron} className={`${btn} bg-blue-700 text-white hover:bg-blue-800`}>
              Copy
            </button>
            <button
              type="button"
              onClick={() => copy(`${window.location.origin}${window.location.pathname}#expr=${encodeURIComponent(expression.trim())}`, 'Link')}
              disabled={!cron}
              className={`${btn} bg-slate-100 text-slate-800 hover:bg-slate-200`}
            >
              Copy link
            </button>
          </div>
        </div>

        <div className={`mt-3 grid gap-2 ${fieldNames.length === 6 ? 'grid-cols-3 sm:grid-cols-6' : 'grid-cols-3 sm:grid-cols-5'}`}>
          {fieldNames.map((name, i) => (
            <div
              key={name}
              data-testid={`cron-field-${name}`}
              data-invalid={badFields.has(name) ? 'true' : 'false'}
              className={`min-w-0 rounded-lg border px-2 py-1.5 text-center ${badFields.has(name) ? 'border-red-300 bg-red-50 text-red-900' : 'border-slate-200 bg-slate-50 text-slate-800'}`}
            >
              <div className="truncate font-mono text-sm">{tokens[i] ?? '–'}</div>
              <div className="truncate text-xs text-slate-500">{FIELD_SPECS[name].label}</div>
            </div>
          ))}
        </div>

        {!parsed.ok && (
          <div id="cron-error" role="alert" data-testid="cron-error" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
            <ul className="list-inside list-disc space-y-0.5">
              {parsed.errors.map((e) => (
                <li key={e.message}>{e.message}</li>
              ))}
            </ul>
          </div>
        )}

        {cron && (
          <div className="mt-4 space-y-3">
            <p id="cron-explanation" data-testid="cron-explanation" className="rounded-lg bg-blue-50 px-4 py-3 text-lg font-medium text-blue-950">
              {describeCron(cron)}
            </p>
            {usesDayOr(cron) && (
              <p data-testid="cron-or-note" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <strong>Day-of-month OR day-of-week:</strong> both day fields are restricted, so standard cron runs on any day that matches <em>either</em> field, not only
                days that match both.
              </p>
            )}
            {dayRuleDiffersInN8n(cron) && (
              <p data-testid="cron-n8n-note" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <strong>n8n reads this one differently.</strong> Standard cron treats a day field that starts with <code>*</code> as unrestricted, so it{' '}
                {usesDayOr(cron) ? 'combines the day fields with OR' : 'requires both day fields to match'}. n8n&apos;s cron library only treats a field as unrestricted when it
                covers every value, so in n8n it {usesDayOrInN8n(cron) ? 'runs when EITHER day field matches' : 'requires both day fields to match'}
                {n8nRuns.length ? ` (next in n8n: ${n8nRuns.map((d) => formatRun(d, timeZone, cron.hasSeconds)).join(', ')})` : ''}. List the days explicitly to avoid ambiguity.
              </p>
            )}
            {cron.macro && (
              <p className="text-sm text-slate-600">
                {cron.macro} is shorthand for <code>{MACROS[cron.macro].expression}</code>.{' '}
                {MACROS[cron.macro].n8n ? 'n8n accepts this shorthand.' : `n8n does not accept ${cron.macro}; paste ${MACROS[cron.macro].expression} instead.`}
              </p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[20rem] text-left text-sm" data-testid="cron-breakdown">
                <caption className="sr-only">What each field matches</caption>
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th scope="col" className="py-1.5 pr-3 font-medium">
                      Field
                    </th>
                    <th scope="col" className="py-1.5 pr-3 font-medium">
                      Value
                    </th>
                    <th scope="col" className="py-1.5 font-medium">
                      Matches
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(cron.hasSeconds ? SIX_FIELDS : FIVE_FIELDS).map((name) => (
                    <tr key={name} className="border-b border-slate-100">
                      <th scope="row" className="py-1.5 pr-3 font-medium text-slate-700">
                        {FIELD_SPECS[name].label}
                      </th>
                      <td className="py-1.5 pr-3 font-mono">{cron.fields[name].raw}</td>
                      <td className="py-1.5 break-words">{describeFieldValues(cron.fields[name])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <p aria-live="polite" className="mt-2 min-h-[1.25rem] text-sm text-slate-600">
          {notice}
        </p>
      </section>

      {/* Builder */}
      <section aria-labelledby="cron-build-h" className={card}>
        <h2 id="cron-build-h" className="text-lg font-semibold text-slate-900">
          Build a schedule
        </h2>
        <p className="mt-1 text-sm text-slate-600">Pick a schedule and the expression above updates instantly.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cron-builder-mode" className="mb-1.5 block text-sm font-medium text-slate-700">
              Run
            </label>
            <select id="cron-builder-mode" value={builder.mode} onChange={(e) => updateBuilder({ mode: e.target.value as BuilderMode })} className={field}>
              <option value="minutes">Every N minutes</option>
              <option value="hours">Every N hours</option>
              <option value="daily">Every day at a time</option>
              <option value="weekdays">Weekdays (Mon–Fri) at a time</option>
              <option value="weekly">On chosen days of the week</option>
              <option value="monthly">Monthly on a day</option>
              <option value="yearly">Once a year</option>
            </select>
          </div>

          {builder.mode === 'minutes' && (
            <div>
              <label htmlFor="cron-builder-minutes" className="mb-1.5 block text-sm font-medium text-slate-700">
                Every … minutes
              </label>
              <select id="cron-builder-minutes" value={builder.minutes} onChange={(e) => updateBuilder({ minutes: Number(e.target.value) })} className={field}>
                {[1, 2, 5, 10, 15, 20, 30].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          )}

          {builder.mode === 'hours' && (
            <>
              <div>
                <label htmlFor="cron-builder-hours" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Every … hours
                </label>
                <select id="cron-builder-hours" value={builder.hours} onChange={(e) => updateBuilder({ hours: Number(e.target.value) })} className={field}>
                  {[1, 2, 3, 4, 6, 8, 12].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="cron-builder-minute" className="mb-1.5 block text-sm font-medium text-slate-700">
                  At minute
                </label>
                <select id="cron-builder-minute" value={builder.minuteOfHour} onChange={(e) => updateBuilder({ minuteOfHour: Number(e.target.value) })} className={field}>
                  {[0, 5, 10, 15, 20, 30, 45].map((n) => (
                    <option key={n} value={n}>
                      :{String(n).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {['daily', 'weekdays', 'weekly', 'monthly', 'yearly'].includes(builder.mode) && (
            <div>
              <label htmlFor="cron-builder-time" className="mb-1.5 block text-sm font-medium text-slate-700">
                At time
              </label>
              <input id="cron-builder-time" type="time" value={builder.time} onChange={(e) => updateBuilder({ time: e.target.value })} className={field} />
            </div>
          )}

          {(builder.mode === 'monthly' || builder.mode === 'yearly') && (
            <div>
              <label htmlFor="cron-builder-dom" className="mb-1.5 block text-sm font-medium text-slate-700">
                Day of month
              </label>
              <select id="cron-builder-dom" value={builder.dayOfMonth} onChange={(e) => updateBuilder({ dayOfMonth: Number(e.target.value) })} className={field}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              {builder.dayOfMonth > 28 && <p className="mt-1 text-xs text-amber-800">Months without day {builder.dayOfMonth} are skipped, as in all cron implementations.</p>}
            </div>
          )}

          {builder.mode === 'yearly' && (
            <div>
              <label htmlFor="cron-builder-month" className="mb-1.5 block text-sm font-medium text-slate-700">
                Month
              </label>
              <select id="cron-builder-month" value={builder.month} onChange={(e) => updateBuilder({ month: Number(e.target.value) })} className={field}>
                {MONTH_NAMES.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}

          {builder.mode === 'weekly' && (
            <fieldset className="sm:col-span-2">
              <legend className="mb-1.5 text-sm font-medium text-slate-700">Days</legend>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                  <label key={d} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm">
                    <input type="checkbox" checked={builder.days.includes(d)} onChange={() => toggleDay(d)} className="h-4 w-4 rounded border-slate-300" />
                    {DAY_NAMES[d].slice(0, 3)}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </div>
      </section>

      {/* Next runs */}
      <section aria-labelledby="cron-next-h" className={card}>
        <h2 id="cron-next-h" className="text-lg font-semibold text-slate-900">
          Next 10 run times
        </h2>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1 basis-56">
            <label htmlFor="cron-timezone" className="mb-1.5 block text-sm font-medium text-slate-700">
              Time zone
            </label>
            <select id="cron-timezone" value={timeZone} onChange={(e) => setTimeZone(e.target.value)} className={field}>
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z}
                  {z === browserZone ? ' (your browser)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Quick time zones">
            {[`browser:${browserZone}`, ...QUICK_ZONES].map((key) => {
              const z = key.replace(/^browser:/, '');
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={timeZone === z}
                  onClick={() => setTimeZone(z)}
                  className={`${btn} px-3 py-1.5 text-xs ${timeZone === z ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}
                >
                  {key.startsWith('browser:') ? `Browser: ${z}` : z}
                </button>
              );
            })}
          </div>
        </div>
        {cron && runs.length > 0 && (
          <ol data-testid="cron-next-runs" className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200 text-sm">
            {runs.map((d) => (
              <li key={d.getTime()} className="flex flex-wrap items-baseline justify-between gap-x-3 px-3 py-1.5">
                <time dateTime={d.toISOString()} className="font-mono text-slate-900">
                  {formatRun(d, timeZone, cron.hasSeconds)}
                </time>
                <span className="text-xs text-slate-500">{formatOffset(d, timeZone)}</span>
              </li>
            ))}
          </ol>
        )}
        {cron && runs.length === 0 && (
          <p data-testid="cron-never" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
            This schedule never runs in the next 10 years (for example, 30 February does not exist).
          </p>
        )}
        {!cron && <p className="mt-4 text-sm text-slate-500">Fix the expression to see the next run times.</p>}
        <p className="mt-2 text-xs text-slate-500">
          Calculated in your browser from the current time. Local times skipped by a daylight-saving change are not listed; a repeated hour runs once.
        </p>
      </section>

      {/* Presets */}
      <section aria-labelledby="cron-presets-h" className={card}>
        <h2 id="cron-presets-h" className="text-lg font-semibold text-slate-900">
          Common business schedules
        </h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PRESETS.map((p) => (
            <li key={p.expression}>
              <button
                type="button"
                data-testid="cron-preset"
                onClick={() => setExpression(p.expression)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <span className="block text-sm font-medium text-slate-900">{p.label}</span>
                <code className="block text-sm text-blue-800">{p.expression}</code>
                <span className="block text-xs text-slate-500">{p.use}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* n8n */}
      <section aria-labelledby="cron-n8n-h" className={card} data-testid="cron-n8n">
        <h2 id="cron-n8n-h" className="text-lg font-semibold text-slate-900">
          Use this cron expression in n8n
        </h2>
        <ol className="mt-3 list-inside list-decimal space-y-1.5 text-sm text-slate-700">
          <li>
            Add a <strong>Schedule Trigger</strong> node and set <strong>Trigger Interval</strong> to <strong>Custom (Cron)</strong>.
          </li>
          <li>
            Paste the expression into <strong>Expression</strong>. n8n accepts 5 fields, or 6 with an optional seconds field first (for example{' '}
            <code>*/10 * * * * *</code> for every 10 seconds).
          </li>
          <li>
            Check the time zone: the node uses the <strong>workflow time zone</strong> (workflow <em>Settings → Timezone</em>) and, if that is not set, the instance time
            zone. Self-hosted instances set it with the <code>GENERIC_TIMEZONE</code> environment variable (default <code>America/New_York</code>); n8n Cloud sets it in the
            admin dashboard.
          </li>
          <li>Publish the workflow. Schedule changes only take effect after you publish again.</li>
        </ol>
        <h3 className="mt-4 text-base font-semibold text-slate-900">Or paste a ready-made node</h3>
        <p className="mt-1 text-sm text-slate-600">Copy this and press Ctrl+V (Cmd+V) on the n8n canvas to add a Schedule Trigger with the expression filled in.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" disabled={!cron} onClick={() => copy(nodeJson, 'n8n node')} className={`${btn} bg-blue-700 text-white hover:bg-blue-800`}>
            Copy n8n Schedule Trigger node
          </button>
        </div>
        {cron && (
          <pre data-testid="cron-n8n-node" className="mt-3 max-h-64 overflow-auto rounded-lg bg-slate-900 p-3 font-mono text-xs text-slate-100">
            {nodeJson}
          </pre>
        )}
        <p className="mt-3 text-xs text-slate-500">
          Sources:{' '}
          <a className="text-blue-700 underline" href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger/" target="_blank" rel="noopener noreferrer">
            n8n Schedule Trigger docs
          </a>
          ,{' '}
          <a
            className="text-blue-700 underline"
            href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger/common-issues/"
            target="_blank"
            rel="noopener noreferrer"
          >
            common issues (time zones)
          </a>
          ,{' '}
          <a className="text-blue-700 underline" href="https://docs.n8n.io/hosting/configuration/configuration-examples/time-zone/" target="_blank" rel="noopener noreferrer">
            set the self-hosted time zone
          </a>
          .
        </p>
      </section>
    </div>
  );
}
