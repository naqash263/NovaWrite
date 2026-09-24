// Tool content for the "utility-documents-finance" batch. See ./types.ts for field rules.
import type { ToolContent } from './types';

export const utilityDocumentsFinanceTools: ToolContent[] = [
  {
    slug: 'loan-calculator',
    legacyId: 'loan-calculator',
    hub: 'utility-tools',
    category: 'finance',
    name: 'Loan Calculator',
    icon: '💰',
    summary: 'Monthly, bi-weekly or weekly loan payments, total interest, extra payments and an amortization schedule.',
    seoTitle: 'Loan Calculator with Amortization Schedule',
    seoDescription:
      'Free loan calculator: work out your monthly payment and total interest, see how extra payments shorten the loan, and download the amortization schedule.',
    keywords: [
      'loan calculator',
      'loan payment calculator',
      'amortization schedule calculator',
      'mortgage payment calculator',
      'loan calculator with extra payments',
      'car loan calculator',
    ],
    answer:
      'A loan calculator estimates the fixed payment needed to repay a loan with interest over a set term. This free tool uses the standard amortization formula to show your monthly, bi-weekly or weekly payment, total interest and payoff date, how extra payments reduce interest, and a full schedule you can view by year or download as CSV.',
    howTo: [
      'Enter the loan amount, the annual interest rate (APR) and the loan term in years.',
      'Choose the payment frequency: monthly, bi-weekly or weekly.',
      'Optionally add an extra payment each period to see the interest saved and the new payoff time.',
      'Review the payment, total paid and total interest, then open the amortization schedule by year or every payment.',
      'Click Download CSV to save the full schedule for a spreadsheet.',
    ],
    features: [
      'Payment per period for monthly, bi-weekly or weekly schedules',
      'Total paid, total interest and payoff time',
      'Extra payment option showing interest saved and how much sooner the loan ends',
      'Amortization schedule by year or by every payment',
      'Download the full schedule as a CSV file',
      'Currency selector (USD, EUR, GBP, INR, PKR, AED, CAD, AUD)',
      'Inline validation for empty, negative and out-of-range values',
    ],
    faqs: [
      {
        question: 'How is the monthly loan payment calculated?',
        answer:
          'The calculator uses the standard amortization formula: payment = P × r / (1 − (1 + r)^−n), where P is the loan amount, r the periodic interest rate (APR ÷ payments per year) and n the number of payments. At 0% interest the payment is simply P ÷ n.',
      },
      {
        question: 'What is the payment on a $100,000 loan at 5% for 30 years?',
        answer: 'About $536.82 per month. Over 360 payments you would pay roughly $193,256 in total, of which about $93,256 is interest.',
      },
      {
        question: 'How do extra payments affect my loan?',
        answer:
          'Extra payments go straight to principal, so each later payment includes less interest. Enter an amount in "Extra payment each period" to see the interest saved and how much earlier the loan is paid off.',
      },
      {
        question: 'Does the result include taxes, insurance or fees?',
        answer:
          'No. The estimate covers principal and interest on a fixed-rate loan only. Property tax, insurance, PMI and lender fees are not included, so a real mortgage payment can be higher.',
      },
    ],
    related: ['compound-interest-calculator', 'tip-calculator', 'percentage-calculator', 'currency-converter'],
    processing: 'browser',
    comparison: {
      competitors: ['Calculator.net Amortization Calculator', 'Bankrate Amortization Calculator', 'U.S. Bank Amortization Calculator', 'TheCalculatorSite Amortization Calculator'],
      commonFeatures: [
        'Monthly payment, total interest and total cost',
        'Full amortization schedule (monthly and annual views)',
        'Extra or one-time payments with interest saved',
        'Charts of principal versus interest',
        'Printable or exportable schedule',
      ],
      implemented: [
        'Extra payment per period with interest saved and earlier payoff',
        'Full schedule with By year / Every payment views (previously only the first 12 payments)',
        'CSV download of the schedule',
        'Payoff time and currency selector',
        'Labelled inputs with validation; fields can be cleared without snapping back to 0',
      ],
      backlog: ['Principal vs interest chart', 'One-time lump-sum payments on a chosen date', 'Start date with calendar payoff date', 'Print-friendly schedule'],
      advantages: ['Runs entirely in your browser; no figures are sent anywhere', 'No signup, ads inside the tool or email gate', 'Bi-weekly and weekly schedules alongside monthly'],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'tip-calculator',
    legacyId: 'tip-calculator',
    hub: 'utility-tools',
    category: 'finance',
    name: 'Tip Calculator',
    icon: '💵',
    summary: 'Work out the tip, the total and what each person pays when you split the bill.',
    seoTitle: 'Tip Calculator: Split the Bill and Tip Per Person',
    seoDescription:
      'Free tip calculator: enter the bill, choose a tip percentage and split between any number of people to see the tip and total per person, with optional round-up.',
    keywords: ['tip calculator', 'split bill calculator', 'tip per person', 'how much to tip', 'restaurant tip calculator', 'gratuity calculator'],
    answer:
      'A tip calculator works out the gratuity on a bill and each person’s share when the bill is split. Enter the bill, pick a tip percentage and the number of people to see the tip, the total and the amount per person. For example, a 15% tip on an $80 bill split four ways is $3.00 tip and $23.00 each.',
    howTo: [
      'Enter the bill amount.',
      'Tap a tip preset (10%, 15%, 18%, 20% or 25%) or type a custom tip percentage.',
      'Set the number of people sharing the bill with the − and + buttons or by typing.',
      'Optionally enter the tax included in the bill so the tip is calculated on the pre-tax amount.',
      'Tick "Round each share up to a whole amount" if you want even payments, then read the tip and total per person.',
    ],
    features: [
      'Tip presets from 10% to 25% plus any custom percentage from 0 to 100%',
      'Bill splitting between 1 and 1,000 people with tip and total per person',
      'Optional tip on the pre-tax amount',
      'Round each share up, with the effective tip percentage shown',
      'Currency selector for USD, EUR, GBP and more',
      'Instant results with clear messages for empty or invalid values',
    ],
    faqs: [
      {
        question: 'How do I calculate a 15% tip?',
        answer: 'Multiply the bill by 0.15. On an $80 bill the tip is $12.00, making a total of $92.00. Split between four people, that is $3.00 tip and $23.00 each.',
      },
      {
        question: 'Should I tip on the amount before or after tax?',
        answer:
          'Etiquette guides commonly suggest tipping on the pre-tax amount, but many people tip on the total. Enter the tax in the optional tax field to calculate the tip on the pre-tax amount.',
      },
      {
        question: 'How much should I tip at a restaurant?',
        answer: 'In the United States 15% to 20% is typical for table service, with more for exceptional service. Customs differ by country, so check local practice when travelling.',
      },
      {
        question: 'What does rounding up each share do?',
        answer: 'It raises every person’s share to the next whole amount so nobody pays in coins. The extra goes to the tip, and the calculator shows the resulting tip percentage.',
      },
    ],
    related: ['percentage-calculator', 'loan-calculator', 'compound-interest-calculator', 'currency-converter'],
    processing: 'browser',
    comparison: {
      competitors: ['Calculator.net Tip Calculator', 'MortgageCalculator.org Tip Calculator', 'Pearson Tip Calculator', 'TipCalculator.us.com'],
      commonFeatures: ['Preset and custom tip percentages', 'Split the bill between several people', 'Tip on pre-tax amount / tax handling', 'Round up totals', 'Per-person tip and total'],
      implemented: [
        'Fixed a bug where a custom tip percentage was added as a currency amount (25% became $25)',
        'Per-person results always visible; rounding now keeps tip and total consistent',
        'Optional pre-tax tip, 25% preset, − / + people stepper and currency selector',
        'Labelled inputs that can be cleared, with validation messages',
      ],
      backlog: ['Uneven splits (per-item or per-person amounts)', 'Round the total instead of each share', 'Remember last-used tip percentage'],
      advantages: ['Runs entirely in your browser', 'No signup, no app install', 'Shows the effective tip percentage after rounding'],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'compound-interest-calculator',
    legacyId: 'compound-interest-calculator',
    hub: 'utility-tools',
    category: 'finance',
    name: 'Compound Interest Calculator',
    icon: '📈',
    summary: 'Project savings growth with compound interest, regular contributions and a year-by-year table.',
    seoTitle: 'Compound Interest Calculator with Contributions',
    seoDescription:
      'Free compound interest calculator: project the future value of savings with daily to yearly compounding, monthly or yearly deposits and a yearly growth table.',
    keywords: [
      'compound interest calculator',
      'compound interest calculator with monthly contributions',
      'future value calculator',
      'savings growth calculator',
      'investment calculator',
      'APY calculator',
    ],
    answer:
      'A compound interest calculator projects how savings grow when interest is earned on both the deposit and past interest. This free tool applies A = P(1 + r/n)^(nt), adds monthly or yearly contributions, and shows the future value, interest earned, effective annual yield and a year-by-year table. For example, $1,000 at 5% compounded yearly for 10 years grows to $1,628.89.',
    howTo: [
      'Enter your initial investment, the annual interest rate and the number of years.',
      'Choose how often interest compounds, from annually to daily.',
      'Optionally add a regular contribution, choose monthly or yearly, and whether it is made at the start or end of each period.',
      'Read the future value, total contributions, interest earned and effective annual yield (APY).',
      'Scroll the Growth by year table to see the balance at the end of every year.',
    ],
    features: [
      'Annual, semi-annual, quarterly, monthly or daily compounding',
      'Monthly or yearly contributions, made at the start or end of each period',
      'Future value, total deposited, interest earned and APY',
      'Year-by-year growth table, including fractional final years',
      'Contribution growth uses the rate implied by the chosen compounding frequency',
      'Currency selector and validation for empty or negative values',
    ],
    faqs: [
      {
        question: 'What is the compound interest formula?',
        answer:
          'A = P(1 + r/n)^(nt), where P is the principal, r the annual rate as a decimal, n the number of compounding periods per year and t the number of years. Regular contributions are added with the future value of an annuity formula.',
      },
      {
        question: 'How much will $1,000 grow at 5% for 10 years?',
        answer: 'Compounded yearly, $1,000 grows to $1,628.89. Compounded monthly it grows to about $1,647.01 because interest is added more often.',
      },
      {
        question: 'What is the difference between APR and APY?',
        answer: 'APR is the stated annual rate. APY is the effective annual yield after compounding: (1 + r/n)^n − 1. A 5% rate compounded monthly has an APY of about 5.116%.',
      },
      {
        question: 'Does it matter if I contribute at the start or end of the month?',
        answer: 'Yes. Contributions made at the start of each period earn one extra period of interest, so the future value is slightly higher than with end-of-period contributions.',
      },
    ],
    related: ['loan-calculator', 'percentage-calculator', 'tip-calculator', 'currency-converter'],
    processing: 'browser',
    comparison: {
      competitors: ['Investor.gov Compound Interest Calculator', 'Bankrate Compound Savings Calculator', 'MoneyGeek Compound Interest Calculator', 'Daily Calcs Compound Interest Calculator'],
      commonFeatures: [
        'Initial deposit, rate, years and compounding frequency',
        'Regular monthly or yearly contributions',
        'Year-by-year balance table',
        'Growth chart',
        'Interest rate variance / range scenarios',
      ],
      implemented: [
        'Fixed contribution growth, which ignored the chosen compounding frequency',
        'Year-by-year growth table',
        'Start or end of period contribution timing',
        'Effective annual yield (APY) and currency selector',
        'Labelled inputs with validation; fields can be cleared',
      ],
      backlog: ['Growth chart', 'Interest-rate range comparison (as on Investor.gov)', 'Inflation-adjusted value', 'CSV export of the yearly table'],
      advantages: ['Runs entirely in your browser', 'No signup', 'Supports daily compounding and contribution timing in one view'],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'pdf-merger',
    legacyId: 'pdf-merger',
    hub: 'utility-tools',
    category: 'documents',
    name: 'PDF Merger',
    icon: '🔗',
    summary: 'Combine several PDF files into one, in the order you choose, without uploading them.',
    seoTitle: 'Merge PDF Files Online Free - No Upload',
    seoDescription:
      'Merge PDF files in your browser for free. Add up to 50 PDFs, drag them into order and download one combined document. Your files are never uploaded.',
    keywords: ['merge pdf', 'combine pdf files', 'pdf merger', 'merge pdf online free', 'join pdf files', 'merge pdf without uploading'],
    answer:
      'A PDF merger combines several PDF files into one document. This free tool runs entirely in your browser: add up to 50 PDFs, drag them or use the arrow buttons to set the order, and download a single merged PDF containing every page. Files are processed locally and never uploaded to a server.',
    howTo: [
      'Click "Select PDF files" or drop PDF files onto the upload area.',
      'Add more files at any time; each file shows its size and page count.',
      'Drag files, or use the up and down arrows, to set the merge order.',
      'Click "Merge PDFs".',
      'Click "Download merged PDF" to save the combined document.',
    ],
    features: [
      'Merge up to 50 PDF files into one document',
      'Drag-and-drop upload and drag-to-reorder list',
      'Keyboard-accessible move up, move down and remove buttons',
      'Shows page count and size for each file and in total',
      'Clear error for non-PDF, corrupted or password-protected files',
      'Processing happens locally with pdf-lib',
    ],
    faqs: [
      {
        question: 'Are my PDF files uploaded to a server?',
        answer: 'No. The PDFs are read and merged by JavaScript in your browser, so they never leave your device.',
      },
      {
        question: 'How many PDFs can I merge at once?',
        answer: 'Up to 50 files. Very large files are limited by your device memory rather than a fixed size limit.',
      },
      {
        question: 'Can I merge password-protected PDFs?',
        answer: 'No. Encrypted PDFs cannot be read in the browser. Remove the password in your PDF reader first, then add the file again.',
      },
      {
        question: 'Will bookmarks and form fields be kept?',
        answer: 'Pages, their content and annotations are copied. Document-level items such as bookmarks (outlines) and interactive form fields may not carry over to the merged file.',
      },
    ],
    related: ['pdf-splitter', 'pdf-rotate', 'pdf-compressor', 'document-converter'],
    processing: 'browser',
    comparison: {
      competitors: ['iLovePDF Merge PDF', 'Smallpdf Merge PDF', 'Adobe Acrobat online Merge PDFs', 'PDF24 Merge PDF'],
      commonFeatures: ['Drag-and-drop upload', 'Reorder files before merging', 'Page thumbnails and page-level reordering', 'No watermark or signup', 'Cloud storage import (Google Drive, Dropbox)'],
      implemented: [
        'Drag-and-drop upload area and drag-to-reorder list',
        'Errors for unreadable files are now shown (they were cleared immediately before)',
        'Accessible labels on move and remove buttons',
        '50-file limit enforced and merged page count confirmed after merging',
      ],
      backlog: ['Page thumbnails and page-level reordering', 'Keep bookmarks/outlines from source files', 'Import from cloud storage'],
      advantages: ['Files never leave your browser', 'No signup, watermark or daily task limit', 'Works offline once the page has loaded'],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'pdf-splitter',
    legacyId: 'pdf-splitter',
    hub: 'utility-tools',
    category: 'documents',
    name: 'PDF Splitter',
    icon: '✂️',
    summary: 'Split a PDF into single pages, custom ranges or fixed chunks, or extract selected pages.',
    seoTitle: 'Split PDF Online Free - Extract Pages Privately',
    seoDescription:
      'Split a PDF in your browser: save every page separately, extract chosen pages into one file, split by custom ranges or every N pages. Nothing is uploaded.',
    keywords: ['split pdf', 'extract pages from pdf', 'pdf splitter', 'split pdf online free', 'separate pdf pages', 'split pdf by range'],
    answer:
      'A PDF splitter separates one PDF into smaller files. This free tool works in your browser and offers four modes: one file per page, extract chosen pages into a single PDF, split by custom ranges such as 1-3, 4-6, or split every N pages. You then download each file; nothing is uploaded.',
    howTo: [
      'Click "Select a PDF file" or drop a PDF onto the upload area.',
      'Choose a split mode: single pages, extract pages, custom ranges or every N pages.',
      'For extract or custom ranges, type pages such as 1-3, 5, 8- (8- means page 8 to the end).',
      'Click "Split PDF".',
      'Download each file, or use "Download all" when there are several.',
    ],
    features: [
      'Split into single pages, one PDF per page',
      'Extract selected pages into one PDF',
      'Split by custom ranges, one PDF per range',
      'Split every N pages into equal chunks',
      'Page syntax with commas, ranges and open-ended ranges like 8-',
      'Specific error messages for out-of-range or reversed page numbers',
    ],
    faqs: [
      {
        question: 'How do I extract only some pages from a PDF?',
        answer: 'Choose "Extract pages into one PDF", enter the pages, for example 2, 5-7, and click Split PDF. You get one file containing just those pages in document order.',
      },
      {
        question: 'How do I split a PDF into several files by range?',
        answer: 'Choose "Split by custom ranges" and enter ranges separated by commas, such as 1-3, 4-6, 7-. Each range becomes its own PDF.',
      },
      {
        question: 'Is my PDF uploaded?',
        answer: 'No. Splitting is done by JavaScript in your browser, so the file stays on your device.',
      },
      {
        question: 'Can I split a password-protected PDF?',
        answer: 'No. Remove the password in your PDF reader first, then split the unlocked copy.',
      },
    ],
    related: ['pdf-merger', 'pdf-rotate', 'pdf-compressor', 'document-converter'],
    processing: 'browser',
    comparison: {
      competitors: ['iLovePDF Split PDF', 'Smallpdf Split PDF', 'Adobe Acrobat online Split PDF', 'Xodo Split PDF'],
      commonFeatures: ['Split by custom ranges', 'Extract all pages to separate files', 'Split every N pages (fixed ranges)', 'Visual page selection with thumbnails', 'Download results as a ZIP'],
      implemented: [
        'Custom ranges now produce one file per range (the two range modes previously did the same thing)',
        'Split every N pages mode',
        'Open-ended ranges (8-) and specific validation messages',
        'Drag-and-drop upload and page count per output file',
      ],
      backlog: ['Page thumbnails with click-to-select', 'Download all results as a single ZIP file', 'Split by file size or bookmarks'],
      advantages: ['Files never leave your browser', 'No signup, watermark or task limit', 'Four split modes on one screen'],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'pdf-compressor',
    legacyId: 'pdf-compressor',
    hub: 'utility-tools',
    category: 'documents',
    name: 'PDF Compressor',
    icon: '📦',
    summary: 'Shrink PDFs with photos or scans by re-encoding their JPEG images in your browser.',
    seoTitle: 'Compress PDF Online Free - Reduce PDF Size',
    seoDescription:
      'Compress PDF files in your browser by re-encoding JPEG photos and scans at lower quality and resolution. See the size saved before you download. No uploads.',
    keywords: ['compress pdf', 'reduce pdf size', 'pdf compressor', 'shrink pdf', 'compress scanned pdf', 'make pdf smaller'],
    answer:
      'A PDF compressor reduces file size, mostly by shrinking the images inside the document. This free tool runs in your browser: it re-encodes JPEG photos and scans at the quality and resolution of the level you choose, optimises the PDF structure, and reports the saving. Text-only PDFs usually shrink very little, and nothing is uploaded.',
    howTo: [
      'Click "Select a PDF file" or drop a PDF onto the upload area.',
      'Choose a compression level: Light, Recommended or Strong.',
      'Click "Compress PDF".',
      'Compare the original and compressed sizes and the percentage saved.',
      'Click "Download compressed PDF" if the file got smaller.',
    ],
    features: [
      'Re-encodes JPEG images at 85%, 70% or 50% quality depending on the level',
      'Downscales large images to 2000 or 1400 pixels on the Recommended and Strong levels',
      'Keeps text, vector graphics and fonts unchanged',
      'Shows original size, compressed size and percentage saved',
      'Tells you when a PDF cannot be made smaller instead of offering a bigger file',
      'Processing happens locally in your browser',
    ],
    faqs: [
      {
        question: 'Why did my PDF barely get smaller?',
        answer:
          'Most of a PDF’s size usually comes from images. This tool recompresses JPEG images, so text-only PDFs, vector drawings and PDFs whose images use other formats shrink little or not at all.',
      },
      {
        question: 'Will compression reduce quality?',
        answer: 'Text and vector graphics are not changed. Photos and scans are re-encoded, so the Strong level can show visible JPEG artefacts; use Light if quality matters most.',
      },
      {
        question: 'Is my PDF uploaded to a server?',
        answer: 'No. The PDF is processed with JavaScript in your browser and never leaves your device.',
      },
      {
        question: 'Can I compress a password-protected PDF?',
        answer: 'No. Remove the password in your PDF reader first, then compress the unlocked copy.',
      },
    ],
    related: ['pdf-merger', 'pdf-splitter', 'image-compressor', 'pdf-rotate'],
    processing: 'browser',
    comparison: {
      competitors: ['Smallpdf Compress PDF', 'iLovePDF Compress PDF', 'Adobe Acrobat online Compress PDF', 'PDF24 Compress PDF'],
      commonFeatures: ['Several compression levels', 'Image downsampling and recompression', 'Before/after size comparison', 'Batch compression', 'Target file size option'],
      implemented: [
        'Real image recompression: the levels previously had no effect and only object streams were changed',
        'Honest result when a PDF cannot be made smaller (no larger file offered)',
        'Level descriptions state the actual JPEG quality and maximum image size',
        'Drag-and-drop upload; document structure and bookmarks are kept instead of copying pages into a new file',
      ],
      backlog: ['Recompress non-JPEG (Flate) images', 'Grayscale conversion option', 'Batch compression of several files', 'Target file size'],
      advantages: ['Files never leave your browser', 'No signup, watermark or Pro-only levels', 'Only replaces images that actually get smaller'],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'pdf-rotate',
    legacyId: 'pdf-rotate',
    hub: 'utility-tools',
    category: 'documents',
    name: 'PDF Rotate',
    icon: '🔄',
    summary: 'Rotate all, odd, even or selected PDF pages by 90° or 180° and save the result.',
    seoTitle: 'Rotate PDF Pages Online Free - 90° or 180°',
    seoDescription:
      'Rotate PDF pages permanently in your browser. Turn all, odd, even or selected pages 90° right, 90° left or 180°, then download the fixed PDF. No uploads.',
    keywords: ['rotate pdf', 'rotate pdf pages', 'rotate pdf online free', 'rotate pdf and save', 'fix upside down pdf', 'rotate single page in pdf'],
    answer:
      'Rotating a PDF changes the orientation of its pages permanently. This free tool runs in your browser: choose 90° right, 90° left or 180°, apply it to all pages, odd or even pages, or specific pages such as 1, 3-5, and download the corrected PDF. Existing rotation is taken into account and nothing is uploaded.',
    howTo: [
      'Click "Select a PDF file" or drop a PDF onto the upload area.',
      'Choose the rotation: 90° right, 180° or 90° left.',
      'Choose which pages to rotate: all, odd, even or specific pages such as 1, 3-5.',
      'Click "Rotate PDF".',
      'Click "Download rotated PDF" to save the result.',
    ],
    features: [
      'Rotate 90° clockwise, 90° counter-clockwise or 180°',
      'Apply to all pages, odd pages, even pages or a custom page list',
      'Adds to any rotation a page already has and keeps angles within 0-270°',
      'Keeps text, links and bookmarks because the original document is edited in place',
      'Drag-and-drop upload with clear page-number validation',
      'Processing happens locally in your browser',
    ],
    faqs: [
      {
        question: 'How do I rotate only one page of a PDF?',
        answer: 'Choose "Specific pages", type the page number, for example 3, pick the angle and click Rotate PDF. Other pages stay as they are.',
      },
      {
        question: 'Is the rotation saved permanently?',
        answer: 'Yes. The page rotation is written into the downloaded PDF, so it opens correctly in any PDF reader.',
      },
      {
        question: 'Does rotating reduce quality?',
        answer: 'No. Only the page orientation setting changes; text and images are not re-rendered or compressed.',
      },
      {
        question: 'Is my file uploaded?',
        answer: 'No. The PDF is rotated with JavaScript in your browser and never leaves your device.',
      },
    ],
    related: ['pdf-merger', 'pdf-splitter', 'pdf-compressor', 'document-converter'],
    processing: 'browser',
    comparison: {
      competitors: ['Smallpdf Rotate PDF', 'Adobe Acrobat online Rotate PDF', 'Sejda Rotate PDF', 'PDF24 Rotate PDF pages'],
      commonFeatures: ['Rotate all pages or single pages', '90° left, 90° right and 180°', 'Page thumbnails with per-page rotate buttons', 'Odd/even page selection', 'Permanent save without quality loss'],
      implemented: [
        'Odd and even page modes',
        'Clearer angle labels (90° right / 90° left) and normalised page rotation',
        'Result confirmation with the number of pages rotated; stale downloads cleared when options change',
        'Drag-and-drop upload and validation for page lists',
      ],
      backlog: ['Page thumbnails with per-page rotate buttons', 'Batch rotate several PDFs'],
      advantages: ['Files never leave your browser', 'No signup or watermark', 'Odd/even and custom page lists in one screen'],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'file-converter',
    legacyId: 'file-converter',
    hub: 'utility-tools',
    category: 'documents',
    name: 'File Converter',
    icon: '📁',
    summary: 'Convert CSV, JSON, XML, HTML tables and text to JSON, CSV, XML, YAML, HTML or TXT.',
    seoTitle: 'CSV, JSON, XML & YAML File Converter Online',
    seoDescription:
      'Convert data in your browser: CSV to JSON, JSON to CSV, XML to JSON, HTML tables to CSV and any of them to YAML. Paste or open a file, then copy or download.',
    keywords: ['csv to json', 'json to csv', 'xml to json', 'json to yaml', 'html table to csv', 'data format converter'],
    answer:
      'A file converter changes structured data from one text format to another. This free tool converts CSV, JSON, XML, HTML tables and plain text into JSON, CSV, XML, YAML, HTML or TXT. Paste content or open a file, the format is detected automatically, and the result updates instantly for copying or download. Everything runs in your browser.',
    howTo: [
      'Open a file, drop it on the upload area, or paste content into the Input box.',
      'Check the From format (auto-detected) and change it if needed.',
      'Choose the output format in the To list.',
      'Review the converted Output, which updates as you type.',
      'Click Copy, or "Download converted file" to save it.',
    ],
    features: [
      'Inputs: CSV/TSV, JSON, XML, HTML tables or text, and plain text lines',
      'Outputs: JSON, CSV, XML, YAML, HTML table and plain text',
      'RFC 4180 CSV parsing with quoted fields, commas and line breaks inside quotes; comma, semicolon or tab delimiters',
      'Correct escaping for CSV, XML and HTML output and quoting for YAML',
      'XML attributes kept as "@name" keys; clear error messages for invalid JSON or XML',
      'Paste or upload, copy to clipboard and download with the right file extension',
    ],
    faqs: [
      {
        question: 'How do I convert CSV to JSON?',
        answer: 'Paste the CSV or open the file, make sure To is set to JSON, and copy or download the result. The first row becomes the keys and each following row becomes an object.',
      },
      {
        question: 'How are nested JSON objects converted to CSV?',
        answer: 'Each object in an array becomes a row and every key found becomes a column. Nested objects or arrays inside a cell are written as JSON text so no data is lost.',
      },
      {
        question: 'Can I convert YAML to JSON?',
        answer: 'Not yet. YAML is supported as an output format only. You can convert CSV, JSON, XML, HTML or text into YAML.',
      },
      {
        question: 'Are my files uploaded?',
        answer: 'No. Parsing and conversion run in your browser, so the data never leaves your device.',
      },
    ],
    related: ['excel-csv-converter', 'json-formatter', 'document-converter', 'html-formatter'],
    processing: 'browser',
    comparison: {
      competitors: ['I Hate Converter data converter', 'CSV Tools converter', 'CodeBeautify YAML/JSON/XML/CSV converter', 'MeTool JSON YAML XML CSV converter'],
      commonFeatures: ['Paste or upload input', 'Bidirectional CSV, JSON, XML and YAML conversion', 'Live preview', 'Copy and download output', 'Delimiter options for CSV'],
      implemented: [
        'Paste input and live conversion (previously upload-only with a Convert button)',
        'Proper CSV parsing and escaping (quoted commas and quotes were corrupted before)',
        'Valid XML output with escaping and safe tag names; XML parse errors reported',
        'Correct YAML quoting; HTML tables converted to rows; text converted to line lists',
        'Copy button, manual source-format override and drag-and-drop upload',
      ],
      backlog: ['YAML and TOML as input formats', 'Choose CSV delimiter for output', 'Flatten nested JSON into dotted column names'],
      advantages: ['Runs entirely in your browser', 'No signup or file size paywall', 'HTML table to CSV/JSON in the same tool'],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'document-converter',
    legacyId: 'document-converter',
    hub: 'utility-tools',
    category: 'documents',
    name: 'Document Converter',
    icon: '📄',
    summary: 'Convert the text of PDF, Word (DOCX/DOC) and TXT files between PDF, DOCX and TXT.',
    seoTitle: 'Document Converter: Word, PDF and TXT Text',
    seoDescription:
      'Convert the text of documents between PDF, Word and TXT: PDF to Word, Word to PDF, PDF to text and more. Upload a file up to 10 MB and download the result.',
    keywords: ['pdf to word', 'word to pdf', 'pdf to text', 'docx to txt', 'txt to pdf', 'document converter'],
    answer:
      'A document converter changes a file from one document format to another. This tool converts the text of PDF, Word (DOCX or DOC) and TXT files: PDF to Word or TXT, Word to PDF or TXT, and TXT to PDF or Word. Files up to 10 MB are converted on our server; layout, images and tables are not preserved.',
    howTo: [
      'Click "Select a document to convert" or drop a PDF, DOCX, DOC or TXT file onto the upload area.',
      'Choose the output format in the "Convert to" list.',
      'Click "Convert document".',
      'Click the Download link to save the converted file.',
    ],
    features: [
      'PDF to Word (DOCX) and PDF to TXT text extraction',
      'Word (DOCX or DOC) to PDF and to TXT',
      'TXT to PDF (A4) and TXT to Word, keeping line breaks',
      'Checks file type and the 10 MB limit before uploading',
      'Clear messages for unsupported files, server errors and connection problems',
      'Drag-and-drop upload',
    ],
    faqs: [
      {
        question: 'Does the converter keep my formatting?',
        answer: 'No. It converts the text content only. Fonts, layout, images and tables are not preserved, so it suits text-heavy documents rather than designed layouts.',
      },
      {
        question: 'Can it convert scanned PDFs to Word?',
        answer: 'No. Scanned PDFs are images of text, and the converter does not perform OCR, so the output would be empty or incomplete.',
      },
      {
        question: 'What is the maximum file size?',
        answer: '10 MB per file. Supported inputs are PDF, DOCX, DOC and TXT.',
      },
      {
        question: 'Is my document uploaded?',
        answer: 'Yes. Conversion runs on our server, and the converted file is saved there so you can download it. Do not upload confidential documents.',
      },
    ],
    related: ['pdf-merger', 'pdf-splitter', 'file-converter', 'excel-csv-converter'],
    processing: 'server',
    comparison: {
      competitors: ['Smallpdf Word to PDF', 'Adobe Acrobat online Word to PDF', 'PDFgear Word to PDF', 'iLovePDF PDF to Word'],
      commonFeatures: ['Layout-preserving Word to PDF', 'PDF to editable Word with tables and images', 'OCR for scanned PDFs', 'Batch conversion', 'Automatic deletion of uploaded files'],
      implemented: [
        'Honest description: text-only conversion, no OCR, files stored on the server',
        'Client-side file type and 10 MB checks before upload',
        'Readable errors for validation failures, non-JSON responses and network errors',
        'DOC files no longer offered the unsupported DOC to DOCX conversion; drag-and-drop upload',
      ],
      backlog: [
        'Layout-preserving conversion (e.g. LibreOffice on the server)',
        'OCR for scanned PDFs',
        'Automatic deletion of converted files after a short period',
        'Client-side TXT to PDF so text files never need uploading',
      ],
      advantages: ['No signup or daily limit', 'Six text conversion directions in one tool'],
    },
    reviewed: '2026-09-24',
  },
  {
    slug: 'excel-csv-converter',
    legacyId: 'excel-csv-converter',
    hub: 'utility-tools',
    category: 'documents',
    name: 'Excel CSV Converter',
    icon: '📊',
    summary: 'Convert Excel XLSX or XLS worksheets to CSV, or CSV files to XLSX.',
    seoTitle: 'Excel to CSV Converter - XLSX, XLS and CSV',
    seoDescription:
      'Convert Excel to CSV or CSV to Excel online. Upload an XLSX, XLS or CSV file up to 10 MB and download the converted spreadsheet. No signup needed.',
    keywords: ['excel to csv', 'xlsx to csv', 'csv to excel', 'csv to xlsx', 'xls to csv', 'convert excel to csv online'],
    answer:
      'An Excel CSV converter turns spreadsheet workbooks into comma-separated values files and back. This tool converts the active worksheet of an XLSX or XLS file to CSV using the displayed cell values, and turns a comma-separated CSV file into an XLSX workbook. Files up to 10 MB are converted on our server and returned as a download.',
    howTo: [
      'Click "Select an Excel or CSV file" or drop an XLSX, XLS or CSV file onto the upload area.',
      'Check the "Convert to" format: CSV for Excel files, XLSX for CSV files.',
      'Click "Convert file".',
      'Click the Download link to save the converted file.',
    ],
    features: [
      'XLSX to CSV and XLS to CSV',
      'CSV to XLSX workbook',
      'Exports formulas as their displayed results',
      'Checks file type and the 10 MB limit before uploading',
      'Clear messages for unsupported files, server errors and connection problems',
      'Drag-and-drop upload',
    ],
    faqs: [
      {
        question: 'Which worksheet is converted to CSV?',
        answer: 'The active worksheet, which is usually the sheet that was open when the workbook was last saved. Other sheets are not included, so save the sheet you need as active first.',
      },
      {
        question: 'Are formulas kept when converting to CSV?',
        answer: 'No. CSV stores plain values, so each formula is exported as its displayed result.',
      },
      {
        question: 'Can I convert a semicolon-separated CSV to Excel?',
        answer: 'The converter expects commas as separators. Convert semicolons to commas first, for example with the File Converter tool.',
      },
      {
        question: 'Is my spreadsheet uploaded?',
        answer: 'Yes. Conversion runs on our server, and the converted file is saved there so you can download it. Do not upload confidential data.',
      },
    ],
    related: ['file-converter', 'document-converter', 'json-formatter', 'pdf-merger'],
    processing: 'server',
    comparison: {
      competitors: ['TableConvert Excel to CSV', 'CloudConvert XLSX to CSV', 'Zamzar XLSX to CSV', 'ConvertSimple XLSX to CSV'],
      commonFeatures: ['XLSX and XLS to CSV', 'Choose which worksheet to export', 'Delimiter and encoding options', 'Batch conversion', 'In-browser processing without upload'],
      implemented: [
        'Client-side file type and 10 MB checks before upload',
        'Readable errors for validation failures, non-JSON responses and network errors',
        'Honest notes about active worksheet, formulas and server-side storage',
        'Drag-and-drop upload and a proper download link',
      ],
      backlog: [
        'Worksheet picker',
        'Delimiter and encoding options',
        'In-browser conversion so files are not uploaded',
        'Server fix: sheets with 26 or more columns export the wrong columns to CSV (column letters compared as strings)',
      ],
      advantages: ['No signup', 'Handles legacy XLS as well as XLSX'],
    },
    reviewed: '2026-09-24',
  },
];
