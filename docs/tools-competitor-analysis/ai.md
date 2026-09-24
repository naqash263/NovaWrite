# AI tools: competitor analysis and QA (reviewed 2026-09-24)

Hub: `/resources/ai-tools`. Tools: text summarizer, article rewriter, grammar checker, language translator, keyword extractor.

All five tools POST to the Laravel API (`/api/ai-tools/{tool}/{action}`), which calls Google Gemini
(`gemini-2.0-flash`, `maxOutputTokens: 2048`) through `CareerAiService::callGeminiApi`. Nothing runs in the
browser except validation, counting, diffing and export. Competitor pages could not be fetched from the
research environment (egress blocked), so competitor facts come from search-result snippets and help-centre
pages listed under Sources. Only facts found there are recorded.

## Cross-cutting findings (all five tools)

| Issue found | Fix |
| --- | --- |
| Raw `response.json()` on error responses: an HTML 429/502 page crashed the handler with "Unexpected token <" | Shared `postAiTool()` in `frontend/src/components/tools/aiToolClient.ts` parses safely and maps 422/429/5xx/network failures to clear messages; raw server exception text (e.g. SQL errors) is never shown |
| No `Authorization` header, so a logged-in user's own Gemini key (`auth('api')->user()`) was never used | Token from `localStorage` is sent when present; `Accept: application/json` added |
| Submit button silently disabled for empty/short input; no explanation | Button stays enabled; empty or short input shows an inline `role="alert"` message, `aria-invalid`, and sends no request |
| Paste over the limit was silently truncated by `maxLength` | `useLimitedText` truncates and shows "only the first N were kept"; counter shows words and characters |
| `alert('Copied!')` popups | Inline "Copied to clipboard" (`aria-live`) with fallback copy |
| In-component H2 "Free X Online", SEO paragraph, About/Use cases/Features/FAQ blocks duplicating the page template | Removed; remaining headings start at h2 |
| Unlabelled textareas/selects/slider | All controls labelled with `htmlFor`/`id` or wrapping labels |
| In-flight requests continued after navigation | Requests are aborted on unmount and on re-submit |
| Rewriter, grammar checker and translator accepted 50,000 characters but Gemini replies are capped at 2,048 tokens, so long outputs came back cut off | Client limit set to 5,000 characters for these three, explained in the UI and FAQ (summarizer keeps 50,000: its output is short; keyword extractor uses the API's 10,000) |

API key banner/manager (rendered above every AI tool and on the career tools):

| Issue | Fix |
| --- | --- |
| Claims not supported by the backend: "Unlimited access", "No rate limits", "Faster processing", "Free forever (60 requests/minute)", "Your data is processed locally" | Rewritten: shared quota is limited; own key gives a personal allowance; text is sent to Google Gemini |
| Showed "AI Requests: 0 / 100" in red whenever stats failed to load | Count shown only when the stats endpoint returns valid numbers |
| Stats fetched from relative `/api/cv-ai/stats` instead of the configured API base | Uses `API_CONFIG.BASE_URL` |
| Banner title was an `h3` above the tool's `h2`; toggle had no `aria-expanded` | `h2`, `aria-expanded`/`aria-controls` |
| Login via `window.location.href` (full reload) | React Router `Link` |
| Modal: no `role="dialog"`, no Escape, unlabelled close button, input not associated with its label, no Enter-to-submit | All added (form submit, focus on open, click outside closes) |

## Text summarizer

Competitors: QuillBot Summarizer, Scribbr Summarizer, SMMRY.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| Summary length control | QuillBot: slider (short to long) | 3 lengths | 3 lengths |
| Paragraph vs key points | QuillBot: Paragraph / Key Sentences (Bullet Points) | General / key points / detailed | Same |
| Free input limit | QuillBot free 1,200 words; Scribbr without account 600 words; SMMRY no word limit | 50,000 chars (not explained when exceeded) | 50,000 chars, counter + truncation notice |
| File upload | QuillBot: PDF/Word | No | No (backlog) |
| Copy / export | Copy | Copy with alert | Copy with inline confirmation, download .txt |
| Stats | – | Character-based compression from API | Word counts and "shorter by %" computed from the text |
| Error handling | – | Raw messages, crashes on non-JSON | Clear 429/500/network messages |

Implemented: validation messages, clear errors, truncation notice, copy confirmation, .txt download, word stats, Ctrl+Enter, labelled controls, removed duplicated content.
Backlog: file upload (.txt/PDF/Word), summarize from URL, finer length control.

## Article rewriter

Competitors: QuillBot Paraphraser, Grammarly, Scribbr Paraphrasing Tool.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| Modes / styles | QuillBot free: Standard, Fluency; Premium adds Formal, Simple, Creative, Expand, Shorten, Academic, Custom | 5 styles + 4 tones | Same, all free |
| Free input limit | QuillBot free: 125 words per paraphrase | 50,000 chars (output could be truncated by the model) | 5,000 chars so the full rewrite returns |
| Compare changes | QuillBot Premium: compare modes | No | No (backlog) |
| Reuse output | – | No | "Use as input" |
| Honesty | – | Claimed "plagiarism-free" | Claim removed; FAQ explains citation still needed |

Implemented: realistic limit, validation, clear errors, copy confirmation, download, "Use as input", labelled controls, removed duplicated content and the plagiarism claim.
Backlog: highlighted diff between input and output, synonym control, custom instructions.

## Grammar checker

Competitors: Grammarly, QuillBot Grammar Checker, Scribbr Grammar Checker.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| See each change | Grammarly: underlines + hover suggestions; QuillBot: highlights, fix one or all | Only corrected text | Word-level diff: removed (red, struck) and added (green, underlined) |
| Fix all at once | QuillBot | Implicit (corrected text) | Corrected text + "Replace my text" |
| Suggestions | Grammarly tone/clarity (Pro for full) | Suggestions + improvements lists | Same, robust to object-shaped AI output |
| Languages | QuillBot: EN, DE, FR, ES, PT | Not stated | Stated: best in English |
| Real-time / extensions | Grammarly: works across websites and apps | No | No (backlog, out of scope) |
| Robustness | – | Crashed if the AI returned objects in `suggestions`; blank result if `corrected_text` empty | Handled with readable text and an error message |

Implemented: diff view, "No changes suggested" state, robust parsing, 5,000-char limit, validation, clear errors, copy/download/replace, fieldset with legend, removed duplicated content.
Backlog: accept/reject individual changes, per-change explanations, real-time checking.

## Language translator

Competitors: Google Translate, DeepL Translator.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| Languages | Google: 108+; DeepL: 100+ (36 on its latest model) | 29 + auto | 29 + auto (copy said "30+", now "29") |
| Detect language | Both | Yes, but showed the backend's guess (Latin-script text labelled "English") | Auto-detect; misleading guess no longer displayed |
| Swap | Both | Swapped languages only; silently did nothing in auto mode | Swaps languages and moves the translation into the input; disabled with a tooltip in auto mode |
| Limit | Google: 5,000 chars per translation; DeepL free: 1,500 chars per translation (reported) | 50,000 chars (output could be cut off) | 5,000 chars |
| Copy / listen | Google: copy + text-to-speech | Copy with alert | Copy with confirmation, download .txt; no TTS (backlog) |
| Documents | Google: .docx/.pdf/.pptx/.xlsx up to 10 MB | No | No (backlog) |
| RTL output | Both | No | `dir="rtl"` for Arabic/Hebrew |
| Validation | – | Minimum 10 chars (blocked short words) | Minimum 1 char; same-language check |

Implemented: swap fix, same-language validation, lower minimum, RTL display, realistic limit, copy/download, labelled selects, removed duplicated content.
Backlog: text-to-speech, document upload, more languages, alternative translations.

## Keyword extractor

Competitors: WordStream Free Keyword Tool, WordCount.com Keyword Extractor, Web Aloha Keyword Extractor, ToolsTwenty Keyword Extractor.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| Extract from pasted text | WordCount.com, Web Aloha, ToolsTwenty | Yes (AI) | Yes (AI), cleaned list |
| Frequency counts | ToolsTwenty (stop-word removal + counts) | No | Occurrences and density per keyword, computed in the browser |
| Extract from URL | Web Aloha | No | No (backlog) |
| Search volume / CPC / competition | WordStream | No | No (stated in FAQ; backlog) |
| Export | – | Copy with alert | Copy comma-separated or one per line, CSV download |
| Limits | – | None client-side (API rejects >10,000) | 10,000 chars enforced and explained |

Implemented: counts and density, "related" marker for terms not in the text, CSV export, list clean-up (numbering, "Keywords:" labels, duplicates), limit, validation, clear errors, labelled slider, removed duplicated content.
Backlog: URL extraction, non-AI n-gram table, search-volume data.

## Tests

`frontend/e2e/tools/ai.spec.ts` (30 tests): per tool, loading state + mocked result + copy to clipboard; empty/short
input sends no request; 500 and 429 messages; character-limit truncation notice. Plus option payloads, grammar
diff, translator swap/RTL/same-language, keyword counts + CSV, network failure, API-key banner honesty, and a
`@mobile` overflow check at 390px.

## Sources

- QuillBot summarizer limits: https://help.quillbot.com/hc/en-us/articles/35700052994071-What-is-the-word-limit-for-Quillbot-Summarizer-free-vs-Premium
- QuillBot summarizer: https://quillbot.com/summarize ; https://quillbot.com/blog/quillbot-tools/tl-dr-quillbots-instant-text-summary-tool-to-the-rescue/
- Scribbr summarizer comparison: https://www.scribbr.com/frequently-asked-questions/what-is-the-best-summarizer-tool/ ; https://www.scribbr.com/ai-tools/best-summarizer/
- QuillBot paraphraser free vs Premium: https://help.quillbot.com/hc/en-us/articles/35855733045143-What-is-the-difference-between-free-and-Premium-in-the-Quillbot-Paraphraser ; https://quillbot.com/paraphrasing-tool
- QuillBot grammar checker: https://quillbot.com/grammar-check ; https://quillbot.com/blog/quillbot-tools/quillbots-grammar-checker-the-best-of-the-best/
- Grammarly grammar checker: https://www.grammarly.com/grammar-check ; https://www.demandsage.com/grammarly-vs-quillbot/
- Scribbr grammar checker: https://www.scribbr.com/grammar-checker/
- DeepL limits and languages: https://www.ghacks.net/2023/01/12/deepl-translator-reduced-character-limit-and-price-increase/ ; https://en.wikipedia.org/wiki/DeepL_Translator ; https://support.deepl.com/hc/en-us/articles/360019925219-DeepL-Translator-languages
- Google Translate limit and features: http://googlesystem.blogspot.com/2016/12/google-translates-5000-character-limit.html ; https://support.google.com/translate/answer/2534559?hl=en&co=GENIE.Platform%3DDesktop ; https://www.androidpolice.com/google-translate-language-detection-tutorial/
- WordStream free keyword tool: https://www.wordstream.com/free-keyword-tools ; https://www.wordstream.com/keywords
- Keyword extractors: https://wordcount.com/keyword-extractor ; https://webaloha.co/tools/keyword-extractor/ ; https://toolstwenty.com/free-advanced-keyword-extractor/
