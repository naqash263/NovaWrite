# SEO Analysis & Implementation: naqashthaheem.com (September 2026)

Scope: repositioning the site as **Technical Project Manager | AI Automation, SEO & Business Systems Specialist**, a technical SEO audit of the React SPA, keyword-to-page mapping, implementation, and automated SEO QA with Playwright.

> **Data note.** The Semrush API returned `API UNITS BALANCE IS ZERO` after two small requests, and the sandbox network policy blocks the live domain. Only the four volumes below come from Semrush. Everything else in the keyword map is intent-based and marked **validate**. Nothing here is estimated or invented.

## 1. Semrush data retrieved (database: UAE / `ae`)

| Keyword | Monthly volume | Keyword difficulty | Takeaway |
|---|---:|---:|---|
| zoho crm | 9,900 | 62 | Large UAE demand around Zoho. Target long-tail "Zoho CRM implementation / consultant UAE" on the CRM page and in blog posts. |
| ai automation | 480 | 57 | Competitive head term. Rank through the AI & Automation service page plus supporting articles. |
| seo consultant dubai | 480 | 46 | Achievable commercial term, targeted by `/services/seo-organic-growth`. |
| technical project manager | 30 | 0 | Low volume but no competition and exact positioning. Owns the homepage and the PM service page. |

## 2. Technical audit findings (before → after)

| # | Severity | Finding | Fix | Verified by |
|---|---|---|---|---|
| 1 | High | **Hidden keyword block**: `injectAISearchOptimizations()` appended a `display:none` div of keywords to the homepage. Hidden text violates Google spam policies. | Removed from the homepage (the rewritten page no longer calls it). | `home.spec.ts` |
| 2 | High | **robots.txt groups**: separate `User-agent: Googlebot / Allow: /` groups meant Googlebot and Bingbot ignored every `Disallow` (e.g. `/admin/`, `/login`). | Single `User-agent: *` group, `/search` disallowed, `/api/storage/` explicitly allowed for images. | `seo.spec.ts` › robots.txt |
| 3 | High | **Structured data leaked across SPA routes**: JSON-LD injected without cleanup, so Person/FAQ schemas stacked up on later pages. | `useSEO({ jsonLd })` owns page schemas, clears leftovers, and cleans up on unmount. | `seo.spec.ts` › no leak |
| 4 | High | **Default OG image 404**: `/images/og-default.jpg` and `/images/projects-og.jpg` did not exist. | Generated `/images/og-default.png` (1200×630) via `npm run og:image`. | `seo.spec.ts` › OG image |
| 5 | Medium | **Title/description length**: homepage title 127 chars, description ~370 chars, 40-term keywords meta (keyword stuffing). | All marketing titles are 30–62 chars and descriptions 110–160, unique per page. | `seo.spec.ts` › on-page |
| 6 | Medium | **Sitemap vs robots conflict**: sitemap listed `/login` and `/register`, which robots.txt blocks. | Removed; added `/services`, 6 service pages, `/case-studies`, 9 case studies. Cache key bumped. | PHP lint |
| 7 | Medium | **Soft 404s**: unknown routes returned the SPA shell with an indexable 404 page. | `NotFound` sets `robots: noindex, follow`; unknown service/case-study slugs render it. The robots tag resets on the next page. | `services/case-studies/seo` specs |
| 8 | Medium | **Twitter tags used `property=`** in `index.html` while the app sets `name=`, producing duplicates. | Static tags use `name="twitter:*"`. | `seo.spec.ts` › raw HTML |
| 9 | Medium | **Homepage canonical** could lose its trailing slash when the origin was `http`. | Canonical normalised via `URL` pathname. | `seo.spec.ts` |
| 10 | Medium | **Unverified claims** ("100+ Projects", "50+ AI Workflows") in the banner, hero and schema. | Removed; outcomes are stated qualitatively until evidence exists. | `home.spec.ts` |
| 11 | Low | Non-JS crawlers saw an outdated title ("Systems Analyst") and no links. | New static title/description/OG, baseline Person + WebSite JSON-LD, `<noscript>` nav to all money pages. **No static canonical** (it would point every route at `/`). | `seo.spec.ts` › raw HTML |
| 12 | Low | Footer "Services" items were plain text, not links; no crawlable path to service pages. | Footer and header link every service and featured case study. | `navigation.spec.ts` |
| 13 | Low | Accessibility/SEO hygiene: header nav was hidden between 640–1024px, there was no skip link, and some heading levels were skipped. | Mobile menu below `lg`, skip link, single H1 and no skipped heading levels on every marketing page. | `seo.spec.ts`, `navigation.spec.ts` |

## 3. Keyword → page map

| URL | Primary intent | Primary keyword | Secondary keywords |
|---|---|---|---|
| `/` | Navigational / commercial | technical project manager UAE | AI automation consultant, n8n automation, CRM implementation, technical SEO, QA automation |
| `/about` | Navigational | Naqash Thaheem | technical project manager UAE, AI automation specialist |
| `/services` | Commercial | technical project management services | AI automation services, SEO services UAE |
| `/services/technical-project-management` | Transactional | technical project manager UAE | IT project management, UAT management (**validate**) |
| `/services/ai-automation` | Transactional | AI automation consultant | ai automation (480, KD 57), n8n expert, WhatsApp AI agent, business process automation (**validate**) |
| `/services/seo-organic-growth` | Transactional | seo consultant dubai (480, KD 46) | technical SEO consultant, SEO audit UAE, keyword research services |
| `/services/crm-business-systems` | Transactional | Zoho CRM consultant UAE | zoho crm (9,900, KD 62), HubSpot implementation, CRM implementation UAE |
| `/services/qa-test-automation` | Transactional | QA automation services | Playwright testing, Selenium automation, software testing company Dubai (**validate**) |
| `/services/saas-product-development` | Commercial | SaaS product consulting | SaaS product development, release validation |
| `/case-studies/*` (9) | Informational / commercial | Project-specific long tail (e.g. "AI villa booking WhatsApp assistant", "AI talent matching Zoho CRM") | See `seoTitle` / `keywords` in `frontend/src/data/caseStudies.ts` |

## 4. Structured data

- Linked entities with stable `@id`s: `#person`, `#website`, `#business`.
- `/`: Person, WebSite, ProfessionalService (with an OfferCatalog of the 6 services), FAQPage.
- `/services/*`: Service, BreadcrumbList, FAQPage.
- `/case-studies/*`: Article, BreadcrumbList. `/case-studies` and `/services`: ItemList + BreadcrumbList.

## 5. Automated SEO QA

`cd frontend && npm run test:e2e:build` builds the production bundle and runs 54 Playwright tests (desktop plus Pixel 7) against `vite preview` with the API mocked. They also run in CI on every PR (`.github/workflows/e2e.yml`). Coverage:

- Title/description length and uniqueness, one canonical per page, robots, OG/Twitter tags, single H1, heading order, JSON-LD types, image alt, link names: every marketing page.
- Internal link integrity across all marketing pages, JSON-LD leak test, noindex 404 reset.
- Raw HTML shell, robots.txt, llm.txt/llms.txt, OG image dimensions.
- Feature QA: navigation, dropdowns, search, mobile menu, booking modal, CTAs, services, case studies, and horizontal-overflow checks at mobile width.

## 6. Recommended next steps (priority order)

1. **Validate keyword volumes** once Semrush API units are available (the web-app limit does not cover API units): run `phrase_these` for the **validate** rows above in `ae`, `us`, `de` and `ch`.
2. **Submit the sitemap** in Google Search Console and request indexing for `/services/*` and `/case-studies/*`.
3. **Prerender marketing routes** (e.g. `vite-plugin-prerender` or a Laravel view per route) so titles, descriptions and canonicals exist in the raw HTML without JavaScript. This is the biggest remaining technical gap for a client-rendered SPA.
4. **Content cluster** around high-demand terms: "Zoho CRM implementation checklist (UAE)", "Zoho vs HubSpot for UAE SMEs", "n8n vs Zapier vs Make", "WhatsApp Business API options in the UAE", "What a technical SEO audit includes". Link each post to its service page.
5. **Case-study evidence**: add screenshots and verified metrics (Search Console, analytics, client-approved numbers) where confidentiality permits.
6. **Performance**: `vendor` chunk is ~1.7 MB (PDF/DOCX libraries used by tools). Lazy-load those per tool route to improve Core Web Vitals on marketing pages.
7. **Deploy workflow** uses Node 18, but Vite 7 requires Node ≥ 20.19. Upgrade `deploy.yml` to Node 20/22.
