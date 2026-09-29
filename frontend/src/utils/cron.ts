// Cron expression parser, explainer and next-run iterator (no dependencies).
//
// Syntax: standard 5-field cron (minute hour day-of-month month day-of-week) plus the optional
// leading seconds field that n8n's Schedule Trigger accepts ("([Second]) [Minute] [Hour] ...").
// Supports *, lists, ranges, steps (*/n, a-b/n, a/n), 3-letter month/day names, 7 = Sunday and
// the @yearly/@monthly/@weekly/@daily/@hourly macros.
//
// Day matching follows standard (Vixie/POSIX) cron: when day-of-month AND day-of-week are both
// restricted, a day matches if EITHER field matches. A field counts as unrestricted when it
// starts with "*". n8n's cron library (kelektiv/node-cron) instead treats a field as
// unrestricted only when it covers every value, so "*/2" in one day field changes the result;
// `dayRuleDiffersInN8n` flags those expressions.

export type CronFieldName = 'second' | 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek';

interface FieldSpec {
  name: CronFieldName;
  label: string;
  min: number;
  max: number;
  aliases?: Record<string, number>;
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const FIELD_SPECS: Record<CronFieldName, FieldSpec> = {
  second: { name: 'second', label: 'Second', min: 0, max: 59 },
  minute: { name: 'minute', label: 'Minute', min: 0, max: 59 },
  hour: { name: 'hour', label: 'Hour', min: 0, max: 23 },
  dayOfMonth: { name: 'dayOfMonth', label: 'Day of month', min: 1, max: 31 },
  month: { name: 'month', label: 'Month', min: 1, max: 12, aliases: Object.fromEntries(MONTHS.map((m, i) => [m, i + 1])) },
  // 0-7: both 0 and 7 are Sunday.
  dayOfWeek: { name: 'dayOfWeek', label: 'Day of week', min: 0, max: 7, aliases: Object.fromEntries(DAYS.map((d, i) => [d, i])) },
};

export const FIVE_FIELDS: CronFieldName[] = ['minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'];
export const SIX_FIELDS: CronFieldName[] = ['second', ...FIVE_FIELDS];

/** Macros accepted here. n8n's cron library accepts the ones marked n8n: true. */
export const MACROS: Record<string, { expression: string; n8n: boolean }> = {
  '@yearly': { expression: '0 0 1 1 *', n8n: true },
  '@annually': { expression: '0 0 1 1 *', n8n: false },
  '@monthly': { expression: '0 0 1 * *', n8n: true },
  '@weekly': { expression: '0 0 * * 0', n8n: true },
  '@daily': { expression: '0 0 * * *', n8n: true },
  '@midnight': { expression: '0 0 * * *', n8n: false },
  '@hourly': { expression: '0 * * * *', n8n: true },
};

/** One comma-separated item of a field. */
export interface CronPart {
  kind: 'all' | 'value' | 'range';
  start: number;
  end: number;
  step: number;
  /** "a/n" form: from a to the field maximum. */
  open: boolean;
}

export interface CronField {
  name: CronFieldName;
  raw: string;
  parts: CronPart[];
  /** Sorted matching values (day of week 7 folded into 0). */
  values: number[];
  set: Set<number>;
  /** Field text starts with "*" (standard cron's "unrestricted" test for the day fields). */
  star: boolean;
  /** Field covers every possible value. */
  full: boolean;
}

export interface ParsedCron {
  /** The expression as entered (macro expanded). */
  expression: string;
  macro?: string;
  hasSeconds: boolean;
  fields: Record<CronFieldName, CronField>;
}

export interface CronIssue {
  field?: CronFieldName;
  message: string;
}

export type CronParseResult = { ok: true; cron: ParsedCron } | { ok: false; errors: CronIssue[] };

function parseNumber(token: string, spec: FieldSpec): number {
  if (/^\d+$/.test(token)) {
    const n = Number(token);
    if (n < spec.min || n > spec.max) throw new Error(`${n} is out of range (${spec.min}–${spec.max}${spec.name === 'dayOfWeek' ? ', 0 and 7 are Sunday' : ''})`);
    return n;
  }
  const alias = spec.aliases?.[token.toLowerCase()];
  if (alias !== undefined) return alias;
  if (/^[a-z]+$/i.test(token)) {
    if (!spec.aliases) throw new Error(`"${token}" is not a number`);
    const names = spec.name === 'month' ? 'JAN–DEC' : 'SUN–SAT';
    throw new Error(`unknown name "${token}" (use 3-letter names ${names})`);
  }
  throw new Error(`"${token}" is not a valid value`);
}

function parseField(raw: string, spec: FieldSpec): CronField {
  if (raw === '') throw new Error('is empty');
  if (raw.includes('?')) throw new Error('"?" is Quartz syntax; standard cron and n8n use "*"');
  if (/#/.test(raw)) throw new Error('"#" (nth weekday) is Quartz syntax and is not supported by standard cron or n8n');
  if (/^(L|LW|\d+W|\d*L)$/i.test(raw)) throw new Error(`"${raw}" (last/nearest weekday) is Quartz syntax and is not supported by standard cron or n8n`);

  const parts: CronPart[] = [];
  const values = new Set<number>();
  for (const item of raw.split(',')) {
    if (item === '') throw new Error('has an empty list item (check the commas)');
    const [base, stepText, extra] = item.split('/');
    if (extra !== undefined) throw new Error(`"${item}" has more than one "/"`);
    let step = 1;
    if (stepText !== undefined) {
      if (!/^\d+$/.test(stepText)) throw new Error(`step "${stepText}" in "${item}" must be a whole number`);
      step = Number(stepText);
      if (step < 1) throw new Error(`step in "${item}" must be at least 1`);
    }
    let part: CronPart;
    if (base === '*') {
      part = { kind: 'all', start: spec.min, end: spec.name === 'dayOfWeek' ? 6 : spec.max, step, open: false };
    } else if (base.includes('-')) {
      const [a, b, more] = base.split('-');
      if (more !== undefined || a === '' || b === '') throw new Error(`"${item}" is not a valid range`);
      const start = parseNumber(a, spec);
      const end = parseNumber(b, spec);
      if (start > end) throw new Error(`range "${base}" goes backwards; write the smaller value first`);
      part = { kind: 'range', start, end, step, open: false };
    } else {
      const start = parseNumber(base, spec);
      const open = stepText !== undefined;
      part = { kind: open ? 'range' : 'value', start, end: open ? (spec.name === 'dayOfWeek' ? 7 : spec.max) : start, step, open };
    }
    parts.push(part);
    for (let v = part.start; v <= part.end; v += part.step) values.add(spec.name === 'dayOfWeek' && v === 7 ? 0 : v);
  }
  const sorted = [...values].sort((x, y) => x - y);
  const size = spec.name === 'dayOfWeek' ? 7 : spec.max - spec.min + 1;
  return { name: spec.name, raw, parts, values: sorted, set: new Set(sorted), star: raw.startsWith('*'), full: sorted.length === size };
}

/** Parses a cron expression, collecting an error per invalid field. */
export function parseCron(input: string): CronParseResult {
  let expression = input.trim().replace(/\s+/g, ' ');
  if (!expression) return { ok: false, errors: [{ message: 'Enter a cron expression, for example 0 9 * * 1-5.' }] };
  let macro: string | undefined;
  if (expression.startsWith('@')) {
    const key = expression.toLowerCase();
    if (key === '@reboot') return { ok: false, errors: [{ message: '@reboot runs once when the cron daemon starts; it is not a time schedule and n8n does not support it.' }] };
    if (!MACROS[key]) return { ok: false, errors: [{ message: `Unknown macro "${expression}". Use @yearly, @monthly, @weekly, @daily or @hourly.` }] };
    macro = key;
    expression = MACROS[key].expression;
  }
  const tokens = expression.split(' ');
  if (tokens.length < 5) return { ok: false, errors: [{ message: `Too few fields: found ${tokens.length}, expected 5 (minute hour day-of-month month day-of-week) or 6 with seconds first.` }] };
  if (tokens.length > 6) {
    return {
      ok: false,
      errors: [{ message: `Too many fields: found ${tokens.length}, expected 5 or 6. A 7th "year" field is Quartz syntax and is not supported by standard cron or n8n.` }],
    };
  }
  const hasSeconds = tokens.length === 6;
  const names = hasSeconds ? SIX_FIELDS : FIVE_FIELDS;
  const fields = {} as Record<CronFieldName, CronField>;
  const errors: CronIssue[] = [];
  names.forEach((name, i) => {
    try {
      fields[name] = parseField(tokens[i], FIELD_SPECS[name]);
    } catch (e) {
      errors.push({ field: name, message: `${FIELD_SPECS[name].label} "${tokens[i]}": ${(e as Error).message}.` });
    }
  });
  if (errors.length) return { ok: false, errors };
  if (!hasSeconds) fields.second = parseField('0', FIELD_SPECS.second);
  return { ok: true, cron: { expression: macro ? input.trim() : expression, macro, hasSeconds, fields } };
}

// ---------------------------------------------------------------------------------------------
// Plain-English explanation

const pad = (n: number) => String(n).padStart(2, '0');

export function ordinal(n: number) {
  const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${s}`;
}

export function joinList(items: string[], conj = 'and') {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${conj} ${items[items.length - 1]}`;
}

const isSingle = (f: CronField) => f.parts.length === 1 && f.parts[0].kind === 'value';
const isAll = (f: CronField) => f.raw === '*';
const allSingles = (f: CronField) => f.parts.every((p) => p.kind === 'value');

function unitPhrase(f: CronField, unit: string, units: string): string {
  const p = f.parts;
  if (isAll(f)) return `every ${unit}`;
  if (allSingles(f)) return p.length === 1 ? `at ${unit} ${p[0].start}` : `at ${units} ${joinList(p.map((x) => String(x.start)))}`;
  const pieces = p.map((x) => {
    if (x.kind === 'value') return `${unit} ${x.start}`;
    if (x.kind === 'all') return x.step === 1 ? `every ${unit}` : `every ${x.step} ${units}`;
    if (x.open) return `every ${x.step} ${units} starting at ${unit} ${x.start}`;
    return x.step === 1 ? `every ${unit} from ${x.start} through ${x.end}` : `every ${x.step} ${units} from ${unit} ${x.start} through ${x.end}`;
  });
  return (p.length > 1 && p[0].kind === 'value' ? 'at ' : '') + joinList(pieces);
}

/** Hour phrase; `at` is the fixed minute (":MM") when the minute field is a single value. */
function hourPhrase(f: CronField, at?: string): string {
  if (isAll(f)) return '';
  const t = (h: number) => `${pad(h)}:${at ?? '00'}`;
  return joinList(
    f.parts.map((x) => {
      if (x.kind === 'value') return at ? `at ${t(x.start)}` : `during the ${pad(x.start)}:00 hour`;
      if (x.kind === 'all') return x.step === 1 ? 'every hour' : at ? `at minute ${Number(at)} past every ${ordinal(x.step)} hour` : `past every ${ordinal(x.step)} hour`;
      if (x.open) return `every ${ordinal(x.step)} hour from ${t(x.start)}`;
      if (x.step !== 1) return `every ${ordinal(x.step)} hour from ${t(x.start)} through ${t(x.end)}`;
      return at ? `every hour from ${t(x.start)} through ${t(x.end)}` : `between ${pad(x.start)}:00 and ${pad(x.end)}:59`;
    }),
  );
}

function timePhrase(c: ParsedCron): string {
  const { second, minute, hour } = c.fields;
  const secSingle = isSingle(second);
  const sec = second.values[0];

  // Fixed clock times: "At 09:30" / "At 09:00 and 17:00" / "At 00:00, 06:00, 12:00 and 18:00".
  if (secSingle && isSingle(minute) && hour.values.length <= 6 && !isAll(hour)) {
    return `at ${joinList(hour.values.map((h) => `${pad(h)}:${pad(minute.values[0])}${sec ? `:${pad(sec)}` : ''}`))}`;
  }
  // Single minute with a repeating hour: "Every hour from 09:00 through 17:00", "At minute 5 past every hour".
  if (secSingle && !sec && isSingle(minute)) {
    const m = minute.values[0];
    if (isAll(hour)) return `at minute ${m} past every hour`;
    return hourPhrase(hour, pad(m));
  }
  const bits: string[] = [];
  if (!secSingle) bits.push(unitPhrase(second, 'second', 'seconds'));
  else if (sec) bits.push(`at second ${sec}`);
  if (!(isAll(minute) && !secSingle)) bits.push(unitPhrase(minute, 'minute', 'minutes') + (isSingle(minute) && isAll(hour) ? ' past every hour' : ''));
  const h = hourPhrase(hour);
  if (h) bits.push(h);
  return bits.join(', ');
}

function dayOfMonthPhrase(f: CronField): string {
  return joinList(
    f.parts.map((x) => {
      if (x.kind === 'value') return `the ${ordinal(x.start)}`;
      if (x.kind === 'all') return `every ${x.step === 2 ? 'other' : ordinal(x.step)} day of the month (${f.values.slice(0, 3).map(ordinal).join(', ')}, …)`;
      if (x.open) return `every ${ordinal(x.step)} day from the ${ordinal(x.start)}`;
      return x.step === 1 ? `the ${ordinal(x.start)} through the ${ordinal(x.end)}` : `every ${ordinal(x.step)} day from the ${ordinal(x.start)} through the ${ordinal(x.end)}`;
    }),
  ) + (f.parts.every((x) => x.kind !== 'all') ? ' of the month' : '');
}

function namedPhrase(f: CronField, names: string[]): string {
  const p = f.parts;
  if (p.length === 1 && p[0].kind === 'range' && p[0].step === 1 && !p[0].open) {
    const end = f.name === 'dayOfWeek' && p[0].end === 7 ? 0 : p[0].end;
    return `${names[f.name === 'month' ? p[0].start - 1 : p[0].start]} through ${names[f.name === 'month' ? end - 1 : end]}`;
  }
  return joinList(f.values.map((v) => names[f.name === 'month' ? v - 1 : v]));
}

/** Whether day-of-month and day-of-week combine with OR (standard cron rule). */
export function usesDayOr(c: ParsedCron) {
  return !c.fields.dayOfMonth.star && !c.fields.dayOfWeek.star;
}

/** n8n's cron library decides OR vs AND by whether each field covers every value. */
export function usesDayOrInN8n(c: ParsedCron) {
  return !c.fields.dayOfMonth.full && !c.fields.dayOfWeek.full;
}

export function dayRuleDiffersInN8n(c: ParsedCron) {
  return usesDayOr(c) !== usesDayOrInN8n(c);
}

/** Plain-English description, e.g. "At 09:00 on Monday through Friday." */
export function describeCron(c: ParsedCron): string {
  const { dayOfMonth, month, dayOfWeek } = c.fields;
  let text = timePhrase(c);
  const dom = isAll(dayOfMonth) ? '' : dayOfMonthPhrase(dayOfMonth);
  const dow = isAll(dayOfWeek) ? '' : namedPhrase(dayOfWeek, DAY_NAMES);
  if (dom && dow) {
    text += usesDayOr(c) ? ` on ${dom} or on ${dow}` : ` on ${dom}, only if it is a ${dow}`;
  } else if (dom) text += ` on ${dom}`;
  else if (dow) text += ` on ${dow}`;
  if (!isAll(month)) text += ` in ${namedPhrase(month, MONTH_NAMES)}`;
  return text.charAt(0).toUpperCase() + text.slice(1) + '.';
}

/** Human-readable list of values for the field breakdown table. */
export function describeFieldValues(f: CronField): string {
  if (f.full && f.star) return 'any';
  if (f.name === 'month') return f.values.map((v) => MONTH_NAMES[v - 1].slice(0, 3)).join(', ');
  if (f.name === 'dayOfWeek') return f.values.map((v) => DAY_NAMES[v].slice(0, 3)).join(', ');
  return f.values.join(', ');
}

// ---------------------------------------------------------------------------------------------
// Next run times in an IANA time zone (Intl only)

const formatters = new Map<string, Intl.DateTimeFormat>();
function formatterFor(timeZone: string) {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    formatters.set(timeZone, f);
  }
  return f;
}

export function isValidTimeZone(timeZone: string) {
  try {
    formatterFor(timeZone);
    return true;
  } catch {
    return false;
  }
}

/** Wall-clock time of an instant in a zone, encoded as a "naive" UTC timestamp. */
function wallClock(instant: number, timeZone: string): number {
  const parts: Record<string, number> = {};
  for (const p of formatterFor(timeZone).formatToParts(new Date(instant))) if (p.type !== 'literal') parts[p.type] = Number(p.value);
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour === 24 ? 0 : parts.hour, parts.minute, parts.second);
}

/** UTC offset (ms) of a zone at an instant. */
export function zoneOffset(instant: number, timeZone: string) {
  const whole = Math.floor(instant / 1000) * 1000;
  return wallClock(whole, timeZone) - whole;
}

/** The earliest instant showing this wall-clock time, or null inside a DST gap. */
function wallToInstant(wall: number, timeZone: string): number | null {
  const candidates = new Set([wall - zoneOffset(wall - 86_400_000, timeZone), wall - zoneOffset(wall + 86_400_000, timeZone), wall - zoneOffset(wall, timeZone)]);
  const valid = [...candidates].filter((t) => wallClock(t, timeZone) === wall).sort((a, b) => a - b);
  return valid.length ? valid[0] : null;
}

function next(values: number[], current: number) {
  for (const v of values) if (v > current) return v;
  return undefined;
}

function dayMatches(c: ParsedCron, day: number, weekday: number, n8nRule = false) {
  const dom = c.fields.dayOfMonth.set.has(day);
  const dow = c.fields.dayOfWeek.set.has(weekday);
  return (n8nRule ? usesDayOrInN8n(c) : usesDayOr(c)) ? dom || dow : dom && dow;
}

export interface NextRunOptions {
  count?: number;
  /** Use n8n's (kelektiv/node-cron) day-of-month/day-of-week rule instead of standard cron's. */
  n8nDayRule?: boolean;
}

/**
 * Next run instants strictly after `from`, evaluated in `timeZone`.
 * Local times that fall in a daylight-saving gap are skipped; a repeated local time runs once.
 */
export function nextRuns(c: ParsedCron, from: number, timeZone: string, { count = 10, n8nDayRule = false }: NextRunOptions = {}): Date[] {
  const out: Date[] = [];
  const { second, minute, hour, month } = c.fields;
  let w = wallClock(from, timeZone) + 1000;
  const limit = w + 10 * 366 * 86_400_000;
  let guard = 0;
  while (out.length < count && w < limit && guard++ < 500_000) {
    const d = new Date(w);
    const Y = d.getUTCFullYear();
    const M = d.getUTCMonth() + 1;
    const D = d.getUTCDate();
    const h = d.getUTCHours();
    const m = d.getUTCMinutes();
    const s = d.getUTCSeconds();
    if (!month.set.has(M)) {
      w = Date.UTC(Y, M, 1);
      continue;
    }
    if (!dayMatches(c, D, d.getUTCDay(), n8nDayRule)) {
      w = Date.UTC(Y, M - 1, D + 1);
      continue;
    }
    if (!hour.set.has(h)) {
      const nh = next(hour.values, h);
      w = nh === undefined ? Date.UTC(Y, M - 1, D + 1) : Date.UTC(Y, M - 1, D, nh);
      continue;
    }
    if (!minute.set.has(m)) {
      const nm = next(minute.values, m);
      w = nm === undefined ? Date.UTC(Y, M - 1, D, h + 1) : Date.UTC(Y, M - 1, D, h, nm);
      continue;
    }
    if (!second.set.has(s)) {
      const ns = next(second.values, s);
      w = ns === undefined ? Date.UTC(Y, M - 1, D, h, m + 1) : Date.UTC(Y, M - 1, D, h, m, ns);
      continue;
    }
    const instant = wallToInstant(w, timeZone);
    if (instant !== null && instant > from && (!out.length || instant > out[out.length - 1].getTime())) out.push(new Date(instant));
    w += 1000;
  }
  return out;
}

/** "Mon 2026-09-28 09:00" (seconds added when the expression has a seconds field). */
export function formatRun(date: Date, timeZone: string, withSeconds = false) {
  const w = new Date(wallClock(date.getTime(), timeZone));
  const text = `${DAY_NAMES[w.getUTCDay()].slice(0, 3)} ${w.getUTCFullYear()}-${pad(w.getUTCMonth() + 1)}-${pad(w.getUTCDate())} ${pad(w.getUTCHours())}:${pad(w.getUTCMinutes())}`;
  return withSeconds ? `${text}:${pad(w.getUTCSeconds())}` : text;
}

/** "UTC+04:00" */
export function formatOffset(date: Date, timeZone: string) {
  const mins = Math.round(zoneOffset(date.getTime(), timeZone) / 60_000);
  const sign = mins < 0 ? '-' : '+';
  const abs = Math.abs(mins);
  return `UTC${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

// ---------------------------------------------------------------------------------------------
// Builder

export type BuilderMode = 'minutes' | 'hours' | 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'yearly';

export interface BuilderState {
  mode: BuilderMode;
  minutes: number;
  hours: number;
  minuteOfHour: number;
  time: string;
  days: number[];
  dayOfMonth: number;
  month: number;
}

export function buildCron(s: BuilderState): string {
  const [hh, mm] = (s.time || '00:00').split(':').map((x) => Number(x) || 0);
  switch (s.mode) {
    case 'minutes':
      return s.minutes === 1 ? '* * * * *' : `*/${s.minutes} * * * *`;
    case 'hours':
      return `${s.minuteOfHour} ${s.hours === 1 ? '*' : `*/${s.hours}`} * * *`;
    case 'daily':
      return `${mm} ${hh} * * *`;
    case 'weekdays':
      return `${mm} ${hh} * * 1-5`;
    case 'weekly':
      return `${mm} ${hh} * * ${(s.days.length ? [...s.days].sort((a, b) => a - b) : [1]).join(',')}`;
    case 'monthly':
      return `${mm} ${hh} ${s.dayOfMonth} * *`;
    case 'yearly':
      return `${mm} ${hh} ${s.dayOfMonth} ${s.month} *`;
  }
}

/** n8n clipboard JSON for a Schedule Trigger node using Custom (Cron) mode. */
export function scheduleTriggerNode(expression: string) {
  return {
    nodes: [
      {
        parameters: { rule: { interval: [{ field: 'cronExpression', expression }] } },
        type: 'n8n-nodes-base.scheduleTrigger',
        typeVersion: 1.2,
        position: [0, 0],
        name: 'Schedule Trigger',
      },
    ],
    connections: {},
  };
}
