// Automation tools (utility-tools hub, developer category): Cron Expression Generator and
// cURL to n8n Converter. Checks the pure logic in src/utils/cron.ts and src/utils/curlToN8n.ts
// through the UI: explanations, per-field validation, next-run times with a frozen clock,
// exact n8n node JSON, the clipboard shape, secret warnings, SEO and phone-width layout.
import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures';
import { getToolBySlug, toolPath } from '../../src/data/tools';

const CRON = 'cron-expression-generator';
const CURL = 'curl-to-n8n-converter';
// Friday 25 September 2026, 10:00:00 UTC (14:00 in Dubai, 15:00 in Karachi).
const NOW = new Date('2026-09-25T10:00:00Z');

async function openTool(page: Page, slug: string) {
  await page.goto(`/resources/utility-tools/${slug}`);
  const root = page.getByTestId('tool-root');
  await expect(root.locator('[role="status"]')).toHaveCount(0, { timeout: 15_000 });
  await expect(page.getByTestId('tool-error')).toHaveCount(0);
  return root;
}

async function runTimes(page: Page) {
  return page.getByTestId('cron-next-runs').locator('time').allTextContents();
}

test.describe('Cron Expression Generator', () => {
  test('explains known expressions in plain English', async ({ page, pageErrors }) => {
    const root = await openTool(page, CRON);
    const input = root.getByLabel('Cron expression', { exact: true });
    const explanation = root.getByTestId('cron-explanation');
    await expect(input).toHaveValue('0 9 * * 1-5');
    await expect(explanation).toHaveText('At 09:00 on Monday through Friday.');

    const cases: [string, string][] = [
      ['*/5 * * * *', 'Every 5 minutes.'],
      ['* * * * *', 'Every minute.'],
      ['0 * * * *', 'At minute 0 past every hour.'],
      ['0 9 * * MON-FRI', 'At 09:00 on Monday through Friday.'],
      ['30 8 1 * *', 'At 08:30 on the 1st of the month.'],
      ['0 9,17 * * *', 'At 09:00 and 17:00.'],
      ['*/15 9-17 * * 1-5', 'Every 15 minutes, between 09:00 and 17:59 on Monday through Friday.'],
      ['0 9-17 * * *', 'Every hour from 09:00 through 17:00.'],
      ['0 */2 * * *', 'At minute 0 past every 2nd hour.'],
      ['5/15 * * * *', 'Every 15 minutes starting at minute 5.'],
      ['0 0 1 1,4,7,10 *', 'At 00:00 on the 1st of the month in January, April, July and October.'],
      ['0 12 * jan-mar mon', 'At 12:00 on Monday in January through March.'],
      ['0 0 * * 7', 'At 00:00 on Sunday.'],
      ['0 22 * * 0-4', 'At 22:00 on Sunday through Thursday.'],
      ['@weekly', 'At 00:00 on Sunday.'],
      ['*/10 * * * * *', 'Every 10 seconds.'],
      ['30 0 9 * * *', 'At 09:00:30.'],
    ];
    for (const [expr, text] of cases) {
      await input.fill(expr);
      await expect(explanation, expr).toHaveText(text);
      await expect(root.getByTestId('cron-error')).toHaveCount(0);
    }

    // 6-field form shows a seconds chip; the breakdown lists every field.
    await expect(root.getByTestId('cron-field-second')).toBeVisible();
    await expect(root.getByTestId('cron-breakdown').locator('tbody tr')).toHaveCount(6);
    await input.fill('0 9 * * 1-5');
    await expect(root.getByTestId('cron-field-second')).toHaveCount(0);
    await expect(root.getByTestId('cron-breakdown').locator('tbody tr').last()).toContainText('Mon, Tue, Wed, Thu, Fri');
    expect(pageErrors).toEqual([]);
  });

  test('validation points at the wrong field', async ({ page }) => {
    const root = await openTool(page, CRON);
    const input = root.getByLabel('Cron expression', { exact: true });
    const cases: [string, string | null, string][] = [
      ['60 * * * *', 'minute', 'Minute "60": 60 is out of range (0–59).'],
      ['0 24 * * *', 'hour', 'Hour "24": 24 is out of range (0–23).'],
      ['0 9 32 * *', 'dayOfMonth', 'Day of month "32": 32 is out of range (1–31).'],
      ['0 9 * 13 *', 'month', 'Month "13": 13 is out of range (1–12).'],
      ['0 9 * * 8', 'dayOfWeek', 'Day of week "8": 8 is out of range (0–7, 0 and 7 are Sunday).'],
      ['0 9 * * MONDAY', 'dayOfWeek', 'unknown name "MONDAY" (use 3-letter names SUN–SAT)'],
      ['0 9 * * 5-1', 'dayOfWeek', 'range "5-1" goes backwards'],
      ['*/0 * * * *', 'minute', 'step in "*/0" must be at least 1'],
      ['0 9 ? * *', 'dayOfMonth', '"?" is Quartz syntax'],
      ['0 0 L * *', 'dayOfMonth', 'is Quartz syntax'],
      ['0 9 * *', null, 'Too few fields: found 4'],
      ['0 0 9 * * * 2026', null, 'Too many fields: found 7'],
    ];
    for (const [expr, field, message] of cases) {
      await input.fill(expr);
      const alert = root.getByTestId('cron-error');
      await expect(alert, expr).toContainText(message);
      await expect(input).toHaveAttribute('aria-invalid', 'true');
      await expect(root.getByTestId('cron-explanation')).toHaveCount(0);
      if (field) {
        await expect(root.getByTestId(`cron-field-${field}`), expr).toHaveAttribute('data-invalid', 'true');
        await expect(root.locator('[data-invalid="true"]'), expr).toHaveCount(1);
      }
    }
    // Two bad fields are both reported.
    await input.fill('61 25 * * *');
    await expect(root.getByTestId('cron-error').locator('li')).toHaveCount(2);
    await expect(root.locator('[data-invalid="true"]')).toHaveCount(2);
  });

  test('builder and presets write the expression', async ({ page }) => {
    const root = await openTool(page, CRON);
    const input = root.getByLabel('Cron expression', { exact: true });
    const mode = root.getByLabel('Run', { exact: true });

    await mode.selectOption('minutes');
    await expect(input).toHaveValue('*/5 * * * *');
    await root.getByLabel('Every … minutes', { exact: true }).selectOption('15');
    await expect(input).toHaveValue('*/15 * * * *');

    await mode.selectOption('hours');
    await root.getByLabel('Every … hours', { exact: true }).selectOption('6');
    await root.getByLabel('At minute', { exact: true }).selectOption('30');
    await expect(input).toHaveValue('30 */6 * * *');
    await expect(root.getByTestId('cron-explanation')).toHaveText('At 00:30, 06:30, 12:30 and 18:30.');

    await mode.selectOption('daily');
    await root.getByLabel('At time', { exact: true }).fill('18:45');
    await expect(input).toHaveValue('45 18 * * *');

    await mode.selectOption('weekly');
    await root.getByRole('checkbox', { name: 'Wed' }).check();
    await root.getByRole('checkbox', { name: 'Fri' }).check();
    await expect(input).toHaveValue('45 18 * * 1,3,5');
    await expect(root.getByTestId('cron-explanation')).toHaveText('At 18:45 on Monday, Wednesday and Friday.');

    await mode.selectOption('monthly');
    await root.getByLabel('Day of month', { exact: true }).selectOption('15');
    await expect(input).toHaveValue('45 18 15 * *');

    await mode.selectOption('yearly');
    await root.getByLabel('Month', { exact: true }).selectOption('3');
    await expect(input).toHaveValue('45 18 15 3 *');
    await expect(root.getByTestId('cron-explanation')).toHaveText('At 18:45 on the 15th of the month in March.');

    await mode.selectOption('weekdays');
    await expect(input).toHaveValue('45 18 * * 1-5');

    await root.getByTestId('cron-preset').filter({ hasText: 'Quarterly' }).click();
    await expect(input).toHaveValue('0 0 1 1,4,7,10 *');
    await expect(root.getByTestId('cron-preset')).toHaveCount(12);
  });

  test('next 10 runs in UTC and Asia/Dubai for a frozen clock', async ({ page }) => {
    await page.clock.setFixedTime(NOW);
    const root = await openTool(page, CRON);
    const input = root.getByLabel('Cron expression', { exact: true });
    const zone = root.getByLabel('Time zone', { exact: true });

    await root.getByRole('button', { name: 'UTC', exact: true }).click();
    await expect(zone).toHaveValue('UTC');
    await input.fill('0 9 * * 1-5');
    await expect.poll(() => runTimes(page)).toEqual([
      'Mon 2026-09-28 09:00',
      'Tue 2026-09-29 09:00',
      'Wed 2026-09-30 09:00',
      'Thu 2026-10-01 09:00',
      'Fri 2026-10-02 09:00',
      'Mon 2026-10-05 09:00',
      'Tue 2026-10-06 09:00',
      'Wed 2026-10-07 09:00',
      'Thu 2026-10-08 09:00',
      'Fri 2026-10-09 09:00',
    ]);
    const first = root.getByTestId('cron-next-runs').locator('li').first();
    await expect(first.locator('time')).toHaveAttribute('datetime', '2026-09-28T09:00:00.000Z');
    await expect(first).toContainText('UTC+00:00');

    await root.getByRole('button', { name: 'Asia/Dubai', exact: true }).click();
    await expect(zone).toHaveValue('Asia/Dubai');
    await expect(first.locator('time')).toHaveText('Mon 2026-09-28 09:00');
    await expect(first.locator('time')).toHaveAttribute('datetime', '2026-09-28T05:00:00.000Z');
    await expect(first).toContainText('UTC+04:00');

    // "Now" is 10:00 UTC = 14:00 in Dubai, so 13:00 is still ahead in UTC but already past in Dubai.
    await input.fill('0 13 * * *');
    await expect.poll(async () => (await runTimes(page)).slice(0, 2)).toEqual(['Sat 2026-09-26 13:00', 'Sun 2026-09-27 13:00']);
    await root.getByRole('button', { name: 'UTC', exact: true }).click();
    await expect.poll(async () => (await runTimes(page)).slice(0, 2)).toEqual(['Fri 2026-09-25 13:00', 'Sat 2026-09-26 13:00']);

    // Any IANA zone from the full list.
    await zone.selectOption('Asia/Karachi');
    await expect(first).toContainText('UTC+05:00');
    // 15:00 in Karachi, so today's 13:00 has passed there too.
    await expect(first.locator('time')).toHaveText('Sat 2026-09-26 13:00');
    await expect(first.locator('time')).toHaveAttribute('datetime', '2026-09-26T08:00:00.000Z');
  });

  test('day-of-month and day-of-week restricted together run on EITHER', async ({ page }) => {
    await page.clock.setFixedTime(NOW);
    const root = await openTool(page, CRON);
    await root.getByRole('button', { name: 'UTC', exact: true }).click();
    const input = root.getByLabel('Cron expression', { exact: true });

    await input.fill('0 0 1,15 * 1');
    await expect(root.getByTestId('cron-explanation')).toHaveText('At 00:00 on the 1st and the 15th of the month or on Monday.');
    await expect(root.getByTestId('cron-or-note')).toBeVisible();
    await expect.poll(() => runTimes(page)).toEqual([
      'Mon 2026-09-28 00:00',
      'Thu 2026-10-01 00:00',
      'Mon 2026-10-05 00:00',
      'Mon 2026-10-12 00:00',
      'Thu 2026-10-15 00:00',
      'Mon 2026-10-19 00:00',
      'Mon 2026-10-26 00:00',
      'Sun 2026-11-01 00:00',
      'Mon 2026-11-02 00:00',
      'Mon 2026-11-09 00:00',
    ]);
    await expect(root.getByTestId('cron-n8n-note')).toHaveCount(0);

    // Only day-of-month restricted: no OR, runs on the 1st only.
    await input.fill('0 0 1 * *');
    await expect(root.getByTestId('cron-or-note')).toHaveCount(0);
    await expect.poll(async () => (await runTimes(page)).slice(0, 3)).toEqual(['Thu 2026-10-01 00:00', 'Sun 2026-11-01 00:00', 'Tue 2026-12-01 00:00']);

    // "*/2" counts as unrestricted in standard cron (AND) but not in n8n's library (OR): warn.
    await input.fill('0 0 */2 * 1');
    await expect.poll(async () => (await runTimes(page)).slice(0, 3)).toEqual(['Mon 2026-10-05 00:00', 'Mon 2026-10-19 00:00', 'Mon 2026-11-09 00:00']);
    await expect(root.getByTestId('cron-n8n-note')).toContainText('next in n8n: Sun 2026-09-27 00:00, Mon 2026-09-28 00:00, Tue 2026-09-29 00:00');
  });

  test('step/range and month-end schedules', async ({ page }) => {
    await page.clock.setFixedTime(NOW);
    const root = await openTool(page, CRON);
    await root.getByRole('button', { name: 'UTC', exact: true }).click();
    const input = root.getByLabel('Cron expression', { exact: true });

    // Now is exactly 10:00:00, so the next run is strictly later.
    await input.fill('*/20 9-10 * * *');
    await expect.poll(() => runTimes(page)).toEqual([
      'Fri 2026-09-25 10:20',
      'Fri 2026-09-25 10:40',
      'Sat 2026-09-26 09:00',
      'Sat 2026-09-26 09:20',
      'Sat 2026-09-26 09:40',
      'Sat 2026-09-26 10:00',
      'Sat 2026-09-26 10:20',
      'Sat 2026-09-26 10:40',
      'Sun 2026-09-27 09:00',
      'Sun 2026-09-27 09:20',
    ]);

    // Day 31 skips months that are shorter.
    await input.fill('0 12 31 * *');
    await expect.poll(() => runTimes(page)).toEqual([
      'Sat 2026-10-31 12:00',
      'Thu 2026-12-31 12:00',
      'Sun 2027-01-31 12:00',
      'Wed 2027-03-31 12:00',
      'Mon 2027-05-31 12:00',
      'Sat 2027-07-31 12:00',
      'Tue 2027-08-31 12:00',
      'Sun 2027-10-31 12:00',
      'Fri 2027-12-31 12:00',
      'Mon 2028-01-31 12:00',
    ]);

    await input.fill('0 0 29 2 *');
    await expect.poll(async () => (await runTimes(page)).slice(0, 2)).toEqual(['Tue 2028-02-29 00:00', 'Sun 2032-02-29 00:00']);

    await input.fill('0 0 30 2 *');
    await expect(root.getByTestId('cron-never')).toBeVisible();
    await expect(root.getByTestId('cron-next-runs')).toHaveCount(0);
  });

  test('copies an n8n Schedule Trigger node and a shareable link', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(`/resources/utility-tools/${CRON}#expr=${encodeURIComponent('*/10 9-17 * * 1-5')}`);
    const root = page.getByTestId('tool-root');
    const input = root.getByLabel('Cron expression', { exact: true });
    await expect(input).toHaveValue('*/10 9-17 * * 1-5');

    const n8n = root.getByTestId('cron-n8n');
    await expect(n8n).toContainText('Custom (Cron)');
    await expect(n8n).toContainText('GENERIC_TIMEZONE');
    await n8n.getByRole('button', { name: 'Copy n8n Schedule Trigger node' }).click();
    await expect(root.getByText('n8n node copied to clipboard.')).toBeVisible();
    const pasted = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
    expect(pasted).toEqual({
      nodes: [
        {
          parameters: { rule: { interval: [{ field: 'cronExpression', expression: '*/10 9-17 * * 1-5' }] } },
          type: 'n8n-nodes-base.scheduleTrigger',
          typeVersion: 1.2,
          position: [0, 0],
          name: 'Schedule Trigger',
        },
      ],
      connections: {},
    });

    await root.getByRole('button', { name: 'Copy link' }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/\/resources\/utility-tools\/cron-expression-generator#expr=\*%2F10%209-17%20\*%20\*%201-5$/);
  });

  test.describe('default time zone', () => {
    test.use({ timezoneId: 'Asia/Karachi' });
    test('defaults to the browser time zone', async ({ page }) => {
      await page.clock.setFixedTime(NOW);
      const root = await openTool(page, CRON);
      await expect(root.getByLabel('Time zone', { exact: true })).toHaveValue('Asia/Karachi');
      await expect(root.getByRole('button', { name: 'Browser: Asia/Karachi' })).toHaveAttribute('aria-pressed', 'true');
      const first = root.getByTestId('cron-next-runs').locator('li').first();
      await expect(first.locator('time')).toHaveText('Mon 2026-09-28 09:00');
      await expect(first).toContainText('UTC+05:00');
    });
  });
});

// ---------------------------------------------------------------------------------------------

const node = (parameters: Record<string, unknown>, name = 'HTTP Request', position = [0, 0]) => ({
  parameters,
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4.2,
  position,
  name,
});

async function convert(page: Page, command: string, mode?: 'credential' | 'placeholder' | 'keep') {
  const root = page.getByTestId('tool-root');
  if (mode) await root.getByLabel('API keys and tokens', { exact: true }).selectOption(mode);
  await root.getByLabel('cURL command(s)', { exact: true }).fill(command);
  const out = root.getByTestId('curl-n8n-output');
  await expect(out).toBeVisible();
  return JSON.parse((await out.textContent()) ?? '');
}

test.describe('cURL to n8n Converter', () => {
  test('GET with headers and query: API key moves to a Header Auth credential', async ({ page, pageErrors }) => {
    await openTool(page, CURL);
    const json = await convert(page, `curl -H "Accept: application/json" -H 'X-API-Key: abc123' "https://api.example.com/v1/users?page=2&per_page=50"`);
    expect(json).toEqual({
      nodes: [
        node({
          method: 'GET',
          url: 'https://api.example.com/v1/users',
          authentication: 'genericCredentialType',
          genericAuthType: 'httpHeaderAuth',
          sendQuery: true,
          queryParameters: {
            parameters: [
              { name: 'page', value: '2' },
              { name: 'per_page', value: '50' },
            ],
          },
          sendHeaders: true,
          headerParameters: { parameters: [{ name: 'Accept', value: 'application/json' }] },
          options: {},
        }),
      ],
      connections: {},
    });
    const root = page.getByTestId('tool-root');
    await expect(root.getByTestId('curl-secret-warning')).toContainText('header X-API-Key');
    await expect(root.getByTestId('curl-notes')).toContainText('Create a "Header Auth" credential with Name "X-API-Key"');
    const summary = root.getByTestId('curl-summary');
    await expect(summary).toContainText('Generic Credential Type → Header Auth');
    await expect(summary).toContainText('page=2, per_page=50');
    // The key stays out of the generated node and the summary.
    expect(await root.getByTestId('curl-n8n-output').textContent()).not.toContain('abc123');
    expect(await summary.textContent()).not.toContain('abc123');
    expect(pageErrors).toEqual([]);
  });

  test('POST JSON with a Bearer token, in every secret mode', async ({ page }) => {
    await openTool(page, CURL);
    const cmd = `curl -X POST https://api.example.com/v1/orders -H 'Content-Type: application/json' -H 'Authorization: Bearer sk_live_123' -d '{"sku":"A-1","qty":2,"gift":false,"tags":["x"]}'`;
    const jsonBody = '{\n  "sku": "A-1",\n  "qty": 2,\n  "gift": false,\n  "tags": [\n    "x"\n  ]\n}';
    const body = { sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody, options: {} };

    expect(await convert(page, cmd)).toEqual({
      nodes: [node({ method: 'POST', url: 'https://api.example.com/v1/orders', authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth', ...body })],
      connections: {},
    });
    const warning = page.getByTestId('curl-secret-warning');
    await expect(warning).toContainText('Secrets detected: header Authorization');
    await expect(warning).toContainText('Store API keys, tokens and passwords in an n8n credential');

    expect(await convert(page, cmd, 'placeholder')).toEqual({
      nodes: [
        node({
          method: 'POST',
          url: 'https://api.example.com/v1/orders',
          sendHeaders: true,
          headerParameters: { parameters: [{ name: 'Authorization', value: 'Bearer YOUR_TOKEN' }] },
          ...body,
        }),
      ],
      connections: {},
    });

    expect(await convert(page, cmd, 'keep')).toEqual({
      nodes: [
        node({
          method: 'POST',
          url: 'https://api.example.com/v1/orders',
          sendHeaders: true,
          headerParameters: { parameters: [{ name: 'Authorization', value: 'Bearer sk_live_123' }] },
          ...body,
        }),
      ],
      connections: {},
    });
    await expect(warning).toContainText('do not share this JSON');
  });

  test('form data, password field warning', async ({ page }) => {
    await openTool(page, CURL);
    const json = await convert(page, `curl https://api.example.com/login -d 'username=ada&password=fake-password' -d remember=1`);
    expect(json.nodes[0].parameters).toEqual({
      method: 'POST',
      url: 'https://api.example.com/login',
      sendBody: true,
      contentType: 'form-urlencoded',
      bodyParameters: {
        parameters: [
          { name: 'username', value: 'ada' },
          { name: 'password', value: 'fake-password' },
          { name: 'remember', value: '1' },
        ],
      },
      options: {},
    });
    await expect(page.getByTestId('curl-secret-warning')).toContainText('body field password');
    await expect(page.getByTestId('curl-summary')).toContainText('Form URL Encoded, 3 fields');
  });

  test('basic auth (-u) and ignored flags', async ({ page }) => {
    await openTool(page, CURL);
    const cmd = 'curl -u fake-user:fake-pass https://example.com/api/status -sSL --compressed';
    expect((await convert(page, cmd)).nodes[0].parameters).toEqual({
      method: 'GET',
      url: 'https://example.com/api/status',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpBasicAuth',
      options: {},
    });
    const notes = page.getByTestId('curl-notes');
    await expect(notes).toContainText('Create a "Basic Auth" credential');
    await expect(notes).toContainText('--compressed ignored');
    await expect(notes).toContainText('-s / --silent ignored');
    await expect(notes).toContainText('-L / --location ignored: the HTTP Request node (typeVersion 4.x) follows redirects by default');
    await expect(page.getByTestId('curl-secret-warning')).toContainText('basic auth (-u)');

    // Keep mode sends the same Authorization header curl would (base64 of "fake-user:fake-pass").
    expect((await convert(page, cmd, 'keep')).nodes[0].parameters).toEqual({
      method: 'GET',
      url: 'https://example.com/api/status',
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'Authorization', value: 'Basic ZmFrZS11c2VyOmZha2UtcGFzcw==' }] },
      options: {},
    });
  });

  test('-G moves data into the query string', async ({ page }) => {
    await openTool(page, CURL);
    const json = await convert(page, `curl -G https://api.example.com/search --data-urlencode "q=n8n cron" -d limit=10`);
    expect(json.nodes[0].parameters).toEqual({
      method: 'GET',
      url: 'https://api.example.com/search',
      sendQuery: true,
      queryParameters: {
        parameters: [
          { name: 'q', value: 'n8n cron' },
          { name: 'limit', value: '10' },
        ],
      },
      options: {},
    });
    await expect(page.getByTestId('curl-secret-warning')).toHaveCount(0);
  });

  test('multipart form with a file field', async ({ page }) => {
    await openTool(page, CURL);
    const json = await convert(page, `curl -F "file=@invoice.pdf" -F 'note=Paid in full' https://api.example.com/upload`);
    expect(json.nodes[0].parameters).toEqual({
      method: 'POST',
      url: 'https://api.example.com/upload',
      sendBody: true,
      contentType: 'multipart-form-data',
      bodyParameters: {
        parameters: [
          { parameterType: 'formBinaryData', name: 'file', inputDataFieldName: 'data' },
          { parameterType: 'formData', name: 'note', value: 'Paid in full' },
        ],
      },
      options: {},
    });
    await expect(page.getByTestId('curl-notes')).toContainText('File fields read binary data from the previous node');
  });

  test('multiline command with continuations and nested quotes', async ({ page }) => {
    await openTool(page, CURL);
    const cmd = [
      `curl 'https://api.stripe.com/v1/charges' \\`,
      `  -u sk_test_4eC39: \\`,
      `  -d amount=2000 \\`,
      `  -d currency=usd \\`,
      `  -d "description=Ada's \\"first\\" charge" \\`,
      `  --data-raw $'memo=line1\\nline2'`,
    ].join('\n');
    expect(await convert(page, cmd)).toEqual({
      nodes: [
        node({
          method: 'POST',
          url: 'https://api.stripe.com/v1/charges',
          authentication: 'genericCredentialType',
          genericAuthType: 'httpBasicAuth',
          sendBody: true,
          contentType: 'form-urlencoded',
          bodyParameters: {
            parameters: [
              { name: 'amount', value: '2000' },
              { name: 'currency', value: 'usd' },
              { name: 'description', value: 'Ada\'s "first" charge' },
              { name: 'memo', value: 'line1\nline2' },
            ],
          },
          options: {},
        }),
      ],
      connections: {},
    });
  });

  test('--json with placeholders, and batch conversion with options', async ({ page }) => {
    await openTool(page, CURL);
    const json = await convert(page, `curl --json '{"text":"hi","n":1}' -H "Authorization: Bearer xoxb-1" https://hooks.example.com/x`, 'placeholder');
    expect(json.nodes[0].parameters).toEqual({
      method: 'POST',
      url: 'https://hooks.example.com/x',
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'Authorization', value: 'Bearer YOUR_TOKEN' },
          { name: 'Accept', value: 'application/json' },
        ],
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: '{\n  "text": "hi",\n  "n": 1\n}',
      options: {},
    });

    const batch = await convert(page, 'curl https://a.example.com/1\ncurl -X DELETE https://a.example.com/2 -k -m 30 | jq .');
    expect(batch).toEqual({
      nodes: [
        node({ method: 'GET', url: 'https://a.example.com/1', options: {} }),
        node({ method: 'DELETE', url: 'https://a.example.com/2', options: { allowUnauthorizedCerts: true, timeout: 30000 } }, 'HTTP Request 2', [240, 0]),
      ],
      connections: {},
    });
    await expect(page.getByTestId('curl-request')).toHaveCount(2);
    await expect(page.getByRole('heading', { name: 'n8n HTTP Request nodes (2)' })).toBeVisible();
  });

  test('copied output is valid JSON in the n8n clipboard shape', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const root = await openTool(page, CURL);
    await root.getByRole('button', { name: 'POST JSON with a Bearer token' }).click();
    await root.getByRole('button', { name: 'Copy n8n node' }).click();
    await expect(root.getByText('Node copied.')).toBeVisible();
    const pasted = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
    expect(Object.keys(pasted).sort()).toEqual(['connections', 'nodes']);
    expect(pasted.connections).toEqual({});
    expect(pasted.nodes).toHaveLength(1);
    const [n] = pasted.nodes;
    expect(Object.keys(n).sort()).toEqual(['name', 'parameters', 'position', 'type', 'typeVersion']);
    expect(n.type).toBe('n8n-nodes-base.httpRequest');
    expect(n.typeVersion).toBeGreaterThanOrEqual(4);
    expect(n.parameters.url).toBe('https://api.example.com/v1/contacts');
    expect(JSON.parse(n.parameters.jsonBody)).toEqual({ email: 'ada@example.com', tags: ['lead'], subscribed: true });
    // The secret never reaches the clipboard in the default (credential) mode.
    expect(JSON.stringify(pasted)).not.toContain('sk_live_REPLACE_ME');
  });

  test('reports parse errors', async ({ page }) => {
    const root = await openTool(page, CURL);
    await root.getByLabel('cURL command(s)', { exact: true }).fill(`curl -H 'Accept: application/json https://x.example.com`);
    await expect(root.getByTestId('curl-error')).toHaveText('A single quote (\') is never closed.');
    await root.getByLabel('cURL command(s)', { exact: true }).fill('wget https://x.example.com');
    await expect(root.getByTestId('curl-error')).toContainText('No curl command found');
    await root.getByLabel('cURL command(s)', { exact: true }).fill('curl -H "Accept: */*"');
    await expect(root.getByTestId('curl-error')).toHaveText('No URL found in the command.');
    await expect(root.getByTestId('curl-n8n-output')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------------------------

test.describe('Automation tool pages', () => {
  for (const slug of [CRON, CURL]) {
    test(`${slug} has one H1, its SEO title, JSON-LD and the automation CTA`, async ({ page }) => {
      const tool = getToolBySlug(slug)!;
      await page.goto(toolPath(tool));
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText(tool.name);
      await expect(page).toHaveTitle(tool.seoTitle);
      await expect(page.getByTestId('tool-root').locator('h1')).toHaveCount(0);
      const types = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((s) => JSON.parse(s)['@type']);
      expect(types).toEqual(expect.arrayContaining(['WebApplication', 'BreadcrumbList', 'FAQPage', 'HowTo']));
      await expect(page.getByTestId('processing-badge')).toContainText('Runs in your browser');
      const cta = page.getByTestId('tool-service-cta');
      await expect(cta).toBeVisible();
      await expect(cta.getByRole('heading', { level: 2 })).toHaveText('Need this inside a real workflow?');
      await expect(cta.getByRole('link', { name: 'See AI & Automation services' })).toHaveAttribute('href', '/services/ai-automation');
    });
  }
});

test('automation tools have no horizontal overflow at 390px @mobile', async ({ page, pageErrors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const slug of [CRON, CURL]) {
    const root = await openTool(page, slug);
    if (slug === CURL) {
      await root.getByRole('button', { name: 'POST JSON with a Bearer token' }).click();
      await expect(root.getByTestId('curl-n8n-output')).toBeVisible();
    } else {
      await root.getByLabel('Cron expression', { exact: true }).fill('*/10 9-17 * * * *');
      await expect(root.getByTestId('cron-next-runs')).toBeVisible();
    }
    const overflowing = await root.evaluate((el) => {
      const width = document.documentElement.clientWidth;
      return Array.from(el.querySelectorAll<HTMLElement>('*'))
        .filter((n) => {
          for (let p = n.parentElement; p && p !== el; p = p.parentElement) {
            if (['auto', 'scroll', 'hidden'].includes(getComputedStyle(p).overflowX)) return false;
          }
          const r = n.getBoundingClientRect();
          return r.width > 0 && (r.right > width + 1 || r.left < -1);
        })
        .map((n) => `${n.tagName.toLowerCase()}.${String(n.className).slice(0, 40)}`);
    });
    expect(overflowing, `${slug} overflowing elements`).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${slug} page scrollWidth`).toBe(true);
  }
  expect(pageErrors).toEqual([]);
});
