// Functional tests for the UAE finance tools: the end-of-service gratuity calculator and the 5% VAT
// calculator. Expected values are computed independently in the test from the published rules
// (Article 51 of Federal Decree-Law No. 33 of 2021; FTA 5% standard rate), not taken from the app code.
import fs from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures';
import { getToolBySlug } from '../../src/data/tools';

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

/** Table cells show the number only; the AED unit is in the column header. */
const num = (value: number) => aed(value).replace('AED ', '');

/** Independent gratuity model: 21 days/yr for years 1-5, 30 days/yr after, capped at 24 months of basic. */
function expectedGratuity(basic: number, years: number, method: 'thirty' | 'annual' = 'thirty') {
  if (years < 1) return 0;
  const daily = method === 'thirty' ? basic / 30 : (basic * 12) / 365;
  const days = 21 * Math.min(years, 5) + 30 * Math.max(years - 5, 0);
  return Math.min(daily * days, basic * 24);
}

async function enterParts(root: ReturnType<Page['getByTestId']>, years: number, months = 0, days = 0) {
  await root.getByRole('button', { name: 'Years, months, days' }).click();
  await root.getByLabel('Years', { exact: true }).fill(String(years));
  await root.getByLabel('Months', { exact: true }).fill(String(months));
  await root.getByLabel('Days', { exact: true }).fill(String(days));
}

// ---------------------------------------------------------------- Gratuity

test.describe('uae-gratuity-calculator', () => {
  test('3 years at AED 10,000 basic is 21 × 3 days of daily wage', async ({ page, pageErrors }) => {
    const root = await openTool(page, 'uae-gratuity-calculator');
    await root.getByLabel('Basic monthly salary (AED)').fill('10000');
    await root.getByLabel(/Start date/).fill('2021-01-01');
    await root.getByLabel(/End date/).fill('2023-12-31'); // 1,095 days, both days included = exactly 3 years

    const expected = (10000 / 30) * 21 * 3;
    expect(expected).toBeCloseTo(expectedGratuity(10000, 3), 9);
    await expect(root.getByTestId('gratuity-total')).toHaveText(aed(expected)); // AED 21,000.00
    await expect(root.getByTestId('gratuity-daily-wage')).toHaveText(aed(10000 / 30));
    await expect(root.getByTestId('gratuity-service')).toHaveText('3 years');
    await expect(root.getByTestId('gratuity-band1-days')).toHaveText('63.00');
    await expect(root.getByTestId('gratuity-band2-days')).toHaveText('0.00');
    await expect(root.getByTestId('gratuity-cap-status')).toHaveText('Not reached');
    await expect(root.getByTestId('gratuity-schedule').locator('tbody tr')).toHaveCount(3);
    await expect(root.getByTestId('gratuity-disclaimer')).toContainText('not legal advice');
    await expect(root.getByTestId('gratuity-disclaimer')).toContainText('DIFC');
    expect(pageErrors).toEqual([]);
  });

  test('7 years is 5 × 21 + 2 × 30 days, with a per-band breakdown and schedule', async ({ page }) => {
    const root = await openTool(page, 'uae-gratuity-calculator');
    await root.getByLabel('Basic monthly salary (AED)').fill('10000');
    await enterParts(root, 7);
    const daily = 10000 / 30;
    await expect(root.getByTestId('gratuity-total')).toHaveText(aed(daily * (5 * 21 + 2 * 30))); // AED 55,000.00
    await expect(root.getByTestId('gratuity-band1')).toHaveText(num(daily * 105));
    await expect(root.getByTestId('gratuity-band2')).toHaveText(num(daily * 60));
    await expect(root.getByTestId('gratuity-band2-days')).toHaveText('60.00');
    const rows = root.getByTestId('gratuity-schedule').locator('tbody tr');
    await expect(rows).toHaveCount(7);
    await expect(rows.nth(4)).toContainText('21 d/yr');
    await expect(rows.nth(5)).toContainText('30 d/yr');
    await expect(rows.last()).toContainText(num(daily * 165));

    // Same service entered as dates (2019-01-01 to 2025-12-31 spans two leap days and is still 7 years).
    await root.getByRole('button', { name: 'Start and end dates' }).click();
    await root.getByLabel(/Start date/).fill('2019-01-01');
    await root.getByLabel(/End date/).fill('2025-12-31');
    await expect(root.getByTestId('gratuity-service')).toHaveText('7 years');
    await expect(root.getByTestId('gratuity-total')).toHaveText(aed(expectedGratuity(10000, 7)));

    // Part years are pro-rata: 3 years 6 months at AED 12,345.67 = 21 × 3.5 days.
    await root.getByLabel('Basic monthly salary (AED)').fill('12345.67');
    await enterParts(root, 3, 6);
    await expect(root.getByTestId('gratuity-total')).toHaveText(aed((12345.67 / 30) * 21 * 3.5)); // AED 30,246.89
  });

  test('long service hits the two-year cap', async ({ page }) => {
    const root = await openTool(page, 'uae-gratuity-calculator');
    await root.getByLabel('Basic monthly salary (AED)').fill('10000');
    await enterParts(root, 30);
    const uncapped = (10000 / 30) * (5 * 21 + 25 * 30); // 285,000
    expect(uncapped).toBeGreaterThan(24 * 10000);
    await expect(root.getByTestId('gratuity-total')).toHaveText(aed(24 * 10000)); // AED 240,000.00
    await expect(root.getByTestId('gratuity-cap-status')).toHaveText('Applied');
    await expect(root.getByTestId('gratuity-cap')).toHaveText(num(240000));
    await expect(root.getByTestId('gratuity-schedule').locator('tbody tr').last()).toContainText('(cap)');

    // 25 years is below the cap: 105 + 600 = 705 days.
    await root.getByLabel('Years', { exact: true }).fill('25');
    await expect(root.getByTestId('gratuity-total')).toHaveText(aed(expectedGratuity(10000, 25))); // AED 235,000.00
    await expect(root.getByTestId('gratuity-cap-status')).toHaveText('Not reached');
  });

  test('under one year of service gives no gratuity', async ({ page }) => {
    const root = await openTool(page, 'uae-gratuity-calculator');
    await root.getByLabel('Basic monthly salary (AED)').fill('10000');
    await root.getByLabel(/Start date/).fill('2025-01-01');
    await root.getByLabel(/End date/).fill('2025-12-30'); // 364 days
    await expect(root.getByTestId('gratuity-total')).toHaveText('AED 0.00');
    await expect(root.getByTestId('gratuity-not-eligible')).toBeVisible();
    await expect(root.getByTestId('gratuity-schedule')).toHaveCount(0);

    await root.getByLabel(/End date/).fill('2025-12-31'); // exactly one year
    await expect(root.getByTestId('gratuity-total')).toHaveText(aed(expectedGratuity(10000, 1))); // AED 7,000.00
    await expect(root.getByTestId('gratuity-not-eligible')).toHaveCount(0);
  });

  test('unpaid leave days reduce service and can remove eligibility', async ({ page }) => {
    const root = await openTool(page, 'uae-gratuity-calculator');
    await root.getByLabel('Basic monthly salary (AED)').fill('10000');
    await enterParts(root, 7);
    await root.getByLabel(/Unpaid leave days/).fill('90');
    const years = (7 * 365 - 90) / 365; // 6 years 275 days
    await expect(root.getByTestId('gratuity-service')).toHaveText('6 years, 275 days');
    await expect(root.getByTestId('gratuity-total')).toHaveText(aed(expectedGratuity(10000, years))); // AED 52,534.25

    await enterParts(root, 1);
    await root.getByLabel(/Unpaid leave days/).fill('10');
    await expect(root.getByTestId('gratuity-total')).toHaveText('AED 0.00');
    await expect(root.getByTestId('gratuity-not-eligible')).toBeVisible();

    await root.getByLabel(/Unpaid leave days/).fill('400');
    await expect(root.getByText('Unpaid leave cannot be longer than the service period.')).toBeVisible();
    await expect(root.getByTestId('gratuity-total')).toHaveCount(0);
  });

  test('annualised daily wage and part-time percentage', async ({ page }) => {
    const root = await openTool(page, 'uae-gratuity-calculator');
    await root.getByLabel('Basic monthly salary (AED)').fill('10000');
    await enterParts(root, 3);
    await root.getByText('Advanced options').click();
    await root.getByLabel('Daily wage method').selectOption('annual');
    await expect(root.getByTestId('gratuity-daily-wage')).toHaveText(aed((10000 * 12) / 365)); // AED 328.77
    await expect(root.getByTestId('gratuity-total')).toHaveText(aed(expectedGratuity(10000, 3, 'annual'))); // AED 20,712.33

    await root.getByLabel('Daily wage method').selectOption('thirty');
    await root.getByLabel(/Working hours as % of full time/).fill('50');
    await expect(root.getByTestId('gratuity-total')).toHaveText(aed(expectedGratuity(10000, 3) * 0.5)); // AED 10,500.00
    await root.getByLabel(/Working hours as % of full time/).fill('150');
    await expect(root.getByText('Enter a percentage from 1 to 100.')).toBeVisible();
  });

  test('validates salary and dates', async ({ page }) => {
    const root = await openTool(page, 'uae-gratuity-calculator');
    const salary = root.getByLabel('Basic monthly salary (AED)');
    await salary.fill('');
    await expect(root.getByText('Enter your basic monthly salary.')).toBeVisible();
    await expect(root.getByTestId('gratuity-empty')).toBeVisible();
    await expect(salary).toHaveAttribute('aria-invalid', 'true');
    await salary.fill('0');
    await expect(root.getByText('The basic salary must be greater than 0.')).toBeVisible();
    await salary.fill('-500');
    await expect(root.getByText('The basic salary must be greater than 0.')).toBeVisible();
    await salary.fill('100.555');
    await expect(root.getByText('Use a number with at most 2 decimal places.')).toBeVisible();
    await salary.fill('10000');

    await root.getByLabel(/Start date/).fill('2024-05-01');
    await root.getByLabel(/End date/).fill('2024-04-30');
    await expect(root.getByText('The end date must be after the start date.')).toBeVisible();
    await expect(root.getByLabel(/End date/)).toHaveAttribute('aria-invalid', 'true');
    await expect(root.getByTestId('gratuity-total')).toHaveCount(0);
    await root.getByLabel(/End date/).fill('2024-05-01');
    await expect(root.getByText('The end date must be after the start date.')).toBeVisible();

    await enterParts(root, 2, 12);
    await expect(root.getByText('Enter whole months from 0 to 11.')).toBeVisible();
    await root.getByLabel('Months', { exact: true }).fill('0');
    await root.getByLabel('Years', { exact: true }).fill('0');
    await expect(root.getByText('Enter the length of service.')).toBeVisible();
  });

  test('copy and print the result', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.addInitScript(() => {
      (window as unknown as { printed: number }).printed = 0;
      window.print = () => {
        (window as unknown as { printed: number }).printed += 1;
      };
    });
    const root = await openTool(page, 'uae-gratuity-calculator');
    await root.getByLabel('Basic monthly salary (AED)').fill('10000');
    await enterParts(root, 7);
    await root.getByRole('button', { name: 'Copy result' }).click();
    await expect(root.getByTestId('gratuity-notice')).toHaveText('Copied to clipboard.');
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toContain('Estimated gratuity: AED 55,000.00');
    expect(text).toContain('Daily wage: AED 333.33');
    await root.getByRole('button', { name: 'Print' }).click();
    expect(await page.evaluate(() => (window as unknown as { printed: number }).printed)).toBe(1);
  });
});

// ---------------------------------------------------------------- VAT

/** Independent VAT model in whole fils with half-up rounding. */
const addVat = (netFils: number) => {
  const vat = Math.floor((netFils * 5 + 50) / 100);
  return { net: netFils, vat, gross: netFils + vat };
};
const removeVat = (grossFils: number) => {
  const vat = Math.floor((grossFils * 5 * 2 + 105) / (105 * 2));
  return { net: grossFils - vat, vat, gross: grossFils };
};
const fils = (f: number) => aed(f / 100);

async function expectVat(root: ReturnType<Page['getByTestId']>, testid: string, r: { net: number; vat: number; gross: number }) {
  await expect(root.getByTestId(`${testid}-net`)).toHaveText(fils(r.net));
  await expect(root.getByTestId(`${testid}-vat`)).toHaveText(fils(r.vat));
  await expect(root.getByTestId(`${testid}-gross`)).toHaveText(fils(r.gross));
}

test.describe('uae-vat-calculator', () => {
  test('adds and removes 5% VAT, and add → remove round-trips exactly', async ({ page, pageErrors }) => {
    const root = await openTool(page, 'uae-vat-calculator');
    const amount = root.locator('#vat-amount');
    await root.getByRole('button', { name: 'Add VAT' }).click();
    await amount.fill('100');
    await expectVat(root, 'vat-result', { net: 10000, vat: 500, gross: 10500 });

    await root.getByRole('button', { name: 'Remove VAT' }).click();
    await expect(root.getByLabel('Amount including VAT (AED)')).toBeVisible();
    await amount.fill('105');
    await expectVat(root, 'vat-result', { net: 10000, vat: 500, gross: 10500 });
    await amount.fill('1000');
    await expectVat(root, 'vat-result', removeVat(100000)); // VAT 47.62 = 1000 × 5/105, net 952.38

    for (const net of [95238, 1999, 1, 12345678, 33333]) {
      const added = addVat(net);
      await root.getByRole('button', { name: 'Add VAT' }).click();
      await amount.fill((net / 100).toFixed(2));
      await expectVat(root, 'vat-result', added);
      await root.getByRole('button', { name: 'Remove VAT' }).click();
      await amount.fill((added.gross / 100).toFixed(2));
      await expectVat(root, 'vat-result', { net, vat: added.vat, gross: added.gross });
    }
    expect(pageErrors).toEqual([]);
  });

  test('quantity, reverse from a VAT amount and copy', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const root = await openTool(page, 'uae-vat-calculator');
    await root.getByRole('button', { name: 'Add VAT' }).click();
    await root.locator('#vat-amount').fill('19.99');
    await root.getByLabel('Quantity (optional)').fill('3');
    await expectVat(root, 'vat-result', addVat(1999 * 3)); // 59.97 + 3.00 = 62.97

    await root.getByRole('button', { name: 'From VAT amount' }).click();
    await expect(root.getByLabel('Quantity (optional)')).toHaveCount(0);
    await root.getByLabel('VAT amount (AED)').fill('50');
    await expectVat(root, 'vat-result', { net: 100000, vat: 5000, gross: 105000 });

    await root.getByRole('button', { name: 'Copy' }).click();
    await expect(root.getByTestId('vat-notice')).toHaveText('Copied to clipboard.');
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toContain('Net (excl. VAT): AED 1,000.00');
    expect(text).toContain('Total (incl. VAT): AED 1,050.00');
  });

  test('line items total an invoice with per-line rounding and 0% lines', async ({ page }) => {
    const root = await openTool(page, 'uae-vat-calculator');
    await root.getByRole('button', { name: 'Line items' }).click();
    await root.getByLabel('Line 1 quantity').fill('1');
    await root.getByLabel('Line 1 unit price').fill('100');
    await root.getByLabel('Line 2 quantity').fill('2');
    await root.getByLabel('Line 2 unit price').fill('49.99');
    const l1 = addVat(10000);
    const l2 = addVat(4999 * 2);
    const sum = (...rs: { net: number; vat: number; gross: number }[]) => rs.reduce((t, r) => ({ net: t.net + r.net, vat: t.vat + r.vat, gross: t.gross + r.gross }));
    await expectVat(root, 'vat-lines-total', sum(l1, l2));

    await root.getByRole('button', { name: 'Add line' }).click();
    await expect(root.getByTestId('vat-lines').locator('li')).toHaveCount(3);
    await root.getByLabel('Line 3 unit price').fill('200');
    await root.getByLabel('Line 3 VAT rate').selectOption('0');
    const l3 = { net: 20000, vat: 0, gross: 20000 };
    await expectVat(root, 'vat-lines-total', sum(l1, l2, l3));

    // Prices including VAT: each line is split with 5/105 and rounded separately.
    await root.getByLabel('Unit prices are').selectOption('incl');
    await expectVat(root, 'vat-lines-total', sum(removeVat(10000), removeVat(9998), l3));

    await root.getByLabel('Line 2 unit price').fill('');
    await expect(root.getByTestId('vat-lines-invalid')).toBeVisible();
    await expect(root.getByRole('button', { name: 'Copy' })).toBeDisabled();
    await root.getByRole('button', { name: 'Remove line 2' }).click();
    await expect(root.getByTestId('vat-lines').locator('li')).toHaveCount(2);
    await expectVat(root, 'vat-lines-total', sum(removeVat(10000), l3));
  });

  test('validates amounts and quantity', async ({ page }) => {
    const root = await openTool(page, 'uae-vat-calculator');
    const amount = root.locator('#vat-amount');
    await amount.fill('');
    await expect(root.getByText('Enter the amount.')).toBeVisible();
    await expect(root.getByTestId('vat-empty')).toBeVisible();
    await expect(amount).toHaveAttribute('aria-invalid', 'true');
    await amount.fill('-5');
    await expect(root.getByText('The amount must be greater than 0.')).toBeVisible();
    await amount.fill('0');
    await expect(root.getByText('The amount must be greater than 0.')).toBeVisible();
    await amount.fill('1.234');
    await expect(root.getByText('Use a number with at most 2 decimal places.')).toBeVisible();
    await amount.fill('10');
    await root.getByLabel('Quantity (optional)').fill('0');
    await expect(root.getByText(/whole quantity/)).toBeVisible();
    await root.getByLabel('Quantity (optional)').fill('2.5');
    await expect(root.getByText(/whole quantity/)).toBeVisible();
    await expect(root.getByTestId('vat-result')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------- SEO

test.describe('UAE finance tool pages', () => {
  for (const slug of ['uae-gratuity-calculator', 'uae-vat-calculator']) {
    test(`${slug} has one H1, its title and WebApplication + FAQPage JSON-LD`, async ({ page }) => {
      const tool = getToolBySlug(slug)!;
      await openTool(page, slug);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText(tool.name);
      await expect(page).toHaveTitle(tool.seoTitle);
      const blocks = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((s) => JSON.parse(s));
      const types = blocks.map((b) => b['@type']);
      expect(types).toEqual(expect.arrayContaining(['WebApplication', 'FAQPage']));
      const faq = blocks.find((b) => b['@type'] === 'FAQPage');
      expect(faq.mainEntity).toHaveLength(tool.faqs.length);
      expect(blocks.find((b) => b['@type'] === 'WebApplication').dateModified).toBe('2026-09-25');
      // The tool's own sections use h2/h3 only.
      await expect(page.getByTestId('tool-root').locator('h1')).toHaveCount(0);
      await expect(page.getByTestId('tool-root').locator('h2').first()).toBeVisible();

      const file = path.resolve(process.cwd(), `dist/prerender/resources/utility-tools/${slug}.html`);
      if (fs.existsSync(file)) {
        const html = fs.readFileSync(file, 'utf8');
        expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
        expect(html).toContain(`<title>${tool.seoTitle}</title>`);
        expect(html).toContain('"@type":"WebApplication"');
        expect(html).toContain('"@type":"FAQPage"');
      }
    });
  }
});

// ---------------------------------------------------------------- Mobile layout

test('UAE finance tools have no horizontal overflow at phone width @mobile', async ({ page, pageErrors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const slug of ['uae-gratuity-calculator', 'uae-vat-calculator']) {
    const root = await openTool(page, slug);
    if (slug === 'uae-gratuity-calculator') {
      await root.getByLabel('Basic monthly salary (AED)').fill('9999999.99');
      await enterParts(root, 30, 6, 15);
      await root.getByLabel(/Unpaid leave days/).fill('12');
      await root.getByText('Advanced options').click();
      await expect(root.getByTestId('gratuity-schedule')).toBeVisible();
    } else {
      await root.getByRole('button', { name: 'Line items' }).click();
      await root.getByRole('button', { name: 'Add line' }).click();
      await root.getByLabel('Line 3 unit price').fill('999999999.99');
      await expect(root.getByTestId('vat-lines-total')).toBeVisible();
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
