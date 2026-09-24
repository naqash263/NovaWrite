// Tool content for the "ai" batch. See ./types.ts for field rules.
// All five tools send text to the Laravel API, which calls Google Gemini (processing: 'ai').
import type { ToolContent } from './types';

const aiPrivacyFaq = {
  question: 'Is my text stored or shared?',
  answer:
    "Your text is sent over HTTPS to this site's server and on to Google Gemini to generate the result. This site does not save the text or the result. Avoid pasting passwords, personal data or confidential documents into any online AI tool.",
};

export const aiTools: ToolContent[] = [
  {
    slug: 'text-summarizer',
    legacyId: 'text-summarizer',
    hub: 'ai-tools',
    category: 'ai-writing',
    name: 'Text Summarizer',
    icon: '📝',
    summary: 'Summarize articles, reports and notes with AI in short, medium or long form',
    seoTitle: 'Text Summarizer: Free AI Summary Generator Online',
    seoDescription:
      'Free AI text summarizer: paste up to 50,000 characters and get a short, medium or long summary, or the key points, in seconds. No signup required.',
    keywords: [
      'text summarizer',
      'ai summarizer free',
      'summarize text online',
      'article summarizer',
      'summary generator',
      'summarize a paragraph',
      'key points generator',
    ],
    answer:
      'A text summarizer condenses a long piece of writing into a shorter version that keeps the main ideas. This free tool sends your text to Google Gemini and returns a short, medium or long summary, or a list of key points. It accepts 50 to 50,000 characters, needs no signup, and shows how much shorter the summary is. Always check the summary against the original.',
    howTo: [
      'Choose a summary length: short, medium or long.',
      'Pick a focus: general summary, key points or detailed summary.',
      'Paste your text into the "Text to summarize" box (at least 50 characters).',
      'Click "Generate summary" or press Ctrl + Enter.',
      'Review the summary, then copy it or download it as a .txt file.',
    ],
    features: [
      'Three summary lengths: short (2-3 sentences), medium (1-2 paragraphs) and long (3-5 paragraphs)',
      'Three focus modes: general summary, key points and detailed summary',
      'Accepts up to 50,000 characters per request, with a live word and character counter',
      'Shows original and summary word counts and how much shorter the summary is',
      'Copy the summary with one click or download it as a .txt file',
      'Clear validation and error messages, including when the free AI quota is busy',
    ],
    faqs: [
      {
        question: 'How long can the text be?',
        answer:
          'Between 50 and 50,000 characters per request, roughly 8,000 words of English. For longer documents, summarize each chapter or section separately and then summarize the combined result.',
      },
      {
        question: 'Does it copy sentences or write a new summary?',
        answer:
          'It writes a new (abstractive) summary with an AI model rather than only picking existing sentences. Choose the "Key points" focus when you want a list of the main ideas.',
      },
      {
        question: 'How accurate are AI summaries?',
        answer:
          'Usually good for the main points, but AI models can leave out details or state something the text does not say. Check names, numbers and conclusions against the original before you rely on the summary.',
      },
      aiPrivacyFaq,
    ],
    related: ['article-rewriter', 'keyword-extractor', 'word-counter', 'token-counter', 'grammar-checker'],
    processing: 'ai',
    comparison: {
      competitors: ['QuillBot Summarizer', 'Scribbr Summarizer', 'SMMRY'],
      commonFeatures: [
        'Adjustable summary length (QuillBot uses a slider)',
        'Paragraph and bullet-point / key-sentence modes',
        'Free input limits (QuillBot free: 1,200 words; Scribbr without an account: 600 words)',
        'Upload of PDF or Word files (QuillBot)',
        'Copy the summary',
      ],
      implemented: [
        'Removed duplicated marketing, feature and FAQ blocks from the tool body',
        'Validation messages for empty and too-short text instead of a silently disabled button',
        'Clear messages for rate limits (429), server errors (500) and network failures',
        'Warning when pasted text is cut at the 50,000-character limit, plus a word counter',
        'Copy with visible confirmation instead of a blocking alert, and download as .txt',
        'Word-based statistics computed in the browser, Ctrl + Enter shortcut, labelled controls',
        'Sends the login token so a logged-in user\'s own Gemini key is used',
      ],
      backlog: ['Upload .txt, PDF or Word files', 'Summarize a web page from its URL', 'Summary length slider with more steps'],
      advantages: [
        'Accepts up to 50,000 characters without an account, more than the free word limits of the summarizers reviewed',
        'Key-points and detailed focus modes are free',
        'No signup, no watermark and nothing saved by this site',
      ],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'article-rewriter',
    legacyId: 'article-rewriter',
    hub: 'ai-tools',
    category: 'ai-writing',
    name: 'Article Rewriter',
    icon: '✍️',
    summary: 'Rewrite and paraphrase text in five styles and four tones with AI',
    seoTitle: 'Article Rewriter: Free AI Paraphrasing Tool Online',
    seoDescription:
      'Free AI article rewriter and paraphrasing tool: rewrite up to 5,000 characters in formal, casual, creative, academic or professional style. No signup.',
    keywords: [
      'article rewriter',
      'paraphrasing tool',
      'paraphrase text free',
      'ai rewriter',
      'rewrite text online',
      'sentence rewriter',
      'reword paragraph',
    ],
    answer:
      'An article rewriter, or paraphrasing tool, rewords text so it reads differently while keeping the same meaning. This free tool uses Google Gemini to rewrite up to 5,000 characters at a time in a formal, casual, creative, academic or professional style, with a neutral, positive, persuasive or informative tone. Review the result and credit original sources where needed.',
    howTo: [
      'Choose a writing style and a tone.',
      'Leave "Keep the exact meaning" ticked to avoid added or removed information.',
      'Paste your text into the "Text to rewrite" box (50 to 5,000 characters).',
      'Click "Rewrite text" or press Ctrl + Enter.',
      'Review the result, then copy it, download it or click "Use as input" to rewrite it again.',
    ],
    features: [
      'Five writing styles: formal, casual, creative, academic and professional',
      'Four tones: neutral, positive, persuasive and informative',
      '"Keep the exact meaning" option that tells the AI not to add or drop information',
      'Rewrites up to 5,000 characters per request, with a live word and character counter',
      'Copy, download as .txt, or reuse the result as new input',
      'Word count before and after each rewrite',
    ],
    faqs: [
      {
        question: 'Is the rewritten text plagiarism-free?',
        answer:
          'Rewording does not remove the need to credit ideas. The AI changes wording and sentence structure, but the ideas still come from the source, so cite it where required and run your own plagiarism check for academic or published work.',
      },
      {
        question: 'Why is the limit 5,000 characters?',
        answer:
          'The AI model returns a limited amount of text per request, so longer input could come back incomplete. Rewrite long articles one section at a time to get the full text back.',
      },
      {
        question: 'Which style should I choose?',
        answer:
          'Use formal or professional for business writing, academic for essays and reports, casual for social posts and emails to friends, and creative for marketing copy or storytelling.',
      },
      aiPrivacyFaq,
    ],
    related: ['grammar-checker', 'text-summarizer', 'word-counter', 'text-case-converter', 'language-translator'],
    processing: 'ai',
    comparison: {
      competitors: ['QuillBot Paraphraser', 'Grammarly', 'Scribbr Paraphrasing Tool'],
      commonFeatures: [
        'Several rewriting modes (QuillBot free: Standard and Fluency; more modes in Premium)',
        'Free input limit (QuillBot free: 125 words per paraphrase)',
        'Synonym controls and side-by-side comparison of changes',
        'Copy the result',
      ],
      implemented: [
        'Removed duplicated marketing and FAQ blocks, including the unsupported "plagiarism-free" claim',
        'Limit lowered from 50,000 to 5,000 characters so the AI reply is not cut off, with a counter and truncation warning',
        'Validation for empty and too-short text; clear 429, 500 and network error messages',
        'Copy confirmation, download as .txt and "Use as input" to rewrite again',
        'Labelled selects and checkbox, Ctrl + Enter shortcut',
      ],
      backlog: ['Side-by-side view highlighting changed words', 'Synonym slider or per-word alternatives', 'Custom style instructions'],
      advantages: [
        'All five styles and four tones are free, with no signup',
        'Up to 5,000 characters per request, more than the free per-paraphrase word limit reported for QuillBot',
        'Nothing is saved by this site',
      ],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'grammar-checker',
    legacyId: 'grammar-checker',
    hub: 'ai-tools',
    category: 'ai-writing',
    name: 'Grammar Checker',
    icon: '✅',
    summary: 'Check spelling, grammar and style with AI and see every change highlighted',
    seoTitle: 'Grammar Checker: Free AI Spelling & Grammar Check',
    seoDescription:
      'Free AI grammar checker: fix spelling, grammar and style in up to 5,000 characters and see every change highlighted before you copy the text. No signup.',
    keywords: [
      'grammar checker',
      'free grammar check',
      'spell checker online',
      'ai grammar checker',
      'punctuation checker',
      'proofread text online',
      'sentence corrector',
    ],
    answer:
      'A grammar checker finds and fixes spelling, grammar, punctuation and style mistakes in your writing. This free tool sends up to 5,000 characters to Google Gemini, returns a corrected version, and highlights every removed and added word so you can see exactly what changed. It also lists suggestions for clearer writing. Review each change before you use it.',
    howTo: [
      'Choose what to check: spelling, grammar, style and suggested improvements.',
      'Paste your text into the "Text to check" box (10 to 5,000 characters).',
      'Click "Check grammar" or press Ctrl + Enter.',
      'Review the highlighted changes and the list of suggestions.',
      'Copy or download the corrected text, or click "Replace my text" to keep editing.',
    ],
    features: [
      'Checks spelling, grammar and style, with optional suggestions for improvement',
      'Highlights every change: removed words struck through in red, added words underlined in green',
      'Shows the full corrected text plus separate suggestion and improvement lists',
      'Checks up to 5,000 characters per request, with a live word and character counter',
      'Copy or download the corrected text, or replace your input with it',
      'Clear error messages when the AI service is busy or unavailable',
    ],
    faqs: [
      {
        question: 'How do I see what the grammar checker changed?',
        answer:
          'After a check, the tool compares your text with the corrected version word by word. Removed words are struck through in red and added words are underlined in green, so you can review each change.',
      },
      {
        question: 'Which languages can it check?',
        answer:
          'It works best with English. The AI model can also correct many other languages, but results are less consistent, so review corrections carefully.',
      },
      {
        question: 'Is it as good as Grammarly?',
        answer:
          'It covers the core job of fixing spelling, grammar and punctuation in pasted text and shows every change. It does not offer browser extensions, real-time checking as you type or plagiarism detection.',
      },
      aiPrivacyFaq,
    ],
    related: ['article-rewriter', 'word-counter', 'text-case-converter', 'text-summarizer', 'language-translator'],
    processing: 'ai',
    comparison: {
      competitors: ['Grammarly', 'QuillBot Grammar Checker', 'Scribbr Grammar Checker'],
      commonFeatures: [
        'Inline underlines or highlights for each issue',
        'Accept a single fix or fix all errors at once (QuillBot)',
        'Spelling, grammar and punctuation checks',
        'Multilingual checking (QuillBot: English, German, French, Spanish, Portuguese)',
        'Browser extensions and real-time checking (Grammarly)',
      ],
      implemented: [
        'Word-level diff that highlights removed and added words',
        'Robust handling of AI responses: object suggestions no longer crash the page, empty corrections show an error',
        '"No changes suggested" message when the text is already correct',
        'Limit set to 5,000 characters so the corrected text and suggestions are not cut off',
        'Validation, 429/500/network error messages, copy confirmation, download and "Replace my text"',
        'Removed duplicated marketing blocks; options grouped in a labelled fieldset',
      ],
      backlog: ['Accept or reject individual changes', 'Explanations for each correction', 'Real-time checking while typing'],
      advantages: [
        'Shows a full corrected version plus a highlighted diff without an account',
        'Style suggestions are free',
        'Nothing is saved by this site',
      ],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'language-translator',
    legacyId: 'language-translator',
    hub: 'ai-tools',
    category: 'ai-writing',
    name: 'Language Translator',
    icon: '🌐',
    summary: 'Translate text between 29 languages with AI, with language detection and swap',
    seoTitle: 'Language Translator: Free AI Text Translator Online',
    seoDescription:
      'Free AI language translator: translate up to 5,000 characters between 29 languages with automatic language detection, swap and copy. No signup needed.',
    keywords: [
      'language translator',
      'ai translator',
      'translate text online',
      'free translator',
      'english to spanish translation',
      'translate paragraph',
      'text translator',
    ],
    answer:
      'A language translator converts text from one language into another. This free tool uses Google Gemini to translate up to 5,000 characters between 29 languages, including English, Spanish, French, German, Chinese, Arabic and Hindi. It can detect the source language, keep line breaks, and swap the languages with one click. Have important or legal translations checked by a fluent speaker.',
    howTo: [
      'Choose the source language in "Translate from", or leave it on "Detect language".',
      'Choose the target language in "Translate to".',
      'Type or paste your text into the "Text to translate" box (up to 5,000 characters).',
      'Click "Translate" or press Ctrl + Enter.',
      'Copy or download the translation, or use the swap button to translate it back.',
    ],
    features: [
      '29 languages, including English, Spanish, French, German, Chinese, Japanese, Arabic, Hindi and Ukrainian',
      'Automatic source-language detection',
      'Swap button that switches the languages and moves the translation into the input',
      'Option to keep line breaks and paragraphs',
      'Right-to-left display for Arabic and Hebrew translations',
      'Copy the translation or download it as a .txt file',
    ],
    faqs: [
      {
        question: 'Which languages are supported?',
        answer:
          'English, Spanish, French, German, Italian, Portuguese, Russian, Chinese, Japanese, Korean, Arabic, Hindi, Dutch, Polish, Turkish, Swedish, Norwegian, Danish, Finnish, Greek, Czech, Romanian, Hungarian, Thai, Vietnamese, Indonesian, Malay, Hebrew and Ukrainian.',
      },
      {
        question: 'How much text can I translate at once?',
        answer:
          'Up to 5,000 characters per request, the same per-translation limit Google Translate uses for typed text. Translate longer documents in parts so the full translation comes back.',
      },
      {
        question: 'Is an AI translation accurate enough for official documents?',
        answer:
          'AI translations are usually good for understanding and everyday communication, but they can miss idioms, terminology or tone. Use a professional translator for legal, medical or official documents.',
      },
      aiPrivacyFaq,
    ],
    related: ['grammar-checker', 'article-rewriter', 'text-summarizer', 'word-counter', 'text-converter'],
    processing: 'ai',
    comparison: {
      competitors: ['Google Translate', 'DeepL Translator'],
      commonFeatures: [
        'Automatic language detection',
        'Swap source and target languages',
        'Copy and listen to the translation (Google Translate)',
        'Document translation (Google: .docx, .pdf, .pptx, .xlsx up to 10 MB)',
        'Around 100+ languages (Google Translate and DeepL)',
        'Per-request limits (Google Translate: 5,000 characters)',
      ],
      implemented: [
        'Swap now also moves the translation into the input; disabled with an explanation when detecting',
        'Stopped showing the backend\'s rough language guess, which labelled most Latin-script text as English',
        'Same-language validation, 1-character minimum instead of 10 (short words can be translated)',
        'Limit set to 5,000 characters so long translations are not cut off',
        'Copy confirmation, download as .txt, right-to-left display for Arabic and Hebrew',
        'Removed duplicated marketing blocks; labelled selects and an accessible swap button',
      ],
      backlog: ['Text-to-speech for the translation', 'Document upload', 'More languages', 'Alternative translations for a selected word'],
      advantages: ['No signup or account needed', 'Keeps formatting on request', 'Nothing is saved by this site'],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'keyword-extractor',
    legacyId: 'keyword-extractor',
    hub: 'ai-tools',
    category: 'ai-analysis',
    name: 'Keyword Extractor',
    icon: '🔑',
    summary: 'Extract the main keywords from any text with AI, with counts and density',
    seoTitle: 'Keyword Extractor: Free AI Tool to Find Keywords in Text',
    seoDescription:
      'Free AI keyword extractor: pull the main keywords and phrases from up to 10,000 characters of text, see how often each appears, and export to CSV.',
    keywords: [
      'keyword extractor',
      'extract keywords from text',
      'keyword finder',
      'ai keyword extractor',
      'keyword density checker',
      'seo keywords from text',
    ],
    answer:
      'A keyword extractor finds the most important words and phrases in a piece of text. This free tool sends up to 10,000 characters to Google Gemini, returns 5 to 50 keywords, and can add related terms. It then counts how often each keyword appears in your text and its density. It does not provide search volumes, so pair it with a keyword research tool.',
    howTo: [
      'Paste your text into the "Text to extract keywords from" box (10 to 10,000 characters).',
      'Set the maximum number of keywords with the slider (5 to 50).',
      'Tick "Include related keywords and synonyms" if you want suggestions beyond your text.',
      'Click "Extract keywords" or press Ctrl + Enter.',
      'Copy the keywords as a comma-separated list or one per line, or download a CSV.',
    ],
    features: [
      'AI extraction of 5 to 50 keywords and key phrases',
      'Optional related keywords and synonyms',
      'Counts how often each keyword appears in your text and calculates its density',
      'Marks suggested terms that do not appear in your text as "related"',
      'Copy as a comma-separated list or one keyword per line',
      'Download keywords, counts and density as a CSV file',
    ],
    faqs: [
      {
        question: 'Does it show search volume?',
        answer:
          'No. It finds the keywords in your own text. For search volume, competition and cost-per-click data, use a keyword research tool such as WordStream or Google Keyword Planner.',
      },
      {
        question: 'How is keyword density calculated?',
        answer:
          'Density is the number of times a keyword appears (whole words, case-insensitive) multiplied by the words in the keyword, divided by the total words in your text. It is counted in your browser.',
      },
      {
        question: 'What is the text limit?',
        answer: 'From 10 to 10,000 characters per request. For longer pages, extract keywords from the most important sections.',
      },
      aiPrivacyFaq,
    ],
    related: ['word-counter', 'text-summarizer', 'article-rewriter', 'token-counter', 'text-case-converter'],
    processing: 'ai',
    comparison: {
      competitors: ['WordStream Free Keyword Tool', 'WordCount.com Keyword Extractor', 'Web Aloha Keyword Extractor', 'ToolsTwenty Keyword Extractor'],
      commonFeatures: [
        'Keyword and key-phrase extraction from pasted text',
        'Frequency counts and stop-word removal',
        'Extraction from a URL (Web Aloha)',
        'Search volume, competition and cost-per-keyword data (WordStream)',
      ],
      implemented: [
        'Occurrence count and density for every keyword, computed in the browser',
        'CSV export and one-per-line copy with visible confirmation instead of alerts',
        'Client-side 10,000-character limit matching the API, with a counter and truncation warning',
        'Clean-up of the AI list (numbering, bullets, "Keywords:" labels, duplicates)',
        'Validation plus 429/500/network error messages; labelled slider and textarea',
        'Removed duplicated marketing blocks from the tool body',
      ],
      backlog: ['Extract keywords from a URL', 'N-gram frequency table without AI', 'Search volume data'],
      advantages: [
        'Combines AI extraction with exact counts from your own text',
        'Related keywords and synonyms on request',
        'No signup, and nothing is saved by this site',
      ],
    },
    reviewed: '2026-09-24',
  },
];
