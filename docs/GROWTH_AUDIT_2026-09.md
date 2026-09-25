# naqashthaheem.com: Growth, Leads and Ad Revenue Audit (September 2026)

This audit looks at the site from four angles: SEO, sales, marketing and analytics. It covers:
- a code-level review of the live build (commit `dfb15a9`)
- market research on search demand, AdSense RPMs, consulting rates and lead benchmarks
- the fixes shipped in the PR that adds this document

**Data limits.** This environment had no access to Google Analytics, Search Console or AdSense. The Semrush account had no API units left, and the live site and competitor sites were blocked by the network policy. Traffic figures below are therefore **benchmarks and estimates, marked (est.)**, not the site's own numbers. Section 7 lists the numbers to pull first.

## 1. Executive summary

**Leads are the revenue engine. Ads are a side income.**

| | Value |
|---|---|
| Qualified consulting lead | about **$300–600** (est.)¹ |
| AdSense earnings at 10,000 pageviews/month | about **$20–80 a month** (est.)² |
| Pageviews needed to earn one lead's value from ads | roughly 50,000–150,000 |

Before this PR the site was built for neither goal:
1. **The ~60 free tools had no path to the services.** There was no CTA, no link to /services and no email capture.
2. **Nothing was measured.** GA4 sent no page views after the first page of a visit, and no lead, tool or CTA events.
3. **Leads could be lost:**
   - Consultation bookings were not saved anywhere; they were only forwarded to n8n and returned an error if n8n was down.
   - Guests could not attach files on the contact form.
   - No admin page showed enquiries.
4. **Ads were not compliant for EEA/UK visitors:**
   - There was no consent setup.
   - The privacy policy did not mention advertising.
   - Ad units sat directly under tool buttons, which risks accidental clicks.
   - Three ad units on the Contact page pulled visitors away from the lead form.
5. **SEO effort goes to keywords the site cannot win.** Generic keywords like "json formatter", "compress pdf", "loan calculator" and "paraphrasing tool" are owned by sites with 2M to 188M visits a month.³ A 38-tool site with almost the same tool list got **24 organic visitors in a quarter**.⁴

The PR fixes 1–4 in code. Section 5 is the plan for 5: niche UAE, Pakistan and n8n tools that can rank and that attract buyers.

¹ $3,000 average project × 10–20% close rate; n8n consultants charge $40–235/hr, or $1,800–26,000 per project ([rate card](https://betonai.net/ai-automation-rate-card-2026-what-to-charge-for-n8n-make-and-zapier-builds-real-rates-from-54-operators/), [Upwork](https://www.upwork.com/hire/n8n-experts/)).
² Page RPM is about $1–3 for India/Pakistan traffic and $8–11 for the US/UK; developer audiences block 45–65% of ads ([RPM benchmarks](https://www.techconda.com/2026/02/adsense-rpm-benchmarks.html), [by country](https://adstimate.com/blog/adsense-rpm-by-country.html), [ad blockers](https://backlinko.com/ad-blockers-users)).
³ jsonformatter.org 2.65M/month; iLovePDF 188M organic; calculator.net 56M; QuillBot 51–61M.
⁴ [dev.to case](https://dev.to/razi_kallayi/my-site-has-38-free-tools-and-got-24-organic-visitors-last-quarter-1li8).

## 2. Scorecard

| Area | Before | After this PR | Still to do |
|---|---|---|---|
| **Tool → lead path** | None | Contextual service CTA on every developer, document, AI, text, image and finance tool (see §3). It opens the contact form pre-filled and tagged with the tool. | Lead magnets and scored audits (§5) |
| **Lead capture** | Bookings only forwarded to n8n, returned 503 if n8n was down; guest uploads failed; no inbox | Bookings saved first; guests told to paste a link; **Admin → Leads** inbox with sources, read state, delete, and subscribers + CSV | Auto-reply email template (§6) |
| **Spam / abuse** | No rate limits (the contact AI analysis calls a paid API) | Per-IP limits: contact 5/min, analyze 15/min, bookings 5/min, downloads 20/min | Add a honeypot field if spam appears |
| **Measurement** | GA4 base tag only | See below | Mark key events in GA4 (§6) |
| **Consent (EEA/UK/CH)** | None; cookie policy described a banner that did not exist | Consent Mode v2 defaults to denied for those regions; policy text corrected | **Turn on Google's CMP in AdSense (§6)** |
| **Ad placement** | See below | See below | Anchor/auto ads trial (§5.4) |
| **Ad policy text** | No advertising disclosure | Google-required disclosure and opt-out links in the privacy policy | — |
| **AdSense debug endpoint** | `GET /api/adsense-settings/debug` was public | Admin-only | — |
| **Marketing consent** | Logged-in users auto-opted in; emails written to logs | Explicit opt-in for everyone; emails no longer logged | — |

**Measurement changes:**
- A page_view is now sent on every route change, with the real page title. Admin pages are excluded.
- `generate_lead` fires on contact form, booking and workflow-download opt-ins.
- `tool_use` fires on the first button press in a tool.
- `cta_click` fires on the tool service CTA.
- `file_download` fires on workflow downloads.

**Ad placement changes:**
- **Before:** 2 units per tool page, one of them directly under the tool buttons; 3 units on Contact; 7 of the 8 career tools had none; content units caused layout shift; an ad retry timer leaked.
- **After:** tool pages have top, bottom and in-content units, with 40px clearance from the tool.
  - The CTA comes before the ads.
  - Contact has no ads.
  - Career tools get two units.
  - 250px is reserved for each unit, and the space collapses when a slot is unfilled.
  - The timer leak is fixed.

## 3. How the tool → service CTA maps

| Tool category | CTA heading | Links to |
|---|---|---|
| Developer (JSON, JWT, SQL, regex…) | "Need this inside a real workflow?" | /services/ai-automation |
| Documents (PDF, Word, Excel) | "Processing documents every day?" | /services/ai-automation |
| Text, images, security, technical | "Doing this by hand every week?" | /services/ai-automation |
| AI writing / analysis | "Want AI like this built into your business?" | /services/ai-automation |
| Finance calculators | "Still running the numbers in spreadsheets?" | /services/crm-business-systems |
| Everyday, health, measurement | No CTA (low buying intent) | — |

The primary button opens `/contact?topic=…&source=tool:<slug>`. The enquiry is saved with `source`, so **Admin → Leads → Top lead sources** shows which tools produce clients. That tells you which tools deserve more content and promotion.

## 4. Revenue model (estimates)

**Ads** (page RPM = revenue per 1,000 pageviews):

| Monthly pageviews | Mostly PK/IN traffic ($2 RPM) | Mixed Gulf/West ($8) | Finance, Gulf/West ($20) |
|---|---|---|---|
| 10,000 | $20 | $80 | $200 |
| 50,000 | $100 | $400 | $1,000 |
| 250,000 | $500 | $2,000 | $5,000 |

When to move beyond AdSense:
- At about 10,000 pageviews/month, test **Ezoic** (no minimum) or **Mediavine Journey** (1,000+ sessions).
- Apply to **Raptive** (25,000 pageviews) or **Mediavine** ($5k/yr of ad revenue) only once more than 50% of traffic is US/UK.

**Leads:**
- Portfolio and service pages typically convert 1–3% of visitors ([B2B benchmarks](https://firstpagesage.com/reports/b2b-conversion-rates-by-industry-fc/)).
- Tool-page visitors convert about 0.1–0.5% (est.).
- Scored interactive audits convert 20–30% of the people who start them ([source](https://www.convertcalculator.com/use-cases/lead-generation/)).

**Target for 90 days:** 3–6 qualified enquiries a month, with 1 closed project a month (est. $1.5k–5k). A single closed project outweighs a year of AdSense at current scale.

## 5. 90-day plan

### 5.1 Build tools that can rank and that attract buyers (Weeks 1–6)

The generic tools cannot win head terms. Build about 10 niche tools, each with a formula explanation, worked examples, cited official sources, a visible "updated" date and FAQ schema. That page format is what ChatGPT and Perplexity cite.

| Priority | Tool | Est. demand (monthly) | Why |
|---|---|---|---|
| 1 | **UAE gratuity / end-of-service calculator** (limited & unlimited contracts, 2026 rules) | 15–40K + 5–10K | No strong brand ranks; UAE traffic has high RPM; Gulf HR and business owners are service buyers |
| 2 | **Pakistan salary income tax calculator 2026-27** (+ freelancer 0.25% PSEB) | 40–100K, peaks Jun–Jul | Big, seasonal, local |
| 3 | **Cron expression generator + "n8n schedule trigger" examples** | 10–20K + long tail | crontab.guru has about 270K visits a month; the n8n angle is uncontested and leads to automation work |
| 4 | **Webhook tester / request inspector** | 5–15K | Used by the exact people who buy automation |
| 5 | UAE VAT (5%) and reverse-VAT calculator | 5–10K | Finance RPM |
| 6 | UAE corporate tax (9%) calculator | 2–5K | Finance RPM, business owners |
| 7 | cURL → n8n HTTP Request node converter | < 1K, growing | A unique, linkable asset for the n8n community |
| 8 | n8n expression / date-format tester | < 1K | Same |
| 9 | UAE net salary / annual leave salary calculators | 1–8K | Local |
| 10 | ATS resume checker for Gulf jobs | < 1K (head term 30–80K) | Career hub; a long-tail variant |

Sources: [kdroi](https://kdroi.io/analysis/json-formatter), [paktaxcalculator](https://paktaxcalculator.pk/), [crontab.guru on Semrush](https://it.semrush.com/website/crontab.guru/overview). All volumes are estimates; check them in Google Keyword Planner or Search Console before building.

**Generic tools:**
- Keep them as site features.
- After 90 days of Search Console data, add `noindex` to any with no impressions. Google's 2025 core updates demote thin, mass-produced tool pages ([summary](https://almcorp.com/blog/google-december-2025-core-update-complete-guide/)).

### 5.2 Lead magnets and scored audits (Weeks 3–8)

1. **Automation ROI calculator.**
   - Inputs: hours per task, frequency and hourly cost.
   - Output: annual cost and payback.
   - Lead capture: email for the PDF report.
   - It converts 20–30% of the people who start it and hands you a qualified sales conversation.
2. **Website SEO score**, modeled on HubSpot Website Grader, which is credited with 10M+ leads and 40K+ backlinks ([source](https://www.figuringoutwithai.com/growth/free-tool-seo-hubspot-website-grader)).
   - Reuse the site's existing Playwright SEO checks as the scoring engine.
3. **Gated n8n templates.** A lead-routing workflow and an invoice-OCR workflow, with the email required. The download flow and opt-in already exist; show the "send me updates" checkbox by default.
4. **A monthly "UAE/PK automation & AI" newsletter** to the subscriber list (Admin → Leads → Subscribers → Export CSV).

### 5.3 Distribution (ongoing)

| Channel | Action | Cadence |
|---|---|---|
| **LinkedIn** (best channel for Gulf B2B) | Short case studies with before/after screenshots and one CTA to a tool or the ROI calculator | 2–3 posts a week |
| **n8n community** | Publish free templates and aim for the Verified Creator badge; link back to the site ([creators](https://n8n.io/creators/)) | 2 templates a month |
| **Upwork** | Specialised n8n + AI agents profile; send portfolio visitors to it for trust signals | Always on |
| **Tool directories** | Product Hunt, AlternativeTo, Toolify, SaaSworthy: submit the n8n utility bundle, not generic tools | One-off |
| **Reddit / dev.to** | r/n8n, r/dubai, r/UAE, r/PakistaniTech: helpful answers linking to the relevant tool | Weekly |

### 5.4 Ads (after the consent fix)

- **Try AdSense Auto ads with anchor ads on mobile only**, for 2 weeks. Compare RPM and Core Web Vitals, and keep them only if CLS stays under 0.1.
- **Add a multiplex unit** under "Related tools" on tool pages.
- **Keep the service pages, case studies, contact page and home ad-free.** They sell the consulting business, and an ad there costs more than it earns.

## 6. Actions only you can take (in order)

1. **AdSense → Privacy & messaging.** Create a **European regulations (GDPR) message** with Google's free certified CMP and publish it.
   - Without it, EEA and UK visitors get only limited ads.
   - The privacy policy now says those visitors are asked for consent, so this makes it true.
2. **GA4 admin, three changes:**
   1. Data streams → Enhanced measurement → Page views → Advanced settings: **turn off "Page changes based on browser history events"**. The site now sends those page views itself; leaving it on double-counts.
   2. Admin → Events: mark **`generate_lead`** as a key event. Optionally also mark `cta_click` and `tool_use`.
   3. Link GA4 to **Search Console** and **AdSense**.
3. **Email templates:**
   - Seed a **`contact_form_auto_reply`** email template; the contact form calls it, but it does not exist.
   - Rewrite `contact_form` as an *admin* notification. It is sent to you, but it is written as a thank-you to the visitor.
4. **n8n booking workflow:** keep it running for instant notifications. Bookings are now saved in the database even if it fails.
5. **Booking link:** add a Calendly or cal.com link and share it with me, and I will put it in the CTA and the booking modal. It removes a round of email for Gulf buyers.
6. **Search Console:** submit the sitemap and export the Queries report after 28 days. That replaces the estimates above with real data.

## 7. KPIs to track weekly

| KPI | Where | Baseline (pull now) | 90-day target (est.) |
|---|---|---|---|
| Organic clicks | Search Console | ? | +100% |
| Tool sessions → `tool_use` rate | GA4 events | ? | > 60% |
| `cta_click` / tool sessions | GA4 | 0 (new) | 0.5–1% |
| `generate_lead` per month | GA4 + Admin → Leads | ? | 3–6 qualified |
| Top lead sources | Admin → Leads | new | Know the top 3 tools |
| Page RPM | AdSense | ? | +30% after the CMP and placement changes |
| Subscribers | Admin → Leads | ? | 100 |

## 8. Risks and follow-ups found in the audit (not changed here)

- **`frontend/public/.htaccess` could block all ads and serve an empty ads.txt.**
  - Its Content-Security-Policy does not allow Google ad domains.
  - It rewrites `/ads.txt` to a backend route that returns an empty file when the AdSense client ID is inactive.
  - The deploy overwrites the root `.htaccess`, so this is probably not live. Check the live response headers and `https://naqashthaheem.com/ads.txt` once.
- **`/api/adsense-settings/active` runs 3 queries per call with no cache.** Add `Cache::remember` for about 10 minutes.
- **Case studies have no metrics or testimonials.** Collect one or two client quotes and measured outcomes (hours saved, response time). They are the strongest conversion lever on the service pages.
- **Home hero:** the primary button is "Explore projects". Test "Book a free consultation" as the primary action.
