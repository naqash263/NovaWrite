import type { Page, Request, Route } from '@playwright/test';
import { test, expect, loginAsAdmin } from '../fixtures';

// Admin email, messaging, integration and settings pages. Response shapes mirror the Laravel controllers.

type Handler = (route: Route, request: Request) => unknown;

/** Registers a handler for one API path (optionally one method). Register before page.goto. */
async function api(page: Page, path: string, body: unknown, opts: { status?: number; method?: string } = {}) {
  await page.route(
    (url) => url.pathname === `/api${path}`,
    (route, request) => {
      if (opts.method && request.method() !== opts.method) return route.fallback();
      return route.fulfill({ status: opts.status ?? 200, contentType: 'application/json', body: JSON.stringify(body) });
    },
  );
}

async function apiHandler(page: Page, path: string, handler: Handler) {
  await page.route((url) => url.pathname === `/api${path}`, handler);
}

const json = (route: Route, body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
const serverError = { message: 'Database connection lost' };
const isPath = (path: string) => (req: Request) => new URL(req.url()).pathname === `/api${path}`;

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page);
});

// ---------------------------------------------------------------- API tokens
test.describe('API tokens', () => {
  const tokens = [
    { id: 1, name: 'Zapier sync', token: 'fake-token-for-tests-WXYZ', permissions: ['read', 'write'], last_used_at: null, expires_at: '2099-01-01T00:00:00Z', created_at: '2026-09-01T10:00:00Z' },
    { id: 2, name: 'Old CI token', token: 'fake-token-for-tests-QRST', permissions: ['read'], last_used_at: '2026-08-02T10:00:00Z', expires_at: '2020-01-01T00:00:00Z', created_at: '2019-12-01T10:00:00Z' },
  ];

  test('lists tokens with values masked until revealed', async ({ page }) => {
    await api(page, '/admin/api-tokens', tokens);
    await page.goto('/admin/api-tokens');
    const row = page.getByRole('row', { name: /Zapier sync/ });
    await expect(row).toBeVisible();
    await expect(page.getByRole('row', { name: /Old CI token/ }).getByText('Expired')).toBeVisible();
    // Only the last four characters are ever shown before an explicit reveal.
    await expect(row.getByTestId('token-value')).toHaveText('••••••••WXYZ');
    await expect(page.getByText(tokens[0].token)).toHaveCount(0);
    await row.getByRole('button', { name: 'Reveal token' }).click();
    await expect(row.getByTestId('token-value')).toHaveText(tokens[0].token);
    await row.getByRole('button', { name: 'Hide token' }).click();
    await expect(row.getByTestId('token-value')).toHaveText('••••••••WXYZ');
  });

  test('shows the last four characters when the API returns only a preview', async ({ page }) => {
    // Current backend: listings carry token_preview only; full tokens are returned once at creation.
    await api(page, '/admin/api-tokens', [{ ...tokens[0], token: undefined, token_preview: 'WXYZ' }]);
    await page.goto('/admin/api-tokens');
    const row = page.getByRole('row', { name: /Zapier sync/ });
    await expect(row.getByTestId('token-value')).toHaveText('••••••••WXYZ');
    await expect(row.getByRole('button', { name: 'Reveal token' })).toHaveCount(0);
  });

  test('shows an empty state with a primary action', async ({ page }) => {
    await api(page, '/admin/api-tokens', []);
    await page.goto('/admin/api-tokens');
    await expect(page.getByText('No API tokens yet')).toBeVisible();
    await page.getByTestId('empty-state').getByRole('button', { name: 'Generate token' }).click();
    await expect(page.getByRole('dialog', { name: 'Generate API token' })).toBeVisible();
  });

  test('shows an error state with retry', async ({ page }) => {
    await api(page, '/admin/api-tokens', serverError, { status: 500 });
    await page.goto('/admin/api-tokens');
    await expect(page.getByTestId('error-state')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  });

  test('creates a token, shows it once with a copy button, and validates the name', async ({ page }) => {
    const secret = 'fake-token-for-tests-9876';
    await apiHandler(page, '/admin/api-tokens', (route, request) =>
      request.method() === 'POST'
        ? json(route, { id: 3, name: 'Make.com', token: secret, permissions: ['read', 'write'], expires_at: null, created_at: '2026-09-24T10:00:00Z' }, 201)
        : json(route, []),
    );
    await page.goto('/admin/api-tokens');
    await page.getByRole('button', { name: 'Generate token' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Generate API token' });
    await dialog.getByRole('button', { name: 'Generate token' }).click();
    await expect(dialog.getByText('Token name is required.')).toBeVisible();
    await expect(dialog.getByLabel('Token name')).toHaveAttribute('aria-invalid', 'true');

    await dialog.getByLabel('Token name').fill('Make.com');
    await dialog.getByLabel('Expires in').selectOption('0');
    await dialog.getByRole('checkbox', { name: /Write/ }).check();
    const [request] = await Promise.all([
      page.waitForRequest((r) => isPath('/admin/api-tokens')(r) && r.method() === 'POST'),
      dialog.getByRole('button', { name: 'Generate token' }).click(),
    ]);
    expect(request.postDataJSON()).toEqual({ name: 'Make.com', expires_in_days: 0, permissions: ['read', 'write'] });
    const banner = page.getByTestId('new-token');
    await expect(banner).toContainText(secret);
    await expect(banner).toContainText("You won't see it again");
    await expect(banner.getByRole('button', { name: 'Copy token' })).toBeVisible();
    await expect(page.getByText('Token created')).toBeVisible();
    await banner.getByRole('button', { name: 'Done' }).click();
    await expect(page.getByText(secret)).toHaveCount(0);
  });

  test('revoking a token asks for confirmation', async ({ page }) => {
    await api(page, '/admin/api-tokens', tokens, { method: 'GET' });
    await api(page, '/admin/api-tokens/1', { message: 'Token deleted successfully' }, { method: 'DELETE' });
    await page.goto('/admin/api-tokens');
    await page.getByRole('button', { name: 'Revoke Zapier sync' }).click();
    const [request] = await Promise.all([
      page.waitForRequest((r) => isPath('/admin/api-tokens/1')(r) && r.method() === 'DELETE'),
      page.getByRole('button', { name: 'Revoke token' }).click(),
    ]);
    expect(request.method()).toBe('DELETE');
    await expect(page.getByText('Token revoked')).toBeVisible();
  });
});

// ---------------------------------------------------------------- Settings
test.describe('Settings', () => {
  const saved = {
    site_name: 'NovaWrite',
    site_description: 'Automation and SEO notes',
    site_url: 'https://naqashthaheem.com',
    admin_email: 'admin@naqashthaheem.com',
    maintenance_mode: true,
    allow_registration: false,
    max_file_size: 25,
    allowed_file_types: ['png', 'pdf'],
  };

  test('loads saved settings into the form', async ({ page }) => {
    await api(page, '/settings', { data: saved }, { method: 'GET' });
    await page.goto('/admin/settings');
    await expect(page.getByLabel('Site name')).toHaveValue('NovaWrite');
    await expect(page.getByLabel('Admin email')).toHaveValue('admin@naqashthaheem.com');
    await expect(page.getByRole('switch', { name: 'Maintenance mode' })).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByRole('switch', { name: 'Allow registration' })).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByRole('checkbox', { name: 'PDF' })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'ZIP' })).not.toBeChecked();
  });

  test('falls back to defaults when nothing is saved yet', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(page.getByLabel('Site name')).toHaveValue('');
    await expect(page.getByLabel('Maximum file size (MB)')).toHaveValue('10');
    await expect(page.getByRole('switch', { name: 'Allow registration' })).toHaveAttribute('aria-checked', 'true');
  });

  test('shows an error state when settings cannot be loaded', async ({ page }) => {
    await api(page, '/settings', { message: 'Not found' }, { status: 404 });
    await page.goto('/admin/settings');
    await expect(page.getByTestId('error-state')).toContainText('Could not load settings');
  });

  test('validates required fields and saves the payload', async ({ page }) => {
    await api(page, '/settings', { data: saved }, { method: 'GET' });
    await api(page, '/settings', { message: 'Saved' }, { method: 'PUT' });
    await page.goto('/admin/settings');
    await page.getByLabel('Site name').fill('');
    await page.getByLabel('Admin email').fill('not-an-email');
    await page.getByRole('button', { name: 'Save settings' }).click();
    await expect(page.getByText('Site name is required.')).toBeVisible();
    await expect(page.getByText('Enter a valid email address.')).toBeVisible();

    await page.getByLabel('Site name').fill('NovaWrite Pro');
    await page.getByLabel('Admin email').fill('ops@naqashthaheem.com');
    await page.getByRole('switch', { name: 'Maintenance mode' }).click();
    const [request] = await Promise.all([page.waitForRequest((r) => isPath('/settings')(r) && r.method() === 'PUT'), page.getByRole('button', { name: 'Save settings' }).click()]);
    expect(request.postDataJSON()).toMatchObject({ site_name: 'NovaWrite Pro', admin_email: 'ops@naqashthaheem.com', maintenance_mode: false, max_file_size: 25 });
    await expect(page.getByText('Settings saved')).toBeVisible();
  });
});

// ---------------------------------------------------------------- AdSense
test.describe('AdSense settings', () => {
  const settings = [
    { id: 9, key: 'enabled', value: 'false', title: 'Enable AdSense', description: null, is_active: false, sort_order: 0 },
    { id: 1, key: 'client_id', value: 'ca-pub-1234567890123456', title: 'Publisher ID', description: null, is_active: true, sort_order: 1 },
    { id: 2, key: 'slot_header', value: '1111111111', title: 'Header Ad Slot', description: 'Ad unit ID for header/banner ads', is_active: true, sort_order: 2 },
    { id: 3, key: 'slot_footer', value: '', title: 'Footer Ad Slot', description: 'Ad unit ID for footer ads', is_active: false, sort_order: 7 },
  ];

  test('renders publisher and slot settings', async ({ page }) => {
    await api(page, '/admin/adsense-settings', { success: true, data: settings });
    await page.goto('/admin/adsense-settings');
    await expect(page.getByLabel('Publisher ID')).toHaveValue('ca-pub-1234567890123456');
    await expect(page.getByLabel('Header Ad Slot', { exact: true })).toHaveValue('1111111111');
    await expect(page.getByRole('switch', { name: 'Footer Ad Slot active' })).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByRole('switch', { name: 'Enable AdSense' })).toHaveAttribute('aria-checked', 'false');
  });

  test('offers to create defaults when no settings exist', async ({ page }) => {
    await api(page, '/admin/adsense-settings', { success: true, data: [] });
    await api(page, '/admin/adsense-settings/reset', { success: true, data: settings });
    await page.goto('/admin/adsense-settings');
    await expect(page.getByText('AdSense is not set up yet')).toBeVisible();
    const [request] = await Promise.all([page.waitForRequest(isPath('/admin/adsense-settings/reset')), page.getByRole('button', { name: 'Create default settings' }).click()]);
    expect(request.method()).toBe('POST');
  });

  test('shows an error state', async ({ page }) => {
    await api(page, '/admin/adsense-settings', { success: false, message: 'Failed to load settings' }, { status: 500 });
    await page.goto('/admin/adsense-settings');
    await expect(page.getByTestId('error-state')).toContainText('Failed to load settings', { timeout: 15_000 });
  });

  test('requires a valid publisher ID and saves all settings', async ({ page }) => {
    await api(page, '/admin/adsense-settings', { success: true, data: settings }, { method: 'GET' });
    await api(page, '/admin/adsense-settings', { success: true, message: 'AdSense settings saved successfully' }, { method: 'POST' });
    await page.goto('/admin/adsense-settings');
    await page.getByLabel('Publisher ID').fill('');
    await page.getByRole('switch', { name: 'Enable AdSense' }).click();
    await page.getByRole('button', { name: 'Save settings' }).click();
    await expect(page.getByText('Publisher ID is required to enable AdSense.')).toBeVisible();

    await page.getByLabel('Publisher ID').fill('ca-pub-9999999999999999');
    await page.getByLabel('Footer Ad Slot', { exact: true }).fill('2222222222');
    const [request] = await Promise.all([page.waitForRequest((r) => isPath('/admin/adsense-settings')(r) && r.method() === 'POST'), page.getByRole('button', { name: 'Save settings' }).click()]);
    const sent = request.postDataJSON().settings as Array<{ key: string; value: string; is_active: boolean }>;
    expect(sent.find((s) => s.key === 'enabled')).toMatchObject({ value: 'true' });
    expect(sent.find((s) => s.key === 'client_id')).toMatchObject({ value: 'ca-pub-9999999999999999', is_active: true });
    expect(sent.find((s) => s.key === 'slot_footer')).toMatchObject({ value: '2222222222', is_active: true });
    await expect(page.getByText('Settings saved', { exact: true })).toBeVisible();
  });

  test('reset asks for confirmation', async ({ page }) => {
    await api(page, '/admin/adsense-settings', { success: true, data: settings });
    await api(page, '/admin/adsense-settings/reset', { success: true, data: settings });
    await page.goto('/admin/adsense-settings');
    await page.getByRole('button', { name: 'Reset to defaults' }).click();
    const [request] = await Promise.all([page.waitForRequest(isPath('/admin/adsense-settings/reset')), page.getByRole('button', { name: 'Reset settings' }).click()]);
    expect(request.method()).toBe('POST');
    await expect(page.getByText('Settings reset')).toBeVisible();
  });
});

// ---------------------------------------------------------------- Push notifications
test.describe('Push notifications', () => {
  const stats = { total_subscribers: 42, active_subscribers: 37, notification_types: { blogPosts: 30, issues: 4, workflows: 12, careerTools: 2 } };

  test('shows subscriber statistics', async ({ page }) => {
    await api(page, '/admin/push-notifications/stats', stats);
    await page.goto('/admin/push-notifications');
    const statsBox = page.getByTestId('push-stats');
    await expect(statsBox).toContainText('42');
    await expect(statsBox).toContainText('37');
    await expect(statsBox).toContainText('Blog posts: 30');
  });

  test('handles an audience with no subscribers', async ({ page }) => {
    await api(page, '/admin/push-notifications/stats', { total_subscribers: 0, active_subscribers: 0 });
    await page.goto('/admin/push-notifications');
    await expect(page.getByTestId('push-stats')).toContainText('No subscribers yet');
  });

  test('shows an error state for statistics', async ({ page }) => {
    await api(page, '/admin/push-notifications/stats', { message: 'Admin access required' }, { status: 403 });
    await page.goto('/admin/push-notifications');
    await expect(page.getByTestId('error-state')).toContainText('Admin access required');
  });

  test('validates and sends a notification', async ({ page }) => {
    await api(page, '/admin/push-notifications/stats', stats);
    await api(page, '/admin/push-notifications/send', { message: 'Notification sent successfully' });
    await page.goto('/admin/push-notifications');
    await page.getByRole('button', { name: 'Send notification' }).click();
    await expect(page.getByText('Title is required.')).toBeVisible();
    await expect(page.getByText('Message is required.')).toBeVisible();

    await page.getByLabel('Title').fill('New workflow template');
    await page.getByLabel('Message').fill('Sync Stripe payouts to Sheets in five minutes.');
    await page.getByLabel('Audience').selectOption('workflows');
    await page.getByLabel('Link URL').fill('https://naqashthaheem.com/workflows/stripe');
    const [request] = await Promise.all([page.waitForRequest(isPath('/admin/push-notifications/send')), page.getByRole('button', { name: 'Send notification' }).click()]);
    expect(request.postDataJSON()).toEqual({
      title: 'New workflow template',
      body: 'Sync Stripe payouts to Sheets in five minutes.',
      type: 'workflows',
      url: 'https://naqashthaheem.com/workflows/stripe',
      imageUrl: '',
    });
    await expect(page.getByText('Notification sent', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Title')).toHaveValue('');
  });
});

// ---------------------------------------------------------------- Email templates
test.describe('Email templates', () => {
  const templates = [
    { id: 1, name: 'welcome_email', subject: 'Welcome to {{app_name}}', body: '<p>Hi {{user_name}}</p>', type: 'html', category: 'user', variables: ['app_name', 'user_name'], is_active: true, is_system: false, language: 'en' },
    { id: 2, name: 'password_reset', subject: 'Reset your password', body: '<p>Reset</p>', type: 'html', category: 'system', variables: [], is_active: false, is_system: true, language: 'en' },
  ];
  const list = { data: templates, meta: { current_page: 1, last_page: 1, per_page: 20, total: 2 }, filters: {} };

  test('lists templates and previews one with sample data', async ({ page }) => {
    await api(page, '/admin/email-templates', list);
    await api(page, '/admin/email-templates/1/preview', { data: { template: templates[0], preview: { subject: 'Welcome to NovaWrite', body: '<p>Hi John Doe</p>' }, sample_data: {}, variables: [] } });
    await page.goto('/admin/email-templates');
    await expect(page.getByRole('row', { name: /welcome_email/ })).toContainText('{{app_name}}');
    const system = page.getByRole('row', { name: /password_reset/ });
    await expect(system).toContainText('System');
    await expect(system.getByRole('button', { name: /Delete/ })).toHaveCount(0);
    await page.getByRole('button', { name: 'Preview welcome_email' }).click();
    const dialog = page.getByRole('dialog', { name: 'Preview: welcome_email' });
    await expect(dialog).toContainText('Welcome to NovaWrite');
    await expect(dialog.frameLocator('iframe').getByText('Hi John Doe')).toBeVisible();
  });

  test('shows an empty state', async ({ page }) => {
    await api(page, '/admin/email-templates', { data: [], meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 } });
    await page.goto('/admin/email-templates');
    await expect(page.getByText('No email templates yet')).toBeVisible();
  });

  test('shows an error state', async ({ page }) => {
    await api(page, '/admin/email-templates', serverError, { status: 500 });
    await page.goto('/admin/email-templates');
    await expect(page.getByTestId('error-state')).toContainText('Database connection lost', { timeout: 15_000 });
  });

  test('validates and creates a template', async ({ page }) => {
    await api(page, '/admin/email-templates', list, { method: 'GET' });
    await api(page, '/admin/email-templates', { message: 'Email template created successfully', data: {} }, { method: 'POST' });
    await page.goto('/admin/email-templates');
    await page.getByRole('button', { name: 'New template' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'New email template' });
    await dialog.getByRole('button', { name: 'Create template' }).click();
    await expect(dialog.getByText('Template name is required.')).toBeVisible();
    await expect(dialog.getByText('Subject is required.')).toBeVisible();

    await dialog.getByLabel('Template name').fill('order_shipped');
    await dialog.getByLabel('Subject').fill('Order {{order_number}} shipped');
    await dialog.getByLabel('Category').selectOption('marketing');
    await dialog.getByLabel('Email body').fill('<p>Hi {{customer_name}}</p>');
    await expect(dialog.getByText('{{customer_name}}', { exact: true })).toBeVisible();
    const [request] = await Promise.all([page.waitForRequest((r) => isPath('/admin/email-templates')(r) && r.method() === 'POST'), dialog.getByRole('button', { name: 'Create template' }).click()]);
    expect(request.postDataJSON()).toEqual({
      name: 'order_shipped',
      subject: 'Order {{order_number}} shipped',
      body: '<p>Hi {{customer_name}}</p>',
      description: '',
      category: 'marketing',
      type: 'html',
      language: 'en',
      is_active: true,
    });
    await expect(page.getByText('Template created')).toBeVisible();
    await expect(dialog).toBeHidden();
  });

  test('deleting a template asks for confirmation', async ({ page }) => {
    await api(page, '/admin/email-templates', list);
    await api(page, '/admin/email-templates/1', { message: 'Email template deleted successfully' }, { method: 'DELETE' });
    await page.goto('/admin/email-templates');
    await page.getByRole('button', { name: 'Delete welcome_email' }).click();
    const [request] = await Promise.all([page.waitForRequest(isPath('/admin/email-templates/1')), page.getByRole('button', { name: 'Delete', exact: true }).click()]);
    expect(request.method()).toBe('DELETE');
    await expect(page.getByText('Template deleted')).toBeVisible();
  });
});

// ---------------------------------------------------------------- Email service
test.describe('Email service', () => {
  const templates = { data: [{ id: 1, name: 'welcome_email', subject: 'Welcome', category: 'user', is_active: true }], meta: { current_page: 1, last_page: 1, total: 1 } };
  const available = {
    success: true,
    data: {
      users: [
        { id: 7, name: 'Ada Lovelace', email: 'ada@example.com' },
        { id: 8, name: 'Alan Turing', email: 'alan@example.com' },
      ],
      courses: [{ id: 3, title: 'n8n Basics' }],
      workflows: [],
      posts: [],
    },
  };
  const smtp = { success: true, data: [{ id: 4, name: 'Postmark', from_address: 'hello@naqashthaheem.com', from_name: 'Naqash', is_active: true }] };

  async function mockData(page: Page) {
    await api(page, '/admin/email-templates', templates);
    await api(page, '/email-service/available-data', available);
    await api(page, '/admin/smtp-configurations', smtp);
  }

  async function choose(page: Page, label: string, text: string) {
    await page.getByRole('combobox', { name: label, exact: true }).click();
    await page.keyboard.type(text);
    await page.keyboard.press('Enter');
  }

  test('previews a template with real data', async ({ page }) => {
    await mockData(page);
    await api(page, '/email-service/preview-real-data', { success: true, preview: { subject: 'Welcome, Ada', body: '<p>Hello Ada</p>', type: 'html' }, variables: { user_name: 'Ada', app_name: 'NovaWrite' } });
    await page.goto('/admin/email-service');
    await expect(page.getByText('Sends from Naqash <hello@naqashthaheem.com>')).toBeVisible();
    await choose(page, 'Template', 'welcome');
    await choose(page, 'Recipient', 'Ada');
    await page.getByLabel('Course').selectOption('3');
    const [request] = await Promise.all([page.waitForRequest(isPath('/email-service/preview-real-data')), page.getByRole('button', { name: 'Preview' }).click()]);
    expect(request.postDataJSON()).toEqual({ template_name: 'welcome_email', user_id: 7, course_id: 3, workflow_id: null, post_id: null, custom_variables: {} });
    const preview = page.getByTestId('email-preview');
    await expect(preview).toContainText('Welcome, Ada');
    await expect(preview).toContainText('{{app_name}}');
  });

  test('shows an empty state when there are no templates', async ({ page }) => {
    await api(page, '/admin/email-templates', { data: [], meta: { total: 0 } });
    await api(page, '/email-service/available-data', available);
    await page.goto('/admin/email-service');
    await expect(page.getByText('No email templates yet')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Go to email templates' })).toHaveAttribute('href', '/admin/email-templates');
  });

  test('shows an error state when nothing can be loaded', async ({ page }) => {
    for (const path of ['/admin/email-templates', '/email-service/available-data', '/admin/smtp-configurations']) await api(page, path, { message: 'Forbidden' }, { status: 403 });
    await page.goto('/admin/email-service');
    await expect(page.getByTestId('error-state')).toBeVisible();
  });

  test('requires a template and recipient, then sends with custom variables', async ({ page }) => {
    await mockData(page);
    await api(page, '/email-service/send-real-data', { success: true, message: 'Email sent successfully' });
    await page.goto('/admin/email-service');
    await page.getByRole('button', { name: 'Send email' }).click();
    await expect(page.getByText('Choose a template.')).toBeVisible();
    await expect(page.getByText('Choose a recipient.')).toBeVisible();

    await choose(page, 'Template', 'welcome');
    await choose(page, 'Recipient', 'Alan');
    await page.getByLabel('Variable name').fill('discount_code');
    await page.getByLabel('Value').fill('SPRING25');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByLabel('{{discount_code}}')).toHaveValue('SPRING25');
    const [request] = await Promise.all([page.waitForRequest(isPath('/email-service/send-real-data')), page.getByRole('button', { name: 'Send email' }).click()]);
    expect(request.postDataJSON()).toEqual({
      template_name: 'welcome_email',
      user_id: 8,
      course_id: null,
      workflow_id: null,
      post_id: null,
      custom_variables: { discount_code: 'SPRING25' },
      smtp_config_id: 4,
    });
    await expect(page.getByText('Email sent', { exact: true })).toBeVisible();
  });
});

// ---------------------------------------------------------------- System email settings
test.describe('System email settings', () => {
  const smtp = {
    success: true,
    data: [
      { id: 1, name: 'Postmark', from_address: 'hello@naqashthaheem.com', from_name: 'Naqash', is_active: true, is_default: true },
      { id: 2, name: 'Mailgun', from_address: 'no-reply@naqashthaheem.com', from_name: 'NovaWrite', is_active: false, is_default: false },
    ],
  };
  const settings = { success: true, data: { password_reset_smtp_id: 2, welcome_email_smtp_id: null, notification_smtp_id: null, default_smtp_id: 1 } };

  test('shows the configuration used for each email type', async ({ page }) => {
    await api(page, '/admin/smtp-configurations', smtp);
    await api(page, '/admin/system-email-settings', settings);
    await page.goto('/admin/system-email-settings');
    await expect(page.getByLabel('Password reset emails SMTP')).toHaveValue('2');
    await expect(page.getByLabel('Default SMTP')).toHaveValue('1');
    await expect(page.getByText('Uses the default: Naqash <hello@naqashthaheem.com>').first()).toBeVisible();
  });

  test('prompts to add SMTP configurations when there are none', async ({ page }) => {
    await api(page, '/admin/smtp-configurations', { success: true, data: [] });
    await page.goto('/admin/system-email-settings');
    await expect(page.getByText('No SMTP configurations yet')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Add SMTP configuration' })).toBeVisible();
  });

  test('shows an error state', async ({ page }) => {
    await api(page, '/admin/system-email-settings', { success: false, message: 'Failed to fetch system email settings' }, { status: 500 });
    await page.goto('/admin/system-email-settings');
    await expect(page.getByTestId('error-state')).toContainText('Failed to fetch system email settings', { timeout: 15_000 });
  });

  test('saves the routing', async ({ page }) => {
    await api(page, '/admin/smtp-configurations', smtp);
    await api(page, '/admin/system-email-settings', settings, { method: 'GET' });
    await api(page, '/admin/system-email-settings', { success: true, message: 'System email settings updated successfully' }, { method: 'POST' });
    await page.goto('/admin/system-email-settings');
    await page.getByLabel('Welcome emails SMTP').selectOption('2');
    await page.getByLabel('Password reset emails SMTP').selectOption('');
    const [request] = await Promise.all([page.waitForRequest((r) => isPath('/admin/system-email-settings')(r) && r.method() === 'POST'), page.getByRole('button', { name: 'Save settings' }).click()]);
    expect(request.postDataJSON()).toEqual({ password_reset_smtp_id: null, welcome_email_smtp_id: 2, notification_smtp_id: null, default_smtp_id: 1 });
    await expect(page.getByText('Settings saved')).toBeVisible();
  });

  test('test email requires a recipient and uses the assigned configuration', async ({ page }) => {
    await api(page, '/admin/smtp-configurations', smtp);
    await api(page, '/admin/system-email-settings', settings);
    await api(page, '/admin/system-email-settings/test', { success: true, message: 'Test email sent successfully using Mailgun' });
    await page.goto('/admin/system-email-settings');
    await page.getByRole('button', { name: 'Send test email' }).click();
    const dialog = page.getByRole('dialog', { name: 'Send test email' });
    await dialog.getByRole('button', { name: 'Send test' }).click();
    await expect(dialog.getByText('Recipient email is required.')).toBeVisible();
    await dialog.getByLabel('Recipient email').fill('qa@example.com');
    const [request] = await Promise.all([page.waitForRequest(isPath('/admin/system-email-settings/test')), dialog.getByRole('button', { name: 'Send test' }).click()]);
    expect(request.postDataJSON()).toEqual({ email_type: 'password_reset', smtp_id: 2, test_email: 'qa@example.com' });
    await expect(page.getByText('Test email sent', { exact: true })).toBeVisible();
  });
});

// ---------------------------------------------------------------- SMTP configurations
test.describe('SMTP configurations', () => {
  const config = {
    id: 5,
    name: 'Postmark',
    mailer: 'smtp',
    host: 'smtp.example.com',
    port: 587,
    username: 'test-user',
    encryption: 'tls',
    from_address: 'hello@naqashthaheem.com',
    from_name: 'Naqash',
    is_active: true,
    is_default: false,
    description: null,
    last_tested_at: '2026-09-20T10:00:00Z',
    test_successful: true,
    test_error: null,
  };

  test('lists configurations and never renders a password', async ({ page }) => {
    // Even if the API leaked the password, the page must not show it.
    await api(page, '/admin/smtp-configurations', { success: true, data: [{ ...config, password: 'fake-password-for-tests' }] });
    await page.goto('/admin/smtp-configurations');
    const row = page.getByRole('row', { name: /Postmark/ });
    await expect(row).toContainText('smtp.example.com:587');
    await expect(row).toContainText('Active');
    await expect(row).toContainText('Passed');
    await expect(row.getByTestId('smtp-password')).toHaveText('••••••••');
    await expect(page.getByText('fake-password-for-tests')).toHaveCount(0);
    await row.getByRole('button', { name: 'Edit Postmark' }).click();
    await expect(page.getByRole('dialog').getByLabel('Password', { exact: true })).toHaveValue('');
  });

  test('shows an empty state', async ({ page }) => {
    await api(page, '/admin/smtp-configurations', { success: true, data: [] });
    await page.goto('/admin/smtp-configurations');
    await expect(page.getByText('No SMTP configurations')).toBeVisible();
  });

  test('shows an error state', async ({ page }) => {
    await api(page, '/admin/smtp-configurations', serverError, { status: 500 });
    await page.goto('/admin/smtp-configurations');
    await expect(page.getByTestId('error-state')).toBeVisible({ timeout: 15_000 });
  });

  test('validates and creates a configuration', async ({ page }) => {
    await api(page, '/admin/smtp-configurations', { success: true, data: [config] }, { method: 'GET' });
    await api(page, '/admin/smtp-configurations', { success: true, data: { id: 6 } }, { method: 'POST' });
    await page.goto('/admin/smtp-configurations');
    await page.getByRole('button', { name: 'New configuration' }).click();
    const dialog = page.getByRole('dialog', { name: 'New SMTP configuration' });
    await dialog.getByRole('button', { name: 'Create configuration' }).click();
    await expect(dialog.getByText('Host is required.')).toBeVisible();
    await expect(dialog.getByText('Password is required.')).toBeVisible();

    await dialog.getByRole('textbox', { name: 'Name', exact: true }).fill('Mailgun EU');
    await dialog.getByLabel('Host').fill('smtp2.example.com');
    await dialog.getByLabel('Port').fill('465');
    await dialog.getByLabel('Encryption').selectOption('ssl');
    await dialog.getByLabel('Username').fill('postmaster@mg.example.com');
    const password = dialog.locator('input[autocomplete="new-password"]');
    await expect(password).toHaveAccessibleName('Password');
    await password.fill('fake-password-2');
    await expect(password).toHaveAttribute('type', 'password');
    await dialog.getByRole('button', { name: 'Show password' }).click();
    await expect(password).toHaveAttribute('type', 'text');
    await dialog.getByLabel('From address').fill('news@example.com');
    const [request] = await Promise.all([page.waitForRequest((r) => isPath('/admin/smtp-configurations')(r) && r.method() === 'POST'), dialog.getByRole('button', { name: 'Create configuration' }).click()]);
    expect(request.postDataJSON()).toMatchObject({ name: 'Mailgun EU', host: 'smtp2.example.com', port: 465, encryption: 'ssl', username: 'postmaster@mg.example.com', password: 'fake-password-2', from_address: 'news@example.com', from_name: 'NovaWrite' });
    await expect(page.getByText('Configuration created')).toBeVisible();
  });

  test('editing without a new password keeps the stored one', async ({ page }) => {
    await api(page, '/admin/smtp-configurations', { success: true, data: [config] });
    await api(page, '/admin/smtp-configurations/5', { success: true, data: config }, { method: 'PUT' });
    await page.goto('/admin/smtp-configurations');
    await page.getByRole('button', { name: 'Edit Postmark' }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit Postmark' });
    await dialog.getByLabel('From name').fill('Naqash Thaheem');
    const [request] = await Promise.all([page.waitForRequest((r) => isPath('/admin/smtp-configurations/5')(r) && r.method() === 'PUT'), dialog.getByRole('button', { name: 'Save changes' }).click()]);
    const body = request.postDataJSON();
    expect(body).toMatchObject({ from_name: 'Naqash Thaheem', host: 'smtp.example.com' });
    expect(body).not.toHaveProperty('password');
    await expect(page.getByText('Configuration updated')).toBeVisible();
  });

  test('sends a test email to a chosen address', async ({ page }) => {
    await api(page, '/admin/smtp-configurations', { success: true, data: [config] });
    await api(page, '/admin/smtp-configurations/5/test', { success: true, message: 'SMTP configuration test successful!' });
    await page.goto('/admin/smtp-configurations');
    await page.getByRole('button', { name: 'Send test email with Postmark' }).click();
    const dialog = page.getByRole('dialog', { name: 'Test Postmark' });
    await dialog.getByLabel('Send test to').fill('qa@example.com');
    const [request] = await Promise.all([page.waitForRequest(isPath('/admin/smtp-configurations/5/test')), dialog.getByRole('button', { name: 'Send test' }).click()]);
    expect(request.postDataJSON()).toEqual({ test_email: 'qa@example.com' });
    await expect(page.getByRole('status').filter({ hasText: 'SMTP configuration test successful!' })).toBeVisible();
  });
});

// ---------------------------------------------------------------- n8n configurations
test.describe('n8n configurations', () => {
  const configs = [
    { id: 1, name: 'Production', webhook_url: 'https://n8n.example.com/webhook/email', webhook_timeout: 30, max_retry_attempts: 3, is_active: true, auto_notify_on_failure: false, gemini_fallback_enabled: true },
    { id: 2, name: 'Staging', webhook_url: 'https://n8n-staging.example.com/webhook/email', webhook_timeout: 60, max_retry_attempts: 2, is_active: false },
  ];

  test('lists configurations with status and actions', async ({ page }) => {
    await api(page, '/admin/n8n-configurations', { success: true, data: configs });
    await page.goto('/admin/n8n-configurations');
    await expect(page.getByRole('row', { name: /Production/ })).toContainText('Active');
    await expect(page.getByRole('button', { name: 'Deactivate Production' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete Production' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Delete Staging' })).toBeVisible();
  });

  test('shows an empty state', async ({ page }) => {
    await api(page, '/admin/n8n-configurations', { success: true, data: [] });
    await page.goto('/admin/n8n-configurations');
    await expect(page.getByText('No n8n configurations')).toBeVisible();
  });

  test('shows an error state', async ({ page }) => {
    await api(page, '/admin/n8n-configurations', serverError, { status: 500 });
    await page.goto('/admin/n8n-configurations');
    await expect(page.getByTestId('error-state')).toBeVisible({ timeout: 15_000 });
  });

  test('validates and creates a configuration', async ({ page }) => {
    await api(page, '/admin/n8n-configurations', { success: true, data: configs }, { method: 'GET' });
    await api(page, '/admin/n8n-configurations', { success: true, data: { id: 3 } }, { method: 'POST' });
    await page.goto('/admin/n8n-configurations');
    await page.getByRole('button', { name: 'New configuration' }).click();
    const dialog = page.getByRole('dialog', { name: 'New n8n configuration' });
    await dialog.getByLabel('Webhook URL').fill('not a url');
    await dialog.getByRole('button', { name: 'Create configuration' }).click();
    await expect(dialog.getByText('Name is required.')).toBeVisible();
    await expect(dialog.getByText('Enter a full URL starting with http:// or https://.')).toBeVisible();

    await dialog.getByLabel('Name').fill('Backup');
    await dialog.getByLabel('Webhook URL').fill('https://backup.example.com/webhook/email');
    await dialog.getByLabel('Timeout (seconds)').fill('45');
    const [request] = await Promise.all([page.waitForRequest((r) => isPath('/admin/n8n-configurations')(r) && r.method() === 'POST'), dialog.getByRole('button', { name: 'Create configuration' }).click()]);
    expect(request.postDataJSON()).toEqual({
      name: 'Backup',
      webhook_url: 'https://backup.example.com/webhook/email',
      webhook_timeout: 45,
      max_retry_attempts: 3,
      gemini_fallback_enabled: false,
      gemini_webhook_url: '',
      gemini_fallback_timeout: 60,
      gemini_fallback_retry_attempts: 2,
    });
    await expect(page.getByText('Configuration created')).toBeVisible();
  });

  test('deactivating asks for confirmation', async ({ page }) => {
    await api(page, '/admin/n8n-configurations', { success: true, data: configs });
    await api(page, '/admin/n8n-configurations/1/deactivate', { success: true, message: 'N8n configuration deactivated successfully' });
    await page.goto('/admin/n8n-configurations');
    await page.getByRole('button', { name: 'Deactivate Production' }).click();
    const [request] = await Promise.all([page.waitForRequest(isPath('/admin/n8n-configurations/1/deactivate')), page.getByRole('button', { name: 'Deactivate', exact: true }).click()]);
    expect(request.method()).toBe('POST');
    await expect(page.getByText('Production deactivated')).toBeVisible();
  });

  test('manages fallback webhooks and reports failed-email loading errors', async ({ page }) => {
    await api(page, '/admin/n8n-configurations', { success: true, data: configs });
    await apiHandler(page, '/admin/fallback-webhooks', (route, request) =>
      request.method() === 'POST' ? json(route, { success: true, data: { id: 2 } }, 201) : json(route, { success: true, data: [{ id: 1, url: 'https://hooks.example.com/a', description: 'Slack relay', is_active: true }] }),
    );
    await api(page, '/admin/fallback-emails', { message: 'Not Found' }, { status: 404 });
    await page.goto('/admin/n8n-configurations');
    await page.getByRole('tab', { name: 'Fallback webhooks' }).click();
    await expect(page.getByRole('row', { name: /hooks.example.com\/a/ })).toContainText('Slack relay');
    await page.getByRole('button', { name: 'Add webhook' }).click();
    await expect(page.getByText('Webhook URL is required.')).toBeVisible();
    await page.getByLabel('Webhook URL').fill('https://hooks.example.com/b');
    const [request] = await Promise.all([page.waitForRequest((r) => isPath('/admin/fallback-webhooks')(r) && r.method() === 'POST'), page.getByRole('button', { name: 'Add webhook' }).click()]);
    expect(request.postDataJSON()).toEqual({ url: 'https://hooks.example.com/b', description: '', is_active: true });
    await expect(page.getByText('Webhook added')).toBeVisible();

    await page.getByRole('tab', { name: 'Failed emails' }).click();
    await expect(page.getByRole('tabpanel').getByTestId('error-state')).toBeVisible();
  });
});

// ---------------------------------------------------------------- Email queue
test.describe('Email queue', () => {
  const page1 = {
    success: true,
    data: {
      current_page: 1,
      last_page: 2,
      total: 21,
      data: [
        { id: 5, action: 'welcome_email', recipient_email: 'ada@example.com', recipient_name: 'Ada', status: 'failed', attempts: 3, max_attempts: 3, last_error: 'Timeout', failure_category: 'network', http_status_code: 504, created_at: '2026-09-20T10:00:00Z' },
        { id: 6, action: 'password_reset', recipient_email: 'alan@example.com', recipient_name: null, status: 'completed', attempts: 1, max_attempts: 3, last_error: null, created_at: '2026-09-21T10:00:00Z' },
      ],
    },
  };
  const stats = { success: true, data: { total: 21, pending: 2, processing: 0, completed: 17, failed: 2, success_rate: 80.95, recent_24h: 4, common_actions: [{ action: 'welcome_email', count: 12 }], failure_categories: [{ category: 'network', count: 2, description: 'Could not reach n8n', suggested_action: 'Check the webhook URL' }] } };

  test('lists queue items, statistics and failure analysis', async ({ page }) => {
    await api(page, '/admin/email-queue', page1);
    await api(page, '/admin/email-queue/stats', stats);
    await page.goto('/admin/email-queue');
    await expect(page.getByRole('row', { name: /ada@example.com/ })).toContainText('network (HTTP 504)');
    await expect(page.getByTestId('queue-stats')).toContainText('80.95%');
    await expect(page.getByText('Check the webhook URL')).toBeVisible();
    await expect(page.getByText('Page 1 of 2')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry email to alan@example.com' })).toHaveCount(0);
    const [request] = await Promise.all([page.waitForRequest((r) => isPath('/admin/email-queue')(r) && new URL(r.url()).searchParams.get('page') === '2'), page.getByRole('button', { name: 'Next page' }).click()]);
    expect(request.method()).toBe('GET');
  });

  test('shows an empty state', async ({ page }) => {
    await api(page, '/admin/email-queue', { success: true, data: { data: [], current_page: 1, last_page: 1, total: 0 } });
    await page.goto('/admin/email-queue');
    await expect(page.getByText('The queue is empty')).toBeVisible();
  });

  test('shows an error state', async ({ page }) => {
    await api(page, '/admin/email-queue', serverError, { status: 500 });
    await page.goto('/admin/email-queue');
    await expect(page.getByTestId('error-state')).toBeVisible({ timeout: 15_000 });
  });

  test('retries a failed email and filters by status', async ({ page }) => {
    await api(page, '/admin/email-queue', page1);
    await api(page, '/admin/email-queue/stats', stats);
    await api(page, '/admin/email-queue/5/retry', { success: true, message: 'Email sent successfully to N8n' });
    await page.goto('/admin/email-queue');
    const [retry] = await Promise.all([page.waitForRequest(isPath('/admin/email-queue/5/retry')), page.getByRole('button', { name: 'Retry email to ada@example.com' }).click()]);
    expect(retry.method()).toBe('POST');
    await expect(page.getByText('Email re-sent')).toBeVisible();
    const [filtered] = await Promise.all([page.waitForRequest((r) => isPath('/admin/email-queue')(r) && new URL(r.url()).searchParams.get('status') === 'failed'), page.getByLabel('Status').selectOption('failed')]);
    expect(new URL(filtered.url()).searchParams.get('page')).toBe('1');
  });

  test('retry all asks for confirmation', async ({ page }) => {
    await api(page, '/admin/email-queue', page1);
    await api(page, '/admin/email-queue/retry-all', { success: true, message: 'Retried 2 failed emails', retry_count: 2 });
    await page.goto('/admin/email-queue');
    await page.getByRole('button', { name: 'Retry all failed' }).click();
    const [request] = await Promise.all([page.waitForRequest(isPath('/admin/email-queue/retry-all')), page.getByRole('button', { name: 'Retry all', exact: true }).click()]);
    expect(request.method()).toBe('POST');
    await expect(page.getByText('Retried 2 failed emails')).toBeVisible();
  });
});

// ---------------------------------------------------------------- Email logs
test.describe('Email logs', () => {
  const logs = {
    success: true,
    data: {
      current_page: 1,
      last_page: 1,
      total: 2,
      data: [
        { id: 1, action: 'welcome_email', recipient_email: 'ada@example.com', status: 'success', error_message: null, attempts: 1, created_at: '2026-09-20T10:00:00Z' },
        { id: 2, action: 'password_reset', recipient_email: 'alan@example.com', status: 'failed', error_message: 'SMTP 550 mailbox unavailable', failure_category: 'recipient', http_status_code: 550, provider_name: 'n8n', attempts: 2, created_at: '2026-09-21T10:00:00Z' },
      ],
    },
  };

  test('lists logs with statistics', async ({ page }) => {
    await api(page, '/admin/email-logs', logs);
    await api(page, '/admin/email-logs/stats', { success: true, data: { total: 2, success: 1, failed: 1, success_rate: 50, common_errors: [{ error_message: 'SMTP 550 mailbox unavailable', count: 1 }] } });
    await page.goto('/admin/email-logs');
    await expect(page.getByRole('row', { name: /ada@example.com/ })).toContainText('Delivered');
    await expect(page.getByRole('row', { name: /alan@example.com/ })).toContainText('HTTP 550');
    await expect(page.getByTestId('log-stats')).toContainText('50%');
    await expect(page.getByText('Most common errors')).toBeVisible();
  });

  test('shows an empty state', async ({ page }) => {
    await api(page, '/admin/email-logs', { success: true, data: { data: [], current_page: 1, last_page: 1, total: 0 } });
    await page.goto('/admin/email-logs');
    await expect(page.getByText('No emails logged yet')).toBeVisible();
  });

  test('shows an error state', async ({ page }) => {
    await api(page, '/admin/email-logs', serverError, { status: 500 });
    await page.goto('/admin/email-logs');
    await expect(page.getByTestId('error-state')).toBeVisible({ timeout: 15_000 });
  });

  test('filters by status and validates the date range', async ({ page }) => {
    await api(page, '/admin/email-logs', logs);
    await page.goto('/admin/email-logs');
    await expect(page.getByRole('row', { name: /ada@example.com/ })).toBeVisible();
    const [request] = await Promise.all([page.waitForRequest((r) => isPath('/admin/email-logs')(r) && new URL(r.url()).searchParams.get('status') === 'failed'), page.getByLabel('Status').selectOption('failed')]);
    expect(new URL(request.url()).searchParams.get('status')).toBe('failed');
    await page.getByLabel('From').fill('2026-09-10');
    await page.getByLabel('To').fill('2026-09-01');
    await expect(page.getByText('The start date must be before the end date.')).toBeVisible();
    const [ranged] = await Promise.all([page.waitForRequest((r) => isPath('/admin/email-logs')(r) && !!new URL(r.url()).searchParams.get('date_to')), page.getByLabel('To').fill('2026-09-30')]);
    expect(new URL(ranged.url()).searchParams.get('date_to')).toBe('2026-09-30 23:59:59');
  });
});

// ---------------------------------------------------------------- Gemini API
test.describe('Gemini API', () => {
  const keys = {
    success: true,
    data: {
      api_keys: [
        { id: 1, name: 'Primary', max_requests: 100, total_requests: 100, used_requests: 25, is_active: true, created_at: '2026-09-01T00:00:00Z' },
        { id: 2, name: 'Spare', max_requests: 50, total_requests: 50, used_requests: 50, is_active: false, created_at: '2026-09-02T00:00:00Z' },
      ],
      statistics: { total_keys: 2, total_requests: 150, used_requests: 75, available_requests: 75 },
    },
  };
  const userKeys = { success: true, data: { user_api_keys: [{ id: 9, user_id: 3, name: 'My key', requests_per_key: 20, usage_count: 5, is_active: true, created_at: '2026-09-03T00:00:00Z', user: { id: 3, name: 'Grace Hopper', email: 'grace@example.com' } }] } };

  test('lists admin and user keys without exposing key values', async ({ page }) => {
    await api(page, '/admin/gemini-api-keys', keys);
    await api(page, '/admin/user-api-keys', userKeys);
    await page.goto('/admin/gemini-api');
    const primary = page.getByRole('row', { name: /Primary/ });
    await expect(primary).toContainText('25 / 100');
    await expect(primary).toContainText('••••••••');
    await expect(page.getByTestId('gemini-stats')).toContainText('75');
    await page.getByRole('tab', { name: /User keys/ }).click();
    await expect(page.getByRole('row', { name: /Grace Hopper/ })).toContainText('5 / 20');
  });

  test('shows empty states', async ({ page }) => {
    await api(page, '/admin/gemini-api-keys', { success: true, data: { api_keys: [], statistics: {} } });
    await api(page, '/admin/user-api-keys', { success: true, data: { user_api_keys: [] } });
    await page.goto('/admin/gemini-api');
    await expect(page.getByText('No Gemini API keys')).toBeVisible();
    await page.getByRole('tab', { name: /User keys/ }).click();
    await expect(page.getByText('No user API keys')).toBeVisible();
  });

  test('shows an error state', async ({ page }) => {
    await api(page, '/admin/gemini-api-keys', { success: false, message: 'Failed to fetch API keys' }, { status: 500 });
    await page.goto('/admin/gemini-api');
    await expect(page.getByTestId('error-state')).toContainText('Failed to fetch API keys', { timeout: 15_000 });
  });

  test('adds a key after validation and keeps the stored key on edit', async ({ page }) => {
    await apiHandler(page, '/admin/gemini-api-keys', (route, request) => (request.method() === 'POST' ? json(route, { success: true, message: 'API key added' }, 201) : json(route, keys)));
    await api(page, '/admin/gemini-api-keys/1', { success: true, data: {} }, { method: 'PUT' });
    await page.goto('/admin/gemini-api');
    await page.getByRole('button', { name: 'Add API key' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Add Gemini API key' });
    await dialog.getByRole('button', { name: 'Add API key' }).click();
    await expect(dialog.getByText('API key is required.')).toBeVisible();
    await dialog.getByRole('textbox', { name: 'Name', exact: true }).fill('Backup');
    const keyInput = dialog.locator('input[spellcheck="false"]');
    await keyInput.fill('fake-gemini-key-for-tests');
    await expect(keyInput).toHaveAttribute('type', 'password');
    const [create] = await Promise.all([page.waitForRequest((r) => isPath('/admin/gemini-api-keys')(r) && r.method() === 'POST'), dialog.getByRole('button', { name: 'Add API key' }).click()]);
    expect(create.postDataJSON()).toEqual({ name: 'Backup', api_key: 'fake-gemini-key-for-tests', max_requests: 5, is_active: true });
    await expect(page.getByText('API key added')).toBeVisible();

    await page.getByRole('button', { name: 'Edit Primary' }).click();
    const edit = page.getByRole('dialog', { name: 'Edit Primary' });
    await expect(edit.locator('input[spellcheck="false"]')).toHaveValue('');
    const [update] = await Promise.all([page.waitForRequest((r) => isPath('/admin/gemini-api-keys/1')(r) && r.method() === 'PUT'), edit.getByRole('button', { name: 'Save changes' }).click()]);
    expect(update.postDataJSON()).toEqual({ name: 'Primary', max_requests: 100, is_active: true });
  });

  test('toggling a key only sends its status', async ({ page }) => {
    await api(page, '/admin/gemini-api-keys', keys);
    await api(page, '/admin/gemini-api-keys/2', { success: true, data: {} }, { method: 'PUT' });
    await page.goto('/admin/gemini-api');
    const [request] = await Promise.all([page.waitForRequest((r) => isPath('/admin/gemini-api-keys/2')(r) && r.method() === 'PUT'), page.getByRole('button', { name: 'Activate Spare' }).click()]);
    expect(request.postDataJSON()).toEqual({ is_active: true });
    await expect(page.getByText('Spare activated')).toBeVisible();
  });
});

// ---------------------------------------------------------------- API reference pages
test.describe('API documentation', () => {
  test('searches endpoints and opens details', async ({ page }) => {
    await page.goto('/admin/api-documentation');
    await expect(page.locator('h1')).toHaveText('API Documentation');
    await page.getByRole('searchbox', { name: 'Search endpoints' }).fill('/api/posts/latest');
    await page.getByRole('button', { name: /\/api\/posts\/latest/ }).click();
    const dialog = page.getByRole('dialog', { name: 'GET /api/posts/latest' });
    await expect(dialog.getByRole('cell', { name: 'since', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await page.getByRole('searchbox', { name: 'Search endpoints' }).fill('no-such-endpoint');
    await expect(page.getByText('No endpoints match')).toBeVisible();
  });

  test('full API docs render with one h1 and keyboard tabs', async ({ page }) => {
    await page.goto('/admin/api-docs');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('API Documentation');
    const overview = page.getByRole('tab', { name: 'Overview' });
    await expect(overview).toHaveAttribute('aria-selected', 'true');
    await overview.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Endpoints' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tab', { name: 'Endpoints' })).toBeFocused();
  });
});

// ---------------------------------------------------------------- Mobile layout
test.describe('Email and integration pages on mobile @mobile', () => {
  const paths = [
    '/admin/push-notifications',
    '/admin/email-templates',
    '/admin/email-service',
    '/admin/system-email-settings',
    '/admin/smtp-configurations',
    '/admin/n8n-configurations',
    '/admin/email-queue',
    '/admin/email-logs',
    '/admin/gemini-api',
    '/admin/api-tokens',
    '/admin/api-documentation',
    '/admin/api-docs',
    '/admin/adsense-settings',
    '/admin/settings',
  ];

  test('no page scrolls horizontally', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile only');
    test.setTimeout(90_000);
    // Wide tables render inside their card's scroll container.
    await api(page, '/admin/smtp-configurations', { success: true, data: [{ id: 1, name: 'Postmark production relay', mailer: 'smtp', host: 'smtp.example.com', port: 587, username: 'test-user', encryption: 'tls', from_address: 'hello@naqashthaheem.com', from_name: 'Naqash', is_active: true, is_default: true, description: null, last_tested_at: null, test_successful: null, test_error: null }] });
    await api(page, '/admin/api-tokens', [{ id: 1, name: 'Zapier sync', token: 'fake-token-for-tests-WXYZ', permissions: ['read', 'write'], last_used_at: null, expires_at: null, created_at: '2026-09-01T10:00:00Z' }]);
    for (const path of paths) {
      await page.goto(path);
      await expect(page.locator('h1')).toHaveCount(1);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} overflows horizontally by ${overflow}px`).toBeLessThanOrEqual(0);
    }
  });
});
