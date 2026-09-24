import { test, expect } from './fixtures';
import { services } from '../src/data/services';

test.describe('Services', () => {
  test('services hub lists all six services', async ({ page }) => {
    await page.goto('/services');
    await expect(page.locator('h1')).toHaveText('Plan, build, automate, optimize, test and scale');
    await expect(page.getByTestId('service-card')).toHaveCount(6);
  });

  for (const service of services) {
    test(`${service.name} page renders its content`, async ({ page }) => {
      await page.goto(`/services/${service.slug}`);
      await expect(page.locator('h1')).toHaveText(service.h1);

      const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
      await expect(crumbs.getByRole('link', { name: 'Services' })).toHaveAttribute('href', '/services');
      await expect(crumbs.locator('[aria-current="page"]')).toHaveText(service.name);

      for (const section of service.sections) {
        await expect(page.getByRole('heading', { level: 2, name: section.heading, exact: true })).toBeVisible();
      }
      for (const faq of service.faqs) {
        await expect(page.getByRole('heading', { level: 3, name: faq.question })).toBeVisible();
      }

      const others = page.getByRole('navigation', { name: 'Other services' }).getByRole('link');
      await expect(others).toHaveCount(services.length - 1);

      await page.getByRole('link', { name: 'Discuss your project', exact: true }).click();
      await expect(page).toHaveURL(/\/contact$/);
    });
  }

  test('SEO service covers the audit workflow and search intent types', async ({ page }) => {
    await page.goto('/services/seo-organic-growth');
    for (const intent of ['Informational', 'Commercial investigation', 'Transactional', 'Navigational']) {
      await expect(page.getByRole('heading', { level: 3, name: intent, exact: true })).toBeVisible();
    }
    for (let i = 1; i <= 8; i++) {
      await expect(page.getByRole('heading', { level: 3, name: new RegExp(`^0${i} ·`) })).toBeVisible();
    }
    await expect(page.getByText('Only verified results are reported')).toBeVisible();
  });

  test('related case studies link to case-study pages', async ({ page }) => {
    await page.goto('/services/qa-test-automation');
    const related = page.locator('section', { has: page.getByRole('heading', { name: 'Related case studies' }) });
    await related.getByTestId('case-study-card').filter({ hasText: 'CloudPOS4U' }).click();
    await expect(page.locator('h1')).toHaveText('CloudPOS4U');
  });

  test('unknown service slug renders a noindex 404', async ({ page }) => {
    await page.goto('/services/does-not-exist');
    await expect(page.locator('h1')).toHaveText('404');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });
});
