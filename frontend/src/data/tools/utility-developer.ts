// Tool content for the "utility-developer" batch. See ./types.ts for field rules.
// Competitor research and QA notes: docs/tools-competitor-analysis/developer.md
import type { ToolContent } from './types';

export const utilityDeveloperTools: ToolContent[] = [
  {
    slug: 'json-formatter',
    legacyId: 'json-formatter',
    hub: 'utility-tools',
    category: 'developer',
    name: 'JSON Formatter',
    icon: '📋',
    summary: 'Beautify, minify and validate JSON with error line numbers, key sorting and auto-fix',
    seoTitle: 'JSON Formatter & Validator – Beautify or Minify JSON',
    seoDescription:
      'Free JSON formatter and validator: beautify or minify JSON, sort keys, find errors by line and column, and auto-fix trailing commas. Runs in your browser.',
    keywords: ['json formatter', 'json validator', 'json beautifier', 'format json online', 'json minifier', 'json pretty print', 'fix invalid json'],
    answer:
      'A JSON formatter turns raw or minified JSON into indented, readable text and checks that it is valid. Paste JSON or open a .json file and this free tool formats it instantly with 2 spaces, 4 spaces or tabs, can minify it or sort keys alphabetically, and reports syntax errors with the line and column. Everything runs locally in your browser.',
    howTo: [
      'Paste JSON into the JSON input box, or click Open file to load a .json file.',
      'Choose Beautify or Minify and pick an indent of 2 spaces, 4 spaces or Tab.',
      'Tick Sort keys A–Z if you want object keys in alphabetical order.',
      'If an error appears, click Go to error or Auto-fix common issues.',
      'Click Copy or Download to save the formatted JSON.',
    ],
    features: [
      'Beautifies JSON with 2-space, 4-space or tab indentation',
      'Minifies JSON and shows how much smaller it is',
      'Validates as you type and reports the error line and column',
      'Auto-fixes trailing commas, comments, single quotes and unquoted keys',
      'Sorts object keys alphabetically at every level',
      'Opens .json files and downloads the result',
    ],
    faqs: [
      {
        question: 'How do I know if my JSON is valid?',
        answer:
          'Paste it into the input. Valid JSON shows a green "Valid JSON" message; invalid JSON shows the parser error with the line and column, plus a plain-English hint about the likely cause.',
      },
      {
        question: 'Why is my JSON invalid when it works in JavaScript?',
        answer:
          'JSON is stricter than JavaScript object literals: keys and strings need double quotes, and comments, trailing commas, single quotes, undefined and NaN are not allowed. The Auto-fix button repairs the most common of these.',
      },
      {
        question: 'What is the difference between beautify and minify?',
        answer:
          'Beautify adds line breaks and indentation so people can read the data. Minify removes all unnecessary whitespace so the file is as small as possible for APIs and storage. Both contain exactly the same data.',
      },
      {
        question: 'Is my JSON uploaded to a server?',
        answer: "No. Parsing and formatting use your browser's built-in JSON engine, so the data never leaves your device. Files you open are read locally.",
      },
    ],
    related: ['sql-formatter', 'jwt-decoder', 'base64-encoder', 'html-formatter'],
    processing: 'browser',
    comparison: {
      competitors: ['JSONFormatter.org', 'JSON Editor Online (jsoneditoronline.org)', 'CodeBeautify JSON Viewer', 'Jam JSON Formatter (jam.dev)'],
      commonFeatures: [
        'Beautify with configurable indentation',
        'Minify / compact JSON',
        'Syntax validation with error location',
        'Tree view of the data',
        'Load JSON from a file or URL',
        'Convert JSON to XML or CSV',
        'Copy and download output',
      ],
      implemented: [
        'Error line and column with a Go to error button (replaced a misaligned highlight overlay)',
        'String-safe auto-fix (the old regex fixer deleted // inside URLs in string values)',
        'Sort keys A–Z',
        'Open .json file and download the result',
        'Inline valid / invalid status instead of blocking alert() pop-ups',
      ],
      backlog: ['Collapsible tree view', 'JSON to CSV / XML conversion', 'Load JSON from a URL', 'JSONPath query filtering', 'Syntax highlighting in the output'],
      advantages: [
        'Runs entirely in your browser – JSON is never uploaded',
        'No signup or usage limits',
        'Plain-English hint for every parser error',
        'Auto-fix never changes the contents of strings',
      ],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'base64-encoder',
    legacyId: 'base64-encoder',
    hub: 'utility-tools',
    category: 'developer',
    name: 'Base64 Encoder',
    icon: '🔐',
    summary: 'Encode text or files to Base64 and decode it back, with UTF-8 and URL-safe support',
    seoTitle: 'Base64 Encoder & Decoder – UTF-8, URL-Safe & Files',
    seoDescription:
      'Encode text or files to Base64 and decode Base64 back to text online. Full UTF-8 and emoji support, URL-safe Base64URL and data URIs, all in your browser.',
    keywords: ['base64 encode', 'base64 decode', 'base64 encoder decoder', 'base64url', 'file to base64', 'base64 to text', 'data uri generator'],
    answer:
      'Base64 represents binary data or text with 64 printable ASCII characters so it can travel safely in URLs, JSON, email and data URIs. This free Base64 encoder and decoder converts text as you type with full UTF-8 support, handles URL-safe Base64URL, encodes files up to 10 MB and lets you download decoded binary data as a file.',
    howTo: [
      'Choose Encode to Base64 or Decode from Base64.',
      'Type or paste your text, or click Encode a file to convert a file.',
      'Tick URL-safe output if the result will go in a URL or JWT.',
      'Copy the result, or click Swap to reverse the conversion.',
      'When decoding binary data, click Download decoded file to save it.',
    ],
    features: [
      'Converts in real time as you type',
      'Correct UTF-8 handling for accents, non-Latin scripts and emoji',
      'URL-safe Base64URL output without padding',
      'Decodes standard or URL-safe input and ignores whitespace and missing padding',
      'Encodes any file up to 10 MB, optionally as a data URI',
      'Downloads decoded binary data as a file',
      'Clear error messages for invalid characters or length',
    ],
    faqs: [
      {
        question: 'Why does my Base64 decode to garbled text?',
        answer:
          'The data was probably encoded from a different character set, or it is binary such as an image or PDF. This tool decodes text as UTF-8; if the bytes are not valid UTF-8 it says so and lets you download them as a file.',
      },
      {
        question: 'What is URL-safe Base64?',
        answer:
          'Base64URL replaces + with - and / with _ and usually drops the = padding, so the value can be used in URLs, file names and JWTs without escaping. The decoder accepts both forms.',
      },
      {
        question: 'Is Base64 a form of encryption?',
        answer: 'No. Base64 is an encoding, not encryption. Anyone can decode it, so never use it to hide passwords or secrets.',
      },
      {
        question: 'Why is Base64 output bigger than the input?',
        answer: 'Base64 turns every 3 bytes into 4 characters, so the encoded result is about 33% larger than the original data.',
      },
    ],
    related: ['url-encoder', 'jwt-decoder', 'hash-generator', 'json-formatter'],
    processing: 'browser',
    comparison: {
      competitors: ['Base64Decode.org / Base64Encode.org', 'Jam Base64 Encoder/Decoder (jam.dev)', '64baser', 'Coddy Base64 tool'],
      commonFeatures: [
        'Encode and decode text',
        'Character set selection (UTF-8 and others)',
        'URL-safe Base64 option',
        'Encode files and images',
        'Decode each line separately',
        'Download decoded output as a file',
      ],
      implemented: [
        'Fixed a bug where the output lagged one keystroke behind the input',
        'UTF-8 safe encoding with TextEncoder / TextDecoder instead of deprecated escape / unescape',
        'URL-safe Base64URL output and tolerant decoding (whitespace, missing padding, - and _)',
        'File to Base64 and data URI output',
        'Download decoded binary data',
        'Swap button and precise error messages',
      ],
      backlog: ['Character sets other than UTF-8 (e.g. Windows-1252)', 'Decode each line separately', 'Image preview for decoded data URIs'],
      advantages: [
        'Runs entirely in your browser – text and files are never uploaded',
        'No signup',
        'Detects binary output instead of showing garbled text',
      ],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'url-encoder',
    legacyId: 'url-encoder',
    hub: 'utility-tools',
    category: 'developer',
    name: 'URL Encoder',
    icon: '🔗',
    summary: 'Percent-encode or decode URLs and query strings, with form (+) and component modes',
    seoTitle: 'URL Encoder & Decoder – Percent-Encode Text Online',
    seoDescription:
      'Encode or decode URLs and query strings with percent-encoding. Choose component or full-URL mode, use + for spaces, and see query parameters in a table.',
    keywords: ['url encode', 'url decode', 'url encoder decoder', 'percent encoding', 'encodeURIComponent online', 'decode query string'],
    answer:
      'URL encoding, also called percent-encoding, replaces characters that are unsafe in a web address with a % sign and two hexadecimal digits, so a space becomes %20 and é becomes %C3%A9. This free URL encoder and decoder converts text as you type, supports encodeURIComponent and encodeURI modes, treats + as a space for form data and lists query parameters.',
    howTo: [
      'Choose Encode or Decode.',
      'Paste your text, URL or encoded string into the input box.',
      'When encoding, pick Component for a single query value or Full URL to keep :/?#&= intact.',
      'Tick the + option if you are working with HTML form data.',
      'Copy the result, or click Swap to convert it back.',
    ],
    features: [
      'Real-time encoding and decoding as you type',
      'encodeURIComponent and encodeURI modes',
      'Optional + for spaces (application/x-www-form-urlencoded)',
      'UTF-8 support for accents, non-Latin scripts and emoji',
      'Points to the malformed percent-escape when decoding fails',
      'Decoded query-parameter table for URLs and query strings',
      'Swap and copy buttons',
    ],
    faqs: [
      {
        question: 'What is the difference between encodeURI and encodeURIComponent?',
        answer:
          'encodeURIComponent encodes every reserved character, including / ? & = and #, so use it for a single query value or path segment. encodeURI leaves those characters alone so a complete URL keeps working.',
      },
      {
        question: 'Should spaces be encoded as %20 or +?',
        answer:
          'In URL paths and most APIs a space is %20. In HTML form submissions (application/x-www-form-urlencoded) and many query strings a space is written as +. Use the + option for form data.',
      },
      {
        question: 'Why does decoding fail with a malformed URI error?',
        answer:
          'A % must be followed by two hexadecimal digits, and the escapes must form valid UTF-8. A lone % or a truncated sequence such as %E2%82 causes the error; encode a literal percent sign as %25.',
      },
      {
        question: 'Is URL encoding the same as Base64?',
        answer: 'No. URL encoding only escapes unsafe characters and leaves letters and digits readable. Base64 re-encodes all of the data into a different alphabet.',
      },
    ],
    related: ['base64-encoder', 'json-formatter', 'regex-tester', 'jwt-decoder'],
    processing: 'browser',
    comparison: {
      competitors: ['URLEncoder.org / URLDecoder.org', 'Meyerweb URL Decoder/Encoder', 'Jam URL Encoder/Decoder (jam.dev)', 'Zoho Toolkit Encode/Decode'],
      commonFeatures: ['Encode and decode percent-encoded text', 'Live conversion as you type', 'Character set selection', 'Encode each line separately', 'Copy output'],
      implemented: [
        'Fixed a bug where the output lagged one keystroke behind the input',
        'Component vs full-URL encoding modes',
        '+ for spaces option for form data',
        'Error message that names the malformed % sequence',
        'Decoded query-parameter table',
        'Swap button',
      ],
      backlog: ['Encode each line separately', 'Character sets other than UTF-8', "Strict RFC 3986 mode that also encodes !'()*"],
      advantages: ['Runs entirely in your browser', 'No signup', 'Explains exactly which escape sequence is invalid'],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'regex-tester',
    legacyId: 'regex-tester',
    hub: 'utility-tools',
    category: 'developer',
    name: 'Regex Tester',
    icon: '🔍',
    summary: 'Test JavaScript regular expressions with live highlighting, groups and replace preview',
    seoTitle: 'Regex Tester – Test JavaScript Regular Expressions',
    seoDescription:
      'Test JavaScript regular expressions online with live match highlighting, capture and named groups, all flags and a find-and-replace preview. No signup.',
    keywords: ['regex tester', 'regex test online', 'javascript regex tester', 'regular expression tester', 'regex match highlighter', 'regex replace online'],
    answer:
      "A regex tester lets you try a regular expression against sample text and see exactly what it matches. This free tool uses your browser's JavaScript regex engine, highlights every match as you type, lists capture and named groups with their positions, supports the g, i, m, s, u and y flags, previews replacements and explains why a pattern is invalid.",
    howTo: [
      'Type your pattern into the Regular expression box, or paste a literal such as /ab+c/gi.',
      'Tick the flags you need, such as g for all matches or i to ignore case.',
      'Paste the text to search into the Test string box.',
      'Review the highlighted matches and the match details with capture groups.',
      'Tick Replace matches and enter a replacement such as $1 to preview a find-and-replace.',
    ],
    features: [
      'Live matching with highlighted results',
      'Match list with index positions, capture groups and named groups',
      'All JavaScript flags: g, i, m, s, u and y',
      'Replace preview with $1, $<name> and $& references',
      'Clear error message for invalid patterns',
      'Pauses live matching for patterns prone to catastrophic backtracking',
      'Preset patterns for emails, URLs, IPv4 addresses, dates and hex colours',
    ],
    faqs: [
      {
        question: 'Which regex flavour does this tester use?',
        answer:
          'It uses the JavaScript (ECMAScript) engine built into your browser, so results match RegExp in Node.js and front-end code. PCRE-only syntax such as possessive quantifiers is not supported.',
      },
      {
        question: 'Why does my pattern only find one match?',
        answer: 'Without the g (global) flag a JavaScript regex stops after the first match. Tick g to find every match.',
      },
      {
        question: 'What does the u flag change?',
        answer:
          'The u flag enables full Unicode matching, so emoji and other astral characters count as one character, and it makes the syntax stricter: for example, unnecessary escapes become errors.',
      },
      {
        question: 'Why did live matching pause?',
        answer:
          'Patterns with nested quantifiers such as (a+)+ can take exponential time on some inputs and freeze the page. The tester detects these and waits for you to click Run once.',
      },
    ],
    related: ['url-encoder', 'json-formatter', 'text-case-converter', 'word-counter'],
    processing: 'browser',
    comparison: {
      competitors: ['regex101', 'RegExr', 'Coddy Regex Tester', 'OpenReplay Regex Tester'],
      commonFeatures: [
        'Real-time match highlighting',
        'Capture group details',
        'Flag toggles',
        'Substitution / replace preview',
        'Token-by-token pattern explanation',
        'Multiple regex flavours (PCRE, Python, Go)',
        'Saved patterns and permalinks',
        'Community pattern library',
      ],
      implemented: [
        'Fixed an XSS bug: highlighted matches were injected with innerHTML, so HTML in the test string was executed; matches are now rendered as text',
        'Fixed results that lagged one keystroke behind the input',
        'Replace preview with group references',
        'Named group labels',
        'Paste /pattern/flags literals',
        'Catastrophic-backtracking guard and input size cap',
        'Replaced presets that relied on ambiguous nested quantifiers',
      ],
      backlog: [
        'Plain-English explanation of each token',
        'PCRE / Python flavours',
        'Shareable permalinks',
        'Run matching in a Web Worker with a timeout (needs a worker-src CSP change)',
      ],
      advantages: ['Runs entirely in your browser – test data is never uploaded', 'No signup', 'Warns about catastrophic backtracking before it freezes the page'],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'uuid-generator',
    legacyId: 'uuid-generator',
    hub: 'utility-tools',
    category: 'developer',
    name: 'UUID Generator',
    icon: '🆔',
    summary: 'Generate secure random v4, time-ordered v7 or v1 UUIDs in bulk and validate them',
    seoTitle: 'UUID Generator – Bulk v4, v7 & v1 UUIDs Online',
    seoDescription:
      "Generate random v4, time-ordered v7 or v1 UUIDs in bulk, up to 1,000 at once, with your browser's secure random generator. Copy, download or validate UUIDs.",
    keywords: ['uuid generator', 'uuid v4 generator', 'uuid v7 generator', 'guid generator', 'bulk uuid generator', 'uuid validator'],
    answer:
      'A UUID (universally unique identifier) is a 128-bit ID written as 32 hexadecimal digits in the pattern 8-4-4-4-12. This free generator creates random version 4 UUIDs with the Web Crypto secure random generator, time-ordered version 7 UUIDs for database keys and version 1 UUIDs, up to 1,000 at a time, with uppercase, hyphen and brace formats.',
    howTo: [
      'Choose a version: v4 for random IDs, v7 for time-ordered database keys, or v1.',
      'Enter how many UUIDs you need, from 1 to 1,000.',
      'Click Generate.',
      'Adjust the format with the Uppercase, Hyphens and Braces options.',
      'Click Copy all or Download .txt, or paste a UUID into Validate a UUID to check it.',
    ],
    features: [
      'UUID v4 generated with crypto.randomUUID / crypto.getRandomValues',
      'UUID v7 (RFC 9562) with a millisecond timestamp and in-order bulk output',
      'UUID v1 with a random node ID instead of your MAC address',
      'Bulk generation of up to 1,000 UUIDs',
      'Uppercase, no-hyphen and {brace} GUID formats',
      'Copy one, copy all or download as .txt',
      'Validator that reports the version, variant and v7 timestamp',
    ],
    faqs: [
      {
        question: 'Are these UUIDs random and unique?',
        answer:
          "Version 4 UUIDs contain 122 random bits from your browser's cryptographically secure generator (Web Crypto), not Math.random. The chance of generating the same v4 UUID twice is negligible for any practical number of IDs.",
      },
      {
        question: 'Should I use UUID v4 or v7?',
        answer:
          'Use v4 when you just need an unpredictable ID. Use v7 for database primary keys: it starts with a timestamp, so new IDs sort in creation order and keep B-tree indexes compact.',
      },
      {
        question: 'What is the difference between a UUID and a GUID?',
        answer:
          "GUID is Microsoft's name for the same 128-bit identifier. GUIDs are often shown in uppercase inside braces, which you can produce with the Uppercase and Braces options.",
      },
      {
        question: 'Does the v1 UUID reveal my MAC address?',
        answer: 'No. Browsers cannot read your MAC address, so this tool uses a random node ID with the multicast bit set, as RFC 9562 allows.',
      },
    ],
    related: ['password-generator', 'hash-generator', 'jwt-decoder', 'base64-encoder'],
    processing: 'browser',
    comparison: {
      competitors: ['UUIDTools.com', 'GUIDGenerator.com', 'FastUUID', 'CodeShack UUID Generator'],
      commonFeatures: [
        'UUID v4 generation',
        'UUID v7 generation',
        'Bulk generation (up to 1,000)',
        'Uppercase / braces / no-hyphen formatting',
        'Download as TXT, JSON or CSV',
        'UUID validation',
        'v1, v3, v5 and ULID support',
      ],
      implemented: [
        'Replaced a malformed pseudo-v1 generator (built from Date.now() and Math.random) with RFC 9562 version 1',
        'Added UUID v7',
        'Removed the Math.random fallback for v4; only Web Crypto is used',
        'Bulk generation raised from 100 to 1,000',
        'Formatting options and .txt download',
        'Validator reports version, variant, Nil / Max UUIDs and v7 timestamps',
      ],
      backlog: ['Name-based v3 / v5 UUIDs', 'ULID and NanoID', 'JSON / CSV export'],
      advantages: ['Runs entirely in your browser – nothing is sent to a server', 'No signup', 'Cryptographically secure randomness only'],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'jwt-decoder',
    legacyId: 'jwt-decoder',
    hub: 'utility-tools',
    category: 'developer',
    name: 'JWT Decoder',
    icon: '🔓',
    summary: 'Decode JWT header, payload and claims with expiry status – signatures are not verified',
    seoTitle: 'JWT Decoder – Decode JSON Web Tokens in Your Browser',
    seoDescription:
      'Decode a JWT to read its header, payload and claims, check expiry times and spot unsigned tokens. Runs locally in your browser and does not verify signatures.',
    keywords: ['jwt decoder', 'decode jwt', 'jwt token decoder', 'jwt parser online', 'json web token decoder', 'check jwt expiry'],
    answer:
      "A JWT decoder reads a JSON Web Token's Base64URL-encoded header and payload and shows them as readable JSON. This free tool decodes tokens in your browser as you paste them, explains standard claims such as exp, iat and aud, and shows whether the token has expired. It does not verify signatures, so never trust decoded claims on their own.",
    howTo: [
      'Paste the token into the Encoded token box; a leading "Bearer " is removed automatically.',
      'Read the decoded Header and Payload JSON.',
      'Check the claims table and the expiry status for exp, nbf and iat.',
      'Copy the header or payload JSON if you need it.',
      'Verify the signature on your server before trusting any claim.',
    ],
    features: [
      'Decodes as you paste, with correct Base64URL and UTF-8 handling',
      'Pretty-printed header and payload JSON with copy buttons',
      'Readable dates for exp, iat and nbf plus expired / not-yet-valid status',
      'Claims table for iss, sub, aud, jti and time claims',
      'Warns about unsigned alg "none" tokens and recognises encrypted JWE tokens',
      'Specific errors for a wrong part count, invalid Base64URL or invalid JSON',
    ],
    faqs: [
      {
        question: 'Does this JWT decoder verify the signature?',
        answer:
          'No. It only decodes the header and payload. Anyone can create a token with any claims, so signatures must be verified on your server with the correct secret or public key before you trust the contents.',
      },
      {
        question: 'Is it safe to paste a production token here?',
        answer:
          'The token is decoded entirely in your browser and is never sent to a server. Still, treat live tokens like passwords: they grant access until they expire, so prefer test tokens.',
      },
      {
        question: 'Why does my JWT fail to decode?',
        answer:
          'A signed JWT has exactly three Base64URL parts separated by dots. A missing part, standard Base64 characters or a truncated copy will cause an error, and the tool tells you which part is wrong.',
      },
      {
        question: 'What do exp, iat and nbf mean?',
        answer:
          'They are Unix timestamps in seconds: exp is when the token expires, iat is when it was issued and nbf is the time before which it must not be accepted. The decoder shows each as a date and a relative time.',
      },
    ],
    related: ['base64-encoder', 'json-formatter', 'hash-generator', 'uuid-generator'],
    processing: 'browser',
    comparison: {
      competitors: ['jwt.io (Auth0 debugger)', 'jwt.ms (Microsoft)', 'FusionAuth JWT Decoder', 'Logto JWT Decoder'],
      commonFeatures: [
        'Automatic header and payload decoding',
        'Claim descriptions and readable timestamps',
        'Signature verification with a secret or public key',
        'Token encoding / signing',
        'Client-side processing',
      ],
      implemented: [
        'Live decoding as you paste (no Decode button needed)',
        'Prominent "signature is not verified" notice',
        'Expiry status and relative times',
        'Crash fix: object or array claims (e.g. aud arrays) no longer break rendering',
        'Strict Base64URL validation with part-specific errors',
        'Bearer prefix stripping, alg "none" warning and JWE detection',
        'Sample token',
      ],
      backlog: ['Signature verification with an HMAC secret or public key (Web Crypto)', 'Token encoder / signer', 'Colour-coded token segments'],
      advantages: ['Runs entirely in your browser – tokens are never sent to a server', 'No signup', 'Clear about what is and is not verified'],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'sql-formatter',
    legacyId: 'sql-formatter',
    hub: 'utility-tools',
    category: 'developer',
    name: 'SQL Formatter',
    icon: '💾',
    summary: 'Beautify or minify SQL for MySQL, PostgreSQL, SQL Server, Oracle, BigQuery and more',
    seoTitle: 'SQL Formatter – Beautify & Minify SQL Queries Online',
    seoDescription:
      'Format and beautify SQL for MySQL, PostgreSQL, SQL Server, Oracle, BigQuery, Snowflake and more. Set keyword case and indentation, or minify to one line.',
    keywords: ['sql formatter', 'sql beautifier', 'format sql online', 'sql query formatter', 'sql minifier', 'postgresql formatter', 'mysql formatter'],
    answer:
      'An SQL formatter rewrites a query with consistent line breaks, indentation and keyword case so it is easier to read and review. This free tool formats SQL as you type for 14 dialects including MySQL, PostgreSQL, SQL Server, Oracle PL/SQL, BigQuery and Snowflake, lets you choose keyword case and indentation, and can minify a query to one line.',
    howTo: [
      'Paste a query into the SQL input box, open a .sql file, or click Load sample.',
      'Choose your database in the Dialect list.',
      'Pick the Keyword case and Indentation you prefer.',
      'Tick Minify to one line if you need a compact query.',
      'Copy or download the formatted SQL.',
    ],
    features: [
      'Formats as you type using the open-source sql-formatter library',
      '14 dialects including MySQL, PostgreSQL, T-SQL, PL/SQL, BigQuery, Snowflake and SQLite',
      'Uppercase, lowercase or preserved keyword case',
      '2-space, 4-space or tab indentation',
      'Minify to one line without touching string literals',
      'Parse errors shown with the failing line and column',
      'Open .sql files, copy and download',
    ],
    faqs: [
      {
        question: 'Which SQL dialect should I choose?',
        answer:
          'Pick the database the query runs on. Dialects differ in quoting, operators and keywords, such as T-SQL square brackets or PostgreSQL :: casts, and the matching dialect avoids parse errors. Standard SQL works for simple queries.',
      },
      {
        question: 'Does formatting change what my query does?',
        answer: 'No. Only whitespace, line breaks and, if you choose, keyword case change. Identifiers, string literals and comments are kept as written.',
      },
      {
        question: 'Why do I get a parse error?',
        answer:
          'Usually there is an unclosed quote or bracket, or the query uses syntax from a different database. Check the position in the error message and select the dialect your database uses.',
      },
      {
        question: 'Is my SQL sent to a server?',
        answer: 'No. Formatting runs in your browser, so queries containing table names or data never leave your device.',
      },
    ],
    related: ['json-formatter', 'html-formatter', 'css-formatter', 'regex-tester'],
    processing: 'browser',
    comparison: {
      competitors: ['sqlformat.org', 'Instant SQL Formatter (dpriver.com)', 'Redgate SQL Formatter', 'CodeBeautify SQL Formatter', 'Aiven SQL Formatter'],
      commonFeatures: [
        'Multiple SQL dialects',
        'Keyword case options',
        'Indentation settings',
        'Minify / compress SQL',
        'Copy and download',
        'Formatting style presets',
        'Convert SQL to code strings (Java, C# etc.)',
      ],
      implemented: [
        'Fixed the SQL Server option, which passed an unsupported dialect name ("mssql") and always failed',
        'Added BigQuery, Snowflake, Redshift, Spark, Trino and DuckDB dialects',
        'Keyword case option and tab indentation',
        'String- and comment-aware minify (the old minify swallowed code after -- comments and collapsed spaces inside strings)',
        'Load sample, open .sql file and download',
        'Removed alert() pop-ups',
      ],
      backlog: ['Syntax highlighting', 'Style presets (e.g. tabular alignment)', 'Convert SQL to code strings'],
      advantages: ['Runs entirely in your browser', 'No signup', 'Minify never alters string literals'],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'css-formatter',
    legacyId: 'css-formatter',
    hub: 'utility-tools',
    category: 'developer',
    name: 'CSS Formatter',
    icon: '🎨',
    summary: 'Beautify or minify CSS with safe handling of selectors, strings and url() values',
    seoTitle: 'CSS Formatter & Beautifier – Format or Minify CSS',
    seoDescription:
      'Beautify messy CSS with clean indentation or minify it for production. Keeps a:hover, url() data and strings intact and flags unbalanced braces. Free.',
    keywords: ['css formatter', 'css beautifier', 'format css online', 'css minifier', 'css prettifier', 'minify css online'],
    answer:
      'A CSS formatter, or beautifier, reorganises stylesheet code so each selector, declaration and closing brace sits on its own indented line. This free tool formats CSS as you type with 2-space, 4-space or tab indentation, or minifies it for production, keeps comments, strings and url() values intact, and warns about unclosed braces or declarations missing a colon.',
    howTo: [
      'Paste CSS into the CSS input box, open a .css file, or click Load sample.',
      'Choose Beautify or Minify.',
      'Select an indent of 2 spaces, 4 spaces or Tab.',
      'Review any syntax warnings shown below the editors.',
      'Copy or download the result.',
    ],
    features: [
      'Beautifies CSS with one declaration per line',
      'Minifies CSS and shows the size saving',
      'Handles nested rules and @media / @supports blocks',
      'Keeps pseudo-classes, strings and url() data URIs intact',
      'Warns about unbalanced braces, unclosed comments and missing colons',
      'Keeps comments when beautifying and /*! licence */ comments when minifying',
      'Open .css files, copy and download',
    ],
    faqs: [
      {
        question: 'Will formatting change how my CSS works?',
        answer:
          'No. Only whitespace and line breaks change; selectors, property values and strings are kept as written. Minifying also drops comments and the last semicolon in each block, which browsers do not need.',
      },
      {
        question: 'How much does minifying CSS save?',
        answer:
          'It depends on how much whitespace and how many comments the file has, and the tool shows the exact percentage saved for your code. Serving files with gzip or Brotli compression saves more on top.',
      },
      {
        question: 'Does it support nested CSS and media queries?',
        answer:
          'Yes. @media, @supports and native CSS nesting are indented by level. SCSS that follows the same brace structure is formatted too, but mixins and variables are not compiled.',
      },
      {
        question: 'Is my CSS uploaded?',
        answer: 'No. The formatter runs in your browser and your code never leaves your device.',
      },
    ],
    related: ['html-formatter', 'color-picker', 'json-formatter', 'sql-formatter'],
    processing: 'browser',
    comparison: {
      competitors: ['CSS Portal CSS Formatter', 'CodeBeautify CSS Beautify/Minify', 'CodeShack CSS Formatter', '10015.io CSS Formatter', 'CleanCSS'],
      commonFeatures: [
        'Beautify with configurable indentation',
        'Minify / compress CSS',
        'Syntax highlighting',
        'Load CSS from a file or URL',
        'Brace checking / validation',
        'Sort properties',
        'Copy and download',
      ],
      implemented: [
        'Rewrote the formatter as a tokenizer: the old regex version turned a:hover into "a: hover" and broke url(https://…) values and strings containing ; or {',
        'Syntax warnings with line numbers',
        'Tab indentation',
        'Size saving display',
        'Load sample, open file and download',
        'Removed alert() pop-ups',
      ],
      backlog: ['Syntax highlighting', 'Property sorting', 'Load CSS from a URL', 'Advanced minification (shorthand merging, colour shortening)'],
      advantages: ['Runs entirely in your browser', 'No signup', 'Never alters string contents or url() values'],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'html-formatter',
    legacyId: 'html-formatter',
    hub: 'utility-tools',
    category: 'developer',
    name: 'HTML Formatter',
    icon: '🌐',
    summary: 'Indent or minify HTML, keep pre/script content safe and flag unclosed tags',
    seoTitle: 'HTML Formatter & Beautifier – Indent or Minify HTML',
    seoDescription:
      'Format messy or minified HTML with clean indentation, or minify it. Keeps pre, script and style content safe and flags unclosed or mismatched tags.',
    keywords: ['html formatter', 'html beautifier', 'format html online', 'html minifier', 'html prettifier', 'indent html'],
    answer:
      'An HTML formatter, or beautifier, indents markup so each block element sits on its own line and nesting is easy to follow. This free tool formats HTML as you type with 2-space, 4-space or tab indentation, keeps short inline content on one line, preserves pre and textarea content exactly, and warns about unclosed or mismatched tags. It can also minify HTML.',
    howTo: [
      'Paste HTML into the HTML input box, open an .html file, or click Load sample.',
      'Choose Beautify or Minify.',
      'Select an indent of 2 spaces, 4 spaces or Tab.',
      'Fix any unclosed or mismatched tags listed under Markup problems found.',
      'Copy or download the result.',
    ],
    features: [
      'Indents nested elements and keeps short inline content on one line',
      'Preserves pre and textarea content and re-indents script and style blocks',
      'Handles void elements, self-closing tags, comments and the doctype',
      'Warns about unclosed, mismatched and stray closing tags with line numbers',
      'Minifies HTML without removing spaces between inline elements',
      'Open .html files, copy and download',
    ],
    faqs: [
      {
        question: 'Will formatting change how my page looks?',
        answer:
          'Block layout is unaffected. Whitespace between inline elements can matter, so the formatter keeps short inline runs such as <p>Hello <b>world</b></p> on one line and never changes pre or textarea content.',
      },
      {
        question: 'Does it fix broken HTML?',
        answer:
          'It does not rewrite your markup, but it lists unclosed, mismatched and stray closing tags with line numbers so you can fix them. Elements whose end tags are optional, such as li and p, are not reported.',
      },
      {
        question: 'Is my HTML rendered or executed?',
        answer: 'No. The formatter only processes the code as text, so scripts in your HTML never run, and nothing is uploaded.',
      },
      {
        question: 'What does minifying HTML remove?',
        answer: 'Comments (except conditional comments) and unnecessary whitespace between tags. Content inside pre and textarea is left untouched.',
      },
    ],
    related: ['css-formatter', 'markdown-preview', 'json-formatter', 'url-encoder'],
    processing: 'browser',
    comparison: {
      competitors: ['CodeShack HTML Formatter', 'JSONFormatter.org HTML Formatter', 'Formatter.org HTML Formatter', 'Static.app HTML Formatter'],
      commonFeatures: [
        'Beautify with configurable indentation',
        'Minify HTML',
        'Format embedded CSS and JavaScript',
        'Syntax highlighting',
        'Attribute wrapping',
        'Live HTML preview',
        'Copy and download',
      ],
      implemented: [
        'Fixed the beautifier, which added line breaks and then immediately collapsed them, so output stayed on one line',
        'Tokenizer that respects quoted attributes containing >, raw-text elements and void elements',
        'Tag balance warnings with line numbers',
        'Short inline content kept on one line',
        'Load sample, open file and download',
        'Removed alert() pop-ups',
      ],
      backlog: ['Format embedded CSS / JS with the CSS formatter', 'Attribute wrapping', 'Sandboxed live preview', 'Syntax highlighting'],
      advantages: ['Runs entirely in your browser', 'No signup', 'Never executes the HTML you paste'],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'markdown-preview',
    legacyId: 'markdown-preview',
    hub: 'utility-tools',
    category: 'developer',
    name: 'Markdown Preview',
    icon: '📄',
    summary: 'Live GitHub-style Markdown preview with sanitised HTML export and .md files',
    seoTitle: 'Markdown Preview – Live Markdown Editor & HTML Export',
    seoDescription:
      'Write Markdown and see a live GitHub-style preview. Supports tables and task lists, exports clean sanitised HTML and opens or saves .md files in your browser.',
    keywords: ['markdown preview', 'markdown editor online', 'markdown to html', 'live markdown preview', 'markdown viewer', 'github markdown preview'],
    answer:
      'A Markdown previewer shows how Markdown text will look once it is converted to HTML. This free editor renders GitHub Flavored Markdown as you type, including tables, task lists and fenced code, in a light or dark theme. You can open and save .md files, copy the generated HTML or download it as a page, and unsafe scripts are removed.',
    howTo: [
      'Type or paste Markdown into the Markdown box, or click Open .md file.',
      'Watch the Preview update as you type and switch between the Light and Dark theme.',
      'Click HTML code to see the generated HTML.',
      'Click Copy HTML or Download .html to export the result.',
      'Click Download .md to save your Markdown source.',
    ],
    features: [
      'Live preview of GitHub Flavored Markdown: tables, task lists, strikethrough and fenced code',
      'Sanitised output: scripts, event handlers and javascript: links are removed',
      'Copy HTML or download a standalone .html page',
      'Open .md files and download your Markdown',
      'Light and dark preview themes',
      'Word and character count',
      'Built-in Markdown cheat sheet',
    ],
    faqs: [
      {
        question: 'Which Markdown syntax is supported?',
        answer:
          'CommonMark plus the GitHub Flavored Markdown extensions: tables, task lists, strikethrough, autolinks and fenced code blocks. Raw HTML is allowed but is sanitised.',
      },
      {
        question: 'Is the exported HTML safe to publish?',
        answer:
          'The HTML is sanitised against an allow-list: script and iframe elements, event handler attributes such as onclick, and javascript: URLs are removed. Still review content from untrusted sources before publishing.',
      },
      {
        question: 'Why does # become an h2 in the preview?',
        answer:
          'This page already has its own main heading, so the preview renders # headings as h2 elements (styled like h1) to keep the page accessible. The copied and downloaded HTML keeps your original heading levels.',
      },
      {
        question: 'Are my documents saved or uploaded?',
        answer: 'No. Everything runs in your browser and nothing is stored or uploaded. Use Download .md to keep a copy of your work.',
      },
    ],
    related: ['html-formatter', 'word-counter', 'text-case-converter', 'css-formatter'],
    processing: 'browser',
    comparison: {
      competitors: ['Dillinger', 'Markdown Live Preview (markdownlivepreview.dev)', 'MarkdownViewer.dev', 'Coddy Markdown Editor'],
      commonFeatures: [
        'Split-screen live preview',
        'GitHub Flavored Markdown',
        'Export to HTML',
        'Export to PDF',
        'Syntax-highlighted code blocks',
        'Open / import .md files',
        'Mermaid diagrams and LaTeX math',
        'Cloud sync (GitHub, Dropbox, Google Drive)',
      ],
      implemented: [
        'Fixed an XSS hole: raw HTML such as <img onerror> and javascript: links executed in the preview; output is now sanitised with an allow-list',
        'Preview headings shifted one level so the page keeps a single H1 (fixes the intermittent registry failure)',
        'Open .md file, download .md and standalone .html',
        'Preview / HTML code toggle and word count',
        'Removed alert() pop-ups',
      ],
      backlog: ['Syntax highlighting in code blocks', 'Export to PDF', 'Mermaid diagrams and LaTeX math', 'Autosave drafts in the browser', 'Synchronised scrolling'],
      advantages: ['Runs entirely in your browser – nothing is uploaded or stored', 'No signup', 'Sanitised HTML export'],
    },
    reviewed: '2026-09-24',
  },
];
