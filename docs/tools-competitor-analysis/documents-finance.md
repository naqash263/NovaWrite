# Documents & finance tools: competitor analysis and QA (reviewed 2026-09-24)

Hub: `/resources/utility-tools` (categories `documents` and `finance`). Tools: PDF merger, PDF splitter,
PDF compressor, PDF rotate, document converter, file converter, Excel CSV converter, loan calculator,
tip calculator, compound interest calculator.

Processing: the four PDF tools, the file converter and the three calculators run entirely in the browser
(`pdf-lib` for PDFs; no network calls in the components). The document converter and the Excel CSV
converter upload the file to the Laravel API (`POST /api/utility-tools/{document|excel-csv}-converter/convert`),
which stores the converted file under `storage/app/public/converted-*` and returns a download URL. Their
`processing` is now `server` (it was wrongly `browser`).

Research: competitor facts come from web search result snippets. Direct page fetches (e.g. calculator.net)
were blocked by the research environment's egress proxy, so only capabilities stated in the results below are
recorded, and claims are kept generic.

## Cross-cutting fixes

| Issue found | Fix |
| --- | --- |
| Every component repeated the page template: H2 "Free X Online", the SEO description, About / Use cases / Key features / FAQ / Tips blocks (with h3-h5 headings) | Removed. Remaining headings are h2 |
| Unlabelled inputs and selects (labels without `htmlFor`) | All controls labelled; radio groups use `fieldset`/`legend`; icon buttons have `aria-label`; toggle buttons use `aria-pressed` |
| Errors not announced | Error boxes use `role="alert"`, results `role="status"` / `aria-live` |
| PDF inputs rejected files with an empty MIME type (common on some OSs and with drag-and-drop) | Accepted by `.pdf` extension as well |
| Calculators stored numbers, so clearing a field snapped back to 0 or 1 and negative values were accepted | Inputs keep the typed string; values are validated with inline messages, `aria-invalid`, and results are hidden until valid |

## PDF merger

| Capability | Competitors (iLovePDF, Smallpdf, Adobe, PDF24, PDFgear) | This tool before | This tool now |
| --- | --- | --- | --- |
| Drag-and-drop upload | Yes | No (label said "drag to reorder" but nothing was draggable) | Yes |
| Reorder files | Yes | Up/down buttons only | Drag-to-reorder plus accessible up/down/remove buttons |
| Error for unreadable files | Yes | Message was cleared immediately (`setError('')` after the loop) | Per-file messages kept |
| File limit | Varies | "Max 50" shown but not enforced | Enforced with message |
| No upload / no watermark | PDFgear, Drawboard: in-browser; others upload | In-browser | In-browser |
| Page thumbnails, page-level reorder | Yes | No | Backlog |

Bugs fixed: error message for corrupted/encrypted files was never shown; object URLs leaked; list used index keys.
Backlog: page thumbnails, keeping bookmarks from source files, cloud import.

## PDF splitter

| Capability | Competitors (iLovePDF, Smallpdf, Adobe, Xodo, PDF Resizer) | This tool before | This tool now |
| --- | --- | --- | --- |
| One file per page | Yes | Yes | Yes |
| Extract selected pages to one file | Yes | Yes | Yes (document order, duplicates removed) |
| Split by custom ranges (file per range) | iLovePDF | "Range" and "Specific pages" modes did the same thing (one file) | Each range becomes its own PDF |
| Split every N pages | iLovePDF fixed ranges | No | Yes |
| Open-ended range (8-) and clear validation | Varies | Generic "Invalid page range" | Specific messages (out of range, reversed, malformed) |
| ZIP download | PDF Resizer, iLovePDF | Sequential downloads | Sequential downloads (ZIP in backlog) |

Backlog: thumbnails with click-to-select, ZIP download, split by size or bookmarks.

## PDF compressor

| Capability | Competitors (Smallpdf, iLovePDF, Adobe, PDF24, PDFgear) | This tool before | This tool now |
| --- | --- | --- | --- |
| Compression levels | Yes (Smallpdf: Basic free, Strong/Moderate Pro) | Low/medium/high buttons had **no effect**; only pages were copied and saved with object streams | Levels map to JPEG quality 85/70/50% and max image size full/2000/1400 px |
| Image recompression | Yes ("images are what compression shrinks") | No | JPEG (DCTDecode, RGB/Gray/ICC 1-3 components, 8-bit) images re-encoded via canvas; only replaced if at least 5% smaller |
| Before/after size | Yes | Yes, but could show negative "reduction" and offer a bigger file | Shows saving; if nothing got smaller it says so and offers no download |
| Keeps bookmarks/forms | Yes | No (pages copied into a new document) | Document edited in place |
| Non-JPEG images, grayscale, target size | Some | No | Backlog |

Honesty: content states that text-only PDFs shrink little and that the tool re-encodes JPEG images only.
Test: a 2400x1800 JPEG at 97% quality embedded in a PDF shrinks by more than 40% at the Strong level.

## PDF rotate

| Capability | Competitors (Smallpdf, Adobe, Sejda, PDF24, APITemplate) | This tool before | This tool now |
| --- | --- | --- | --- |
| 90° left/right, 180° | Yes | Yes (labelled 90/180/270) | Yes, labelled 90° right / 180° / 90° left |
| All or specific pages | Yes | Yes | Yes |
| Odd / even pages | Some | No | Yes |
| Existing rotation respected | Yes | Added, but could produce 360/450 | Normalised to 0-270 |
| Stale download after changing options | n/a | Old file stayed downloadable | Cleared on any option change |
| Per-page thumbnails with rotate buttons | Yes | No | Backlog |

## Document converter (server)

| Capability | Competitors (Smallpdf, Adobe, PDFgear, Canva, iLovePDF) | This tool before | This tool now |
| --- | --- | --- | --- |
| Layout-preserving Word to PDF / PDF to Word | Yes ("keeps formatting, fonts, layout") | Claimed; the backend actually converts extracted text only (PhpWord/Dompdf) | Stated honestly: text only, no layout/images/tables |
| OCR for scanned PDFs | Some | No | No (stated in FAQ); backlog |
| Error handling | Yes | `response.json()` crashed on HTML error pages; Laravel field errors hidden | Safe parsing; field errors, 413 and network failures shown |
| Pre-upload validation | Yes | Extension only | Extension, empty file and 10 MB limit checked before upload |
| DOC input | Yes | DOC treated as DOCX in the UI, so the target list was wrong | DOC shown separately with supported targets (PDF, TXT) |
| Privacy claims | Auto-deletion common | "Files are automatically deleted after processing" (false: no cleanup exists) | "The converted file is saved on the server; do not upload confidential documents" |

Backlog: layout-preserving conversion (e.g. LibreOffice headless), OCR, scheduled deletion of
`converted-documents/`, client-side TXT to PDF.

## Excel CSV converter (server)

| Capability | Competitors (TableConvert, CloudConvert, Zamzar, ConvertSimple, xlsx-to-csv.com) | This tool before | This tool now |
| --- | --- | --- | --- |
| XLSX/XLS to CSV, CSV to XLSX | Yes | Yes | Yes |
| In-browser processing | TableConvert, ConvertSimple, xlsx-to-csv.com | Server | Server (backlog: no client-side XLSX library is installed) |
| Worksheet picker | xlsx-to-csv.com (multiple sheets) | Active sheet only, not explained | Active sheet only, explained in UI and FAQ; picker in backlog |
| Error handling / validation | Yes | Same issues as the document converter | Fixed as above |

Backend bug found (not fixed, outside this batch's files): `ExcelCsvConverterController::excelToCsv` loops
`for ($col = 'A'; $col <= $highestColumn; $col++)`, which compares column letters as strings. With a highest
column of `AB` only column A is exported; with `Z` the loop runs on to `YZ`, adding hundreds of empty columns.
Fix: iterate numeric indexes with `Coordinate::columnIndexFromString()` / `stringFromColumnIndex()`, or use
`$worksheet->toArray()`. Also `csvToExcel` uses `fgetcsv` with a comma only.

## File converter (browser)

| Capability | Competitors (I Hate Converter, CSV Tools, CodeBeautify, MeTool) | This tool before | This tool now |
| --- | --- | --- | --- |
| Paste input, live preview | Yes | Upload only; Convert button | Paste or upload; converts as you type |
| CSV parsing | Proper RFC 4180 | Split on commas and `\n` (quoted commas, quotes, CRLF broke) | RFC 4180 parser; comma/semicolon/tab auto-detected; BOM stripped |
| CSV output | Escaped | Only values with commas were quoted; quotes/newlines corrupted | Fully escaped; header union across rows; nested values as JSON |
| XML output | Valid XML | No escaping (`&`, `<` produced invalid XML); keys with spaces made invalid tags | Escaped text/attributes, safe tag names, `@attr` round-trip |
| YAML | Bidirectional | Output unquoted/incorrect for special strings; input "not supported" | Correct quoting; YAML input still backlog (stated in FAQ) |
| HTML input | Varies | Treated as a single string | First table converted to rows, otherwise text lines |
| Copy / download | Yes | Download only, `text/plain`, filename cut at first dot | Copy button; correct MIME type and extension (`users.v2.json` -> `users.v2.csv`) |
| Format detection | Yes | Any text starting with `<` was XML, so HTML was never detected | HTML checked before XML; manual override |

Backlog: YAML/TOML input, output delimiter choice, flattening nested JSON into dotted columns.

## Loan calculator

| Capability | Competitors (Calculator.net, Bankrate, U.S. Bank, TheCalculatorSite, PNC) | This tool before | This tool now |
| --- | --- | --- | --- |
| Payment, total interest | Yes | Yes | Yes (verified: 100,000 at 5%, 30 y = $536.82, interest $93,255.78) |
| Full amortization schedule | Yes (monthly/annual) | First 12 payments only | By year or every payment |
| Extra payments | Yes | No | Extra payment per period with interest saved and earlier payoff |
| Export | Printable schedules | No | CSV download |
| Chart | Yes | No | Backlog |
| Currency | Varies | USD only | 8 currencies |

Bugs fixed: cleared inputs snapped to 0/1; negative amounts accepted; "per biweek" label; very large terms
could build huge schedules (term now limited to 50 years).

## Tip calculator

| Capability | Competitors (Calculator.net, Pearson, TipCalculator.us.com, MortgageCalculator.org) | This tool before | This tool now |
| --- | --- | --- | --- |
| Preset and custom tip % | Yes | Presets; **custom % was added as a currency amount** (25% on $100 gave a $25 tip only by coincidence; 25% on $80 gave $25) | Custom % applied as a percentage |
| Split bill | Yes | Per-person panel hidden for 1 person; people field could not be cleared | Always shown; stepper buttons; validation |
| Tip on pre-tax amount | Pearson and others ("decide whether to tip on tax") | No | Optional tax field |
| Rounding | Yes | Rounded tip per person and total per person independently (inconsistent totals) | Rounds each share up; tip and effective % recomputed |

Verified: 15% of 80 split 4 = $3.00 tip each, $23.00 each. Backlog: uneven/per-item splits, round total instead of shares.

## Compound interest calculator

| Capability | Competitors (Investor.gov, Bankrate, MoneyGeek, Daily Calcs) | This tool before | This tool now |
| --- | --- | --- | --- |
| Compound formula, frequencies | Yes | Yes | Yes (verified: 1,000 at 5% yearly, 10 y = $1,628.89; monthly = $1,647.01) |
| Regular contributions | Yes (Investor.gov monthly) | Contribution growth **ignored the compounding frequency** (always r/12 or r) | Per-contribution rate derived from compounding: (1 + r/n)^(n/p) - 1 |
| Contribution timing | Some | End only | Start or end of period |
| Year-by-year table | Yes | No | Yes |
| APY | Some | No | Yes |
| Chart, rate-range scenarios | Investor.gov (interest rate variance) | No | Backlog |

## Tests

`frontend/e2e/tools/documents-finance.spec.ts`: 24 tests (23 desktop functional + 1 `@mobile` overflow check).
PDF fixtures are generated with pdf-lib; downloads are reopened to assert page counts, page order (distinct
page widths) and rotation angles. The server converters are mocked with `page.route()`.

## Sources

- https://www.ilovepdf.com/merge_pdf
- https://smallpdf.com/merge-pdf
- https://www.adobe.com/acrobat/online/merge-pdf.html
- https://tools.pdf24.org/en/merge-pdf
- https://www.pdfgear.com/merge-pdf/
- https://www.drawboard.com/tools/merge-pdfs
- https://www.ilovepdf.com/split_pdf
- https://xodo.com/split-pdf
- https://www.adobe.com/acrobat/online/split-pdf.html
- https://pdfresizer.com/split
- https://smallpdf.com/compress-pdf
- https://www.adobe.com/acrobat/online/compress-pdf.html
- https://www.pdfgear.com/compress-pdf/
- https://tools.pdf24.org/en/compress-pdf
- https://www.sejda.com/rotate-pdf-pages
- https://smallpdf.com/rotate-pdf
- https://apitemplate.io/pdf-tools/rotate-pdf/
- https://tools.pdf24.org/en/rotate-pdf-pages
- https://smallpdf.com/word-to-pdf
- https://www.pdfgear.com/word-to-pdf/
- https://www.adobe.com/acrobat/online/word-to-pdf.html
- https://www.canva.com/features/word-to-pdf-converter/
- https://tableconvert.com/excel-to-csv
- https://cloudconvert.com/xlsx-to-csv
- https://www.zamzar.com/convert/xlsx-to-csv/
- https://www.convertsimple.com/convert-xlsx-to-csv/
- https://xlsx-to-csv.com/
- https://ihateconverter.com/data-converter/
- https://csvtools.com/csv-converter/
- https://codebeautify.org/yaml-to-json-xml-csv
- https://metool.online/dev/jsonConvert/
- https://www.calculator.net/amortization-calculator.html
- https://www.bankrate.com/mortgages/amortization-calculator/
- https://www.usbank.com/home-loans/mortgage/mortgage-calculators/amortization-calculator.html
- https://www.thecalculatorsite.com/finance/calculators/amortization-calculator.php
- https://www.calculator.net/tip-calculator.html
- https://www.pearson.com/channels/calculators/tip-calculator
- https://tipcalculator.us.com/
- https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator
- https://www.bankrate.com/banking/savings/compound-savings-calculator/
- https://www.moneygeek.com/resources/compound-interest-calculator/
- https://dailycalcs.com/en-us/calculators/compound-interest/
- https://www.mortgagecalculator.org/calcs/tipping.php
