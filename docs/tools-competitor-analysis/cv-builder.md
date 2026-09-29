# CV Builder: competitor comparison, QA results and upgrades

Reviewed 2026-09-25. Page: `/resources/cv-builder` (`frontend/src/pages/resources/CVBuilder.tsx` and `frontend/src/components/cv-builder/*`). Registry entry: `cv-builder` in `frontend/src/data/careerTools.ts`. Tests: the "CV builder" block in `frontend/e2e/tools/career.spec.ts`.

This builds on the CV Builder section of [career.md](./career.md). Competitor sites mostly block automated access, so competitor facts come from search-result snippets of the pages listed under Sources. Where no source confirmed something, the cell says "not reviewed". Prices change often and vary by region; treat them as of September 2026.

## Feature gaps

| Capability | Zety | Resume.io | Kickresume | Canva | Novoresume | Enhancv | FlowCV | Reactive Resume (open source) | Resume Worded / Jobscan | This tool before | This tool now |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Templates | Many, customisable colours, fonts, spacing and order | 30+ with matching cover letters | 40+ premium; 4 on the free plan | Hundreds, mostly designed | 16+ ATS-friendly | All templates, 7-day free plan | 50+ free | not reviewed | Not builders (checkers) | Built-in Classic ATS plus admin templates | Same, plus accent colour, font and size options |
| ATS-friendly output (text PDF, simple layout) | Formatted PDF is paid | Formatted PDF is paid | not reviewed | Many templates are multi-column with icons and text boxes, which ATS parsers can scramble | Free PDF is one page with a watermark | Free export carries branding | Unlimited watermark-free PDFs | Exports PDF, DOCX, Markdown and JSON | Check existing files | PDF via `jsPDF.html()`: text was selectable but written one word (and heading letters one character) at a time, with no spaces between contact items | **Default "ATS text layout" PDF** written line by line with jsPDF's text API: whole lines, one column, standard headings, keep-with-next page breaks, links, document metadata |
| ATS score / keyword match against a job description | not reviewed | Keyword matching from a pasted job ad or link | ATS checker on paid plans | No | Free ATS checker and content optimiser | 27-check resume checker | not reviewed | No | Jobscan: 5 free scans a month, Premium from $49.95/month. Resume Worded: basic free score, Pro from $49/month | None | **In-browser keyword match**: score, matched and missing keywords, one-click "add to skills", suggestions. Nothing is uploaded |
| AI bullet writing | AI writer | AI pre-written phrases | GPT-4.1 writer (paid) | Magic Studio AI tools | AI tools are "more educational guides" | not reviewed | AI on Pro | No | Resume Worded Pro: line-by-line rewriting | Only whole-CV AI tailoring | Local **action-verb and quantified-bullet helper** plus weak-opening and "has a number" checks, no AI needed; AI tailoring still available |
| Section reordering and hiding | Drag and drop | not reviewed | not reviewed | Free-form design | not reviewed | not reviewed | Full layout control | Drag and drop | n/a | Fixed order; empty sections hidden | **Move up / down and show / hide** per section, applied to preview, PDF and Word |
| Custom sections | not reviewed | not reviewed | not reviewed | Free-form | not reviewed | not reviewed | not reviewed | Yes | n/a | No | No (backlog) |
| Photo (common in the Gulf) | not reviewed | not reviewed | not reviewed | Yes | not reviewed | not reviewed | not reviewed | not reviewed | n/a | Yes (upload or URL) | Yes, also placed in the ATS PDF |
| UAE / Gulf fields (nationality, visa status, driving licence, notice period) | not reviewed | not reviewed | not reviewed | Manual text | not reviewed | not reviewed | not reviewed | Custom fields | n/a | No | **Optional fields**, shown only when filled, in preview, PDF and Word |
| Multi-page handling | not reviewed | not reviewed | not reviewed | Manual pages | Free plan limited to one page | Free plan limited to 12 items per section | not reviewed | not reviewed | n/a | Worked, but lines were drawn word by word | Line-based pagination; a test checks all 36 bullets of a 2-page CV survive the page breaks |
| Import / export | Upload existing resume | TXT free, PDF paid | LinkedIn / PDF import on paid plans | PDF, Word, PNG, JPG | not reviewed | Checker reads PDF and DOCX | 3 free resume imports | JSON import and export | Upload to scan | AI upload of PDF / Word / TXT; export PDF, DOCX, HTML, TXT | Same, plus **JSON backup and restore**. No LinkedIn import |
| Cover letter matching | not reviewed | Matching cover letter templates and generator | 40+ matching cover-letter templates | Design templates | Cover letter builder on Premium | not reviewed | 1 free cover letter | Cover-letter sections | n/a | Separate AI Cover Letter Generator tool (not design-matched) | Unchanged |
| Pricing and paywall | Builds free, but only a plain .txt download is free. PDF/Word: $1.95 14-day trial, then $25.95 every 4 weeks, or $71.40 a year | Free TXT only. PDF: $2.95 7-day trial, then $29.95/month; reports of cancellation trouble | Free: 4 templates, unlimited downloads. Paid from $8/month (annual) to $24/month | Free PDF download of free templates | Free: one single-page resume with watermark. Premium about $24/month | Free for 7 days with branding; Pro from $16.50/month | First resume free forever, watermark-free; Pro $5/month billed yearly | Free, MIT-licensed | Freemium, see above | Free, no signup | **Free, no signup, no trial, no watermark, every format.** AI features depend on the site's shared AI service |

### Where this tool now stands

- **Honest advantage:** it is completely free at the point of download. Zety and Resume.io let you build for free and then charge (through trials that auto-renew) when you want a formatted PDF or Word file. Novoresume and Enhancv add branding on free exports. FlowCV (first resume free, watermark-free) and the open-source Reactive Resume are the closest free competitors.
- **Closed gaps:** a text-based ATS PDF, a free keyword match (paywalled or scan-limited at Jobscan, Resume Worded and Kickresume), section order and visibility, bullet-writing help without AI, Gulf personal-details fields and a portable JSON backup.
- **Remaining gaps:** fewer and simpler templates than Zety, Kickresume or FlowCV; no custom sections; no drag and drop; no LinkedIn import; no design-matched cover letter; no inline editing inside the preview. The PDF uses the 14 standard PDF fonts, so Arabic or other non-Latin script is not shown (the builder warns and points to the Word export, which keeps it).

## QA results (Playwright, production build, API mocked)

The "CV builder" describe block now has 20 tests (plus the shared SEO and phone checks). PDF text is read by parsing the Flate-compressed content streams (`pdfTextLines`). DOCX files are unzipped with `node:zlib` (`unzipEntry`) to read `word/document.xml`.

Before this change, the PDF was **not** image-based: `jsPDF.html()` draws through a canvas-to-PDF bridge that emits real text. But it wrote each word, space and punctuation mark as a separate text object, drew spaced-out headings one letter at a time ("P","R","O","F","I","L","E"), and placed contact items with no separating spaces. Simple ATS text extractors can therefore merge or scramble words. The new default PDF writes whole lines. A test asserts that the name, job title and a full experience bullet each appear as a single text line, that there are no images, that the file has several pages, that every bullet survives the page breaks, and that all text stays inside the margins. The old renderer remains available as "Template design (as previewed)".

Bugs found and fixed (each has a test that failed before the fix):

| Bug | Test |
|---|---|
| The AI upload dropped every certification: the API returns `certificates`, the page read `certifications` | "AI upload sends the file and fills every section, including certifications" |
| AI errors were unclear: 422 showed "Validation failed" instead of the field error; 429 and other non-JSON responses showed a JSON parse error; network failures showed "Failed to fetch"; nothing used `role="alert"` | "AI upload shows clear messages for 422, 429, 500 and network errors, and offers manual entry", "AI tailoring shows the API validation message" |
| No way out of the upload or tailor step when the AI failed (Previous is disabled on step 1) | Same test ("Enter details manually instead") |
| Choosing "Upload Existing CV" or "Tailor to Job" **wiped the saved CV** straight away. Tailoring sent an empty CV instead of yours. The 50-character minimum was only enforced by the API | "AI tailoring keeps your CV, sends it with the job description and applies the result" |
| The bottom "Download CV" button always exported a PDF, whatever format was selected | "the bottom "Download CV" button exports the format chosen above it" |
| Month dates showed as raw `2021-03` in the preview, PDF and Word | "shows work dates as month and year…", Word test |
| PDF text was fragmented (see above) | "exports an ATS-friendly text PDF…" |
| Style options (colour, font, size) existed in state but had no UI | "switches between every template and customizes accent colour, font and size" |
| The step navigation used `position: sticky`, which cannot work because `html, body { overflow-x: hidden }` makes `<body>` a scroll container. On phones the Next button sat below a long form | "@mobile fits a 390px phone on every step…" (asserts Next is in the viewport) |
| All "Remove" buttons had the same accessible name | "fills every section…" (uses "Remove education 2" etc.) |

Covered without a code change: every step and section with add / remove and live preview, template switching, persistence after reload, Word contents, labels on every visible control on all ten steps, and keyboard operation of the main flow.

## Sources

- https://pitchmeai.com/blog/zety-resume-builder-pricing-pdf-download-costs
- https://www.soundcv.com/blog/zety-review-2026
- https://zety.com/pricing
- https://zety.com/blog/zety-faq
- https://resume.io/pricing
- https://help.resume.io/en/articles/3785088
- https://pitchmeai.com/blog/resume-io-pricing-free-version
- https://www.livecareer.com/resources/product-reviews/resume-io-reviews
- https://resume.io/ai-resume-builder
- https://www.atsresumeai.com/compare/kickresume-review
- https://stylingcv.com/blog/kickresume-review-2026-features-pricing-pros-cons-worth-it/
- https://www.canva.com/resumes/
- https://blog.loopcv.pro/are-canva-resumes-ats-friendly/
- https://cvwiser.com/blog/canva-resume-ats
- https://enhancv.com/blog/novoresume-review/
- https://www.soundcv.com/blog/novoresume-review-2026
- https://enhancv.com/pricing/
- https://owlapply.com/en/blog/enhancv-review
- https://flowcv.com/pricing
- https://jobscoutly.com/reviews/flowcv/
- https://github.com/amruthpillai/reactive-resume
- https://docs.rxresu.me/guides/exporting-your-resume
- https://app.jobscan.co/plan
- https://careery.pro/blog/resume-applications/is-jobscan-worth-it-2026
- https://resumeworded.com/get-pro
- https://jobsolv.com/directory/resumeworded
- https://www.resumefast.io/blog/gulf-cv-format-guide
- https://www.latinumhr.com/insights/dubai-cv-format/
