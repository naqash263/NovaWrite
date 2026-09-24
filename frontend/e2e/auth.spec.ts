import { test, expect } from './fixtures';

test('public login updates the header without a page reload', async ({ page }) => {
  const member = { id: 7, name: 'Sara Ali', email: 'sara@example.com', role: 'user' };
  await page.route((u) => u.pathname === '/api/auth/login', (r) => r.fulfill({ json: { token: 'member-token', user: member } }));
  await page.goto('/login');
  // Once a token exists the app re-validates it with /auth/me.
  await page.route((u) => u.pathname === '/api/auth/me', (r) => r.fulfill({ json: member }));
  await page.evaluate(() => ((window as unknown as { __noReload: boolean }).__noReload = true));
  await page.getByLabel(/email/i).first().fill(member.email);
  await page.getByLabel(/^password/i).first().fill('secret-password');
  await page.locator('form').getByRole('button', { name: /sign in|log in|login/i }).first().click();
  await expect(page).toHaveURL(/\/$/, { timeout: 10_000 });
  await expect(page.getByRole('button', { name: 'Account menu' })).toBeVisible();
  // Same document: the marker set before login survived, so no reload happened.
  expect(await page.evaluate(() => (window as unknown as { __noReload?: boolean }).__noReload)).toBe(true);
});
