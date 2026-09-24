import { test, expect, marketingRoutes } from './fixtures';

// Runs in both projects; the @mobile tag opts it into the Pixel 7 project as well.
test.describe('Layout health @mobile', () => {
  test('marketing pages have no horizontal overflow or runtime errors', async ({ page, pageErrors }) => {
    test.setTimeout(120_000);
    for (const route of await marketingRoutes()) {
      await page.goto(route);
      await expect(page.locator('h1')).toHaveCount(1);
      const overflowing = await page.evaluate(() => {
        const width = document.documentElement.clientWidth;
        return [...document.querySelectorAll('main *, header *, footer *')]
          .filter((el) => !el.closest('[aria-hidden="true"]'))
          .filter((el) => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.right > width + 1;
          })
          .slice(0, 5)
          .map((el) => `${el.tagName.toLowerCase()}.${(el.getAttribute('class') || '').split(' ').slice(0, 3).join('.')}`);
      });
      expect(overflowing, `[${route}] elements wider than the viewport`).toEqual([]);
    }
    expect(pageErrors, 'uncaught page errors').toEqual([]);
  });

  test('hero CTAs are visible without scrolling', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Explore projects' }).first()).toBeInViewport();
  });
});
