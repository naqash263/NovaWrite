import { test, expect, marketingRoutes } from './fixtures';
import type { Page } from '@playwright/test';

type SeoSnapshot = {
  title: string;
  description: string | null;
  canonical: string[];
  robots: string | null;
  og: Record<string, string | null>;
  twitterCard: string | null;
  h1Count: number;
  headingLevels: number[];
  jsonLd: string[];
  imagesWithoutAlt: number;
  unnamedLinks: string[];
};

async function snapshot(page: Page): Promise<SeoSnapshot> {
  return page.evaluate(() => {
    const meta = (selector: string) => document.querySelector(selector)?.getAttribute('content') ?? null;
    return {
      title: document.title,
      description: meta('meta[name="description"]'),
      canonical: [...document.querySelectorAll('link[rel="canonical"]')].map((l) => l.getAttribute('href') || ''),
      robots: meta('meta[name="robots"]'),
      og: {
        title: meta('meta[property="og:title"]'),
        description: meta('meta[property="og:description"]'),
        image: meta('meta[property="og:image"]'),
        url: meta('meta[property="og:url"]'),
        type: meta('meta[property="og:type"]'),
      },
      twitterCard: meta('meta[name="twitter:card"]'),
      h1Count: document.querySelectorAll('h1').length,
      headingLevels: [...document.querySelectorAll('main h1, main h2, main h3, main h4')]
        .filter((h) => (h as HTMLElement).offsetParent !== null || h.closest('details'))
        .map((h) => Number(h.tagName[1])),
      jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent || ''),
      imagesWithoutAlt: [...document.querySelectorAll('img')].filter((img) => !img.hasAttribute('alt')).length,
      unnamedLinks: [...document.querySelectorAll('a[href]')]
        .filter((a) => !(a.textContent || '').trim() && !a.getAttribute('aria-label') && !a.querySelector('img[alt]:not([alt=""])'))
        .map((a) => a.getAttribute('href') || ''),
    };
  });
}

function schemaTypes(blocks: string[]) {
  return blocks.flatMap((raw) => {
    const parsed = JSON.parse(raw);
    const nodes = parsed['@graph'] ?? [parsed];
    return nodes.map((n: { '@type': string }) => n['@type']);
  });
}

test.describe('On-page SEO for every marketing page', () => {
  test('titles, descriptions, canonicals, social tags, headings and schema are valid', async ({ page, baseURL }) => {
    test.setTimeout(120_000);
    const routes = await marketingRoutes();
    const titles = new Map<string, string>();
    const descriptions = new Map<string, string>();

    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('h1')).toHaveCount(1);
      await page.waitForFunction(() => document.querySelectorAll('script[data-page-jsonld]').length > 0);
      const seo = await snapshot(page);
      const where = `[${route}]`;

      expect(seo.title.length, `${where} title length: "${seo.title}"`).toBeGreaterThanOrEqual(30);
      expect(seo.title.length, `${where} title length: "${seo.title}"`).toBeLessThanOrEqual(62);
      expect(titles.has(seo.title), `${where} duplicate title with ${titles.get(seo.title)}`).toBe(false);
      titles.set(seo.title, route);

      expect(seo.description, `${where} meta description`).toBeTruthy();
      expect(seo.description!.length, `${where} description: "${seo.description}"`).toBeGreaterThanOrEqual(110);
      expect(seo.description!.length, `${where} description: "${seo.description}"`).toBeLessThanOrEqual(160);
      expect(descriptions.has(seo.description!), `${where} duplicate description`).toBe(false);
      descriptions.set(seo.description!, route);

      const expectedCanonical = `${new URL(baseURL!).origin}${route}`.replace(/^http:/, 'https:');
      expect(seo.canonical, `${where} exactly one canonical`).toEqual([expectedCanonical]);
      expect(seo.robots, `${where} robots`).toMatch(/^index, follow/);

      expect(seo.og.title, `${where} og:title`).toBe(seo.title);
      expect(seo.og.description, `${where} og:description`).toBe(seo.description);
      expect(seo.og.image, `${where} og:image absolute`).toMatch(/^https?:\/\/.+\.(png|jpe?g|webp)$/);
      expect(seo.og.url, `${where} og:url`).toBe(expectedCanonical);
      expect(seo.twitterCard, `${where} twitter:card`).toBe('summary_large_image');

      expect(seo.h1Count, `${where} single h1`).toBe(1);
      seo.headingLevels.forEach((level, i) => {
        const prev = i === 0 ? 1 : seo.headingLevels[i - 1];
        expect(level - prev, `${where} heading level skip h${prev} -> h${level}`).toBeLessThanOrEqual(1);
      });

      expect(seo.jsonLd.length, `${where} JSON-LD present`).toBeGreaterThan(0);
      const types = schemaTypes(seo.jsonLd);
      if (route === '/') {
        expect(types).toEqual(expect.arrayContaining(['Person', 'WebSite', 'ProfessionalService', 'FAQPage']));
      } else {
        expect(types, `${where} breadcrumb schema`).toContain('BreadcrumbList');
      }
      if (route.startsWith('/services/')) expect(types).toEqual(expect.arrayContaining(['Service', 'FAQPage']));
      if (route.startsWith('/case-studies/')) expect(types).toContain('Article');

      expect(seo.imagesWithoutAlt, `${where} images without alt`).toBe(0);
      expect(seo.unnamedLinks, `${where} links without accessible name`).toEqual([]);
    }
  });

  test('structured data does not leak between client-side navigations', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => document.querySelectorAll('script[data-page-jsonld]').length > 0);
    expect(schemaTypes(await page.locator('script[type="application/ld+json"]').allTextContents())).toContain('FAQPage');

    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'About', exact: true }).click();
    await expect(page.locator('h1')).toContainText('Business + Project Management');
    const aboutTypes = schemaTypes(await page.locator('script[type="application/ld+json"]').allTextContents());
    expect(aboutTypes).not.toContain('FAQPage');
    expect(aboutTypes.filter((t) => t === 'Person')).toHaveLength(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  });

  test('robots meta resets after visiting a noindex 404', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await page.getByRole('link', { name: 'View services' }).click();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^index, follow/);
  });

  test('every internal link on marketing pages resolves to a real page', async ({ page }) => {
    test.setTimeout(180_000);
    const routes = await marketingRoutes();
    const links = new Set<string>();
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('h1')).toHaveCount(1);
      for (const href of await page.locator('a[href^="/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!))) {
        links.add(href.split('#')[0].split('?')[0] || '/');
      }
    }
    for (const href of links) {
      await page.goto(href);
      await expect(page.locator('main'), `link ${href} renders content`).not.toBeEmpty();
      await expect(page.getByRole('heading', { level: 1, name: '404', exact: true }), `link ${href} is not a 404`).toHaveCount(0);
    }
  });
});

test.describe('Crawler-facing static files', () => {
  test('raw HTML shell carries SEO essentials without JavaScript', async ({ request }) => {
    const html = await (await request.get('/about')).text();
    expect(html).toContain('<title>Naqash Thaheem | Technical Project Manager &amp; AI Automation</title>');
    expect(html).toMatch(/<meta name="description" content="[^"]{110,160}"/);
    expect(html).toContain('"@type": "Person"');
    expect(html).toContain('<noscript>');
    expect(html).toContain('href="/services/seo-organic-growth"');
    // A static canonical would point every route at "/" before JS runs.
    expect(html).not.toContain('rel="canonical"');
    expect(html).not.toMatch(/property="twitter:/);
  });

  test('robots.txt uses one group, blocks private areas and lists the sitemap', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.ok()).toBe(true);
    const body = await res.text();
    const agents = body.split('\n').filter((l) => /^user-agent:/i.test(l.trim()));
    expect(agents).toEqual(['User-agent: *']);
    for (const path of ['/admin/', '/api/', '/login', '/register', '/auth/']) {
      expect(body).toContain(`Disallow: ${path}`);
    }
    expect(body).not.toMatch(/^Disallow:\s*\/services/m);
    expect(body).not.toMatch(/^Disallow:\s*\/case-studies/m);
    expect(body).toContain('Sitemap: https://naqashthaheem.com/sitemap-ntw2024.xml');
  });

  test('llm.txt and llms.txt describe services and case studies', async ({ request }) => {
    for (const file of ['/llm.txt', '/llms.txt']) {
      const body = await (await request.get(file)).text();
      expect(body).toContain('# Naqash Thaheem');
      expect(body).toContain('https://naqashthaheem.com/services/seo-organic-growth');
      expect(body).toContain('https://naqashthaheem.com/case-studies/cloudpos4u-restaurant-pos-saas');
    }
  });

  test('default Open Graph image exists at 1200x630', async ({ page, request }) => {
    const res = await request.get('/images/og-default.png');
    expect(res.ok()).toBe(true);
    expect(res.headers()['content-type']).toContain('image/png');
    await page.goto('/images/og-default.png');
    const size = await page.locator('img').evaluate((img: HTMLImageElement) => [img.naturalWidth, img.naturalHeight]);
    expect(size).toEqual([1200, 630]);
  });
});
