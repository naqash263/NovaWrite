import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

// Growth instrumentation: GA4 events, Consent Mode defaults, the tool → service CTA and
// lead attribution on the contact form. gtag is the inline stub from index.html (the real
// gtag.js is stubbed), so every call is visible in window.dataLayer.

type GtagCall = unknown[];

async function gtagCalls(page: Page): Promise<GtagCall[]> {
  return page.evaluate(() => ((window as unknown as { dataLayer?: IArguments[] }).dataLayer ?? []).map((entry) => Array.from(entry)));
}

async function events(page: Page, name: string) {
  return (await gtagCalls(page)).filter((call) => call[0] === 'event' && call[1] === name).map((call) => call[2] as Record<string, unknown>);
}

test('Consent Mode denies storage by default for EEA/UK/CH and page views are sent by the router', async ({ page }) => {
  await page.goto('/');
  const calls = await gtagCalls(page);
  const regional = calls.find((c) => c[0] === 'consent' && c[1] === 'default' && Array.isArray((c[2] as { region?: string[] }).region));
  expect(regional?.[2]).toMatchObject({ ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' });
  expect((regional?.[2] as { region: string[] }).region).toEqual(expect.arrayContaining(['DE', 'FR', 'GB', 'CH', 'NO']));
  expect(calls.find((c) => c[0] === 'config')?.[2]).toEqual({ send_page_view: false });

  await expect.poll(async () => (await events(page, 'page_view')).map((e) => e.page_path)).toEqual(['/']);

  await page.getByRole('navigation', { name: /primary|main/i }).getByRole('link', { name: 'About', exact: true }).first().click();
  await expect(page).toHaveURL(/\/about$/);
  await expect.poll(async () => (await events(page, 'page_view')).map((e) => e.page_path)).toEqual(['/', '/about']);
  const about = (await events(page, 'page_view'))[1];
  expect(String(about.page_title)).toMatch(/About/);
});

test('admin pages are not sent to GA4', async ({ page }) => {
  await page.goto('/admin/login');
  await page.waitForTimeout(900);
  expect(await events(page, 'page_view')).toEqual([]);
});

test('developer tool shows a service CTA that pre-fills and attributes the enquiry', async ({ page }) => {
  await page.goto('/resources/utility-tools/json-formatter');
  const cta = page.getByTestId('tool-service-cta');
  await expect(cta).toBeVisible();
  await expect(cta.getByRole('heading', { level: 2 })).toHaveText('Need this inside a real workflow?');
  await expect(cta.getByRole('link', { name: 'See AI & Automation services' })).toHaveAttribute('href', '/services/ai-automation');

  await cta.getByRole('link', { name: 'Get a free 20-minute consultation' }).click();
  await expect(page).toHaveURL(/\/contact\?topic=AI%20%26%20Automation&source=tool%3Ajson-formatter$/);
  expect(await events(page, 'cta_click')).toEqual([{ cta: 'tool_service_contact', service: 'ai-automation', tool_slug: 'json-formatter' }]);

  await expect(page.locator('#subject')).toHaveValue('Free consultation: AI & Automation');
  await expect(page.locator('#inquiry_type')).toHaveValue('consultation');
});

test('tools without a matching service (e.g. health calculators) show no CTA', async ({ page }) => {
  const { allTools, toolPath } = await import('../src/data/tools');
  const tool = allTools.find((t) => t.category === 'health')!;
  await page.goto(toolPath(tool));
  await expect(page.getByTestId('tool-root')).toBeVisible();
  await expect(page.getByTestId('tool-service-cta')).toHaveCount(0);
});

test('first button press in a tool sends one tool_use event', async ({ page }) => {
  await page.goto('/resources/utility-tools/uuid-generator');
  const root = page.getByTestId('tool-root');
  const generate = root.getByRole('button', { name: /generate/i }).first();
  await generate.click();
  await generate.click();
  const uses = await events(page, 'tool_use');
  expect(uses).toHaveLength(1);
  expect(uses[0]).toMatchObject({ tool_slug: 'uuid-generator', tool_hub: 'utility-tools' });
});

test('contact form sends the lead source and a generate_lead event; guests get a link hint instead of uploads', async ({ page }) => {
  let posted: Record<string, unknown> | null = null;
  await page.route(
    (url) => url.pathname === '/api/contact',
    async (route) => {
      posted = route.request().postDataJSON();
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true, message: 'Thanks, I will reply within one business day.' }) });
    },
  );
  await page.goto('/contact?topic=CRM%20%26%20Business%20Systems&source=tool%3Aloan-calculator');

  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await expect(page.getByText(/Paste a link \(Google Drive, Dropbox, Loom\)/)).toBeVisible();

  await page.locator('#name').fill('Sara Buyer');
  await page.locator('#email').fill('sara@example.com');
  await page.locator('#message').fill('We would like our quotes and reports automated in the CRM.');
  await page.getByRole('button', { name: /send message/i }).click();

  await expect(page.getByText('Thanks, I will reply within one business day.')).toBeVisible();
  expect(posted).toMatchObject({ source: 'tool:loan-calculator', inquiry_type: 'consultation', subject: 'Free consultation: CRM & Business Systems' });
  expect(await events(page, 'generate_lead')).toEqual([{ form: 'contact', inquiry_type: 'consultation', lead_source: 'tool:loan-calculator' }]);
});

test('privacy policy discloses advertising cookies and opt-out links', async ({ page }) => {
  await page.goto('/privacy-policy');
  await expect(page.getByText(/Third-party vendors, including Google, use cookies to serve ads/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Google Ads Settings' })).toHaveAttribute('href', 'https://adssettings.google.com');
  await expect(page.getByRole('link', { name: 'aboutads.info' })).toHaveAttribute('href', 'https://www.aboutads.info/choices/');
});
