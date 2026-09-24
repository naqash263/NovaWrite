import { test, expect } from './fixtures';
import { services } from '../src/data/services';
import { featuredCaseStudies } from '../src/data/caseStudies';

test.describe('Desktop navigation', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop only');

  test('Services dropdown lists every service and navigates', async ({ page }) => {
    await page.goto('/');
    const primary = page.getByRole('navigation', { name: 'Primary' });
    const trigger = primary.getByRole('button', { name: 'Services' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    const menu = page.locator('#services-menu');
    for (const service of services) {
      await expect(menu.getByRole('link', { name: new RegExp(service.name.replace(/[&]/g, '.')) })).toBeVisible();
    }
    await menu.getByRole('link', { name: /QA & Test Automation/ }).click();
    await expect(page).toHaveURL(/\/services\/qa-test-automation$/);
    await expect(page.locator('#services-menu')).toBeHidden();
    await expect(page.locator('h1')).toHaveText('QA & Test Automation');
  });

  test('dropdowns close on Escape and outside click', async ({ page }) => {
    await page.goto('/about');
    const primary = page.getByRole('navigation', { name: 'Primary' });
    await primary.getByRole('button', { name: 'More' }).click();
    await expect(page.locator('#more-menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#more-menu')).toBeHidden();

    await primary.getByRole('button', { name: 'Services' }).click();
    await expect(page.locator('#services-menu')).toBeVisible();
    await page.mouse.click(20, 850);
    await expect(page.locator('#services-menu')).toBeHidden();
  });

  test('top-level links reach their pages and mark the active item', async ({ page }) => {
    await page.goto('/');
    const primary = page.getByRole('navigation', { name: 'Primary' });
    for (const [label, path, heading] of [
      ['Case Studies', '/case-studies', 'Case studies'],
      ['About', '/about', 'Business + Project Management + Technology + Quality'],
    ] as const) {
      await primary.getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.locator('h1')).toHaveText(heading);
      await expect(primary.getByRole('link', { name: label, exact: true })).toHaveClass(/text-blue-700/);
    }
  });

  test('Ctrl+K opens site search and submits to /search', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Control+k');
    const input = page.locator('#site-search');
    await expect(input).toBeFocused();
    await input.fill('n8n');
    await input.press('Enter');
    await expect(page).toHaveURL(/\/search\?q=n8n$/);
  });

  test('"Book a consultation" opens the booking modal', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Book a consultation' }).first().click();
    await expect(page.getByRole('heading', { name: 'Book Consultation' })).toBeVisible();
  });

  test('skip link targets the main content', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await expect(skip).toHaveAttribute('href', '#main-content');
    await expect(page.locator('main#main-content')).toHaveCount(1);
  });
});

test.describe('Footer', () => {
  test('links to every service and featured case study', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    for (const service of services) {
      await expect(footer.locator(`a[href="/services/${service.slug}"]`)).toHaveCount(1);
    }
    for (const study of featuredCaseStudies) {
      await expect(footer.locator(`a[href="/case-studies/${study.slug}"]`)).toHaveCount(1);
    }
    await expect(footer.locator('a[href="mailto:contact@naqashthaheem.com"]')).toBeVisible();
    for (const external of await footer.locator('a[target="_blank"]').all()) {
      await expect(external).toHaveAttribute('rel', /noopener/);
    }
  });
});

test.describe('Mobile navigation @mobile', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile only');

  test('hamburger menu opens, navigates and closes', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeHidden();
    const toggle = page.getByRole('button', { name: 'Open menu' });
    await toggle.click();
    const menu = page.getByRole('navigation', { name: 'Mobile' });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('link', { name: 'SEO & Organic Growth' })).toBeVisible();
    await menu.getByRole('link', { name: 'Case Studies' }).click();
    await expect(page).toHaveURL(/\/case-studies$/);
    await expect(page.getByRole('navigation', { name: 'Mobile' })).toBeHidden();
  });

  test('mobile menu can book a consultation', async ({ page }) => {
    await page.goto('/services');
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('navigation', { name: 'Mobile' }).getByRole('button', { name: 'Book a consultation' }).click();
    await expect(page.getByRole('heading', { name: 'Book Consultation' })).toBeVisible();
  });
});
