// Exact money arithmetic for the UAE finance tools (gratuity and VAT).
// Amounts are held as BigInt fils (1 AED = 100 fils) or as a numerator over a fixed
// denominator, so nothing is rounded until a value is displayed (half-up to 2 dp).

/** Parses a non-negative AED amount with at most 2 decimals into fils. Returns null when invalid. */
export function parseFils(raw: string): bigint | null {
  const m = /^(\d{1,13})(?:\.(\d{0,2}))?$/.exec(raw.trim());
  if (!m) return null;
  return BigInt(m[1]) * 100n + BigInt((m[2] ?? '').padEnd(2, '0'));
}

/** Parses a non-negative decimal with at most 2 decimals into hundredths (e.g. "62.5" -> 6250n). */
export const parseHundredths = parseFils;

/** Half-up rounding of the non-negative fraction n / d to a whole number. */
export function roundHalfUp(n: bigint, d: bigint): bigint {
  return (2n * n + d) / (2n * d);
}

const group = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** Formats whole fils as "AED 1,234.56". */
export function formatFils(fils: bigint): string {
  const neg = fils < 0n;
  const abs = neg ? -fils : fils;
  return `${neg ? '-' : ''}AED ${group((abs / 100n).toString())}.${(abs % 100n).toString().padStart(2, '0')}`;
}

/** Formats the fraction n / d (in fils) as AED, rounding only here. */
export const formatRatio = (n: bigint, d: bigint) => formatFils(roundHalfUp(n, d));

/** Formats the fraction n / d as a plain number rounded half-up to `dp` decimals. */
export function formatDecimal(n: bigint, d: bigint, dp = 2): string {
  const scale = 10n ** BigInt(dp);
  const v = roundHalfUp(n * scale, d);
  const whole = group((v / scale).toString());
  return dp ? `${whole}.${(v % scale).toString().padStart(dp, '0')}` : whole;
}

// ---------------------------------------------------------------- Gratuity

/** Service is measured in twelfths of a day so that whole days and whole months (1/12 year) are both exact. */
export const UNITS_PER_DAY = 12n;
export const DAYS_PER_YEAR = 365n;
export const UNITS_PER_YEAR = DAYS_PER_YEAR * UNITS_PER_DAY; // 4380
const FIVE_YEARS = 5n * UNITS_PER_YEAR;

export type DailyWageMethod = 'thirty' | 'annual';

export const dailyWageMethods: Record<DailyWageMethod, { label: string; formula: string }> = {
  thirty: { label: 'Basic salary ÷ 30 (standard)', formula: 'basic monthly salary ÷ 30' },
  annual: { label: 'Basic salary × 12 ÷ 365 (annualised)', formula: 'basic monthly salary × 12 ÷ 365' },
};

export interface ScheduleRow {
  year: number;
  /** Service counted in this year, in units (1/12 day). */
  units: bigint;
  /** 21 for years 1-5, 30 after. */
  rate: 21 | 30;
  /** Days of wage earned this year = dayUnits / UNITS_PER_YEAR. */
  dayUnits: bigint;
  /** Amount earned this year after the cap (numerator over `denominator`). */
  amount: bigint;
  cumulative: bigint;
  capped: boolean;
}

export interface GratuityResult {
  eligible: boolean;
  serviceUnits: bigint;
  /** Daily wage in fils = dailyN / dailyD. */
  dailyN: bigint;
  dailyD: bigint;
  /** All money values below are numerators over this denominator (in fils). */
  denominator: bigint;
  band1: { units: bigint; dayUnits: bigint; amount: bigint };
  band2: { units: bigint; dayUnits: bigint; amount: bigint };
  /** Days of wage before the cap = dayUnits / UNITS_PER_YEAR. */
  dayUnits: bigint;
  uncapped: bigint;
  cap: bigint;
  capApplied: boolean;
  /** Full-time amount after the cap. */
  fullTime: bigint;
  /** Final amount after the part-time proportion (numerator over denominator * 10000). */
  total: bigint;
  totalDenominator: bigint;
  partTimeBasisPoints: bigint;
  schedule: ScheduleRow[];
}

/**
 * End-of-service gratuity under Article 51 of Federal Decree-Law No. 33 of 2021:
 * 21 days of basic wage per year for the first five years, 30 days per later year,
 * pro-rata for part years, at least one year of service, capped at two years' wage.
 * `partTimeBasisPoints` is the contracted hours as a share of full time (10000 = 100%).
 */
export function calculateGratuity(basicFils: bigint, serviceUnits: bigint, method: DailyWageMethod, partTimeBasisPoints = 10000n): GratuityResult {
  // amount(fils) = basic × k × dayUnits / denominator, where dayUnits / UNITS_PER_YEAR are the days of wage.
  const k = method === 'thirty' ? 1n : 12n;
  const denominator = method === 'thirty' ? UNITS_PER_YEAR * 30n : UNITS_PER_YEAR * DAYS_PER_YEAR;
  const money = (dayUnits: bigint) => basicFils * k * dayUnits;

  const eligible = serviceUnits >= UNITS_PER_YEAR;
  const counted = eligible ? serviceUnits : 0n;
  const b1Units = counted < FIVE_YEARS ? counted : FIVE_YEARS;
  const b2Units = counted - b1Units;
  const b1Days = 21n * b1Units;
  const b2Days = 30n * b2Units;
  const dayUnits = b1Days + b2Days;
  const uncapped = money(dayUnits);
  const cap = 24n * basicFils * denominator; // two years' wage = 24 months of basic salary
  const capApplied = uncapped > cap;
  const fullTime = capApplied ? cap : uncapped;

  const schedule: ScheduleRow[] = [];
  let cumulative = 0n;
  for (let year = 1; BigInt(year - 1) * UNITS_PER_YEAR < counted; year++) {
    const left = counted - BigInt(year - 1) * UNITS_PER_YEAR;
    const units = left < UNITS_PER_YEAR ? left : UNITS_PER_YEAR;
    const rate = year <= 5 ? 21 : 30;
    const rowDays = BigInt(rate) * units;
    const next = cumulative + money(rowDays);
    const cappedNext = next > cap ? cap : next;
    schedule.push({ year, units, rate, dayUnits: rowDays, amount: cappedNext - cumulative, cumulative: cappedNext, capped: next > cap });
    cumulative = cappedNext;
  }

  return {
    eligible,
    serviceUnits,
    dailyN: basicFils * k,
    dailyD: method === 'thirty' ? 30n : DAYS_PER_YEAR,
    denominator,
    band1: { units: b1Units, dayUnits: b1Days, amount: money(b1Days) },
    band2: { units: b2Units, dayUnits: b2Days, amount: money(b2Days) },
    dayUnits,
    uncapped,
    cap,
    capApplied,
    fullTime,
    total: fullTime * partTimeBasisPoints,
    totalDenominator: denominator * 10000n,
    partTimeBasisPoints,
    schedule,
  };
}

const DAY_MS = 86_400_000;

function parseIsoDate(s: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(t);
  return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]) ? t : null;
}

function addYears(t: number, years: number) {
  const d = new Date(t);
  return Date.UTC(d.getUTCFullYear() + years, d.getUTCMonth(), d.getUTCDate()); // 29 Feb rolls to 1 Mar
}

/**
 * Service between the first and last working day, both inclusive. Whole years are counted by
 * anniversary (so leap days do not create extra fractions); the remaining days count as n/365 of a year.
 */
export function serviceFromDates(start: string, end: string): { units: bigint; calendarDays: number } | null {
  const s = parseIsoDate(start);
  const e = parseIsoDate(end);
  if (s === null || e === null || e <= s) return null;
  const after = e + DAY_MS; // the day after the last working day
  let years = new Date(after).getUTCFullYear() - new Date(s).getUTCFullYear();
  while (years > 0 && addYears(s, years) > after) years--;
  const remainder = Math.round((after - addYears(s, years)) / DAY_MS);
  return { units: BigInt(years) * UNITS_PER_YEAR + BigInt(remainder) * UNITS_PER_DAY, calendarDays: Math.round((after - s) / DAY_MS) };
}

/** Service entered as years, months (1/12 year each) and days (1/365 year each). */
export const serviceFromParts = (years: number, months: number, days: number) =>
  BigInt(years) * UNITS_PER_YEAR + BigInt(months) * DAYS_PER_YEAR + BigInt(days) * UNITS_PER_DAY;

/** "7 years, 120 days" from service units (days shown to 2 dp when months make them fractional). */
export function describeService(units: bigint): string {
  const years = units / UNITS_PER_YEAR;
  const rest = units % UNITS_PER_YEAR;
  const days = rest % UNITS_PER_DAY === 0n ? (rest / UNITS_PER_DAY).toString() : formatDecimal(rest, UNITS_PER_DAY, 2);
  const parts = [];
  if (years) parts.push(`${years} year${years === 1n ? '' : 's'}`);
  if (rest || !years) parts.push(`${days} day${days === '1' ? '' : 's'}`);
  return parts.join(', ');
}

// ---------------------------------------------------------------- VAT

export const VAT_RATE_PERCENT = 5n;

export interface VatBreakdown {
  net: bigint;
  vat: bigint;
  gross: bigint;
}

/** Net (excluding VAT) to gross: VAT = net × rate / 100, rounded half-up to the fils. */
export function addVat(netFils: bigint, ratePercent: bigint = VAT_RATE_PERCENT): VatBreakdown {
  const vat = roundHalfUp(netFils * ratePercent, 100n);
  return { net: netFils, vat, gross: netFils + vat };
}

/** Gross (including VAT) to net: VAT = gross × rate / (100 + rate), i.e. 5/105 at 5%. */
export function removeVat(grossFils: bigint, ratePercent: bigint = VAT_RATE_PERCENT): VatBreakdown {
  const vat = roundHalfUp(grossFils * ratePercent, 100n + ratePercent);
  return { net: grossFils - vat, vat, gross: grossFils };
}

/** From a VAT amount at 5%: net = VAT × 20, gross = VAT × 21. */
export function fromVatAmount(vatFils: bigint): VatBreakdown {
  const net = (vatFils * 100n) / VAT_RATE_PERCENT;
  return { net, vat: vatFils, gross: net + vatFils };
}
