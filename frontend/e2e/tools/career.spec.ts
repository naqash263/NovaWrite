// Career tools at /resources/{slug}: SEO/AEO/GEO checks per page, functional checks of
// each tool's main flow (AI endpoints mocked), and a phone-width overflow check.
import fs from 'node:fs';
import zlib from 'node:zlib';
import type { Page, Route } from '@playwright/test';
import { test, expect } from '../fixtures';
import { careerTools } from '../../src/data/careerTools';

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** Extracts `x y Td (text) Tj` operations from a (Flate-compressed) jsPDF file. */
function textPositions(pdf: Buffer): { x: number; text: string }[] {
  const out: { x: number; text: string }[] = [];
  const raw = pdf.toString('latin1');
  for (const m of raw.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)) {
    let content: string;
    try {
      content = zlib.inflateSync(Buffer.from(m[1], 'latin1')).toString('latin1');
    } catch {
      continue;
    }
    for (const t of content.matchAll(/([-\d.]+) [-\d.]+ Td\s*(?:\/F\d+ [\d.]+ Tf\s*)?\(([^)]*)\) Tj/g)) out.push({ x: Number(t[1]), text: t[2].trim() });
  }
  return out;
}

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

  test('builds a CV with live preview, experience entries, template choice and PDF / Word export', async ({ page, pageErrors }) => {
    test.setTimeout(90_000);
    await page.route('**/api/cv-templates', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [apiTemplate] }) }),
    );
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

    await page.getByRole('button', { name: /^Next/ }).click();
    await page.getByLabel('Professional Summary').fill('QA lead with a focus on Playwright automation.');
    await page.getByRole('button', { name: /^Next/ }).click();

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
    for (let i = 0; i < 6; i++) await page.getByRole('button', { name: /^Next/ }).click();
    await expect(page.getByRole('heading', { name: 'Choose Your ATS-Friendly Template' })).toBeVisible();
    await page.getByRole('button', { name: 'Template Gallery' }).click();
    await page.getByRole('button', { name: 'Select template: Classic ATS' }).click();
    const templatePreview = page.locator('[data-cv-preview]');
    await expect(templatePreview).toContainText('Jane <b>Doe</b>');
    await expect(templatePreview).toContainText('Acme Corp');
    await expect(templatePreview).not.toContainText('MOCK TEMPLATE');

    // Step 10: export.
    await page.getByRole('button', { name: /^Next/ }).click();
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
    const positions = textPositions(pdfBytes);
    expect(positions.map((p) => p.text).join('')).toContain('Acme Corp'.replace(' ', ''));
    for (const p of positions) {
      expect(p.x, `"${p.text}" x`).toBeGreaterThanOrEqual(0);
      expect(p.x, `"${p.text}" x`).toBeLessThan(595);
    }

    expect(pageErrors).toEqual([]);
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
