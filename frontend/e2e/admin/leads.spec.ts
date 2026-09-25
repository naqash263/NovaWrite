import type { Page } from '@playwright/test';
import { test, expect, loginAsAdmin } from '../fixtures';

// Admin Leads inbox: shapes mirror backend/app/Http/Controllers/Api/Admin/LeadController.php.

const leads = [
  { id: 11, name: 'Sara Buyer', email: 'sara@example.com', phone: '+971500000000', company: 'Acme LLC', subject: 'Free consultation: AI & Automation', message: 'We want invoice processing automated.\nBudget: $5k', inquiry_type: 'consultation', source: 'tool:json-formatter', is_read: false, created_at: '2026-09-24T10:00:00Z' },
  { id: 12, name: 'Omar Khan', email: 'omar@example.com', phone: null, company: null, subject: 'Consultation request: SEO & Organic Growth', message: 'Preferred contact: email', inquiry_type: 'consultation', source: 'booking:SEO & Organic Growth', is_read: true, created_at: '2026-09-20T10:00:00Z' },
];

async function mockLeads(page: Page) {
  const requests: string[] = [];
  await page.route(
    (url) => url.pathname.startsWith('/api/admin/leads'),
    async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      requests.push(`${req.method()} ${url.pathname}${url.search}`);
      const json = (body: unknown) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
      if (url.pathname === '/api/admin/leads/stats') {
        return json({ total: 2, unread: 1, last_30_days: 2, subscribers: 1, by_type: { consultation: 2 }, top_sources: [{ source: 'tool:json-formatter', total: 1 }] });
      }
      if (url.pathname === '/api/admin/leads/subscribers') {
        return json({ current_page: 1, last_page: 1, total: 1, data: [{ email: 'fan@example.com', last_opt_in: '2026-09-22T08:00:00Z', downloads: 2 }] });
      }
      const id = Number(url.pathname.split('/').pop());
      if (req.method() === 'GET' && id) return json({ ...leads.find((l) => l.id === id), is_read: true });
      if (req.method() === 'PATCH') return json({ ...leads.find((l) => l.id === id), ...req.postDataJSON() });
      const search = url.searchParams.get('search');
      const data = search ? leads.filter((l) => l.name.toLowerCase().includes(search.toLowerCase())) : leads;
      return json({ current_page: 1, last_page: 1, total: data.length, data });
    },
  );
  return requests;
}

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page);
});

test('lists enquiries with source, stats and search', async ({ page, pageErrors }) => {
  const requests = await mockLeads(page);
  await page.goto('/admin/leads');

  await expect(page.getByRole('heading', { level: 1, name: 'Leads' })).toBeVisible();
  await expect(page.getByText('Unread enquiries').locator('..').locator('..')).toContainText('1');
  await expect(page.getByRole('list', { name: 'Top lead sources' })).toContainText('Tool · json-formatter: 1');

  const table = page.getByRole('table', { name: 'Enquiries' });
  await expect(table.getByRole('row')).toHaveCount(3);
  await expect(table).toContainText('Booking · SEO & Organic Growth');

  await page.getByRole('searchbox', { name: 'Search enquiries' }).fill('sara');
  await expect(table.getByRole('row')).toHaveCount(2);
  expect(requests.some((r) => r.includes('search=sara'))).toBe(true);
  expect(pageErrors).toEqual([]);
});

test('opens an enquiry, marks it read on open and can mark it unread', async ({ page }) => {
  const requests = await mockLeads(page);
  await page.goto('/admin/leads');
  await page.getByRole('button', { name: 'Sara Buyer', exact: true }).click();

  const dialog = page.getByRole('dialog', { name: 'Free consultation: AI & Automation' });
  await expect(dialog).toContainText('We want invoice processing automated.');
  await expect(dialog.getByRole('link', { name: 'Reply by email' })).toHaveAttribute('href', /^mailto:sara@example\.com\?subject=Re%3A/);
  expect(requests).toContain('GET /api/admin/leads/11');

  await dialog.getByRole('button', { name: 'Mark as unread' }).click();
  await expect.poll(() => requests.includes('PATCH /api/admin/leads/11')).toBe(true);
});

test('subscribers tab lists opt-ins and exports CSV', async ({ page }) => {
  await mockLeads(page);
  await page.goto('/admin/leads');
  await page.getByRole('tab', { name: 'Subscribers' }).click();
  await expect(page.getByRole('table', { name: 'Email subscribers' })).toContainText('fan@example.com');

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  expect((await download).suggestedFilename()).toBe('subscribers.csv');
});
