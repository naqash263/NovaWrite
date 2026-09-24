# Career tools: competitor comparison and QA notes

Reviewed 2026-09-24. Pages: `/resources/{cv-builder, cover-letter-generator, linkedin-optimizer, interview-prep, salary-negotiation, career-path-planner, job-search-optimizer, skills-assessment}`.

All eight pages now share one layout (`frontend/src/components/career/CareerToolLayout.tsx`), fed by `frontend/src/data/careerTools.ts`. The layout provides a single H1, an answer-first intro, a visible "How to use" list, 3 to 5 visible FAQs, related career tools and a "Reviewed by Naqash Thaheem" line. It also emits WebApplication, BreadcrumbList (Home › Resources › Tool), HowTo and FAQPage JSON-LD, with no aggregateRating. The seven AI tools share `careerUtils.postCareerTool`, which shows the API's own error message (for example a validation error or "No API keys available") instead of a generic "try again".

Competitor facts come only from the sources listed at the bottom. Where a source did not confirm something, the cell says "not reviewed".

## CV Builder

| Capability | Competitors (Zety, Resume.io, Novoresume, Canva) | This tool before | This tool now |
|---|---|---|---|
| Live preview while typing | Resume.io and Novoresume: yes | No. The preview only appeared at the template and export steps | Yes. The preview sits beside steps 1–8 on desktop and can be opened on phones |
| Free PDF download | Canva: free. Novoresume: first resume. Zety and Resume.io: paid or trial | Yes, but **broken**: text was drawn at x < 0 and past the right edge, so it was clipped off the page | Fixed. Text stays inside the page margins (a regression test checks the positions) |
| Word download | Canva: yes. Zety and Resume.io: paid | "Coming soon" toast only | Real ATS-friendly .docx built with the `docx` library |
| ATS-friendly layout | Canva's templates are mostly multi-column with graphics | Depended on admin templates. With none loaded, the builder showed "Templates coming soon" and **every export failed** | A built-in single-column "Classic ATS" template is always available |
| Page size and margins | not reviewed | Settings for quality, size, margins, page numbers and watermark were shown but ignored | Page size and margins apply to PDF and Word. Page numbers and the footer apply to PDF. The fake "300 DPI" quality option was removed |
| Save progress | Account-based (competitors) | Autosave, but resuming the saved step did not work under React StrictMode | Autosave, and the step, data and chosen template are restored on reload |
| AI import or tailoring | Paid tiers | Used `alert()` and stored skills as an array (broke the skills text field) | Uses toasts, normalises skills to text and enforces the 10 MB limit |

Other fixes:
- User text was injected into the preview HTML without escaping (self-XSS, and `<` broke the layout). All values are now escaped, and links are restricted to http, https and mailto.
- Empty rows showed placeholder text such as "Position Title" and "Project Name". Interests rendered as `[object Object]`.
- `{{#if profilePictureUrl}}` in admin templates was left unprocessed.
- Mode cards were clickable `div`s. They are now keyboard-accessible buttons.
- 40 form fields had labels that were not connected to their inputs. They now have accessible names.
- Heading levels skipped (h2 → h4). A "template guide" listed templates that do not exist, and the page made unverifiable ATS claims.
- Debug `console.log` calls printed the user's CV data.

**Backlog:** in-preview inline editing (Novoresume), matching cover-letter designs, AI bullet suggestions per job title, a real template thumbnail for Classic ATS, and more than one page-aware PDF layout. Admin templates may contain their own `<h1>`, which would add a second H1 in the preview; this needs a template-side change.

## Cover Letter Generator

| Capability | Competitors (Kickresume, Teal) | Before | Now |
|---|---|---|---|
| Tailor to job description | Yes (both) | Yes | Yes, with a 2,000-character counter matching the API limit. Previously longer text caused a hidden 422 error |
| Tone and length | Teal: yes | Shown in the UI but **never sent** | Sent to the API, which passes them into the prompt |
| Edit the draft | Kickresume: edit or regenerate | Read-only text | Editable textarea with a word count |
| Download | not reviewed | Copy only | Copy plus a .txt download |
| Free usage | Kickresume: 1–2 free. Teal: 2 free generations | Free | Free, within the shared AI quota |

Bugs fixed:
- The skills field removed every comma and space as you typed.
- The score and keywords never showed, because the API returns `atsScore` and `keywordDensity`.
- There was no step validation, and required fields could be skipped.

**Backlog:** generate from an uploaded CV (Kickresume), regenerate a single paragraph, and .docx export.

## LinkedIn Optimizer

| Capability | Jobscan LinkedIn Optimization | Before | Now |
|---|---|---|---|
| Profile score | Yes (25+ checks) | Yes | Yes, with safe number handling |
| Keyword suggestions | Yes, based on target job descriptions | Shown as non-focusable `span`s | Buttons that add the keyword to your skills list and show when it is added |
| Headline generator | Yes | No | Backlog |
| Headline length guidance | not reviewed | None | Live 220-character counter |

Bugs fixed:
- The skills field stripped spaces as you typed.
- The button stayed disabled until all three fields were filled, although the API only needs one.
- "Copy Results" copied raw JSON; it now copies readable text.
- The "AI Analysis" step was an empty spinner screen.
- An unverifiable "40x more opportunities" claim was removed, along with the duplicate feature blocks.

**Backlog:** headline and About generators, and matching keywords against a pasted target job description.

## Interview Prep

| Capability | Google Interview Warmup (shut down April 2026), Big Interview | Before | Now |
|---|---|---|---|
| Role-specific questions | Yes | Yes | Yes |
| Sample answers and tips | Big Interview: curriculum | Modal dialog without focus handling | Inline "View Answer" disclosure with `aria-expanded` |
| Voice recording and feedback | Yes (both) | No | Backlog |
| STAR guidance | Big Interview: yes | Yes | Yes. Falls back to built-in STAR guidance when the AI omits it |

Bugs fixed (the tool could not work end to end before):
- The page **crashed** on results: it read `companyInsights.culture`, but the API returns `companyResearch`.
- Every request **failed validation**: `soft_skills` was always an empty array, and the API requires it.
- The "Lead" experience level and the "technical" and "case study" interview types are rejected by the API. The options now match the API values.
- The "Under Progress" banner was removed.

**Backlog (needs a backend change):** allow `technical` and `case-study` in `CareerToolsController::generateInterviewPrep`, then restore those options.

## Salary Negotiation

| Capability | Glassdoor, Levels.fyi | Before | Now |
|---|---|---|---|
| Real market data | Yes (crowd-sourced; Levels.fyi has detailed tech total compensation) | AI estimate shown as "real-time data" | AI estimate, labelled as such, with a prompt to verify against surveys |
| Local currency | not reviewed | $ hard-coded | Choice of 9 currencies, with `Intl` formatting |
| Raise calculator | not reviewed | No | Instant amount and percentage, with a warning when the desired salary is lower |
| Scripts, anchor and walk-away | Levels.fyi: paid coaching | Rendered from fields the API never returns (**crash**) | Normalised from the real API shape (`negotiationRange`, `strategy`, `scripts[]`) |

Bugs fixed:
- **Every request failed validation.** Experience was sent as "4-6" (the API needs an integer), education as "Bachelor" (the API needs lowercase), and skills as an empty array. There was also no enterprise company size.
- The step indicator showed 6 steps, with steps 4 and 5 unreachable. Its fixed widths overflowed on phones.
- Industry was collected but never sent.

**Backlog:** a real salary data source and a total-compensation calculator (base, bonus, equity).

## Career Path Planner

| Capability | CareerOneStop mySkills myFuture, O*NET Interest Profiler | Before | Now |
|---|---|---|---|
| Suggested paths | Yes, from O*NET occupations | AI paths | AI paths, with salary shown only as an estimate |
| Skill gaps and training | Yes, with local training programs | **Crash**: read `gap.resources` and `marketInsights`, which the API does not return | Normalised skill gaps, education, networking and milestones |
| Preferences | not reviewed | Uncontrolled checkboxes, never sent | Controlled checkboxes, sent to the API together with location |

Bugs fixed:
- **Validation failures**: experience was sent as "entry" or "mid" instead of an integer, and education was "Bachelor" (wrong case).
- There was no validation and no education input.

**Backlog:** link suggested paths to O*NET or CareerOneStop occupation pages, and add an interest questionnaire.

## Job Search Optimizer

| Capability | Teal, Huntr | Before | Now |
|---|---|---|---|
| Keywords and job boards | Teal: keyword insights from job descriptions | Yes | Yes |
| Application tracker (Kanban) | Huntr: yes; Teal: yes | No | Backlog |
| Salary and job type | not reviewed | **Bug**: the salary range never matched its lookup, so 100,000 was always sent. Job type was fixed to full-time and industry to "Technology" | The real salary, currency, job type, industry, preferences and company size are sent |
| Results navigation | not reviewed | 4-step indicator for 6 screens | Result tabs (Jobs, Applications, Networking) with correct ARIA roles |

Other changes: example roles are labelled "AI-generated, not live vacancies", and "Copy Strategy" now copies readable text.

**Backlog:** a saved-jobs tracker in localStorage, and parsing a pasted job ad into keywords.

## Skills Assessment

| Capability | O*NET, mySkills myFuture | Before | Now |
|---|---|---|---|
| Custom skills | not reviewed | No; 12 fixed lists only | Custom skill input (Enter or Add), a filter box, and toggle-to-remove |
| Ratings sent to the AI | not applicable | Levels and importance were **never sent**. Only technical and soft skills were sent, so healthcare, finance and other skills were dropped | All skills are sent, each with its level and importance |
| Role and goal context | Yes | Hard-coded "Software Developer" and a generic goal | "Current role" and "career goal" inputs |
| Gaps shown | Yes | `weaknesses` were never rendered | A skill gaps section and career alignment |

**Backlog:** a quiz-based self-assessment instead of self-rating, and occupation matching with O*NET data.

## Implemented across all pages

- The SEO layout: unique titles (30–60 characters) and descriptions (110–160 characters), a canonical URL, JSON-LD, the visible FAQ and how-to, related tools, the reviewer line, and heading levels that never skip.
- Duplicate marketing blocks, "Free … No Signup" keyword-stuffed titles and the "Under Progress" banners were removed.
- Every input has a connected label, and validation messages use `role="alert"`.
- Step indicators wrap, so the pages have no horizontal overflow at 390 px.

## Not routed: `WatermarkRemover.tsx`

`frontend/src/pages/resources/WatermarkRemover.tsx` ("Sora Watermark Remover") is not imported anywhere, so it is dead code. It still has a keyword-stuffed `useSEO` title and debug logging. Removing another product's watermark carries terms-of-service and legal risk. Recommendation: delete the file, or keep it unrouted. If it is ever routed, it should be `noindex` and reviewed by legal first.

## Sources

- https://www.kickresume.com/en/help-center/10-best-resume-builders/
- https://www.tealhq.com/post/best-resume-builders
- https://www.canva.com/resumes/
- https://jobscoutly.com/blog/best-free-resume-builders-2026/
- https://www.kickresume.com/en/help-center/best-ai-cover-letter-generators/
- https://www.kickresume.com/en/ai-cover-letter-writer/
- https://www.tealhq.com/tool/cover-letter-generator
- https://www.jobscan.co/linkedin-optimization
- https://www.levels.fyi/services/
- https://www.lync.me/blog/1018/salary-negotiation-tools-glassdoor-levels-fyi
- https://skillora.ai/blog/interview-warmup-alternatives
- https://career.cornell.edu/resources/big-interview/
- https://www.myskillsmyfuture.org/
- https://onetinterestprofiler.org/
- https://www.dol.gov/agencies/eta/onet/tools
- https://huntr.co/product/job-tracker
- https://www.tealhq.com/tools/job-tracker
