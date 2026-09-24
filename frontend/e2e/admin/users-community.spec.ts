import type { Page, Request } from '@playwright/test';
import { test, expect, loginAsAdmin, adminUser } from '../fixtures';

// Admin pages: Users, Community and Overview (analytics / monitoring).
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

const users = [
  { id: adminUser.id, name: adminUser.name, email: adminUser.email, role: 'admin', email_verified_at: '2026-01-02T10:00:00Z', created_at: '2026-01-01T10:00:00Z', updated_at: '2026-01-01T10:00:00Z', groups: [] },
  { id: 2, name: 'Jane Doe', email: 'jane@example.com', role: 'user', email_verified_at: null, created_at: '2026-08-01T10:00:00Z', updated_at: '2026-08-01T10:00:00Z', groups: [{ id: 5, name: 'Beta testers', color: '#10B981' }] },
  { id: 3, name: 'Omar Khan', email: 'omar@example.com', role: 'moderator', email_verified_at: '2026-08-03T10:00:00Z', created_at: '2026-08-02T10:00:00Z', updated_at: '2026-08-02T10:00:00Z', groups: [] },
];

const paginated = <T,>(data: T[], extra: Record<string, unknown> = {}) => ({
  success: true,
  data: { current_page: 1, data, last_page: 1, per_page: 15, total: data.length, ...extra },
});

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page);
});

// ---------------------------------------------------------------------------
test.describe('/admin/user-management', () => {
  const stats = { success: true, data: { total_users: 3, verified_users: 2, unverified_users: 1, admin_users: 1, regular_users: 1, moderator_users: 1, recent_registrations: 2 } };

  test.beforeEach(async ({ page }) => {
    await mock(page, '/api/admin/user-management/stats', stats);
  });

  test('lists users and statistics from the API', async ({ page }) => {
    await mock(page, '/api/admin/user-management', paginated(users), { method: 'GET' });
    await page.goto('/admin/user-management');
    await expect(page.getByRole('heading', { level: 1, name: 'User Management' })).toBeVisible();
    const table = page.getByRole('table', { name: 'Users' });
    await expect(table.getByRole('row')).toHaveCount(4);
    await expect(table.getByText('jane@example.com')).toBeVisible();
    await expect(table.getByText('Unverified')).toBeVisible();
    await expect(page.getByTestId('user-stats')).toContainText('3');
    await expect(page.getByTestId('user-stats')).toContainText('1 admins · 1 moderators');
  });

  test('an admin cannot delete, select or demote their own account', async ({ page }) => {
    await mock(page, '/api/admin/user-management', paginated(users), { method: 'GET' });
    await page.goto('/admin/user-management');
    const selfRow = page.getByRole('row').filter({ hasText: adminUser.email });
    await expect(selfRow.getByText('You', { exact: true })).toBeVisible();
    await expect(selfRow.getByRole('button', { name: 'You cannot delete your own account' })).toBeDisabled();
    await expect(selfRow.getByRole('checkbox')).toBeDisabled();

    await selfRow.getByRole('button', { name: `Edit ${adminUser.name}` }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit user' });
    await expect(dialog.getByLabel('Role')).toBeDisabled();
    await expect(dialog.getByText('You cannot change the role of your own account.')).toBeVisible();
  });

  test('shows the empty state', async ({ page }) => {
    await page.goto('/admin/user-management');
    await expect(page.getByTestId('empty-state')).toContainText('No users yet');
  });

  test('shows an error state with retry', async ({ page }) => {
    await mock(page, '/api/admin/user-management', { message: 'Server exploded' }, { status: 500, method: 'GET' });
    await page.goto('/admin/user-management');
    const error = page.getByTestId('error-state');
    await expect(error).toContainText('Could not load users', { timeout: 15_000 });
    await expect(error.getByRole('button', { name: 'Try again' })).toBeVisible();
  });

  test('role changes need an explicit confirmation and send the right payload', async ({ page }) => {
    await mock(page, '/api/admin/user-management', paginated(users), { method: 'GET' });
    await mock(page, '/api/admin/user-management/2', { success: true, message: 'User updated successfully', data: { ...users[1], role: 'admin' } }, { method: 'PUT' });
    await page.goto('/admin/user-management');
    await page.getByRole('button', { name: 'Edit Jane Doe' }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit user' });
    await dialog.getByLabel('Role').selectOption('admin');

    let sent = false;
    page.on('request', (req) => {
      if (isApi(req, 'PUT', '/api/admin/user-management/2')) sent = true;
    });
    await dialog.getByRole('button', { name: 'Save changes' }).click();
    await expect(dialog.getByRole('alert')).toContainText('from user to admin');
    expect(sent, 'no request before confirming').toBe(false);

    const request = page.waitForRequest((req) => isApi(req, 'PUT', '/api/admin/user-management/2'));
    await page.getByRole('button', { name: 'Confirm role change' }).click();
    expect((await request).postDataJSON()).toEqual({ name: 'Jane Doe', email: 'jane@example.com', role: 'admin' });
    await expect(page.getByText('User updated', { exact: true })).toBeVisible();
    await expect(dialog).toBeHidden();
  });

  test('validates required fields before saving', async ({ page }) => {
    await mock(page, '/api/admin/user-management', paginated(users), { method: 'GET' });
    await page.goto('/admin/user-management');
    await page.getByRole('button', { name: 'Edit Jane Doe' }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit user' });
    await dialog.getByLabel('Name').fill('');
    await dialog.getByRole('button', { name: 'Save changes' }).click();
    await expect(dialog.getByText('Name is required.')).toBeVisible();
    await expect(dialog.getByLabel('Name')).toHaveAttribute('aria-invalid', 'true');
  });

  test('deleting a user requires confirmation', async ({ page }) => {
    await mock(page, '/api/admin/user-management', paginated(users), { method: 'GET' });
    await mock(page, '/api/admin/user-management/2', { success: true, message: 'User account deleted successfully' }, { method: 'DELETE' });
    await page.goto('/admin/user-management');
    await page.getByRole('button', { name: 'Delete Jane Doe' }).click();
    await expect(page.getByText('Delete Jane Doe (jane@example.com)?')).toBeVisible();
    const request = page.waitForRequest((req) => isApi(req, 'DELETE', '/api/admin/user-management/2'));
    await page.getByRole('button', { name: 'Delete user', exact: true }).click();
    await request;
    await expect(page.getByText('User deleted', { exact: true })).toBeVisible();
  });

  test('bulk delete never includes the current admin', async ({ page }) => {
    await mock(page, '/api/admin/user-management', paginated(users), { method: 'GET' });
    await mock(page, '/api/admin/bulk/users/delete', { message: 'Successfully deleted 2 users', deleted_count: 2 }, { method: 'POST' });
    await page.goto('/admin/user-management');
    await page.getByRole('checkbox', { name: 'Select all users on this page' }).check();
    await expect(page.getByText('2 users selected')).toBeVisible();
    await page.getByRole('button', { name: 'Delete selected' }).click();
    const request = page.waitForRequest((req) => isApi(req, 'POST', '/api/admin/bulk/users/delete'));
    await page.getByRole('button', { name: 'Delete 2 users', exact: true }).click();
    expect((await request).postDataJSON()).toEqual({ ids: [2, 3] });
    await expect(page.getByText('Users deleted', { exact: true })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
test.describe('/admin/users (legacy)', () => {
  test('lists users with their groups', async ({ page }) => {
    await mock(page, '/api/admin/users', users, { method: 'GET' });
    await page.goto('/admin/users');
    await expect(page.getByRole('heading', { level: 1, name: 'Users' })).toBeVisible();
    await expect(page.getByRole('table', { name: 'Users' }).getByRole('row')).toHaveCount(4);
    await expect(page.getByText('Beta testers')).toBeVisible();
    const selfRow = page.getByRole('row').filter({ hasText: adminUser.email });
    await expect(selfRow.getByRole('button', { name: 'You cannot delete your own account' })).toBeDisabled();
  });

  test('shows empty and error states', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.getByTestId('empty-state')).toContainText('No users yet');

    await mock(page, '/api/admin/users', { message: 'nope' }, { status: 500, method: 'GET' });
    await page.getByLabel('Filter by role').selectOption('admin');
    await expect(page.getByTestId('error-state')).toContainText('Could not load users', { timeout: 15_000 });
  });

  test('creates a user and validates the password', async ({ page }) => {
    await mock(page, '/api/admin/users', { id: 9, name: 'New Person', email: 'new@example.com', role: 'user' }, { status: 201, method: 'POST' });
    await page.goto('/admin/users');
    await page.getByRole('button', { name: 'Add user' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Create user' });
    await dialog.getByLabel('Name').fill('New Person');
    await dialog.getByLabel('Email').fill('new@example.com');
    await dialog.getByRole('button', { name: 'Create user' }).click();
    await expect(dialog.getByText('Password is required.')).toBeVisible();

    await dialog.getByLabel('Password').fill('secret123');
    const request = page.waitForRequest((req) => isApi(req, 'POST', '/api/admin/users'));
    await dialog.getByRole('button', { name: 'Create user' }).click();
    expect((await request).postDataJSON()).toEqual({ name: 'New Person', email: 'new@example.com', role: 'user', password: 'secret123' });
    await expect(page.getByText('User created', { exact: true })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
test.describe('/admin/user-groups', () => {
  const groups = [
    { id: 5, name: 'Beta testers', description: 'Early access', color: '#10B981', is_active: true, members_count: 2 },
    { id: 6, name: 'Archived', description: null, color: '#64748B', is_active: false, members_count: 0 },
  ];

  test('lists groups', async ({ page }) => {
    await mock(page, '/api/admin/user-groups', groups, { method: 'GET' });
    await page.goto('/admin/user-groups');
    const list = page.getByRole('list', { name: 'User groups' });
    await expect(list.getByRole('listitem')).toHaveCount(2);
    await expect(list).toContainText('Beta testers');
    await expect(list).toContainText('2 members');
    await expect(list).toContainText('Inactive');
  });

  test('shows empty and error states', async ({ page }) => {
    await page.goto('/admin/user-groups');
    await expect(page.getByTestId('empty-state')).toContainText('No user groups yet');
    await mock(page, '/api/admin/user-groups', { message: 'nope' }, { status: 500, method: 'GET' });
    await page.getByLabel('Search groups').fill('zzz');
    await expect(page.getByTestId('error-state')).toContainText('Could not load user groups', { timeout: 15_000 });
  });

  test('creates a group after validating the name', async ({ page }) => {
    await mock(page, '/api/admin/user-groups', { id: 7, name: 'Editors', members: [] }, { status: 201, method: 'POST' });
    await page.goto('/admin/user-groups');
    await page.getByRole('button', { name: 'Create group' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Create group' });
    await dialog.getByRole('button', { name: 'Create group' }).click();
    await expect(dialog.getByText('Group name is required.')).toBeVisible();

    await dialog.getByLabel('Group name').fill('Editors');
    await dialog.getByLabel('Description').fill('Can edit posts');
    const request = page.waitForRequest((req) => isApi(req, 'POST', '/api/admin/user-groups'));
    await dialog.getByRole('button', { name: 'Create group' }).click();
    expect((await request).postDataJSON()).toEqual({ name: 'Editors', description: 'Can edit posts', color: '#3B82F6', is_active: true });
    await expect(page.getByText('Group created', { exact: true })).toBeVisible();
  });

  test('adds a member from the members dialog', async ({ page }) => {
    await mock(page, '/api/admin/user-groups', groups, { method: 'GET' });
    await mock(page, '/api/admin/user-groups/5', { ...groups[0], members: [{ id: 3, name: 'Omar Khan', email: 'omar@example.com', role: 'moderator', pivot: { added_by: 1, joined_at: '2026-08-05T10:00:00Z' } }] }, { method: 'GET' });
    await mock(page, '/api/admin/users', users, { method: 'GET' });
    await mock(page, '/api/admin/user-groups/5/members', { message: 'User added to group successfully' }, { method: 'POST' });
    await page.goto('/admin/user-groups');
    await page.getByRole('listitem').filter({ hasText: 'Beta testers' }).getByRole('button', { name: 'Members' }).click();
    const dialog = page.getByRole('dialog', { name: 'Beta testers members' });
    await expect(dialog.getByText('Current members (1)')).toBeVisible();
    // Existing members are not offered again.
    await expect(dialog.getByLabel('Add member').locator('option')).toHaveCount(3);
    await dialog.getByLabel('Add member').selectOption('2');
    const request = page.waitForRequest((req) => isApi(req, 'POST', '/api/admin/user-groups/5/members'));
    await dialog.getByRole('button', { name: 'Add', exact: true }).click();
    expect((await request).postDataJSON()).toEqual({ user_id: 2 });
    await expect(page.getByText('Member added', { exact: true })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
test.describe('/admin/user-activities', () => {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const activities = [
    { id: 1, user_id: 2, activity_type: 'login', description: 'Logged in', ip_address: '10.0.0.1', created_at: '2026-09-20T10:00:00Z', user: { id: 2, name: 'Jane Doe', email: 'jane@example.com' } },
    { id: 2, user_id: 99, activity_type: 'cv_created', description: 'Created a CV', ip_address: null, created_at: '2026-09-21T10:00:00Z', user: null },
  ];
  const statistics = {
    success: true,
    data: {
      total_activities: 42,
      activities_by_type: [{ activity_type: 'login', count: 30 }, { activity_type: 'cv_created', count: 12 }],
      most_active_users: [{ user_id: 2, activity_count: 30, user: { id: 2, name: 'Jane Doe', email: 'jane@example.com' } }],
      timeline: [{ date: '2026-01-01', count: 99 }, { date: todayKey, count: 7 }],
      recent_activities: [],
    },
  };

  test('lists activities and statistics (including deleted users)', async ({ page }) => {
    await mock(page, '/api/admin/user-activities', paginated(activities));
    await mock(page, '/api/admin/user-activities/statistics', statistics);
    await mock(page, '/api/admin/user-activities/types', { success: true, data: ['login', 'cv_created'] });
    await page.goto('/admin/user-activities');
    const table = page.getByRole('table', { name: 'User activities' });
    await expect(table.getByRole('row')).toHaveCount(3);
    await expect(table).toContainText('Deleted user');
    const stats = page.getByTestId('activity-stats');
    await expect(stats).toContainText('42');
    await expect(stats.locator('div').filter({ hasText: /^Today/ }).first()).toContainText('7');
  });

  test('shows empty and error states', async ({ page }) => {
    await page.goto('/admin/user-activities');
    await expect(page.getByTestId('empty-state')).toContainText('No activity recorded yet');
    await mock(page, '/api/admin/user-activities', { message: 'nope' }, { status: 500 });
    await page.getByRole('button', { name: 'Refresh' }).first().click();
    await expect(page.getByTestId('error-state')).toContainText('Could not load activities', { timeout: 15_000 });
  });

  test('cleans up old activities after validating the number of days', async ({ page }) => {
    await mock(page, '/api/admin/user-activities/cleanup', { success: true, message: 'Deleted 12 activities older than 90 days', deleted_count: 12 }, { method: 'DELETE' });
    await page.goto('/admin/user-activities');
    await page.getByRole('button', { name: 'Clean up' }).click();
    const dialog = page.getByRole('dialog', { name: 'Clean up old activities' });
    const days = dialog.getByLabel('Delete activities older than (days)');
    await days.fill('10');
    await dialog.getByRole('button', { name: 'Delete old activities' }).click();
    await expect(dialog.getByText('Activities newer than 30 days cannot be removed.')).toBeVisible();

    await days.fill('90');
    const request = page.waitForRequest((req) => isApi(req, 'DELETE', '/api/admin/user-activities/cleanup'));
    await dialog.getByRole('button', { name: 'Delete old activities' }).click();
    expect(new URL((await request).url()).searchParams.get('days')).toBe('90');
    await expect(page.getByText('Deleted 12 activities older than 90 days')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
test.describe('/admin/issue-categories', () => {
  const categories = [
    { id: 1, name: 'Bug', slug: 'bug', description: 'Something is broken', color: '#EF4444', icon: 'bug', is_active: true, sort_order: 1, issues_count: 4 },
    { id: 2, name: 'Idea', slug: 'idea', description: null, color: null, icon: null, is_active: false, sort_order: 2, issues_count: 0 },
  ];

  test('lists categories', async ({ page }) => {
    await mock(page, '/api/admin/issue-categories', { success: true, data: categories }, { method: 'GET' });
    await page.goto('/admin/issue-categories');
    const table = page.getByRole('table', { name: 'Issue categories' });
    await expect(table.getByRole('row')).toHaveCount(3);
    await expect(table).toContainText('/bug');
    await expect(table).toContainText('Inactive');
  });

  test('shows empty and error states', async ({ page }) => {
    await page.goto('/admin/issue-categories');
    await expect(page.getByTestId('empty-state')).toContainText('No issue categories yet');
    await mock(page, '/api/admin/issue-categories', { success: false, message: 'Failed to fetch categories' }, { status: 500, method: 'GET' });
    await page.reload();
    await expect(page.getByTestId('error-state')).toContainText('Could not load categories', { timeout: 15_000 });
  });

  test('creates a category after validating the name', async ({ page }) => {
    await mock(page, '/api/admin/issue-categories', { success: true, data: { id: 3, name: 'Question' } }, { status: 201, method: 'POST' });
    await page.goto('/admin/issue-categories');
    await page.getByRole('button', { name: 'Add category' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Create category' });
    await dialog.getByRole('button', { name: 'Create category' }).click();
    await expect(dialog.getByText('Name is required.')).toBeVisible();

    await dialog.getByLabel('Name').fill('Question');
    const request = page.waitForRequest((req) => isApi(req, 'POST', '/api/admin/issue-categories'));
    await dialog.getByRole('button', { name: 'Create category' }).click();
    expect((await request).postDataJSON()).toEqual({ name: 'Question', description: '', color: '#64748B', icon: 'tag', is_active: true, sort_order: 99 });
    await expect(page.getByText('Category created', { exact: true })).toBeVisible();
  });

  test('deletes an unused category after confirmation', async ({ page }) => {
    await mock(page, '/api/admin/issue-categories', { success: true, data: categories }, { method: 'GET' });
    await mock(page, '/api/admin/issue-categories/2', { success: true, message: 'Issue category deleted successfully' }, { method: 'DELETE' });
    await page.goto('/admin/issue-categories');
    const request = page.waitForRequest((req) => isApi(req, 'DELETE', '/api/admin/issue-categories/2'));
    await page.getByRole('button', { name: 'Delete Idea' }).click();
    await page.getByRole('button', { name: 'Delete category', exact: true }).click();
    await request;
    await expect(page.getByText('Category deleted', { exact: true })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
test.describe('/admin/issues', () => {
  const issues = [
    {
      id: 11, title: 'Login button does nothing', slug: 'login-button', description: 'Clicking login on mobile does nothing at all.', user_id: 2, user: { id: 2, name: 'Jane Doe' },
      category_id: 1, category: { id: 1, name: 'Bug' }, status: 'open', priority: 'high', assigned_to: null, assignee: null, labels: ['mobile'],
      views_count: 10, upvotes_count: 3, comments_count: 2, is_pinned: true, merged_into: null, merged_issues: [], created_at: '2026-09-10T10:00:00Z',
    },
    {
      id: 12, title: 'Add dark mode', slug: 'dark-mode', description: 'Please add a dark theme option.', user_id: null, guest_name: 'Visitor',
      category_id: null, category: null, status: 'in_progress', priority: 'low', views_count: 4, upvotes_count: 8, comments_count: 0, created_at: '2026-09-11T10:00:00Z',
    },
  ];
  const list = { success: true, data: issues, pagination: { current_page: 1, last_page: 1, per_page: 20, total: 2 } };

  test('lists issues with their author, status and priority', async ({ page }) => {
    await mock(page, '/api/issues', list, { method: 'GET' });
    await mock(page, '/api/issue-categories', { success: true, data: [{ id: 1, name: 'Bug' }] });
    await page.goto('/admin/issues');
    const table = page.getByRole('table', { name: 'Issues' });
    await expect(table.getByRole('row')).toHaveCount(3);
    await expect(table).toContainText('by Jane Doe');
    await expect(table).toContainText('by Visitor');
    await expect(table).toContainText('In progress');
    await expect(page.getByLabel('Filter by category').locator('option')).toHaveCount(2);
  });

  test('shows empty and error states', async ({ page }) => {
    await page.goto('/admin/issues');
    await expect(page.getByTestId('empty-state')).toContainText('No issues reported yet');
    await mock(page, '/api/issues', { success: false, message: 'Failed to fetch issues' }, { status: 500, method: 'GET' });
    await page.getByLabel('Filter by status').selectOption('closed');
    await expect(page.getByTestId('error-state')).toContainText('Could not load issues', { timeout: 15_000 });
  });

  test('updates the status of an issue', async ({ page }) => {
    await mock(page, '/api/issues', list, { method: 'GET' });
    await mock(page, '/api/issues/11/status', { success: true, message: 'Issue status updated successfully' }, { method: 'POST' });
    await page.goto('/admin/issues');
    await page.getByRole('button', { name: 'Change status of issue #11' }).click();
    const dialog = page.getByRole('dialog', { name: 'Update issue status' });
    await dialog.getByLabel('Status').selectOption('resolved');
    await dialog.getByLabel('Resolution notes').fill('Fixed in 2.1');
    const request = page.waitForRequest((req) => isApi(req, 'POST', '/api/issues/11/status'));
    await dialog.getByRole('button', { name: 'Update status' }).click();
    expect((await request).postDataJSON()).toEqual({ status: 'resolved', resolution_notes: 'Fixed in 2.1' });
    await expect(page.getByText('Status updated', { exact: true })).toBeVisible();
  });

  test('validates the edit form', async ({ page }) => {
    await mock(page, '/api/issues', list, { method: 'GET' });
    await page.goto('/admin/issues');
    await page.getByRole('button', { name: 'Edit issue #11' }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit issue' });
    await dialog.getByLabel('Title').fill('');
    await dialog.getByRole('button', { name: 'Save changes' }).click();
    await expect(dialog.getByText('Title is required.')).toBeVisible();
  });

  test('deleting an issue requires confirmation', async ({ page }) => {
    await mock(page, '/api/issues', list, { method: 'GET' });
    await mock(page, '/api/issues/12', { success: true, message: 'Issue deleted successfully' }, { method: 'DELETE' });
    await page.goto('/admin/issues');
    await page.getByRole('button', { name: 'Delete issue #12' }).click();
    const request = page.waitForRequest((req) => isApi(req, 'DELETE', '/api/issues/12'));
    await page.getByRole('button', { name: 'Delete issue', exact: true }).click();
    await request;
    await expect(page.getByText('Issue deleted', { exact: true })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
test.describe('/admin/analytics', () => {
  const dashboard = {
    summary: { total_installs: 1200, total_uninstalls: 200, total_launches: 5400, net_installs: 1000, platforms: { android: 700, ios: 500 }, countries: { PK: 800, US: 400 }, device_types: { mobile: 1100, tablet: 100 } },
    daily_installs: { '2026-09-20': 40, '2026-09-21': 55 },
    daily_uninstalls: { '2026-09-21': 5 },
    retention_data: [],
    top_countries: { PK: 800, US: 400 },
    platform_distribution: { android: 700, ios: 500 },
    device_type_distribution: { mobile: 1100, tablet: 100 },
  };

  test('renders stats, distributions and the daily table', async ({ page }) => {
    await mock(page, '/api/admin/analytics/dashboard', dashboard);
    await page.goto('/admin/analytics');
    const stats = page.getByTestId('analytics-stats');
    await expect(stats).toContainText('1,200');
    await expect(stats).toContainText('5,400');
    await expect(page.getByRole('list', { name: 'Platforms' })).toContainText('android');
    await expect(page.getByRole('table', { name: 'Daily installs and uninstalls' }).getByRole('row')).toHaveCount(3);
  });

  test('survives missing fields and shows the empty state', async ({ page, pageErrors }) => {
    await mock(page, '/api/admin/analytics/dashboard', { summary: { platforms: [], countries: null } });
    await page.goto('/admin/analytics');
    await expect(page.getByTestId('empty-state')).toContainText('No app analytics for this period');
    await expect(page.getByTestId('analytics-stats')).toContainText('—');
    expect(pageErrors).toEqual([]);
  });

  test('shows an error state', async ({ page }) => {
    await mock(page, '/api/admin/analytics/dashboard', { message: 'Failed to get analytics dashboard' }, { status: 500 });
    await page.goto('/admin/analytics');
    await expect(page.getByTestId('error-state')).toContainText('Could not load analytics', { timeout: 15_000 });
  });

  test('"All time" and custom ranges send valid parameters', async ({ page }) => {
    await mock(page, '/api/admin/analytics/dashboard', dashboard);
    await page.goto('/admin/analytics');
    await expect(page.getByTestId('analytics-stats')).toContainText('1,200');

    const allTime = page.waitForRequest((req) => isApi(req, 'GET', '/api/admin/analytics/dashboard') && new URL(req.url()).searchParams.get('days') === '3650');
    await page.getByLabel('Quick select').selectOption({ label: 'All time' });
    await allTime;

    await page.getByLabel('Start date').fill('2026-09-01');
    const ranged = page.waitForRequest((req) => isApi(req, 'GET', '/api/admin/analytics/dashboard') && new URL(req.url()).searchParams.get('end_date') === '2026-09-15');
    await page.getByLabel('End date').fill('2026-09-15');
    expect(new URL((await ranged).url()).searchParams.get('start_date')).toBe('2026-09-01');
  });
});

// ---------------------------------------------------------------------------
test.describe('/admin/monitoring', () => {
  const comprehensive = {
    status: 'healthy', timestamp: '2026-09-24T10:00:00Z', service: 'API', version: '1.0.0', critical_issues: 0,
    checks: {
      database: { status: 'healthy', response_time_ms: 12.5, connection: 'active' },
      storage: { status: 'healthy', response_time_ms: 3, writable: true },
      memory: { status: 'healthy', current_usage_mb: 48, peak_usage_mb: 64, limit: '256M' },
      disk_space: { status: 'warning', usage_percent: 85, free_space_gb: 15, total_space_gb: 100 },
      database_performance: { status: 'healthy', records: { users: 3, courses: 1, posts: 20, workflows: 7 } },
    },
  };
  const queue = { status: 'warning', queue_worker: { running: false, process: null }, scheduler: { running: true, process: 'x' }, pending_emails: 4, jobs_in_queue: 2, n8n_config_active: true, issues: ['Queue worker is not running'], instructions: [{ service: 'Queue Worker', command: 'php artisan queue:work', verify: 'ps aux' }] };

  async function mockHealth(page: Page, overrides: Record<string, { body: unknown; status?: number }> = {}) {
    const defaults: Record<string, { body: unknown; status?: number }> = {
      '/api/health': { body: { status: 'healthy', timestamp: '2026-09-24T10:00:00Z' } },
      '/api/health/comprehensive': { body: comprehensive },
      '/api/health/database': { body: { status: 'healthy', connection: 'active' } },
      '/api/health/storage': { body: { status: 'healthy', writable: true } },
      '/api/health/queue': { body: queue },
      ...overrides,
    };
    for (const [path, { body, status }] of Object.entries(defaults)) await mock(page, path, body, { status });
  }

  test('renders all health checks', async ({ page }) => {
    await mockHealth(page);
    await page.goto('/admin/monitoring');
    await expect(page.getByTestId('overall-status')).toContainText('Database');
    await expect(page.getByText('48 MB')).toBeVisible();
    await expect(page.getByText('85%')).toBeVisible();
    await expect(page.getByTestId('db-records')).toContainText('20');
    await expect(page.getByText('Queue worker is not running')).toBeVisible();
    await expect(page.getByRole('link', { name: /Basic health/ })).toHaveAttribute('target', '_blank');
  });

  test('still shows data when a check answers 503 with a report', async ({ page }) => {
    await mockHealth(page, {
      '/api/health/comprehensive': { status: 503, body: { ...comprehensive, status: 'critical', critical_issues: 2, checks: { database: { status: 'unhealthy', error: 'Connection refused' } } } },
    });
    await page.goto('/admin/monitoring');
    await expect(page.getByRole('alert').filter({ hasText: '2 critical issues detected' })).toBeVisible();
    await expect(page.getByText('Connection refused')).toBeVisible();
  });

  test('survives missing fields', async ({ page, pageErrors }) => {
    await mockHealth(page, { '/api/health/comprehensive': { body: { status: 'healthy' } }, '/api/health/queue': { body: { status: 'ok' } } });
    await page.goto('/admin/monitoring');
    await expect(page.getByRole('heading', { name: 'Memory' })).toBeVisible();
    await expect(page.getByText('Queue & email system')).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test('shows an error state when no endpoint responds', async ({ page }) => {
    await page.route((url) => url.pathname.startsWith('/api/health'), (route) => route.abort());
    await page.goto('/admin/monitoring');
    await expect(page.getByTestId('error-state')).toContainText('Could not reach the health endpoints');
  });
});

// ---------------------------------------------------------------------------
test.describe('Users & community pages on mobile @mobile', () => {
  const paths = ['/admin/issues', '/admin/issue-categories', '/admin/user-management', '/admin/users', '/admin/user-groups', '/admin/user-activities', '/admin/analytics', '/admin/monitoring'];

  for (const path of paths) {
    test(`${path} has no horizontal page overflow`, async ({ page, isMobile }) => {
      test.skip(!isMobile, 'mobile only');
      await mock(page, '/api/admin/user-management', paginated(users), { method: 'GET' });
      await mock(page, '/api/admin/users', users, { method: 'GET' });
      await page.goto(path);
      await expect(page.locator('#admin-main h1')).toBeVisible();
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, 'page must not scroll horizontally').toBeLessThanOrEqual(0);
    });
  }
});
