# naqashthaheem.com: Semrush Keyword Plan (September 2026)

This plan adds live Semrush data to the growth audit (`docs/GROWTH_AUDIT_2026-09.md`). It decides which pages to build or improve next, in order.

**Data:** Semrush API, pulled 29 September 2026.
- **Databases:** UAE (`ae`) and US (`us`).
- **Volume:** monthly searches.
- **KD:** Semrush Keyword Difficulty, 0–100 (under 30 is realistic for a new domain).
- **CPC:** USD. A high CPC means advertisers pay for the click, a proxy for buyer intent and AdSense value.

## 1. Where the site stands

- Semrush has **no data for naqashthaheem.com** in any regional database: `domain_ranks` and `domain_rank` (ae) both return "nothing found".
  - The domain does not yet rank in the top 100 for enough tracked keywords to register.
  - Every opportunity below is therefore a new ranking, not an improvement.
- **Implication:** broad, high-KD tool keywords (JSON formatter, PDF to Word, QR code, image compressor) are out of reach for now. Growth has to come from specific, low-difficulty keywords where the top 10 is weak.
- **Semrush project:** the account has one project, `cloudpos4u.com` (Site Audit and Position Tracking). There is none for naqashthaheem.com. Adding one (section 6) gives position tracking and a crawl-based site audit.

## 2. Biggest opportunity: UAE employment calculators

UAE searches for gratuity, leave, overtime and settlement are large, and their difficulty is low. The top 10 includes several thin, exact-match domains that a better tool can beat.

| Keyword (ae) | Volume | KD | CPC |
|---|---:|---:|---:|
| gratuity calculator | 60,500 | 27 | 0.00 |
| gratuity calculator uae / gratuity calculation in uae | 49,500 | 36 | 2.72 |
| uae gratuity calculator | 12,100 | 26 | 2.72 |
| end of service calculator uae | 4,400 | 35 | 2.72 |
| gratuity calculator dubai | 4,400 | 32 | 2.72 |
| how to calculate gratuity in uae | 3,600 | 31 | 0.57 |
| mohre gratuity calculator | 3,600 | 36 | 0.00 |
| end of service calculator | 2,400 | 27 | 2.72 |
| dubai gratuity calculator | 1,600 | 29 | 2.72 |
| overtime calculator uae / overtime calculation in uae | 1,300 | 17 | 1.26 |
| uae gratuity calculator 2026 | 1,000 | 29 | 0.00 |
| leave salary calculator uae / leave salary calculation in uae | 880 | **9** | 1.79 |
| gratuity calculator abu dhabi | 880 | 27 | 2.72 |
| uae gratuity law | 880 | 18 | 0.54 |
| uae settlement calculator | 480 | 28 | 2.72 |
| jafza gratuity calculator | 390 | 19 | 0.00 |
| annual leave calculator uae | 320 | **9** | 0.00 |
| final settlement calculator uae | 260 | 27 | 1.63 |

**Top 10 for "gratuity calculator uae" (ae):**
1. dda.gov.ae
2. gratuitycalculatordubaiuae.ae
3. zenhr.com
4. cercli.com
5. calculategratuityuae.net
6. mohregratuitycalculator.ae
7. thegratuitycalculatoruae.ae
8. gulfnews.com
9. vertixauditing.ae
10. workforce.ae

Four of these are single-page exact-match domains. The site's gratuity tool is already more complete than they are: it has the per-band breakdown, a year-by-year schedule, unpaid leave, part-time work, sources and the DIFC/ADGM note.

**What this PR ships for the cluster:**
- **UAE Leave Salary Calculator**, new: KD 9, two 880/mo variants plus 320/mo.
- **UAE Overtime Calculator**, new: KD 17, 1,300/mo.
- **Gratuity page:**
  - keyword coverage for Dubai, Abu Dhabi, free zones, MOHRE and final settlement
  - honest FAQs (independent tool, not affiliated with MOHRE)
  - cross-links between the UAE tools

**Next in this cluster** (not built yet; ordered by KD and volume):

| Idea | Target keywords (ae) | Volume | KD |
|---|---|---:|---:|
| UAE final settlement calculator: gratuity + leave encashment + notice + unpaid salary | final settlement calculator uae, uae settlement calculator | 740 | 27–28 |
| UAE tax invoice template/generator (FTA fields, TRN, 5% VAT) | tax invoice format uae, vat invoice format uae | 760 | 9–11 |
| Zakat calculator (gold/silver nisab, cash, investments) | zakat calculator | 3,600 | 22 |
| Rent increase calculator Dubai (RERA index rules) | rent calculator dubai | 590 | 16 |
| UAE salary / hourly rate calculator | salary calculator dubai, salary calculator uae | 600 | 5–15 |

**Guides to support the calculators:** these are informational pages, good for AdSense and for internal links into the tools.

| Guide | Volume (ae) | KD |
|---|---:|---:|
| Public holidays UAE 2026 | 5,400 | 25 |
| Maternity leave in the UAE | 3,600 | 12 |
| Unemployment insurance UAE (ILOE) | 2,900 | 16 |
| Sick leave in the UAE | 1,600 | 27 |
| WPS salary explained | 1,600 | 24 |
| Notice period in the UAE | 480 | 14 |
| Probation period in the UAE | 480 | 17 |
| Ramadan working hours UAE | 480 | 17 |

Every guide must cite the Federal Decree-Law 33/2021 article it relies on and link to the relevant calculator. Refresh the year-specific pages (public holidays, "2026" titles) every January.

## 3. Developer and automation tools (US database)

| Keyword (us) | Volume | KD | CPC | Status |
|---|---:|---:|---:|---|
| uuid generator | 14,800 | 22 | 3.35 | tool exists; check its title/answer |
| crontab guru | 4,400 | 20 | 0.00 | navigational; cover as "crontab.guru alternative" in the cron FAQ |
| n8n templates | 3,600 | 27 | 5.49 | **gap**: the site has workflow downloads but no "n8n templates" hub page |
| n8n ai agent | 2,900 | 47 | 4.93 | guide later |
| n8n vs zapier | 1,900 | 40 | 5.37 | comparison article |
| n8n self hosted | 1,600 | 36 | 2.91 | guide |
| cron expression generator | 1,300 | 27 | 4.13 | tool exists (PR #7) |
| crontab generator | 1,300 | 50 | 11.40 | covered by the cron tool |
| n8n vs make | 1,000 | 34 | 3.73 | comparison article |
| curl to python | 720 | 22 | 0.00 | extend the cURL converter with a Python output tab |
| n8n whatsapp | 480 | 26 | 4.17 | guide plus WhatsApp workflow template |
| curl to javascript | 50 | 10 | 0.00 | same extension as curl to python |

The cron top 10 is led by crontab.cronhub.io, freeformatter, crontab.guru and cronmaker. The site's tool adds n8n-specific output and time-zone next runs, which none of them have. The realistic goal is page 1 within 3–6 months, supported by internal links from the n8n content below.

**Too hard for now** (keep the tools for users, don't expect rankings):

| Keyword | KD |
|---|---:|
| json formatter | 59 (us), 66 (ae) |
| base64 decode | 55 |
| regex tester | 69 |
| unix timestamp converter | 70 |
| ats resume checker | 64 (us), 52 (ae) |
| cv maker | 64 (ae) |
| ai resume builder | 81 |
| qr code generator | 83 |
| pdf to word | 84 |

## 4. Service keywords (leads)

| Keyword | DB | Volume | KD | CPC | Page |
|---|---|---:|---:|---:|---|
| ai automation agency | us | 2,900 | 36 | 6.54 | /services/ai-automation |
| website development dubai | ae | 1,600 | 37 | 6.98 | no page (see below) |
| ai automation consultant | us | 590 | 26 | **15.30** | /services/ai-automation |
| odoo dubai | ae | 480 | 17 | 2.45 | only if Odoo is offered |
| web developer dubai | ae | 320 | 21 | 4.98 | no page |
| n8n developer | us | 210 | 23 | **12.13** | /services/ai-automation |
| whatsapp automation | ae | 140 | 19 | 2.88 | /services/ai-automation |
| crm dubai | ae | 140 | 25 | 3.88 | /services/crm-business-systems |
| freelance web developer dubai | ae | 110 | 12 | 2.02 | no page |
| n8n agency | us | 110 | 13 | 3.99 | /services/ai-automation |
| workflow automation consultant | us | 90 | 5 | 12.99 | /services/ai-automation |
| n8n consultant | us | 70 | 7 | 10.96 | /services/ai-automation |

Volumes are small but CPCs are high ($11–15): every visitor is a potential client.

**Done in this PR:** added "n8n developer", "n8n consultant" and "WhatsApp automation" to the AI automation service's keywords.

**Recommended:**
- Give the AI automation page an "n8n developer for hire" section with pricing ranges and 2–3 case studies.
- Publish a short "n8n consultant vs agency" FAQ.
- **Web development page:** if you take website builds, a `/services/web-development` page targeting "web developer dubai" and "website development dubai" is the single best new lead page (1,900/mo combined, KD 21–37, CPC ~$5–7).

## 5. 90-day roadmap (ordered by expected return)

| Weeks | Ship | Why |
|---|---|---|
| 1 | This PR: leave salary and overtime calculators, gratuity coverage, cross-links | KD 9–17, ~3k/mo combined; lifts the gratuity cluster (~170k/mo) |
| 1 | Create a Semrush project for naqashthaheem.com with position tracking (keywords in §2–4, location UAE + US) and Site Audit | Baseline and weekly movement; currently zero visibility |
| 2–3 | UAE final settlement calculator + tax invoice generator | KD 9–28; strong business-owner intent, feeds the CRM/automation CTA |
| 2–4 | 4 UAE labour guides (maternity leave, unemployment insurance, public holidays 2026, notice period) linking to the calculators | KD 12–25, ~12k/mo; AdSense inventory and internal links |
| 4–6 | "n8n templates" hub page built from the existing workflow downloads + WhatsApp workflow | KD 26–27, 4k/mo; lead magnet for the automation service |
| 5–8 | n8n vs Zapier and n8n vs Make comparisons; n8n self-hosted guide | KD 34–40, 4.5k/mo; commercial-investigation intent close to a hire |
| 6–8 | cURL converter: Python/JavaScript output; UUID tool title/answer refresh | cheap wins on existing pages |
| 8–12 | Zakat calculator; rent increase calculator (RERA); web development service page (if offered) | KD 16–37 |

**Link building:** gratuity and leave tools earn links naturally from HR, recruitment and expat communities. Suggested outreach:
- UAE expat Facebook and Reddit communities (r/dubai, r/UAE): answer gratuity questions and link the calculator where it helps.
- HR and recruitment blogs.
- Offer an embeddable version of the gratuity calculator.

## 6. Actions only you can take

1. **Semrush → Projects → Add project → `naqashthaheem.com`:**
   - Position Tracking: UAE (Dubai) plus US desktop and mobile, with the keywords in the tables above.
   - Site Audit: weekly crawl.
2. **Google Search Console:** submit `https://naqashthaheem.com/sitemap.xml` (still pending from the growth audit). Then request indexing for the three UAE calculators.
3. **Links:** share the gratuity and leave calculators once in 2–3 relevant communities or LinkedIn posts, so Google discovers and crawls them faster.
4. **Web development service:** confirm whether you offer it, so the page can be built.

## 7. KPIs

- Semrush Position Tracking visibility (UAE) and number of keywords in the top 10, weekly.
- Search Console impressions and clicks for the `uae-*` tool pages.
- GA4:
  - `tool_use` per tool
  - `cta_click` from finance/UAE tools to the service CTA
  - `generate_lead` with `source=tool:uae-*`
- AdSense RPM on the UAE tool and guide pages, compared with the site average.
