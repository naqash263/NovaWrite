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
    slug: 'uae-gratuity-calculator',
    legacyId: 'uae-gratuity-calculator',
    hub: 'utility-tools',
    category: 'finance',
    name: 'UAE Gratuity Calculator',
    icon: '💼',
    summary: 'Estimate UAE end-of-service gratuity from basic salary and exact dates, with unpaid leave, the two-year cap and a yearly schedule.',
    seoTitle: 'UAE Gratuity Calculator 2026: End of Service Benefits',
    seoDescription:
      'Free UAE gratuity calculator for 2026: estimate end-of-service pay from basic salary and exact dates, with unpaid leave, the two-year cap and a yearly schedule.',
    keywords: [
      'gratuity calculator',
      'gratuity calculator uae',
      'uae gratuity calculator',
      'gratuity calculator uae 2026',
      'end of service calculator uae',
      'end of service benefits uae',
      'gratuity calculator dubai',
      'dubai gratuity calculator',
      'gratuity calculator abu dhabi',
      'how to calculate gratuity in uae',
      'mohre gratuity calculator',
      'uae gratuity law',
      'uae settlement calculator',
      'final settlement calculation',
      'jafza gratuity calculator',
      'gratuity calculation uae labour law',
      'eosb calculator uae',
    ],
    answer:
      'UAE gratuity is 21 days of basic wage for each of the first five years of service and 30 days for each later year, pro-rata for part years, capped at two years’ wage (Article 51, Federal Decree-Law No. 33 of 2021). You need one year of continuous service, and unpaid absence does not count. Example: AED 10,000 basic for 7 years gives AED 55,000.',
    howTo: [
      'Enter your basic monthly salary in AED, without housing, transport or other allowances.',
      'Enter your first and last working days, or switch to Years, months, days if you only know the length of service.',
      'Add any unpaid leave days; they are deducted from your service.',
      'Optionally open Advanced options to change the daily wage method or enter a part-time percentage.',
      'Read the total, the breakdown by band and the year-by-year schedule, then copy or print the result.',
    ],
    features: [
      'Exact service length from start and end dates (both days count), or entered as years, months and days',
      'Unpaid leave days deducted from service, as Article 51 requires',
      'Breakdown by band: 21 days per year for years 1–5 and 30 days per year after that',
      'Two-year wage cap (24 × basic salary) applied and shown when it limits the payout',
      'Year-by-year schedule with days of wage, amount and running total',
      'Daily wage method (basic ÷ 30 or basic × 12 ÷ 365) and a part-time percentage',
      'Formula, worked example and official sources on the page, with Copy and Print buttons',
      'Exact arithmetic in fils, rounded to 2 decimals only for display',
    ],
    faqs: [
      {
        question: 'How is gratuity calculated in the UAE?',
        answer:
          'Under Article 51 of Federal Decree-Law No. 33 of 2021, a full-time employee with at least one year of continuous service gets 21 days of basic wage for each of the first five years and 30 days for each year after that. Part years are paid pro-rata, the total cannot exceed two years’ wage, and allowances are excluded. The daily wage is usually basic salary ÷ 30; some employers annualise (× 12 ÷ 365), which you can pick under Advanced options.',
      },
      {
        question: 'Is this the same as the MOHRE gratuity calculator?',
        answer:
          'No. This is an independent calculator and is not affiliated with the Ministry of Human Resources and Emiratisation (MOHRE). It applies the same Federal Decree-Law formula that MOHRE publishes for private-sector employees and shows every step, but only MOHRE, your employer or a court can confirm the amount you are owed.',
      },
      {
        question: 'Does it work in Dubai, Abu Dhabi, JAFZA, DIFC or ADGM?',
        answer:
          'Yes for mainland jobs in every emirate, including Dubai and Abu Dhabi, and for most free zones such as JAFZA, whose companies must follow the federal labour law for end-of-service benefits. DIFC replaced gratuity with the DEWS savings plan in February 2020 and ADGM has its own Employment Regulations, so check those schemes instead. For part-time work, enter the percentage of full-time hours under Advanced options.',
      },
      {
        question: 'Do unpaid leave or resigning reduce my gratuity?',
        answer:
          'Unpaid absence days are not counted as service, so they reduce the gratuity and can take you below the one-year minimum. Since the 2021 law took effect on 2 February 2022, all contracts are fixed-term and resigning no longer cuts gratuity. The old one-third and two-thirds cuts applied to resignations from unlimited contracts under Law No. 8 of 1980 until those contracts were converted.',
      },
      {
        question: 'What is included in the final settlement?',
        answer:
          'A UAE final settlement usually adds up the gratuity, pay for unused annual leave (on basic salary; use the UAE Leave Salary Calculator), any unpaid salary and overtime, notice pay if notice was not worked, and other contract benefits such as a repatriation ticket. Article 53 requires the employer to pay all end-of-service dues within 14 days of the contract ending; if not, you can complain to MOHRE.',
      },
    ],
    related: ['uae-leave-salary-calculator', 'uae-overtime-calculator', 'uae-vat-calculator', 'date-calculator', 'loan-calculator'],
    processing: 'browser',
    comparison: {
      competitors: [
        'MOHRE end-of-service calculator',
        'gratuitycalculatoruae.ae',
        'Bayzat Gratuity Calculator',
        'Khaleej Times Gratuity Calculator',
        'Gulf News / Dubai Development Authority calculator',
        'HowUAE Gratuity Calculator',
        'Zoho Payroll Gratuity Calculator',
        'gratuitycalculatordubaiuae.ae',
        'ZenHR Gratuity Calculator',
        'Cercli Gratuity Calculator',
        'Workforce.ae Gratuity Calculator',
      ],
      commonFeatures: [
        'Basic salary plus joining and last working date',
        'Limited / unlimited contract and resignation / termination choice',
        'Total gratuity using the 21 / 30 days formula and the two-year cap',
        'Unpaid leave days (gratuitycalculatoruae.ae, Zoho Payroll)',
        'Year-by-year breakdown, PDF download and Arabic (gratuitycalculatoruae.ae)',
        'Disclaimer that the result is indicative only',
      ],
      implemented: [
        'Per-band breakdown and a year-by-year schedule with running total and cap marker',
        'Unpaid leave deducted from service, including the effect on the one-year minimum',
        'Date picker or years / months / days entry',
        'Daily wage method choice with the difference explained, plus part-time percentage',
        'Formula, worked example and official sources on the page; Copy and Print (print to PDF)',
        'Clear DIFC / ADGM note instead of a silently wrong mainland result',
        'FAQs for Dubai, Abu Dhabi and free-zone (JAFZA) users, the MOHRE question and what a final settlement includes',
        'Companion UAE leave salary and overtime calculators for the rest of the final settlement',
      ],
      backlog: [
        'Arabic interface',
        'One-click PDF download (Print to PDF works today)',
        'One combined final settlement view (gratuity, leave encashment, notice pay and ticket); the parts exist as separate tools',
        'DIFC DEWS and ADGM calculators',
        'Pre-2022 unlimited-contract resignation reductions',
      ],
      advantages: [
        'Shows every step: service after unpaid leave, daily wage, days per band, cap and schedule',
        'Explains the ÷ 30 versus × 12 ÷ 365 daily wage question instead of hiding it',
        'Runs entirely in your browser; salary details are never sent anywhere',
      ],
    },
    reviewed: '2026-09-29',
  },
  {
    slug: 'uae-leave-salary-calculator',
    legacyId: 'uae-leave-salary-calculator',
    hub: 'utility-tools',
    category: 'finance',
    name: 'UAE Leave Salary Calculator',
    icon: '🏖️',
    summary: 'Work out UAE annual leave earned, leave salary for a planned holiday and the payout for unused leave when you leave a job.',
    seoTitle: 'UAE Leave Salary Calculator 2026: Annual Leave Pay',
    seoDescription:
      'Free UAE leave salary calculator: annual leave earned under Article 29, leave salary on full wage and unused leave encashment on basic salary at exit.',
    keywords: [
      'leave salary calculator uae',
      'leave salary calculation in uae',
      'annual leave calculator uae',
      'leave encashment calculator uae',
      'unused leave payment uae',
      'annual leave entitlement uae',
      'leave salary uae labour law',
      'final settlement leave salary uae',
    ],
    answer:
      'UAE employees earn 30 calendar days of paid annual leave a year after one year of service, and 2 days a month between six months and one year (Article 29, Federal Decree-Law No. 33 of 2021). Leave salary is the daily wage (monthly wage ÷ 30) × leave days. Unused leave at exit is paid on basic salary: AED 10,000 basic and 15 unused days gives AED 5,000.',
    howTo: [
      'Choose Leave salary for planned leave or Unused leave at exit.',
      'Enter your basic monthly salary and, optionally, your monthly allowances.',
      'Enter your joining date, the end date, leave already taken and any unpaid leave, or switch to I know my balance.',
      'For planned leave, enter how many leave days you will take.',
      'Read the leave balance, daily wage and amount, then copy or print the result.',
    ],
    features: [
      'Leave earned from exact dates: 30 days a year pro-rata after one year, 2 days per completed month from 6 to 12 months',
      'Two modes: leave salary for a planned holiday and encashment of unused leave at exit',
      'Wage basis explained and selectable: full wage (basic + allowances) during leave, basic salary for unused leave at exit',
      'Unpaid leave deducted from service and leave already taken deducted from the balance',
      'Warnings when planned leave exceeds the balance or more leave was taken than earned',
      'Daily wage method (÷ 30 or × 12 ÷ 365) and an under-6-months option',
      'Formula, worked example, carry-forward rules and official sources, with Copy and Print',
      'Exact arithmetic in fils, rounded to 2 decimals only for display',
    ],
    faqs: [
      {
        question: 'How many days of annual leave do I get in the UAE?',
        answer:
          'Under Article 29 of Federal Decree-Law No. 33 of 2021, a private-sector employee gets at least 30 calendar days of paid annual leave for each year of service. Between six months and one year of service you earn 2 days for each month, and when employment ends you are paid for the fraction of the last year. Under six months there is no statutory paid leave.',
      },
      {
        question: 'Is leave salary paid on basic salary or full salary?',
        answer:
          'During annual leave you are paid your wage, which Article 1 of the law defines as basic salary plus allowances, so the default here is the full wage. Unused leave paid out when employment ends is calculated on the basic salary only (Article 29). Your contract can be more generous, so both bases can be selected under Advanced options.',
      },
      {
        question: 'How is unused annual leave paid when I leave a job?',
        answer:
          'Unused days are paid as cash in lieu with your final settlement, whatever the reason you leave: basic monthly salary ÷ 30 × unused days. For example, AED 9,000 basic and 20 unused days gives AED 6,000. Final dues, including gratuity, must be paid within 14 days of the contract ending.',
      },
      {
        question: 'Can I carry forward annual leave to next year?',
        answer:
          'With your employer’s agreement you can carry forward up to half of a year’s leave, or agree a cash allowance for it at the wage you earned when it fell due (Executive Regulations, Cabinet Resolution No. 1 of 2022). Your employer cannot stop you from using accrued leave for more than two years.',
      },
      {
        question: 'Does this apply in DIFC, ADGM or free zones?',
        answer:
          'It follows the mainland federal labour law, which also applies in most free zones. DIFC and ADGM have their own employment laws with different leave rules, so check those instead. Your contract or company policy can also give more leave than the legal minimum.',
      },
    ],
    related: ['uae-gratuity-calculator', 'uae-overtime-calculator', 'uae-vat-calculator', 'date-calculator'],
    processing: 'browser',
    comparison: {
      competitors: [
        'Payslip.ae Annual Leave Calculator',
        'thegratuitycalculator.ae Leave Salary Calculator',
        'BCL Globiz Leave Encashment Calculator',
        'Yomly Leave Salary Calculator',
        'RadixHR Leave Salary Calculator',
        'uaecalculators.ae Leave Encashment Calculator',
      ],
      commonFeatures: [
        'Basic salary × unused days ÷ 30',
        'Accrued leave from joining date (Payslip.ae)',
        'Leave salary with or without allowances',
        'Explanation of Article 29 and the basic-salary rule at exit',
        'Disclaimer that the result is indicative only',
      ],
      implemented: [
        'Both planned-leave salary and unused-leave encashment in one tool',
        'Accrual from exact dates with the 6-month and 1-year thresholds and pro-rata part years',
        'Unpaid leave and leave taken deducted, with over-balance and overdrawn warnings',
        'Wage basis and daily-wage method selectable, each with the default explained',
        'Formula, worked example, carry-forward rules and sources on the page; Copy and Print',
      ],
      backlog: ['Arabic interface', 'Carry-forward tracker per leave year', 'Combined final settlement with gratuity and notice pay', 'Part-time leave pro-rating'],
      advantages: [
        'Separates full-wage leave salary from basic-wage encashment instead of mixing them',
        'Shows every step: service, leave earned, taken, balance and daily wage',
        'Runs entirely in your browser; salary details are never sent anywhere',
      ],
    },
    reviewed: '2026-09-29',
  },
  {
    slug: 'uae-overtime-calculator',
    legacyId: 'uae-overtime-calculator',
    hub: 'utility-tools',
    category: 'finance',
    name: 'UAE Overtime Calculator',
    icon: '⏱️',
    summary: 'Calculate UAE overtime pay from basic salary: regular, night-time and rest-day or public-holiday hours, with legal-limit warnings.',
    seoTitle: 'UAE Overtime Calculator 2026: 25% and 50% Rates',
    seoDescription:
      'Free UAE overtime calculator under Article 19: hourly basic wage, 25% regular, 50% night (10 pm–4 am) and rest-day pay, with warnings for legal limits.',
    keywords: [
      'overtime calculator uae',
      'overtime calculation in uae',
      'uae overtime calculation formula',
      'overtime pay uae labour law',
      'night overtime rate uae',
      'public holiday overtime uae',
      'rest day overtime uae',
      'hourly rate calculator uae',
    ],
    answer:
      'UAE overtime is paid at the hourly basic wage plus at least 25%, or plus 50% between 10 pm and 4 am (not for shift workers), under Article 19 of Federal Decree-Law No. 33 of 2021. Rest-day or public-holiday work earns a day off or pay plus 50%. Hourly wage = basic salary ÷ 30 ÷ 8, so AED 6,000 basic gives AED 25 an hour.',
    howTo: [
      'Enter your basic monthly salary in AED.',
      'Enter your normal hours per day and working days per week.',
      'Enter overtime hours split into regular, night (10 pm–4 am) and rest day or public holiday hours.',
      'Choose the period the hours cover so the daily and 3-week limits can be checked.',
      'Read the hourly wage, pay per type and total, then copy or print the result.',
    ],
    features: [
      'Hourly basic wage from monthly salary and normal daily hours',
      'Pay per overtime type: +25% regular, +50% night (10 pm–4 am) and +50% rest day or public holiday',
      'Shift-worker option that removes the night premium, as Article 19 requires',
      'Warnings above 8 normal hours a day or 48 a week, 2 overtime hours a day and 144 hours in 3 weeks',
      'Hourly method choice (÷ 30 ÷ daily hours, × 12 ÷ 365, or × 12 ÷ 52 ÷ weekly hours) and optional allowances',
      'Formula, worked example and official sources on the page, with Copy and Print',
      'Exact arithmetic in fils, rounded to 2 decimals only for display',
    ],
    faqs: [
      {
        question: 'How is overtime calculated in the UAE?',
        answer:
          'Work out the hourly basic wage (basic salary ÷ 30 ÷ normal daily hours) and pay each overtime hour at that rate plus at least 25%. Hours between 10 pm and 4 am get at least 50% extra, except for shift workers. With AED 6,000 basic and 8-hour days, the hourly wage is AED 25, so 10 regular overtime hours pay AED 312.50.',
      },
      {
        question: 'Is overtime paid on basic salary or total salary?',
        answer:
          'On basic salary. Article 19 and MOHRE guidance calculate overtime on the basic wage for normal working hours, and housing, transport and other allowances are excluded. A contract can pay overtime on the full wage, so you can add allowances under Advanced options.',
      },
      {
        question: 'What do I get for working on a rest day or public holiday?',
        answer:
          'Your employer must give you a substitute day off, or pay the wage for the hours worked plus at least 50% of the basic wage. That is 150% of your hourly basic wage for each hour. You cannot be required to work more than two consecutive rest days, except daily-wage workers.',
      },
      {
        question: 'How many overtime hours are allowed in the UAE?',
        answer:
          'Normal hours are capped at 8 a day or 48 a week, reduced by 2 hours a day in Ramadan. Overtime may not exceed 2 hours a day unless the work is needed to prevent a serious loss or accident, and total working hours may not exceed 144 in any three weeks. Some roles, such as senior managers, are exempt from these limits.',
      },
      {
        question: 'Does this apply in DIFC, ADGM or free zones?',
        answer:
          'It follows the mainland federal labour law and its Executive Regulations, which also apply in most free zones. DIFC and ADGM have their own employment laws with different working-time rules, so check those instead. Your contract may also pay more than the legal minimum.',
      },
    ],
    related: ['uae-gratuity-calculator', 'uae-leave-salary-calculator', 'uae-vat-calculator', 'percentage-calculator'],
    processing: 'browser',
    comparison: {
      competitors: [
        'Bayzat overtime guide and calculator',
        'RadixHR Overtime Calculator',
        'uaecalculator.ae Overtime Calculator',
        'uaegratuity-calculator.com Overtime Calculator',
        'TimeChart Overtime Calculator',
        'EasyCalculation UAE Overtime Calculator',
      ],
      commonFeatures: [
        'Basic salary and overtime hours',
        '125% normal and 150% night or holiday rates',
        'Hourly rate from basic × 12 ÷ 365 ÷ 8 or basic ÷ 30 ÷ 8',
        'Explanation of Article 19',
        'Disclaimer that the result is indicative only',
      ],
      implemented: [
        'Regular, night and rest-day or public-holiday hours in one calculation with a per-type breakdown',
        'Shift-worker exception for the night rate',
        'Warnings for the 8-hour, 48-hour, 2-hour and 144-hours-in-3-weeks limits',
        'Three hourly-rate conventions with the default explained, and an allowances option for generous contracts',
        'Formula, worked example and sources on the page; Copy and Print',
      ],
      backlog: ['Arabic interface', 'Custom premium percentages above the legal minimum', 'Day-by-day timesheet entry', 'Ramadan hours mode'],
      advantages: [
        'Checks the legal limits instead of only multiplying hours',
        'Makes the hourly-rate divisor explicit and selectable',
        'Runs entirely in your browser; salary details are never sent anywhere',
      ],
    },
    reviewed: '2026-09-29',
  },
  {
    slug: 'uae-vat-calculator',
    legacyId: 'uae-vat-calculator',
    hub: 'utility-tools',
    category: 'finance',
    name: 'UAE VAT Calculator',
    icon: '🧾',
    summary: 'Add 5% UAE VAT to a price, extract VAT from a VAT-inclusive total, work back from a VAT amount or total a multi-line invoice.',
    seoTitle: 'UAE VAT Calculator: Add or Remove 5% VAT',
    seoDescription:
      'Free UAE VAT calculator: add 5% VAT to a price, extract VAT from a VAT-inclusive total with 5/105, work back from a VAT amount or total invoice lines.',
    keywords: [
      'uae vat calculator',
      'vat calculator uae',
      '5% vat calculator',
      'reverse vat calculator uae',
      'remove vat calculator',
      'vat inclusive calculator dubai',
      'calculate vat from total uae',
    ],
    answer:
      'UAE VAT is charged at a standard rate of 5%, administered by the Federal Tax Authority. To add VAT, multiply the net price by 1.05. To extract VAT from a VAT-inclusive total, multiply it by 5/105 (about 4.76%). For example, AED 1,000 before VAT becomes AED 1,050, and AED 1,000 including VAT contains AED 47.62 of VAT.',
    howTo: [
      'Choose Add VAT, Remove VAT or From VAT amount.',
      'Enter the amount in AED and, optionally, a quantity if the amount is a unit price.',
      'Read the net amount, the 5% VAT and the total, rounded to the nearest fils.',
      'For an invoice, switch to Line items and enter each line’s quantity, unit price and VAT rate.',
      'Click Copy to paste the breakdown into an email, quote or spreadsheet.',
    ],
    features: [
      'Add 5% VAT to a net price (net × 1.05)',
      'Remove VAT from a VAT-inclusive total (total × 5/105)',
      'Work back from a VAT amount to the net and total (VAT × 20 and × 21)',
      'Optional quantity for unit prices',
      'Line-item invoice mode with a 5% or 0% rate per line and invoice totals',
      'Exact arithmetic in fils, rounded half-up on each line',
      'Copy the breakdown, tab-separated for spreadsheets in line-item mode',
    ],
    faqs: [
      {
        question: 'How do I calculate 5% VAT in the UAE?',
        answer:
          'Multiply the price before VAT by 0.05 to get the VAT, or by 1.05 to get the VAT-inclusive total. For example, AED 200 before VAT carries AED 10 of VAT, for a total of AED 210. The 5% standard rate has applied since VAT was introduced on 1 January 2018.',
      },
      {
        question: 'How do I remove VAT from a VAT-inclusive price?',
        answer:
          'Multiply the VAT-inclusive amount by 5/105 to get the VAT, then subtract it, or divide the total by 1.05 to get the net price. AED 1,000 including VAT is AED 952.38 net plus AED 47.62 VAT. Taking 5% of the total (AED 50) is a common mistake that overstates the VAT.',
      },
      {
        question: 'Is every sale in the UAE charged 5% VAT?',
        answer:
          'No. Most supplies are standard-rated at 5%, but some are zero-rated, such as qualifying exports outside the GCC and international transport, and some are exempt, such as certain financial services, bare land and local passenger transport. Use the 0% rate for those lines in Line items mode.',
      },
      {
        question: 'When must a business register for UAE VAT?',
        answer:
          'Registration is mandatory when taxable supplies and imports exceeded AED 375,000 in the past 12 months or are expected to exceed it in the next 30 days. A business can register voluntarily above AED 187,500.',
      },
    ],
    related: ['uae-gratuity-calculator', 'uae-leave-salary-calculator', 'uae-overtime-calculator', 'percentage-calculator', 'currency-converter'],
    processing: 'browser',
    comparison: {
      competitors: [
        'ClearTax UAE VAT Calculator',
        'Tally Solutions VAT Calculator',
        'ProfitBooks UAE VAT Calculator',
        'Comfi VAT Calculator',
        'vatcalculatoruae.com',
        'CalcUAE VAT Calculator',
        'NUM8ERS VAT Calculator',
      ],
      commonFeatures: [
        'Add or remove 5% VAT from a single amount',
        'Net, VAT and gross shown together',
        'Formula explanation with examples',
        'Verify a VAT amount on an invoice (CalcUAE)',
        'Bulk or multi-item calculations on some tools',
      ],
      implemented: [
        'Reverse mode from a VAT amount to net and total',
        'Quantity for unit prices',
        'Line-item invoice mode with per-line 5% or 0% rate and per-line rounding',
        'Copy of the breakdown (tab-separated for spreadsheets)',
        'Validation for empty, zero, negative and over-precise amounts',
      ],
      backlog: ['Arabic interface', 'Printable invoice summary', 'CSV import of invoice lines', 'Reverse-charge and designated-zone explanations'],
      advantages: [
        'Exact fils arithmetic, so add and remove round-trip without drift',
        'Three modes plus line items in one tool',
        'Runs entirely in your browser; amounts are never uploaded',
      ],
    },
    reviewed: '2026-09-25',
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
    processing: 'upload',
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
    processing: 'upload',
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
