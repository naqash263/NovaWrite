import { test as base, expect, type Page } from '@playwright/test';

export const mockPosts = [
  {
    id: 1,
    title: 'How to Scope an n8n Automation Project',
    slug: 'how-to-scope-an-n8n-automation-project',
    excerpt: 'Start with the business process, then choose the tool.',
    published_at: '2026-09-01T09:00:00Z',
    category: { id: 1, name: 'Automation' },
    user: { name: 'Naqash Thaheem' },
  },
  {
    id: 2,
    title: 'Technical SEO Checks Worth Automating',
    slug: 'technical-seo-checks-worth-automating',
    excerpt: 'Canonical tags, structured data and broken links in CI.',
    published_at: '2026-08-20T09:00:00Z',
    category: { id: 2, name: 'SEO' },
    user: { name: 'Naqash Thaheem' },
  },
];

/** Answers every Laravel API call with deterministic fixture data. */
export async function mockApi(page: Page) {
  await page.route(/\/api\//, async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^.*\/api/, '');
    const json = (body: unknown) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

    if (path.startsWith('/storage/')) return route.fulfill({ status: 404, body: '' });
    if (path.startsWith('/home-settings')) return json({ settings: [], grouped: { text: [], image: [], boolean: [] } });
    if (path.startsWith('/posts')) return json({ data: mockPosts, meta: { current_page: 1, last_page: 1, total: mockPosts.length } });
    if (path.startsWith('/user') || path.startsWith('/auth/me')) return route.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"Unauthenticated."}' });
    return json({ data: [] });
  });
}

/** Stubs analytics/ads/fonts so tests never depend on the public internet. */
export async function stubThirdParty(page: Page) {
  await page.route('**/*', (route) => {
    const { hostname } = new URL(route.request().url());
    if (hostname === 'localhost' || hostname === '127.0.0.1') return route.fallback();
    const type = route.request().resourceType();
    if (type === 'script') return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
    if (type === 'stylesheet') return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
    return route.fulfill({ status: 204, body: '' });
  });
}

type Fixtures = { pageErrors: string[] };

export const test = base.extend<Fixtures>({
  pageErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await stubThirdParty(page);
      await mockApi(page);
      await use(errors);
    },
    { auto: true },
  ],
});

export { expect };

/** Marketing routes covered by the SEO regression checks. */
export async function marketingRoutes() {
  const { services } = await import('../src/data/services');
  const { caseStudies } = await import('../src/data/caseStudies');
  return [
    '/',
    '/about',
    '/services',
    ...services.map((s) => `/services/${s.slug}`),
    '/case-studies',
    ...caseStudies.map((c) => `/case-studies/${c.slug}`),
  ];
}
