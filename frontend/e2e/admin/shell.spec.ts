import { test, expect, loginAsAdmin } from '../fixtures';
import { adminNavItems } from '../../src/components/admin/adminNav';

test.describe('Admin access control', () => {
  test('anonymous visitors are sent to the admin login', async ({ page }) => {
    await page.goto('/admin/posts');
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test('non-admin users cannot open the admin area', async ({ page }) => {
    await loginAsAdmin(page, { id: 2, name: 'Regular User', email: 'user@example.com', role: 'user' });
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/unauthorized$/);
  });
});

test.describe('Admin shell', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('sidebar lists every admin page and marks the current one', async ({ page }) => {
    await page.goto('/admin/posts');
    const nav = page.getByRole('navigation', { name: 'Admin' });
    await expect(nav.getByRole('link')).toHaveCount(adminNavItems.length);
    await expect(nav.getByRole('link', { name: 'Posts', exact: true })).toHaveAttribute('aria-current', 'page');
    const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(crumbs.locator('[aria-current="page"]')).toHaveText('Posts');
    await nav.getByRole('link', { name: 'Tags', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/tags$/);
    await expect(crumbs.locator('[aria-current="page"]')).toHaveText('Tags');
  });

  test('command palette jumps to a page with the keyboard', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('navigation', { name: 'Admin' })).toBeVisible();
    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog', { name: 'Go to admin page' });
    await expect(dialog).toBeVisible();
    await page.keyboard.type('smtp');
    await expect(dialog.getByRole('option')).toHaveCount(1);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/admin\/smtp-configurations$/);
    await expect(dialog).toBeHidden();
  });

  test('view site opens in a new tab and logout is available', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('link', { name: /View site/ })).toHaveAttribute('target', '_blank');
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
  });
});

test.describe('Admin shell on mobile @mobile', () => {
  test('navigation drawer opens and closes', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile only');
    await loginAsAdmin(page);
    await page.goto('/admin');
    await expect(page.getByRole('navigation', { name: 'Admin' })).toBeHidden();
    await page.getByRole('button', { name: 'Open navigation' }).click();
    const drawer = page.getByRole('dialog', { name: 'Admin navigation' });
    await drawer.getByRole('link', { name: 'Email Logs' }).click();
    await expect(page).toHaveURL(/\/admin\/email-logs$/);
    await expect(drawer).toBeHidden();
  });
});

test.describe('Every admin page loads', () => {
  for (const item of adminNavItems) {
    test(`${item.path} renders without crashing`, async ({ page, pageErrors }) => {
      await loginAsAdmin(page);
      await page.goto(item.path);
      await expect(page.getByRole('navigation', { name: 'Admin' })).toBeVisible();
      await expect(page.getByText('Oops! Something went wrong')).toHaveCount(0);
      await expect(page.locator('#admin-main')).not.toBeEmpty();
      // Let data requests settle, then make sure the page still stands.
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Oops! Something went wrong')).toHaveCount(0);
      expect(await page.locator('h1').count(), 'at most one h1').toBeLessThanOrEqual(1);
      expect(pageErrors, 'uncaught page errors').toEqual([]);
    });
  }
});
