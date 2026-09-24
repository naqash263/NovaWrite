# Tools, SEO/AEO/GEO and Admin Panel: QA & Upgrade Report (September 2026)

Scope: test every free tool and career tool one by one (function, UX/UI, accessibility, mobile), compare each against
leading competitors, make SEO/AEO/GEO production-grade, and test and upgrade the admin panel. Evidence: 476 Playwright
tests (desktop + Pixel 7) and 18 Laravel feature tests, all run locally against a production build.

## 1. Action required from you

| Priority | Action | Why |
|---|---|---|
| **Critical** | **Rotate `APP_KEY`**: generate a new key (`php artisan key:generate --show`), save it as the `STABLE_APP_KEY` repository secret (every deploy writes that secret into the server `.env`, so changing only the server would be undone), redeploy, then re-enter encrypted secrets (Gemini API keys, SMTP passwords) in the admin panel. | `GET /api/cv-ai/check-encryption` and `/api/cv-ai/debug-keys` returned `APP_KEY` to anyone, and the `database-management.yml` workflow printed that response into GitHub Actions logs. Treat the key as compromised. |
| Done | Deleted the GitHub Actions run logs of `database-management.yml` (16 runs) and `migrate-database.yml` (1 run). | They may have contained the key and database table listings. |
| High | Remove plaintext keys from the `encryption_key_backups` table (or encrypt that table with a key outside the app). | Old `APP_KEY`s are stored in plain text in the database. |
| High | Add an `ADMIN_API_TOKEN` repository secret (an admin API token). | `cv-ai/fix-keys` now requires admin auth; the workflow sends this secret. |
| Medium | Submit the sitemap in Search Console; request indexing for `/resources/*/*` tool URLs. | Tools moved from `?tool=` to clean URLs (old URLs redirect). |
| Done | `deploy.yml` now builds with Node 22 (Vite 7 needs 20.19+); the deploy script no longer prints `APP_KEY`. | |

## 2. Security fixes (backend)

| Issue | Fix | Test |
|---|---|---|
| Public endpoints exposed `APP_KEY` (`cv-ai/check-encryption`, `cv-ai/debug-keys`) | Key never returned; debug route removed | `PublicEndpointSecurityTest` |
| Public `POST /api/debug/run-migrations` ran `artisan migrate --force` | Removed | same |
| Public CV-template creation (`/test-cv-template`, `/admin/cv-templates-temp`) accepted arbitrary HTML rendered in the public CV builder (stored XSS) | Test route removed; admin route requires admin auth and records the real creator | same |
| `routes/debug.php` (DB host/name, table listings, table creation) and other `/debug/*` endpoints were public | Removed | same |
| `ApiAuth` set only the `api` guard; `auth()->id()` / `Auth::user()` / `$request->user()` returned `null` in ~80 call sites, so "cannot delete your own account" never worked | `Auth::shouldUse('api')`; token prefixes/emails no longer logged per request | `ApiAuthGuardTest`, `AdminSelfProtectionTest` |
| Admins could delete or demote their own account | Blocked in API (single and bulk) and UI | `AdminSelfProtectionTest` |
| Admin token list returned every API token in full | Listing returns last 4 characters; full token shown once at creation | Playwright + controller change |
| Frontend XSS: regex tester highlighting, markdown preview, text-to-image HTML mode, CV preview | Rendered as text / sanitised / escaped | Playwright tests per tool |
| Password generator used `Math.random` while claiming cryptographic security | `crypto.getRandomValues` without modulo bias | Playwright (forces `Math.random` to 0) |
| WebP converter, image resizer/compressor, text-to-image uploaded and stored user images while the page said "in your browser" | Fully client-side now | Playwright asserts no upload |
| Analytics page logged part of the auth token; debug panels dumped raw API responses | Removed | Playwright |

## 3. Free tools (61) — tested one by one, with competitor comparison

Every tool now has its own URL (`/resources/{hub}/{slug}`), a unique title (≤ 60 chars) and description (110–160),
an answer-first summary (40–70 words) for answer engines, how-to steps, 3–5 FAQs, related tools, a privacy statement
(browser / reference data / upload / AI), "reviewed by" details and WebApplication + HowTo + FAQPage + BreadcrumbList
schema. Fabricated `aggregateRating` markup (29 places, e.g. "4.9 from 3,200 ratings") was removed.

Competitor research, feature-gap tables, implemented gaps and backlog per tool: `docs/tools-competitor-analysis/`
(`text-images.md`, `developer.md`, `documents-finance.md`, `conversion.md`, `ai.md`, `career.md`). The same data is
stored in each tool's `comparison` field in `frontend/src/data/tools/`.

Selected correctness bugs found and fixed:

- **Finance:** tip calculator added a custom percentage as dollars; compound interest ignored compounding frequency
  for contributions; loan schedule showed only 12 payments (now full schedule + CSV + extra payments).
- **PDF:** compressor levels did nothing (now re-encodes images); splitter modes were identical; merge limit not
  enforced; rotation could reach 360°/450°.
- **Conversion:** rounded factors replaced by exact definitions; file sizes labelled KB but computed as KiB; time
  zones ignored DST and "CST" was ambiguous; dates off by one day west of UTC; currency silently showed years-old
  fallback rates as live; number bases lost precision above 2^53.
- **Developer:** JSON auto-fix corrupted URLs inside strings; Base64 broke on Unicode; UUID v1 was malformed; SQL
  Server dialect always errored; CSS/HTML formatters mangled `a:hover`, `url()` and attributes; JWT crashed on
  object claims; markdown preview created a second page H1.
- **Text & images:** fake GIF/BMP/AVIF outputs; MD5 unsupported; camelCase lost word boundaries; token counter made
  model-specific claims it did not implement; inaccessible file pickers.
- **AI:** HTML error pages crashed error handling; users' own Gemini keys were never sent; grammar checker crashed on
  object suggestions; translator swap silently did nothing in auto-detect.
- **Career:** interview prep, salary, career path and skills tools crashed on real responses or failed backend
  validation on every request; CV PDF export clipped text; Word export missing; user input unescaped in preview.

## 4. SEO / AEO / GEO

- **Prerendering for crawlers without JavaScript** (GPTBot, ClaudeBot, PerplexityBot, social previews):
  `frontend/scripts/prerender.mjs` writes static HTML for 84 pages at build time from the same data as React;
  production `.htaccess` serves it (verified on Apache 2.4). JS users get the React app with no layout shift.
- `llms.txt` / `llm.txt` generated at build time with every tool and career tool.
- Sitemap lists all tool URLs; legacy `?tool=` URLs redirect; robots disallows `/prerender/` and `/search`.
- Unique titles/descriptions, one H1, correct canonical and breadcrumbs on every marketing, hub, tool and career page
  (enforced by `e2e/seo.spec.ts`, `e2e/tools-registry.spec.ts`, `e2e/prerender.spec.ts`, `e2e/tools/career.spec.ts`).
- Thin content to expand with real detail: case studies *Lead Generation Operating System* and *Smart Tuition*.

## 5. Admin panel

- New shell: every route reachable from a grouped sidebar (6 pages were unreachable), Ctrl/⌘+K command palette,
  breadcrumbs, mobile drawer, skip link; one H1 per page.
- Shared admin UI kit (page header, cards, stats, badges, loading/empty/error states, accessible modal with focus
  trap, labelled fields, icon buttons, tables) applied to all 33 admin pages; all `window.confirm/alert/prompt`
  replaced; secrets masked.
- 12 pages crashed on empty or unexpected API payloads; all fixed. Notable functional fixes: bulk user actions called
  non-existent endpoints; Test Workflows wrote to a read-only route; SMTP/Gemini edits failed without re-entering the
  secret; Settings ignored saved values; AdSense toggles wiped unsaved edits; Email Templates rendered raw HTML
  instead of a sandboxed preview; Monitoring blanked on a 503 health report; Dashboard blanked if one metric failed.
- Auth: twelve components each ran their own auth state (the reason login needed a full page reload); now shared.
  Admin login returns to the requested page and rejects non-admins; signed-out users are redirected correctly.

## 6. Backend bugs fixed

- `/api/home-settings` failed whenever any setting existed (undefined `$request`), so homepage banner/hero settings
  never loaded.
- Email templates rendered `{John Doe}` (PHP interpolation of `"{{$key}}"`).
- `email-queue/stats`, `email-logs/stats` and five SMTP helper endpoints were shadowed by `{id}` routes.
- Excel→CSV exported only column A for sheets wider than Z.

## 7. Known issues not fixed (need a decision or production data)

- `GET/PUT /settings` and `/admin/fallback-emails` endpoints used by the admin UI do not exist (pages show an error
  state).
- `user_api_keys` columns (`requests_per_key`/`usage_count`) do not match the model (`max_requests`/`used_requests`);
  needs the production schema to reconcile.
- Interview prep backend rejects `technical` and `case-study` types (options hidden in the UI).
- Converted documents/files are never deleted from `storage/`; add a scheduled cleanup.
- AI routes have no throttle middleware; several controllers return `$e->getMessage()` in 500 responses.
- Unused backend image endpoints (`webp-converter`, `image-compressor`, `image-resizer`, `text-to-image`) and
  `WatermarkRemover.tsx` (unrouted, third-party-branded) can be deleted.
- Pre-existing failing test: `tests/Feature/FileProcessingTest` (error-message mismatch).
- Competitor sites were blocked by this environment's network policy; competitor facts come from search results
  (sources cited in each report).

## 8. How to run the tests

```bash
cd frontend && npm run test:e2e:build        # build + prerender + 489 Playwright tests
cd backend && php artisan test                # Laravel feature tests (SQLite, no production DB needed)
```
