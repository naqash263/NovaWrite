// Tool content for the "utility-text-images" batch. See ./types.ts for field rules.
// Competitor research and QA notes: docs/tools-competitor-analysis/text-images.md
import type { ToolContent } from './types';

export const utilityTextImagesTools: ToolContent[] = [
  {
    slug: 'password-generator',
    legacyId: 'password-generator',
    hub: 'utility-tools',
    category: 'security',
    name: 'Password Generator',
    icon: '🔐',
    summary: 'Create strong random passwords with crypto-secure randomness, entropy meter and bulk output',
    seoTitle: 'Password Generator: Strong Random Passwords',
    seoDescription:
      'Generate strong random passwords in your browser with crypto-secure randomness. Choose length, character types and bulk output. Nothing is stored.',
    keywords: [
      'password generator',
      'strong password generator',
      'random password generator',
      'secure password generator online',
      'generate password',
      'bulk password generator',
    ],
    answer:
      'A password generator creates random passwords that are hard to guess or crack. This free tool uses your browser’s Web Crypto API (crypto.getRandomValues) to build passwords from 4 to 128 characters with the letters, numbers and symbols you choose, shows an entropy-based strength estimate and can create up to 50 passwords at once. Nothing is sent to a server or stored.',
    howTo: [
      'Set the password length with the slider or number box (16 or more is recommended).',
      'Tick the character types to include and, if needed, exclude look-alike or hard-to-type characters.',
      'Choose how many passwords you need.',
      'Click Generate for a fresh password, then Copy (or Copy all for a list).',
    ],
    features: [
      'Cryptographically secure randomness (crypto.getRandomValues) with unbiased rejection sampling',
      'Length from 4 to 128 characters with slider and number input',
      'Uppercase, lowercase, number and symbol sets, with at least one character from every selected set',
      'Options to exclude look-alike characters (i, l, 1, O, 0) and hard-to-type symbols',
      'Strength meter based on estimated entropy in bits',
      'Bulk generation of up to 50 passwords with Copy all',
    ],
    faqs: [
      {
        question: 'Is this password generator safe to use?',
        answer:
          'Yes. Passwords are created on your device with crypto.getRandomValues, the browser’s cryptographically secure random number generator. They are never sent over the network or saved, and a new one is generated every time you change an option.',
      },
      {
        question: 'How long should my password be?',
        answer:
          'For online accounts use at least 16 random characters from all four character types. With the default 90-character set, 16 characters give roughly 104 bits of entropy, far beyond what can be brute-forced. Store it in a password manager rather than memorising it.',
      },
      {
        question: 'What does “bits of entropy” mean?',
        answer:
          'Entropy measures how many guesses an attacker would need: each extra bit doubles the work. It is calculated as length × log2(number of possible characters), so adding length raises strength faster than adding symbols.',
      },
      {
        question: 'Why exclude similar-looking characters?',
        answer:
          'Characters such as l, 1, I, O and 0 are easy to confuse when a password is read aloud or typed from paper. Excluding them makes passwords easier to transcribe at the cost of a slightly smaller character set.',
      },
    ],
    related: ['hash-generator', 'uuid-generator', 'qr-code-generator', 'base64-encoder'],
    processing: 'browser',
    comparison: {
      competitors: ['Bitwarden Password Generator', '1Password Password Generator', 'LastPass Password Generator', 'ESET Password Generator'],
      commonFeatures: [
        'Length slider (Bitwarden: 5–128 characters)',
        'Uppercase, lowercase, number and symbol toggles',
        'Passphrase (word-based) mode (Bitwarden, 1Password)',
        'One-click copy',
        'Local generation with nothing stored (stated by ESET)',
      ],
      implemented: [
        'Replaced Math.random with crypto.getRandomValues and rejection sampling',
        'Guaranteed at least one character from each selected set',
        'Entropy-based strength meter (bits) instead of a checklist score',
        'Bulk generation (up to 50) with Copy all',
        'Password generated on load and whenever options change',
        'Inline copy confirmation instead of a blocking alert',
        'Labelled length slider and number box; error message when no character type is selected',
      ],
      backlog: ['Passphrase mode with a large word list (e.g. EFF diceware)', 'Minimum numbers / symbols settings', 'Session-only history of generated passwords'],
      advantages: [
        'Runs entirely in your browser: passwords are never sent or stored',
        'Shows estimated entropy in bits, not just a label',
        'Generates up to 50 passwords at once',
      ],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'qr-code-generator',
    legacyId: 'qr-code-generator',
    hub: 'utility-tools',
    category: 'images',
    name: 'QR Code Generator',
    icon: '📱',
    summary: 'Create static QR codes for links, Wi-Fi, email, SMS and vCards, then download PNG or SVG',
    seoTitle: 'QR Code Generator: URL, Wi-Fi, vCard & More',
    seoDescription:
      'Create free static QR codes for links, text, Wi-Fi, email, phone, SMS and contact cards. Pick colours and error correction, then download PNG or SVG.',
    keywords: ['qr code generator', 'free qr code generator', 'wifi qr code generator', 'vcard qr code', 'qr code svg', 'create qr code for link'],
    answer:
      'A QR code generator encodes a link or other data into a square barcode that phone cameras can scan. This free tool creates static QR codes for URLs, text, Wi-Fi logins, email, phone, SMS and vCard contacts, with custom colours, size, quiet zone and error correction, and exports PNG or SVG. The codes never expire and are made in your browser.',
    howTo: [
      'Choose a QR code type, such as URL / Text or Wi-Fi.',
      'Fill in the fields; the preview updates as you type.',
      'Adjust colours, PNG size, quiet zone and error correction under Design and size.',
      'Click Download PNG, Download SVG or Copy image, and test-scan the code before printing.',
    ],
    features: [
      'Content types: URL or text, Wi-Fi, email, phone, SMS and vCard contact',
      'Wi-Fi and vCard special characters escaped automatically',
      'Custom foreground and background colours with a low-contrast warning',
      'PNG from 128 to 2048 px, plus scalable SVG download',
      'Four error-correction levels (L, M, Q, H) and adjustable quiet zone',
      'Copy the QR image to the clipboard and view the exact encoded content',
    ],
    faqs: [
      {
        question: 'Do these QR codes expire?',
        answer:
          'No. They are static QR codes: the link or text is stored in the pattern itself, so they keep working as long as the content (for example your website) exists. There is no redirect service that could be switched off.',
      },
      {
        question: 'Can I track how many people scan my QR code?',
        answer:
          'Not with this tool. Scan tracking needs a dynamic QR code that points to a redirect server which logs visits. You can add UTM parameters to your URL so your own analytics records the visits instead.',
      },
      {
        question: 'Which error correction level should I choose?',
        answer:
          'Level L restores about 7% of damaged data, M about 15%, Q about 25% and H about 30%. Medium suits screens and clean prints; choose Q or H for codes printed on rough surfaces. Higher levels make the pattern denser.',
      },
      {
        question: 'Why won’t my QR code scan?',
        answer:
          'The usual causes are low contrast, light modules on a dark background, a code printed too small or a missing quiet zone around it. Keep a dark foreground on a light background, a margin of 4 modules, and test with several phones.',
      },
    ],
    related: ['text-to-image', 'url-encoder', 'password-generator', 'image-resizer'],
    processing: 'browser',
    comparison: {
      competitors: ['QR Code Generator (qr-code-generator.com)', 'QRStuff', 'QR Planet', 'TEC-IT QR Code Generator'],
      commonFeatures: [
        'URL, text, Wi-Fi, vCard, email and SMS content types',
        'Custom colours and logos',
        'Dynamic QR codes with scan tracking (QRStuff)',
        'PNG and SVG downloads',
        'No signup for static codes',
      ],
      implemented: [
        'Form-based Wi-Fi, email, phone, SMS and vCard types with correct escaping',
        'Error shown when data is too long (previously a stale image stayed visible)',
        'Colour validation plus low-contrast and inverted-colour warnings',
        'Copy image to clipboard',
        'Encoded-content preview',
        'PNG size up to 2048 px',
      ],
      backlog: ['Logo in the centre of the code', 'Dot and eye styles', 'QR code reader (scan from camera or image)', 'Calendar event and geo-location types'],
      advantages: [
        'Generated in your browser: the content is never sent to a server',
        'Static codes with no expiry, tracking or account',
        'Shows the exact encoded text so you can check Wi-Fi and vCard data',
      ],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'image-resizer',
    legacyId: 'image-resizer',
    hub: 'utility-tools',
    category: 'images',
    name: 'Image Resizer',
    icon: '🖼️',
    summary: 'Resize images by pixels, percentage or social media size with crop, fit or stretch options',
    seoTitle: 'Image Resizer: Resize Photos to Any Size Online',
    seoDescription:
      'Resize JPG, PNG or WebP images by pixels or percentage, or to social media sizes, with crop or fit options. Runs in your browser, so photos stay private.',
    keywords: ['image resizer', 'resize image online', 'photo resizer', 'resize image to 1080x1080', 'change image size', 'resize picture online free'],
    answer:
      'An image resizer changes the pixel dimensions of a photo. This free tool resizes JPG, PNG, WebP, GIF and BMP images by exact width and height, by percentage, or to common social media sizes, with an aspect-ratio lock and a choice to crop, fit or stretch when the shape changes. Resizing happens in your browser, so images are never uploaded.',
    howTo: [
      'Click Choose image or drag a photo onto the box.',
      'Enter a width or height (the other updates while Lock aspect ratio is on), click a percentage, or pick a social media size.',
      'If the shape changes, choose Crop to fill, Fit inside or Stretch.',
      'Pick the output format and quality, check the preview, then click Download.',
    ],
    features: [
      'Resize by exact pixels (up to 10,000 px per side) or by 25–200%',
      'Aspect-ratio lock that updates width and height together',
      'Ten social media size presets, including 1080×1080, 1080×1920 and 1200×630',
      'Crop to fill, fit inside with a background colour, or stretch',
      'Output as the original format, JPEG, PNG or WebP with a quality slider',
      'Live preview with the new dimensions and file size',
    ],
    faqs: [
      {
        question: 'Does resizing reduce image quality?',
        answer:
          'Making an image smaller keeps it sharp. Enlarging it beyond its original size cannot add detail, so it will look softer; the tool warns you when you upscale. For JPEG and WebP, the quality slider also affects compression.',
      },
      {
        question: 'How do I resize without stretching the image?',
        answer:
          'Keep Lock aspect ratio switched on and change only the width or the height. When you need a different shape, such as a square, choose Crop to fill to trim the edges or Fit inside to add a background instead of distorting the photo.',
      },
      {
        question: 'What size should an Instagram post be?',
        answer:
          'The presets use 1080 × 1080 px for square posts, 1080 × 1350 px for portrait posts and 1080 × 1920 px for Stories and Reels, which are the sizes widely recommended for Instagram. Check the platform’s current guidance for special formats.',
      },
      {
        question: 'Are my photos uploaded to a server?',
        answer:
          'No. The image is decoded and redrawn on a canvas inside your browser, and the download is created locally. Nothing is sent to naqashthaheem.com or any third party.',
      },
    ],
    related: ['image-compressor', 'image-format-converter', 'webp-converter', 'text-to-image'],
    processing: 'browser',
    comparison: {
      competitors: ['Adobe Express Image Resizer', 'Canva Image Resizer', 'ImageResizer.com', 'Bulk Resize Photos', 'Squarespace Image Resizer'],
      commonFeatures: [
        'Resize by pixels or percentage',
        'Social media presets (Adobe Express covers Instagram, Facebook, X, YouTube and Pinterest)',
        'Cropping (PicResize, Squarespace)',
        'Batch resizing (Bulk Resize Photos)',
        'No account required',
      ],
      implemented: [
        'Removed the server-upload option; resizing is browser-only',
        'Fixed aspect-ratio logic that produced images larger than requested',
        'Presets no longer stretch photos: crop, fit or stretch choice',
        'Percentage buttons',
        'Removed an “AVIF” option that silently produced WebP',
        'Keyboard-accessible Choose image button with drag and drop',
        'Download file name includes the new size',
      ],
      backlog: ['Batch resize several images', 'Interactive crop area', 'Resize to a target file size (KB)'],
      advantages: ['Photos never leave your device', 'Crop, fit or stretch choice when the aspect ratio changes', 'No account, watermark or file-count limit'],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'text-to-image',
    legacyId: 'text-to-image',
    hub: 'utility-tools',
    category: 'images',
    name: 'Text to Image',
    icon: '✨',
    summary: 'Turn a heading and text into a PNG or JPG graphic for quotes and social media posts',
    seoTitle: 'Text to Image Maker: Quote & Social Graphics',
    seoDescription:
      'Turn text into PNG or JPG images for quotes and social posts. Set size presets, colours, gradients, fonts and a background photo. Made in your browser.',
    keywords: ['text to image', 'quote image maker', 'text image generator', 'create image from text', 'social media post maker', 'quote maker'],
    answer:
      'A text to image maker turns a heading and supporting text into a picture you can share. This free tool draws your text onto a canvas with social media size presets, colour themes, gradients, fonts, alignment, shadows and an optional background photo, then lets you download a PNG or JPG. It is not an AI image generator, and everything runs in your browser.',
    howTo: [
      'Type a heading and, optionally, summary text (tick HTML Mode for bold and italic).',
      'Pick a size preset or enter a custom width and height.',
      'Choose colours, a gradient or a background image, plus font, alignment and spacing.',
      'Check the preview and click Download PNG or Download JPG.',
    ],
    features: [
      'Heading and summary text with automatic word wrap and line breaks',
      'Size presets for social posts, Instagram, Stories and YouTube thumbnails, or custom 100–5000 px',
      'Colour presets, custom colours and two-colour gradients',
      'Background photo (cropped to fill) with an adjustable dark overlay',
      '14 system fonts, alignment, padding, line spacing and text shadow',
      'HTML Mode for bold, italic and line breaks; download as PNG or JPG',
    ],
    faqs: [
      {
        question: 'Is this an AI image generator?',
        answer:
          'No. It does not create pictures from a prompt. It lays out the exact text you type on a coloured, gradient or photo background, which makes it predictable for quotes, announcements and blog graphics.',
      },
      {
        question: 'What image sizes can I make?',
        answer:
          'Presets include 1200 × 630 (link previews), 1080 × 1080 (Instagram), 1080 × 1920 (Stories), 1200 × 675 (X), 1200 × 627 (LinkedIn) and 1280 × 720 (YouTube thumbnails). You can also enter any width and height from 100 to 5000 pixels.',
      },
      {
        question: 'Can I use my own photo as the background?',
        answer:
          'Yes. Tick Use Background Image and choose or drop a photo. It is cropped to fill the canvas without distortion, and a dark overlay keeps the text readable. The photo stays on your device.',
      },
      {
        question: 'How do I make some words bold or italic?',
        answer:
          'Tick HTML Mode above the summary box and wrap words in <b> or <strong> for bold and <i> or <em> for italic. Use <br> or <p> for new lines. Other tags are ignored.',
      },
    ],
    related: ['qr-code-generator', 'image-resizer', 'color-picker', 'image-compressor'],
    processing: 'browser',
    comparison: {
      competitors: ['Canva Quote Maker', 'PixTeller Quote Maker', 'Make It a Quote', 'Text to Image Generator (text.imageonline.co)'],
      commonFeatures: [
        'Ready-made templates (Canva)',
        'Large font libraries (PixTeller: 120+ fonts; imageonline: 100+ fonts)',
        'Emoji and background colours (imageonline)',
        'Sizes for Instagram, Stories, TikTok, X and LinkedIn (Make It a Quote)',
        'Browser-based with nothing uploaded (imageonline, Make It a Quote)',
      ],
      implemented: [
        'Removed the server-upload API option',
        'Background photo is cropped to fill instead of stretched',
        'Line breaks in summary text are kept',
        'HTML Mode parsed with DOMParser so pasted markup cannot run scripts',
        'JPG download added alongside PNG',
        'Keyboard-accessible background image picker with drag and drop',
        'Width and height clamped to 100–5000 px; preview clears when all text is removed',
        'Colour inputs stack on phones instead of overflowing',
      ],
      backlog: ['Web fonts (for example Google Fonts)', 'Layout templates', 'Drag text on the canvas', 'Emoji picker'],
      advantages: ['No account or watermark', 'Everything is drawn locally in your browser', 'Exact control over sizes, spacing and colours'],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'word-counter',
    legacyId: 'word-counter',
    hub: 'utility-tools',
    category: 'text',
    name: 'Word Counter',
    icon: '📊',
    summary: 'Count words, characters, sentences and paragraphs with reading time, readability and keyword density',
    seoTitle: 'Word Counter: Count Words & Characters Online',
    seoDescription:
      'Free word counter: count words, characters, sentences and paragraphs as you type, plus reading time, keyword density and readability. Runs in your browser.',
    keywords: ['word counter', 'character counter', 'word count tool', 'count characters online', 'reading time calculator', 'keyword density checker'],
    answer:
      'A word counter counts the words, characters, sentences and paragraphs in a piece of text. Paste or type into this free tool to see live counts, reading and speaking time, average sentence length, a Flesch reading-ease estimate, top keywords with density, and progress against limits such as a 160-character meta description. Your text never leaves your browser.',
    howTo: [
      'Type or paste your text into the Your text box.',
      'Read the live word, character, sentence, paragraph and line counts above the box.',
      'Check reading time, readability and top keywords below it.',
      'Use the character limit bars for SEO titles, meta descriptions and X posts, then Copy or Clear the text.',
    ],
    features: [
      'Live counts of words, characters (with and without spaces), sentences, paragraphs and lines',
      'Unicode-aware: emoji count as one character and Chinese or Japanese characters as words',
      'Reading time (200 wpm) and speaking time (150 wpm) in minutes and seconds',
      'Flesch reading-ease estimate for English and average word and sentence length',
      'Top 10 keywords with density, skipping common stop words',
      'Limit bars for 60-character titles, 160-character meta descriptions and 280-character X posts',
    ],
    faqs: [
      {
        question: 'How does the word counter count words?',
        answer:
          'A word is any run of characters between spaces that contains at least one letter or number, so “don’t” and “e-mail” count as one word and a lone dash does not count. Each Chinese or Japanese character counts as one word because those languages do not use spaces.',
      },
      {
        question: 'Does the character count include spaces?',
        answer:
          'Both are shown: Characters includes spaces and line breaks, and Characters (no spaces) excludes them. Emoji and accented letters count as a single character each, matching what you see on screen.',
      },
      {
        question: 'How is reading time calculated?',
        answer:
          'Reading time assumes 200 words per minute and speaking time 150 words per minute, common averages for adult silent reading and presentations. Technical text or slow speakers will take longer.',
      },
      {
        question: 'Is my text saved anywhere?',
        answer:
          'Only in your own browser: a draft is kept in local storage so a refresh does not lose your work. Click Clear to remove it. The text is never sent to a server.',
      },
    ],
    related: ['text-case-converter', 'token-counter', 'lorem-ipsum-generator', 'keyword-extractor', 'grammar-checker'],
    processing: 'browser',
    comparison: {
      competitors: ['Grammarly Word Counter', 'WordCounter.io', 'QuillBot Word Counter', 'WordCountTool.com'],
      commonFeatures: [
        'Live word, character, sentence and paragraph counts',
        'Characters with and without spaces',
        'Reading time and readability scores (WordCountTool.com)',
        'Grammar and spelling checks (Grammarly, WordCounter.io)',
        'Page count (WordCounter.io)',
      ],
      implemented: [
        'Unicode-aware counting for emoji and CJK text',
        'Line count',
        'Reading and speaking time in minutes and seconds',
        'Flesch reading-ease estimate',
        'Keyword density with stop words removed',
        'Character limit bars (60 / 160 / 280)',
        'Local draft autosave',
        'Inline copy confirmation instead of alert()',
      ],
      backlog: ['Spelling and grammar check (link to the AI grammar checker)', 'Page count estimate', 'Word-count goal', 'Upload .txt or .docx files'],
      advantages: ['Text is analysed locally and never uploaded', 'Keyword density and SEO length limits in one view', 'No signup or usage limit'],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'lorem-ipsum-generator',
    legacyId: 'lorem-ipsum-generator',
    hub: 'utility-tools',
    category: 'text',
    name: 'Lorem Ipsum Generator',
    icon: '📝',
    summary: 'Generate lorem ipsum paragraphs, sentences, words or lists, with optional HTML tags',
    seoTitle: 'Lorem Ipsum Generator: Placeholder Text',
    seoDescription:
      'Generate lorem ipsum placeholder text as paragraphs, sentences, words or list items, with optional HTML tags. Copy or download it for mockups and layouts.',
    keywords: ['lorem ipsum generator', 'placeholder text generator', 'dummy text generator', 'lorem ipsum html', 'filler text', 'lorem ipsum paragraphs'],
    answer:
      'A lorem ipsum generator creates meaningless placeholder text so designers can judge layout and typography before real copy is ready. This free tool produces up to 50 paragraphs, 100 sentences, 1,000 words or 50 list items, optionally starting with the classic “Lorem ipsum dolor sit amet” line and wrapped in HTML <p> or <ul> tags, ready to copy or download.',
    howTo: [
      'Pick a text style, such as Lorem Ipsum or Bacon Ipsum.',
      'Choose what to generate (paragraphs, sentences, words or list items) and how many.',
      'Tick Start with “Lorem ipsum dolor sit amet…” or Wrap in HTML tags if needed.',
      'Click Generate new text, then Copy or Download.',
    ],
    features: [
      'Paragraphs (up to 50), sentences (100), words (1,000) or list items (50)',
      'Four vocabularies: Lorem Ipsum, Bacon Ipsum, Cupcake Ipsum and Hipster Ipsum',
      'Optional classic opening “Lorem ipsum dolor sit amet, consectetur adipiscing elit.”',
      'HTML output with <p> paragraphs or a <ul> list',
      'Copy to clipboard or download as .txt or .html',
      'Live word and character count of the generated text',
    ],
    faqs: [
      {
        question: 'What does lorem ipsum mean?',
        answer:
          'Lorem ipsum is scrambled Latin adapted from Cicero’s “De finibus bonorum et malorum” (45 BC). The words were altered so the text has no real meaning, which keeps attention on the design rather than the content.',
      },
      {
        question: 'Why use placeholder text instead of real copy?',
        answer:
          'It shows how a layout will look with a realistic amount of text before the final copy is written, and readers are not distracted by meaning. Replace it before publishing: search engines and users treat leftover lorem ipsum as low-quality content.',
      },
      {
        question: 'Can I get lorem ipsum with HTML tags?',
        answer:
          'Yes. Tick Wrap in HTML tags to get each paragraph inside <p> tags, or choose List items to get a <ul> list with <li> items. The text is escaped so it can be pasted straight into HTML.',
      },
    ],
    related: ['word-counter', 'text-case-converter', 'html-formatter', 'markdown-preview'],
    processing: 'browser',
    comparison: {
      competitors: ['Lipsum.com', 'LoremIpsum.io', 'OpenReplay Lorem Ipsum Generator', 'Lorem Generator (loremgenerator.io)'],
      commonFeatures: [
        'Paragraphs, sentences and words',
        'Generation by character count (LoremIpsum.io)',
        'Bytes and lists (Lorem Ipsum Generator Chrome extension)',
        'Optional HTML output (OpenReplay)',
        'Titles, captions and names (Lorem Generator)',
      ],
      implemented: [
        'List items output',
        'HTML output for lists (<ul><li>) and escaped paragraphs',
        'Download as .txt or .html',
        'Text generated on page load',
        'Number input with higher limits (up to 1,000 words)',
        'Classic opening works for words, sentences and lists without changing the count',
        'Inline copy confirmation instead of alert()',
      ],
      backlog: ['Generate by exact character or byte count', 'Headings in HTML output', 'Placeholder text in other languages'],
      advantages: ['Generated instantly in your browser', 'Four vocabularies plus HTML list output', 'No signup or ads inside the generator'],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'text-case-converter',
    legacyId: 'text-case-converter',
    hub: 'utility-tools',
    category: 'text',
    name: 'Text Case Converter',
    icon: '🔄',
    summary: 'Convert text to sentence, upper, lower, title, camelCase, snake_case, kebab-case and more',
    seoTitle: 'Case Converter: Upper, Lower, Title & camelCase',
    seoDescription:
      'Convert text to sentence case, UPPER CASE, lower case, Title Case, camelCase, snake_case, kebab-case and more. Copy or download the result instantly.',
    keywords: ['case converter', 'text case converter', 'uppercase to lowercase', 'title case converter', 'camelcase converter', 'snake case converter'],
    answer:
      'A case converter changes the capitalisation of text without retyping it. This free tool converts to sentence case, lower case, UPPER CASE, Capitalized Case, Title Case, alternating and inverse case, plus developer formats such as camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE and dot.case. Results update as you type and can be copied or downloaded as a .txt file.',
    howTo: [
      'Paste or type your text into Text to convert.',
      'Click a format under Convert to, such as Title Case or snake_case.',
      'Check the Result box, which updates as you type.',
      'Click Copy or Download .txt.',
    ],
    features: [
      '13 formats including sentence case, Title Case, camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE and dot.case',
      'Detects camelCase and PascalCase word boundaries, so userID becomes user_id',
      'Title Case keeps short words (a, and, of, the…) lowercase except at the start or end',
      'Sentence case capitalises after . ! ? and line breaks and fixes a lone “i”',
      'Multi-line text converted line by line',
      'Unicode-aware for accented and non-Latin letters; copy or download as .txt',
    ],
    faqs: [
      {
        question: 'What is the difference between Title Case and Capitalized Case?',
        answer:
          'Capitalized Case capitalises the first letter of every word. Title Case follows headline style: short articles, conjunctions and prepositions such as “a”, “and” and “of” stay lowercase unless they are the first or last word.',
      },
      {
        question: 'Can it convert camelCase to snake_case?',
        answer:
          'Yes. The converter splits words at spaces, punctuation and lower-to-upper case changes, so “parseHTTPResponse” becomes parse_http_response in snake_case or parse-http-response in kebab-case. Each line is converted separately.',
      },
      {
        question: 'Does sentence case keep names capitalised?',
        answer:
          'No. Sentence case lowercases everything except the first letter of each sentence and the word “I”, so names and acronyms need to be re-capitalised by hand afterwards.',
      },
    ],
    related: ['word-counter', 'text-converter', 'lorem-ipsum-generator', 'url-encoder'],
    processing: 'browser',
    comparison: {
      competitors: ['ConvertCase.net', 'CaseConverter.com', 'App DevTools Case Converter', 'Prepostseo Case Converter'],
      commonFeatures: [
        'Upper, lower, sentence and title case',
        'Alternating case (ConvertCase.net)',
        'snake_case and swap case (App DevTools)',
        'Copy to clipboard',
        'Instant conversion with no signup',
      ],
      implemented: [
        'camelCase / PascalCase-aware word splitting (previously “helloWorld” lost its boundary)',
        'Title Case with small-word rules and a separate Capitalized Case',
        'Sentence case after ! ? and line breaks (previously only after “. ”)',
        'CONSTANT_CASE and dot.case',
        'Line-by-line conversion for code formats',
        'Download as .txt and inline copy confirmation',
      ],
      backlog: ['Style-guide specific title case (AP, Chicago)', 'Remove extra spaces and line breaks', 'Custom separator case'],
      advantages: ['Handles developer identifiers and prose in one tool', 'Unicode-aware conversion', 'Runs locally in your browser'],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'hash-generator',
    legacyId: 'hash-generator',
    hub: 'utility-tools',
    category: 'security',
    name: 'Hash Generator',
    icon: '#️⃣',
    summary: 'Generate MD5, SHA-1, SHA-256, SHA-384 and SHA-512 hashes of text or files and verify checksums',
    seoTitle: 'Hash Generator: MD5, SHA-1, SHA-256 & SHA-512',
    seoDescription:
      'Free hash generator for text and files. Get MD5, SHA-1, SHA-256, SHA-384 and SHA-512 checksums at once, verify a hash and copy results in your browser.',
    keywords: ['hash generator', 'sha256 generator', 'md5 hash generator', 'sha512 hash', 'file checksum calculator', 'verify checksum online'],
    answer:
      'A hash generator turns text or a file into a fixed-length fingerprint, or checksum, using an algorithm such as SHA-256. This free tool calculates MD5, SHA-1, SHA-256, SHA-384 and SHA-512 at the same time in your browser and can compare the result with an expected checksum to verify a download. Files are read locally and never uploaded.',
    howTo: [
      'Choose Text or File.',
      'Type or paste text, or click Choose file (or drag a file onto the box).',
      'Read the MD5, SHA-1, SHA-256, SHA-384 and SHA-512 hashes and click Copy next to the one you need.',
      'Optionally paste an expected checksum into the verify box to confirm it matches.',
    ],
    features: [
      'MD5, SHA-1, SHA-256, SHA-384 and SHA-512 calculated together',
      'SHA hashes via the browser’s Web Crypto API; MD5 via a built-in RFC 1321 implementation',
      'Hash text (UTF-8) or any file type with drag and drop',
      'Checksum verification that tells you which algorithm matches',
      'Lowercase or uppercase hexadecimal output',
      'One-click copy for each hash',
    ],
    faqs: [
      {
        question: 'Is MD5 or SHA-1 still safe to use?',
        answer:
          'Not for security. Practical collision attacks exist for both, so use them only to spot accidental file corruption or to match legacy checksums. Use SHA-256 or SHA-512 for integrity checks that must resist tampering, and a dedicated algorithm such as bcrypt or Argon2 for passwords.',
      },
      {
        question: 'Can a hash be reversed to get the original text?',
        answer:
          'No. Hash functions are one-way. Short or common inputs can sometimes be found by guessing and comparing hashes, which is why passwords should never be stored as plain MD5 or SHA hashes.',
      },
      {
        question: 'How do I verify a downloaded file’s checksum?',
        answer:
          'Choose File, select or drop the download, then paste the checksum published by the vendor into the verify box. The tool reports a match and the algorithm, or no match if the file differs.',
      },
      {
        question: 'Why is my hash different from another tool’s?',
        answer:
          'The input is almost always different: a trailing space or line break, a different text encoding, or hashing text instead of the file. This tool hashes text as UTF-8 exactly as typed. Upper or lower case hex does not change the value.',
      },
    ],
    related: ['password-generator', 'base64-encoder', 'jwt-decoder', 'uuid-generator'],
    processing: 'browser',
    comparison: {
      competitors: ['Userback Hash Generator', 'Coddy Hash Generator', 'hashgenerator.co', 'RandomKeygen Hash Generator'],
      commonFeatures: [
        'MD5, SHA-1, SHA-256 and SHA-512 output',
        'SHA-384 (Coddy)',
        'HMAC, SHA-3 and BLAKE2b (hashgenerator.co)',
        'bcrypt hashes (RandomKeygen)',
        'Browser-side hashing with no signup',
      ],
      implemented: [
        'Added MD5 (previously the tool said MD5 was not supported)',
        'Added SHA-384',
        'All algorithms shown at once instead of one at a time',
        'Checksum verification',
        'Drag-and-drop file hashing with a keyboard-accessible Choose file button',
        'Whitespace-only text is now hashed instead of ignored',
        'Uppercase option and inline copy confirmation',
      ],
      backlog: ['HMAC with a secret key', 'SHA-3 and BLAKE2b', 'bcrypt / Argon2 password hashing', 'Streaming hashes for multi-gigabyte files'],
      advantages: ['Five algorithms computed at once', 'Files are hashed locally and never uploaded', 'Built-in checksum verification'],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'image-compressor',
    legacyId: 'image-compressor',
    hub: 'utility-tools',
    category: 'images',
    name: 'Image Compressor',
    icon: '🗜️',
    summary: 'Compress up to 20 JPG, PNG or WebP images at once in your browser and see the saving',
    seoTitle: 'Image Compressor: Reduce JPG, PNG & WebP Size',
    seoDescription:
      'Compress JPG, PNG and WebP images in your browser. Batch up to 20 files, adjust quality, resize large photos and download smaller images. No uploads.',
    keywords: ['image compressor', 'compress image', 'reduce image size', 'compress jpg', 'compress png online', 'image size reducer'],
    answer:
      'An image compressor reduces an image’s file size so pages load faster and uploads fit size limits. This free tool re-encodes up to 20 JPG, PNG, WebP, GIF or BMP images at once in your browser, with a quality slider, an optional maximum width and JPEG, WebP or PNG output. It shows the saving for each file and never uploads your images.',
    howTo: [
      'Click Choose images or drag up to 20 images onto the box.',
      'Set the Quality slider (60–80% is a good starting point).',
      'Optionally change the Output format or choose a Max width.',
      'Check the size saving next to each image, then click Download or Download all.',
    ],
    features: [
      'Batch compression of up to 20 images with a total saving summary',
      'Quality slider from 10% to 100% for JPEG and WebP',
      'Output as the original format, JPEG, WebP or PNG',
      'Optional maximum width (800 to 3840 px) to shrink oversized photos',
      'Keeps the original file when re-encoding would make it larger',
      'Transparent areas become white in JPEG; drag and drop or keyboard-accessible file picker',
    ],
    faqs: [
      {
        question: 'How much smaller will my images get?',
        answer:
          'It depends on the image. Photos saved at high quality often shrink a lot at 60–80% quality, and limiting the width helps even more. Images that are already optimised may not shrink; in that case the tool keeps your original file.',
      },
      {
        question: 'Why did my PNG not get smaller?',
        answer:
          'PNG is lossless, so the quality slider does not apply and the browser’s PNG encoder rarely beats the original. For photos or large graphics, choose WebP or JPEG as the output format for a much bigger saving.',
      },
      {
        question: 'Does compression remove photo metadata?',
        answer:
          'Yes. Images are redrawn and re-encoded, so EXIF metadata such as camera details and GPS location is not copied to the compressed file. That is useful for privacy when sharing photos online.',
      },
      {
        question: 'Are my images uploaded?',
        answer:
          'No. Compression uses the canvas API inside your browser, and the downloads are created locally. The previous server option has been removed, so no image leaves your device.',
      },
    ],
    related: ['image-resizer', 'webp-converter', 'image-format-converter', 'pdf-compressor'],
    processing: 'browser',
    comparison: {
      competitors: ['TinyPNG', 'ImageCompressor.com', 'iLoveIMG Compress Image', 'Squoosh'],
      commonFeatures: [
        'Batch compression (iLoveIMG, TinyPNG)',
        'JPEG, PNG and WebP support (AVIF on TinyPNG)',
        'Browser-only processing (ImageCompressor.com, Squoosh)',
        'Quality control with before/after comparison (Squoosh)',
        'Resize while compressing (Squoosh)',
      ],
      implemented: [
        'Keyboard-accessible Choose images button (was a non-focusable label) plus drag and drop',
        'Batch compression (up to 20) with Download all',
        'Removed the server API option; processing is browser-only',
        'Fixed download names such as “photo.jpg.jpeg”',
        'Transparent areas become white instead of black in JPEG',
        'Original kept when compression would make the file larger',
        'Optional max width instead of a forced 1920 × 1080 limit',
      ],
      backlog: ['ZIP download for batches', 'Before/after comparison slider', 'Lossy PNG palette quantisation', 'Compress to a target file size'],
      advantages: ['Images never leave your device', 'No file-count limit per day or signup', 'Never returns a file larger than the original'],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'image-format-converter',
    legacyId: 'image-format-converter',
    hub: 'utility-tools',
    category: 'images',
    name: 'Image Format Converter',
    icon: '🔄',
    summary: 'Convert images between JPG, PNG, WebP, BMP and AVIF in batches, locally in your browser',
    seoTitle: 'Image Converter: JPG, PNG, WebP, AVIF & BMP',
    seoDescription:
      'Convert images between JPG, PNG, WebP, BMP and AVIF (where your browser supports it). Batch convert up to 20 files locally and download each result.',
    keywords: ['image converter', 'png to jpg', 'jpg to png', 'convert image format', 'webp to png', 'image to bmp'],
    answer:
      'An image format converter re-saves a picture as a different file type, for example PNG to JPG or JPG to WebP. This free tool converts up to 20 images at once to JPG, PNG, WebP, BMP or AVIF (when your browser can encode AVIF), with a quality setting for lossy formats. Conversion runs in your browser, so files are never uploaded.',
    howTo: [
      'Click Choose images or drag files onto the box.',
      'Pick the target under Convert to: JPG, PNG, WebP, AVIF or BMP.',
      'Adjust Quality for JPG, WebP or AVIF.',
      'Click Download next to each file, or Download all.',
    ],
    features: [
      'Input: JPG, PNG, WebP, GIF (first frame), BMP, SVG and AVIF',
      'Output: JPG, PNG, WebP, BMP and AVIF where the browser supports AVIF encoding',
      'Batch conversion of up to 20 images with Download all',
      'Quality slider for lossy formats',
      'Transparent PNG areas become white when saving as JPG',
      'Keeps the original file name with the new extension',
    ],
    faqs: [
      {
        question: 'Can I convert images to GIF?',
        answer:
          'Not at the moment. Browsers cannot export GIF from a canvas, so GIF output is on the roadmap. You can convert from GIF: the first frame is saved in the format you choose.',
      },
      {
        question: 'Why is the AVIF option greyed out?',
        answer:
          'Creating AVIF files depends on your browser’s built-in image encoder. When the browser cannot encode AVIF, the option is disabled rather than silently producing a different format. Try another current browser or use WebP.',
      },
      {
        question: 'What happens to transparency when converting PNG to JPG?',
        answer:
          'JPG does not support transparency, so transparent pixels are filled with white. Choose PNG or WebP as the target to keep the transparent background.',
      },
      {
        question: 'Which format should I use on a website?',
        answer:
          'Use WebP or AVIF for photos to keep files small, PNG for screenshots, logos and graphics that need sharp edges or transparency, and JPG when you need maximum compatibility with older software.',
      },
    ],
    related: ['webp-converter', 'image-compressor', 'image-resizer', 'file-converter'],
    processing: 'browser',
    comparison: {
      competitors: ['CloudConvert', 'FreeConvert', 'Simple Image Resizer Image Converter', 'OnlineImageTool.com'],
      commonFeatures: [
        'Many formats including HEIC, TIFF, GIF and PDF (Simple Image Resizer, CloudConvert)',
        'Resolution and quality options (CloudConvert)',
        'Batch conversion',
        'Conversion between PNG, JPG, WebP and GIF with no limits (OnlineImageTool.com)',
        'No signup',
      ],
      implemented: [
        'Fixed GIF and BMP outputs that were really PNG data with the wrong extension',
        'Real BMP encoder',
        'AVIF offered only when the browser can encode it (it previously produced WebP)',
        'Batch conversion with Download all',
        'Keyboard-accessible file picker with drag and drop',
        'Correct names for files with several dots (my.photo.png)',
        'White background for JPG instead of black',
      ],
      backlog: ['GIF and ICO output', 'HEIC and TIFF input', 'PDF output', 'ZIP download'],
      advantages: ['Files never leave your device', 'Honest format support: disabled when the browser cannot encode it', 'No signup or daily limits'],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'webp-converter',
    legacyId: 'webp-converter',
    hub: 'utility-tools',
    category: 'images',
    name: 'WebP & AVIF Converter',
    icon: '⚡',
    summary: 'Convert JPG, PNG and GIF images to WebP (or AVIF) in bulk and see the size saving',
    seoTitle: 'WebP Converter: Convert JPG & PNG to WebP/AVIF',
    seoDescription:
      'Convert JPG, PNG and GIF images to WebP, or AVIF where your browser supports it, in bulk. Set quality, see the size saving and download. No uploads.',
    keywords: ['webp converter', 'convert to webp', 'jpg to webp', 'png to webp', 'avif converter', 'bulk webp converter'],
    answer:
      'A WebP converter turns JPG, PNG and other images into the WebP format, which usually produces smaller files for websites. This free tool converts up to 30 images at once in your browser, lets you set quality, shows the size change for each file and also exports AVIF when your browser can encode it. Images are never uploaded to a server.',
    howTo: [
      'Click Choose images or drag up to 30 files onto the box.',
      'Choose WebP or AVIF under Convert to.',
      'Set the quality (75–85% suits most website photos).',
      'Review the size saving and click Download or Download all.',
    ],
    features: [
      'Batch conversion of up to 30 JPG, PNG, GIF, BMP or SVG images',
      'WebP output, plus AVIF where the browser supports AVIF encoding',
      'Quality slider from 10% to 100%',
      'Per-file and total size comparison',
      'Download each file or Download all',
      'Conversion runs locally; nothing is uploaded or stored',
    ],
    faqs: [
      {
        question: 'Do all browsers support WebP images?',
        answer:
          'All current versions of Chrome, Edge, Firefox and Safari display WebP images, so WebP is safe for most websites. Keep a JPG or PNG fallback only if you must support very old browsers or email clients.',
      },
      {
        question: 'Should I use WebP or AVIF?',
        answer:
          'AVIF often produces smaller files than WebP at similar visual quality, but it is slower to encode and some tools cannot open it yet. WebP is the safer default; use AVIF where every kilobyte matters and your audience uses modern browsers.',
      },
      {
        question: 'Why is my WebP file larger than the original?',
        answer:
          'Small graphics or images that were already heavily compressed can grow when re-encoded. Lower the quality or keep the original; the tool labels any file that got larger.',
      },
      {
        question: 'Are my images uploaded?',
        answer:
          'No. Earlier versions of this tool sent images to a server; conversion now happens entirely in your browser using the canvas API, so your files stay on your device.',
      },
    ],
    related: ['image-format-converter', 'image-compressor', 'image-resizer', 'pdf-compressor'],
    processing: 'browser',
    comparison: {
      competitors: ['toWebP.io', 'Elementor WebP Converter', 'CloudConvert WebP Converter', 'AnyWebP', 'Squoosh'],
      commonFeatures: [
        'Bulk conversion (toWebP.io, Picflow, AnyWebP)',
        'Browser-only processing with no uploads (toWebP.io, AnyWebP)',
        'Quality control (ezgif: 0–100)',
        'AVIF output (Squoosh)',
        'WebP to JPG or PNG (AnyWebP)',
      ],
      implemented: [
        'Moved conversion from a server upload to the browser',
        'Working quality slider (it was disabled)',
        'Batch conversion (30 files) with Download all and total savings',
        'AVIF encoded locally when supported, otherwise clearly disabled',
        'Drag and drop and a keyboard-accessible picker',
      ],
      backlog: ['AVIF encoding via WebAssembly for browsers without native support', 'Lossless WebP option', 'ZIP download', 'Resize during conversion'],
      advantages: ['Images never leave your device', 'Up to 30 files per batch with size comparison', 'No signup or watermark'],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'color-picker',
    legacyId: 'color-picker',
    hub: 'utility-tools',
    category: 'images',
    name: 'Color Picker',
    icon: '🎨',
    summary: 'Pick colours and get HEX, RGB, HSL and CMYK codes, tints, harmonies, contrast and image colours',
    seoTitle: 'Color Picker: HEX, RGB, HSL & CMYK Codes',
    seoDescription:
      'Pick a colour and get HEX, RGB, HSL and CMYK codes, tints, shades, harmonies and WCAG contrast. Pick colours from an image or your screen, all in-browser.',
    keywords: ['color picker', 'hex color picker', 'rgb color picker', 'color picker from image', 'color code finder', 'contrast checker'],
    answer:
      'A color picker lets you choose a colour visually and gives you its codes for design and CSS. This free tool shows HEX, RGB, HSL and CMYK values, generates tints, shades and colour harmonies, checks WCAG contrast against white and black, and can pick colours or dominant colours from an uploaded image or, in supporting browsers, anywhere on screen.',
    howTo: [
      'Choose a colour with the colour box, or type a HEX, RGB or HSL value.',
      'Copy the HEX, RGB, HSL or CMYK code you need.',
      'Click a tint, shade or harmony swatch to explore related colours.',
      'To match an image, click Choose image, then click the picture or a dominant colour swatch.',
    ],
    features: [
      'HEX (3- or 6-digit), RGB and HSL input with instant conversion',
      'Copy HEX, RGB, HSL and CMYK codes',
      'Tints, shades, complementary, analogous and triadic colours',
      'WCAG 2 contrast ratio against white and black with AA/AAA result',
      'Pick a colour from an uploaded image and see its six dominant colours',
      'Screen eyedropper in browsers that support the EyeDropper API',
    ],
    faqs: [
      {
        question: 'How do I find the HEX code of a colour in an image?',
        answer:
          'Click Choose image under Pick a colour from an image, then click the exact spot in the picture. The colour and all its codes update, and the six dominant colours of the image appear as swatches you can click.',
      },
      {
        question: 'What contrast ratio do I need for accessible text?',
        answer:
          'WCAG 2 level AA requires at least 4.5:1 for normal text and 3:1 for large text; level AAA requires 7:1. The tool shows the ratio of your colour against white and black and which level it passes.',
      },
      {
        question: 'What is the difference between RGB and CMYK?',
        answer:
          'RGB mixes red, green and blue light for screens; CMYK describes cyan, magenta, yellow and black ink for print. The CMYK values here use a simple formula without colour profiles, so ask your printer for exact values.',
      },
      {
        question: 'Can I pick a colour from anywhere on my screen?',
        answer:
          'Yes, in browsers that support the EyeDropper API, such as recent Chrome and Edge, a Pick from screen button appears. In other browsers, take a screenshot and use the image picker instead.',
      },
    ],
    related: ['color-converter', 'text-to-image', 'qr-code-generator', 'css-formatter'],
    processing: 'browser',
    comparison: {
      competitors: ['HTML Color Codes', 'Figma Color Picker', 'ImageColorPicker.com', 'Picsart Color Picker', 'fffuel cccolor'],
      commonFeatures: [
        'HEX, RGB and HSL codes (CMYK on Picsart)',
        'Pick colours from an uploaded image (Figma, ImageColorPicker.com)',
        'Colour harmonies (HTML Color Codes)',
        'OKLCH and 8-digit hex with alpha (HTML Color Codes, cccolor)',
        'Custom palettes (Figma)',
      ],
      implemented: [
        'Pick colours from an uploaded image, plus dominant colours (previously claimed but missing)',
        'Screen eyedropper where supported',
        'CMYK codes and editable HSL',
        '3-digit HEX support with validation message',
        'Tints, shades and harmonies as focusable buttons (were clickable divs)',
        'WCAG contrast check',
        'Inline copy confirmation instead of alert()',
      ],
      backlog: ['OKLCH and alpha channel', 'Save and export palettes', 'Paste an image from the clipboard'],
      advantages: ['Images are analysed locally and never uploaded', 'Codes, harmonies and contrast check in one view', 'No signup'],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'token-counter',
    legacyId: 'token-counter',
    hub: 'utility-tools',
    category: 'text',
    name: 'Token Counter',
    icon: '🔢',
    summary: 'Estimate LLM tokens for a prompt, check context-window usage and estimate cost at your price',
    seoTitle: 'Token Counter: Estimate LLM Tokens & Cost',
    seoDescription:
      'Estimate how many tokens your prompt uses in GPT, Claude, Gemini or Llama models, check it against a context window and work out cost at your own price.',
    keywords: ['token counter', 'llm token counter', 'gpt token counter', 'claude token counter', 'prompt token estimator', 'ai token calculator'],
    answer:
      'A token counter estimates how many tokens a large language model will read from your text. This free tool gives an approximate count using the splitting rules most BPE tokenizers follow, shows how much of a context window you would use, and estimates cost from the price per million tokens you enter. It is an estimate, not an exact model tokenizer.',
    howTo: [
      'Paste your prompt or document into the text box.',
      'Read the estimated token count, characters and words.',
      'Set the context window (for example 128K or 200K) to see the percentage used.',
      'Enter your model’s current price per 1M input tokens to estimate cost.',
    ],
    features: [
      'Approximate token count modelled on BPE pre-tokenisation (words, digit groups, punctuation, CJK)',
      'Character, word and characters-per-token statistics',
      'Context-window usage bar with 8K, 32K, 128K, 200K and 1M presets or a custom size',
      'Cost estimate from your own price per 1M input tokens',
      'Clear note that results are estimates, with advice on exact counting',
      'Runs locally: prompts are not sent anywhere',
    ],
    faqs: [
      {
        question: 'How accurate is this token counter?',
        answer:
          'It is an estimate. For ordinary English prose it is usually close to real tokenizer counts, but code, non-English text and emoji can differ more because every model family uses its own tokenizer. For exact numbers use the provider’s tokenizer or token-counting API, such as OpenAI’s tiktoken or Anthropic’s token counting endpoint.',
      },
      {
        question: 'How many characters are in a token?',
        answer:
          'For English text a token is about four characters, or roughly three quarters of a word, on average. Other languages and code usually need more tokens per character. The tool shows the characters-per-token ratio for your text.',
      },
      {
        question: 'Why doesn’t the tool list model prices?',
        answer:
          'AI providers change prices and release new models often, so a built-in price list goes out of date quickly. Enter the current input price from your provider’s pricing page to get an up-to-date cost estimate.',
      },
      {
        question: 'Is my prompt sent to an AI provider?',
        answer:
          'No. The estimate is calculated in your browser with no network requests, so confidential prompts and documents stay on your device.',
      },
    ],
    related: ['word-counter', 'text-summarizer', 'keyword-extractor', 'article-rewriter'],
    processing: 'browser',
    comparison: {
      competitors: ['OpenAI Tokenizer', 'GPT for Work Tokenizer', 'Price Per Token Token Counter', 'Runcell Token Counter'],
      commonFeatures: [
        'Exact counts with model tokenizers (OpenAI Tokenizer, GPT for Work)',
        'Visual token split (GPT for Work)',
        'Multiple model families: GPT, Claude, Gemini, Grok',
        'Cost comparison across many models (Price Per Token)',
        'Browser-based counting',
      ],
      implemented: [
        'Replaced identical per-model “algorithms” with one clearly labelled estimate',
        'Better heuristic based on BPE pre-tokenisation (words, digit groups, punctuation, CJK)',
        'Context-window usage bar with presets',
        'User-entered price per 1M tokens instead of an outdated 2024 price table',
        'Fixed a cost label that claimed to be “per 1M tokens”',
      ],
      backlog: ['Exact tokenizer (o200k / cl100k) via a JavaScript tokenizer library (needs a new dependency)', 'Visual token split', 'Output-token cost'],
      advantages: ['Transparent about being an estimate', 'Prompts never leave your browser', 'Context-window check for any model size'],
    },
    reviewed: '2026-09-24',
  },
];
