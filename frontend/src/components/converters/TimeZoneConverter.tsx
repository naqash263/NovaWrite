import { useId, useMemo, useState } from 'react';
import { CopyButton } from './UnitConverter';

// DST-aware conversion using the browser's IANA time zone database (Intl API).
// A wall-clock time in the source zone is resolved to a UTC instant for the chosen
// date, so daylight saving changes on that date are applied automatically.

const popularZones: { id: string; city: string }[] = [
  { id: 'UTC', city: 'UTC (Coordinated Universal Time)' },
  { id: 'Pacific/Honolulu', city: 'Honolulu' },
  { id: 'America/Anchorage', city: 'Anchorage' },
  { id: 'America/Los_Angeles', city: 'Los Angeles (Pacific)' },
  { id: 'America/Phoenix', city: 'Phoenix (Arizona, no DST)' },
  { id: 'America/Denver', city: 'Denver (Mountain)' },
  { id: 'America/Chicago', city: 'Chicago (Central)' },
  { id: 'America/New_York', city: 'New York (Eastern)' },
  { id: 'America/Toronto', city: 'Toronto' },
  { id: 'America/Mexico_City', city: 'Mexico City' },
  { id: 'America/Sao_Paulo', city: 'São Paulo' },
  { id: 'Europe/London', city: 'London' },
  { id: 'Europe/Dublin', city: 'Dublin' },
  { id: 'Europe/Paris', city: 'Paris' },
  { id: 'Europe/Berlin', city: 'Berlin' },
  { id: 'Europe/Madrid', city: 'Madrid' },
  { id: 'Europe/Amsterdam', city: 'Amsterdam' },
  { id: 'Europe/Istanbul', city: 'Istanbul' },
  { id: 'Europe/Moscow', city: 'Moscow' },
  { id: 'Africa/Lagos', city: 'Lagos' },
  { id: 'Africa/Cairo', city: 'Cairo' },
  { id: 'Africa/Johannesburg', city: 'Johannesburg' },
  { id: 'Africa/Nairobi', city: 'Nairobi' },
  { id: 'Asia/Riyadh', city: 'Riyadh' },
  { id: 'Asia/Dubai', city: 'Dubai' },
  { id: 'Asia/Karachi', city: 'Karachi' },
  { id: 'Asia/Kolkata', city: 'India (Kolkata)' },
  { id: 'Asia/Dhaka', city: 'Dhaka' },
  { id: 'Asia/Bangkok', city: 'Bangkok' },
  { id: 'Asia/Jakarta', city: 'Jakarta' },
  { id: 'Asia/Singapore', city: 'Singapore' },
  { id: 'Asia/Hong_Kong', city: 'Hong Kong' },
  { id: 'Asia/Shanghai', city: 'China (Shanghai)' },
  { id: 'Asia/Tokyo', city: 'Tokyo' },
  { id: 'Asia/Seoul', city: 'Seoul' },
  { id: 'Australia/Perth', city: 'Perth' },
  { id: 'Australia/Brisbane', city: 'Brisbane' },
  { id: 'Australia/Sydney', city: 'Sydney' },
  { id: 'Pacific/Auckland', city: 'Auckland' },
];

const summaryZones = ['UTC', 'America/Los_Angeles', 'America/New_York', 'Europe/London', 'Europe/Berlin', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney'];

const formatterCache = new Map<string, Intl.DateTimeFormat>();
function partsFormatter(timeZone: string) {
  let f = formatterCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatterCache.set(timeZone, f);
  }
  return f;
}

type Wall = { year: number; month: number; day: number; hour: number; minute: number };

/** Wall-clock fields of a UTC instant in a zone. */
function wallTime(utcMs: number, timeZone: string): Wall {
  const parts = Object.fromEntries(partsFormatter(timeZone).formatToParts(new Date(utcMs)).map((p) => [p.type, p.value]));
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day), hour: Number(parts.hour) % 24, minute: Number(parts.minute) };
}

/** Zone offset from UTC in minutes at a given instant. */
function offsetMinutes(utcMs: number, timeZone: string): number {
  const w = wallTime(utcMs, timeZone);
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute);
  return Math.round((asUtc - Math.floor(utcMs / 60000) * 60000) / 60000);
}

const sameWall = (a: Wall, b: Wall) => a.year === b.year && a.month === b.month && a.day === b.day && a.hour === b.hour && a.minute === b.minute;

/**
 * Resolves a wall-clock time in a zone to a UTC instant.
 * kind: 'ok' | 'gap' (time skipped by a DST change) | 'overlap' (time occurs twice; earliest returned).
 */
function zonedToUtc(wall: Wall, timeZone: string): { utc: number; kind: 'ok' | 'gap' | 'overlap' } {
  const guess = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute);
  const offsets = new Set([offsetMinutes(guess - 86_400_000, timeZone), offsetMinutes(guess, timeZone), offsetMinutes(guess + 86_400_000, timeZone)]);
  const matches = [...offsets]
    .map((o) => guess - o * 60_000)
    .filter((utc) => sameWall(wallTime(utc, timeZone), wall))
    .sort((a, b) => a - b);
  const unique = Array.from(new Set(matches));
  if (unique.length === 1) return { utc: unique[0], kind: 'ok' };
  if (unique.length > 1) return { utc: unique[0], kind: 'overlap' };
  // In a spring-forward gap: interpret with the offset in effect before the change (clocks move forward).
  const before = offsetMinutes(guess - 86_400_000, timeZone);
  return { utc: guess - before * 60_000, kind: 'gap' };
}

function zoneName(utcMs: number, timeZone: string): string {
  try {
    const short = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' }).formatToParts(new Date(utcMs)).find((p) => p.type === 'timeZoneName')?.value;
    const offset = offsetMinutes(utcMs, timeZone);
    const sign = offset < 0 ? '−' : '+';
    const abs = Math.abs(offset);
    const utcLabel = `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
    return short && !/^(GMT|UTC)/.test(short) ? `${short}, ${utcLabel}` : utcLabel;
  } catch {
    return '';
  }
}

const pad = (n: number) => String(n).padStart(2, '0');
const longDate = (w: Wall) =>
  new Date(Date.UTC(w.year, w.month - 1, w.day)).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
const dayDiff = (a: Wall, b: Wall) => Math.round((Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / 86_400_000);

function formatDifference(minutes: number): string {
  if (minutes === 0) return 'Same time';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${h ? `${h} h` : ''}${h && m ? ' ' : ''}${m ? `${m} min` : ''} ${minutes > 0 ? 'ahead' : 'behind'}`;
}

function allZones(local: string): { id: string; label: string }[] {
  const intl = Intl as unknown as { supportedValuesOf?: (key: string) => string[] };
  let extra: string[] = [];
  try {
    extra = intl.supportedValuesOf?.('timeZone') ?? [];
  } catch {
    extra = [];
  }
  const seen = new Set(popularZones.map((z) => z.id));
  const others = [local, ...extra].filter((z) => z && !seen.has(z) && (seen.add(z), true));
  return others.map((z) => ({ id: z, label: z.replace(/_/g, ' ') }));
}

export default function TimeZoneConverter() {
  const id = useId();
  const localZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  }, []);
  const otherZones = useMemo(() => allZones(localZone), [localZone]);
  const [fromZone, setFromZone] = useState(localZone);
  const [toZone, setToZone] = useState(localZone === 'America/New_York' ? 'Europe/London' : 'America/New_York');
  const initial = useMemo(() => wallTime(Date.now(), localZone), [localZone]);
  const [date, setDate] = useState(`${initial.year}-${pad(initial.month)}-${pad(initial.day)}`);
  const [time, setTime] = useState(`${pad(initial.hour)}:${pad(initial.minute)}`);

  const setNow = () => {
    const now = wallTime(Date.now(), fromZone);
    setDate(`${now.year}-${pad(now.month)}-${pad(now.day)}`);
    setTime(`${pad(now.hour)}:${pad(now.minute)}`);
  };

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})/.exec(time);
  const input: Wall | null =
    dateMatch && timeMatch
      ? { year: +dateMatch[1], month: +dateMatch[2], day: +dateMatch[3], hour: +timeMatch[1], minute: +timeMatch[2] }
      : null;

  let resolved: ReturnType<typeof zonedToUtc> | null = null;
  let error: string | null = null;
  if (!input) error = 'Choose a date and a time to convert.';
  else {
    try {
      resolved = zonedToUtc(input, fromZone);
      wallTime(resolved.utc, toZone);
    } catch {
      error = 'That time zone is not supported by your browser.';
      resolved = null;
    }
  }

  const out = resolved ? wallTime(resolved.utc, toZone) : null;
  const src = resolved ? wallTime(resolved.utc, fromZone) : null;
  const shift = src && out ? dayDiff(src, out) : 0;
  const diffMinutes = resolved ? offsetMinutes(resolved.utc, toZone) - offsetMinutes(resolved.utc, fromZone) : 0;
  const label = (z: string) => popularZones.find((p) => p.id === z)?.city ?? z.replace(/_/g, ' ');
  const sentence =
    src && out && resolved
      ? `${pad(src.hour)}:${pad(src.minute)} ${longDate(src)} in ${label(fromZone)} = ${pad(out.hour)}:${pad(out.minute)} ${longDate(out)} in ${label(toZone)}`
      : '';

  const inputClass =
    'w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-3 text-base focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500';
  const zoneOptions = (
    <>
      <optgroup label="Popular">
        {popularZones.map((z) => (
          <option key={z.id} value={z.id}>
            {z.city}
          </option>
        ))}
      </optgroup>
      <optgroup label="All time zones">
        {otherZones.map((z) => (
          <option key={z.id} value={z.id}>
            {z.label}
          </option>
        ))}
      </optgroup>
    </>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor={`${id}-date`} className="mb-1.5 block text-sm font-medium text-gray-700">
            Date
          </label>
          <input id={`${id}-date`} type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </div>
        <div className="min-w-0">
          <label htmlFor={`${id}-time`} className="mb-1.5 block text-sm font-medium text-gray-700">
            Time
          </label>
          <div className="flex gap-2">
            <input id={`${id}-time`} type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} />
            <button
              type="button"
              onClick={setNow}
              className="rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Now
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-end">
        <div className="min-w-0">
          <label htmlFor={`${id}-from`} className="mb-1.5 block text-sm font-medium text-gray-700">
            From time zone
          </label>
          <select id={`${id}-from`} value={fromZone} onChange={(e) => setFromZone(e.target.value)} className={inputClass}>
            {zoneOptions}
          </select>
        </div>
        <button
          type="button"
          onClick={() => {
            setFromZone(toZone);
            setToZone(fromZone);
          }}
          aria-label="Swap time zones"
          title="Swap time zones"
          className="h-12 rounded-lg border border-gray-300 bg-white px-4 text-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <span aria-hidden="true">⇄</span>
        </button>
        <div className="min-w-0">
          <label htmlFor={`${id}-to`} className="mb-1.5 block text-sm font-medium text-gray-700">
            To time zone
          </label>
          <select id={`${id}-to`} value={toZone} onChange={(e) => setToZone(e.target.value)} className={inputClass}>
            {zoneOptions}
          </select>
        </div>
      </div>

      <div aria-live="polite" className="rounded-xl border border-blue-100 bg-blue-50 p-4 sm:p-5">
        {error || !out || !src || !resolved ? (
          <p className="text-sm text-gray-700">{error}</p>
        ) : (
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-700">In {label(toZone)}</p>
              <p className="text-3xl font-semibold text-blue-950">
                <span data-testid="tz-result-time">
                  {pad(out.hour)}:{pad(out.minute)}
                </span>
                {shift !== 0 && (
                  <span className="ml-2 align-middle text-sm font-medium text-blue-700" data-testid="tz-day-shift">
                    {shift > 0 ? `+${shift} day` : `${shift} day`}
                  </span>
                )}
              </p>
              <p className="text-sm text-blue-900" data-testid="tz-result-date">
                {longDate(out)}
              </p>
              <p className="mt-2 text-sm text-blue-800" data-testid="tz-offsets">
                {label(fromZone)}: {zoneName(resolved.utc, fromZone)} · {label(toZone)}: {zoneName(resolved.utc, toZone)} ·{' '}
                <span data-testid="tz-difference">{formatDifference(diffMinutes)}</span>
              </p>
              {resolved.kind === 'gap' && (
                <p className="mt-2 text-sm font-medium text-amber-800" data-testid="tz-dst-note">
                  {time} does not exist on this date in {label(fromZone)} because clocks move forward for daylight saving time. It is shown as{' '}
                  {pad(src.hour)}:{pad(src.minute)} local time.
                </p>
              )}
              {resolved.kind === 'overlap' && (
                <p className="mt-2 text-sm font-medium text-amber-800" data-testid="tz-dst-note">
                  {time} happens twice on this date in {label(fromZone)} because clocks go back. The first occurrence (daylight time) is shown.
                </p>
              )}
            </div>
            <CopyButton text={sentence} label="Copy" />
          </div>
        )}
      </div>

      {resolved && !error && (
        <details className="rounded-xl border border-gray-200 bg-white">
          <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-gray-900">Same moment in other major cities</summary>
          <div className="overflow-x-auto px-4 pb-4">
            <table className="w-full text-left text-sm">
              <tbody>
                {summaryZones.map((z) => {
                  const w = wallTime(resolved.utc, z);
                  return (
                    <tr key={z} className="border-t border-gray-100">
                      <th scope="row" className="py-2 pr-3 font-normal text-gray-600">
                        {label(z)}
                      </th>
                      <td className="py-2 pr-3 font-mono text-gray-900">
                        {pad(w.hour)}:{pad(w.minute)}
                      </td>
                      <td className="py-2 text-right text-gray-600">{longDate(w)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      )}

      <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
        Daylight saving time is applied automatically for the date you pick, using your browser’s up-to-date IANA time zone database. Pick cities rather
        than abbreviations such as “CST”, which can mean US Central, China or Cuba Standard Time.
      </p>
    </div>
  );
}
