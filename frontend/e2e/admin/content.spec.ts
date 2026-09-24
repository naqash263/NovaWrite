import type { Page, Request } from '@playwright/test';
import { test, expect, loginAsAdmin } from '../fixtures';

// Admin content pages: posts, categories, tags, projects, workflows, files, CV templates, home settings.
// Response shapes mirror the Laravel controllers in backend/app/Http/Controllers.

type MockOptions = { status?: number; method?: string };

/** Answers one API path (pathname incl. /api) with JSON. Register BEFORE page.goto. */
async function mock(page: Page, path: string | RegExp, body: unknown, { status = 200, method }: MockOptions = {}) {
  await page.route(
    (url) => (typeof path === 'string' ? url.pathname === path : path.test(url.pathname)),
    (route) => {
      if (method && route.request().method() !== method) return route.fallback();
      return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    },
  );
}

const isApi = (req: Request, method: string, path: string | RegExp) => {
  const { pathname } = new URL(req.url());
  return req.method() === method && (typeof path === 'string' ? pathname === path : path.test(pathname));
};

const serverError = { message: 'Database connection lost' };
const ERROR_TIMEOUT = { timeout: 15_000 }; // 5xx responses are retried twice by react-query.

/** Clicks the confirm button of the global confirm dialog. */
async function acceptConfirm(page: Page, label: string) {
  await page.getByRole('button', { name: label, exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page);
});

// ---------------------------------------------------------------------------
test.describe('/admin/categories', () => {
  const categories = {
    data: [
      { id: 1, name: 'Automation', slug: 'automation', description: 'n8n and Zapier guides', posts_count: 4 },
      { id: 2, name: 'SEO', slug: 'seo', description: null, posts_count: 0 },
    ],
    meta: { total: 2 },
  };

  test('lists categories with post counts and filters them', async ({ page }) => {
    await mock(page, '/api/categories', categories, { method: 'GET' });
    await page.goto('/admin/categories');
    await expect(page.getByRole('heading', { level: 1, name: 'Categories' })).toBeVisible();
    const table = page.getByRole('table', { name: 'Blog categories' });
    await expect(table.getByRole('row')).toHaveCount(3);
    await expect(table).toContainText('n8n and Zapier guides');
    await page.getByRole('searchbox', { name: 'Search categories' }).fill('seo');
    await expect(table.getByRole('row')).toHaveCount(2);
  });

  test('shows empty and error states', async ({ page }) => {
    await page.goto('/admin/categories');
    await expect(page.getByTestId('empty-state')).toContainText('No categories yet');
  });

  test('shows an error state with retry', async ({ page }) => {
    await mock(page, '/api/categories', serverError, { status: 500, method: 'GET' });
    await page.goto('/admin/categories');
    await expect(page.getByTestId('error-state')).toContainText('Database connection lost', ERROR_TIMEOUT);
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  });

  test('validates and creates a category', async ({ page }) => {
    await mock(page, '/api/categories', { id: 3, name: 'Growth', slug: 'growth' }, { status: 201, method: 'POST' });
    await page.goto('/admin/categories');
    await page.getByRole('button', { name: 'Add category' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'New category' });
    await dialog.getByRole('button', { name: 'Create category' }).click();
    await expect(dialog.getByText('Name is required.')).toBeVisible();
    await expect(dialog.getByLabel('Name')).toHaveAttribute('aria-invalid', 'true');

    await dialog.getByLabel('Name').fill('Growth');
    await dialog.getByLabel('Description').fill('Marketing growth');
    const [request] = await Promise.all([page.waitForRequest((r) => isApi(r, 'POST', '/api/categories')), dialog.getByRole('button', { name: 'Create category' }).click()]);
    expect(request.postDataJSON()).toEqual({ name: 'Growth', description: 'Marketing growth' });
    await expect(page.getByText('Category created')).toBeVisible();
    await expect(dialog).toBeHidden();
  });

  test('deletes a category after confirmation', async ({ page }) => {
    await mock(page, '/api/categories', categories, { method: 'GET' });
    await mock(page, '/api/categories/2', { message: 'Category deleted successfully' }, { method: 'DELETE' });
    await page.goto('/admin/categories');
    await page.getByRole('button', { name: 'Delete SEO' }).click();
    await expect(page.getByText('Delete "SEO"?')).toBeVisible();
    const [request] = await Promise.all([page.waitForRequest((r) => isApi(r, 'DELETE', '/api/categories/2')), acceptConfirm(page, 'Delete')]);
    expect(request).toBeTruthy();
    await expect(page.getByText('Category deleted')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
test.describe('/admin/tags', () => {
  const tags = {
    data: [
      { id: 1, name: 'n8n', slug: 'n8n', description: 'Workflow automation', color: '#10B981', posts_count: 3, created_at: '2026-09-01T10:00:00Z' },
      { id: 2, name: 'Laravel', slug: 'laravel', description: null, color: '#EF4444', posts_count: 0, created_at: '2026-09-02T10:00:00Z' },
    ],
    meta: { total: 2 },
  };

  test('lists tags', async ({ page }) => {
    await mock(page, '/api/tags', tags, { method: 'GET' });
    await page.goto('/admin/tags');
    const table = page.getByRole('table', { name: 'Tags' });
    await expect(table.getByRole('row')).toHaveCount(3);
    await expect(table).toContainText('Workflow automation');
  });

  test('shows empty and error states', async ({ page }) => {
    await page.goto('/admin/tags');
    await expect(page.getByTestId('empty-state')).toContainText('No tags yet');
    await mock(page, '/api/tags', serverError, { status: 500, method: 'GET' });
    await page.reload();
    await expect(page.getByTestId('error-state')).toBeVisible(ERROR_TIMEOUT);
  });

  test('validates colour and creates a tag', async ({ page }) => {
    await mock(page, '/api/tags', { id: 3, name: 'AI', slug: 'ai', color: '#3B82F6' }, { status: 201, method: 'POST' });
    await page.goto('/admin/tags');
    await page.getByRole('button', { name: 'Add tag' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'New tag' });
    await dialog.getByRole('button', { name: 'Create tag' }).click();
    await expect(dialog.getByText('Tag name is required.')).toBeVisible();
    await dialog.getByLabel('Tag name').fill('AI');
    await dialog.getByRole('textbox', { name: 'Colour', exact: true }).fill('blue');
    await dialog.getByRole('button', { name: 'Create tag' }).click();
    await expect(dialog.getByText('Use a hex colour such as #3B82F6.')).toBeVisible();
    await dialog.getByRole('textbox', { name: 'Colour', exact: true }).fill('#3B82F6');
    const [request] = await Promise.all([page.waitForRequest((r) => isApi(r, 'POST', '/api/tags')), dialog.getByRole('button', { name: 'Create tag' }).click()]);
    expect(request.postDataJSON()).toEqual({ name: 'AI', description: '', color: '#3B82F6' });
    await expect(page.getByText('Tag created')).toBeVisible();
  });

  test('shows server validation errors next to the field', async ({ page }) => {
    await mock(page, '/api/tags', tags, { method: 'GET' });
    await mock(page, '/api/tags/1', { message: 'The name has already been taken.', errors: { name: ['The name has already been taken.'] } }, { status: 422, method: 'PUT' });
    await page.goto('/admin/tags');
    await page.getByRole('button', { name: 'Edit n8n' }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit tag' });
    await expect(dialog.getByLabel('Tag name')).toHaveValue('n8n');
    await dialog.getByRole('button', { name: 'Save changes' }).click();
    await expect(dialog.getByText('The name has already been taken.')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
test.describe('/admin/workflow-categories', () => {
  test('lists categories with workflow counts', async ({ page }) => {
    await mock(page, '/api/admin/workflow-categories', { success: true, data: [{ id: 1, name: 'Lead generation', slug: 'lead-generation', description: 'CRM flows', workflows_count: 5 }] }, { method: 'GET' });
    await page.goto('/admin/workflow-categories');
    await expect(page.getByRole('heading', { level: 1, name: 'Workflow Categories' })).toBeVisible();
    const table = page.getByRole('table', { name: 'Workflow categories' });
    await expect(table.getByRole('row')).toHaveCount(2);
    await expect(table).toContainText('5');
  });

  test('shows empty and error states', async ({ page }) => {
    await mock(page, '/api/admin/workflow-categories', { success: true, message: 'No records found', data: [] }, { method: 'GET' });
    await page.goto('/admin/workflow-categories');
    await expect(page.getByTestId('empty-state')).toContainText('No categories yet');
    await mock(page, '/api/admin/workflow-categories', serverError, { status: 500, method: 'GET' });
    await page.reload();
    await expect(page.getByTestId('error-state')).toBeVisible(ERROR_TIMEOUT);
  });

  test('creates a category and surfaces delete errors', async ({ page }) => {
    await mock(page, '/api/admin/workflow-categories', { success: true, data: [{ id: 1, name: 'Lead generation', slug: 'lead-generation', workflows_count: 2 }] }, { method: 'GET' });
    await mock(page, '/api/admin/workflow-categories', { success: true, data: { id: 2, name: 'Reporting' } }, { status: 201, method: 'POST' });
    await mock(
      page,
      '/api/admin/workflow-categories/1',
      { success: false, message: 'Cannot delete category that has workflows. Please move or delete the workflows first.' },
      { status: 422, method: 'DELETE' },
    );
    await page.goto('/admin/workflow-categories');
    await page.getByRole('button', { name: 'Add category' }).click();
    const dialog = page.getByRole('dialog', { name: 'New workflow category' });
    await dialog.getByRole('button', { name: 'Create category' }).click();
    await expect(dialog.getByText('Name is required.')).toBeVisible();
    await dialog.getByLabel('Name').fill('Reporting');
    const [request] = await Promise.all([page.waitForRequest((r) => isApi(r, 'POST', '/api/admin/workflow-categories')), dialog.getByRole('button', { name: 'Create category' }).click()]);
    expect(request.postDataJSON()).toEqual({ name: 'Reporting', description: '' });
    await expect(page.getByText('Category created')).toBeVisible();

    await page.getByRole('button', { name: 'Delete Lead generation' }).click();
    await acceptConfirm(page, 'Delete');
    await expect(page.getByText('Cannot delete category that has workflows.', { exact: false })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
test.describe('/admin/projects', () => {
  const projects = [
    {
      id: 1, title: 'CRM Automation', slug: 'crm-automation', summary: 'HubSpot + n8n', description: 'Full sync', status: 'completed', is_published: true, is_featured: true, order: 1,
      technologies: ['n8n', 'HubSpot'], features: ['Sync'], project_url: 'https://example.com', start_date: '2026-01-01', end_date: null, created_at: '2026-01-01T00:00:00Z',
    },
    { id: 2, title: 'SEO Audit Tool', slug: 'seo-audit-tool', summary: null, description: 'Crawler', status: 'in_progress', is_published: false, is_featured: false, order: 2, created_at: '2026-02-01T00:00:00Z' },
  ];

  test('lists projects and filters by status', async ({ page }) => {
    await mock(page, '/api/admin/projects', projects, { method: 'GET' });
    await page.goto('/admin/projects');
    const table = page.getByRole('table', { name: 'Projects' });
    await expect(table.getByRole('row')).toHaveCount(3);
    await expect(table).toContainText('In progress');
    await expect(page.getByText('2 total · 1 published · 1 featured')).toBeVisible();
    await page.getByLabel('Filter by status').selectOption('completed');
    await expect(table.getByRole('row')).toHaveCount(2);
  });

  test('shows empty and error states', async ({ page }) => {
    await page.goto('/admin/projects');
    await expect(page.getByTestId('empty-state')).toContainText('No projects yet');
    await mock(page, '/api/admin/projects', serverError, { status: 500, method: 'GET' });
    await page.reload();
    await expect(page.getByTestId('error-state')).toBeVisible(ERROR_TIMEOUT);
  });

  test('validates and creates a project with comma-separated lists', async ({ page }) => {
    await mock(page, '/api/admin/projects', { id: 3, title: 'Chatbot' }, { status: 201, method: 'POST' });
    await page.goto('/admin/projects');
    await page.getByRole('button', { name: 'New project' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'New project' });
    await dialog.getByRole('button', { name: 'Create project' }).click();
    await expect(dialog.getByText('Title is required.')).toBeVisible();
    await expect(dialog.getByText('Description is required.')).toBeVisible();

    await dialog.getByRole('textbox', { name: 'Title', exact: true }).fill('Chatbot');
    await dialog.getByPlaceholder('Enter project description...').fill('An AI support bot');
    await dialog.getByLabel('Technologies used').fill('React, Node.js, ');
    await dialog.getByLabel('Project URL').fill('not a url');
    await dialog.getByRole('button', { name: 'Create project' }).click();
    await expect(dialog.getByText('Enter a full URL starting with https://')).toBeVisible();
    await dialog.getByLabel('Project URL').fill('https://bot.example.com');
    await dialog.getByLabel('Published').check();

    const [request] = await Promise.all([page.waitForRequest((r) => isApi(r, 'POST', '/api/admin/projects')), dialog.getByRole('button', { name: 'Create project' }).click()]);
    const body = request.postDataJSON();
    expect(body).toMatchObject({
      title: 'Chatbot',
      description: 'An AI support bot',
      technologies: ['React', 'Node.js'],
      features: [],
      project_url: 'https://bot.example.com',
      github_url: null,
      start_date: null,
      status: 'draft',
      is_published: true,
      order: 0,
    });
    await expect(page.getByText('Project created')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
test.describe('/admin/workflows', () => {
  const workflows = [
    {
      id: 1, title: 'Lead enrichment', slug: 'lead-enrichment', summary: 'Enrich leads with Clearbit', description: 'Desc', status: 'published', is_premium: true, workflow_category_id: 1,
      category: { id: 1, name: 'Sales' }, tools: ['n8n'], benefits: [], tags: [], created_at: '2026-09-01T00:00:00Z',
      files: [{ id: 7, file_id: 3, display_name: 'lead-enrichment.json', description: 'Main flow', file: { id: 3, original_name: 'lead-enrichment.json' } }],
    },
    { id: 2, title: 'Invoice parser', slug: 'invoice-parser', summary: null, description: 'Desc', status: 'draft', is_premium: false, workflow_category_id: 1, category: { id: 1, name: 'Sales' }, files: [], created_at: '2026-09-02T00:00:00Z' },
  ];
  const categories = { success: true, data: [{ id: 1, name: 'Sales', slug: 'sales' }] };

  test.beforeEach(async ({ page }) => {
    await mock(page, '/api/admin/workflow-categories', categories, { method: 'GET' });
  });

  test('lists workflows with category, status and files', async ({ page }) => {
    await mock(page, '/api/admin/workflows', workflows, { method: 'GET' });
    await page.goto('/admin/workflows');
    const table = page.getByRole('table', { name: 'Workflows' });
    await expect(table.getByRole('row')).toHaveCount(3);
    await expect(table).toContainText('Premium');
    await page.getByLabel('Filter workflows').selectOption('draft');
    await expect(table.getByRole('row')).toHaveCount(2);
    await expect(table).toContainText('Invoice parser');
  });

  test('shows empty and error states', async ({ page }) => {
    await page.goto('/admin/workflows');
    await expect(page.getByTestId('empty-state')).toContainText('No workflows yet');
    await mock(page, '/api/admin/workflows', serverError, { status: 500, method: 'GET' });
    await page.reload();
    await expect(page.getByTestId('error-state')).toBeVisible(ERROR_TIMEOUT);
  });

  test('validates and creates a workflow', async ({ page }) => {
    await mock(page, '/api/admin/workflows', { id: 3, title: 'Slack digest' }, { status: 201, method: 'POST' });
    await page.goto('/admin/workflows');
    await page.getByRole('button', { name: 'New workflow' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'New workflow' });
    await dialog.getByRole('button', { name: 'Create workflow' }).click();
    await expect(dialog.getByText('Select a category.')).toBeVisible();
    await expect(dialog.getByText('Title is required.')).toBeVisible();

    await dialog.getByLabel('Category').selectOption('1');
    await dialog.getByRole('textbox', { name: 'Title', exact: true }).fill('Slack digest');
    await dialog.getByPlaceholder('Enter workflow description...').fill('Daily Slack summary');
    await dialog.getByLabel('Tools used').fill('n8n, Slack');
    await dialog.getByLabel('Tags').fill('slack');
    const [request] = await Promise.all([page.waitForRequest((r) => isApi(r, 'POST', '/api/admin/workflows')), dialog.getByRole('button', { name: 'Create workflow' }).click()]);
    expect(request.postDataJSON()).toMatchObject({
      workflow_category_id: 1,
      title: 'Slack digest',
      description: 'Daily Slack summary',
      tools: ['n8n', 'Slack'],
      benefits: [],
      tags: ['slack'],
      status: 'draft',
      difficulty: 'intermediate',
      is_premium: false,
    });
    await expect(page.getByText('Workflow created')).toBeVisible();
  });

  test('edits a workflow and shows attached files', async ({ page }) => {
    await mock(page, '/api/admin/workflows', workflows, { method: 'GET' });
    await mock(page, '/api/admin/workflows/1', { ...workflows[0], title: 'Lead enrichment v2' }, { method: 'PUT' });
    await page.goto('/admin/workflows');
    await page.getByRole('button', { name: 'Edit Lead enrichment' }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit workflow' });
    await expect(dialog.getByText('lead-enrichment.json')).toBeVisible();
    await dialog.getByRole('textbox', { name: 'Title', exact: true }).fill('Lead enrichment v2');
    const [request] = await Promise.all([page.waitForRequest((r) => isApi(r, 'PUT', '/api/admin/workflows/1')), dialog.getByRole('button', { name: 'Update workflow' }).click()]);
    expect(request.postDataJSON()).toMatchObject({ title: 'Lead enrichment v2', workflow_category_id: 1, tools: ['n8n'], is_premium: true, status: 'published' });
    await expect(page.getByText('Workflow updated')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
test.describe('/admin/test-workflows', () => {
  test('lists published workflows and creates through the admin API', async ({ page }) => {
    await mock(page, '/api/workflows', [{ id: 1, title: 'Lead enrichment', slug: 'lead-enrichment', status: 'published', workflow_category_id: 1, category: { id: 1, name: 'Sales' } }], { method: 'GET' });
    await mock(page, '/api/workflow-categories', [{ id: 1, name: 'Sales', workflows_count: 1 }], { method: 'GET' });
    await mock(page, '/api/admin/workflows', { id: 2, title: 'Test' }, { status: 201, method: 'POST' });
    await page.goto('/admin/test-workflows');
    await expect(page.getByRole('table', { name: 'Workflows' }).getByRole('row')).toHaveCount(2);

    await page.getByRole('button', { name: 'Add workflow' }).click();
    const dialog = page.getByRole('dialog', { name: 'New workflow' });
    await dialog.getByRole('button', { name: 'Save workflow' }).click();
    await expect(dialog.getByText('Description is required.')).toBeVisible();
    await dialog.getByLabel('Category').selectOption('1');
    await dialog.getByRole('textbox', { name: 'Title', exact: true }).fill('Test');
    await dialog.getByLabel('Description').fill('Testing');
    const [request] = await Promise.all([page.waitForRequest((r) => isApi(r, 'POST', '/api/admin/workflows')), dialog.getByRole('button', { name: 'Save workflow' }).click()]);
    expect(request.postDataJSON()).toMatchObject({ workflow_category_id: 1, title: 'Test', description: 'Testing', tools: [], benefits: [], status: 'draft' });
    await expect(page.getByText('Workflow created')).toBeVisible();
  });

  test('shows empty and error states', async ({ page }) => {
    await mock(page, '/api/workflow-categories', { message: 'No records found', data: [] });
    await page.goto('/admin/test-workflows');
    await expect(page.getByTestId('empty-state')).toContainText('No workflows yet');
    await mock(page, '/api/workflows', serverError, { status: 500, method: 'GET' });
    await page.reload();
    await expect(page.getByTestId('error-state')).toBeVisible(ERROR_TIMEOUT);
  });
});

// ---------------------------------------------------------------------------
test.describe('/admin/files', () => {
  const files = [
    { id: 1, name: 'hero', original_name: 'hero.png', path: 'uploads/hero.png', mime_type: 'image/png', size: 2048, is_public: true, created_at: '2026-09-01T00:00:00Z' },
    { id: 2, name: 'guide', original_name: 'guide.pdf', path: 'uploads/guide.pdf', mime_type: 'application/pdf', size: 1048576, is_public: true, created_at: '2026-09-02T00:00:00Z' },
  ];

  test('lists files in grid and table views and filters by type', async ({ page }) => {
    await mock(page, '/api/files', files, { method: 'GET' });
    await page.goto('/admin/files');
    const grid = page.getByRole('list', { name: 'Files' });
    await expect(grid.getByRole('listitem')).toHaveCount(2);
    await page.getByRole('button', { name: 'Images' }).click();
    await expect(grid.getByRole('listitem')).toHaveCount(1);
    await expect(grid).toContainText('hero.png');
    await page.getByRole('button', { name: 'All files' }).click();
    await page.getByRole('button', { name: 'Table view' }).click();
    const table = page.getByRole('table', { name: 'Files' });
    await expect(table.getByRole('row')).toHaveCount(3);
    await expect(table).toContainText('1.00 MB');
  });

  test('shows empty and error states', async ({ page }) => {
    await page.goto('/admin/files');
    await expect(page.getByTestId('empty-state')).toContainText('No files yet');
    await mock(page, '/api/files', serverError, { status: 500, method: 'GET' });
    await page.reload();
    await expect(page.getByTestId('error-state')).toBeVisible(ERROR_TIMEOUT);
  });

  test('validates and uploads a file', async ({ page }) => {
    await mock(page, '/api/files', { message: 'File uploaded successfully with SEO-friendly naming.', file: { id: 9 } }, { status: 201, method: 'POST' });
    await page.goto('/admin/files');
    await page.getByRole('button', { name: 'Upload file' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Upload file' });
    await dialog.getByRole('button', { name: 'Upload' }).click();
    await expect(dialog.getByText('Choose a file to upload.')).toBeVisible();
    await dialog.getByLabel('File').setInputFiles({ name: 'notes.exe', mimeType: 'application/x-msdownload', buffer: Buffer.from('MZ') });
    await expect(dialog.getByText(/Only JPG, PNG/)).toBeVisible();
    await dialog.getByLabel('File').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: Buffer.from('89504e47', 'hex') });
    const [request] = await Promise.all([page.waitForRequest((r) => isApi(r, 'POST', '/api/files')), dialog.getByRole('button', { name: 'Upload' }).click()]);
    const body = request.postData() ?? '';
    expect(body).toContain('name="file"; filename="logo.png"');
    expect(body).toContain('name="is_public"');
    await expect(page.getByText('File uploaded', { exact: true })).toBeVisible();
    await expect(dialog).toBeHidden();
  });

  test('deletes a file after confirmation', async ({ page }) => {
    await mock(page, '/api/files', files, { method: 'GET' });
    await mock(page, '/api/files/2', { message: 'File deleted successfully' }, { method: 'DELETE' });
    await page.goto('/admin/files');
    await page.getByRole('button', { name: 'Delete guide.pdf' }).click();
    const [request] = await Promise.all([page.waitForRequest((r) => isApi(r, 'DELETE', '/api/files/2')), acceptConfirm(page, 'Delete')]);
    expect(request).toBeTruthy();
    await expect(page.getByText('File deleted')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
test.describe('/admin/posts', () => {
  const posts = [
    {
      id: 1, title: 'How to Scope an n8n Automation Project', slug: 'scope-n8n', content: '<p>Start with the process.</p>', excerpt: 'Start with the business process.',
      featured_image: null, is_published: true, category_id: 1, category: { id: 1, name: 'Automation' }, tags: [{ id: 1, name: 'n8n', color: '#10B981' }],
      approval_status: 'approved', meta_description: 'Scope n8n projects', meta_keywords: 'n8n', created_at: '2026-09-01T09:00:00Z', updated_at: '2026-09-01T09:00:00Z',
    },
    {
      id: 2, title: 'Technical SEO Checks', slug: 'seo-checks', content: 'Canonical tags', excerpt: null, featured_image: null, is_published: false, category_id: 2,
      category: { id: 2, name: 'SEO' }, tags: [], approval_status: 'pending', created_at: '2026-08-20T09:00:00Z', updated_at: '2026-08-20T09:00:00Z',
    },
  ];
  const paginator = { current_page: 1, data: posts, last_page: 1, per_page: 10, total: 2 };
  const categories = { data: [{ id: 1, name: 'Automation' }, { id: 2, name: 'SEO' }] };
  const tags = { data: [{ id: 1, name: 'n8n', slug: 'n8n', color: '#10B981' }, { id: 2, name: 'SEO', slug: 'seo', color: '#3B82F6' }] };

  test.beforeEach(async ({ page }) => {
    await mock(page, '/api/categories', categories, { method: 'GET' });
    await mock(page, '/api/tags', tags, { method: 'GET' });
  });

  test('lists posts with status and approval, and filters them', async ({ page }) => {
    await mock(page, '/api/admin/posts', paginator, { method: 'GET' });
    await page.goto('/admin/posts');
    const table = page.getByRole('table', { name: 'Blog posts' });
    await expect(table.getByRole('row')).toHaveCount(3);
    await expect(table).toContainText('Automation');
    await expect(table).toContainText('Pending');
    await page.getByLabel('Filter by approval').selectOption('pending');
    await expect(table.getByRole('row')).toHaveCount(2);
    await expect(table).toContainText('Technical SEO Checks');
    await page.getByRole('searchbox', { name: 'Search posts' }).fill('nothing matches this');
    await expect(page.getByTestId('empty-state')).toContainText('No posts match your filters');
  });

  test('shows empty and error states', async ({ page }) => {
    await mock(page, '/api/admin/posts', { current_page: 1, data: [], last_page: 1, per_page: 10, total: 0 }, { method: 'GET' });
    await page.goto('/admin/posts');
    await expect(page.getByTestId('empty-state')).toContainText('No posts yet');
    await mock(page, '/api/admin/posts', serverError, { status: 500, method: 'GET' });
    await page.reload();
    await expect(page.getByTestId('error-state')).toBeVisible(ERROR_TIMEOUT);
  });

  test('creates a post with the markdown editor', async ({ page }) => {
    await mock(page, '/api/admin/posts', { current_page: 1, data: [], last_page: 1, per_page: 10, total: 0 }, { method: 'GET' });
    await mock(page, '/api/admin/posts', { id: 3, title: 'Hello' }, { status: 201, method: 'POST' });
    await page.goto('/admin/posts');
    await page.getByRole('button', { name: 'New post' }).click();
    const dialog = page.getByRole('dialog', { name: 'New post' });
    await dialog.getByRole('button', { name: 'Create post' }).click();
    await expect(dialog.getByText('Title is required.')).toBeVisible();
    await expect(dialog.getByText('Select a category.')).toBeVisible();
    await expect(dialog.getByText('Content is required.')).toBeVisible();

    await dialog.getByRole('textbox', { name: 'Title', exact: true }).fill('Hello automation');
    await dialog.getByLabel('Category').selectOption('1');
    await dialog.getByRole('checkbox', { name: 'n8n' }).check();
    const editor = dialog.getByPlaceholder('Write your content here... You can use Markdown or HTML');
    await editor.fill('## Intro\nFirst line');
    await expect(dialog.getByText('19 characters')).toBeVisible();
    await dialog.getByLabel('Published').check();

    const [request] = await Promise.all([page.waitForRequest((r) => isApi(r, 'POST', '/api/admin/posts')), dialog.getByRole('button', { name: 'Create post' }).click()]);
    expect(request.postDataJSON()).toEqual({
      title: 'Hello automation',
      content: '<p>## Intro<br>First line</p>',
      excerpt: '',
      featured_image: '',
      category_id: 1,
      is_published: true,
      meta_description: '',
      meta_keywords: '',
      tags: [1],
    });
    await expect(page.getByText('Post created')).toBeVisible();
    await expect(dialog).toBeHidden();
  });

  test('edits an existing post', async ({ page }) => {
    await mock(page, '/api/admin/posts', paginator, { method: 'GET' });
    await mock(page, '/api/admin/posts/1', posts[0], { method: 'PUT' });
    await page.goto('/admin/posts');
    await page.getByRole('button', { name: 'Edit How to Scope an n8n Automation Project' }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit post' });
    await expect(dialog.getByRole('textbox', { name: 'Title', exact: true })).toHaveValue('How to Scope an n8n Automation Project');
    await expect(dialog.getByLabel('Category')).toHaveValue('1');
    await expect(dialog.getByRole('checkbox', { name: 'n8n' })).toBeChecked();
    await expect(dialog.getByPlaceholder('Write your content here... You can use Markdown or HTML')).toHaveValue('<p>Start with the process.</p>');
    await dialog.getByRole('textbox', { name: 'Title', exact: true }).fill('Scoping n8n projects');
    const [request] = await Promise.all([page.waitForRequest((r) => isApi(r, 'PUT', '/api/admin/posts/1')), dialog.getByRole('button', { name: 'Update post' }).click()]);
    expect(request.postDataJSON()).toMatchObject({ title: 'Scoping n8n projects', category_id: 1, content: '<p>Start with the process.</p>', tags: [1], is_published: true });
    await expect(page.getByText('Post updated')).toBeVisible();
  });

  test('rejects a pending post with a reason', async ({ page }) => {
    await mock(page, '/api/admin/posts', paginator, { method: 'GET' });
    await mock(page, '/api/posts/2', posts[1], { method: 'PUT' });
    await page.goto('/admin/posts');
    await page.getByRole('button', { name: 'Reject Technical SEO Checks' }).click();
    const dialog = page.getByRole('dialog', { name: 'Reject post' });
    await dialog.getByLabel('Reason for rejection').fill('Needs sources');
    const [request] = await Promise.all([page.waitForRequest((r) => isApi(r, 'PUT', '/api/posts/2')), dialog.getByRole('button', { name: 'Reject post' }).click()]);
    expect(request.postDataJSON()).toMatchObject({ approval_status: 'rejected', rejection_reason: 'Needs sources', title: 'Technical SEO Checks', category_id: 2 });
    await expect(page.getByText('Post rejected')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
test.describe('/admin/cv-templates', () => {
  const template = {
    id: 1, name: 'Modern Professional', description: 'Clean two-column layout', thumbnail: null, category: 'professional', ats_score: 9, is_active: true, is_default: true,
    customizable_options: ['primaryColor'], created_by: 1, creator: { id: 1, name: 'Naqash Thaheem' }, created_at: '2026-09-01T00:00:00Z',
  };
  const second = { ...template, id: 2, name: 'Creative Bold', category: 'creative', ats_score: 6, is_active: false, is_default: false };
  const list = { success: true, data: { current_page: 1, data: [template, second], last_page: 1, per_page: 10, total: 2 } };

  test('lists templates', async ({ page }) => {
    await mock(page, '/api/admin/cv-templates', list, { method: 'GET' });
    await page.goto('/admin/cv-templates');
    const table = page.getByRole('table', { name: 'CV templates' });
    await expect(table.getByRole('row')).toHaveCount(3);
    await expect(table).toContainText('Default');
    await expect(table).toContainText('9/10');
    await expect(table).toContainText('Inactive');
    await expect(page.getByText('Debug Info')).toHaveCount(0);
  });

  test('shows empty and error states', async ({ page }) => {
    await mock(page, '/api/admin/cv-templates', { success: true, data: { current_page: 1, data: [], last_page: 1, total: 0 } }, { method: 'GET' });
    await page.goto('/admin/cv-templates');
    await expect(page.getByTestId('empty-state')).toContainText('No CV templates yet');
    await mock(page, '/api/admin/cv-templates', serverError, { status: 500, method: 'GET' });
    await page.reload();
    await expect(page.getByTestId('error-state')).toBeVisible(ERROR_TIMEOUT);
  });

  test('toggles a template and validates the edit form', async ({ page }) => {
    await mock(page, '/api/admin/cv-templates', list, { method: 'GET' });
    await mock(page, '/api/admin/cv-templates/2/toggle', { success: true, message: 'Template status updated successfully', data: { ...second, is_active: true } }, { method: 'POST' });
    await mock(page, '/api/admin/cv-templates/2', { success: true, data: { ...second, html_content: '<div>{{fullName}}</div>', json_config: { layout: 'single-column' }, field_mappings: {} } }, { method: 'GET' });
    await mock(page, '/api/admin/cv-templates/2', { success: true, data: second }, { method: 'POST' });
    await page.goto('/admin/cv-templates');

    const [toggle] = await Promise.all([page.waitForRequest((r) => isApi(r, 'POST', '/api/admin/cv-templates/2/toggle')), page.getByRole('button', { name: 'Activate Creative Bold' }).click()]);
    expect(toggle).toBeTruthy();
    await expect(page.getByText('Template status updated')).toBeVisible();

    await page.getByRole('button', { name: 'Edit Creative Bold' }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit template' });
    await expect(dialog.getByLabel('HTML content')).toHaveValue('<div>{{fullName}}</div>');
    await dialog.getByLabel('Template name').fill('');
    await dialog.getByRole('button', { name: 'Update template' }).click();
    await expect(dialog.getByText('Template name is required.')).toBeVisible();
    await dialog.getByLabel('Template name').fill('Creative Bold v2');
    const [save] = await Promise.all([page.waitForRequest((r) => isApi(r, 'POST', '/api/admin/cv-templates/2')), dialog.getByRole('button', { name: 'Update template' }).click()]);
    const body = save.postData() ?? '';
    expect(body).toContain('Creative Bold v2');
    expect(body).toContain('name="_method"');
    await expect(page.getByText('Template updated')).toBeVisible();
  });

  test('refuses to delete the default template', async ({ page }) => {
    await mock(page, '/api/admin/cv-templates', list, { method: 'GET' });
    await page.goto('/admin/cv-templates');
    await page.getByRole('button', { name: 'Delete Modern Professional' }).click();
    await expect(page.getByText('Cannot delete the default template')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
test.describe('/admin/cv-templates/create', () => {
  test('walks through the wizard and creates a template', async ({ page }) => {
    await mock(page, '/api/admin/cv-templates-temp', { success: true, message: 'CV template created successfully', data: { id: 5 } }, { status: 201, method: 'POST' });
    await page.goto('/admin/cv-templates/create');
    await expect(page.getByRole('heading', { level: 1, name: 'Create CV Template' })).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('Template name is required.')).toBeVisible();

    await page.getByLabel('Template name').fill('Executive Classic');
    await page.getByLabel('Category').selectOption('executive');
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByLabel('HTML/CSS template code')).toHaveValue(/\{\{fullName\}\}/);
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.frameLocator('iframe[title="CV template preview"]').getByText('Jane Doe')).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('Executive Classic')).toBeVisible();

    const [request] = await Promise.all([page.waitForRequest((r) => isApi(r, 'POST', '/api/admin/cv-templates-temp')), page.getByRole('button', { name: 'Save template' }).click()]);
    const body = request.postData() ?? '';
    expect(body).toContain('Executive Classic');
    expect(body).toContain('name="json_config"');
    await expect(page).toHaveURL(/\/admin\/cv-templates$/);
    await expect(page.getByText('Template created')).toBeVisible();
  });

  test('shows server validation errors on the right step', async ({ page }) => {
    await mock(page, '/api/admin/cv-templates-temp', { success: false, message: 'Validation failed', errors: { name: ['The name has already been taken.'] } }, { status: 422, method: 'POST' });
    await page.goto('/admin/cv-templates/create');
    await page.getByLabel('Template name').fill('Duplicate');
    for (let i = 0; i < 3; i += 1) await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Save template' }).click();
    await expect(page.getByText('The name has already been taken.').first()).toBeVisible();
    await expect(page.getByLabel('Template name')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
test.describe('/admin/home-settings', () => {
  const setting = (id: number, key: string, type: string, value: string, extra: Record<string, unknown> = {}) => ({
    id, key, type, value, title: null, description: null, is_active: true, sort_order: id, created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z', ...extra,
  });
  const settings = [
    setting(1, 'notification_enabled', 'boolean', '0'),
    setting(2, 'notification_message', 'text', 'Old message'),
    setting(3, 'hero_title', 'text', 'Automation that ships'),
    setting(4, 'custom_flag', 'boolean', '1', { is_active: false }),
  ];

  test('lists settings grouped by category', async ({ page }) => {
    await mock(page, '/api/admin/home-settings', { settings, grouped: {} }, { method: 'GET' });
    await page.goto('/admin/home-settings');
    await expect(page.getByRole('heading', { level: 1, name: 'Home Settings' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Hero Section' })).toContainText('Automation that ships');
    await expect(page.getByRole('region', { name: 'Custom' })).toContainText('Inactive');
    await page.getByRole('button', { name: /^Notifications/ }).click();
    await expect(page.getByRole('region', { name: 'Hero Section' })).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Notifications' })).toContainText('Old message');
  });

  test('shows empty and error states', async ({ page }) => {
    await page.goto('/admin/home-settings');
    await expect(page.getByTestId('empty-state')).toContainText('No home settings yet');
    await mock(page, '/api/admin/home-settings', serverError, { status: 500, method: 'GET' });
    await page.reload();
    await expect(page.getByTestId('error-state')).toBeVisible(ERROR_TIMEOUT);
  });

  test('saves the homepage notification banner', async ({ page }) => {
    await mock(page, '/api/admin/home-settings', { settings, grouped: {} }, { method: 'GET' });
    await mock(page, /^\/api\/admin\/home-settings\/\d+$/, { message: 'Home setting updated successfully' }, { method: 'PUT' });
    await mock(page, '/api/admin/home-settings', { message: 'Home setting created successfully' }, { status: 201, method: 'POST' });
    await page.goto('/admin/home-settings');
    await page.getByLabel('Show the banner on the homepage').check();
    await page.getByLabel('Banner message').fill('');
    await page.getByRole('button', { name: 'Save banner' }).click();
    await expect(page.getByText('Enter a message to show the banner.')).toBeVisible();

    await page.getByLabel('Banner message').fill('New templates are live!');
    await page.getByLabel('Banner style').selectOption('success');
    await expect(page.getByTestId('banner-preview')).toHaveText('New templates are live!');

    const requests: Request[] = [];
    page.on('request', (r) => {
      if (/\/api\/admin\/home-settings/.test(new URL(r.url()).pathname) && ['PUT', 'POST'].includes(r.method())) requests.push(r);
    });
    await page.getByRole('button', { name: 'Save banner' }).click();
    await expect(page.getByText('Notification banner saved')).toBeVisible();
    const sent = requests.map((r) => ({ method: r.method(), path: new URL(r.url()).pathname, body: r.postDataJSON() }));
    expect(sent).toEqual([
      { method: 'PUT', path: '/api/admin/home-settings/1', body: expect.objectContaining({ key: 'notification_enabled', type: 'boolean', value: '1', is_active: true }) },
      { method: 'POST', path: '/api/admin/home-settings', body: expect.objectContaining({ key: 'notification_type', type: 'text', value: 'success', is_active: true }) },
      { method: 'PUT', path: '/api/admin/home-settings/2', body: expect.objectContaining({ key: 'notification_message', value: 'New templates are live!' }) },
    ]);
  });

  test('validates and creates a setting from a predefined key', async ({ page }) => {
    await mock(page, '/api/admin/home-settings', { message: 'Home setting created successfully', setting: {} }, { status: 201, method: 'POST' });
    await page.goto('/admin/home-settings');
    await page.getByRole('button', { name: 'Add setting' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'New setting' });
    await dialog.getByRole('button', { name: 'Create setting' }).click();
    await expect(dialog.getByText('Setting key is required.')).toBeVisible();
    await dialog.getByRole('button', { name: /Browse predefined keys/ }).click();
    await dialog.getByRole('button', { name: /Show Notification Banner/ }).click();
    await expect(dialog.getByLabel('Setting key')).toHaveValue('notification_enabled');
    await expect(dialog.getByLabel('Type')).toHaveValue('boolean');
    await dialog.getByLabel('Value').selectOption('1');
    const [request] = await Promise.all([page.waitForRequest((r) => isApi(r, 'POST', '/api/admin/home-settings')), dialog.getByRole('button', { name: 'Create setting' }).click()]);
    expect(request.postDataJSON()).toMatchObject({ key: 'notification_enabled', type: 'boolean', value: '1', is_active: true });
    await expect(page.getByText('Setting created')).toBeVisible();
  });

  test('shows Laravel validation errors returned as a bare error bag', async ({ page }) => {
    await mock(page, '/api/admin/home-settings', { key: ['The key has already been taken.'] }, { status: 422, method: 'POST' });
    await page.goto('/admin/home-settings');
    await page.getByRole('button', { name: 'Add setting' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'New setting' });
    await dialog.getByLabel('Setting key').fill('hero_title');
    await dialog.getByRole('button', { name: 'Create setting' }).click();
    await expect(dialog.getByText('The key has already been taken.')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
test.describe('Content pages on mobile @mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  const routes = [
    '/admin/posts',
    '/admin/categories',
    '/admin/tags',
    '/admin/projects',
    '/admin/workflows',
    '/admin/workflow-categories',
    '/admin/test-workflows',
    '/admin/files',
    '/admin/cv-templates',
    '/admin/cv-templates/create',
    '/admin/home-settings',
  ];

  test('have no horizontal page overflow', async ({ page, isMobile, pageErrors }) => {
    test.skip(!isMobile, 'mobile only');
    test.setTimeout(90_000);
    await mock(page, '/api/admin/posts', {
      current_page: 1, last_page: 1, per_page: 10, total: 1,
      data: [{ id: 1, title: 'A very long post title that should truncate nicely on small screens', slug: 'a', is_published: true, category_id: 1, approval_status: 'pending', created_at: '2026-09-01T00:00:00Z' }],
    });
    await mock(page, '/api/files', [{ id: 1, original_name: 'a-very-long-file-name-that-keeps-going-and-going.png', path: 'uploads/a.png', mime_type: 'image/png', size: 100 }]);
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('h1')).toHaveCount(1);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${route} overflows horizontally`).toBeLessThanOrEqual(0);
    }
    expect(pageErrors).toEqual([]);
  });
});
