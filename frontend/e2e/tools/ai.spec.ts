// Functional tests for the AI tools batch: text summarizer, article rewriter, grammar checker,
// language translator and keyword extractor. The Laravel AI endpoints are mocked with
// page.route() before navigation, so no request reaches the backend or Google Gemini.
import type { Page, Route } from '@playwright/test';
import { test, expect } from '../fixtures';

type ToolCase = {
  slug: string;
  endpoint: string;
  input: string;
  button: RegExp;
  loadingText: RegExp;
  sample: string;
  response: Record<string, unknown>;
  expected: string;
  copyButton: RegExp;
  max: number;
  /** Text shorter than the minimum (null when the minimum is 1). */
  tooShort: string | null;
};

const LONG_TEXT =
  'Playwright is an open-source framework for end-to-end testing of web applications. It drives Chromium, Firefox and WebKit with a single API. Teams use it to catch regressions before release.';

const cases: ToolCase[] = [
  {
    slug: 'text-summarizer',
    endpoint: '**/api/ai-tools/text-summarizer/summarize',
    input: 'Text to summarize',
    button: /^Generate summary$/,
    loadingText: /Summarizing/,
    sample: LONG_TEXT,
    response: { summary: 'Playwright is an open-source cross-browser testing framework.', original_length: 190, summary_length: 62, compression_ratio: 67.4 },
    expected: 'Playwright is an open-source cross-browser testing framework.',
    copyButton: /^Copy summary$/,
    max: 50000,
    tooShort: 'Too short to summarize.',
  },
  {
    slug: 'article-rewriter',
    endpoint: '**/api/ai-tools/article-rewriter/rewrite',
    input: 'Text to rewrite',
    button: /^Rewrite text$/,
    loadingText: /Rewriting/,
    sample: LONG_TEXT,
    response: { rewritten_text: 'Playwright is a free, open-source tool for testing web apps from start to finish.', word_count_original: 32 },
    expected: 'Playwright is a free, open-source tool for testing web apps from start to finish.',
    copyButton: /^Copy rewritten text$/,
    max: 5000,
    tooShort: 'Too short to rewrite.',
  },
  {
    slug: 'grammar-checker',
    endpoint: '**/api/ai-tools/grammar-checker/check',
    input: 'Text to check',
    button: /^Check grammar$/,
    loadingText: /Checking/,
    sample: 'She have two cat and they is very cute.',
    response: {
      corrected_text: 'She has two cats and they are very cute.',
      errors_found: 3,
      // The model sometimes returns objects; the page must render them, not crash.
      suggestions: ['Use "has" with a singular subject.', { original: 'cat', correction: 'cats' }],
      improvements: ['Consider "adorable" instead of "very cute".'],
    },
    expected: 'She has two cats and they are very cute.',
    copyButton: /^Copy corrected text$/,
    max: 5000,
    tooShort: 'teh cat',
  },
  {
    slug: 'language-translator',
    endpoint: '**/api/ai-tools/language-translator/translate',
    input: 'Text to translate',
    button: /^Translate$/,
    loadingText: /Translating/,
    sample: 'Good morning, how are you?',
    response: { translated_text: 'Buenos días, ¿cómo estás?', source_language: 'English', target_language: 'Spanish' },
    expected: 'Buenos días, ¿cómo estás?',
    copyButton: /^Copy translation$/,
    max: 5000,
    tooShort: null,
  },
  {
    slug: 'keyword-extractor',
    endpoint: '**/api/ai-tools/keyword-extractor/extract',
    input: 'Text to extract keywords from',
    button: /^Extract keywords$/,
    loadingText: /Extracting keywords/,
    sample: 'Playwright testing is reliable. Playwright makes end-to-end testing fast and reliable for web apps.',
    response: { keywords: ['playwright', 'end-to-end testing', 'web apps', 'Keywords: browser automation', 'playwright'], count: 5 },
    expected: 'end-to-end testing',
    copyButton: /^Copy comma-separated$/,
    max: 10000,
    tooShort: 'short',
  },
];

const ok = (data: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });

/** Records request bodies and answers with `respond`. */
async function mockEndpoint(page: Page, glob: string, respond: (route: Route) => Promise<void>) {
  const bodies: unknown[] = [];
  await page.route(glob, async (route) => {
    bodies.push(route.request().postDataJSON());
    await respond(route);
  });
  return bodies;
}

async function openTool(page: Page, slug: string) {
  await page.goto(`/resources/ai-tools/${slug}`);
  await expect(page.locator('h1')).toHaveCount(1);
  return page.getByTestId('tool-root');
}

for (const c of cases) {
  test.describe(`${c.slug}`, () => {
    test(`${c.slug}: shows loading, renders the mocked result and copies it`, async ({ page, context }) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      const bodies = await mockEndpoint(page, c.endpoint, async (route) => {
        await gate;
        await route.fulfill(ok(c.response));
      });
      const root = await openTool(page, c.slug);

      await root.getByLabel(c.input).fill(c.sample);
      await root.getByRole('button', { name: c.button }).click();

      // Loading state while the request is pending.
      await expect(root.getByTestId('ai-loading')).toBeVisible();
      await expect(root.getByRole('button', { name: c.loadingText }).first()).toBeDisabled();
      release();

      await expect(root.getByTestId('ai-result-text')).toContainText(c.expected);
      await expect(root.getByTestId('ai-loading')).toHaveCount(0);
      expect(bodies).toHaveLength(1);
      expect((bodies[0] as { text: string }).text).toBe(c.sample.trim());

      await root.getByRole('button', { name: c.copyButton }).click();
      await expect(root.getByTestId('copy-feedback').first()).toHaveText('Copied to clipboard');
      const clip = await page.evaluate(() => navigator.clipboard.readText());
      expect(clip).toContain(c.expected);
    });

    test(`${c.slug}: empty input shows a validation message and sends no request`, async ({ page }) => {
      const bodies = await mockEndpoint(page, c.endpoint, (route) => route.fulfill(ok(c.response)));
      const root = await openTool(page, c.slug);
      const input = root.getByLabel(c.input);

      await root.getByRole('button', { name: c.button }).click();
      await expect(root.getByRole('alert')).toContainText(/Please enter or paste some text/);
      await expect(input).toHaveAttribute('aria-invalid', 'true');

      await input.fill('   \n  ');
      await root.getByRole('button', { name: c.button }).click();
      await expect(root.getByRole('alert')).toContainText(/Please enter or paste some text/);

      if (c.tooShort) {
        await input.fill(c.tooShort);
        await root.getByRole('button', { name: c.button }).click();
        await expect(root.getByRole('alert')).toContainText(/at least \d+ characters/);
      }
      expect(bodies).toHaveLength(0);
    });

    test(`${c.slug}: 500 and 429 responses show clear messages`, async ({ page }) => {
      let status = 500;
      await mockEndpoint(page, c.endpoint, (route) =>
        route.fulfill({
          status,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: status === 500 ? 'Failed: SQLSTATE[HY000] stack trace' : 'Too Many Attempts.' }),
        }),
      );
      const root = await openTool(page, c.slug);
      await root.getByLabel(c.input).fill(c.sample);

      await root.getByRole('button', { name: c.button }).click();
      const alert = root.getByRole('alert');
      await expect(alert).toContainText('could not process your text right now (server error)');
      await expect(alert).not.toContainText('SQLSTATE');
      await expect(root.getByTestId('ai-result')).toHaveCount(0);
      await expect(root.getByRole('button', { name: c.button })).toBeEnabled();

      status = 429;
      await root.getByRole('button', { name: c.button }).click();
      await expect(alert).toContainText('Too many requests');
      await expect(alert).toContainText('try again');
    });

    test(`${c.slug}: enforces and explains the ${c.max.toLocaleString('en-US')}-character limit`, async ({ page }) => {
      await mockEndpoint(page, c.endpoint, (route) => route.fulfill(ok(c.response)));
      const root = await openTool(page, c.slug);
      const input = root.getByLabel(c.input);
      await expect(root.getByText(`maximum ${c.max.toLocaleString('en-US')}.`)).toBeVisible();

      await input.fill('é'.repeat(c.max + 25));
      await expect(input).toHaveValue('é'.repeat(c.max));
      await expect(root.getByTestId('truncated-notice')).toContainText(`only the first ${c.max.toLocaleString('en-US')} were kept`);
      await expect(root.getByTestId('text-counter')).toContainText(`${c.max.toLocaleString('en-US')} / ${c.max.toLocaleString('en-US')} characters`);
    });
  });
}

test('text-summarizer: sends length and focus options and shows word statistics', async ({ page }) => {
  const bodies = await mockEndpoint(page, '**/api/ai-tools/text-summarizer/summarize', (route) =>
    route.fulfill(ok({ summary: 'Playwright tests web apps in three browsers.' })),
  );
  const root = await openTool(page, 'text-summarizer');
  await root.getByLabel('Summary length').selectOption('short');
  await root.getByLabel('Focus').selectOption('key-points');
  await root.getByLabel('Text to summarize').fill(LONG_TEXT);
  await root.getByLabel('Text to summarize').press('Control+Enter');
  await expect(root.getByTestId('ai-result-text')).toHaveText('Playwright tests web apps in three browsers.');
  expect(bodies[0]).toEqual({ text: LONG_TEXT, length: 'short', focus: 'key-points' });
  await expect(root.getByText('29 words', { exact: true })).toBeVisible();
  await expect(root.getByText('7 words', { exact: true })).toBeVisible();
  await expect(root.getByText('76%', { exact: true })).toBeVisible();

  const download = page.waitForEvent('download');
  await root.getByRole('button', { name: 'Download .txt' }).click();
  expect((await download).suggestedFilename()).toBe('summary.txt');
});

test('article-rewriter: sends style, tone and meaning options; "Use as input" reuses the result', async ({ page }) => {
  const bodies = await mockEndpoint(page, '**/api/ai-tools/article-rewriter/rewrite', (route) =>
    route.fulfill(ok({ rewritten_text: 'A rewritten paragraph about Playwright that is long enough to reuse as input again.' })),
  );
  const root = await openTool(page, 'article-rewriter');
  await root.getByLabel('Writing style').selectOption('academic');
  await root.getByLabel('Tone').selectOption('informative');
  await root.getByLabel('Keep the exact meaning').uncheck();
  await root.getByLabel('Text to rewrite').fill(LONG_TEXT);
  await root.getByRole('button', { name: 'Rewrite text' }).click();
  await expect(root.getByTestId('ai-result-text')).toContainText('A rewritten paragraph');
  expect(bodies[0]).toEqual({ text: LONG_TEXT, style: 'academic', tone: 'informative', preserve_meaning: false });
  await root.getByRole('button', { name: 'Use as input' }).click();
  await expect(root.getByLabel('Text to rewrite')).toHaveValue(/^A rewritten paragraph/);
});

test('grammar-checker: highlights removed and added words and lists suggestions', async ({ page, pageErrors }) => {
  await mockEndpoint(page, '**/api/ai-tools/grammar-checker/check', (route) =>
    route.fulfill(
      ok({
        corrected_text: 'She has two cats and they are very cute.',
        errors_found: '3',
        suggestions: ['Use "has" with a singular subject.', { original: 'cat', correction: 'cats' }],
        improvements: ['Consider "adorable".'],
      }),
    ),
  );
  const root = await openTool(page, 'grammar-checker');
  await root.getByLabel('Text to check').fill('She have two cat and they is very cute.');
  await root.getByRole('button', { name: 'Check grammar' }).click();

  const diff = root.getByTestId('grammar-diff');
  await expect(diff.locator('del')).toHaveText(['removed: have ', 'removed: cat ', 'removed: is ']);
  await expect(diff.locator('ins')).toHaveText(['added: has ', 'added: cats ', 'added: are ']);
  await expect(root.getByTestId('grammar-summary')).toContainText('3 issues reported');
  await expect(root.getByRole('heading', { name: 'Suggestions' })).toBeVisible();
  await expect(root.getByText('cat → cats')).toBeVisible();
  await expect(root.getByText('Consider "adorable".')).toBeVisible();

  await root.getByRole('button', { name: 'Replace my text' }).click();
  await expect(root.getByLabel('Text to check')).toHaveValue('She has two cats and they are very cute.');
  expect(pageErrors).toEqual([]);
});

test('grammar-checker: says so when no changes are needed', async ({ page }) => {
  await mockEndpoint(page, '**/api/ai-tools/grammar-checker/check', (route) =>
    route.fulfill(ok({ corrected_text: 'This sentence is correct.', errors_found: 0, suggestions: [], improvements: [] })),
  );
  const root = await openTool(page, 'grammar-checker');
  await root.getByLabel('Text to check').fill('This sentence is correct.');
  await root.getByRole('button', { name: 'Check grammar' }).click();
  await expect(root.getByTestId('grammar-summary')).toHaveText(/No changes suggested/);
  await expect(root.getByTestId('grammar-diff')).toHaveCount(0);
});

test('language-translator: validates languages, sends options and swaps text back', async ({ page }) => {
  const bodies = await mockEndpoint(page, '**/api/ai-tools/language-translator/translate', (route) =>
    route.fulfill(ok({ translated_text: 'مرحبا بالعالم', source_language: 'English', target_language: 'Arabic' })),
  );
  const root = await openTool(page, 'language-translator');
  const swap = root.getByRole('button', { name: 'Swap languages' });
  await expect(swap).toBeDisabled();

  await root.getByLabel('Translate from').selectOption('English');
  await root.getByLabel('Translate to').selectOption('English');
  await root.getByLabel('Text to translate').fill('Hi');
  await root.getByRole('button', { name: 'Translate' }).click();
  await expect(root.getByRole('alert')).toContainText('source and target languages are the same');
  expect(bodies).toHaveLength(0);

  await root.getByLabel('Translate to').selectOption('Arabic');
  await root.getByLabel('Text to translate').fill('Hello world');
  await root.getByRole('button', { name: 'Translate' }).click();
  await expect(root.getByTestId('ai-result-text')).toHaveText('مرحبا بالعالم');
  await expect(root.getByTestId('ai-result-text')).toHaveAttribute('dir', 'rtl');
  expect(bodies[0]).toEqual({ text: 'Hello world', source_language: 'English', target_language: 'Arabic', preserve_formatting: true });

  await expect(swap).toBeEnabled();
  await swap.click();
  await expect(root.getByLabel('Translate from')).toHaveValue('Arabic');
  await expect(root.getByLabel('Translate to')).toHaveValue('English');
  await expect(root.getByLabel('Text to translate')).toHaveValue('مرحبا بالعالم');
});

test('keyword-extractor: cleans the list, counts occurrences and exports CSV', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const bodies = await mockEndpoint(page, '**/api/ai-tools/keyword-extractor/extract', (route) =>
    route.fulfill(ok({ keywords: ['1. playwright', 'end-to-end testing', 'Keywords: browser automation', 'playwright', 'web apps'] })),
  );
  const root = await openTool(page, 'keyword-extractor');
  await root.getByLabel(/Maximum keywords/).fill('20');
  await expect(root.getByTestId('max-keywords-value')).toHaveText('20');
  await root.getByLabel('Include related keywords and synonyms').check();
  const text = 'Playwright testing is reliable. Playwright makes end-to-end testing fast and reliable for web apps.';
  await root.getByLabel('Text to extract keywords from').fill(text);
  await root.getByRole('button', { name: 'Extract keywords' }).click();

  const rows = root.getByTestId('ai-result-text').locator('tr');
  await expect(rows).toHaveCount(4);
  await expect(rows.nth(0)).toContainText('playwright');
  await expect(rows.nth(0)).toContainText('2×');
  await expect(rows.nth(1)).toContainText('end-to-end testing');
  await expect(rows.nth(1)).toContainText('1×');
  await expect(rows.nth(2)).toContainText('browser automation');
  await expect(rows.nth(2)).toContainText('related');
  expect(bodies[0]).toEqual({ text, maxKeywords: 20, includeRelated: true });

  await root.getByRole('button', { name: 'Copy as list' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('playwright\nend-to-end testing\nbrowser automation\nweb apps');

  const download = page.waitForEvent('download');
  await root.getByRole('button', { name: 'Download CSV' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('keywords.csv');
  const fs = await import('node:fs/promises');
  const csv = await fs.readFile(await file.path(), 'utf8');
  expect(csv.split('\n')[0]).toBe('"keyword","occurrences","density_percent"');
  expect(csv).toContain('"playwright","2",');
});

test('AI tools: network failure shows a connection message', async ({ page }) => {
  await page.route('**/api/ai-tools/text-summarizer/summarize', (route) => route.abort('internetdisconnected'));
  const root = await openTool(page, 'text-summarizer');
  await root.getByLabel('Text to summarize').fill(LONG_TEXT);
  await root.getByRole('button', { name: 'Generate summary' }).click();
  await expect(root.getByRole('alert')).toContainText('Could not reach the AI service');
});

test('AI tools: API key banner and quota status are honest and accessible', async ({ page }) => {
  await page.route('**/api/cv-ai/stats', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { available_requests: 42, total_requests: 100 } }) }),
  );
  await page.goto('/resources/ai-tools/grammar-checker');
  const banner = page.getByTestId('api-key-banner');
  await expect(banner).toContainText('shared, limited quota');
  await expect(banner).not.toContainText(/unlimited|no rate limits/i);
  const toggle = banner.getByRole('button', { name: 'Show steps' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(banner.getByRole('button', { name: 'Hide steps' })).toHaveAttribute('aria-expanded', 'true');
  await expect(banner.getByRole('link', { name: 'Google AI Studio' })).toHaveAttribute('href', 'https://aistudio.google.com/app/apikey');
  await expect(page.getByTestId('api-key-manager')).toContainText('Shared AI requests left today: 42 of 100');
  await expect(page.getByTestId('api-key-manager').getByRole('link', { name: /Log in/ })).toHaveAttribute('href', '/login');
});

test('AI tools: quota status is hidden when stats cannot be loaded', async ({ page }) => {
  // The shared fixture answers /api/cv-ai/stats with { data: [] }.
  await page.goto('/resources/ai-tools/keyword-extractor');
  await expect(page.getByTestId('api-key-manager')).toContainText('free to use while the shared quota lasts');
  await expect(page.getByTestId('api-key-manager')).not.toContainText('left today');
});

test('AI tools have no horizontal overflow at 390px @mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const c of cases) {
    await page.route(c.endpoint, (route) => route.fulfill(ok(c.response)));
  }
  for (const c of cases) {
    const root = await openTool(page, c.slug);
    await root.getByLabel(c.input).fill(c.sample);
    await root.getByRole('button', { name: c.button }).click();
    await expect(root.getByTestId('ai-result-text')).toBeVisible();
    const overflowing = await root.evaluate((el) => {
      const width = document.documentElement.clientWidth;
      return Array.from(el.querySelectorAll<HTMLElement>('*'))
        .filter((n) => {
          const r = n.getBoundingClientRect();
          return r.width > 0 && (r.right > width + 1 || r.left < -1);
        })
        .map((n) => `${n.tagName.toLowerCase()}.${String(n.className).slice(0, 40)}`);
    });
    expect(overflowing, `${c.slug} overflowing elements`).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${c.slug} page scrollWidth`).toBe(true);
  }
});
