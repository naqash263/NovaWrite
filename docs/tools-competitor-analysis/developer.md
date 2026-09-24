# Developer tools: competitor analysis and QA (reviewed 2026-09-24)

Hub: `/resources/utility-tools` (category `developer`). Tools: JSON formatter, Base64 encoder, URL encoder,
regex tester, UUID generator, JWT decoder, SQL formatter, CSS formatter, HTML formatter, Markdown preview.

All ten tools run entirely in the browser (no network calls in the components). Competitor pages could not be
fetched from the research environment (egress proxy blocked `WebFetch`), so competitor capabilities come from
search-result snippets listed under Sources. Only facts found there, or widely known features of those
products, are recorded.

Content lives in `frontend/src/data/tools/utility-developer.ts`; tests in `frontend/e2e/tools/developer.spec.ts`.

## Cross-cutting findings (all ten tools)

| Issue found | Fix |
| --- | --- |
| In-component "Free X Online" H2, SEO paragraph and About / Use cases / Features / FAQ / Tips blocks duplicated the page template | Removed. Remaining in-tool headings are h2 or lower |
| `alert()` pop-ups for "Copied" / "Valid JSON" | Inline `aria-live` notices (not `role="status"`, which the page reserves for the lazy-load spinner) |
| Visible labels not associated with their inputs | Every textarea, input and select has `htmlFor`/`id` or a wrapping label; mode toggles use `aria-pressed`; errors use `role="alert"` + `aria-invalid`/`aria-describedby` |
| Several tools computed output from stale state (output lagged one keystroke behind) | Outputs are derived with `useMemo` from current input and options |
| Wide fixed layouts | All grids use `min-w-0`; verified no horizontal overflow at 390 px |

## JSON formatter

Competitors: JSONFormatter.org, JSON Editor Online, CodeBeautify JSON Viewer, Jam JSON Formatter.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| Beautify with indent choice | All | Yes (2/4/tab) | Yes |
| Minify | All | Yes | Yes, with size saving |
| Validation with error location | All | Partly; overlay highlight misaligned, validation result in `alert()` | Line + column, Go to error, plain-English hint |
| Auto-fix | Some | Regex-based; deleted `//` inside string values such as URLs | String-aware repair (comments, single quotes, unquoted keys, trailing commas) |
| Sort keys | Some | No | Yes (recursive) |
| Open file / download | JSONFormatter.org, CodeBeautify | No | Yes |
| Tree view, JSON to CSV/XML, load from URL | JSON Editor Online, JSONFormatter.org, CodeBeautify | No | Backlog |

## Base64 encoder / decoder

Competitors: Base64Decode.org / Base64Encode.org, Jam, 64baser, Coddy.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| Text encode / decode | All | Yes, but output lagged one keystroke (stale state) | Live and correct |
| UTF-8 / emoji | Base64Decode.org (charset option) | Via deprecated `escape`/`unescape` | `TextEncoder`/`TextDecoder` (verified `héllo ✓ 日本 🚀` round-trip) |
| URL-safe Base64 | Base64Encode.org | No | Base64URL output; decoder accepts both alphabets, whitespace, missing padding |
| File to Base64 | Coddy, 64baser | No | Yes (10 MB), optional data URI |
| Decode to file | 64baser | No | Download decoded bytes; binary detected instead of garbled text |
| Other charsets, per-line decoding | Base64Decode.org | No | Backlog |

## URL encoder / decoder

Competitors: URLEncoder.org / URLDecoder.org, Meyerweb Dencoder, Jam, Zoho Toolkit.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| Encode / decode | All | Yes, output lagged one keystroke | Live and correct |
| Live conversion | URLDecoder.io | Buggy (stale) | Yes |
| Component vs full-URL mode | Not seen | No | `encodeURIComponent` / `encodeURI` |
| `+` for spaces (form data) | Meyerweb (decodes +) | No | Encode and decode option |
| Error detail | Not seen | Generic | Names the malformed `%` sequence |
| Query-parameter table | Not seen | No | Yes |
| Charset / per-line | URLEncoder.org | No | Backlog |

## Regex tester

Competitors: regex101, RegExr, Coddy, OpenReplay.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| Live highlighting | All | Yes, via `innerHTML` (XSS: HTML in the test string executed) | Rendered as React text nodes; XSS test added |
| Capture groups | All | Numbered only | Numbered + named groups, positions |
| Flags | All | g i m s u y (re-test via `setTimeout`) | g i m s u y, `/pattern/flags` literal paste |
| Replace preview | regex101 (Substitution) | No | Yes (`$1`, `$<name>`, `$&`) |
| Invalid pattern message | All | Yes | Yes, shown instantly |
| Catastrophic backtracking guard | regex101 reports it | No | Nested-quantifier detection pauses live matching (Run once), 200k char / 2,000 match caps |
| Explanation, flavours, permalinks, library | regex101, RegExr | No | Backlog |

Note: a true timeout needs a Web Worker. The site CSP (`public/.htaccess`) has no `worker-src`, so it falls back
to `script-src`, which does not allow `blob:` workers. A worker file under `public/` (or `worker-src 'self' blob:`)
would be needed; recorded in the backlog.

## UUID generator

Competitors: UUIDTools.com, GUIDGenerator.com, FastUUID, CodeShack.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| v4 | All | `crypto.randomUUID` with a `Math.random` fallback | Web Crypto only (`randomUUID` / `getRandomValues`); test asserts `Math.random` unused |
| v7 | CodeShack, GUIDGenerator, FastUUID, UUIDBuilder | No | RFC 9562 v7, monotonic within a millisecond |
| v1 | FastUUID, UUIDBuilder | Malformed (wrong field layout, `Math.random`) | RFC 9562 v1 with random multicast node |
| Bulk | Up to 1,000 (GUIDGenerator, FastUUID) | 100 | 1,000 |
| Format options | GUIDGenerator | No | Uppercase, hyphens, braces |
| Download | FastUUID (TXT/JSON/CSV), UUIDBuilder | No | .txt |
| Validate | UUIDTools | Regex only | Version, variant, Nil/Max, v7 timestamp |
| v3/v5, ULID, NanoID | FastUUID, GUIDGenerator | No | Backlog |

## JWT decoder

Competitors: jwt.io, jwt.ms, FusionAuth, Logto.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| Decode header / payload | All | On button click | Live as you paste; `Bearer ` stripped |
| Base64URL + UTF-8 | All | Converted `-`/`_`, no validation | Strict alphabet check, UTF-8 `fatal` decoding, part-specific errors |
| Claims / timestamps | jwt.io | Rendered claims directly; object/array claims (e.g. `aud: [...]`) crashed React | Claims table, ISO + relative times, expired / not-yet-valid status |
| "Not verified" disclosure | Varies | Small footnote | Prominent `role="note"` banner and "(not verified)" on the signature |
| alg none / JWE | Not seen | No | Warnings |
| Signature verification, encoding | jwt.io, Logto, SuperTokens | No | Backlog (Web Crypto HMAC/RSA) |

## SQL formatter

Competitors: sqlformat.org, dpriver Instant SQL Formatter, Redgate, CodeBeautify, Aiven.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| Dialects | Aiven, dpriver (30+) | 8 listed; "SQL Server" passed `mssql`, which sql-formatter 15 rejects, so it always errored | 14 valid dialects incl. T-SQL, BigQuery, Snowflake, Redshift, Spark, Trino, DuckDB |
| Keyword case | Most | No | Upper / lower / preserve |
| Indentation | Most | 1–8 spaces slider | 2 / 4 / tab |
| Minify | CodeBeautify | Collapsed whitespace inside strings; `--` comments swallowed the rest of the query | Tokenizer-aware minify |
| File / download | CodeBeautify | No | Open .sql, download |
| Style presets, code-string conversion | Redgate, dpriver | No | Backlog |

## CSS formatter

Competitors: CSS Portal, CodeBeautify, CodeShack, 10015.io, CleanCSS.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| Beautify | All | Regex: `a:hover` became `a: hover`, `url(https://…)` became `url(https: //…)`, strings with `;`/`{` split | Tokenizer that understands comments, strings and parentheses |
| Minify | All | Same regex issues | Safe minify, keeps `/*! */` comments, shows saving |
| Brace checking | CodeShack | No | Unbalanced braces, unclosed comments/strings, missing colons with line numbers |
| Nesting / @media | CSS Portal | Partly | Indented by level |
| File / download | CodeShack, CodeBeautify | No | Yes |
| Highlighting, property sorting, URL load | CleanCSS, CSS Portal, CodeBeautify | No | Backlog |

## HTML formatter

Competitors: CodeShack, JSONFormatter.org, Formatter.org, Static.app.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| Beautify | All | Broken: inserted newlines, then collapsed all whitespace, so output was one line | Tokenizer-based indenting; short inline content kept on one line |
| pre / script / style | Formatter.org formats embedded code | Collapsed | pre/textarea preserved; script/style re-indented |
| Minify | CodeShack | Removed meaningful spaces between inline tags | Keeps inline spacing, drops comments |
| Validation | Not seen | No | Unclosed / mismatched / stray tags with line numbers |
| Embedded CSS/JS formatting, attribute wrapping, preview | Formatter.org, WordToHTML | No | Backlog |

## Markdown preview

Competitors: Dillinger, Markdown Live Preview, MarkdownViewer.dev, Coddy.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| Live split preview | All | Yes | Yes |
| Safe rendering | Not stated | Unsanitised `marked` output: `<img onerror>`, `<script>` in SVG and `javascript:` links executed (XSS) | DOMParser + allow-list sanitiser; tests for onerror, script, iframe, svg, javascript: links |
| Page structure | n/a | `# Hello World` rendered a second page H1 (intermittent registry failure) | Preview shifts headings one level inside `role="document"`; exported HTML keeps original levels |
| Export HTML | All | Copy only | Copy, download standalone .html, HTML code view |
| Import / save .md | Markdown Live Preview, Dillinger | No | Open .md, download .md |
| PDF export, Mermaid, math, cloud sync | Dillinger, MarkdownViewer, Markdown Live Preview | No | Backlog |

## Implemented from this comparison

JSON sort keys, file open/download across formatters, Base64URL and file/data-URI encoding, URL form mode and
parameter table, regex replace preview and named groups, UUID v7/v1 and bulk 1,000 with formatting, JWT expiry
status and live decoding, SQL keyword case and extra dialects, CSS/HTML syntax warnings, Markdown .md import and
.html export. Security and correctness fixes are listed in each table.

## Backlog

- JSON: tree view, JSON to CSV/XML, load from URL, JSONPath filter, highlighted output.
- Base64: other charsets, per-line decoding, image preview.
- URL: per-line mode, other charsets, strict RFC 3986 option.
- Regex: token explanation, other flavours, permalinks, Web Worker timeout (needs CSP `worker-src`).
- UUID: v3/v5, ULID, NanoID, JSON/CSV export.
- JWT: signature verification with Web Crypto, token encoder, coloured segments.
- SQL: syntax highlighting, style presets, SQL-to-code strings.
- CSS: syntax highlighting, property sorting, URL load, advanced minification.
- HTML: embedded CSS/JS formatting, attribute wrapping, sandboxed preview, highlighting.
- Markdown: code highlighting, PDF export, Mermaid/math, autosave, scroll sync.

## Sources

- JSON: https://jsonformatter.org/, https://jsoneditoronline.org/, https://codebeautify.org/jsonviewer, https://jam.dev/utilities/json-formatter, https://reqbin.com/json-formatter
- Base64: https://www.base64decode.org/, https://www.base64encode.org/, https://jam.dev/utilities/base-64-encoder, https://www.64baser.com/, https://coddy.tech/tools/base64
- URL: https://www.urlencoder.org/, https://www.urldecoder.org/, https://meyerweb.com/eric/tools/dencoder/, https://jam.dev/utilities/url-encoder, https://www.zoho.com/toolkit/encode-decode.html, https://www.urldecoder.io/
- Regex: https://regex101.com/, https://regexr.com/, https://coddy.tech/tools/regex-tester, https://openreplay.com/tools/regex-tester/, https://mergify.com/blog/regex101-guide-to-the-regex-tester
- UUID: https://www.uuidtools.com/v4, https://guidgenerator.com/, https://fastuuid.com/, https://codeshack.io/uuid-generator/, https://uuidbuilder.com/
- JWT: https://www.jwt.io/, https://jwt.ms/, https://fusionauth.io/docs/dev-tools/jwt-decoder, https://logto.io/jwt-decoder, https://supertokens.com/jwt-encoder-decoder
- SQL: https://sqlformat.org/, https://www.dpriver.com/pp/sqlformat.htm, https://www.red-gate.com/website/sql-formatter/, https://codebeautify.org/sqlformatter, https://aiven.io/tools/sql-formatter
- CSS: https://www.cssportal.com/css-formatter/, https://codebeautify.org/css-beautify-minify, https://codeshack.io/css-formatter/, https://10015.io/tools/css-formatter, https://www.cleancss.com/css-beautify/
- HTML: https://codeshack.io/html-formatter/, https://jsonformatter.org/html-formatter, https://formatter.org/html-formatter, https://static.app/html-formatter, https://wordtohtml.net/html/prettify-format
- Markdown: https://dillinger.io/, https://markdownlivepreview.dev/, https://markdownviewer.dev/, https://coddy.tech/tools/markdown-editor
