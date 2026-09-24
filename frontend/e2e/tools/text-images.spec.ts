// Functional tests for the "text-images" batch of utility tools:
// password, hash, word counter, case converter, lorem ipsum, token counter,
// image resizer / compressor / format converter / WebP converter, colour picker,
// text to image and QR code generator.
import crypto from 'node:crypto';
import fs from 'node:fs';
import zlib from 'node:zlib';
import type { Download, Page } from '@playwright/test';
import { test, expect } from '../fixtures';

const url = (slug: string) => `/resources/utility-tools/${slug}`;

async function openTool(page: Page, slug: string) {
  await page.goto(url(slug));
  const root = page.getByTestId('tool-root');
  await expect(root).toBeVisible();
  await expect(root.locator('[role="status"]')).toHaveCount(0, { timeout: 15_000 });
  await expect(root.locator('button:visible, input:visible, textarea:visible').first()).toBeVisible({ timeout: 15_000 });
  return root;
}

// ---- Minimal PNG encoder for fixtures (RGBA, 8-bit, no interlace) ----
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf: Buffer) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function makePng(width: number, height: number, pixel: (x: number, y: number) => [number, number, number, number]) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    for (let x = 0; x < width; x++) raw.set(pixel(x, y), y * (width * 4 + 1) + 1 + x * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
// Deterministic pseudo-random noise: large as PNG, compresses well as JPEG/WebP.
let seed = 42;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) % 256);
const noisyPng = makePng(240, 160, (x, y) => [(x * 2 + rnd() / 4) & 255, (y * 3 + rnd() / 4) & 255, rnd(), 255]);
const redPng = makePng(20, 20, () => [255, 0, 0, 255]);

const readDownload = async (d: Download) => fs.readFileSync((await d.path())!);

test.describe('password-generator', () => {
  test('uses crypto randomness, honours length, sets and bulk count', async ({ page }) => {
    // If the generator used Math.random, forcing it to a constant would make every password identical.
    await page.addInitScript(() => {
      Math.random = () => 0;
    });
    const root = await openTool(page, 'password-generator');
    const output = root.getByTestId('password-output');
    await expect(output).toHaveValue(/^.{16}$/);
    const first = await output.inputValue();
    await root.getByRole('button', { name: 'Generate' }).click();
    await expect(output).not.toHaveValue(first);

    await root.getByLabel('Password length (number)').fill('32');
    await expect(output).toHaveValue(/^.{32}$/);

    for (const name of ['Uppercase letters (A-Z)', 'Lowercase letters (a-z)', 'Symbols (!@#$%…)']) await root.getByLabel(name).uncheck();
    await expect(output).toHaveValue(/^\d{32}$/);

    await root.getByLabel('Numbers (0-9)').uncheck();
    await expect(root.getByRole('alert')).toContainText('Select at least one character type');
    await expect(root.getByRole('button', { name: 'Generate' })).toBeDisabled();

    await root.getByLabel('Numbers (0-9)').check();
    await root.getByLabel('How many passwords').selectOption('5');
    await expect(root.getByTestId('password-list').locator('li')).toHaveCount(5);
    await expect(root.getByTestId('password-strength')).toContainText('bits');
  });
});

test.describe('hash-generator', () => {
  test('matches known digests for text, unicode and files', async ({ page }) => {
    const root = await openTool(page, 'hash-generator');
    await root.getByLabel('Text to hash').fill('abc');
    await expect(root.getByTestId('hash-MD5')).toHaveText('900150983cd24fb0d6963f7d28e17f72');
    await expect(root.getByTestId('hash-SHA-1')).toHaveText('a9993e364706816aba3e25717850c26c9cd0d89d');
    await expect(root.getByTestId('hash-SHA-256')).toHaveText('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    await expect(root.getByTestId('hash-SHA-384')).toHaveText(crypto.createHash('sha384').update('abc').digest('hex'));
    await expect(root.getByTestId('hash-SHA-512')).toHaveText(crypto.createHash('sha512').update('abc').digest('hex'));

    // Multi-block MD5 + unicode (UTF-8) input.
    const long = `héllo wörld 😀 ${'x'.repeat(200)}`;
    await root.getByLabel('Text to hash').fill(long);
    await expect(root.getByTestId('hash-MD5')).toHaveText(crypto.createHash('md5').update(long, 'utf8').digest('hex'));
    await expect(root.getByTestId('hash-SHA-256')).toHaveText(crypto.createHash('sha256').update(long, 'utf8').digest('hex'));

    // Whitespace-only input is hashed, not ignored.
    await root.getByLabel('Text to hash').fill(' ');
    await expect(root.getByTestId('hash-MD5')).toHaveText(crypto.createHash('md5').update(' ').digest('hex'));

    // Verification.
    await root.getByLabel('Text to hash').fill('abc');
    await root.getByLabel(/Verify against an expected hash/).fill('BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD');
    await expect(root.getByTestId('hash-verify')).toHaveText('Match: the SHA-256 hash is identical.');
    await root.getByLabel(/Verify against an expected hash/).fill('deadbeef');
    await expect(root.getByTestId('hash-verify')).toContainText('No match');

    // File hashing via the keyboard-accessible button.
    await root.getByRole('tab', { name: 'File' }).click();
    const chooser = page.waitForEvent('filechooser');
    await root.getByRole('button', { name: 'Choose file' }).focus();
    await page.keyboard.press('Enter');
    const fileBuf = Buffer.from('file contents\n');
    await (await chooser).setFiles({ name: 'sample.txt', mimeType: 'text/plain', buffer: fileBuf });
    await expect(root.getByTestId('hash-SHA-256')).toHaveText(crypto.createHash('sha256').update(fileBuf).digest('hex'));
    await expect(root.getByTestId('hash-MD5')).toHaveText(crypto.createHash('md5').update(fileBuf).digest('hex'));
  });
});

test.describe('word-counter', () => {
  test('counts words, sentences, paragraphs and unicode characters', async ({ page }) => {
    const root = await openTool(page, 'word-counter');
    await root.getByLabel('Your text').fill("Hello world. Don't stop — it's a test!\n\nSecond paragraph here?");
    await expect(root.getByTestId('stat-words')).toHaveText('10');
    await expect(root.getByTestId('stat-sentences')).toHaveText('3');
    await expect(root.getByTestId('stat-paragraphs')).toHaveText('2');
    await expect(root.getByTestId('stat-lines')).toHaveText('3');

    await root.getByLabel('Your text').fill('😀 hi');
    await expect(root.getByTestId('stat-characters')).toHaveText('4');
    await expect(root.getByTestId('stat-characters-no-spaces')).toHaveText('3');
    await expect(root.getByTestId('stat-words')).toHaveText('1');

    await root.getByLabel('Your text').fill('seo seo seo tools tools and the');
    await expect(root.getByTestId('keyword-list').locator('li').first()).toContainText('seo');
    await expect(root.getByTestId('keyword-list')).not.toContainText('the');

    // Draft survives a reload (local storage), and Clear empties it.
    await page.waitForTimeout(400);
    await page.reload();
    await expect(page.getByLabel('Your text')).toHaveValue('seo seo seo tools tools and the');
    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(page.getByTestId('stat-words')).toHaveText('0');
    await expect(page.getByTestId('stat-reading-time')).toHaveText('0 sec');
  });
});

test.describe('text-case-converter', () => {
  test('converts prose and identifiers correctly', async ({ page }) => {
    const root = await openTool(page, 'text-case-converter');
    const input = root.getByLabel('Text to convert');
    const output = root.getByTestId('case-output');

    await input.fill('the lord of the rings and the return of the king');
    await root.getByRole('button', { name: /^Title Case/ }).click();
    await expect(output).toHaveValue('The Lord of the Rings and the Return of the King');

    await input.fill('hello there. how are you? i am fine!\nnew line');
    await root.getByRole('button', { name: /^Sentence case/ }).click();
    await expect(output).toHaveValue('Hello there. How are you? I am fine!\nNew line');

    await input.fill('parseHTTPResponse now');
    await root.getByRole('button', { name: /^snake_case/ }).click();
    await expect(output).toHaveValue('parse_http_response_now');
    await root.getByRole('button', { name: /^camelCase/ }).click();
    await expect(output).toHaveValue('parseHttpResponseNow');
    await root.getByRole('button', { name: /^kebab-case/ }).click();
    await expect(output).toHaveValue('parse-http-response-now');
    await root.getByRole('button', { name: /^CONSTANT_CASE/ }).click();
    await expect(output).toHaveValue('PARSE_HTTP_RESPONSE_NOW');

    await input.fill('Émile ßtraße');
    await root.getByRole('button', { name: /^UPPER CASE/ }).click();
    await expect(output).toHaveValue('ÉMILE SSTRASSE');

    await input.fill('');
    await expect(output).toHaveValue('');
    await expect(root.getByRole('button', { name: 'Copy' })).toBeDisabled();
  });
});

test.describe('lorem-ipsum-generator', () => {
  test('generates on load and respects unit, count and HTML options', async ({ page }) => {
    const root = await openTool(page, 'lorem-ipsum-generator');
    const output = root.getByTestId('lorem-output');
    await expect(output).toHaveValue(/^Lorem ipsum dolor sit amet, consectetur adipiscing elit\./);
    expect((await output.inputValue()).split('\n\n')).toHaveLength(3);

    await root.getByLabel('Generate', { exact: true }).selectOption('words');
    await root.getByLabel(/How many/).fill('50');
    await expect(root.getByTestId('lorem-stats')).toContainText('50 words');
    await expect(output).toHaveValue(/^Lorem ipsum dolor sit amet/);

    await root.getByLabel('Generate', { exact: true }).selectOption('list');
    await root.getByLabel(/How many/).fill('4');
    await root.getByLabel(/Wrap in HTML tags/).check();
    await expect(output).toHaveValue(/^<ul>\n( {2}<li>.+<\/li>\n){4}<\/ul>$/);

    const download = page.waitForEvent('download');
    await root.getByRole('button', { name: 'Download' }).click();
    expect((await download).suggestedFilename()).toBe('lorem-ipsum.html');
  });
});

test.describe('token-counter', () => {
  test('estimates tokens, context usage and cost, and is labelled as an estimate', async ({ page }) => {
    const root = await openTool(page, 'token-counter');
    await expect(root.getByTestId('token-count')).toHaveText('≈ 0');
    await expect(root).toContainText('This is an estimate, not an exact tokenizer');

    await root.getByLabel('Prompt or text').fill('Hello world');
    await expect(root.getByTestId('token-count')).toHaveText('≈ 2');
    await root.getByLabel('Prompt or text').fill('The quick brown fox jumps over the lazy dog.');
    await expect(root.getByTestId('token-count')).toHaveText('≈ 10');
    await expect(root.getByTestId('token-words')).toHaveText('9');

    await root.getByLabel('Prompt or text').fill('word '.repeat(2000));
    await root.getByRole('button', { name: '8K', exact: true }).click();
    await expect(root.getByTestId('token-context-usage')).toContainText('25.0% of the context window');

    await root.getByLabel(/price per 1M input tokens/).fill('3');
    await expect(root.getByTestId('token-cost')).toHaveText('Estimated input cost: $0.006003');
  });
});

test.describe('image-resizer', () => {
  test('resizes with aspect lock and downloads with the new size in the name', async ({ page }) => {
    const root = await openTool(page, 'image-resizer');
    await root.getByTestId('image-file-input').setInputFiles({ name: 'photo.png', mimeType: 'image/png', buffer: noisyPng });
    await expect(root).toContainText('240×160px');
    await root.getByLabel('Width (px)').fill('120');
    await expect(root.getByLabel('Height (px)')).toHaveValue('80');
    await expect(root.getByTestId('resize-result')).toContainText('120×80px');

    await root.getByLabel('Social media size').selectOption('ig-square');
    await expect(root.getByTestId('resize-result')).toContainText('1080×1080px');
    await expect(root.getByLabel('Crop to fill')).toBeChecked();

    await root.getByRole('button', { name: '50%', exact: true }).click();
    await root.getByLabel('Format').selectOption('jpeg');
    await expect(root.getByTestId('resize-result')).toContainText('120×80px · JPG');
    const download = page.waitForEvent('download');
    await root.getByRole('button', { name: 'Download' }).click();
    const d = await download;
    expect(d.suggestedFilename()).toBe('photo-120x80.jpg');
    const bytes = await readDownload(d);
    expect(bytes.subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
  });

  test('rejects non-image files with a message', async ({ page }) => {
    const root = await openTool(page, 'image-resizer');
    await root.getByTestId('image-file-input').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hi') });
    await expect(root.getByRole('alert')).toContainText('Please choose an image file');
  });
});

test.describe('image-compressor', () => {
  test('file picker is keyboard accessible and compression shrinks the file', async ({ page }) => {
    const root = await openTool(page, 'image-compressor');
    const chooser = page.waitForEvent('filechooser');
    await root.getByRole('button', { name: 'Choose images' }).focus();
    await page.keyboard.press('Enter');
    await (await chooser).setFiles([
      { name: 'noise.png', mimeType: 'image/png', buffer: noisyPng },
      { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('x') },
    ]);
    await expect(root.getByRole('alert')).toContainText('1 file(s) skipped');
    await root.getByLabel('Output format').selectOption('jpeg');
    await expect(root.getByTestId('compress-result')).toContainText('smaller');
    await expect(root.getByTestId('compress-summary')).toContainText('1 of 1 compressed');

    const download = page.waitForEvent('download');
    await root.getByRole('button', { name: /^Download noise-compressed\.jpg$/ }).click();
    const d = await download;
    expect(d.suggestedFilename()).toBe('noise-compressed.jpg');
    expect((await readDownload(d)).length).toBeLessThan(noisyPng.length);
  });

  test('keeps the original when re-encoding would make it bigger', async ({ page }) => {
    const root = await openTool(page, 'image-compressor');
    await root.getByTestId('image-file-input').setInputFiles({ name: 'red.png', mimeType: 'image/png', buffer: redPng });
    await expect(root.getByTestId('compress-result')).toContainText(/original kept|smaller/);
  });
});

test.describe('image-format-converter', () => {
  test('creates a real BMP and JPG with correct names', async ({ page }) => {
    const root = await openTool(page, 'image-format-converter');
    await root.getByTestId('image-file-input').setInputFiles({ name: 'my.photo.png', mimeType: 'image/png', buffer: redPng });
    await root.getByRole('button', { name: 'BMP', exact: true }).click();
    await expect(root.getByTestId('convert-result')).toContainText('my.photo.bmp');
    let download = page.waitForEvent('download');
    await root.getByRole('button', { name: 'Download my.photo.bmp' }).click();
    const bmp = await readDownload(await download);
    expect(bmp.subarray(0, 2).toString('ascii')).toBe('BM');
    expect(bmp.readInt32LE(18)).toBe(20);
    expect(bmp.length).toBe(54 + 60 * 20);
    // Bottom-up BGR: first pixel is red (0,0,255 in BGR order).
    expect([...bmp.subarray(54, 57)]).toEqual([0, 0, 255]);

    await root.getByRole('button', { name: 'JPG / JPEG' }).click();
    await expect(root.getByTestId('convert-result')).toContainText('my.photo.jpg');
    download = page.waitForEvent('download');
    await root.getByRole('button', { name: 'Download my.photo.jpg' }).click();
    const jpg = await readDownload(await download);
    expect(jpg.subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
  });
});

test.describe('webp-converter', () => {
  test('converts in the browser without any upload request', async ({ page }) => {
    const uploads: string[] = [];
    page.on('request', (r) => {
      if (r.method() === 'POST' && /convert|upload|webp/i.test(r.url())) uploads.push(r.url());
    });
    const root = await openTool(page, 'webp-converter');
    await root.getByTestId('image-file-input').setInputFiles([
      { name: 'a.png', mimeType: 'image/png', buffer: noisyPng },
      { name: 'b.png', mimeType: 'image/png', buffer: noisyPng },
    ]);
    await expect(root.getByTestId('webp-result')).toHaveCount(2);
    await expect(root.getByTestId('webp-summary')).toContainText('2 of 2 converted');
    const download = page.waitForEvent('download');
    await root.getByRole('button', { name: 'Download a.webp' }).click();
    const bytes = await readDownload(await download);
    expect(bytes.subarray(0, 4).toString('ascii')).toBe('RIFF');
    expect(bytes.subarray(8, 12).toString('ascii')).toBe('WEBP');
    expect(uploads).toEqual([]);
  });
});

test.describe('color-picker', () => {
  test('converts between formats, checks contrast and picks from an image', async ({ page }) => {
    const root = await openTool(page, 'color-picker');
    await root.getByLabel('HEX', { exact: true }).fill('#ff0000');
    await expect(root.getByTestId('color-rgb')).toHaveText('rgb(255, 0, 0)');
    await expect(root.getByTestId('color-hsl')).toHaveText('hsl(0, 100%, 50%)');
    await expect(root.getByTestId('color-cmyk')).toHaveText('cmyk(0%, 100%, 100%, 0%)');

    await root.getByLabel('HEX', { exact: true }).fill('#09f');
    await expect(root.getByTestId('color-rgb')).toHaveText('rgb(0, 153, 255)');
    await expect(root.getByLabel('HEX', { exact: true })).toHaveValue('#09f');

    await root.getByLabel('HEX', { exact: true }).fill('#zzz');
    await expect(root).toContainText('Enter 3 or 6 hex digits');

    await root.getByLabel('H (°)').fill('120');
    await expect(root.getByTestId('color-hex')).toHaveText('#00FF00');

    await root.getByLabel('HEX', { exact: true }).fill('#000000');
    await expect(root.getByTestId('contrast-white')).toHaveText('21.00:1');

    await root.getByTestId('image-file-input').setInputFiles({ name: 'red.png', mimeType: 'image/png', buffer: redPng });
    await expect(root.getByTestId('image-palette').getByRole('button').first()).toHaveAccessibleName('Use image colour #ff0000');
    await root.getByTestId('color-image-canvas').click({ position: { x: 5, y: 5 } });
    await expect(root.getByTestId('color-hex')).toHaveText('#FF0000');

    await root.getByRole('button', { name: /^Use shade/ }).first().click();
    await expect(root.getByTestId('color-hex')).not.toHaveText('#FF0000');
  });
});

test.describe('text-to-image', () => {
  test('renders at the chosen size and downloads PNG/JPG', async ({ page }) => {
    const root = await openTool(page, 'text-to-image');
    const preview = root.getByTestId('tti-preview');
    await expect(preview).toBeVisible();
    await expect.poll(() => preview.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1200);

    await root.getByRole('button', { name: 'Instagram Post' }).click();
    await expect.poll(() => preview.evaluate((img: HTMLImageElement) => `${img.naturalWidth}x${img.naturalHeight}`)).toBe('1080x1080');

    await root.getByLabel('Width (px)').fill('99999');
    await root.getByLabel('Width (px)').blur();
    await expect(root.getByLabel('Width (px)')).toHaveValue('5000');

    await root.getByRole('button', { name: 'Instagram Post' }).click();
    const download = page.waitForEvent('download');
    await root.getByRole('button', { name: 'Download JPG' }).click();
    const d = await download;
    expect(d.suggestedFilename()).toBe('text-image-1080x1080.jpg');
    expect((await readDownload(d)).subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));

    await root.getByLabel('Use Background Image').check();
    await root.getByTestId('image-file-input').setInputFiles({ name: 'bg.png', mimeType: 'image/png', buffer: noisyPng });
    await expect(root.getByAltText('Background preview')).toBeVisible();

    await root.getByLabel('Heading Text').fill('');
    await root.getByLabel('Summary/Description Text').fill('');
    await expect(preview).toHaveCount(0);
    await expect(root.getByRole('button', { name: 'Download PNG' })).toHaveCount(0);
  });

  test('HTML mode does not execute markup', async ({ page, pageErrors }) => {
    const root = await openTool(page, 'text-to-image');
    await root.getByLabel('HTML Mode').check();
    await page.evaluate(() => ((window as unknown as { __xss: number }).__xss = 0));
    await root.getByLabel('Summary/Description Text').fill('<b>Bold</b> <img src=x onerror="window.__xss=1">');
    await expect(root.getByTestId('tti-preview')).toBeVisible();
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => (window as unknown as { __xss: number }).__xss)).toBe(0);
    expect(pageErrors).toEqual([]);
  });
});

test.describe('qr-code-generator', () => {
  test('builds escaped Wi-Fi payloads, reports oversize data and exports SVG', async ({ page }) => {
    const root = await openTool(page, 'qr-code-generator');
    await expect(root.getByTestId('qr-image')).toBeVisible();

    await root.getByRole('button', { name: 'Wi-Fi' }).click();
    await root.getByLabel('Network name (SSID)').fill('My;Net');
    await root.getByLabel('Password').fill('pa:ss"');
    await expect(root.getByTestId('qr-payload')).toHaveText('WIFI:T:WPA;S:My\\;Net;P:pa\\:ss\\";;');
    await expect(root.getByTestId('qr-image')).toBeVisible();

    await root.getByRole('button', { name: 'Contact (vCard)' }).click();
    await root.getByLabel('First name').fill('Ada');
    await root.getByLabel('Last name').fill('Lovelace');
    await root.getByLabel('Company').fill('Analytical, Ltd');
    await expect(root.getByTestId('qr-payload')).toContainText('N:Lovelace;Ada;;;');
    await expect(root.getByTestId('qr-payload')).toContainText('ORG:Analytical\\, Ltd');

    const svgDownload = page.waitForEvent('download');
    await root.getByRole('button', { name: 'Download SVG' }).click();
    const svg = (await readDownload(await svgDownload)).toString('utf8');
    expect(svg).toContain('<svg');

    await root.getByRole('button', { name: 'URL / Text' }).click();
    await root.getByLabel('Error correction').selectOption('H');
    await root.getByLabel('Website URL or text').fill('x'.repeat(3000));
    await expect(root.getByRole('alert')).toContainText('too long');
    await expect(root.getByTestId('qr-image')).toHaveCount(0);

    await root.getByLabel('Website URL or text').fill('https://example.com');
    await root.locator('#qr-dark').fill('#ffffff');
    await root.locator('#qr-light').fill('#000000');
    await expect(root.getByTestId('qr-contrast-warning')).toContainText('Light-on-dark');
  });
});

test.describe('Text and image tools on phones', () => {
  const slugs = [
    'password-generator',
    'hash-generator',
    'word-counter',
    'text-case-converter',
    'lorem-ipsum-generator',
    'token-counter',
    'image-resizer',
    'image-compressor',
    'image-format-converter',
    'webp-converter',
    'color-picker',
    'text-to-image',
    'qr-code-generator',
  ];
  for (const slug of slugs) {
    test(`${slug} has no horizontal overflow at 390px @mobile`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      const root = await openTool(page, slug);
      if (['image-resizer', 'image-compressor', 'image-format-converter', 'webp-converter'].includes(slug)) {
        await root.getByTestId('image-file-input').setInputFiles({ name: 'a-rather-long-file-name-for-testing.png', mimeType: 'image/png', buffer: noisyPng });
        await page.waitForTimeout(600);
      }
      const offenders = await page.evaluate(() => {
        const r = document.querySelector('[data-testid="tool-root"]')!;
        const vw = document.documentElement.clientWidth;
        return [...r.querySelectorAll<HTMLElement>('*')]
          .filter((el) => {
            const b = el.getBoundingClientRect();
            return b.width > 0 && b.height > 0 && (b.right > vw + 1 || b.left < -1);
          })
          .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}`)
          .slice(0, 5);
      });
      expect(offenders).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    });
  }
});
