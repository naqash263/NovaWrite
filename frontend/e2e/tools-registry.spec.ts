// Registry-wide checks for every free tool: routing, rendering, SEO/AEO/GEO content
// quality, structured data and internal links. Functional behaviour of each tool is
// covered by the batch specs in ./tools/.
import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from './fixtures';
import { allTools, hubs, toolPath, getToolBySlug, type ToolHub } from '../src/data/tools';

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

test.describe('Tool registry content', () => {
  test('every tool has complete, unique SEO / AEO / GEO content', () => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();
    const problems: string[] = [];
    for (const t of allTools) {
      const id = `${t.hub}/${t.slug}`;
      if (t.seoTitle.length < 30 || t.seoTitle.length > 60) problems.push(`${id}: seoTitle ${t.seoTitle.length} chars`);
      if (t.seoDescription.length < 110 || t.seoDescription.length > 160) problems.push(`${id}: seoDescription ${t.seoDescription.length} chars`);
      if (titles.has(t.seoTitle)) problems.push(`${id}: duplicate title`);
      if (descriptions.has(t.seoDescription)) problems.push(`${id}: duplicate description`);
      titles.add(t.seoTitle);
      descriptions.add(t.seoDescription);
      if (words(t.answer) < 40 || words(t.answer) > 70) problems.push(`${id}: answer ${words(t.answer)} words (40-70)`);
      if (t.howTo.length < 3 || t.howTo.length > 6) problems.push(`${id}: howTo ${t.howTo.length} steps (3-6)`);
      if (t.features.length < 4) problems.push(`${id}: ${t.features.length} features (>=4)`);
      if (t.faqs.length < 3 || t.faqs.length > 5) problems.push(`${id}: ${t.faqs.length} faqs (3-5)`);
      if (t.related.length < 3) problems.push(`${id}: ${t.related.length} related (>=3)`);
      for (const r of t.related) if (!getToolBySlug(r) || r === t.slug) problems.push(`${id}: bad related "${r}"`);
      if (t.comparison.competitors.length < 2) problems.push(`${id}: <2 competitors reviewed`);
      if (t.comparison.commonFeatures.length < 3) problems.push(`${id}: <3 competitor features listed`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(t.reviewed)) problems.push(`${id}: bad reviewed date`);
    }
    expect(problems, problems.join('\n')).toEqual([]);
  });

  test('slugs are unique per hub and URL-safe', () => {
    const seen = new Set<string>();
    for (const t of allTools) {
      expect(t.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(seen.has(toolPath(t)), toolPath(t)).toBe(false);
      seen.add(toolPath(t));
    }
  });

  test('sitemap lists every hub and tool URL', () => {
    const php = fs.readFileSync(path.resolve(process.cwd(), '../backend/app/Http/Controllers/Api/SitemapController.php'), 'utf8');
    for (const hub of Object.keys(hubs)) expect(php).toContain(`'${hub}' => [`);
    const missing = allTools.filter((t) => !php.includes(`'${t.slug}',`)).map((t) => t.slug);
    expect(missing).toEqual([]);
  });
});

test.describe('Tool hubs', () => {
  for (const hub of Object.keys(hubs) as ToolHub[]) {
    test(`${hub} hub lists every tool with crawlable links`, async ({ page }) => {
      await page.goto(`/resources/${hub}`);
      await expect(page.locator('h1')).toHaveText(hubs[hub].h1);
      const tools = allTools.filter((t) => t.hub === hub);
      await expect(page.getByTestId('tool-card')).toHaveCount(tools.length);
      for (const t of tools) await expect(page.locator(`main a[href="${toolPath(t)}"]`).first()).toBeVisible();
      await page.locator('#hub-search').fill(tools[0].name);
      await expect(page.getByTestId('tool-card').first()).toContainText(tools[0].name);
    });
  }

  test('legacy ?tool= URLs redirect to the tool page', async ({ page }) => {
    for (const t of [allTools.find((x) => x.hub === 'utility-tools')!, allTools.find((x) => x.hub === 'conversion-tools')!, allTools.find((x) => x.hub === 'ai-tools')!]) {
      await page.goto(`/resources/${t.hub}?tool=${t.legacyId}`);
      await expect(page).toHaveURL(new RegExp(`${toolPath(t)}$`));
      await expect(page.locator('h1')).toHaveText(t.name);
    }
  });

  test('resources page links to all hubs and career tools', async ({ page }) => {
    await page.goto('/resources');
    await expect(page.getByTestId('hub-card')).toHaveCount(3);
    await expect(page.getByTestId('career-card')).toHaveCount(8);
    const html = await page.content();
    expect(html).not.toContain('?tool=');
    expect(html).not.toContain('aggregateRating');
  });
});

test.describe('Every tool page', () => {
  for (const tool of allTools) {
    test(`${tool.hub}/${tool.slug} renders with complete SEO`, async ({ page, pageErrors }) => {
      const url = toolPath(tool);
      await page.goto(url);
      await expect(page.locator('h1')).toHaveText(tool.name);
      await expect(page.locator('h1')).toHaveCount(1);
      const root = page.getByTestId('tool-root');
      await expect(root).toBeVisible();
      // Tool finished lazy-loading and did not crash.
      await expect(root.locator('[role="status"]')).toHaveCount(0, { timeout: 15_000 });
      await expect(page.getByTestId('tool-error')).toHaveCount(0);
      await expect(root.locator('input:visible, textarea:visible, button:visible, select:visible, [role="button"]:visible').first()).toBeVisible();

      await expect(page).toHaveTitle(tool.seoTitle);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', tool.seoDescription);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`${url}$`));
      await expect(page.getByTestId('tool-answer')).toHaveText(tool.answer || tool.summary);

      const types = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((s) => JSON.parse(s)['@type']);
      expect(types).toEqual(expect.arrayContaining(['WebApplication', 'BreadcrumbList']));
      if (tool.faqs.length) expect(types).toContain('FAQPage');
      if (tool.howTo.length) expect(types).toContain('HowTo');
      expect(types).not.toContain('AggregateRating');
      expect(await page.content()).not.toContain('aggregateRating');

      // Sidebar links every sibling tool (crawlable internal links).
      const siblings = allTools.filter((t) => t.hub === tool.hub);
      await expect(page.getByRole('navigation', { name: `${hubs[tool.hub].name} navigation` }).getByRole('link')).toHaveCount(siblings.length);

      expect(pageErrors, 'uncaught page errors').toEqual([]);
    });
  }
});
