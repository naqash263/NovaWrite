import { test, expect, adminUser, loginAsAdmin } from '../fixtures';
import type { Page } from '@playwright/test';

async function mockLogin(page: Page, status: number, body: unknown) {
  await page.route(
    (u) => u.pathname === '/api/auth/login',
    (route) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) }),
  );
}

test.describe('Admin login', () => {
  test('signs in and returns to the page that required login', async ({ page }) => {
    await mockLogin(page, 200, { token: 'e2e-token', user: adminUser });
    await page.goto('/admin/tags');
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.locator('h1')).toHaveText('Admin sign in');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);

    // After login the app asks /auth/me; answer as admin from now on.
    await page.route((u) => u.pathname === '/api/auth/me', (r) => r.fulfill({ json: adminUser }));
    const request = page.waitForRequest((r) => r.url().endsWith('/api/auth/login') && r.method() === 'POST');
    await page.getByLabel('Email').fill('admin@naqashthaheem.com');
    await page.getByLabel('Password', { exact: true }).fill('secret-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    expect((await request).postDataJSON()).toMatchObject({ email: 'admin@naqashthaheem.com', password: 'secret-password' });
    await expect(page).toHaveURL(/\/admin\/tags$/);
    await expect(page.getByRole('navigation', { name: 'Admin' })).toBeVisible();
  });

  test('shows the server error for wrong credentials', async ({ page }) => {
    await mockLogin(page, 401, { message: 'Invalid credentials' });
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill('admin@naqashthaheem.com');
    await page.getByLabel('Password', { exact: true }).fill('wrong');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('alert')).toHaveText('Invalid credentials');
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test('rejects accounts without admin access', async ({ page }) => {
    await mockLogin(page, 200, { token: 'user-token', user: { ...adminUser, role: 'user' } });
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password', { exact: true }).fill('secret');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('alert')).toHaveText('This account does not have administrator access.');
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
  });

  test('password visibility can be toggled', async ({ page }) => {
    await page.goto('/admin/login');
    const password = page.getByLabel('Password', { exact: true });
    await password.fill('abc');
    await expect(password).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: 'Show password' }).click();
    await expect(password).toHaveAttribute('type', 'text');
  });

  test('already signed-in admins skip the login form', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/login');
    await expect(page).toHaveURL(/\/admin$/);
  });
});
