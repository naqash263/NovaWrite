// Functional tests for the conversion-tools hub (unit converters and calculators).
// Expected values are derived from exact definitions (1 in = 2.54 cm, 1 lb = 0.45359237 kg,
// 1 US gal = 3.785411784 L, 1 acre = 4046.8564224 m², 1 mph = 1.609344 km/h).
import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures';

const RATES_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

async function openTool(page: Page, slug: string) {
  await page.goto(`/resources/conversion-tools/${slug}`);
  const root = page.getByTestId('tool-root');
  await expect(root).toBeVisible();
  await expect(root.locator('[role="status"]')).toHaveCount(0, { timeout: 15_000 });
  await expect(page.getByTestId('tool-error')).toHaveCount(0);
  return root;
}

/** Sets value/from/to on a shared UnitConverter and returns the result locator. */
async function convert(page: Page, slug: string, value: string, from: string, to: string) {
  const root = await openTool(page, slug);
  await root.getByLabel('From', { exact: true }).selectOption(from);
  await root.getByLabel('To', { exact: true }).selectOption(to);
  await root.getByLabel('Value', { exact: true }).fill(value);
  return root;
}

const result = (root: ReturnType<Page['getByTestId']>) => root.getByTestId('converter-result');

test.describe('length-converter: Length converter', () => {
  test('uses exact inch and foot definitions', async ({ page, pageErrors }) => {
    let root = await convert(page, 'length-converter', '1', 'in', 'cm');
    await expect(result(root)).toHaveText(/^2\.54\s*cm$/);
    await root.getByLabel('From', { exact: true }).selectOption('m');
    await root.getByLabel('To', { exact: true }).selectOption('ft');
    await expect(result(root)).toHaveText(/^3\.28083989501\s*ft$/);
    await expect(root.getByTestId('converter-formula')).toContainText('1 m = 3.28083989501 ft');

    root = await convert(page, 'length-converter', '1.8', 'm', 'ft');
    await expect(root.getByRole('row', { name: /Feet and inches/ })).toContainText('5 ft 10.87 in');
    await expect(root.getByTestId('all-units-table').locator('[data-unit="cm"]')).toHaveText(/^180\s*cm$/);
    expect(pageErrors).toEqual([]);
  });

  test('swap, invalid input and thousands separators', async ({ page }) => {
    const root = await convert(page, 'length-converter', '10', 'km', 'mi');
    await expect(result(root)).toHaveText(/^6\.21371192237\s*mi$/);
    await root.getByRole('button', { name: 'Swap units' }).click();
    await expect(result(root)).toHaveText(/^16\.09344\s*km$/);
    await root.getByLabel('Value', { exact: true }).fill('abc');
    await expect(root.getByTestId('converter-error')).toContainText('valid number');
    await root.getByLabel('Value', { exact: true }).fill('1,000');
    await expect(result(root)).toHaveText(/^1,609\.344\s*km$/);
    await root.getByLabel('Value', { exact: true }).fill('');
    await expect(root.getByTestId('converter-error')).toContainText('Enter a length value');
  });
});

test.describe('weight-converter: Weight converter', () => {
  test('pound is exactly 0.45359237 kg and mixed units are shown', async ({ page }) => {
    let root = await convert(page, 'weight-converter', '1', 'lb', 'kg');
    await expect(result(root)).toHaveText(/^0\.45359237\s*kg$/);
    root = await convert(page, 'weight-converter', '70', 'kg', 'lb');
    await expect(result(root)).toHaveText(/^154\.323583529\s*lb$/);
    await expect(root.getByRole('row', { name: /Stones and pounds/ })).toContainText('11 st 0.32 lb');
    await root.getByLabel('To', { exact: true }).selectOption('oz');
    await root.getByLabel('Value', { exact: true }).fill('1');
    await expect(result(root)).toHaveText(/^35\.2739619496\s*oz$/);
  });
});

test.describe('volume-converter: Volume converter', () => {
  test('US and imperial gallons use exact litre definitions', async ({ page }) => {
    let root = await convert(page, 'volume-converter', '1', 'us-gal', 'l');
    await expect(result(root)).toHaveText(/^3\.785411784\s*L$/);
    root = await convert(page, 'volume-converter', '1', 'uk-gal', 'l');
    await expect(result(root)).toHaveText(/^4\.54609\s*L$/);
    root = await convert(page, 'volume-converter', '1', 'us-cup', 'ml');
    await expect(result(root)).toHaveText(/^236\.5882365\s*mL$/);
    await root.getByRole('button', { name: 'US fl oz → mL' }).click();
    await expect(result(root)).toHaveText(/^29\.5735295625\s*mL$/);
  });
});

test.describe('temperature-converter: Temperature converter', () => {
  test('converts between scales with formulas', async ({ page }) => {
    let root = await convert(page, 'temperature-converter', '100', 'c', 'f');
    await expect(result(root)).toHaveText(/^212\s*°F$/);
    await expect(root.getByTestId('converter-formula')).toContainText('°F = °C × 9/5 + 32');
    await root.getByLabel('Value', { exact: true }).fill('-40');
    await expect(result(root)).toHaveText(/^-40\s*°F$/);
    root = await convert(page, 'temperature-converter', '0', 'k', 'c');
    await expect(result(root)).toHaveText(/^-273\.15\s*°C$/);
    root = await convert(page, 'temperature-converter', '98.6', 'f', 'c');
    await expect(result(root)).toHaveText(/^37\s*°C$/);
  });

  test('rejects temperatures below absolute zero', async ({ page }) => {
    const root = await convert(page, 'temperature-converter', '-500', 'f', 'c');
    await expect(root.getByTestId('converter-error')).toContainText('below absolute zero');
    await expect(result(root)).toHaveCount(0);
    await root.getByLabel('From', { exact: true }).selectOption('k');
    await root.getByLabel('Value', { exact: true }).fill('-1');
    await expect(root.getByTestId('converter-error')).toContainText('below absolute zero');
  });
});

test.describe('area-converter: Area converter', () => {
  test('acre and hectare use exact definitions', async ({ page }) => {
    let root = await convert(page, 'area-converter', '1', 'ac', 'm2');
    await expect(result(root)).toHaveText(/^4,046\.8564224\s*m²$/);
    await root.getByLabel('To', { exact: true }).selectOption('ft2');
    await expect(result(root)).toHaveText(/^43,560\s*ft²$/);
    root = await convert(page, 'area-converter', '1', 'ha', 'ac');
    await expect(result(root)).toHaveText(/^2\.47105381467\s*ac$/);
  });
});

test.describe('speed-converter: Speed converter', () => {
  test('mph and knots use exact definitions', async ({ page }) => {
    let root = await convert(page, 'speed-converter', '1', 'mph', 'kmh');
    await expect(result(root)).toHaveText(/^1\.609344\s*km\/h$/);
    root = await convert(page, 'speed-converter', '1', 'kn', 'kmh');
    await expect(result(root)).toHaveText(/^1\.852\s*km\/h$/);
    root = await convert(page, 'speed-converter', '100', 'kmh', 'mph');
    await expect(result(root)).toHaveText(/^62\.1371192237\s*mph$/);
  });
});

test.describe('file-size-converter: File size converter', () => {
  test('distinguishes decimal (1000) and binary (1024) units', async ({ page }) => {
    let root = await convert(page, 'file-size-converter', '1', 'GB', 'MB');
    await expect(result(root)).toHaveText(/^1,000\s*MB$/);
    root = await convert(page, 'file-size-converter', '1', 'GiB', 'MiB');
    await expect(result(root)).toHaveText(/^1,024\s*MiB$/);
    root = await convert(page, 'file-size-converter', '1', 'TB', 'GiB');
    await expect(result(root)).toHaveText(/^931\.322574615\s*GiB$/);
    root = await convert(page, 'file-size-converter', '100', 'Mbit', 'MB');
    await expect(result(root)).toHaveText(/^12\.5\s*MB$/);
    await expect(root).toContainText('1 KB = 1,000 bytes');
  });
});

test.describe('currency-converter: Currency converter', () => {
  const rates = { base: 'USD', date: '2026-09-23', time_last_updated: 1790121601, rates: { USD: 1, EUR: 0.8, GBP: 0.75, JPY: 150, INR: 88 } };

  test('converts with mocked rates, cross rates and swap', async ({ page, pageErrors }) => {
    let calls = 0;
    await page.route(RATES_URL, (route) => {
      calls += 1;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rates) });
    });
    const root = await openTool(page, 'currency-converter');
    await root.getByLabel('Amount').fill('100');
    await expect(root.getByTestId('currency-result')).toHaveText('80.00 EUR');
    await expect(root.getByTestId('currency-rate')).toContainText('1 USD = 0.8 EUR');
    await expect(root.getByTestId('currency-rate')).toContainText('1 EUR = 1.25 USD');
    await expect(root.getByTestId('currency-asof')).toContainText('2026-09-23');
    // React StrictMode may mount twice in development, so measure from here.
    const initialCalls = calls;

    await root.getByLabel('From', { exact: true }).selectOption('EUR');
    await root.getByLabel('To', { exact: true }).selectOption('GBP');
    await expect(root.getByTestId('currency-result')).toHaveText('93.75 GBP');
    await root.getByRole('button', { name: 'Swap currencies' }).click();
    await expect(root.getByTestId('currency-result')).toHaveText('106.67 EUR');
    await root.getByLabel('To', { exact: true }).selectOption('JPY');
    await expect(root.getByTestId('currency-result')).toHaveText('20,000 JPY');
    // Cross rates come from one table: switching pairs must not refetch.
    expect(calls).toBe(initialCalls);

    await root.getByLabel('To', { exact: true }).selectOption('PKR');
    await expect(root.getByTestId('currency-error')).toContainText('no rate for PKR');
    await root.getByLabel('Amount').fill('-5');
    await root.getByLabel('To', { exact: true }).selectOption('USD');
    await expect(root).toContainText('Enter a positive amount');
    expect(pageErrors).toEqual([]);
  });

  test('shows a clear message and no stale estimate when rates fail, then recovers', async ({ page, pageErrors }) => {
    let fail = true;
    await page.route(RATES_URL, (route) =>
      fail ? route.fulfill({ status: 503, body: 'down' }) : route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rates) }),
    );
    const root = await openTool(page, 'currency-converter');
    await expect(root.getByTestId('currency-error')).toContainText('Live exchange rates are unavailable');
    await expect(root.getByTestId('currency-result')).toHaveCount(0);
    fail = false;
    await root.getByRole('button', { name: 'Try again' }).click();
    await expect(root.getByTestId('currency-result')).toHaveText('0.80 EUR');
    expect(pageErrors).toEqual([]);
  });

  test('handles the stubbed third-party response (204, no JSON) gracefully', async ({ page, pageErrors }) => {
    const root = await openTool(page, 'currency-converter');
    await expect(root.getByTestId('currency-error')).toContainText('Live exchange rates are unavailable');
    await expect(root.getByRole('button', { name: 'Try again' })).toBeEnabled();
    expect(pageErrors).toEqual([]);
  });
});

test.describe('time-zone-converter: Time zone converter', () => {
  async function setup(page: Page, date: string, time: string, from: string, to: string) {
    const root = await openTool(page, 'time-zone-converter');
    await root.getByLabel('From time zone').selectOption(from);
    await root.getByLabel('To time zone').selectOption(to);
    await root.getByLabel('Date').fill(date);
    await root.getByLabel('Time', { exact: true }).fill(time);
    return root;
  }

  test('applies daylight saving for the chosen date', async ({ page }) => {
    // New York is UTC−5 in January (EST) and UTC−4 in July (EDT); India has no DST (UTC+5:30).
    const root = await setup(page, '2026-01-15', '12:00', 'America/New_York', 'Asia/Kolkata');
    await expect(root.getByTestId('tz-result-time')).toHaveText('22:30');
    await expect(root.getByTestId('tz-difference')).toHaveText('10 h 30 min ahead');
    await root.getByLabel('Date').fill('2026-07-15');
    await expect(root.getByTestId('tz-result-time')).toHaveText('21:30');
    await expect(root.getByTestId('tz-difference')).toHaveText('9 h 30 min ahead');
    // US switches on 8 March 2026, UK on 29 March 2026: the gap is 4 h in between.
    await root.getByLabel('To time zone').selectOption('Europe/London');
    await root.getByLabel('Date').fill('2026-03-15');
    await expect(root.getByTestId('tz-result-time')).toHaveText('16:00');
    await root.getByLabel('Date').fill('2026-04-15');
    await expect(root.getByTestId('tz-result-time')).toHaveText('17:00');
  });

  test('shows date changes, swap and DST edge cases', async ({ page }) => {
    const root = await setup(page, '2026-01-15', '20:00', 'America/New_York', 'Asia/Tokyo');
    await expect(root.getByTestId('tz-result-time')).toHaveText('10:00');
    await expect(root.getByTestId('tz-day-shift')).toHaveText('+1 day');
    await expect(root.getByTestId('tz-result-date')).toHaveText('Friday, January 16, 2026');
    await root.getByRole('button', { name: 'Swap time zones' }).click();
    // 20:00 in Tokyo on 15 Jan is 06:00 the same day in New York.
    await expect(root.getByTestId('tz-result-time')).toHaveText('06:00');
    await expect(root.getByTestId('tz-day-shift')).toHaveCount(0);
    await root.getByLabel('Time', { exact: true }).fill('08:00');
    await expect(root.getByTestId('tz-result-time')).toHaveText('18:00');
    await expect(root.getByTestId('tz-day-shift')).toHaveText('-1 day');

    // 02:30 on 8 March 2026 does not exist in New York (clocks jump 02:00 → 03:00).
    await root.getByLabel('From time zone').selectOption('America/New_York');
    await root.getByLabel('To time zone').selectOption('UTC');
    await root.getByLabel('Date').fill('2026-03-08');
    await root.getByLabel('Time', { exact: true }).fill('02:30');
    await expect(root.getByTestId('tz-dst-note')).toContainText('does not exist');
    await expect(root.getByTestId('tz-result-time')).toHaveText('07:30');
    // 01:30 on 1 November 2026 happens twice; the first (EDT, UTC−4) is used.
    await root.getByLabel('Date').fill('2026-11-01');
    await root.getByLabel('Time', { exact: true }).fill('01:30');
    await expect(root.getByTestId('tz-dst-note')).toContainText('happens twice');
    await expect(root.getByTestId('tz-result-time')).toHaveText('05:30');
  });
});

test.describe('date-calculator: Date calculator', () => {
  // A time zone west of UTC exposes the classic "new Date('YYYY-MM-DD')" off-by-one bug.
  test.use({ timezoneId: 'America/Los_Angeles' });

  test('counts days between dates across leap years', async ({ page }) => {
    const root = await openTool(page, 'date-calculator');
    await root.getByLabel('Start date').fill('2024-01-01');
    await root.getByLabel('End date', { exact: true }).fill('2025-01-01');
    await expect(root.getByTestId('date-result')).toHaveText('366 days');
    await expect(root.getByTestId('date-ymd')).toHaveText('1 year');
    await root.getByLabel('Start date').fill('2023-01-01');
    await root.getByLabel('End date', { exact: true }).fill('2024-01-01');
    await expect(root.getByTestId('date-result')).toHaveText('365 days');
    await root.getByLabel('Include end date (add 1 day)').check();
    await expect(root.getByTestId('date-result')).toHaveText('366 days');
    await root.getByLabel('Include end date (add 1 day)').uncheck();
    // Monday 21 Sep 2026 → Monday 28 Sep 2026: 7 days, 5 weekdays.
    await root.getByLabel('Start date').fill('2026-09-21');
    await root.getByLabel('End date', { exact: true }).fill('2026-09-28');
    await expect(root.getByTestId('date-result')).toHaveText('7 days');
    await expect(root.getByTestId('date-weekdays')).toHaveText('5 days');
    await expect(root.getByTestId('date-weeks')).toHaveText('1 week, 0 days');
    // Month-length aware breakdown.
    await root.getByLabel('Start date').fill('2026-01-31');
    await root.getByLabel('End date', { exact: true }).fill('2026-03-01');
    await expect(root.getByTestId('date-result')).toHaveText('29 days');
    await expect(root.getByTestId('date-ymd')).toHaveText('1 month, 1 day');
  });

  test('adds and subtracts days, months and years', async ({ page }) => {
    const root = await openTool(page, 'date-calculator');
    await root.getByRole('button', { name: 'Add or subtract' }).click();
    await root.getByLabel('Start date').fill('2024-02-28');
    await root.getByLabel('Days', { exact: true }).fill('1');
    await expect(root.getByTestId('date-result')).toHaveText('Thursday, February 29, 2024');
    await root.getByLabel('Start date').fill('2023-02-28');
    await expect(root.getByTestId('date-result')).toHaveText('Wednesday, March 1, 2023');
    await root.getByLabel('Start date').fill('2024-01-31');
    await root.getByLabel('Days', { exact: true }).fill('0');
    await root.getByLabel('Months', { exact: true }).fill('1');
    await expect(root.getByTestId('date-iso')).toHaveText('2024-02-29');
    await root.getByLabel('Operation').selectOption('subtract');
    await root.getByLabel('Start date').fill('2024-03-31');
    await expect(root.getByTestId('date-iso')).toHaveText('2024-02-29');
    await root.getByLabel('Months', { exact: true }).fill('0');
    await root.getByLabel('Years', { exact: true }).fill('1');
    await root.getByLabel('Start date').fill('2024-02-29');
    await expect(root.getByTestId('date-iso')).toHaveText('2023-02-28');
    await root.getByLabel('Years', { exact: true }).fill('1.5');
    await expect(root.getByTestId('date-error')).toContainText('whole numbers');
  });

  test('calculates exact age including 29 February birthdays', async ({ page }) => {
    const root = await openTool(page, 'date-calculator');
    await root.getByRole('button', { name: 'Age calculator' }).click();
    await root.getByLabel('Date of birth').fill('2000-02-29');
    await root.getByLabel('Age on date').fill('2026-09-24');
    await expect(root.getByTestId('date-result')).toHaveText('26 years');
    await expect(root.getByTestId('age-exact')).toHaveText('26 years, 6 months, 26 days');
    await root.getByLabel('Age on date').fill('2001-02-28');
    await expect(root.getByTestId('age-exact')).toHaveText('1 year');
    await expect(root.getByTestId('age-next')).toContainText('Today');
    await root.getByLabel('Date of birth').fill('1990-06-15');
    await root.getByLabel('Age on date').fill('2026-06-14');
    await expect(root.getByTestId('age-exact')).toHaveText('35 years, 11 months, 30 days');
    await expect(root.getByTestId('age-next')).toContainText('Monday, June 15, 2026 (in 1 day)');
    await root.getByLabel('Date of birth').fill('2030-01-01');
    await expect(root.getByTestId('date-error')).toContainText('after');
  });
});

test.describe('number-system-converter: Number system converter', () => {
  test('converts between bases exactly, including large numbers', async ({ page }) => {
    const root = await openTool(page, 'number-system-converter');
    const input = root.getByLabel('Number');
    await input.fill('255');
    await expect(root.getByTestId('number-result')).toHaveText('11111111');
    await expect(root.getByTestId('number-table').locator('[data-base="16"]')).toHaveText('FF');
    await expect(root.getByTestId('number-table').locator('[data-base="2"]')).toHaveText('1111 1111');

    await root.getByLabel('From', { exact: true }).selectOption('16');
    await root.getByLabel('To', { exact: true }).selectOption('10');
    await input.fill('0xFF');
    await expect(root.getByTestId('number-result')).toHaveText('255');

    await root.getByLabel('From', { exact: true }).selectOption('10');
    await root.getByLabel('To', { exact: true }).selectOption('16');
    await input.fill('18446744073709551615');
    await expect(root.getByTestId('number-result')).toHaveText('FFFFFFFFFFFFFFFF');
    await root.getByRole('button', { name: 'Swap bases' }).click();
    await expect(input).toHaveValue('FFFFFFFFFFFFFFFF');
    await expect(root.getByTestId('number-result')).toHaveText('18446744073709551615');

    await root.getByLabel('From', { exact: true }).selectOption('10');
    await root.getByLabel('To', { exact: true }).selectOption('2');
    await input.fill('-10');
    await expect(root.getByTestId('number-result')).toHaveText('-1010');
    await root.getByLabel('To', { exact: true }).selectOption('36');
    await input.fill('35');
    await expect(root.getByTestId('number-result')).toHaveText('Z');
  });

  test('rejects digits that are invalid for the base', async ({ page }) => {
    const root = await openTool(page, 'number-system-converter');
    await root.getByLabel('From', { exact: true }).selectOption('2');
    await root.getByLabel('Number').fill('12');
    await expect(root.getByTestId('number-error')).toContainText('“2” is not a valid binary');
    await expect(root.getByTestId('number-result')).toHaveCount(0);
    await root.getByLabel('Number').fill('1.5');
    await expect(root.getByTestId('number-error')).toContainText('whole numbers');
  });
});

test.describe('text-converter: Text converter', () => {
  test('case styles', async ({ page }) => {
    const root = await openTool(page, 'text-converter');
    const input = root.getByLabel('Input text');
    const output = root.getByTestId('text-output');
    await input.fill('hello world. this is great! ok');
    await expect(output).toHaveValue('HELLO WORLD. THIS IS GREAT! OK');
    await root.getByLabel('Case').selectOption('sentence');
    await expect(output).toHaveValue('Hello world. This is great! Ok');
    await root.getByLabel('Case').selectOption('title');
    await expect(output).toHaveValue('Hello World. This Is Great! Ok');
    await input.fill('user profile ID');
    await root.getByLabel('Case').selectOption('camel');
    await expect(output).toHaveValue('userProfileId');
    await root.getByLabel('Case').selectOption('snake');
    await expect(output).toHaveValue('user_profile_id');
    await input.fill('userProfileID');
    await root.getByLabel('Case').selectOption('kebab');
    await expect(output).toHaveValue('user-profile-id');
  });

  test('UTF-8 Base64, URL and binary round-trips with validation', async ({ page, pageErrors }) => {
    const root = await openTool(page, 'text-converter');
    const input = root.getByLabel('Input text');
    const output = root.getByTestId('text-output');
    await root.getByLabel('Conversion type').selectOption('base64');
    await input.fill('héllo 👋');
    await expect(output).toHaveValue('aMOpbGxvIPCfkYs=');
    await root.getByRole('button', { name: 'Use as input' }).click();
    await expect(root.getByRole('button', { name: 'Decode' })).toHaveAttribute('aria-pressed', 'true');
    await expect(output).toHaveValue('héllo 👋');
    await input.fill('@@@');
    await expect(root.getByTestId('text-error')).toContainText('not valid Base64');

    await root.getByLabel('Conversion type').selectOption('url');
    await root.getByRole('button', { name: 'Encode' }).click();
    await input.fill('a b&c=ü');
    await expect(output).toHaveValue('a%20b%26c%3D%C3%BC');
    await root.getByRole('button', { name: 'Decode' }).click();
    await input.fill('100%');
    await expect(root.getByTestId('text-error')).toContainText('not valid URL-encoded');

    await root.getByLabel('Conversion type').selectOption('binary');
    await root.getByRole('button', { name: 'Encode' }).click();
    await input.fill('Aé');
    await expect(output).toHaveValue('01000001 11000011 10101001');
    await root.getByRole('button', { name: 'Decode' }).click();
    await input.fill('01001000 01101001');
    await expect(output).toHaveValue('Hi');
    await input.fill('0102');
    await expect(root.getByTestId('text-error')).toContainText('only 0 and 1');
    expect(pageErrors).toEqual([]);
  });

  test('download produces a text file', async ({ page }) => {
    const root = await openTool(page, 'text-converter');
    await root.getByLabel('Input text').fill('abc');
    const [download] = await Promise.all([page.waitForEvent('download'), root.getByRole('button', { name: 'Download .txt' }).click()]);
    expect(download.suggestedFilename()).toBe('converted-text.txt');
  });
});

test.describe('color-converter: Color converter', () => {
  test('converts HEX, RGB and HSL both ways', async ({ page, pageErrors }) => {
    const root = await openTool(page, 'color-converter');
    const out = (fmt: string) => root.getByTestId('color-outputs').locator(`[data-format="${fmt}"]`);
    await root.getByLabel('HEX color').fill('#F00');
    await expect(out('RGB')).toHaveText('rgb(255, 0, 0)');
    await expect(out('HSL')).toHaveText('hsl(0, 100%, 50%)');
    await expect(out('CMYK')).toHaveText('cmyk(0%, 100%, 100%, 0%)');
    await expect(out('HSV / HSB')).toHaveText('hsv(0, 100%, 100%)');
    await expect(root.getByLabel('Red (0–255)')).toHaveValue('255');

    await root.getByLabel('HEX color').fill('#GG0000');
    await expect(root.getByTestId('hex-help')).toContainText('Enter a 3- or 6-digit hex code');
    await expect(out('HEX')).toHaveText('#FF0000');

    await root.getByLabel('Red (0–255)').fill('0');
    await root.getByLabel('Green (0–255)').fill('128');
    await expect(out('HEX')).toHaveText('#008000');
    await expect(root.getByLabel('HEX color')).toHaveValue('#008000');

    await root.getByLabel('Hue ° (0–360)').fill('240');
    await root.getByLabel('Sat % (0–100)').fill('100');
    await root.getByLabel('Light % (0–100)').fill('50');
    await expect(out('HEX')).toHaveText('#0000FF');
    await expect(root.getByTestId('color-contrast')).toContainText('8.59:1 on white');

    await root.getByLabel('Red (0–255)').fill('300');
    await expect(root).toContainText('Enter a number between 0 and 255');
    expect(pageErrors).toEqual([]);
  });
});

test.describe('percentage-calculator: Percentage calculator', () => {
  test('solves the common percentage problems', async ({ page }) => {
    const root = await openTool(page, 'percentage-calculator');
    const res = root.getByTestId('percent-result');
    await root.getByLabel('Percentage (%)').fill('20');
    await root.getByLabel('Of value').fill('150');
    await expect(res).toHaveText('20% of 150 = 30');

    await root.getByLabel('Calculation').selectOption('what');
    await root.getByLabel('Value (X)').fill('30');
    await root.getByLabel('Total (Y)').fill('120');
    await expect(res).toHaveText('30 is 25% of 120');
    await root.getByLabel('Total (Y)').fill('0');
    await expect(root.getByTestId('percent-error')).toContainText('cannot be zero');

    await root.getByLabel('Calculation').selectOption('change');
    await root.getByLabel('From (old value)').fill('80');
    await root.getByLabel('To (new value)').fill('100');
    await expect(res).toHaveText('From 80 to 100 is a 25% increase');
    await root.getByLabel('To (new value)').fill('60');
    await expect(res).toHaveText('From 80 to 60 is a 25% decrease');

    await root.getByLabel('Calculation').selectOption('decrease');
    await root.getByLabel('Value or original price').fill('80');
    await root.getByLabel('Decrease or discount (%)').fill('25');
    await expect(res).toHaveText('80 decreased by 25% = 60');
    await expect(root).toContainText('You save: 20');

    await root.getByLabel('Calculation').selectOption('reverse');
    await root.getByLabel('Value (X)').fill('45');
    await root.getByLabel('Percentage (%)').fill('75');
    await expect(res).toHaveText('45 is 75% of 60');

    await root.getByLabel('Calculation').selectOption('increase');
    await root.getByLabel('Value', { exact: true }).fill('0.1');
    await root.getByLabel('Increase (%)').fill('200');
    await expect(res).toHaveText('0.1 increased by 200% = 0.3');
  });
});

test.describe('bmi-calculator: BMI calculator', () => {
  test('metric and imperial formulas with WHO categories', async ({ page }) => {
    const root = await openTool(page, 'bmi-calculator');
    await root.getByLabel('Weight (kg)').fill('70');
    await root.getByLabel('Height (cm)').fill('175');
    await expect(root.getByTestId('bmi-value')).toHaveText('22.9');
    await expect(root.getByTestId('bmi-category')).toHaveText('Healthy weight');
    await expect(root.getByTestId('bmi-healthy')).toContainText('56.7 kg – 76.3 kg');

    // Category boundaries use the displayed one-decimal BMI (height 1 m ⇒ BMI = weight).
    await root.getByLabel('Height (cm)').fill('100');
    for (const [kg, bmi, category] of [
      ['18.4', '18.4', 'Underweight'],
      ['18.5', '18.5', 'Healthy weight'],
      ['24.96', '25.0', 'Overweight'],
      ['30', '30.0', 'Obesity class I'],
      ['40', '40.0', 'Obesity class III'],
    ]) {
      await root.getByLabel('Weight (kg)').fill(kg);
      await expect(root.getByTestId('bmi-value')).toHaveText(bmi);
      await expect(root.getByTestId('bmi-category')).toHaveText(category);
    }

    await root.getByLabel('Height (cm)').fill('10');
    await expect(root.getByTestId('bmi-error')).toContainText('between 50 and 280 cm');

    await root.getByRole('button', { name: 'US / Imperial (lb, ft, in)' }).click();
    await root.getByLabel('Weight (lb)').fill('160');
    await root.getByLabel('Height (ft)').fill('5');
    await root.getByLabel('Height (in)').fill('9');
    await expect(root.getByTestId('bmi-value')).toHaveText('23.6');
    await expect(root.getByTestId('bmi-category')).toHaveText('Healthy weight');
    await expect(root.getByTestId('bmi-healthy')).toContainText('125.3 lb – 168.6 lb');
  });

  test('result updates on every keystroke (no stale value)', async ({ page }) => {
    const root = await openTool(page, 'bmi-calculator');
    await root.getByLabel('Height (cm)').fill('180');
    await root.getByLabel('Weight (kg)').pressSequentially('81');
    await expect(root.getByTestId('bmi-value')).toHaveText('25.0');
  });
});

test.describe('conversion-tools (all 15, incl. bmi-calculator) on mobile', () => {
  const slugs = [
    'length-converter',
    'weight-converter',
    'volume-converter',
    'temperature-converter',
    'area-converter',
    'speed-converter',
    'currency-converter',
    'time-zone-converter',
    'date-calculator',
    'number-system-converter',
    'text-converter',
    'color-converter',
    'file-size-converter',
    'percentage-calculator',
    'bmi-calculator',
  ];

  test('no horizontal overflow at phone width @mobile', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route(RATES_URL, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ date: '2026-09-23', rates: { USD: 1, EUR: 0.8 } }) }),
    );
    for (const slug of slugs) {
      const root = await openTool(page, slug);
      const overflowing = await root.evaluate((el) => {
        const width = document.documentElement.clientWidth;
        const clipped = (node: Element) => {
          for (let p = node.parentElement; p && p !== el.parentElement; p = p.parentElement) {
            const o = getComputedStyle(p).overflowX;
            if (o === 'auto' || o === 'scroll' || o === 'hidden') return true;
          }
          return false;
        };
        return Array.from(el.querySelectorAll('*'))
          .filter((n) => {
            const r = n.getBoundingClientRect();
            return r.width > 0 && (r.right > width + 1 || r.left < -1) && !clipped(n);
          })
          .map((n) => `${n.tagName.toLowerCase()}.${String(n.className).slice(0, 60)}`);
      });
      expect(overflowing, `${slug} overflows`).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${slug} page scroll`).toBe(true);
    }
  });
});
