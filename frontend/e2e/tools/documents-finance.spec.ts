// Functional tests for the documents & finance batch: PDF merger, splitter, compressor and rotate,
// document / file / Excel-CSV converters, and the loan, tip and compound interest calculators.
// PDF fixtures are generated in the test with pdf-lib; downloads are re-opened with pdf-lib to
// assert page counts and rotation. Server-backed converters are mocked with page.route().
import fs from 'node:fs/promises';
import { PDFDocument, StandardFonts, degrees } from 'pdf-lib';
import type { Download, Page } from '@playwright/test';
import { test, expect } from '../fixtures';

const url = (slug: string) => `/resources/utility-tools/${slug}`;

/** A PDF whose page i has width 200 + i*10 so page order can be verified after processing. */
async function makePdf(pages: number, opts: { widthOffset?: number; rotateFirst?: number; objectStreams?: boolean } = {}) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pages; i++) {
    const page = doc.addPage([200 + (opts.widthOffset ?? 0) + i * 10, 300]);
    page.drawText(`Page ${i + 1}`, { x: 20, y: 150, size: 18, font });
  }
  if (opts.rotateFirst) doc.getPage(0).setRotation(degrees(opts.rotateFirst));
  return Buffer.from(await doc.save({ useObjectStreams: opts.objectStreams ?? true }));
}

const pdfFile = (name: string, buffer: Buffer) => ({ name, mimeType: 'application/pdf', buffer });

async function readPdf(download: Download) {
  const path = await download.path();
  return PDFDocument.load(await fs.readFile(path));
}

async function clickAndDownload(page: Page, name: RegExp | string) {
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name }).click()]);
  return download;
}

async function openTool(page: Page, slug: string) {
  await page.goto(url(slug));
  const root = page.getByTestId('tool-root');
  await expect(root.locator('input, textarea, select, button').first()).toBeVisible({ timeout: 30_000 });
  return root;
}

// ---------------------------------------------------------------- PDF merger

test.describe('pdf-merger', () => {
  test('merges PDFs in the chosen order and reports page count', async ({ page, pageErrors }) => {
    const root = await openTool(page, 'pdf-merger');
    const a = await makePdf(3, { widthOffset: 0 }); // widths 200,210,220
    const b = await makePdf(2, { widthOffset: 500 }); // widths 700,710
    await root.getByLabel(/Select PDF files/).setInputFiles([pdfFile('a.pdf', a), pdfFile('b.pdf', b)]);

    const list = root.getByTestId('merge-list');
    await expect(list.locator('li')).toHaveCount(2);
    await expect(root.getByTestId('merge-stats')).toContainText('5');

    // Move b.pdf to the top with the keyboard-accessible button.
    await root.getByRole('button', { name: 'Move b.pdf up' }).click();
    await expect(list.locator('li').first()).toContainText('b.pdf');

    await root.getByRole('button', { name: 'Merge PDFs' }).click();
    await expect(root.getByTestId('merge-result')).toContainText('5 pages');
    const merged = await readPdf(await clickAndDownload(page, 'Download merged PDF'));
    expect(merged.getPageCount()).toBe(5);
    expect(merged.getPage(0).getWidth()).toBe(700);
    expect(merged.getPage(2).getWidth()).toBe(200);
    expect(pageErrors).toEqual([]);
  });

  test('shows errors for non-PDF and corrupted files and needs two files', async ({ page }) => {
    const root = await openTool(page, 'pdf-merger');
    await root.getByLabel(/Select PDF files/).setInputFiles([
      { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') },
      pdfFile('broken.pdf', Buffer.from('%PDF-1.7 this is not really a pdf')),
    ]);
    const alert = root.getByRole('alert');
    await expect(alert).toContainText('notes.txt is not a PDF file');
    await expect(alert).toContainText('Could not read broken.pdf');

    await root.getByLabel(/Select PDF files/).setInputFiles([pdfFile('one.pdf', await makePdf(1))]);
    await expect(root.getByRole('button', { name: 'Merge PDFs' })).toBeDisabled();
    await expect(root).toContainText('Add at least one more PDF');
  });
});

// ---------------------------------------------------------------- PDF splitter

test.describe('pdf-splitter', () => {
  test('splits into single pages, custom ranges, extracted pages and every N pages', async ({ page, pageErrors }) => {
    const root = await openTool(page, 'pdf-splitter');
    await root.getByLabel(/Select a PDF file/).setInputFiles(pdfFile('report.pdf', await makePdf(3)));
    await expect(root.getByTestId('split-page-count')).toHaveText('3');

    // Default: one file per page.
    await root.getByRole('button', { name: 'Split PDF' }).click();
    await expect(root.getByTestId('split-results').locator('li')).toHaveCount(3);
    const single = await readPdf(await clickAndDownload(page, 'Download report_page_2.pdf'));
    expect(single.getPageCount()).toBe(1);
    expect(single.getPage(0).getWidth()).toBe(210);

    // Custom ranges: one file per range.
    await root.getByLabel('Split by custom ranges').check();
    await root.getByLabel(/Ranges/).fill('1-2, 3');
    await root.getByRole('button', { name: 'Split PDF' }).click();
    await expect(root.getByTestId('split-results').locator('li')).toHaveCount(2);
    const firstRange = await readPdf(await clickAndDownload(page, 'Download report_pages_1-2.pdf'));
    expect(firstRange.getPageCount()).toBe(2);

    // Extract: selected pages into one file, document order.
    await root.getByLabel('Extract pages into one PDF').check();
    await root.getByLabel('Pages to extract').fill('3, 1');
    await root.getByRole('button', { name: 'Split PDF' }).click();
    await expect(root.getByTestId('split-results').locator('li')).toHaveCount(1);
    const extracted = await readPdf(await clickAndDownload(page, /Download report_extracted\.pdf/));
    expect(extracted.getPageCount()).toBe(2);
    expect(extracted.getPage(0).getWidth()).toBe(200);
    expect(extracted.getPage(1).getWidth()).toBe(220);

    // Every N pages.
    await root.getByLabel('Split every N pages').check();
    await root.getByLabel('Pages per file').fill('2');
    await root.getByRole('button', { name: 'Split PDF' }).click();
    await expect(root.getByTestId('split-results').locator('li')).toHaveCount(2);
    expect(pageErrors).toEqual([]);
  });

  test('rejects out-of-range, reversed and malformed page ranges', async ({ page }) => {
    const root = await openTool(page, 'pdf-splitter');
    await root.getByLabel(/Select a PDF file/).setInputFiles(pdfFile('three.pdf', await makePdf(3)));
    await root.getByLabel('Extract pages into one PDF').check();
    const input = root.getByLabel('Pages to extract');
    const split = root.getByRole('button', { name: 'Split PDF' });

    await input.fill('5');
    await split.click();
    await expect(root.getByRole('alert')).toContainText('This PDF has 3 pages');
    await input.fill('3-1');
    await split.click();
    await expect(root.getByRole('alert')).toContainText('reversed');
    await input.fill('abc');
    await split.click();
    await expect(root.getByRole('alert')).toContainText('not a valid page');
    await input.fill('');
    await split.click();
    await expect(root.getByRole('alert')).toContainText('Enter at least one page');
    await expect(root.getByTestId('split-results')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------- PDF rotate

test.describe('pdf-rotate', () => {
  test('rotates selected pages, adding to existing rotation', async ({ page, pageErrors }) => {
    const root = await openTool(page, 'pdf-rotate');
    await root.getByLabel(/Select a PDF file/).setInputFiles(pdfFile('scan.pdf', await makePdf(3, { rotateFirst: 270 })));

    await root.getByRole('button', { name: /90° right/ }).click();
    await root.getByLabel('Specific pages').check();
    await root.getByLabel('Page numbers').fill('1, 3');
    await root.getByRole('button', { name: 'Rotate PDF' }).click();
    await expect(root.getByTestId('rotate-result')).toContainText('Rotated 2 of 3 pages');

    const rotated = await readPdf(await clickAndDownload(page, 'Download rotated PDF'));
    expect(rotated.getPageCount()).toBe(3);
    expect(rotated.getPages().map((p) => p.getRotation().angle)).toEqual([0, 0, 90]); // 270 + 90 wraps to 0
    expect(pageErrors).toEqual([]);
  });

  test('rotates even pages 90° left and validates page lists', async ({ page }) => {
    const root = await openTool(page, 'pdf-rotate');
    await root.getByLabel(/Select a PDF file/).setInputFiles(pdfFile('doc.pdf', await makePdf(4)));
    await root.getByRole('button', { name: /90° left/ }).click();
    await root.getByLabel(/Even pages/).check();
    await root.getByRole('button', { name: 'Rotate PDF' }).click();
    const rotated = await readPdf(await clickAndDownload(page, 'Download rotated PDF'));
    expect(rotated.getPages().map((p) => p.getRotation().angle)).toEqual([0, 270, 0, 270]);

    await root.getByLabel('Specific pages').check();
    await expect(root.getByRole('button', { name: 'Download rotated PDF' })).toHaveCount(0);
    await root.getByLabel('Page numbers').fill('0');
    await root.getByRole('button', { name: 'Rotate PDF' }).click();
    await expect(root.getByRole('alert')).toContainText('start at 1');
  });
});

// ---------------------------------------------------------------- PDF compressor

test.describe('pdf-compressor', () => {
  test('re-encodes JPEG images and produces a smaller, valid PDF', async ({ page, pageErrors }) => {
    const root = await openTool(page, 'pdf-compressor');
    // Build a large, high-quality JPEG in the browser (noisy gradient), then embed it with pdf-lib.
    const jpegBase64 = await page.evaluate(() => {
      const c = document.createElement('canvas');
      c.width = 2400;
      c.height = 1800;
      const g = c.getContext('2d')!;
      const img = g.createImageData(c.width, c.height);
      let seed = 42;
      for (let i = 0; i < img.data.length; i += 4) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        const px = i / 4;
        img.data[i] = (px % c.width) / 10 + (seed % 60);
        img.data[i + 1] = px / c.width / 8 + ((seed >> 8) % 60);
        img.data[i + 2] = (seed >> 16) % 255;
        img.data[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      return c.toDataURL('image/jpeg', 0.97).split(',')[1];
    });
    const doc = await PDFDocument.create();
    const jpg = await doc.embedJpg(Buffer.from(jpegBase64, 'base64'));
    doc.addPage([600, 450]).drawImage(jpg, { x: 0, y: 0, width: 600, height: 450 });
    const original = Buffer.from(await doc.save());

    await root.getByLabel(/Select a PDF file/).setInputFiles(pdfFile('photo.pdf', original));
    await root.getByRole('button', { name: /Strong/ }).click();
    await root.getByRole('button', { name: 'Compress PDF' }).click();
    await expect(root.getByTestId('compress-result')).toContainText('Re-encoded 1 of 1 JPEG image', { timeout: 20_000 });

    const download = await clickAndDownload(page, 'Download compressed PDF');
    const bytes = await fs.readFile(await download.path());
    expect(bytes.length).toBeLessThan(original.length * 0.6);
    const out = await PDFDocument.load(bytes);
    expect(out.getPageCount()).toBe(1);
    expect(pageErrors).toEqual([]);
  });

  test('is honest when a text-only PDF cannot be reduced by re-encoding images', async ({ page }) => {
    const root = await openTool(page, 'pdf-compressor');
    await root.getByLabel(/Select a PDF file/).setInputFiles(pdfFile('text.pdf', await makePdf(2)));
    await root.getByRole('button', { name: 'Compress PDF' }).click();
    const result = root.getByTestId('compress-result');
    await expect(result).toBeVisible();
    await expect(result).not.toContainText('Re-encoded');
    await expect(result).toContainText(/no images were changed|contains no JPEG images/);
  });

  test('rejects non-PDF files', async ({ page }) => {
    const root = await openTool(page, 'pdf-compressor');
    await root.getByLabel(/Select a PDF file/).setInputFiles({ name: 'image.png', mimeType: 'image/png', buffer: Buffer.from([137, 80, 78, 71]) });
    await expect(root.getByRole('alert')).toContainText('not a PDF file');
    await expect(root.getByRole('button', { name: 'Compress PDF' })).toBeDisabled();
  });
});

// ---------------------------------------------------------------- Server-backed converters

test.describe('document-converter', () => {
  test('uploads the file to the conversion endpoint and offers the download', async ({ page, pageErrors }) => {
    let body = '';
    await page.route('**/utility-tools/document-converter/convert', async (route) => {
      body = route.request().postData() ?? '';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { url: 'https://example.test/api/storage/converted-documents/converted_abc.pdf', filename: 'converted_abc.pdf' } }),
      });
    });
    const root = await openTool(page, 'document-converter');
    await root.getByLabel(/Select a document/).setInputFiles({
      name: 'letter.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from('PK fake docx'),
    });
    await expect(root.getByTestId('source-format')).toContainText('Word (DOCX)');
    await expect(root.getByLabel('Convert to')).toHaveValue('pdf');
    await root.getByRole('button', { name: 'Convert document' }).click();

    const link = root.getByRole('link', { name: /Download converted_abc\.pdf/ });
    await expect(link).toHaveAttribute('href', 'https://example.test/api/storage/converted-documents/converted_abc.pdf');
    expect(body).toContain('name="target_format"');
    expect(body).toContain('letter.docx');
    expect(pageErrors).toEqual([]);
  });

  test('shows server validation errors and blocks unsupported or oversized files', async ({ page }) => {
    let calls = 0;
    await page.route('**/utility-tools/document-converter/convert', (route) => {
      calls++;
      return route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Validation failed', errors: { file: ['File must be PDF, DOC, DOCX, or TXT.'] } }),
      });
    });
    const root = await openTool(page, 'document-converter');
    const input = root.getByLabel(/Select a document/);

    await input.setInputFiles({ name: 'photo.png', mimeType: 'image/png', buffer: Buffer.from('x') });
    await expect(root.getByRole('alert')).toContainText('Unsupported file type');
    await input.setInputFiles({ name: 'huge.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(11 * 1024 * 1024, 1) });
    await expect(root.getByRole('alert')).toContainText('maximum file size is 10 MB');
    expect(calls).toBe(0);

    await input.setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello world') });
    await root.getByRole('button', { name: 'Convert document' }).click();
    await expect(root.getByRole('alert')).toContainText('File must be PDF, DOC, DOCX, or TXT.');
    expect(calls).toBe(1);
  });

  test('reports a network failure clearly', async ({ page }) => {
    await page.route('**/utility-tools/document-converter/convert', (route) => route.abort('failed'));
    const root = await openTool(page, 'document-converter');
    await root.getByLabel(/Select a document/).setInputFiles({ name: 'a.txt', mimeType: 'text/plain', buffer: Buffer.from('hi') });
    await root.getByRole('button', { name: 'Convert document' }).click();
    await expect(root.getByRole('alert')).toContainText('Could not reach the conversion service');
  });
});

test.describe('excel-csv-converter', () => {
  test('converts CSV to XLSX through the mocked endpoint', async ({ page, pageErrors }) => {
    let body = '';
    await page.route('**/utility-tools/excel-csv-converter/convert', async (route) => {
      body = route.request().postData() ?? '';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { url: 'https://example.test/api/storage/converted-files/converted_x.xlsx', filename: 'converted_x.xlsx' } }),
      });
    });
    const root = await openTool(page, 'excel-csv-converter');
    await root.getByLabel(/Select an Excel or CSV file/).setInputFiles({ name: 'sales.csv', mimeType: 'text/csv', buffer: Buffer.from('a,b\n1,2\n') });
    await expect(root.getByLabel('Convert to')).toHaveValue('xlsx');
    await root.getByRole('button', { name: 'Convert file' }).click();
    await expect(root.getByRole('link', { name: /Download converted_x\.xlsx/ })).toHaveAttribute('href', /converted_x\.xlsx$/);
    expect(body).toContain('xlsx');
    expect(body).toContain('sales.csv');
    expect(pageErrors).toEqual([]);
  });

  test('defaults Excel files to CSV and handles a non-JSON server error', async ({ page }) => {
    await page.route('**/utility-tools/excel-csv-converter/convert', (route) =>
      route.fulfill({ status: 500, contentType: 'text/html', body: '<html>Server Error</html>' }),
    );
    const root = await openTool(page, 'excel-csv-converter');
    await root.getByLabel(/Select an Excel or CSV file/).setInputFiles({
      name: 'book.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('PK fake'),
    });
    await expect(root.getByLabel('Convert to')).toHaveValue('csv');
    await root.getByRole('button', { name: 'Convert file' }).click();
    await expect(root.getByRole('alert')).toContainText('The conversion failed');

    await root.getByLabel(/Select an Excel or CSV file/).setInputFiles({ name: 'data.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
    await expect(root.getByRole('alert')).toContainText('Unsupported file type');
  });
});

// ---------------------------------------------------------------- File converter (browser)

test.describe('file-converter', () => {
  test('converts CSV with quotes and unicode to JSON, XML and YAML', async ({ page, pageErrors }) => {
    const root = await openTool(page, 'file-converter');
    await root.getByLabel(/^Input/).fill('name,city,note\n"Smith, Anna",London,"Says ""hi"""\nJosé Pérez,Madrid,R&D <team>\n');
    const output = root.getByLabel(/^Output/);

    await expect(root.getByLabel('To', { exact: true })).toHaveValue('json');
    await expect
      .poll(async () => JSON.parse((await output.inputValue()) || 'null'))
      .toEqual([
        { name: 'Smith, Anna', city: 'London', note: 'Says "hi"' },
        { name: 'José Pérez', city: 'Madrid', note: 'R&D <team>' },
      ]);

    await root.getByLabel('To', { exact: true }).selectOption('xml');
    await expect(output).toHaveValue(/<name>Smith, Anna<\/name>/);
    await expect(output).toHaveValue(/<note>R&amp;D &lt;team&gt;<\/note>/);

    await root.getByLabel('To', { exact: true }).selectOption('yaml');
    await expect(output).toHaveValue(/- name: "Smith, Anna"\n {2}city: London/);

    await root.getByLabel('To', { exact: true }).selectOption('csv');
    // Textareas normalise CRLF to LF; the downloaded file keeps RFC 4180 CRLF line endings.
    await expect(output).toHaveValue('name,city,note\n"Smith, Anna",London,"Says ""hi"""\nJosé Pérez,Madrid,R&D <team>');
    expect(pageErrors).toEqual([]);
  });

  test('converts JSON to CSV, reports invalid JSON and downloads with the right extension', async ({ page }) => {
    const root = await openTool(page, 'file-converter');
    await root.getByLabel(/Open a file/).setInputFiles({
      name: 'users.v2.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify([{ id: 1, tags: ['a', 'b'] }, { id: 2, extra: true }])),
    });
    await expect(root.getByLabel('To', { exact: true })).toHaveValue('csv');
    const output = root.getByLabel(/^Output/);
    await expect(output).toHaveValue('id,tags,extra\n1,"[""a"",""b""]",\n2,,true');

    const [download] = await Promise.all([page.waitForEvent('download'), root.getByRole('button', { name: 'Download converted file' }).click()]);
    expect(download.suggestedFilename()).toBe('users.v2.csv');
    expect(await fs.readFile(await download.path(), 'utf8')).toBe('id,tags,extra\r\n1,"[""a"",""b""]",\r\n2,,true');

    await root.getByLabel(/^Input/).fill('{"broken": ');
    await root.getByLabel('From', { exact: true }).selectOption('json');
    await expect(root.getByRole('alert')).toContainText('JSON error');
    await expect(output).toHaveValue('');
  });

  test('converts XML with attributes and HTML tables', async ({ page }) => {
    const root = await openTool(page, 'file-converter');
    await root.getByLabel(/^Input/).fill('<books><book id="1"><title>A</title></book><book id="2"><title>B</title></book></books>');
    const output = root.getByLabel(/^Output/);
    await expect
      .poll(async () => JSON.parse((await output.inputValue()) || 'null'))
      .toEqual({ books: { book: [{ '@id': '1', title: 'A' }, { '@id': '2', title: 'B' }] } });
    await root.getByLabel('To', { exact: true }).selectOption('csv');
    await expect(output).toHaveValue('@id,title\n1,A\n2,B');

    await root.getByLabel(/^Input/).fill('<table><tr><th>Item</th><th>Qty</th></tr><tr><td>Pen</td><td>3</td></tr></table>');
    await expect(root.getByLabel('From', { exact: true }).locator('option[value="auto"]')).toHaveText(/HTML/);
    await expect(output).toHaveValue('Item,Qty\nPen,3');

    await root.getByLabel(/^Input/).fill('<root><unclosed></root>');
    await root.getByLabel('From', { exact: true }).selectOption('xml');
    await expect(root.getByRole('alert')).toContainText('XML error');
  });
});

// ---------------------------------------------------------------- Loan calculator

test.describe('loan-calculator', () => {
  test('matches the amortization formula for 100,000 at 5% over 30 years', async ({ page, pageErrors }) => {
    const root = await openTool(page, 'loan-calculator');
    await expect(root.getByTestId('loan-payment')).toHaveText('$536.82');
    await expect(root.getByTestId('loan-interest')).toHaveText('$93,255.78');
    await expect(root.getByTestId('loan-total')).toHaveText('$193,255.78');
    await expect(root.getByTestId('loan-duration')).toHaveText('30 years');
    await expect(root.getByTestId('loan-schedule').locator('tbody tr')).toHaveCount(30);

    await root.getByRole('button', { name: 'Every payment' }).click();
    await expect(root.getByTestId('loan-schedule').locator('tbody tr')).toHaveCount(360);
    await expect(root.getByTestId('loan-schedule').locator('tbody tr').last()).toContainText('$0.00');

    const [download] = await Promise.all([page.waitForEvent('download'), root.getByRole('button', { name: 'Download CSV' }).click()]);
    const csv = await fs.readFile(await download.path(), 'utf8');
    expect(csv.trim().split(/\r?\n/)).toHaveLength(361);
    expect(pageErrors).toEqual([]);
  });

  test('handles 0% interest, extra payments and invalid input', async ({ page }) => {
    const root = await openTool(page, 'loan-calculator');
    await root.getByLabel('Annual interest rate (APR)').fill('0');
    await expect(root.getByTestId('loan-payment')).toHaveText('$277.78');
    await expect(root.getByTestId('loan-interest')).toHaveText('$0.00');

    await root.getByLabel('Annual interest rate (APR)').fill('5');
    await root.getByLabel(/Extra payment each period/).fill('100');
    await expect(root.getByTestId('loan-savings')).toContainText('saves');
    await expect(root.getByTestId('loan-duration')).not.toHaveText('30 years');

    const amount = root.getByLabel('Loan amount');
    await amount.fill('');
    await expect(root.getByText('Enter the loan amount.')).toBeVisible();
    await expect(root.getByTestId('loan-empty')).toBeVisible();
    await expect(amount).toHaveAttribute('aria-invalid', 'true');
    await amount.fill('-5');
    await expect(root.getByText('The loan amount must be greater than 0.')).toBeVisible();
    await amount.fill('10000000000000');
    await expect(root.getByText(/up to 1,000,000,000,000/)).toBeVisible();
    await amount.fill('250000');
    await root.getByLabel('Loan term (years)').fill('0');
    await expect(root.getByText('Enter a term between 0 and 50 years.')).toBeVisible();
    await root.getByLabel('Loan term (years)').fill('15');
    await root.getByLabel('Payment frequency').selectOption('biweekly');
    await expect(root.getByTestId('loan-payment')).toBeVisible();
    await root.getByLabel('Currency').selectOption('EUR');
    await expect(root.getByTestId('loan-payment')).toContainText('€');
  });
});

// ---------------------------------------------------------------- Tip calculator

test.describe('tip-calculator', () => {
  test('15% of 80 split 4 ways is 3.00 tip and 23.00 each', async ({ page, pageErrors }) => {
    const root = await openTool(page, 'tip-calculator');
    await root.getByLabel('Bill amount').fill('80');
    await root.getByRole('button', { name: '15%' }).click();
    await root.getByLabel('Number of people').fill('4');
    await expect(root.getByTestId('tip-each')).toHaveText('$3.00');
    await expect(root.getByTestId('total-each')).toHaveText('$23.00');
    await expect(root.getByTestId('tip-total')).toHaveText('$12.00');
    await expect(root.getByTestId('bill-total')).toHaveText('$92.00');

    // Regression: a custom percentage used to be added as a currency amount.
    await root.getByLabel('Custom tip %').fill('25');
    await expect(root.getByTestId('tip-total')).toHaveText('$20.00');
    await expect(root.getByRole('button', { name: '25%' })).toHaveAttribute('aria-pressed', 'true');

    // Round up: 80 + 18% = 94.40 / 3 = 31.47 -> 32.00 each.
    await root.getByRole('button', { name: '18%' }).click();
    await root.getByRole('button', { name: 'One person fewer' }).click();
    await root.getByLabel('Round each share up').check();
    await expect(root.getByTestId('total-each')).toHaveText('$32.00');
    await expect(root.getByTestId('bill-total')).toHaveText('$96.00');
    await expect(root.getByTestId('tip-total')).toHaveText('$16.00');
    expect(pageErrors).toEqual([]);
  });

  test('pre-tax tip and number edge cases', async ({ page }) => {
    const root = await openTool(page, 'tip-calculator');
    await root.getByLabel('Bill amount').fill('110');
    await root.getByLabel(/Tax included/).fill('10');
    await root.getByRole('button', { name: '20%' }).click();
    await expect(root.getByTestId('tip-total')).toHaveText('$20.00');

    await root.getByLabel(/Tax included/).fill('');
    await root.getByLabel('Bill amount').fill('0');
    await expect(root.getByTestId('tip-total')).toHaveText('$0.00');
    await root.getByLabel('Bill amount').fill('');
    await expect(root.getByText('Enter the bill amount.')).toBeVisible();
    await root.getByLabel('Bill amount').fill('-20');
    await expect(root.getByText('The bill cannot be negative.')).toBeVisible();
    await root.getByLabel('Bill amount').fill('5000000000');
    await expect(root.getByText(/up to 1,000,000,000/)).toBeVisible();
    await root.getByLabel('Bill amount').fill('50');
    await root.getByLabel('Number of people').fill('0');
    await expect(root.getByText(/whole number of people/)).toBeVisible();
    await root.getByLabel('Number of people').fill('2.5');
    await expect(root.getByText(/whole number of people/)).toBeVisible();
    await root.getByLabel('Custom tip %').fill('150');
    await expect(root.getByText('Enter a tip between 0 and 100%.')).toBeVisible();
  });
});

// ---------------------------------------------------------------- Compound interest

test.describe('compound-interest-calculator', () => {
  test('1,000 at 5% compounded yearly for 10 years is 1,628.89', async ({ page, pageErrors }) => {
    const root = await openTool(page, 'compound-interest-calculator');
    await root.getByLabel(/Initial investment/).fill('1000');
    await root.getByLabel('Annual interest rate').fill('5');
    await root.getByLabel('Time period (years)').fill('10');
    await root.getByLabel('Compounding frequency').selectOption('annually');
    await root.getByLabel(/Regular contribution/).fill('0');
    await expect(root.getByTestId('ci-future-value')).toHaveText('$1,628.89');
    await expect(root.getByTestId('ci-interest')).toHaveText('$628.89');
    await expect(root.getByTestId('ci-apy')).toHaveText('5.000%');
    await expect(root.getByTestId('ci-table').locator('tbody tr')).toHaveCount(10);

    await root.getByLabel('Compounding frequency').selectOption('monthly');
    await expect(root.getByTestId('ci-future-value')).toHaveText('$1,647.01');
    await expect(root.getByTestId('ci-apy')).toHaveText('5.116%');
    expect(pageErrors).toEqual([]);
  });

  test('contributions, timing and invalid input', async ({ page }) => {
    const root = await openTool(page, 'compound-interest-calculator');
    await root.getByLabel(/Initial investment/).fill('0');
    await root.getByLabel('Annual interest rate').fill('0');
    await root.getByLabel('Time period (years)').fill('1');
    await root.getByLabel(/Regular contribution/).fill('100');
    await expect(root.getByTestId('ci-future-value')).toHaveText('$1,200.00');
    await expect(root.getByTestId('ci-contributions')).toHaveText('$1,200.00');

    // 100/month at 12% compounded monthly for 1 year: end = 1,268.25, start = 1,280.93.
    await root.getByLabel('Annual interest rate').fill('12');
    await root.getByLabel('Compounding frequency').selectOption('monthly');
    await expect(root.getByTestId('ci-future-value')).toHaveText('$1,268.25');
    await root.getByLabel('Contributions made at').selectOption('start');
    await expect(root.getByTestId('ci-future-value')).toHaveText('$1,280.93');

    await root.getByLabel('Annual interest rate').fill('');
    await expect(root.getByText('Enter the annual interest rate.')).toBeVisible();
    await expect(root.getByTestId('ci-future-value')).toHaveCount(0);
    await root.getByLabel('Annual interest rate').fill('5');
    await root.getByLabel(/Initial investment/).fill('-1');
    await expect(root.getByText('The initial amount cannot be negative.')).toBeVisible();
    await root.getByLabel(/Initial investment/).fill('1000');
    await root.getByLabel('Time period (years)').fill('0');
    await expect(root.getByText('Enter a period between 0 and 100 years.')).toBeVisible();
    await root.getByLabel('Time period (years)').fill('100');
    await root.getByLabel(/Initial investment/).fill('1000000000000');
    await expect(root.getByTestId('ci-future-value')).toBeVisible();
  });
});

// ---------------------------------------------------------------- Mobile layout

const slugs = [
  'pdf-merger',
  'pdf-splitter',
  'pdf-compressor',
  'pdf-rotate',
  'document-converter',
  'file-converter',
  'excel-csv-converter',
  'loan-calculator',
  'tip-calculator',
  'compound-interest-calculator',
];

test('documents & finance tools have no horizontal overflow at phone width @mobile', async ({ page, pageErrors }) => {
  test.setTimeout(180_000); // visits ten tool pages
  await page.setViewportSize({ width: 390, height: 844 });
  const threePages = await makePdf(3);
  for (const slug of slugs) {
    const root = await openTool(page, slug);
    // Fill tools so their option panels and results are rendered.
    if (slug === 'pdf-merger') await root.getByLabel(/Select PDF files/).setInputFiles([pdfFile('a-very-long-file-name-for-testing-layout.pdf', threePages), pdfFile('b.pdf', threePages)]);
    if (slug === 'pdf-splitter' || slug === 'pdf-rotate' || slug === 'pdf-compressor') await root.getByLabel(/Select a PDF file/).setInputFiles(pdfFile('doc.pdf', threePages));
    if (slug === 'file-converter') await root.getByRole('button', { name: 'Load sample' }).click();
    if (slug === 'pdf-merger') await expect(root.getByTestId('merge-list').locator('li')).toHaveCount(2);
    if (slug === 'pdf-splitter') await expect(root.getByTestId('split-page-count')).toHaveText('3');

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
