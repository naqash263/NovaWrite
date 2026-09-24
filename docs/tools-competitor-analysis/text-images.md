# Text, security and image tools: competitor analysis and QA (reviewed 2026-09-24)

Hub: `/resources/utility-tools`. Tools: password generator, hash generator, word counter, text case converter,
lorem ipsum generator, token counter, image resizer, image compressor, image format converter, WebP & AVIF
converter, colour picker, text to image, QR code generator.

Content lives in `frontend/src/data/tools/utility-text-images.ts`. Tests are in `frontend/e2e/tools/text-images.spec.ts`.

The research environment's egress proxy blocked `WebFetch` for every competitor page (bitwarden.com, convertcase.net,
gptforwork.com, wordcounter.io, lipsum.com, tinypng.com and others). Competitor capabilities therefore come from the
search-result snippets listed under Sources, plus a few widely known features of those products. Nothing else is recorded.

## Cross-cutting findings (all 13 tools)

| Issue found | Fix |
| --- | --- |
| Each component repeated the page template: a "Free X Online" H2, the SEO paragraph, and About / Use cases / Features / FAQ / Tips blocks. Some of these used h3–h5 without an h2 | Removed. Headings left inside components are h2 or h3 |
| File pickers were styled `<label>`s (compressor, hash) or bare native inputs. A label can't take keyboard focus, so the registry check "a visible interactive control exists" failed | Each file picker is now a real `<button>` that opens a visually hidden input, plus a drag-and-drop zone |
| Three tools (resizer, compressor, text to image) had a "Use API" option, and the WebP converter always uploaded images to the Laravel backend, which stored them. Every page still claimed "All processing in your browser" | All four now run only in the browser. `processing: 'browser'` is now true for all 13 tools |
| `alert()` pop-ups for copy and errors | Inline `aria-live` messages, plus `role="alert"` for errors. `role="status"` is not used because the page keeps it for the lazy-load spinner |
| Controls had no labels | Every input, select and textarea has a label (`htmlFor`/`id` or a wrapping label). Toggle buttons use `aria-pressed` |
| Wide fixed grids on phones (text to image colour row, for example) | Stacked on small screens. No horizontal overflow at 390 px (tested for every tool) |

## Password generator

Competitors: Bitwarden, 1Password, LastPass, ESET, Norton.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| Cryptographically secure randomness | Implied by all; ESET states local-only | **No**: `Math.random()`, even though the FAQ said "cryptographically secure" | `crypto.getRandomValues` with rejection sampling (no modulo bias) |
| Length range | Bitwarden 5–128 | 4–128 slider | 4–128 slider + number box |
| Character sets and exclusions | All | Yes, but a selected set could be missing from the result | Each selected set is guaranteed to appear. Excludes look-alikes and hard-to-type symbols |
| Strength indicator | Most | Checklist score | Entropy in bits, with a label |
| Passphrase mode | Bitwarden, 1Password | No | Backlog |
| Bulk generation | Some | No | Up to 50, with Copy all |
| Auto-generate | Most | No, the field started empty | Generates on load and when any option changes |

The test forces `Math.random` to return 0 and checks that consecutive passwords still differ.

## Hash generator

Competitors: Userback, Coddy, hashgenerator.co, RandomKeygen, DevToolLab.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| MD5 | All | Printed "MD5 is not supported" | Built-in RFC 1321 implementation (tested against Node's `crypto`) |
| SHA-1 / SHA-256 / SHA-512 | All | Yes, one at a time | Yes, all at once |
| SHA-384 | Coddy | No | Yes |
| HMAC, SHA-3, BLAKE2b | hashgenerator.co | No | Backlog |
| bcrypt | RandomKeygen | No | Backlog |
| File hashing | Several | Label-based picker, not keyboard-accessible | Button + drag and drop, any file type |
| Verify a checksum | Some | No | Reports which algorithm matches |
| Edge cases | – | Whitespace-only input was ignored | Hashed as typed (UTF-8) |

Verified digests: "abc" gives MD5 900150983cd24fb0d6963f7d28e17f72, SHA-1 a9993e36…, SHA-256 ba7816bf…15ad. SHA-384/512,
unicode input, a multi-block MD5 and a file are all compared with Node's `crypto`.

## Word counter

Competitors: Grammarly, WordCounter.io, QuillBot, WordCountTool.com, Easy Word Count.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| Words, characters (with and without spaces), sentences, paragraphs | All | Yes (naive split; an emoji counted as 2 characters, CJK text as 1 word) | Unicode-aware counts (graphemes, CJK), plus lines |
| Reading and speaking time | Most | Whole minutes, rounded up | Minutes and seconds |
| Readability | WordCountTool.com | No | Flesch reading ease (English, approximate) |
| Keyword density | Some | Top words longer than 3 letters, no density | Top 10 without stop words, with % |
| Grammar / spelling | Grammarly, WordCounter.io | No | Backlog (link to AI grammar checker) |
| Page count | WordCounter.io | No | Backlog |
| Character-limit helpers | Some | No | 60 / 160 / 280 bars |
| Autosave | WordCounter.io (widely known) | No | Local-storage draft |

## Text case converter

Competitors: ConvertCase.net, CaseConverter.com, App DevTools, Prepostseo, Lexilogos.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| Upper / lower / sentence / title | All | Yes. Sentence case only split on ". " and title case only on spaces | Handles ! ? and new lines. Title Case keeps small words lowercase, and Capitalized Case is a separate option |
| Developer cases | App DevTools | camelCase lowercased the input first, so "helloWorld" → "helloworld" | Word boundaries detected (`parseHTTPResponse` → `parse_http_response`). Added CONSTANT_CASE and dot.case |
| Alternating / inverse | ConvertCase.net | Yes | Yes (alternation counts letters only) |
| Download | ConvertCase.net (widely known) | No | .txt |

## Lorem ipsum generator

Competitors: Lipsum.com, LoremIpsum.io, OpenReplay, Lorem Generator, Lorem Ipsum Generator (Chrome extension).

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| Paragraphs / sentences / words | All | Yes, via a slider (max 10 paragraphs, 100 words) | Number input (50 / 100 / 1,000) |
| Lists | Chrome extension | No | Yes |
| HTML output | OpenReplay | Only paragraphs could be copied as HTML | `<p>` or `<ul><li>`, escaped |
| Start with "Lorem ipsum…" | Lipsum.com | Paragraphs only | All units, without changing the requested count |
| By character or byte count | LoremIpsum.io, extension | No | Backlog |
| Download | – | No | .txt / .html |
| Text on load | Most | Empty until clicked | Generated on load |

## Token counter

Competitors: OpenAI Tokenizer, GPT for Work, Price Per Token, Runcell, Claude Tokenizer.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| Exact counts per model | OpenAI Tokenizer, GPT for Work | Claimed "model-specific algorithms", but every model used the same `max(chars/4, words/0.75)` formula | One estimate, clearly labelled, based on BPE pre-tokenisation rules. "Hello world" gives 2 and the pangram gives 10 (both match GPT tokenizers) |
| Token visualisation | GPT for Work | No | Backlog |
| Cost | Price Per Token | Hard-coded 2024 prices for models that are now old; the label wrongly said "per 1M tokens" | User enters the current price per 1M tokens |
| Context window check | Some | No | Usage bar with 8K–1M presets |

Honesty: the page says in both the UI and the FAQ that the result is an estimate, and points to the provider's
tokenizer or token-counting API for exact numbers. An exact tokenizer would need a new npm dependency, so it is in the backlog.

## Image resizer

Competitors: Adobe Express, Canva, ImageResizer.com, Bulk Resize Photos, Squarespace, PicResize.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| Pixels / percentage | All | Pixels only. With aspect lock the output was *larger* than requested (cover maths) | Pixels with correct lock, or 25–200% buttons |
| Social presets | Adobe Express | Yes, but it stretched the photo | 10 presets, with a Crop to fill / Fit inside / Stretch choice |
| Crop | PicResize, Squarespace | No | Centre crop (interactive crop in backlog) |
| Formats | Most | Offered "AVIF" but actually produced WebP | Original / JPEG / PNG / WebP |
| Batch | Bulk Resize Photos | No | Backlog |
| Privacy | Most are browser-based | Optional server upload | Browser only |

## Image compressor

Competitors: TinyPNG, ImageCompressor.com, iLoveIMG, Squoosh, ShortPixel.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| Accessible file picker | – | Styled `<label>`, not focusable, failed the registry check | Button + drag and drop |
| Batch | TinyPNG, iLoveIMG | No | Up to 20, with Download all and a total saving |
| Quality / format | All | Yes. JPEG transparency became black; download name `photo.jpg.jpeg` | White background; correct names |
| Never worse than the original | TinyPNG (widely known) | Could return a bigger file | Keeps the original when re-encoding would be larger |
| Resize while compressing | Squoosh | Forced max 1920×1080 by default | Optional max width |
| Before/after slider | Squoosh | No | Backlog |
| ZIP download | iLoveIMG (widely known) | No | Backlog |

## Image format converter

Competitors: CloudConvert, FreeConvert, Simple Image Resizer, OnlineImageTool.com, ezgif.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| JPG / PNG / WebP output | All | Yes | Yes |
| GIF / BMP output | Most | **Broken**: PNG bytes saved as `.gif` / `.bmp` | Real 24-bit BMP encoder. GIF output is in the backlog and not offered |
| AVIF output | CloudConvert | Produced WebP labelled `.avif` | Only enabled when the browser can encode AVIF |
| HEIC / TIFF / PDF | Simple Image Resizer, CloudConvert | No | Backlog |
| Batch | Most | No | Up to 20 |
| File names | – | `my.photo.png` → `my.jpeg` | `my.photo.jpg` |

## WebP & AVIF converter

Competitors: toWebP.io, Elementor, CloudConvert, AnyWebP, Picflow, ezgif, Squoosh.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| Privacy | toWebP.io and AnyWebP: no uploads | Every image was uploaded to the backend and stored in `storage/` | Browser only (the test asserts no upload request) |
| Quality control | ezgif (0–100) | Slider disabled ("backend optimised") | 10–100% |
| Bulk | toWebP.io, Picflow, AnyWebP | No | Up to 30 files, with totals |
| AVIF | Squoosh | Server-side | Browser-side where supported, otherwise disabled with an explanation (WASM encoder in backlog) |
| WebP → JPG/PNG | AnyWebP | No | Use the Image Format Converter (linked in related tools) |

## Colour picker

Competitors: HTML Color Codes, Figma, ImageColorPicker.com, Picsart, fffuel cccolor, RedKetchup.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| HEX / RGB / HSL | All | Yes. HSL read-only, 3-digit hex rejected | Editable HSL. 3-digit hex accepted, with a validation message |
| CMYK | Picsart | No | Yes |
| Pick from image | Figma, ImageColorPicker.com | Claimed in the intro, but missing | Click-to-pick on a canvas, plus 6 dominant colours |
| Screen eyedropper | – | No | EyeDropper API where supported |
| Harmonies / palettes | HTML Color Codes, Figma | Five darker shades as clickable `<div>`s | Tints, shades, complementary, analogous and triadic swatches, all focusable buttons |
| Contrast check | – | No | WCAG 2 ratio vs white and black, with AA/AAA result |
| OKLCH, alpha | HTML Color Codes, cccolor | No | Backlog |

## Text to image

Competitors: Canva, PixTeller, Make It a Quote, text.imageonline.co, QuotesCover.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| Size presets | Make It a Quote | Yes | Yes. Custom size limited to 100–5000 px |
| Fonts | imageonline 100+, PixTeller 120+ | 14 system fonts | Same (web fonts in backlog) |
| Background photo | Canva, imageonline | Stretched to fit; native file input | Cropped to fill; button + drag and drop |
| Rich text | – | HTML mode parsed with `innerHTML`, so `<img onerror>` would run | Parsed with `DOMParser` (inert). The test checks that no script runs |
| Line breaks | – | Plain text ignored new lines | Kept |
| Download | All | PNG | PNG and JPG |
| Templates | Canva | Colour presets only | Backlog |

## QR code generator

Competitors: QR Code Generator (qr-code-generator.com), QRStuff, QR Planet, TEC-IT, 4qrcode, GenQRCode.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| Content types | URL, text, Wi-Fi, vCard, email, SMS (all) | Raw text + templates with placeholder values; special characters not escaped | Forms for URL/text, Wi-Fi, email, phone, SMS and vCard, with correct escaping |
| Colours, size, error correction | All | Yes. Invalid colour or oversized data left a stale image, with the error hidden | Validation, a visible error, and low-contrast / inverted warnings |
| PNG / SVG | All | Yes | Yes. PNG up to 2048 px. Copy image to clipboard |
| Logo, styles | Most | No | Backlog |
| Dynamic codes with scan tracking | QRStuff | No | Out of scope (static only; the FAQ explains UTM tracking) |

## Backlog summary (larger gaps, not built)

- Password generator: passphrase mode with a large word list; minimum digits/symbols.
- Hash generator: HMAC, SHA-3/BLAKE2b, bcrypt/Argon2, streaming for very large files.
- Word counter: grammar/spelling, page count, word goals, file upload.
- Token counter: exact tokenizer (needs a new dependency such as a JS tiktoken port) and a token visualiser.
- Images: ZIP download for batches, before/after slider, lossy PNG quantisation, batch resize, interactive crop,
  GIF/ICO/PDF output, HEIC/TIFF input, WASM AVIF encoder.
- Colour picker: OKLCH, alpha, saved palettes.
- Text to image: web fonts, templates, drag-to-position text.
- QR: logo, dot/eye styles, QR reader.

## Sources

- https://bitwarden.com/password-generator/, https://community.bitwarden.com/t/avoid-arbitrary-length-restrictions-in-generator/75764, https://1password.com/password-generator, https://www.lastpass.com/features/password-generator, https://www.eset.com/us/password-generator/, https://us.norton.com/feature/password-generator
- https://userback.io/tools/hash-generator/, https://coddy.tech/tools/hash-generator, https://hashgenerator.co/, https://randomkeygen.com/hash-generator, https://devtoollab.com/tools/hash-generator
- https://www.grammarly.com/word-counter, https://wordcounter.io/, https://quillbot.com/word-counter, https://www.wordcounttool.com/, https://easywordcount.com/
- https://convertcase.net/, https://www.caseconverter.com/, https://appdevtools.com/case-converter, https://www.prepostseo.com/tool/case-converter, https://www.lexilogos.com/keyboard/case.htm
- https://www.lipsum.com/, https://loremipsum.io/generator/, https://openreplay.com/tools/lorem-ipsum-generator/, https://loremgenerator.io/, https://chromewebstore.google.com/detail/lorem-ipsum-generator/pglahbfamjiifnafcicdibiiabpakkkb
- https://gptforwork.com/tools/tokenizer, https://pricepertoken.com/token-counter, https://www.runcell.dev/tool/token-counter, https://www.claudetokenizer.com/, https://developers.openai.com/api/docs/guides/token-counting, https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them, https://platform.claude.com/docs/en/build-with-claude/token-counting
- https://www.adobe.com/express/feature/image/resize, https://www.canva.com/features/image-resizer/, https://imageresizer.com/, https://bulkresizephotos.com/en, https://www.squarespace.com/tools/image-resizer, https://picresize.com/
- https://tinypng.com/, https://imagecompressor.com/, https://www.iloveimg.com/compress-image, https://shortpixel.com/online-image-compression, https://nologin.tools/blog/squoosh-free-image-compression-guide/, https://www.dreamhost.com/blog/optimize-images-squoosh-app/
- https://cloudconvert.com/webp-converter, https://www.freeconvert.com/jpg-to-webp, https://www.simpleimageresizer.com/image-converter, https://www.onlineimagetool.com/en/convert-png-jpg-webp-gif, https://ezgif.com/jpg-to-webp
- https://towebp.io/, https://elementor.com/tools/webp-converter/, https://anywebp.com/, https://picflow.com/convert/jpg-to-webp
- https://htmlcolorcodes.com/color-picker/, https://www.figma.com/color-picker/, https://imagecolorpicker.com/, https://picsart.com/colors/color-picker/, https://www.fffuel.co/cccolor/, https://redketchup.io/color-picker
- https://text.imageonline.co/, https://www.canva.com/create/quote-posters/, https://pixteller.com/quote-maker, https://makeitaquote.ai/, https://quotescover.com/
- https://www.qr-code-generator.com/, https://www.qrstuff.com/, https://qrplanet.com/, https://qrcode.tec-it.com/en/VCard, https://4qrcode.com/generator/vcard-qr-code.php
