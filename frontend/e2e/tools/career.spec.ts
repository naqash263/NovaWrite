// Career tools at /resources/{slug}: SEO/AEO/GEO checks per page, functional checks of
// each tool's main flow (AI endpoints mocked), and a phone-width overflow check.
import fs from 'node:fs';
import zlib from 'node:zlib';
import type { Page, Route } from '@playwright/test';
import { test, expect } from '../fixtures';
import { careerTools } from '../../src/data/careerTools';

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** Mocks one AI career endpoint and records the JSON bodies it received. */
async function mockCareerApi(page: Page, endpoint: string, data: unknown, status = 200) {
  const bodies: Record<string, unknown>[] = [];
  await page.route(`**/api/career-tools/${endpoint}`, async (route: Route) => {
    bodies.push(route.request().postDataJSON());
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(status === 200 ? { success: true, data } : { success: false, message: data }),
    });
  });
  return bodies;
}

test.describe('Career tools SEO', () => {
  for (const tool of careerTools) {
    test(`${tool.slug} has complete SEO / AEO / GEO`, async ({ page, pageErrors }) => {
      const path = `/resources/${tool.slug}`;
      await page.goto(path);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText(tool.h1);

      const title = await page.title();
      expect(title).toBe(tool.seoTitle);
      expect(title.length).toBeGreaterThanOrEqual(30);
      expect(title.length).toBeLessThanOrEqual(60);
      const description = (await page.locator('meta[name="description"]').getAttribute('content')) ?? '';
      expect(description).toBe(tool.seoDescription);
      expect(description.length).toBeGreaterThanOrEqual(110);
      expect(description.length).toBeLessThanOrEqual(160);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`${path}$`));

      // Answer-first intro paragraph.
      const answer = await page.getByTestId('tool-answer').innerText();
      expect(words(answer)).toBeGreaterThanOrEqual(40);
      expect(words(answer)).toBeLessThanOrEqual(70);

      const blocks = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((s) => JSON.parse(s));
      const types = blocks.map((b) => b['@type']);
      expect(types).toEqual(expect.arrayContaining(['WebApplication', 'BreadcrumbList', 'FAQPage', 'HowTo']));
      const breadcrumb = blocks.find((b) => b['@type'] === 'BreadcrumbList');
      expect(breadcrumb.itemListElement.map((i: { name: string }) => i.name)).toEqual(['Home', 'Resources', tool.name]);
      const faq = blocks.find((b) => b['@type'] === 'FAQPage');
      expect(faq.mainEntity).toHaveLength(tool.faqs.length);
      expect(await page.content()).not.toContain('aggregateRating');

      // Visible FAQ, how-to, related tools and reviewer line.
      expect(tool.faqs.length).toBeGreaterThanOrEqual(3);
      for (const f of tool.faqs) await expect(page.getByRole('heading', { name: f.question })).toBeAttached();
      await expect(page.locator('#how-to-heading + ol > li')).toHaveCount(tool.howTo.length);
      const related = page.getByTestId('related-tools').getByRole('link');
      expect(await related.count()).toBeGreaterThanOrEqual(3);
      await expect(page.getByTestId('tool-meta').getByRole('link', { name: 'Naqash Thaheem' })).toHaveAttribute('href', '/about');
      await expect(page.getByTestId('tool-meta')).toContainText('Reviewed by Naqash Thaheem');

      // Heading levels never skip (h1 -> h2 -> h3 ...).
      const levels = await page.locator('main h1, main h2, main h3, main h4, main h5, main h6').evaluateAll((els) =>
        els.filter((el) => (el as HTMLElement).offsetParent !== null || el.closest('details')).map((el) => Number(el.tagName[1])),
      );
      expect(levels[0]).toBe(1);
      for (let i = 1; i < levels.length; i++) expect(levels[i] - levels[i - 1], `heading order ${levels.join(',')}`).toBeLessThanOrEqual(1);

      expect(pageErrors).toEqual([]);
    });
  }
});

/** Reads the text lines a PDF draws: every `(…) Tj` / `[…] TJ` with its `x y Td` position, per page. */
function pdfTextLines(pdf: Buffer): { page: number; x: number; y: number; text: string }[] {
  const raw = pdf.toString('latin1');
  const decode = (s: string) =>
    s.replace(/\\([nrtbf()\\]|[0-7]{1,3})/g, (_, c: string) =>
      /^[0-7]+$/.test(c) ? String.fromCharCode(parseInt(c, 8)) : ({ n: '\n', r: '\r', t: '\t', b: '\b', f: '\f' } as Record<string, string>)[c] ?? c,
    );
  const out: { page: number; x: number; y: number; text: string }[] = [];
  let page = 0;
  for (const m of raw.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)) {
    let content: string;
    try {
      content = zlib.inflateSync(Buffer.from(m[1], 'latin1')).toString('latin1');
    } catch {
      content = m[1];
    }
    if (!/\bBT\b/.test(content)) continue;
    page += 1;
    for (const block of content.matchAll(/\bBT\b([\s\S]*?)\bET\b/g)) {
      let x = 0;
      let y = 0;
      for (const op of block[1].matchAll(/([-\d.]+) ([-\d.]+) (?:Td|TD)|(?:[-\d.]+ ){4}([-\d.]+) ([-\d.]+) Tm|\(((?:\\.|[^\\)])*)\) Tj|\[((?:\\.|[^\]])*)\] TJ/g)) {
        if (op[1] !== undefined) {
          x = Number(op[1]);
          y = Number(op[2]);
        } else if (op[3] !== undefined) {
          x = Number(op[3]);
          y = Number(op[4]);
        } else if (op[5] !== undefined) {
          out.push({ page, x, y, text: decode(op[5]) });
        } else if (op[6] !== undefined) {
          out.push({ page, x, y, text: [...op[6].matchAll(/\(((?:\\.|[^\\)])*)\)/g)].map((p) => decode(p[1])).join('') });
        }
      }
    }
  }
  return out;
}

/** Returns one file from a .zip (e.g. word/document.xml from a .docx) using only node:zlib. */
function unzipEntry(zip: Buffer, name: string): string {
  const eocd = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const count = zip.readUInt16LE(eocd + 10);
  let p = zip.readUInt32LE(eocd + 16);
  for (let i = 0; i < count; i++) {
    const method = zip.readUInt16LE(p + 10);
    const size = zip.readUInt32LE(p + 20);
    const nameLength = zip.readUInt16LE(p + 28);
    const extraLength = zip.readUInt16LE(p + 30);
    const commentLength = zip.readUInt16LE(p + 32);
    const localHeader = zip.readUInt32LE(p + 42);
    if (zip.toString('utf8', p + 46, p + 46 + nameLength) === name) {
      const start = localHeader + 30 + zip.readUInt16LE(localHeader + 26) + zip.readUInt16LE(localHeader + 28);
      const data = zip.subarray(start, start + size);
      return (method === 8 ? zlib.inflateRawSync(data) : data).toString('utf8');
    }
    p += 46 + nameLength + extraLength + commentLength;
  }
  throw new Error(`${name} not found in zip`);
}

const longBullets = Array.from(
  { length: 12 },
  (_, i) => `- Led migration project ${i + 1} that cut infrastructure cost by 30% across five regional teams and improved deployment frequency.`,
).join('\n');

/** A complete CV as the builder stores it in localStorage. */
const sampleCv = {
  fullName: 'Aisha Rahman',
  jobTitle: 'Senior Product Manager',
  email: 'aisha@example.com',
  phoneNumber: '+971 50 123 4567',
  address: 'Dubai, UAE',
  profilePictureUrl: '',
  professionalSummary: 'Product leader with 9 years of experience shipping B2B SaaS products in the Gulf region.',
  workExperience: [
    { jobTitle: 'Senior Product Manager', company: 'Careem', startDate: '2021-03', endDate: '', description: longBullets },
    { jobTitle: 'Product Manager', company: 'Noon', startDate: '2018-01', endDate: '2021-02', description: longBullets },
    { jobTitle: 'Business Analyst', company: 'Emirates NBD', startDate: '2015-06', endDate: '2017-12', description: longBullets },
  ],
  education: [{ degree: 'MBA', institution: 'INSEAD', graduationYear: '2015' }],
  skills: 'Roadmapping, SQL, A/B testing, Stakeholder management',
  projects: [{ name: 'Checkout Revamp', description: 'Rebuilt checkout flow.', technologies: 'React, Node.js', url: 'https://example.com/checkout', startDate: 'Jan 2022', endDate: 'Jun 2022' }],
  certificates: [{ name: 'PMP', issuer: 'PMI', date: '2019', credentialId: '', url: '' }],
  languages: [
    { language: 'Arabic', proficiency: 'Native' },
    { language: 'English', proficiency: 'Fluent' },
  ],
  achievements: [{ title: 'Product of the Year', description: 'Won the internal award for the checkout revamp.', date: '2022' }],
  references: [{ name: '', position: '', company: '', email: '', phone: '' }],
  interests: [{ category: 'Hobbies', items: 'Running, chess' }],
};

/** Seeds the builder's saved state once per tab (a reload keeps what the page saved since). */
async function seedCv(page: Page, data: Record<string, unknown> = sampleCv, step = 10, extra: Record<string, string> = {}) {
  await page.addInitScript(
    ({ d, s, e }) => {
      if (sessionStorage.getItem('cv-seeded')) return;
      sessionStorage.setItem('cv-seeded', '1');
      localStorage.setItem('cv-builder-data', JSON.stringify(d));
      localStorage.setItem('cv-builder-step', String(s));
      for (const [k, v] of Object.entries(e)) localStorage.setItem(k, v);
    },
    { d: data, s: step, e: extra },
  );
}

/** Mocks POST /api/cv-ai/{extract|tailor} and records each request. */
async function mockCvAi(page: Page, endpoint: 'extract' | 'tailor', reply: { status: number; body: string; contentType?: string } | 'abort') {
  const requests: { contentType: string; body: string; json: unknown }[] = [];
  await page.route(`**/api/cv-ai/${endpoint}`, async (route: Route) => {
    const req = route.request();
    const body = req.postDataBuffer()?.toString('latin1') ?? '';
    let json: unknown = null;
    try {
      json = JSON.parse(body);
    } catch {
      json = null;
    }
    requests.push({ contentType: (await req.allHeaders())['content-type'] ?? '', body, json });
    if (reply === 'abort') return route.abort('internetdisconnected');
    return route.fulfill({ status: reply.status, contentType: reply.contentType ?? 'application/json', body: reply.body });
  });
  return requests;
}

/** The exact JSON CvAiController::extractCv / tailorCv return on success (CvAiService::parseCvData shape). */
const aiCvData = {
  fullName: 'Bilal Ahmed',
  jobTitle: 'Data Analyst',
  email: 'bilal@example.com',
  phoneNumber: '+971 55 000 1111',
  address: 'Abu Dhabi, UAE',
  professionalSummary: 'Analyst who turns messy data into decisions.',
  workExperience: [{ jobTitle: 'Data Analyst', company: 'ADNOC', startDate: '2020-01', endDate: '', description: 'Built Power BI dashboards used by 200 managers.' }],
  education: [{ degree: 'BSc Statistics', institution: 'UAE University', graduationYear: '2019' }],
  skills: 'SQL, Power BI, Python',
  projects: [],
  certificates: [{ name: 'Google Data Analytics Certificate', issuer: 'Google', date: '2021' }],
  languages: [{ language: 'Urdu', proficiency: 'Native' }],
  achievements: [],
  references: [],
};

test.describe('Cover letter generator', () => {
  test('validates, sends the right payload and renders an editable, downloadable letter', async ({ page }) => {
    const bodies = await mockCareerApi(page, 'cover-letter/generate', {
      content: 'Dear Hiring Manager,\n\nI am excited to apply for the QA Lead role at Acme.\n\nSincerely,\n[Name]',
      atsScore: 88,
      keywordDensity: { playwright: 4, automation: 3 },
      suggestions: ['Add a metric from your last role'],
    });
    await page.goto('/resources/cover-letter-generator');

    // Step 1 validation.
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('Enter the job title you are applying for.')).toBeVisible();

    await page.getByLabel('Job Title *').fill('QA Lead');
    await page.getByLabel('Company Name *').fill('Acme');
    await page.getByLabel('Job Description *').fill('We need a QA lead to own Playwright automation, CI pipelines and release quality.');
    await page.getByRole('button', { name: 'Next' }).click();

    // Skills input keeps spaces and commas while typing (regression: it used to strip them).
    await page.getByLabel('Your Name (optional)').fill('Sam Doe');
    await page.getByLabel('Current Position *').fill('Senior QA Engineer');
    await page.getByLabel('Years of Experience *').selectOption('6-10 years');
    await page.getByLabel('Key Skills (comma-separated) *').pressSequentially('Test Automation, Playwright');
    await expect(page.getByLabel('Key Skills (comma-separated) *')).toHaveValue('Test Automation, Playwright');
    await page.getByLabel('Relevant Experience and Achievements *').fill('Built a Playwright suite that runs on every pull request.');
    await page.getByLabel('Tone').selectOption('formal');
    await page.getByRole('button', { name: 'Generate Cover Letter' }).click();

    const output = page.getByTestId('cover-letter-output');
    await expect(output).toHaveValue(/QA Lead role at Acme/);
    await expect(output).toHaveValue(/Sam Doe/);
    await expect(page.getByText('88%')).toBeVisible();
    await expect(page.getByText('playwright', { exact: true })).toBeVisible();
    expect(bodies[0]).toMatchObject({
      job_title: 'QA Lead',
      company_name: 'Acme',
      years_experience: 8,
      skills: 'Test Automation, Playwright',
      tone: 'formal',
    });

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download .txt' }).click();
    expect((await download).suggestedFilename()).toBe('Cover-Letter-Acme.txt');
  });

  test('shows the API error message instead of failing silently', async ({ page }) => {
    await mockCareerApi(page, 'cover-letter/generate', 'No API keys available. Please add your own API key or contact support.', 400);
    await page.goto('/resources/cover-letter-generator');
    await page.getByLabel('Job Title *').fill('QA Lead');
    await page.getByLabel('Company Name *').fill('Acme');
    await page.getByLabel('Job Description *').fill('We need a QA lead to own Playwright automation and release quality.');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByLabel('Current Position *').fill('QA Engineer');
    await page.getByLabel('Years of Experience *').selectOption('2-3 years');
    await page.getByLabel('Key Skills (comma-separated) *').fill('Playwright');
    await page.getByLabel('Relevant Experience and Achievements *').fill('Automated regression tests.');
    await page.getByRole('button', { name: 'Generate Cover Letter' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'No API keys available' })).toBeVisible();
  });
});

test.describe('CV builder', () => {
  const apiTemplate = {
    id: 42,
    name: 'Mock Modern',
    description: 'Admin template used by the test',
    category: 'modern',
    ats_score: 9,
    is_default: true,
    customizable_options: ['colors'],
    html_content:
      '<div class="cv-template mock-modern" style="color: {{primaryColor}}"><p data-template="mock">MOCK TEMPLATE {{fullName}}</p>{{#if profileImage}}<img src="{{profileImage}}">{{/if}}<section><h3>Experience</h3>{{workExperience}}</section></div>',
  };
  const minimalTemplate = {
    ...apiTemplate,
    id: 43,
    name: 'Mock Minimal',
    is_default: false,
    html_content: '<div class="cv-template mock-minimal"><p>MINIMAL {{fullName}} · {{jobTitle}}</p><section id="skills"><h3>Skills</h3><p>{{skills}}</p></section></div>',
  };
  const mockTemplates = (page: Page, templates: unknown[]) =>
    page.route('**/api/cv-templates', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: templates }) }),
    );
  const next = (page: Page) => page.getByRole('button', { name: /^Next/ }).click();
  const pdfPageCount = (pdf: Buffer) => (pdf.toString('latin1').match(/\/Type\s*\/Page\b(?!s)/g) ?? []).length;

  test('builds a CV with live preview, experience entries, template choice and PDF / Word export', async ({ page, pageErrors }) => {
    test.setTimeout(90_000);
    await mockTemplates(page, [apiTemplate]);
    await page.goto('/resources/cv-builder');
    await page.getByRole('button', { name: /Create Manually/ }).click();

    const preview = page.getByTestId('cv-live-preview');
    await expect(preview).toBeVisible();
    // The admin default template is selected; switch to the built-in one in step 9 later.
    await expect(preview).toContainText('MOCK TEMPLATE');

    // Core fields update the live preview; user text is escaped, never parsed as HTML.
    await page.getByLabel('Full Name').fill('Jane <b>Doe</b>');
    await page.getByLabel('Job Title', { exact: true }).fill('QA Lead');
    await page.getByLabel('Email').fill('jane@example.com');
    await expect(preview).toContainText('MOCK TEMPLATE Jane <b>Doe</b>');
    await expect(preview.locator('b')).toHaveCount(0);

    await next(page);
    await page.getByLabel('Professional Summary').fill('QA lead with a focus on Playwright automation.');
    await next(page);

    // Experience: fill the first entry, add a second, then remove it again.
    await page.getByLabel('Job Title', { exact: true }).fill('Senior QA Engineer');
    await page.getByLabel('Company').fill('Acme Corp');
    await expect(preview).toContainText('Acme Corp');
    await page.getByRole('button', { name: /Add Another Experience/ }).click();
    await expect(page.getByRole('heading', { name: 'Experience 2' })).toBeVisible();
    await page.getByLabel('Company').nth(1).fill('Globex');
    await expect(preview).toContainText('Globex');
    await page.getByRole('heading', { name: 'Experience 2' }).locator('..').getByRole('button', { name: 'Remove' }).click();
    await expect(page.getByRole('heading', { name: 'Experience 2' })).toHaveCount(0);
    await expect(preview).not.toContainText('Globex');

    // Steps 4-8 are optional; move on to the template step (step 9).
    for (let i = 0; i < 6; i++) await next(page);
    await expect(page.getByRole('heading', { name: 'Choose Your ATS-Friendly Template' })).toBeVisible();
    await page.getByRole('button', { name: 'Template Gallery' }).click();
    await page.getByRole('button', { name: 'Select template: Classic ATS' }).click();
    const templatePreview = page.locator('[data-cv-preview]');
    await expect(templatePreview).toContainText('Jane <b>Doe</b>');
    await expect(templatePreview).toContainText('Acme Corp');
    await expect(templatePreview).not.toContainText('MOCK TEMPLATE');

    // Step 10: export.
    await next(page);
    await expect(page.getByRole('heading', { name: 'Export Your CV' })).toBeVisible();

    await page.getByRole('button', { name: /Word Document/ }).click();
    const wordDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download Word Document' }).click();
    const word = await wordDownload;
    expect(word.suggestedFilename()).toMatch(/\.docx$/);
    expect(fs.readFileSync(await word.path()).subarray(0, 2).toString()).toBe('PK'); // .docx is a zip

    await page.getByRole('button', { name: /^📄\s*PDF/ }).click();
    const pdfDownload = page.waitForEvent('download', { timeout: 20_000 });
    await page.getByRole('button', { name: 'Download PDF' }).click();
    const pdf = await pdfDownload;
    expect(pdf.suggestedFilename()).toMatch(/\.pdf$/);
    const pdfBytes = fs.readFileSync(await pdf.path());
    expect(pdfBytes.subarray(0, 5).toString()).toBe('%PDF-');
    // Regression: text used to be drawn at negative x (cut off the left edge of the page).
    const lines = pdfTextLines(pdfBytes);
    expect(lines.map((l) => l.text)).toContain('Senior QA Engineer');
    expect(lines.map((l) => l.text).join(' ')).toContain('Acme Corp');
    for (const l of lines) {
      expect(l.x, `"${l.text}" x`).toBeGreaterThanOrEqual(0);
      expect(l.x, `"${l.text}" x`).toBeLessThan(595);
    }

    expect(pageErrors).toEqual([]);
  });

  test('fills every section, adds and removes entries, and the live preview follows', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/resources/cv-builder');
    await page.getByRole('button', { name: /Create Manually/ }).click();
    const preview = page.getByTestId('cv-live-preview');

    // 1. Personal information
    await page.getByLabel('Full Name').fill('Sara Ali');
    await page.getByLabel('Job Title', { exact: true }).fill('Finance Manager');
    await page.getByLabel('Email').fill('sara@example.com');
    await page.getByLabel('Phone Number').fill('+971 52 222 3333');
    await page.getByLabel('Address').fill('Sharjah, UAE');
    for (const value of ['Sara Ali', 'Finance Manager', 'sara@example.com', '+971 52 222 3333', 'Sharjah, UAE']) await expect(preview).toContainText(value);

    // 2. Summary
    await next(page);
    await page.getByLabel('Professional Summary').fill('Chartered accountant with IFRS reporting experience.');
    await expect(preview).toContainText('IFRS reporting');

    // 3. Experience (add + remove)
    await next(page);
    await page.getByLabel('Job Title', { exact: true }).fill('Finance Manager');
    await page.getByLabel('Company').fill('Etisalat');
    await page.getByLabel('Start Date').fill('2021-03');
    await page.getByLabel('Description').fill('- Closed the books 3 days faster');
    await expect(preview).toContainText('Etisalat');
    await expect(preview).toContainText('Closed the books 3 days faster');
    await page.getByRole('button', { name: /Add Another Experience/ }).click();
    await page.getByLabel('Company').nth(1).fill('KPMG');
    await expect(preview).toContainText('KPMG');
    await page.getByRole('button', { name: 'Remove experience 2' }).click();
    await expect(preview).not.toContainText('KPMG');

    // 4. Education (add + remove)
    await next(page);
    await page.getByLabel('Degree').fill('BCom Accounting');
    await page.getByLabel('Institution').fill('University of Sharjah');
    await page.getByLabel('Graduation Year').fill('2016');
    await expect(preview).toContainText('University of Sharjah');
    await page.getByRole('button', { name: /Add Another Education/ }).click();
    await page.getByLabel('Institution').nth(1).fill('ACCA');
    await expect(preview).toContainText('ACCA');
    await page.getByRole('button', { name: 'Remove education 2' }).click();
    await expect(preview).not.toContainText('ACCA');

    // 5. Skills and projects (add + remove)
    await next(page);
    await page.getByLabel('Skills').fill('IFRS, SAP, Budgeting');
    await expect(preview).toContainText('IFRS, SAP, Budgeting');
    await page.getByLabel('Project Name').fill('ERP Migration');
    await page.getByLabel('Description').fill('Moved ledgers to SAP S/4HANA.');
    await expect(preview).toContainText('ERP Migration');
    await page.getByRole('button', { name: /Add Another Project/ }).click();
    await page.getByLabel('Project Name').nth(1).fill('Treasury Dashboard');
    await expect(preview).toContainText('Treasury Dashboard');
    await page.getByRole('button', { name: 'Remove project 2' }).click();
    await expect(preview).not.toContainText('Treasury Dashboard');

    // 6. Languages and interests (add + remove)
    await next(page);
    await page.getByLabel('Language', { exact: true }).fill('Arabic');
    await page.getByLabel('Proficiency Level').selectOption('Native');
    await expect(preview).toContainText('Arabic');
    await expect(preview).toContainText('Native');
    await page.getByRole('button', { name: /Add Another Language/ }).click();
    await page.getByLabel('Language', { exact: true }).nth(1).fill('French');
    await expect(preview).toContainText('French');
    await page.getByRole('button', { name: 'Remove language 2' }).click();
    await expect(preview).not.toContainText('French');
    await page.getByLabel('Items').fill('Padel, reading');
    await expect(preview).toContainText('Padel, reading');
    await page.getByRole('button', { name: /Add Another Interest Category/ }).click();
    await page.getByLabel('Items').nth(1).fill('Chess');
    await expect(preview).toContainText('Chess');
    await page.getByRole('button', { name: 'Remove interest category 2' }).click();
    await expect(preview).not.toContainText('Chess');

    // 7. References (add + remove)
    await next(page);
    await page.getByLabel('Full Name').fill('Omar Haddad');
    await page.getByLabel('Position').fill('CFO');
    await page.getByLabel('Company').fill('Etisalat');
    await page.getByLabel('Email').fill('omar@example.com');
    await expect(preview).toContainText('Omar Haddad');
    await page.getByRole('button', { name: /Add Another Reference/ }).click();
    await page.getByLabel('Full Name').nth(1).fill('Lina Saeed');
    await expect(preview).toContainText('Lina Saeed');
    await page.getByRole('button', { name: 'Remove reference 2' }).click();
    await expect(preview).not.toContainText('Lina Saeed');

    // 8. Certifications and achievements (add + remove)
    await next(page);
    await page.getByLabel('Certificate Name').fill('ACCA Member');
    await page.getByLabel('Issuing Organization').fill('ACCA Global');
    await page.getByLabel('Date Obtained').fill('2018');
    await expect(preview).toContainText('ACCA Member');
    await page.getByRole('button', { name: /Add Another Certificate/ }).click();
    await page.getByLabel('Certificate Name').nth(1).fill('CFA Level 1');
    await expect(preview).toContainText('CFA Level 1');
    await page.getByRole('button', { name: 'Remove certificate 2' }).click();
    await expect(preview).not.toContainText('CFA Level 1');
    await page.getByLabel('Achievement Title').fill('Fastest close in group');
    await page.getByLabel('Description').fill('Cut month-end close from 8 to 5 days.');
    await expect(preview).toContainText('Fastest close in group');
    await page.getByRole('button', { name: /Add Another Achievement/ }).click();
    await page.getByLabel('Achievement Title').nth(1).fill('Audit award');
    await expect(preview).toContainText('Audit award');
    await page.getByRole('button', { name: 'Remove achievement 2' }).click();
    await expect(preview).not.toContainText('Audit award');
  });

  test('shows work dates as month and year instead of raw 2021-03 values', async ({ page }) => {
    await seedCv(page, sampleCv, 3);
    await page.goto('/resources/cv-builder');
    const preview = page.getByTestId('cv-live-preview');
    await expect(preview).toContainText('Mar 2021 – Present');
    await expect(preview).toContainText('Jan 2018 – Feb 2021');
    await expect(preview).not.toContainText('2021-03');
  });

  test('switches between every template and customizes accent colour, font and size', async ({ page }) => {
    await mockTemplates(page, [apiTemplate, minimalTemplate]);
    await seedCv(page, sampleCv, 9);
    await page.goto('/resources/cv-builder');
    await expect(page.getByRole('heading', { name: 'Choose Your ATS-Friendly Template' })).toBeVisible();
    const preview = page.locator('[data-cv-preview]').first();

    await page.getByRole('button', { name: 'Template Gallery' }).click();
    await page.getByRole('button', { name: 'Select template: Mock Minimal' }).click();
    await expect(preview).toContainText('MINIMAL Aisha Rahman · Senior Product Manager');
    await page.getByRole('button', { name: 'Change Template' }).click();
    await page.getByRole('button', { name: 'Select template: Mock Modern' }).click();
    await expect(preview).toContainText('MOCK TEMPLATE Aisha Rahman');
    await page.getByRole('button', { name: 'Change Template' }).click();
    await page.getByRole('button', { name: 'Select template: Classic ATS' }).click();
    await expect(preview).toContainText('Careem');
    await expect(preview).not.toContainText('MOCK TEMPLATE');

    // Style customization applies to the preview.
    await page.getByRole('radio', { name: 'Teal' }).check();
    await expect(preview.locator('.cv-role')).toHaveCSS('color', 'rgb(15, 118, 110)');
    await page.getByLabel('Custom accent colour').fill('#b91c1c');
    await expect(preview.locator('.cv-role')).toHaveCSS('color', 'rgb(185, 28, 28)');
    await page.getByLabel('Font', { exact: true }).selectOption({ label: 'Georgia (serif)' });
    await expect(preview.locator('.cv-template')).toHaveCSS('font-family', /Georgia/);
    await page.getByLabel('Font size').selectOption('13');
    await expect(preview.locator('.cv-template')).toHaveCSS('font-size', '13px');
  });

  test('works without admin templates (built-in fallback) and restores progress after reload', async ({ page }) => {
    await page.goto('/resources/cv-builder');
    await page.getByRole('button', { name: /Create Manually/ }).click();
    await page.getByLabel('Full Name').fill('Omar Khan');
    const preview = page.getByTestId('cv-live-preview');
    await expect(preview).toContainText('Omar Khan');
    // Empty sections (projects, references, …) are hidden instead of showing placeholders.
    await expect(preview).not.toContainText('Project Name');
    await expect(preview).not.toContainText('[object Object]');

    await page.waitForTimeout(1200); // autosave debounce
    await page.reload();
    await expect(page.getByLabel('Full Name')).toHaveValue('Omar Khan');
  });

  test('keeps the step, template, style and section layout after a reload', async ({ page }) => {
    await seedCv(page, sampleCv, 9);
    await page.goto('/resources/cv-builder');
    await page.getByRole('radio', { name: 'Navy' }).check();
    await page.getByLabel('Show Interests').uncheck();
    await page.getByRole('button', { name: 'Move Skills up' }).click();
    await page.waitForTimeout(1200); // autosave debounce
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Choose Your ATS-Friendly Template' })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Navy' })).toBeChecked();
    await expect(page.getByLabel('Show Interests')).not.toBeChecked();
    const headings = await page.locator('[data-cv-preview] section h3').allTextContents();
    expect(headings.indexOf('Skills')).toBeLessThan(headings.indexOf('Education'));
    await expect(page.locator('[data-cv-preview]')).not.toContainText('Running, chess');
  });

  test('exports an ATS-friendly text PDF: selectable lines, several pages, nothing clipped', async ({ page, pageErrors }) => {
    test.setTimeout(60_000);
    await seedCv(page, sampleCv, 10);
    await page.goto('/resources/cv-builder');
    await expect(page.getByRole('heading', { name: 'Export Your CV' })).toBeVisible();
    await expect(page.getByRole('radio', { name: /ATS text layout/ })).toBeChecked();

    const download = page.waitForEvent('download', { timeout: 20_000 });
    await page.getByRole('button', { name: 'Download PDF' }).click();
    const pdf = fs.readFileSync(await (await download).path());
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.toString('latin1')).not.toMatch(/\/Subtype\s*\/Image/); // no screenshot of the page
    expect(pdfPageCount(pdf)).toBeGreaterThanOrEqual(2);

    const lines = pdfTextLines(pdf);
    const texts = lines.map((l) => l.text);
    // Whole lines of real text (not one text object per word), so ATS parsers keep word order and spaces.
    expect(texts).toContain('Aisha Rahman');
    expect(texts).toContain('Senior Product Manager');
    expect(texts.some((t) => t.includes('Led migration project 1 that cut infrastructure'))).toBe(true);
    expect(texts).toContain('EXPERIENCE');
    expect(texts.some((t) => t.includes('aisha@example.com') && t.includes('+971 50 123 4567'))).toBe(true);
    // Every bullet of every job survives the page breaks (36 bullets in total).
    const all = texts.join(' ');
    expect(all.match(/deployment frequency\./g)).toHaveLength(36);
    expect(all.match(/Led migration project 12 that/g)).toHaveLength(3);
    // Text stays inside the A4 page and its 25.4 mm (72 pt) margins.
    for (const l of lines) {
      expect(l.x, `"${l.text}" x`).toBeGreaterThanOrEqual(71);
      expect(l.x, `"${l.text}" x`).toBeLessThan(595 - 72);
      expect(l.y, `"${l.text}" y`).toBeGreaterThan(40);
      expect(l.y, `"${l.text}" y`).toBeLessThan(842 - 60);
    }

    // Letter size + page numbers.
    await page.getByLabel('Page Size').selectOption('Letter');
    await page.getByLabel('Include page numbers').check();
    const second = page.waitForEvent('download', { timeout: 20_000 });
    await page.getByRole('button', { name: 'Download PDF' }).click();
    const letter = fs.readFileSync(await (await second).path());
    expect(letter.toString('latin1')).toMatch(/\/MediaBox \[0 0 612\.?0* 792\.?0*\]/);
    expect(pdfTextLines(letter).map((l) => l.text)).toContain(`Page 1 of ${pdfPageCount(letter)}`);
    expect(pageErrors).toEqual([]);
  });

  test('Word export puts the entered data into word/document.xml', async ({ page }) => {
    await seedCv(page, sampleCv, 10);
    await page.goto('/resources/cv-builder');
    await page.getByRole('button', { name: /Word Document/ }).click();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download Word Document' }).click();
    const docx = fs.readFileSync(await (await download).path());
    const xml = unzipEntry(docx, 'word/document.xml');
    for (const value of ['Aisha Rahman', 'Senior Product Manager', 'aisha@example.com', 'Careem', 'INSEAD', 'Stakeholder management', 'PMP', 'Checkout Revamp', 'Arabic (Native)']) {
      expect(xml, value).toContain(value);
    }
    expect(xml).toContain('Led migration project 1 that cut infrastructure cost by 30%');
    expect(xml).toContain('Mar 2021 – Present');
  });

  test('AI upload sends the file and fills every section, including certifications', async ({ page }) => {
    const requests = await mockCvAi(page, 'extract', {
      status: 200,
      body: JSON.stringify({
        success: true,
        message: 'CV data extracted successfully',
        data: aiCvData,
        file_info: { filename: 'cv.txt', size: 42, type: 'txt', extracted_text_length: 42 },
      }),
    });
    await page.goto('/resources/cv-builder');
    await page.getByRole('button', { name: /Upload Existing CV/ }).click();
    await page.locator('input[type="file"][accept=".pdf,.doc,.docx,.txt"]').setInputFiles({ name: 'cv.txt', mimeType: 'text/plain', buffer: Buffer.from('Bilal Ahmed, Data Analyst') });

    await expect(page.getByLabel('Full Name')).toHaveValue('Bilal Ahmed');
    expect(requests).toHaveLength(1);
    expect(requests[0].contentType).toMatch(/^multipart\/form-data; boundary=/);
    expect(requests[0].body).toContain('name="file"; filename="cv.txt"');
    expect(requests[0].body).toContain('Bilal Ahmed, Data Analyst');

    const preview = page.getByTestId('cv-live-preview');
    await expect(preview).toContainText('ADNOC');
    await expect(preview).toContainText('SQL, Power BI, Python');
    // The API returns `certificates`; they used to be dropped.
    await expect(preview).toContainText('Google Data Analytics Certificate');
  });

  test('AI upload shows clear messages for 422, 429, 500 and network errors, and offers manual entry', async ({ page }) => {
    const replies: ({ status: number; body: string; contentType?: string } | 'abort')[] = [
      { status: 422, body: JSON.stringify({ success: false, message: 'Validation failed', errors: { file: ['The file field must be a file of type: pdf, doc, docx, txt.'] } }) },
      { status: 429, contentType: 'text/html', body: '<html><body>Too Many Requests</body></html>' },
      { status: 500, body: JSON.stringify({ success: false, message: 'All AI providers failed. Please try again later.' }) },
      'abort',
    ];
    const expected = [/The file field must be a file of type: pdf, doc, docx, txt\./, /too many requests/i, /All AI providers failed/, /network error/i];
    await page.route('**/api/cv-ai/extract', (route) => {
      const reply = replies.shift()!;
      return reply === 'abort' ? route.abort('internetdisconnected') : route.fulfill({ status: reply.status, contentType: reply.contentType ?? 'application/json', body: reply.body });
    });
    await page.goto('/resources/cv-builder');
    await page.getByRole('button', { name: /Upload Existing CV/ }).click();
    const fileInput = page.locator('input[type="file"][accept=".pdf,.doc,.docx,.txt"]');
    for (const message of expected) {
      await fileInput.setInputFiles({ name: 'cv.txt', mimeType: 'text/plain', buffer: Buffer.from('My CV') });
      await expect(page.getByRole('alert').filter({ hasText: message })).toBeVisible();
      await expect(page.getByRole('alert').filter({ hasText: /Unexpected token|JSON|Failed to fetch/ })).toHaveCount(0);
    }
    await page.getByRole('button', { name: 'Enter details manually instead' }).click();
    await expect(page.getByLabel('Full Name')).toBeVisible();
  });

  test('AI tailoring keeps your CV, sends it with the job description and applies the result', async ({ page }) => {
    const jobDescription = 'Fintech company hiring a Senior Product Manager to own payments roadmap, SQL analysis and stakeholder management.';
    const tailored = { ...aiCvData, fullName: 'Aisha Rahman', email: 'aisha@example.com', professionalSummary: 'Payments-focused product manager for fintech.' };
    const requests = await mockCvAi(page, 'tailor', { status: 200, body: JSON.stringify({ success: true, message: 'CV tailored successfully', data: tailored }) });
    await seedCv(page, sampleCv, 0);
    await page.goto('/resources/cv-builder');
    await page.getByRole('button', { name: /Tailor to Job/ }).click();

    const tailorButton = page.getByRole('button', { name: /Tailor My CV/ });
    await page.getByLabel('Job Description').fill('Too short');
    await expect(tailorButton).toBeDisabled();
    await expect(page.getByText(/at least 50 characters/)).toBeVisible();
    await page.getByLabel('Job Description').fill(jobDescription);
    await tailorButton.click();

    await expect(page.getByLabel('Full Name')).toHaveValue('Aisha Rahman');
    expect(requests).toHaveLength(1);
    const body = requests[0].json as { cv_data: typeof sampleCv; job_description: string };
    expect(body.job_description).toBe(jobDescription);
    // The CV you already built is what gets tailored (it used to send an empty CV and wipe yours).
    expect(body.cv_data.fullName).toBe('Aisha Rahman');
    expect(body.cv_data.workExperience).toHaveLength(3);
    const preview = page.getByTestId('cv-live-preview');
    await expect(preview).toContainText('Payments-focused product manager for fintech.');
    await expect(preview).toContainText('Running, chess'); // sections the AI does not return are kept
  });

  test('AI tailoring shows the API validation message', async ({ page }) => {
    await mockCvAi(page, 'tailor', { status: 422, body: JSON.stringify({ success: false, message: 'Validation failed', errors: { job_description: ['The job description field must be at least 50 characters.'] } }) });
    await page.goto('/resources/cv-builder');
    await page.getByRole('button', { name: /Tailor to Job/ }).click();
    await page.getByLabel('Job Description').fill('x'.repeat(60));
    await page.getByRole('button', { name: /Tailor My CV/ }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'The job description field must be at least 50 characters.' })).toBeVisible();
  });

  test('the bottom "Download CV" button exports the format chosen above it', async ({ page }) => {
    await seedCv(page, sampleCv, 10);
    await page.goto('/resources/cv-builder');
    await page.getByRole('button', { name: /Word Document/ }).click();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download CV', exact: true }).click();
    expect((await download).suggestedFilename()).toMatch(/\.docx$/);
  });

  test('sections can be reordered and hidden in the preview, PDF and Word', async ({ page }) => {
    test.setTimeout(60_000);
    await seedCv(page, sampleCv, 9);
    await page.goto('/resources/cv-builder');
    await page.getByLabel('Show Interests').uncheck();
    await page.getByRole('button', { name: 'Move Skills up' }).click();
    await page.getByRole('button', { name: 'Move Skills up' }).click();
    const preview = page.locator('[data-cv-preview]').first();
    await expect(preview).not.toContainText('Running, chess');
    const headings = await preview.locator('section h3').allTextContents();
    expect(headings.slice(0, 3)).toEqual(['Profile', 'Skills', 'Experience']);

    await next(page);
    const pdfDownload = page.waitForEvent('download', { timeout: 20_000 });
    await page.getByRole('button', { name: 'Download PDF' }).click();
    const texts = pdfTextLines(fs.readFileSync(await (await pdfDownload).path())).map((l) => l.text);
    expect(texts.indexOf('SKILLS')).toBeGreaterThan(-1);
    expect(texts.indexOf('SKILLS')).toBeLessThan(texts.indexOf('EXPERIENCE'));
    expect(texts.join(' ')).not.toContain('Running, chess');

    await page.getByRole('button', { name: /Word Document/ }).click();
    const wordDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download Word Document' }).click();
    const xml = unzipEntry(fs.readFileSync(await (await wordDownload).path()), 'word/document.xml');
    expect(xml.indexOf('SKILLS')).toBeLessThan(xml.indexOf('EXPERIENCE'));
    expect(xml).not.toContain('Running, chess');
  });

  test('ATS keyword match scores the CV against a job description in the browser and adds missing keywords', async ({ page }) => {
    const aiCalls: string[] = [];
    page.on('request', (r) => {
      if (/\/api\/cv-ai\/(extract|tailor)/.test(r.url())) aiCalls.push(r.url());
    });
    await seedCv(page, sampleCv, 10);
    await page.goto('/resources/cv-builder');
    const panel = page.getByRole('region', { name: 'ATS keyword match' });
    await panel
      .getByLabel('Job description for keyword match')
      .fill(
        'We are hiring a Senior Product Manager. You will own the roadmap, run A/B testing and write SQL. ' +
          'Build Tableau dashboards; Tableau and SQL are essential. Stakeholder management and Jira are required. Jira experience is a plus.',
      );
    const score = panel.getByTestId('ats-score');
    await expect(score).toHaveText(/\d+%/);
    const before = Number((await score.textContent())!.replace(/\D/g, ''));
    await expect(panel.getByTestId('ats-matched')).toContainText('SQL');
    await expect(panel.getByTestId('ats-missing')).toContainText('Tableau');
    await expect(panel.getByTestId('ats-missing')).toContainText('Jira');

    await panel.getByRole('button', { name: 'Add Tableau to skills' }).click();
    await expect(panel.getByTestId('ats-matched')).toContainText('Tableau');
    await expect(panel.getByTestId('ats-missing')).not.toContainText('Tableau');
    await expect.poll(async () => Number((await score.textContent())!.replace(/\D/g, ''))).toBeGreaterThan(before);
    await expect(page.locator('[data-cv-preview]').first()).toContainText('Tableau');
    expect(aiCalls).toEqual([]);
  });

  test('bullet helper inserts action verbs and flags weak bullets', async ({ page }) => {
    await page.goto('/resources/cv-builder');
    await page.getByRole('button', { name: /Create Manually/ }).click();
    await next(page);
    await next(page);
    const helperToggle = page.getByRole('button', { name: 'Bullet ideas for experience 1' });
    await expect(helperToggle).toHaveAttribute('aria-expanded', 'false');
    await helperToggle.click();
    await expect(helperToggle).toHaveAttribute('aria-expanded', 'true');
    await page.getByRole('button', { name: 'Insert "Increased"' }).click();
    await expect(page.getByLabel('Description')).toHaveValue(/^- Increased $/);

    await page.getByLabel('Description').fill('- Responsible for managing the team\n- Helped with reports');
    const feedback = page.getByTestId('bullet-feedback-0');
    await expect(feedback).toContainText('Responsible for');
    await expect(feedback).toContainText('0 of 2 bullets include a number');
    await page.getByLabel('Description').fill('- Cut reporting time by 40% by automating 12 Excel reports');
    await expect(feedback).toContainText('1 of 1 bullets include a number');
  });

  test('optional UAE / Gulf fields appear only when filled, in the preview and in Word', async ({ page }) => {
    await seedCv(page, { ...sampleCv }, 1);
    await page.goto('/resources/cv-builder');
    const preview = page.getByTestId('cv-live-preview');
    await expect(preview).not.toContainText('Nationality');
    await page.getByText('Additional details for UAE / Gulf CVs (optional)').click();
    await page.getByLabel('Nationality').fill('Pakistani');
    await page.getByLabel('Visa status').fill('Employment visa (transferable)');
    await page.getByLabel('Driving licence').fill('UAE driving licence');
    await page.getByLabel('Notice period').fill('30 days');
    await expect(preview).toContainText('Nationality: Pakistani');
    await expect(preview).toContainText('Visa status: Employment visa (transferable)');
    await expect(preview).toContainText('Driving licence: UAE driving licence');
    await expect(preview).toContainText('Notice period: 30 days');

    for (let i = 0; i < 9; i++) await next(page);
    await page.getByRole('button', { name: /Word Document/ }).click();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download Word Document' }).click();
    const xml = unzipEntry(fs.readFileSync(await (await download).path()), 'word/document.xml');
    expect(xml).toContain('Nationality: Pakistani');
    expect(xml).toContain('Notice period: 30 days');
  });

  test('backs up the CV as JSON and restores it; rejects files that are not a backup', async ({ page }) => {
    await seedCv(page, sampleCv, 1);
    await page.goto('/resources/cv-builder');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Save backup (.json)' }).click();
    const backupPath = await (await download).path();
    const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    expect(backup.app).toBe('naqashthaheem-cv-builder');
    expect(backup.data.fullName).toBe('Aisha Rahman');
    expect(backup.data.workExperience).toHaveLength(3);

    await page.getByRole('button', { name: 'Start from beginning' }).click();
    await page.getByRole('button', { name: 'Start Over' }).click();
    await page.getByRole('button', { name: /Create Manually/ }).click();
    await expect(page.getByLabel('Full Name')).toHaveValue('');

    const restore = page.locator('input[type="file"][aria-label="Restore backup file"]');
    await restore.setInputFiles({ name: 'notes.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":"world"}') });
    await expect(page.getByRole('alert').filter({ hasText: 'not a CV builder backup' })).toBeVisible();
    await restore.setInputFiles(backupPath);
    await expect(page.getByLabel('Full Name')).toHaveValue('Aisha Rahman');
    await expect(page.getByTestId('cv-live-preview')).toContainText('Careem');
  });

  test('every field has an accessible name and the main flow works from the keyboard', async ({ page }) => {
    await page.goto('/resources/cv-builder');
    await page.getByRole('button', { name: /Create Manually/ }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByLabel('Full Name')).toBeVisible();
    await page.getByLabel('Full Name').focus();
    await page.keyboard.type('Keyboard User');
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Job Title', { exact: true })).toBeFocused();

    const unnamed = () =>
      page.evaluate(() =>
        [...document.querySelectorAll('[data-testid="tool-root"] input, [data-testid="tool-root"] textarea, [data-testid="tool-root"] select, [data-testid="tool-root"] button')]
          .filter((el) => {
            const input = el as HTMLInputElement;
            if (input.type === 'hidden' || (input.type === 'file' && getComputedStyle(input).display === 'none')) return false;
            const r = el.getBoundingClientRect();
            if (r.width === 0 && r.height === 0) return false;
            const name =
              el.getAttribute('aria-label') ||
              (el.getAttribute('aria-labelledby') && document.getElementById(el.getAttribute('aria-labelledby')!)?.textContent) ||
              ('labels' in input && input.labels && input.labels.length ? input.labels[0].textContent : '') ||
              (el.tagName === 'BUTTON' ? el.textContent : '');
            return !String(name || '').trim();
          })
          .map((el) => `${el.tagName.toLowerCase()}[type=${(el as HTMLInputElement).type}] ${el.outerHTML.slice(0, 80)}`),
      );
    for (let step = 1; step <= 10; step++) {
      expect(await unnamed(), `step ${step}`).toEqual([]);
      if (step < 10) {
        await page.getByRole('button', { name: /^Next/ }).focus();
        await page.keyboard.press('Enter');
      }
    }
    await expect(page.getByRole('heading', { name: 'Export Your CV' })).toBeVisible();
    const wordFormat = page.getByRole('button', { name: /^📝\s*Word Document/ });
    await wordFormat.focus();
    await page.keyboard.press('Enter');
    await expect(wordFormat).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'Download Word Document' })).toBeVisible();
  });

  test('@mobile fits a 390px phone on every step and the form stays usable', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/resources/cv-builder');
    await page.getByRole('button', { name: /Create Manually/ }).click();
    await page.getByLabel('Full Name').fill('Mohammed Abdullah Al Mansouri');
    const overflow = () =>
      page.evaluate(() => {
        const width = document.documentElement.clientWidth;
        const offenders = [...document.querySelectorAll('[data-testid="tool-root"] *')]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && (r.right > width + 1 || r.left < -1) && !el.closest('[class*="overflow-x-auto"], [class*="overflow-auto"], [class*="overflow-y-auto"]');
          })
          .slice(0, 5)
          .map((el) => `${el.tagName.toLowerCase()}.${String((el as HTMLElement).className).slice(0, 60)}`);
        return { offenders, scroll: document.documentElement.scrollWidth - width };
      });
    for (let step = 1; step <= 10; step++) {
      if (step === 3) await page.getByRole('button', { name: 'Bullet ideas for experience 1' }).click();
      if (step === 10) await page.getByLabel('Job description for keyword match').fill('Looking for an operations manager with SAP, budgeting and logistics experience.');
      const result = await overflow();
      expect(result.offenders, `step ${step} overflowing elements`).toEqual([]);
      expect(result.scroll, `step ${step} scrolls horizontally`).toBeLessThanOrEqual(0);
      if (step < 10) {
        const nextButton = page.getByRole('button', { name: 'Next step' });
        await expect(nextButton).toBeInViewport();
        await nextButton.click();
      }
    }
    await expect(page.getByRole('button', { name: 'Download CV' })).toBeVisible();
  });
});

test.describe('LinkedIn optimizer', () => {
  test('requires some profile text, sends it and renders scores with addable keywords', async ({ page }) => {
    const bodies = await mockCareerApi(page, 'linkedin/analyze', {
      headlineScore: 62,
      summaryScore: 70,
      skillsScore: 55,
      overallScore: 64,
      recommendations: [{ category: 'Headline', priority: 'High', suggestion: 'Lead with your target role.', example: 'QA Lead | Playwright' }],
      keywordSuggestions: ['Test Strategy', 'CI/CD'],
      profileStrengths: ['Clear summary'],
      areasForImprovement: ['Few skills listed'],
      industryKeywords: ['Quality Engineering'],
    });
    await page.goto('/resources/linkedin-optimizer');

    await page.getByRole('button', { name: 'Analyze My Profile' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Add at least your headline' })).toBeVisible();
    expect(bodies).toHaveLength(0);

    await page.getByLabel('Current Headline').fill('QA Engineer at Acme');
    await expect(page.getByTestId('headline-count')).toHaveText('19/220');
    await page.getByLabel('About Section').fill('I build reliable test automation for SaaS teams.');
    await page.getByLabel('Skills (comma-separated)').pressSequentially('Test Automation, Playwright');
    await page.getByRole('button', { name: 'Analyze My Profile' }).click();

    await expect(page.getByTestId('overall-score')).toHaveText('64%');
    await expect(page.getByText('Lead with your target role.')).toBeVisible();
    expect(bodies[0]).toMatchObject({ profile_data: { headline: 'QA Engineer at Acme', skills: ['Test Automation', 'Playwright'] } });

    const keyword = page.getByRole('button', { name: /CI\/CD/ });
    await expect(keyword).toHaveAttribute('aria-pressed', 'false');
    await keyword.click();
    await expect(keyword).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('skills-list')).toContainText('Test Automation, Playwright, CI/CD');
  });
});

test.describe('Interview prep', () => {
  test('walks through the steps, sends API-valid values and shows questions, STAR and research', async ({ page }) => {
    const bodies = await mockCareerApi(page, 'interview-prep/generate', {
      practiceQuestions: [
        { category: 'Behavioral', question: 'Tell me about a release you rescued.', difficulty: 'Medium', tips: 'Use STAR.', sampleAnswer: 'In my last role…' },
      ],
      companyResearch: { keyPoints: ['Builds billing software'], culture: 'Remote-first', recentNews: 'Opened a Dubai office' },
      technicalPrep: [{ topic: 'Test pyramids', importance: 'High', resources: ['Martin Fowler article'] }],
      questionsToAsk: ['How do you measure quality?'],
      confidenceTips: ['Prepare three stories'],
    });
    await page.goto('/resources/interview-prep');

    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('alert')).toContainText('Enter the job title');
    await page.getByLabel('Job Title *').fill('QA Lead');
    await page.getByLabel('Company Name *').fill('Acme');
    await page.getByLabel('Industry *').selectOption('technology');
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
    await page.getByRole('radio', { name: /Panel Interview/ }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    await page.getByLabel('Experience Level *').selectOption('executive');
    await page.getByLabel('Technical Skills (comma-separated) *').fill('Playwright, SQL');
    await page.getByLabel('Soft Skills (comma-separated) *').fill('Mentoring');
    await page.getByRole('button', { name: 'Generate Prep Plan' }).click();

    await expect(page.getByRole('heading', { name: 'Tell me about a release you rescued.' })).toBeVisible();
    expect(bodies[0]).toMatchObject({ interview_type: 'panel', experience_level: 'executive', technical_skills: ['Playwright', 'SQL'], soft_skills: ['Mentoring'] });

    const toggle = page.getByRole('button', { name: 'View Answer' });
    await toggle.click();
    await expect(page.getByText('In my last role…')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hide Answer' })).toHaveAttribute('aria-expanded', 'true');

    await page.getByRole('button', { name: 'Learn STAR Method' }).click();
    await expect(page.getByRole('heading', { name: 'Situation', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Company Research' }).click();
    await expect(page.getByText('Builds billing software')).toBeVisible();
    await expect(page.getByText('How do you measure quality?')).toBeVisible();
  });
});

test.describe('Salary negotiation', () => {
  test('calculates the raise, validates inputs and renders the plan in the chosen currency', async ({ page }) => {
    const bodies = await mockCareerApi(page, 'salary-negotiation/generate', {
      marketSalary: { min: 200000, max: 260000, median: 230000, source: 'Estimate' },
      negotiationRange: { minimum: 215000, target: 240000, maximum: 255000 },
      strategy: { approach: 'Collaborative', timing: 'After the offer', keyPoints: ['Lead with impact'] },
      scripts: [{ situation: 'Offer is below target', script: 'Thank you, based on my research…' }],
      benefits: ['Signing bonus'],
      fallbackOptions: ['Extra leave'],
    });
    await page.goto('/resources/salary-negotiation');

    await page.getByLabel('Currency').selectOption('AED');
    await page.getByLabel('Current Salary (annual) *').fill('200000');
    await page.getByLabel('Desired Salary (annual) *').fill('230000');
    await expect(page.getByTestId('raise-summary')).toContainText('15.0%');
    await page.getByRole('button', { name: 'Continue' }).click();

    await page.getByLabel('Job Title *').fill('QA Lead');
    await page.getByLabel('Location *').fill('Dubai');
    await page.getByLabel('Years of Experience *').fill('7.5');
    await page.getByLabel('Key Skills (comma-separated) *').fill('Playwright');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('alert')).toContainText('whole number');
    await page.getByLabel('Years of Experience *').fill('7');
    await page.getByRole('button', { name: 'Continue' }).click();

    await page.getByLabel('Company Size *').selectOption('enterprise');
    await page.getByRole('button', { name: 'Generate Negotiation Plan' }).click();

    await expect(page.getByTestId('target-salary')).toContainText('240,000');
    await expect(page.getByTestId('target-salary')).toContainText('AED');
    await expect(page.getByText('Thank you, based on my research…')).toBeVisible();
    await expect(page.getByTestId('tool-root').getByText('Signing bonus', { exact: true })).toBeVisible();
    expect(bodies[0]).toMatchObject({ current_salary: 200000, desired_salary: 230000, experience_years: 7, education_level: 'bachelor', skills: ['Playwright'], company_size: 'enterprise' });
  });
});

test.describe('Career path planner', () => {
  test('collects profile, goals and preferences and renders paths and the action plan', async ({ page }) => {
    const bodies = await mockCareerApi(page, 'career-path/generate', {
      careerPaths: [
        { title: 'QA Leadership Track', description: 'QA Lead then Head of QA', timeline: '2-3 years', probability: 'High', skills: ['Leadership'], nextSteps: ['Mentor a junior'], salary: { future: 300000 } },
      ],
      skillGaps: [{ skill: 'People management', importance: 'High', action: 'Take a management course', timeline: '6 months' }],
      networking: [{ activity: 'Join a testing meetup', timeline: 'Monthly', benefit: 'Visibility' }],
      education: [{ type: 'Certification', name: 'ISTQB Advanced', timeline: '3 months', cost: 'varies' }],
      milestones: [{ milestone: 'Lead a release', timeline: '6 months', success: 'Shipped on time' }],
    });
    await page.goto('/resources/career-path-planner');

    await page.getByLabel('Current Job Title *').fill('QA Engineer');
    await page.getByLabel('Industry *').selectOption('technology');
    await page.getByLabel('Years of Experience *').fill('4');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByLabel('Current Skills (comma-separated) *').fill('Playwright, SQL');
    await page.getByLabel('Career Interests (comma-separated) *').fill('Leadership');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('alert')).toContainText('career goals');
    await page.getByLabel('Career Goals *').fill('Become a QA lead within two years.');
    await page.getByLabel('Preferred Location').fill('Dubai');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByLabel('Remote work').check();
    await page.getByRole('button', { name: 'Generate Career Plan' }).click();

    await expect(page.getByRole('heading', { name: 'QA Leadership Track' })).toBeVisible();
    await expect(page.getByText('300,000')).toBeVisible();
    expect(bodies[0]).toMatchObject({ experience_years: 4, skills: ['Playwright', 'SQL'], interests: ['Leadership'], education_level: 'bachelor', work_preferences: ['Remote work'], location: 'Dubai' });

    await page.getByRole('button', { name: 'View Action Plan' }).click();
    await expect(page.getByText('People management')).toBeVisible();
    await expect(page.getByText('ISTQB Advanced')).toBeVisible();
    await expect(page.getByText('Lead a release')).toBeVisible();
  });
});

test.describe('Job search optimizer', () => {
  test('sends the real salary and job type and renders the strategy tabs', async ({ page }) => {
    const bodies = await mockCareerApi(page, 'job-search/generate', {
      jobRecommendations: [{ title: 'QA Lead', company: 'Example Co', location: 'Dubai', salary: 'AED 25k/month', match: '90%', description: 'Own quality', whyMatch: 'Playwright', applicationTips: ['Show CI work'] }],
      searchStrategy: { keywords: ['QA Lead', 'SDET'], platforms: ['LinkedIn', 'Bayt'], timing: 'Weekday mornings', frequency: '5 per week' },
      applicationOptimization: { resumeTips: ['Quantify impact'], coverLetterTips: ['Mirror the job ad'], portfolioTips: [] },
      networkingStrategy: { online: ['Comment on QA posts'], offline: ['Attend meetups'], informationalInterviews: ['Ask QA managers for 20 minutes'] },
      interviewPreparation: { commonQuestions: ['Tell me about yourself'], technicalQuestions: ['Design a test strategy'] },
      salaryNegotiation: { research: 'Check salary surveys', timing: 'After the offer' },
    });
    await page.goto('/resources/job-search-optimizer');

    await page.getByLabel('Desired Job Title *').fill('QA Lead');
    await page.getByLabel('Preferred Location *').fill('Dubai');
    await page.getByLabel('Years of Experience *').fill('6');
    await page.getByLabel('Industry *').selectOption('Technology');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByLabel('Skills (comma-separated) *').fill('Playwright, CI/CD');
    await page.getByLabel('Remote Work').check();
    await page.getByRole('button', { name: 'Next: Job Type & Salary' }).click();
    await page.getByLabel('Job Type *').selectOption('hybrid');
    await page.getByLabel('Currency').selectOption('AED');
    await page.getByLabel('Expected Annual Salary *').fill('300000');
    await page.getByRole('button', { name: 'Generate Search Strategy' }).click();

    await expect(page.getByTestId('search-keywords')).toContainText('SDET');
    await expect(page.getByRole('heading', { name: 'QA Lead', exact: true })).toBeVisible();
    // Regression: the salary range used to be ignored and always sent as 100000.
    expect(bodies[0]).toMatchObject({ salary_expectation: 300000, job_type: 'hybrid', industry: 'Technology', experience_years: 6, skills: ['Playwright', 'CI/CD'], preferences: ['Remote Work'] });

    await page.getByRole('tab', { name: 'Applications' }).click();
    await expect(page.getByText('Quantify impact')).toBeVisible();
    await page.getByRole('tab', { name: 'Networking' }).click();
    await expect(page.getByText('Attend meetups')).toBeVisible();
    await expect(page.getByText('Design a test strategy')).toBeVisible();
  });
});

test.describe('Skills assessment', () => {
  test('picks, adds and rates skills and renders scores, gaps and the learning path', async ({ page }) => {
    const bodies = await mockCareerApi(page, 'skills-assessment/generate', {
      overallScore: 72,
      categoryScores: { 'Technical Skills': 80, Communication: 65 },
      strengths: [{ skill: 'Patient Care', level: 'Advanced', score: 88, evidence: 'Eight years on ward' }],
      weaknesses: [{ skill: 'Budgeting', currentLevel: 'Beginner', score: 30, improvement: 'Take a finance for managers course' }],
      recommendations: [{ category: 'Leadership', skills: [{ name: 'Delegation', priority: 'High', currentLevel: 'Beginner', targetLevel: 'Intermediate', action: 'Shadow a ward manager', timeline: '3 months', resources: ['NHS leadership academy'] }] }],
      learningPath: [{ phase: 'Immediate (1-3 months)', title: 'Foundation', focus: 'Management basics', skills: ['Delegation'], activities: ['Lead handovers'], resources: [] }],
      careerAlignment: { overallMatch: 70, recommendedRoles: [{ title: 'Nurse Manager', match: 75, missingSkills: ['Budgeting'], nextSteps: ['Lead a quality project'] }] },
    });
    await page.goto('/resources/skills-assessment');

    await page.getByLabel('Years of Experience *').fill('8');
    await page.getByLabel('Industry *').selectOption('healthcare');
    await page.getByLabel('Current Role *').fill('Registered Nurse');
    await page.getByLabel('Career Goal *').fill('Become a nurse manager');
    await page.getByRole('button', { name: 'Next: Select Skills' }).click();

    await page.getByLabel('Filter skills').fill('patient');
    await page.getByRole('button', { name: 'Patient Care' }).click();
    await expect(page.getByRole('button', { name: /Patient Care/ })).toHaveAttribute('aria-pressed', 'true');
    await page.getByLabel('Filter skills').fill('');
    await page.getByRole('button', { name: 'Communication', exact: true }).click();
    await page.getByLabel('Add a skill that is not listed').fill('Epic EHR');
    await page.getByLabel('Add a skill that is not listed').press('Enter');
    await expect(page.getByTestId('selected-count')).toHaveText('3 skills selected');
    await page.getByRole('button', { name: 'Next: Rate Skills' }).click();

    await page.getByLabel('Proficiency level').first().selectOption('Expert');
    await page.getByRole('button', { name: 'Complete Assessment' }).click();

    await expect(page.getByTestId('overall-score')).toHaveText('72%');
    await expect(page.getByText('Take a finance for managers course')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nurse Manager' })).toBeVisible();
    // Regression: current role and goal used to be hard-coded and industry skills were dropped.
    expect(bodies[0]).toMatchObject({
      current_role: 'Registered Nurse',
      career_goals: 'Become a nurse manager',
      experience_years: 8,
      technical_skills: ['Patient Care (Expert, importance: Medium)', 'Epic EHR (Intermediate, importance: Medium)'],
      soft_skills: ['Communication (Intermediate, importance: Medium)'],
    });

    await page.getByRole('button', { name: 'View Recommendations' }).click();
    await expect(page.getByText('Shadow a ward manager')).toBeVisible();
    await page.getByRole('button', { name: 'Learning Path' }).click();
    await expect(page.getByRole('heading', { name: 'Foundation' })).toBeVisible();
  });
});

test.describe('Career tools on phones', () => {
  test('@mobile every career tool fits a phone screen without horizontal overflow', async ({ page }) => {
    for (const tool of careerTools) {
      await page.goto(`/resources/${tool.slug}`);
      await expect(page.locator('h1')).toHaveText(tool.h1);
      const root = page.getByTestId('tool-root');
      await expect(root.locator('button:visible').first()).toBeVisible();
      if (tool.slug === 'cv-builder') {
        await root.getByRole('button', { name: /Create Manually/ }).click();
        await expect(root.getByLabel('Full Name')).toBeVisible();
        await root.getByLabel('Full Name').fill('A Very Long Name That Should Wrap Nicely On Phones');
        // The live preview starts collapsed on phones and must fit when opened.
        const show = root.getByRole('button', { name: 'Show preview' });
        if (await show.isVisible()) await show.click();
        await expect(root.getByTestId('cv-live-preview')).toContainText('A Very Long Name');
      }
      const overflow = await page.evaluate(() => {
        const width = document.documentElement.clientWidth;
        const offenders = [...document.querySelectorAll('[data-testid="tool-root"] *')]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && (r.right > width + 1 || r.left < -1) && !el.closest('[class*="overflow-x-auto"], [class*="overflow-auto"]');
          })
          .slice(0, 5)
          .map((el) => `${el.tagName.toLowerCase()}.${String((el as HTMLElement).className).slice(0, 60)}`);
        return { offenders, scroll: document.documentElement.scrollWidth - width };
      });
      expect(overflow.offenders, `${tool.slug} overflowing elements`).toEqual([]);
      expect(overflow.scroll, `${tool.slug} page scrolls horizontally`).toBeLessThanOrEqual(0);
    }
  });
});
