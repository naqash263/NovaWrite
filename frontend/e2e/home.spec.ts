import { test, expect, mockPosts } from './fixtures';
import { services } from '../src/data/services';
import { featuredCaseStudies } from '../src/data/caseStudies';

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('hero presents the positioning and a single H1', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText('Build. Automate. Optimize. Scale.');
    await expect(h1).toContainText('Naqash Thaheem');
    await expect(h1).toContainText('Technical Project Manager');
  });

  test('primary CTAs lead to case studies and contact', async ({ page }) => {
    await page.getByRole('link', { name: 'Explore projects' }).first().click();
    await expect(page).toHaveURL(/\/case-studies$/);
    await expect(page.locator('h1')).toHaveText('Case studies');

    await page.goto('/');
    await page.getByRole('link', { name: 'Discuss a project' }).first().click();
    await expect(page).toHaveURL(/\/contact$/);
  });

  test('featured expertise lists every service and links to its page', async ({ page }) => {
    const cards = page.getByTestId('service-card');
    await expect(cards).toHaveCount(services.length);
    for (const service of services) {
      await expect(page.locator(`a[data-testid="service-card"][href="/services/${service.slug}"]`)).toContainText(service.name);
    }
    await cards.filter({ hasText: 'SEO & Organic Growth' }).click();
    await expect(page).toHaveURL(/\/services\/seo-organic-growth$/);
  });

  test('shows the six featured case studies', async ({ page }) => {
    const cards = page.getByTestId('case-study-card');
    await expect(cards).toHaveCount(featuredCaseStudies.length);
    expect(featuredCaseStudies.map((c) => c.name)).toEqual(
      expect.arrayContaining(['CloudPOS4U', 'Villas Olimpia', 'Recruitment ONE', 'AI Proposal Factory']),
    );
    await cards.filter({ hasText: 'Villas Olimpia' }).click();
    await expect(page.locator('h1')).toHaveText('Villas Olimpia');
  });

  test('automation approach lists the ten discovery questions', async ({ page }) => {
    const section = page.locator('section', { has: page.getByRole('heading', { name: 'The process comes before the tool' }) });
    await expect(section.locator('ol > li')).toHaveCount(10);
    await expect(section).toContainText('Human approval points');
  });

  test('FAQ answers expand on click', async ({ page }) => {
    const question = page.getByText('What does a Technical Project Manager do?');
    const answer = page.getByText(/connects business goals with technical delivery/);
    await expect(answer).toBeHidden();
    await question.click();
    await expect(answer).toBeVisible();
  });

  test('latest insights render posts from the API', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Latest insights' })).toBeVisible();
    for (const post of mockPosts) {
      await expect(page.getByText(post.title).first()).toBeVisible();
    }
  });

  test('does not publish unverified performance numbers', async ({ page }) => {
    const text = await page.locator('main').innerText();
    expect(text).not.toMatch(/100\+\s*Projects/i);
    expect(text).not.toMatch(/50\+\s*AI Workflows/i);
  });
});
