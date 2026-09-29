// Functional tests for the UAE leave salary and overtime calculators. Expected values are computed
// independently in the test from the published rules (Articles 17, 19 and 29 of Federal Decree-Law
// No. 33 of 2021 and Cabinet Resolution No. 1 of 2022), not taken from the app code.
import fs from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures';
import { getToolBySlug, toolPath } from '../../src/data/tools';

type Root = ReturnType<Page['getByTestId']>;

const url = (slug: string) => `/resources/utility-tools/${slug}`;

async function openTool(page: Page, slug: string) {
  await page.goto(url(slug));
  const root = page.getByTestId('tool-root');
  await expect(root.locator('input, select, button').first()).toBeVisible({ timeout: 30_000 });
  return root;
}

/** "AED 1,234.56", rounded half-up to the fils. */
const aed = (value: number) => {
  const fils = Math.round((value + Number.EPSILON) * 100);
  return `AED ${Math.floor(fils / 100).toLocaleString('en-US')}.${String(fils % 100).padStart(2, '0')}`;
};
const num = (value: number) => aed(value).replace('AED ', '');
const daysText = (value: number) => `${num(value)} days`;

// ---------------------------------------------------------------- Leave salary

/** Independent Article 29 model: 30 days/yr pro-rata after 1 year; 2 days per completed month from 6 to 12 months. */
function leaveEarned(years: number, completedMonths: number) {
  if (years >= 1) return 30 * years;
  return completedMonths >= 6 ? 2 * completedMonths : 0;
}

async function setDates(root: Root, start: string, end: string) {
  await root.getByLabel(/Joining date/).fill(start);
  await root.locator('#leave-end').fill(end);
}

async function exitMode(root: Root) {
  await root.getByRole('button', { name: 'Unused leave at exit' }).click();
}

test.describe('uae-leave-salary-calculator', () => {
  test('planned leave is paid on the full wage; the balance comes from exact dates', async ({ page, pageErrors }) => {
    const root = await openTool(page, 'uae-leave-salary-calculator');
    await root.getByLabel('Basic monthly salary (AED)').fill('10000');
    await root.getByLabel(/Monthly allowances/).fill('5000');
    await setDates(root, '2023-01-01', '2025-12-31'); // exactly 3 years, both days included
    await root.getByLabel('Annual leave days already taken').fill('60');
    await root.getByLabel('Leave days you plan to take').fill('30');

    const earned = leaveEarned(3, 36); // 90 days
    await expect(root.getByTestId('leave-service')).toHaveText('3 years');
    await expect(root.getByTestId('leave-earned')).toHaveText(daysText(earned));
    await expect(root.getByTestId('leave-taken-days')).toHaveText(daysText(60));
    await expect(root.getByTestId('leave-balance-days')).toHaveText(daysText(earned - 60));
    await expect(root.getByTestId('leave-daily-wage')).toHaveText(aed(15000 / 30)); // AED 500.00
    await expect(root.getByTestId('leave-total')).toHaveText(aed((15000 / 30) * 30)); // AED 15,000.00
    await expect(root.getByTestId('leave-wage-basis')).toContainText('basic salary + allowances');
    await expect(root.getByTestId('leave-over-balance')).toHaveCount(0);

    // Basic-only contract.
    await root.getByText('Advanced options', { exact: true }).click();
    await root.getByLabel('Wage paid during leave').selectOption('basic');
    await expect(root.getByTestId('leave-total')).toHaveText(aed(10000)); // 333.33 × 30
    await expect(root.getByTestId('leave-daily-wage')).toHaveText(aed(10000 / 30));

    // More days than the balance.
    await root.getByLabel('Wage paid during leave').selectOption('full');
    await root.getByLabel('Leave days you plan to take').fill('35');
    await expect(root.getByTestId('leave-over-balance')).toContainText('30.00 days');
    await expect(root.getByTestId('leave-total')).toHaveText(aed(500 * 35));

    await expect(root.getByTestId('leave-disclaimer')).toContainText('not legal advice');
    await expect(root.getByTestId('leave-disclaimer')).toContainText('DIFC and ADGM');
    expect(pageErrors).toEqual([]);
  });

  test('unused leave at exit is paid on basic salary, with the last part year pro-rata', async ({ page }) => {
    const root = await openTool(page, 'uae-leave-salary-calculator');
    await exitMode(root);
    await root.getByLabel('Basic monthly salary (AED)').fill('10000');
    await root.getByLabel(/Monthly allowances/).fill('5000');
    await setDates(root, '2023-01-01', '2025-12-31');
    await root.getByLabel('Annual leave days already taken').fill('75');
    await expect(root.getByLabel('Leave days you plan to take')).toHaveCount(0);
    await expect(root.getByTestId('leave-balance-days')).toHaveText(daysText(15));
    await expect(root.getByTestId('leave-total')).toHaveText(aed((10000 / 30) * 15)); // AED 5,000.00
    await expect(root.getByTestId('leave-wage-basis')).toContainText('basic salary only');

    // Leaving on 30 June 2026 adds 181 days: 30 × 181 / 365 = 14.88 days.
    await root.locator('#leave-end').fill('2026-06-30');
    const earned = leaveEarned(3 + 181 / 365, 0);
    await expect(root.getByTestId('leave-service')).toHaveText('3 years, 181 days');
    await expect(root.getByTestId('leave-earned')).toHaveText(daysText(earned)); // 104.88 days
    await expect(root.getByTestId('leave-total')).toHaveText(aed((10000 / 30) * (earned - 75))); // AED 9,958.90

    // Contract that pays allowances on unused leave too.
    await root.locator('#leave-end').fill('2025-12-31');
    await root.getByText('Advanced options', { exact: true }).click();
    await root.getByLabel('Wage used for unused leave').selectOption('full');
    await expect(root.getByTestId('leave-total')).toHaveText(aed(500 * 15)); // AED 7,500.00
  });

  test('first year: 2 days per completed month from 6 months, 30 days at one year, nothing under 6 months', async ({ page }) => {
    const root = await openTool(page, 'uae-leave-salary-calculator');
    await exitMode(root);
    await root.getByLabel('Basic monthly salary (AED)').fill('10000');
    await root.getByLabel('Annual leave days already taken').fill('0');
    const daily = 10000 / 30;

    await setDates(root, '2025-01-01', '2025-08-31'); // 8 completed months
    await expect(root.getByTestId('leave-rule')).toHaveText('2 days × 8 completed months');
    await expect(root.getByTestId('leave-earned')).toHaveText(daysText(leaveEarned(8 / 12, 8))); // 16 days
    await expect(root.getByTestId('leave-total')).toHaveText(aed(daily * 16)); // AED 5,333.33

    await root.locator('#leave-end').fill('2025-06-30'); // exactly 6 months
    await expect(root.getByTestId('leave-total')).toHaveText(aed(daily * 12)); // AED 4,000.00

    await root.locator('#leave-end').fill('2025-06-29'); // one day short of 6 months
    await expect(root.getByTestId('leave-total')).toHaveText('AED 0.00');
    await expect(root.getByTestId('leave-not-entitled')).toBeVisible();
    await root.getByText('Advanced options', { exact: true }).click();
    await root.getByLabel('Service under 6 months').selectOption('prorata'); // 5 months × 2 days
    await expect(root.getByTestId('leave-total')).toHaveText(aed(daily * 10)); // AED 3,333.33
    await expect(root.getByTestId('leave-not-entitled')).toHaveCount(0);
    await root.getByLabel('Service under 6 months').selectOption('none');

    await root.locator('#leave-end').fill('2025-12-31'); // one full year earns 30 days, not 24
    await expect(root.getByTestId('leave-earned')).toHaveText(daysText(30));
    await expect(root.getByTestId('leave-total')).toHaveText(aed(10000));
  });

  test('unpaid leave is not counted as service; overdrawn leave leaves nothing to pay', async ({ page }) => {
    const root = await openTool(page, 'uae-leave-salary-calculator');
    await exitMode(root);
    await root.getByLabel('Basic monthly salary (AED)').fill('10000');
    await setDates(root, '2023-01-01', '2025-12-31');
    await root.getByLabel('Annual leave days already taken').fill('0');
    await root.getByLabel(/Unpaid leave days/).fill('73'); // 3 years − 73 days = 2 years 292 days = 2.8 years
    await expect(root.getByTestId('leave-service')).toHaveText('2 years, 292 days');
    await expect(root.getByTestId('leave-earned')).toHaveText(daysText(leaveEarned(2.8, 0))); // 84 days
    await expect(root.getByTestId('leave-total')).toHaveText(aed((10000 / 30) * 84)); // AED 28,000.00

    // Under one year after unpaid leave: 2025 with 10 unpaid days = 11 completed months.
    await setDates(root, '2025-01-01', '2025-12-31');
    await root.getByLabel(/Unpaid leave days/).fill('10');
    await expect(root.getByTestId('leave-earned')).toHaveText(daysText(22));
    await expect(root.getByTestId('leave-total')).toHaveText(aed((10000 / 30) * 22)); // AED 7,333.33

    await root.getByLabel(/Unpaid leave days/).fill('365');
    await expect(root.getByText('Unpaid leave must be shorter than the service period.')).toBeVisible();
    await expect(root.getByTestId('leave-total')).toHaveCount(0);

    await root.getByLabel(/Unpaid leave days/).fill('');
    await setDates(root, '2023-01-01', '2025-12-31');
    await root.getByLabel('Annual leave days already taken').fill('100');
    await expect(root.getByTestId('leave-overdrawn')).toContainText('10.00 more days');
    await expect(root.getByTestId('leave-balance-days')).toHaveText(daysText(0));
    await expect(root.getByTestId('leave-total')).toHaveText('AED 0.00');
  });

  test('known balance with the annualised daily wage', async ({ page }) => {
    const root = await openTool(page, 'uae-leave-salary-calculator');
    await exitMode(root);
    await root.getByLabel('Basic monthly salary (AED)').fill('9000');
    await root.getByRole('button', { name: 'I know my balance' }).click();
    await root.getByLabel('Unused annual leave days').fill('22.5');
    await expect(root.getByTestId('leave-service')).toHaveCount(0);
    await expect(root.getByTestId('leave-total')).toHaveText(aed((9000 / 30) * 22.5)); // AED 6,750.00

    await root.getByText('Advanced options', { exact: true }).click();
    await root.getByLabel('Daily wage method').selectOption('annual');
    await expect(root.getByTestId('leave-daily-wage')).toHaveText(aed((9000 * 12) / 365)); // AED 295.89
    await expect(root.getByTestId('leave-total')).toHaveText(aed(((9000 * 12) / 365) * 22.5)); // AED 6,657.53

    // Planned leave above a known balance.
    await root.getByRole('button', { name: 'Leave salary for planned leave' }).click();
    await root.getByLabel('Daily wage method').selectOption('thirty');
    await root.getByLabel(/Monthly allowances/).fill('3000');
    await root.getByLabel('Unused annual leave days').fill('10');
    await root.getByLabel('Leave days you plan to take').fill('15');
    await expect(root.getByTestId('leave-over-balance')).toBeVisible();
    await expect(root.getByTestId('leave-total')).toHaveText(aed((12000 / 30) * 15)); // AED 6,000.00
  });

  test('validates salary, allowances, dates and day counts', async ({ page }) => {
    const root = await openTool(page, 'uae-leave-salary-calculator');
    const salary = root.getByLabel('Basic monthly salary (AED)');
    await salary.fill('');
    await expect(root.getByText('Enter your basic monthly salary.')).toBeVisible();
    await expect(root.getByTestId('leave-empty')).toBeVisible();
    await expect(salary).toHaveAttribute('aria-invalid', 'true');
    await salary.fill('0');
    await expect(root.getByText('The basic monthly salary must be greater than 0.')).toBeVisible();
    await salary.fill('100.555');
    await expect(root.getByText('Use a number with at most 2 decimal places.')).toBeVisible();
    await salary.fill('10000');

    const allowances = root.getByLabel(/Monthly allowances/);
    await allowances.fill('-5');
    await expect(root.getByText('The monthly allowances cannot be negative.')).toBeVisible();
    await allowances.fill('');
    await expect(root.getByTestId('leave-result')).toBeVisible();

    await setDates(root, '2024-05-01', '2024-04-30');
    await expect(root.getByText('The end date must be after the joining date.')).toBeVisible();
    await expect(root.locator('#leave-end')).toHaveAttribute('aria-invalid', 'true');
    await expect(root.getByTestId('leave-total')).toHaveCount(0);
    await setDates(root, '2023-01-01', '2025-12-31');

    await root.getByLabel('Annual leave days already taken').fill('1.555');
    await expect(root.getByText('Enter the leave days taken as a number with at most 2 decimals.')).toBeVisible();
    await root.getByLabel('Annual leave days already taken').fill('0');
    await root.getByLabel('Leave days you plan to take').fill('0');
    await expect(root.getByText('The leave days must be greater than 0.')).toBeVisible();
    await root.getByLabel('Leave days you plan to take').fill('');
    await expect(root.getByText('Enter the leave days.')).toBeVisible();
    await expect(root.getByTestId('leave-total')).toHaveCount(0);
  });

  test('copy and print the result', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.addInitScript(() => {
      (window as unknown as { printed: number }).printed = 0;
      window.print = () => {
        (window as unknown as { printed: number }).printed += 1;
      };
    });
    const root = await openTool(page, 'uae-leave-salary-calculator');
    await exitMode(root);
    await root.getByLabel('Basic monthly salary (AED)').fill('10000');
    await setDates(root, '2023-01-01', '2025-12-31');
    await root.getByLabel('Annual leave days already taken').fill('75');
    await root.getByRole('button', { name: 'Copy result' }).click();
    await expect(root.getByTestId('leave-notice')).toHaveText('Copied to clipboard.');
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toContain('Unused leave payout: AED 5,000.00');
    expect(text).toContain('Leave balance: 15.00 days');
    expect(text).toContain('Daily wage: AED 333.33');
    await root.getByRole('button', { name: 'Print' }).click();
    expect(await page.evaluate(() => (window as unknown as { printed: number }).printed)).toBe(1);
  });
});

// ---------------------------------------------------------------- Overtime

/** Independent Article 19 model: hourly basic wage × (1 + premium) per hour. */
function overtime(basic: number, dailyHours: number, h: { regular: number; night: number; rest: number }, opts: { shift?: boolean; hourly?: number } = {}) {
  const hourly = opts.hourly ?? basic / 30 / dailyHours;
  const regular = h.regular * hourly * 1.25;
  const night = h.night * hourly * (opts.shift ? 1.25 : 1.5);
  const rest = h.rest * hourly * 1.5;
  return { hourly, regular, night, rest, total: regular + night + rest };
}

async function fillOvertime(root: Root, basic: string, daily: string, days: string, h: { regular: string; night: string; rest: string }) {
  await root.getByLabel('Basic monthly salary (AED)').fill(basic);
  await root.getByLabel('Normal hours per day').fill(daily);
  await root.getByLabel('Working days per week').fill(days);
  await root.getByLabel('Regular overtime hours').fill(h.regular);
  await root.getByLabel(/Night overtime hours/).fill(h.night);
  await root.getByLabel('Rest day or public holiday hours').fill(h.rest);
}

test.describe('uae-overtime-calculator', () => {
  test('25% regular, 50% night and 50% rest-day premiums on the hourly basic wage', async ({ page, pageErrors }) => {
    const root = await openTool(page, 'uae-overtime-calculator');
    await fillOvertime(root, '6000', '8', '5', { regular: '10', night: '4', rest: '8' });
    const r = overtime(6000, 8, { regular: 10, night: 4, rest: 8 });
    await expect(root.getByTestId('overtime-hourly')).toHaveText(aed(r.hourly)); // AED 25.00
    await expect(root.getByTestId('overtime-rate-regular')).toHaveText(num(r.hourly * 1.25));
    await expect(root.getByTestId('overtime-pay-regular')).toHaveText(num(r.regular)); // 312.50
    await expect(root.getByTestId('overtime-pay-night')).toHaveText(num(r.night)); // 150.00
    await expect(root.getByTestId('overtime-pay-restDay')).toHaveText(num(r.rest)); // 300.00
    await expect(root.getByTestId('overtime-total')).toHaveText(aed(r.total)); // AED 762.50
    await expect(root.getByTestId('overtime-premium-night')).toHaveText('+50%');
    await expect(root.getByTestId('overtime-warnings')).toHaveCount(0);

    // Shift workers do not get the night premium: night hours fall back to +25%.
    await root.getByText('Advanced options', { exact: true }).click();
    await root.getByLabel(/I work in shifts/).check();
    const shift = overtime(6000, 8, { regular: 10, night: 4, rest: 8 }, { shift: true });
    await expect(root.getByTestId('overtime-premium-night')).toHaveText('+25%');
    await expect(root.getByTestId('overtime-pay-night')).toHaveText(num(shift.night)); // 125.00
    await expect(root.getByTestId('overtime-total')).toHaveText(aed(shift.total)); // AED 737.50

    await expect(root.getByTestId('overtime-disclaimer')).toContainText('not legal advice');
    await expect(root.getByTestId('overtime-disclaimer')).toContainText('DIFC and ADGM');
    expect(pageErrors).toEqual([]);
  });

  test('non-round salaries, decimal hours and hourly methods', async ({ page }) => {
    const root = await openTool(page, 'uae-overtime-calculator');
    await fillOvertime(root, '3200', '8', '6', { regular: '10', night: '', rest: '' });
    const a = overtime(3200, 8, { regular: 10, night: 0, rest: 0 });
    await expect(root.getByTestId('overtime-hourly')).toHaveText(aed(a.hourly)); // AED 13.33
    await expect(root.getByTestId('overtime-total')).toHaveText(aed(a.total)); // AED 166.67 (exact, not 13.33 × 12.5)

    await fillOvertime(root, '6000', '7.5', '5', { regular: '3.25', night: '1.5', rest: '0' });
    const b = overtime(6000, 7.5, { regular: 3.25, night: 1.5, rest: 0 });
    await expect(root.getByTestId('overtime-hourly')).toHaveText(aed(b.hourly)); // AED 26.67
    await expect(root.getByTestId('overtime-total')).toHaveText(aed(b.total));

    await fillOvertime(root, '6000', '8', '5', { regular: '10', night: '4', rest: '8' });
    await root.getByText('Advanced options', { exact: true }).click();
    await root.getByLabel('Hourly wage method').selectOption('annual');
    const annual = overtime(6000, 8, { regular: 10, night: 4, rest: 8 }, { hourly: (6000 * 12) / 365 / 8 });
    await expect(root.getByTestId('overtime-hourly')).toHaveText(aed(annual.hourly)); // AED 24.66
    await expect(root.getByTestId('overtime-total')).toHaveText(aed(annual.total));

    await root.getByLabel('Hourly wage method').selectOption('weekly');
    const weekly = overtime(6000, 8, { regular: 10, night: 4, rest: 8 }, { hourly: (6000 * 12) / 52 / 40 });
    await expect(root.getByTestId('overtime-hourly')).toHaveText(aed(weekly.hourly)); // AED 34.62
    await expect(root.getByTestId('overtime-total')).toHaveText(aed(weekly.total));

    // Contract paying overtime on basic + allowances.
    await root.getByLabel('Hourly wage method').selectOption('thirty');
    await root.getByLabel('Wage used for the hourly rate').selectOption('full');
    await root.getByLabel('Monthly allowances (AED)').fill('3000');
    const full = overtime(9000, 8, { regular: 10, night: 4, rest: 8 });
    await expect(root.getByTestId('overtime-hourly')).toHaveText(aed(full.hourly)); // AED 37.50
    await expect(root.getByTestId('overtime-total')).toHaveText(aed(full.total)); // AED 1,143.75
  });

  test('warns when normal hours or overtime exceed the legal limits', async ({ page }) => {
    const root = await openTool(page, 'uae-overtime-calculator');
    // 5 × 8 = 40 h/week; 3 weeks = 120 h + 24 h overtime = exactly 144: no warning.
    await fillOvertime(root, '6000', '8', '5', { regular: '24', night: '0', rest: '0' });
    await root.getByLabel('Period these hours cover').selectOption('threeWeeks');
    await expect(root.getByTestId('overtime-total')).toHaveText(aed(overtime(6000, 8, { regular: 24, night: 0, rest: 0 }).total)); // AED 750.00
    await expect(root.getByTestId('overtime-warnings')).toHaveCount(0);
    await root.getByLabel('Regular overtime hours').fill('24.5');
    await expect(root.getByTestId('overtime-warning-three-week-cap')).toContainText('144.50');
    await expect(root.getByTestId('overtime-warning-daily-overtime')).toHaveCount(0); // 24.5 / 15 days = 1.63 h/day

    // More than 2 overtime hours a day on average: 12 h over one 5-day week.
    await root.getByLabel('Period these hours cover').selectOption('week');
    await root.getByLabel('Regular overtime hours').fill('10');
    await expect(root.getByTestId('overtime-warning-daily-overtime')).toHaveCount(0); // exactly 2 h/day
    await root.getByLabel('Regular overtime hours').fill('12');
    await expect(root.getByTestId('overtime-warning-daily-overtime')).toContainText('2.40');

    // Normal hours above 8 a day and 48 a week.
    await fillOvertime(root, '6000', '9', '6', { regular: '0', night: '0', rest: '0' });
    await expect(root.getByTestId('overtime-warning-daily-hours')).toBeVisible();
    await expect(root.getByTestId('overtime-warning-weekly-hours')).toContainText('54.00');
    await root.getByLabel('Normal hours per day').fill('8');
    await expect(root.getByTestId('overtime-warning-daily-hours')).toHaveCount(0);
    await expect(root.getByTestId('overtime-warning-weekly-hours')).toHaveCount(0); // 48 is allowed
  });

  test('zero overtime and input validation', async ({ page }) => {
    const root = await openTool(page, 'uae-overtime-calculator');
    await fillOvertime(root, '6000', '8', '5', { regular: '0', night: '', rest: '0' });
    await expect(root.getByTestId('overtime-total')).toHaveText('AED 0.00');
    await expect(root.getByTestId('overtime-no-hours')).toBeVisible();
    await expect(root.getByTestId('overtime-hourly')).toHaveText('AED 25.00');

    const salary = root.getByLabel('Basic monthly salary (AED)');
    await salary.fill('');
    await expect(root.getByText('Enter your basic monthly salary.')).toBeVisible();
    await expect(root.getByTestId('overtime-empty')).toBeVisible();
    await expect(salary).toHaveAttribute('aria-invalid', 'true');
    await salary.fill('-100');
    await expect(root.getByText('The basic monthly salary must be greater than 0.')).toBeVisible();
    await salary.fill('6000');

    await root.getByLabel('Normal hours per day').fill('0');
    await expect(root.getByText('Enter normal daily hours from 0.01 to 24.')).toBeVisible();
    await root.getByLabel('Normal hours per day').fill('8');
    await root.getByLabel('Working days per week').fill('8');
    await expect(root.getByText('Enter whole working days from 1 to 7.')).toBeVisible();
    await root.getByLabel('Working days per week').fill('5');
    await root.getByLabel('Regular overtime hours').fill('1.234');
    await expect(root.getByText('Enter hours as a number with at most 2 decimals.')).toBeVisible();
    await expect(root.getByTestId('overtime-total')).toHaveCount(0);
    await root.getByLabel('Period these hours cover').selectOption('week');
    await root.getByLabel('Regular overtime hours').fill('169');
    await expect(root.getByText('Enter up to 168 hours.')).toBeVisible();
  });

  test('copy the result', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const root = await openTool(page, 'uae-overtime-calculator');
    await fillOvertime(root, '6000', '8', '5', { regular: '10', night: '4', rest: '8' });
    await root.getByRole('button', { name: 'Copy result' }).click();
    await expect(root.getByTestId('overtime-notice')).toHaveText('Copied to clipboard.');
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toContain('Hourly wage: AED 25.00');
    expect(text).toContain('Total overtime pay: AED 762.50');
  });
});

// ---------------------------------------------------------------- SEO and cross-links

test.describe('UAE employment tool pages', () => {
  for (const slug of ['uae-leave-salary-calculator', 'uae-overtime-calculator']) {
    test(`${slug} has one H1, its title and WebApplication + FAQPage + HowTo JSON-LD`, async ({ page }) => {
      const tool = getToolBySlug(slug)!;
      await openTool(page, slug);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText(tool.name);
      await expect(page).toHaveTitle(tool.seoTitle);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', tool.seoDescription);
      const blocks = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((s) => JSON.parse(s));
      const types = blocks.map((b) => b['@type']);
      expect(types).toEqual(expect.arrayContaining(['WebApplication', 'FAQPage', 'HowTo']));
      expect(blocks.find((b) => b['@type'] === 'FAQPage').mainEntity).toHaveLength(tool.faqs.length);
      expect(blocks.find((b) => b['@type'] === 'WebApplication').dateModified).toBe(tool.reviewed);
      await expect(page.getByTestId('tool-root').locator('h1')).toHaveCount(0);
      await expect(page.getByTestId('tool-root').locator('h2').first()).toBeVisible();

      const file = path.resolve(process.cwd(), `dist/prerender/resources/utility-tools/${slug}.html`);
      if (fs.existsSync(file)) {
        const html = fs.readFileSync(file, 'utf8');
        expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
        expect(html).toContain(`<title>${tool.seoTitle}</title>`);
        expect(html).toContain('"@type":"FAQPage"');
      }
    });
  }

  test('the UAE finance tools link to each other', async ({ page }) => {
    const family = ['uae-gratuity-calculator', 'uae-leave-salary-calculator', 'uae-overtime-calculator', 'uae-vat-calculator'];
    for (const slug of family) {
      const tool = getToolBySlug(slug)!;
      for (const other of family.filter((s) => s !== slug)) expect(tool.related, `${slug} → ${other}`).toContain(other);
      await openTool(page, slug);
      const related = page.locator('section[aria-labelledby="related-heading"]');
      for (const other of family.filter((s) => s !== slug)) await expect(related.locator(`a[href="${toolPath(getToolBySlug(other)!)}"]`)).toBeVisible();
    }
    // In-content links from the gratuity page to the rest of the final settlement.
    const root = await openTool(page, 'uae-gratuity-calculator');
    const settlement = root.getByTestId('gratuity-settlement');
    await settlement.getByRole('link', { name: 'UAE leave salary calculator' }).click();
    await expect(page).toHaveURL(/\/uae-leave-salary-calculator$/);
    await expect(page.locator('h1')).toHaveText('UAE Leave Salary Calculator');
  });
});

// ---------------------------------------------------------------- Mobile layout

test('UAE leave salary and overtime calculators have no horizontal overflow at phone width @mobile', async ({ page, pageErrors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const slug of ['uae-leave-salary-calculator', 'uae-overtime-calculator']) {
    const root = await openTool(page, slug);
    if (slug === 'uae-leave-salary-calculator') {
      await root.getByRole('button', { name: 'Unused leave at exit' }).click();
      await root.getByLabel('Basic monthly salary (AED)').fill('9999999.99');
      await root.getByLabel(/Monthly allowances/).fill('9999999.99');
      await root.getByLabel(/Unpaid leave days/).fill('12');
      await root.getByText('Advanced options', { exact: true }).click();
      await expect(root.getByTestId('leave-breakdown')).toBeVisible();
    } else {
      await fillOvertime(root, '9999999.99', '9', '7', { regular: '700', night: '700', rest: '700' });
      await root.getByText('Advanced options', { exact: true }).click();
      await expect(root.getByTestId('overtime-warnings')).toBeVisible();
    }
    const overflow = await root.evaluate((el) => {
      const vw = document.documentElement.clientWidth;
      const clipped = (node: Element) => {
        for (let p = node.parentElement; p && p !== el; p = p.parentElement) {
          const ox = getComputedStyle(p).overflowX;
          if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') return true;
        }
        return false;
      };
      return Array.from(el.querySelectorAll('*'))
        .filter((node) => {
          const r = node.getBoundingClientRect();
          return r.width > 0 && (r.right > vw + 1 || r.left < -1) && !clipped(node);
        })
        .map((node) => `${node.tagName.toLowerCase()}.${String(node.className).slice(0, 40)}`)
        .slice(0, 5);
    });
    expect(overflow, `${slug} overflows horizontally`).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${slug} page scrolls sideways`).toBe(true);
  }
  expect(pageErrors).toEqual([]);
});
