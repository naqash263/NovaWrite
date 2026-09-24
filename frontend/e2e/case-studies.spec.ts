import { test, expect } from './fixtures';
import { caseStudies, featuredCaseStudies } from '../src/data/caseStudies';

test.describe('Case studies', () => {
  test('listing shows featured and additional projects', async ({ page }) => {
    await page.goto('/case-studies');
    await expect(page.getByTestId('case-study-card')).toHaveCount(caseStudies.length);
    const featured = page.locator('section', { has: page.getByRole('heading', { name: 'Featured projects' }) });
    await expect(featured.getByTestId('case-study-card')).toHaveCount(featuredCaseStudies.length);
    await expect(page.getByRole('link', { name: 'Browse all projects' })).toHaveAttribute('href', '/projects');
  });

  for (const study of caseStudies) {
    test(`${study.name} case study renders the structured sections`, async ({ page }) => {
      await page.goto(`/case-studies/${study.slug}`);
      await expect(page.locator('h1')).toHaveText(study.name);
      await expect(page.getByText(`Case study · Project ${study.number}`)).toBeVisible();

      for (const heading of ['Overview', 'Technology stack', 'Outcome']) {
        await expect(page.getByRole('heading', { level: 2, name: heading, exact: true })).toBeVisible();
      }
      if (study.workflow) {
        await expect(page.getByTestId('flow-steps').locator('li')).toHaveCount(study.workflow.steps.length);
      }
      const stack = page.getByRole('list', { name: 'Technology stack' }).locator('li');
      await expect(stack).toHaveCount(study.stack.length);

      for (const serviceSlug of study.services) {
        await expect(page.locator(`aside a[href="/services/${serviceSlug}"]`)).toBeVisible();
      }
    });
  }

  test('previous / next navigation cycles through case studies', async ({ page }) => {
    await page.goto(`/case-studies/${caseStudies[0].slug}`);
    await page.getByRole('link', { name: new RegExp(`Next\\s*${caseStudies[1].name}`) }).click();
    await expect(page.locator('h1')).toHaveText(caseStudies[1].name);
    await page.getByRole('link', { name: new RegExp(`Previous\\s*${caseStudies[0].name}`) }).click();
    await expect(page.locator('h1')).toHaveText(caseStudies[0].name);
  });

  test('Villas Olimpia documents the WhatsApp provider evaluation', async ({ page }) => {
    await page.goto('/case-studies/villas-olimpia-ai-booking-automation');
    for (const provider of ['Meta Cloud API', 'Twilio', 'Evolution API', 'Whatsmeow']) {
      await expect(page.getByText(provider, { exact: true }).first()).toBeVisible();
    }
  });

  test('unknown case study slug renders a noindex 404', async ({ page }) => {
    await page.goto('/case-studies/not-a-real-project');
    await expect(page.locator('h1')).toHaveText('404');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });
});
