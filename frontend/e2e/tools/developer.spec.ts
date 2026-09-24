// Developer tools (utility-tools hub): functional checks for each tool's main flow and
// key edge cases (unicode, invalid input, XSS, catastrophic regex), plus a phone-width
// overflow check. Content/SEO fields are covered by ../tools-registry.spec.ts.
import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures';

const DEV_SLUGS = [
  'json-formatter',
  'base64-encoder',
  'url-encoder',
  'regex-tester',
  'uuid-generator',
  'jwt-decoder',
  'sql-formatter',
  'css-formatter',
  'html-formatter',
  'markdown-preview',
];

async function openTool(page: Page, slug: string) {
  await page.goto(`/resources/utility-tools/${slug}`);
  const root = page.getByTestId('tool-root');
  await expect(root.locator('[role="status"]')).toHaveCount(0, { timeout: 15_000 });
  await expect(page.getByTestId('tool-error')).toHaveCount(0);
  return root;
}

const b64url = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');

test.describe('JSON Formatter', () => {
  test('beautifies, minifies, sorts keys and reports errors with a location', async ({ page, pageErrors }) => {
    const root = await openTool(page, 'json-formatter');
    const input = root.getByLabel('JSON input');
    const output = root.locator('#json-output');

    await input.fill('{"b":1,"a":{"d":[1,2],"c":"é ✓"}}');
    await expect(output).toHaveValue('{\n  "b": 1,\n  "a": {\n    "d": [\n      1,\n      2\n    ],\n    "c": "é ✓"\n  }\n}');
    await expect(root.getByTestId('json-valid')).toBeVisible();

    await root.getByLabel('Sort keys A–Z').check();
    await root.getByRole('button', { name: 'Minify', exact: true }).click();
    await expect(output).toHaveValue('{"a":{"c":"é ✓","d":[1,2]},"b":1}');

    await root.getByRole('button', { name: 'Beautify', exact: true }).click();
    await root.getByLabel('Indent').selectOption('tab');
    await expect(output).toHaveValue('{\n\t"a": {\n\t\t"c": "é ✓",\n\t\t"d": [\n\t\t\t1,\n\t\t\t2\n\t\t]\n\t},\n\t"b": 1\n}');

    // Invalid JSON: error with line/column, then string-safe auto-fix.
    await input.fill("{\n  name: 'Ada', // comment\n  url: \"http://example.com/a,b\",\n}");
    const alert = root.getByRole('alert');
    await expect(alert).toContainText('Invalid JSON at line 2');
    await expect(output).toHaveValue('');
    await root.getByRole('button', { name: 'Auto-fix common issues' }).click();
    await expect(alert).toHaveCount(0);
    await expect(output).toHaveValue('{\n\t"name": "Ada",\n\t"url": "http://example.com/a,b"\n}');

    // Empty input clears everything without an error.
    await input.fill('');
    await expect(output).toHaveValue('');
    await expect(root.getByRole('alert')).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  });

  test('opens a .json file and handles large input', async ({ page }) => {
    const root = await openTool(page, 'json-formatter');
    await root.locator('input[type="file"]').setInputFiles({ name: 'data.json', mimeType: 'application/json', buffer: Buffer.from('[1,{"x":true}]') });
    await expect(root.locator('#json-output')).toHaveValue('[\n  1,\n  {\n    "x": true\n  }\n]');

    const big = JSON.stringify(Array.from({ length: 20000 }, (_, i) => ({ id: i, name: `item ${i}` })));
    await root.getByLabel('JSON input').fill(big);
    await expect(root.getByTestId('json-valid')).toBeVisible();
    expect((await root.locator('#json-output').inputValue()).split('\n').length).toBe(20000 * 4 + 2);
  });
});

test.describe('Base64 Encoder', () => {
  test('round-trips unicode text and supports URL-safe output', async ({ page, pageErrors }) => {
    const root = await openTool(page, 'base64-encoder');
    const text = 'héllo ✓ 日本 🚀';
    await root.getByLabel('Text to encode').fill(text);
    const output = root.locator('#b64-output');
    await expect(output).toHaveValue(Buffer.from(text).toString('base64'));

    await root.getByLabel(/URL-safe output/).check();
    await expect(output).toHaveValue(Buffer.from(text).toString('base64url'));

    await root.getByRole('button', { name: 'Swap' }).click();
    await expect(root.getByLabel('Base64 to decode')).toHaveValue(Buffer.from(text).toString('base64url'));
    await expect(root.locator('#b64-output')).toHaveValue(text);

    // Whitespace and missing padding are tolerated.
    await root.getByLabel('Base64 to decode').fill('aMOp bGxv\nIOKckw');
    await expect(root.locator('#b64-output')).toHaveValue('héllo ✓');
    expect(pageErrors).toEqual([]);
  });

  test('explains invalid and binary input, and encodes files', async ({ page }) => {
    const root = await openTool(page, 'base64-encoder');
    await root.getByRole('button', { name: 'Decode from Base64' }).click();
    const input = root.getByLabel('Base64 to decode');
    await input.fill('abc$def');
    await expect(root.getByRole('alert')).toContainText('"$" is not a Base64 character');
    await input.fill('/w==');
    await expect(root.getByRole('alert')).toContainText('not UTF-8 text');
    await expect(root.getByRole('button', { name: 'Download decoded file' })).toBeVisible();

    await root.getByRole('button', { name: 'Encode to Base64' }).click();
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    await root.getByTestId('base64-file').setInputFiles({ name: 'pixel.png', mimeType: 'image/png', buffer: png });
    await expect(root.locator('#b64-output')).toHaveValue(png.toString('base64'));
    await root.getByLabel('Output as data URI').check();
    await expect(root.locator('#b64-output')).toHaveValue(`data:image/png;base64,${png.toString('base64')}`);
  });
});

test.describe('URL Encoder', () => {
  test('encodes and decodes with component, full URL and + modes', async ({ page, pageErrors }) => {
    const root = await openTool(page, 'url-encoder');
    const input = root.getByLabel('Text or URL to encode');
    const output = root.locator('#url-output');
    await input.fill('café & crème?size=large/x');
    await expect(output).toHaveValue(encodeURIComponent('café & crème?size=large/x'));

    await root.getByLabel('Encode as').selectOption('uri');
    await expect(output).toHaveValue(encodeURI('café & crème?size=large/x'));

    await root.getByLabel('Encode as').selectOption('component');
    await root.getByLabel(/Encode spaces as \+/).check();
    await expect(output).toHaveValue('caf%C3%A9+%26+cr%C3%A8me%3Fsize%3Dlarge%2Fx');

    await root.getByRole('button', { name: 'Swap' }).click();
    await expect(output).toHaveValue('café & crème?size=large/x');
    expect(pageErrors).toEqual([]);
  });

  test('reports malformed escapes and lists query parameters', async ({ page }) => {
    const root = await openTool(page, 'url-encoder');
    await root.getByRole('button', { name: 'Decode', exact: true }).click();
    const input = root.getByLabel('Encoded text to decode');
    await input.fill('100%zz');
    await expect(root.getByRole('alert')).toContainText('"%zz" is not a valid percent-escape');

    await input.fill('https://example.com/search?q=caf%C3%A9%20au%20lait&lang=fr#top');
    await expect(root.locator('#url-output')).toHaveValue('https://example.com/search?q=café au lait&lang=fr#top');
    const table = root.getByTestId('url-params');
    await expect(table).toContainText('café au lait');
    await expect(table.locator('tbody tr')).toHaveCount(2);
  });
});

test.describe('Regex Tester', () => {
  test('matches with groups, respects flags and previews replacements', async ({ page, pageErrors }) => {
    const root = await openTool(page, 'regex-tester');
    await root.getByLabel('Regular expression').fill('(\\w+)@(?<domain>\\w+)\\.com');
    await root.getByLabel('Test string').fill('ada@example.com, GRACE@NAVY.COM, bob@test.org');
    const summary = root.getByTestId('regex-summary');
    await expect(summary).toContainText('1 match');
    await expect(root.getByTestId('regex-matches')).toContainText('Group 2 (domain): example');

    await root.getByLabel(/ignore case/).check();
    await expect(summary).toContainText('2 matches');
    await expect(root.getByTestId('regex-flags-display')).toHaveText('/gi');

    await root.getByLabel(/global/).uncheck();
    await expect(summary).toContainText('1 match');
    await expect(summary).toContainText('first match only');
    await root.getByLabel(/global/).check();

    await root.getByLabel('Replace matches').check();
    await root.getByLabel('Replacement').fill('$1 at $<domain>');
    await expect(root.getByTestId('regex-replaced')).toHaveText('ada at example, GRACE at NAVY, bob@test.org');
    expect(pageErrors).toEqual([]);
  });

  test('shows invalid-pattern errors, pastes literals and escapes HTML in highlights', async ({ page, pageErrors }) => {
    const root = await openTool(page, 'regex-tester');
    const pattern = root.getByLabel('Regular expression');
    await pattern.fill('(abc');
    await expect(root.getByRole('alert')).toContainText(/Invalid regular expression|Unterminated group/);

    await pattern.fill('');
    await pattern.fill('/img/gi');
    await expect(pattern).toHaveValue('img');
    await expect(root.getByTestId('regex-flags-display')).toHaveText('/gi');

    await root.getByLabel('Test string').fill('<img src=x onerror="window.__xss=1"> IMG');
    await expect(root.getByTestId('regex-summary')).toContainText('2 matches');
    await expect(root.getByTestId('regex-highlight').locator('img')).toHaveCount(0);
    await expect(root.getByTestId('regex-highlight')).toContainText('<img src=x onerror=');
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
    expect(pageErrors).toEqual([]);
  });

  test('pauses live matching for catastrophic patterns instead of hanging', async ({ page }) => {
    const root = await openTool(page, 'regex-tester');
    await root.getByLabel('Test string').fill(`${'a'.repeat(40)}!`);
    await root.getByLabel('Regular expression').fill('^(a+)+$');
    await expect(root.getByTestId('regex-risky')).toContainText('catastrophic backtracking');
    await expect(root.getByTestId('regex-summary')).toHaveCount(0);
    // The page stays responsive.
    await root.getByLabel('Regular expression').fill('^a+!$');
    await expect(root.getByTestId('regex-summary')).toContainText('1 match');
  });
});

test.describe('UUID Generator', () => {
  test('generates RFC 4122/9562 UUIDs using Web Crypto only', async ({ page, pageErrors }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __rand: number };
      w.__rand = 0;
      const grv = crypto.getRandomValues.bind(crypto);
      crypto.getRandomValues = (<T extends ArrayBufferView | null>(a: T) => {
        w.__rand++;
        return grv(a as never) as T;
      }) as typeof crypto.getRandomValues;
      const ru = crypto.randomUUID.bind(crypto);
      crypto.randomUUID = () => {
        w.__rand++;
        return ru();
      };
    });
    const root = await openTool(page, 'uuid-generator');
    const values = root.getByTestId('uuid-value');
    await expect(values).toHaveCount(5);

    // Math.random must never be used while generating UUIDs.
    await page.evaluate(() => {
      const w = window as unknown as { __mathRandom: () => number };
      w.__mathRandom = Math.random;
      Math.random = () => {
        throw new Error('Math.random must not be used for UUIDs');
      };
    });
    await root.getByLabel(/How many/).fill('200');
    await root.getByRole('button', { name: 'Generate' }).click();
    await expect(values).toHaveCount(200);
    const v4 = await values.allTextContents();
    for (const u of v4) expect(u).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(new Set(v4).size).toBe(200);
    expect(await page.evaluate(() => (window as unknown as { __rand: number }).__rand)).toBeGreaterThanOrEqual(205);

    await root.getByLabel('Version').selectOption('v7');
    await root.getByRole('button', { name: 'Generate' }).click();
    const v7 = await values.allTextContents();
    for (const u of v7) expect(u).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect([...v7].sort()).toEqual(v7);
    const ms = parseInt(v7[0].replace(/-/g, '').slice(0, 12), 16);
    expect(Math.abs(ms - Date.now())).toBeLessThan(60_000);

    await root.getByLabel('Version').selectOption('v1');
    await root.getByLabel(/How many/).fill('3');
    await root.getByRole('button', { name: 'Generate' }).click();
    for (const u of await values.allTextContents()) expect(u).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);

    await root.getByLabel('Uppercase').check();
    await root.getByLabel('Hyphens').uncheck();
    await root.getByLabel(/Braces/).check();
    for (const u of await values.allTextContents()) expect(u).toMatch(/^\{[0-9A-F]{32}\}$/);
    await page.evaluate(() => {
      Math.random = (window as unknown as { __mathRandom: () => number }).__mathRandom;
    });
    expect(pageErrors).toEqual([]);
  });

  test('validates UUIDs and limits the count', async ({ page }) => {
    const root = await openTool(page, 'uuid-generator');
    const check = root.getByLabel('Validate a UUID');
    const result = root.getByTestId('uuid-check-result');
    await check.fill('{0190C9A2-3B4F-7ABC-8DEF-0123456789AB}');
    await expect(result).toContainText('Valid UUID version 7');
    await check.fill('550e8400-e29b-41d4-a716-446655440000');
    await expect(result).toContainText('Valid UUID version 4');
    await check.fill('550e8400-e29b-41d4-c716-446655440000');
    await expect(result).toContainText('variant');
    await check.fill('not-a-uuid');
    await expect(result).toContainText('Not a UUID');

    await root.getByLabel(/How many/).fill('5000');
    await expect(root.getByText(/Enter a whole number from 1 to 1000/)).toBeVisible();
    await root.getByRole('button', { name: 'Generate' }).click();
    await expect(root.getByTestId('uuid-value')).toHaveCount(1000);
  });
});

test.describe('JWT Decoder', () => {
  test('decodes Base64URL header and payload with unicode and states it does not verify signatures', async ({ page, pageErrors }) => {
    const root = await openTool(page, 'jwt-decoder');
    await expect(root.getByTestId('jwt-warning')).toContainText('signature is not verified');

    const payload = { sub: '42', name: 'José ✓ ~~~???>>>', aud: ['api', 'web'], iat: 1_700_000_000, exp: 1_700_003_600 };
    const encoded = b64url(payload);
    expect(encoded).toMatch(/[-_]/); // exercises the URL-safe alphabet
    const token = `${b64url({ alg: 'RS256', typ: 'JWT', kid: 'k1' })}.${encoded}.c2lnbmF0dXJl`;

    await root.getByLabel('Encoded token (JWT)').fill(`Bearer ${token}`);
    await expect(root.getByTestId('jwt-header')).toContainText('"alg": "RS256"');
    await expect(root.getByTestId('jwt-payload')).toContainText('"name": "José ✓ ~~~???>>>"');
    await expect(root.getByTestId('jwt-claims')).toContainText('api, web');
    await expect(root.getByTestId('jwt-claims')).toContainText('2023-11-14T22:13:20.000Z');
    await expect(root.getByTestId('jwt-status')).toContainText('Expired');
    await expect(root.getByRole('heading', { name: /Signature/ })).toContainText('not verified');
    expect(pageErrors).toEqual([]);
  });

  test('explains malformed tokens and flags unsigned ones', async ({ page }) => {
    const root = await openTool(page, 'jwt-decoder');
    const input = root.getByLabel('Encoded token (JWT)');
    await input.fill('abc.def');
    await expect(root.getByRole('alert')).toContainText('has 2');
    await input.fill(`${b64url({ alg: 'HS256' })}.a+b/c.sig`);
    await expect(root.getByRole('alert')).toContainText('payload is not valid Base64URL');
    await input.fill(`${Buffer.from('not json').toString('base64url')}.${b64url({})}.x`);
    await expect(root.getByRole('alert')).toContainText('header decodes to text that is not valid JSON');

    await input.fill(`${b64url({ alg: 'none' })}.${b64url({ sub: '1', exp: Math.floor(Date.now() / 1000) + 3600 })}.`);
    await expect(root.getByText(/This token is unsigned/)).toBeVisible();
    await expect(root.getByTestId('jwt-status')).toContainText('Not expired');

    await root.getByRole('button', { name: 'Load sample' }).click();
    await expect(root.getByTestId('jwt-payload')).toContainText('José Müller ✓');
  });
});

test.describe('SQL Formatter', () => {
  test('formats SQL with dialects and keyword case, and minifies safely', async ({ page, pageErrors }) => {
    const root = await openTool(page, 'sql-formatter');
    const input = root.getByLabel('SQL input');
    const output = root.locator('#sql-output');
    await input.fill("select id, name from users where name = 'a  b' -- note\nand active = 1");
    await expect(output).toHaveValue("SELECT\n  id,\n  name\nFROM\n  users\nWHERE\n  name = 'a  b' -- note\n  AND active = 1");

    await root.getByLabel('Keyword case').selectOption('lower');
    await expect(output).toHaveValue(/^select\n/);

    await root.getByLabel('Minify to one line').check();
    await expect(output).toHaveValue("select id, name from users where name = 'a  b' and active = 1");

    // SQL Server dialect (previously broken) with T-SQL brackets.
    await root.getByLabel('Minify to one line').uncheck();
    await root.getByLabel('Keyword case').selectOption('upper');
    await root.getByLabel('Dialect').selectOption('transactsql');
    await input.fill('select top 5 [first name] from [dbo].[users]');
    await expect(root.getByRole('alert')).toHaveCount(0);
    await expect(output).toHaveValue('SELECT\n  TOP 5 [first name]\nFROM\n  [dbo].[users]');
    expect(pageErrors).toEqual([]);
  });

  test('reports parse errors', async ({ page }) => {
    const root = await openTool(page, 'sql-formatter');
    await root.getByLabel('SQL input').fill("select * from users where name = 'unterminated");
    await expect(root.getByRole('alert')).toContainText('could not be parsed');
    await expect(root.getByRole('alert')).toContainText(/line 1/i);
  });
});

test.describe('CSS Formatter', () => {
  test('beautifies and minifies without breaking selectors, strings or urls', async ({ page, pageErrors }) => {
    const root = await openTool(page, 'css-formatter');
    const input = root.getByLabel('CSS input');
    const output = root.locator('#css-output');
    await input.fill('a:hover,b>i{color:red;background:url(https://x.com/a.png)}.q::after{content:"; {x}"}@media (max-width:600px){.c{width:calc(100% - 2rem)}}');
    await expect(output).toHaveValue(
      [
        'a:hover,',
        'b>i {',
        '  color: red;',
        '  background: url(https://x.com/a.png);',
        '}',
        '',
        '.q::after {',
        '  content: "; {x}";',
        '}',
        '',
        '@media (max-width:600px) {',
        '  .c {',
        '    width: calc(100% - 2rem);',
        '  }',
        '}',
      ].join('\n'),
    );
    await expect(root.getByTestId('css-errors')).toHaveCount(0);

    await root.getByRole('button', { name: 'Minify', exact: true }).click();
    await input.fill('/* note */\na:hover , b > i {\n  color : red ;\n  font-family: "A  B", serif;\n}\n');
    await expect(output).toHaveValue('a:hover,b>i{color:red;font-family:"A  B",serif}');
    expect(pageErrors).toEqual([]);
  });

  test('warns about unbalanced braces', async ({ page }) => {
    const root = await openTool(page, 'css-formatter');
    await root.getByLabel('CSS input').fill('.a{color:red\n.b{margin:0}}}');
    await expect(root.getByTestId('css-errors')).toContainText("unexpected '}'");
  });
});

test.describe('HTML Formatter', () => {
  test('indents nested markup and keeps inline and pre content intact', async ({ page, pageErrors }) => {
    const root = await openTool(page, 'html-formatter');
    const input = root.getByLabel('HTML input');
    const output = root.locator('#html-output');
    await input.fill('<div class="a > b"><p>Hello <b>world</b>!</p><ul><li>One</li><li>Two</li></ul><img src="x.png" alt=""><pre>  a\n   b</pre></div>');
    await expect(output).toHaveValue(
      [
        '<div class="a > b">',
        '  <p>Hello <b>world</b>!</p>',
        '  <ul>',
        '    <li>One</li>',
        '    <li>Two</li>',
        '  </ul>',
        '  <img src="x.png" alt="">',
        '  <pre>  a\n   b</pre>',
        '</div>',
      ].join('\n'),
    );
    await expect(root.getByTestId('html-warnings')).toHaveCount(0);

    await root.getByRole('button', { name: 'Minify', exact: true }).click();
    await input.fill('<div>\n  <!-- c -->\n  <p>\n    Hi <b>there</b> <i>you</i>\n  </p>\n</div>');
    await expect(output).toHaveValue('<div><p>Hi <b>there</b> <i>you</i></p></div>');
    expect(pageErrors).toEqual([]);
  });

  test('flags unclosed and stray tags and does not execute scripts', async ({ page }) => {
    const root = await openTool(page, 'html-formatter');
    await root.getByLabel('HTML input').fill('<section>\n<div><span>x</span>\n</section></em><script>window.__xss=1</script>');
    const warnings = root.getByTestId('html-warnings');
    await expect(warnings).toContainText('<div> is not closed');
    await expect(warnings).toContainText('</em> has no matching opening tag');
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
  });
});

test.describe('Markdown Preview', () => {
  test('keeps a single page H1 and renders GFM', async ({ page, pageErrors }) => {
    const root = await openTool(page, 'markdown-preview');
    const preview = root.getByTestId('md-preview');
    await expect(preview.locator('h2', { hasText: 'Hello World' })).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(preview.locator('table')).toBeVisible();
    await expect(preview.locator('input[type="checkbox"]')).toHaveCount(2);

    // Exported HTML keeps the author's heading levels.
    await root.getByRole('button', { name: 'HTML code' }).click();
    await expect(root.getByLabel('Generated HTML')).toHaveValue(/<h1>Hello World<\/h1>/);
    expect(pageErrors).toEqual([]);
  });

  test('sanitises user HTML so nothing executes', async ({ page, pageErrors }) => {
    const root = await openTool(page, 'markdown-preview');
    await root.getByRole('textbox', { name: 'Markdown' }).fill(
      [
        '# Title',
        '',
        '<img src="x" onerror="window.__xss=1">',
        '',
        '<script>window.__xss=2</script>',
        '',
        '[bad](javascript:window.__xss=3) [good](https://example.com)',
        '',
        '<iframe src="javascript:window.__xss=4"></iframe><a href="JaVaScRiPt:alert(1)" onclick="window.__xss=5">x</a>',
        '',
        '<svg><script>window.__xss=6</script></svg>',
      ].join('\n'),
    );
    const preview = root.getByTestId('md-preview');
    await expect(preview.locator('h2', { hasText: 'Title' })).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(preview.locator('script, iframe, svg, [onerror], [onclick]')).toHaveCount(0);
    await expect(preview.locator('a[href^="javascript" i]')).toHaveCount(0);
    await expect(preview.locator('a[href="https://example.com"]')).toHaveAttribute('rel', /noopener/);
    await preview.getByText('bad').click();
    await preview.getByText('x', { exact: true }).click();
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();

    await root.getByRole('button', { name: 'HTML code' }).click();
    const html = await root.getByLabel('Generated HTML').inputValue();
    expect(html).not.toMatch(/onerror|onclick|<script|javascript:/i);
    expect(pageErrors).toEqual([]);
  });

  test('opens a .md file', async ({ page }) => {
    const root = await openTool(page, 'markdown-preview');
    await root.locator('input[type="file"]').setInputFiles({ name: 'notes.md', mimeType: 'text/markdown', buffer: Buffer.from('## From file\n\n~~old~~ new') });
    await expect(root.getByTestId('md-preview').locator('h3', { hasText: 'From file' })).toBeVisible();
    await expect(root.getByTestId('md-preview').locator('del')).toHaveText('old');
  });
});

test('developer tools have no horizontal overflow at 390px @mobile', async ({ page, pageErrors }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const slug of DEV_SLUGS) {
    const root = await openTool(page, slug);
    await expect(root.locator('input:visible, textarea:visible, button:visible, select:visible').first()).toBeVisible();
    const overflowing = await root.evaluate((el) => {
      const width = document.documentElement.clientWidth;
      return Array.from(el.querySelectorAll<HTMLElement>('*'))
        .filter((n) => {
          // Content inside an element that scrolls on its own (e.g. a wide table) is fine.
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
