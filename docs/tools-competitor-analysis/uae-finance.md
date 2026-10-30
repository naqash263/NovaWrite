# UAE finance tools: rules, competitor analysis and QA (reviewed 2026-09-29)

Hub: `/resources/utility-tools` (category `finance`). Tools: UAE gratuity calculator
(`uae-gratuity-calculator`) and UAE VAT calculator (`uae-vat-calculator`), added in response to
`docs/GROWTH_AUDIT_2026-09.md` section 5.1 (priorities 1 and 5), plus the UAE leave salary calculator
(`uae-leave-salary-calculator`) and UAE overtime calculator (`uae-overtime-calculator`), added on 2026-09-29
for low-difficulty Semrush keywords (UAE database, Sept 2026): "leave salary calculator uae" (880/mo, KD 9),
"leave salary calculation in uae" (880, KD 9), "annual leave calculator uae" (320, KD 9), "overtime calculator
uae" (1,300, KD 17) and "overtime calculation in uae" (1,300, KD 17). The four tools link to each other
through `related`, and the gratuity and leave pages also link in their content.

Processing: all four run entirely in the browser (`processing: 'browser'`). The arithmetic is in
`frontend/src/components/tools/uaeMoney.ts`: money is held as BigInt fils or as an exact fraction, and it is
rounded half-up to 2 decimals only when displayed.

Research: facts come from web search result snippets. Direct fetches of u.ae, mohre.gov.ae,
uaelegislation.gov.ae, gulfnews.com, khaleejtimes.com and the competitor calculators were blocked by the
research environment's egress proxy, so only what the snippets state is recorded here. Anything we could not
verify is left out of the tool content.
The 2026-09-29 research for the leave salary and overtime tools had the same restriction (u.ae, mohre.gov.ae,
uaelegislation.gov.ae, jafza.ae, khaleejtimes.com, gulfnews.com and the law-firm sites were all blocked), so
those rules also rest on search snippets that quote the law, MOHRE and u.ae.

## Gratuity rules as implemented

| Rule | Implementation | Source |
| --- | --- | --- |
| Eligibility: at least one year of continuous service | Under 1 year of eligible service returns AED 0 with a "Not eligible yet" message | u.ae calculations page; MOHRE guidance ("Dear Worker"); Decree-Law 33/2021 Art. 51 |
| 21 days of basic wage per year for the first 5 years, 30 days per year after | Band 1 / band 2 breakdown and a per-year schedule | u.ae; MOHRE; Art. 51 |
| Basic wage only (no housing, transport or other allowances) | Input is "Basic monthly salary"; hint repeats the exclusion | u.ae ("will not include allowances such as housing, transportation, utilities, furniture") |
| Part years are paid pro-rata once one year is completed | Remaining days count as n/365 of a year; months in Y/M/D mode count as 1/12 year | MOHRE guidance; Art. 51 |
| Total capped at two years' wage | Cap = 24 × basic monthly salary; row marked "(cap)" | u.ae ("shall not exceed the wage of two years") |
| Unpaid absence days are not counted as service | "Unpaid leave days" input is subtracted before eligibility and amount | MOHRE ("Unpaid days of absence from work shall not be included"); Art. 51 cl. 4; Gulf News |
| Paid within 14 days of the contract ending | FAQ only | uaeahead.com (ProConsult Advocates) summary of the law |
| Part-time: full-time gratuity × contracted hours ÷ full-time hours | "Working hours as % of full time" (Advanced) | Cabinet Resolution 1 of 2022 Art. 30, as reported by Khaleej Times and law-firm summaries |
| Service length from dates | First and last working day both count; whole years by anniversary so leap days do not add fractions | Implementation choice (stated on the page) |

### Daily wage divisor: ÷ 30 or × 12 ÷ 365?

The brief suggested `basic × 12 ÷ 365`. The research does not support that as the mainland default:

- The law and the official u.ae/MOHRE pages express gratuity in "days' wage" and do not state a divisor.
- Gulf News, Khaleej Times, the Dubai Development Authority sample calculator (as described by third-party
  guides) and the calculators that cite MOHRE all use **basic ÷ 30** (AED 10,000 → AED 333.33 a day). No
  official page we could reach states × 12 ÷ 365 for the mainland.
- Law-firm guides (BCL Globiz, ProConsult) say the law "does not prescribe a single method"; ÷ 30 is the
  most common and some employers annualise (× 12 ÷ 365 → AED 328.77).
- ADGM's Employment Regulations explicitly use annual basic wage ÷ 365. DIFC DEWS contribution rates
  (5.83% and 8.33% = 21/360 and 30/360) mirror a 30-day month.

Decision: default **÷ 30**, with × 12 ÷ 365 selectable under Advanced options. The difference is explained in an FAQ.

### Contract type and resignation

Federal Decree-Law No. 33 of 2021 took effect on 2 February 2022 and allows fixed-term contracts only;
unlimited contracts had to be converted (transition to 31 December 2023). The unified regime removed the
resignation-based reductions (one-third for 1–3 years, two-thirds for 3–5 years) that applied to resignations
from unlimited contracts under Law No. 8 of 1980. Khaleej Times reported that the old scheme applied to
unlimited contracts only until they were renewed as limited contracts. The calculator therefore has no
contract-type or reason-for-leaving input. The FAQ explains the old cuts, and pre-2022 reductions are in the backlog.

### Free zones

- DIFC: gratuity was replaced by the DEWS funded savings plan on 1 February 2020 (Lockton; DIFC guides).
- ADGM: own Employment Regulations. Same 21/30-day structure and a daily rate of basic ÷ 365, and from
  1 April 2025 an optional savings scheme (ADGM rulebook; Pensions Monitor).

The tool does not calculate either. It shows a clear note and links the sources.

## Gratuity competitor comparison

| Capability | MOHRE calculator | gratuitycalculatoruae.ae | Bayzat | Khaleej Times | Gulf News / DDA | HowUAE | Zoho Payroll | This tool |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Basic salary + joining / last date | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes (date picker or Y/M/D) |
| Limited / unlimited, resign / terminate inputs | Yes | Yes | n/k | Reason for leaving | n/k | n/k | Limited / unlimited | Not needed since 2022; explained in FAQ |
| Unpaid leave days | n/k | Yes (advanced) | n/k | Mentioned in text | n/k | n/k | Yes | Yes, incl. the effect on the 1-year minimum |
| Per-band breakdown | n/k | Yes | Formula only | n/k | n/k | Formula only | n/k | Yes |
| Year-by-year schedule | No | Yes | No | No | No | No | Reports | Yes, with running total and cap marker |
| Daily wage method explained | No | ÷ 30 | ÷ 30 | ÷ 30 | ÷ 30 | n/k | n/k | Both methods, selectable |
| Part-time | n/k | Yes | n/k | Mentioned | n/k | n/k | n/k | Yes (% of full-time hours) |
| PDF / print | n/k | PDF | No | No | No | No | Reports | Print (print to PDF) + Copy |
| Worked example on page | n/k | Yes | Yes | Yes | Yes | Yes | n/k | Yes (formula, example, sources) |
| Arabic | Yes | Yes | n/k | No | No | No | n/k | No (backlog) |
| DIFC/ADGM handling | n/k | n/k | n/k | "special regime" note | n/k | n/k | n/k | Clear note and sources |

n/k = not known from the available snippets. "Bayt" did not surface in search; Bayzat (HR platform) did.

Gaps closed: year-by-year schedule, per-band breakdown, unpaid-leave handling with eligibility effect,
explicit daily-wage method, part-time, formula + worked example + official sources, Copy/Print, exact rounding.
Backlog: Arabic, one-click PDF, full final settlement (leave encashment, notice pay, ticket), DIFC DEWS and
ADGM calculators, pre-2022 unlimited-contract resignation reductions.

### Gratuity search coverage (2026-09-29)

Keywords added for the gratuity cluster: "gratuity calculator" (60.5k), "gratuity calculator uae" (49.5k),
"gratuity calculator dubai" (4.4k), "how to calculate gratuity in uae" (3.6k), "gratuity calculator abu dhabi"
(880), "uae gratuity law" (880), "uae settlement calculator" (480), "final settlement calculation" (320) and
"jafza gratuity calculator" (390), alongside the existing "uae gratuity calculator", "end of service calculator
uae", "mohre gratuity calculator" and "dubai gratuity calculator". FAQs were reorganised (the registry allows
at most 5):

- "Is this the same as the MOHRE gratuity calculator?": no; an independent tool applying the same Federal
  Decree-Law formula, not affiliated with MOHRE.
- "Does it work in Dubai, Abu Dhabi, JAFZA, DIFC or ADGM?": yes for mainland jobs in every emirate and for JAFZA,
  whose companies must follow the federal labour law for end-of-service benefits (JAFZA guide
  "How to calculate gratuity for employees of Jafza companies", Khaleej Times "JAFZA visa: gratuity, ticket as per
  Labour Law"); DIFC (DEWS since February 2020) and ADGM (own Employment Regulations) differ.
- "What is included in the final settlement?": gratuity + unused leave (basic salary) + unpaid salary and
  overtime + notice pay + contract benefits such as a ticket, due within 14 days (Article 53). Points to the leave
  salary tool; the page body links to the leave salary and overtime calculators.
- The daily-wage (÷ 30 vs × 12 ÷ 365) answer was folded into "How is gratuity calculated in the UAE?", and the
  14-day payment answer into the final-settlement FAQ.

Top-ranking gratuity competitors named in the Semrush brief and added to the registry comparison:
gulfnews.com and dda.gov.ae (already listed), plus gratuitycalculatordubaiuae.ae, ZenHR, Cercli and Workforce.ae. Their
feature sets could not be checked (direct fetches are blocked, see Research above), so they are listed without a
feature column.

## Leave salary rules as implemented

| Rule | Implementation | Source |
| --- | --- | --- |
| 30 calendar days of paid leave per year of service once one year is completed | Leave earned = 30 × years of service when service ≥ 1 year | Decree-Law 33/2021 Art. 29(1); u.ae annual leave page; Bayzat, uaeahead.com summaries |
| 2 days per month when service is more than 6 months and less than 1 year | 2 × completed calendar months (6–11 months) | Art. 29(1)(b); u.ae; Khaleej Times |
| Fraction of the last year paid when service ends | Part years pro-rata: 30 × days ÷ 365 (e.g. 181 days = 14.88 days) | Art. 29 ("entitled to leave for the fraction of the last year"), u.ae types-of-leave page, uaeahead.com |
| Under 6 months: no statutory paid leave | 0 days with a "Not entitled yet" note. **Option**: "2 days per completed month" because some sources say leavers during probation are paid accrued days | u.ae / Sovereign Group guides (no entitlement); auxiliumservices.com (probation leavers paid) |
| Pay during annual leave is the *wage* (Art. 1: basic wage plus cash allowances and benefits) | Leave-salary mode default = basic + allowances. **Option**: basic only if the contract says so | Art. 1 definitions of "Wage" and "Basic Wage" (as quoted by NOW Money, Rousan & Associates); Gulf News "full salary and allowances during annual leave"; hhslawyers.com |
| Unused leave paid at exit on the *basic* wage | Exit mode default = basic salary. **Option**: basic + allowances for more generous contracts | Art. 29(9) as quoted by Khaleej Times, hhslawyers.com, Gulf News, qasproglobal.com |
| Daily wage divisor | Default monthly wage ÷ 30. **Option**: × 12 ÷ 365 | Law does not fix a divisor; ÷ 30 used by MOHRE-citing guides and calculators (Yomly, BCL Globiz, qasproglobal.com); some payroll systems annualise |
| Unpaid leave not counted as service | Unpaid days subtracted from service before accrual (and from the end date for the completed-month count) | Sovereign Group, Kinetic, Bayzat leave guides (practice; mirrors Art. 51 for gratuity) |
| Carry forward up to half a year's leave with employer agreement, or a cash allowance at the wage when due; employer cannot block use for more than 2 years | Explained on the page and in an FAQ (not calculated) | Cabinet Resolution 1/2022 (Executive Regulations) and Art. 29(8), as quoted by Khaleej Times and Emirates 24/7 |
| Final dues within 14 days | Explained on the page | Art. 53, as summarised by uaeahead.com and payslip.ae |

Balance = leave earned − paid leave already taken (whole employment). A negative balance shows an "overdrawn"
warning and pays AED 0; planned leave above the balance shows a warning. Leave days are held as exact fractions
(over 438,000) and money in BigInt fils, like the gratuity tool.

We did not find a primary source stating the ÷ 30 divisor; one guide attributes it to "Article 67", which we
could not verify, so the tool presents ÷ 30 as practice, not law.

## Overtime rules as implemented

| Rule | Implementation | Source |
| --- | --- | --- |
| Normal hours at most 8 a day or 48 a week (2 hours less in Ramadan) | Warnings above 8 h/day and 48 h/week; Ramadan in text and FAQ | Art. 17; u.ae working hours page |
| Overtime = normal-hours pay on the **basic** wage + at least 25% | +25% on the hourly basic wage (× 1.25 per hour) | Art. 19(2); MOHRE "Dear Worker – Know Your Rights"; u.ae ("remuneration (which is based on basic salary)"); Khaleej Times; Bracewell |
| 10 pm–4 am: at least 50%, not for shift workers | +50%; "I work in shifts" option drops night hours to +25% | Art. 19(3); MOHRE Dear Worker; u.ae |
| Rest day: substitute rest day, or the day's wage + at least 50% of the basic wage; max 2 consecutive rest days (except daily-wage workers) | Rest-day / public-holiday hours at × 1.5 of the hourly base | Art. 19(4)–(5) as quoted by Emirates 24/7, legaleagle.ae; MOHRE Dear Worker |
| Public holiday: another day off for each day, or the day's wage + at least 50% of the basic wage | Same × 1.5 category | Art. 28 (quoted by Gulf News / Emirates 24/7) |
| Overtime at most 2 h/day (except to prevent serious loss or accident); total hours at most 144 per 3 weeks | Warnings: average (regular + night) overtime per working day > 2; (normal + all overtime hours) scaled to 3 weeks > 144 | Art. 19(1); Executive Regulations Art. 15(3) |
| Some categories exempt from the hour limits | Mentioned in disclaimer and FAQ | Executive Regulations Art. 15(4) (snippet) |
| Hourly rate convention | Default basic ÷ 30 ÷ normal daily hours. **Options**: × 12 ÷ 365 ÷ daily hours (Emirates 24/7, Bayzat), × 12 ÷ 52 ÷ weekly hours | Law does not fix a divisor; ÷ 30 ÷ 8 used by Khaleej Times' example and most guides |
| Wage base | Default basic salary (legal minimum). **Option**: basic + allowances for contracts that pay more | As above |

The "period" input (one week, three weeks, one month = 30 days) is only used for the limit checks. With a
48-hour week any sustained overtime exceeds 144 hours per 3 weeks; the warning reports this literally, as
Article 19(1) is written. Premiums above the legal minimum are in the backlog.

Simplification: for rest-day work the law pays "the wage for that day" plus 50% of the *basic* wage. With the
default basic-salary base this is exactly 150% of the hourly basic wage. With the allowances option the tool
applies 150% to the full hourly wage, i.e. it assumes the more generous contract also pays the premium on it.

## Leave salary and overtime competitor notes

Checked through search snippets only (direct fetches blocked):

| Capability | Payslip.ae | thegratuitycalculator.ae | BCL Globiz | Yomly | RadixHR | This tool |
| --- | --- | --- | --- | --- | --- | --- |
| Encashment = basic ÷ 30 × days | Yes | Yes | Yes | Yes | Yes | Yes (÷ 30 or × 12 ÷ 365) |
| Accrual from joining date | Yes | n/k | n/k | n/k | n/k | Yes, incl. 6-month and 1-year thresholds and pro-rata part year |
| Planned-leave salary on full wage vs exit on basic | n/k | Mentions | n/k | n/k | n/k | Both modes, basis selectable |
| Unpaid leave / taken days | n/k | n/k | n/k | n/k | n/k | Yes |

| Capability | Bayzat | RadixHR | uaecalculator.ae | uaegratuity-calculator.com | TimeChart | This tool |
| --- | --- | --- | --- | --- | --- | --- |
| 125% / 150% rates | Yes | Yes | Yes | Yes | Yes | Yes, per type in one run |
| Shift-worker night exception | Text | n/k | n/k | n/k | n/k | Option |
| Legal-limit warnings (2 h/day, 144 h/3 weeks, 8 h / 48 h) | Text | n/k | n/k | n/k | n/k | Yes |
| Divisor choice | × 12 ÷ 365 ÷ 8 | n/k | n/k | n/k | n/k | Three conventions |

n/k = not known from the snippets.

## VAT rules as implemented

| Rule | Implementation | Source |
| --- | --- | --- |
| Standard rate 5% since 1 January 2018, administered by the FTA | Fixed 5% rate | MoF VAT page; u.ae About VAT; FTA |
| Add VAT: VAT = net × 5%, gross = net × 1.05 | Add VAT mode | FTA/u.ae (rate); ClearTax, Tally (formula) |
| Remove VAT: VAT = gross × 5/105, net = gross − VAT | Remove VAT mode | ClearTax, Daftra (formula) |
| Reverse from a VAT amount: net = VAT × 20, gross = VAT × 21 | From VAT amount mode | Derived from the 5% rate |
| Zero-rated (e.g. exports outside the GCC, international transport) and exempt supplies (certain financial services, bare land, local passenger transport) | 0% line rate in Line items mode; FAQ | PwC tax summaries; FTA zero-rating page; u.ae guidance on zero-rated and exempt supplies |
| Mandatory registration above AED 375,000, voluntary above AED 187,500 | FAQ only | FTA registration page; PwC |
| Rounding | Half-up to the fils on each line; lines are summed | Implementation choice (third-party guides describe line-by-line rounding; not claimed as law) |

Because rounding is half-up, add followed by remove always returns the original net amount. The tests check this.

## VAT competitor comparison

| Capability | ClearTax | Tally | ProfitBooks | Comfi | vatcalculatoruae.com | CalcUAE | NUM8ERS | This tool |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Add / remove 5% | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Reverse from a VAT amount | n/k | n/k | n/k | n/k | n/k | "Verify" | n/k | Yes |
| Quantity / unit price | n/k | n/k | n/k | n/k | n/k | n/k | n/k | Yes |
| Multi-line invoice with 0% lines | No | No | No | No | No | No | Bulk | Yes |
| Copy result | n/k | n/k | n/k | n/k | n/k | n/k | n/k | Yes (tab-separated for spreadsheets) |
| Formula + worked example | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes, with official sources |
| Arabic | n/k | n/k | n/k | n/k | n/k | n/k | n/k | No (backlog) |

Backlog: Arabic, printable invoice summary, CSV import of lines, reverse-charge and designated-zone notes.

## Tests

`frontend/e2e/tools/uae-employment.spec.ts` (leave salary and overtime), expected values computed independently:

- 3 years, 60 days taken, AED 10,000 basic + 5,000 allowances: 90 earned, 30 balance, 30-day leave = AED 15,000
  (full wage) or AED 10,000 (basic only); over-balance warning at 35 days
- exit after 3 years with 75 taken = 15 days = AED 5,000 on basic (AED 7,500 with allowances); leaving
  30 June 2026 adds 14.88 days (AED 9,958.90)
- 8 months = 16 days; exactly 6 months = 12 days; 5 months = 0 with "not entitled" (10 days with the pro-rata
  option); exactly 1 year = 30 days
- 73 unpaid days: 2 years 292 days = 84 days = AED 28,000; 10 unpaid days in the first year = 11 months = 22 days;
  unpaid ≥ service rejected; 100 taken of 90 earned = overdrawn, AED 0
- known balance 22.5 days at AED 9,000 = AED 6,750 (÷ 30) and AED 6,657.53 (× 12 ÷ 365)
- validation, Copy and Print
- overtime AED 6,000 / 8 h: AED 25/h; 10 regular + 4 night + 8 rest-day hours = AED 762.50; shift worker
  AED 737.50; AED 3,200 → AED 166.67 for 10 h; 7.5-hour days; × 12 ÷ 365 and × 12 ÷ 52 methods; allowances option
- limit warnings: exactly 144 h in 3 weeks (none) vs 144.5 (warning); 2.0 vs 2.4 overtime hours a day;
  9-hour days and 54-hour weeks; zero hours; validation; Copy
- SEO (H1, title, description, WebApplication + FAQPage + HowTo JSON-LD, dateModified, prerendered HTML),
  cross-links between the four UAE tools, and no horizontal overflow at 390 px (`@mobile`)

`frontend/e2e/tools/uae-finance.spec.ts`: 16 tests (15 desktop + 1 `@mobile`), including a check that the
gratuity FAQ answers the MOHRE, emirate / free-zone and final-settlement questions. Expected values are computed
independently in the test:

- 3 years at AED 10,000 = 63 days × 333.33 = AED 21,000
- 7 years = 105 + 60 days = AED 55,000, entered both as Y/M/D and as dates spanning two leap days
- 3 y 6 m pro-rata
- 30 years capped at AED 240,000; 25 years not capped
- 364 days = AED 0; 365 days = AED 7,000
- 90 unpaid days (6 y 275 d = AED 52,534.25); unpaid days pushing service under a year
- the × 12 ÷ 365 method; the part-time percentage
- validation; Copy and Print
- VAT add/remove round-trips; quantity; reverse; line items (excluding and including VAT, 0% line, remove line)
- VAT validation
- SEO checks: one H1, title, WebApplication and FAQPage JSON-LD, and the prerendered HTML
- no horizontal overflow at 390 px

## Sources

Leave salary, overtime and gratuity-coverage research (2026-09-29, via search snippets):

- https://u.ae/en/information-and-services/jobs/employment-in-the-private-sector/types-of-leaves-and-entitlements-in-the-private-sector/annual-leave
- https://u.ae/en/information-and-services/jobs/Sector-of-employment/employment-in-the-private-sector/Types-of-leaves
- https://u.ae/en/information-and-services/jobs/Sector-of-employment/employment-in-the-private-sector/working-hours
- https://u.ae/en/information-and-services/jobs/employment-in-the-private-sector/types-of-leaves-and-entitlements-in-the-private-sector/official-leaves-and-vacations
- https://mohre.gov.ae/en/guidance-and-awareness-portal-new/employee-companies/dear-worker-know-your-rights
- https://www.mohre.gov.ae/assets/download/635f7/Additional%20Working%20Hours%20-%20Wages%20-%20Leaves%20Guide%20EN.pdf.aspx
- https://uaelegislation.gov.ae/en/legislations/1541/download (Federal Decree-Law No. 33 of 2021)
- https://www.khaleejtimes.com/uae/legal/annual-leave-in-uae-how-many-days-you-can-take-carry-forward-all-you-need-to-know
- https://www.khaleejtimes.com/uae/legal/labour-law-can-you-encash-unused-annual-leave-carry-it-forward
- https://www.khaleejtimes.com/uae/legal/overtime-pay-explained
- https://www.khaleejtimes.com/uae/jafza-visa-gratuity-ticket-as-per-labour-law
- https://gulfnews.com/ask-gulf-news/uae-annual-leave-pay-are-you-entitled-to-your-full-salary-including-allowances-1.500620286
- https://gulfnews.com/living-in-uae/ask-us/working-during-eid-uae-1.500454399
- https://www.emirates247.com/uae-guide/working-in-the-uae-how-is-overtime-pay-calculated/3876
- https://hhslawyers.com/blog/unused-annual-leave-encashment-new-uae-labour-law/
- https://uaeahead.com/uae-labour-law-annual-leave/
- https://uaeahead.com/uae-labour-law-working-hours/
- https://legaleagle.ae/en/employees-right-to-financial-compensation-or-rest-days-for-overtime-hours-in-the-uae/
- https://www.bracewell.com/resources/uae-employment-law-update/
- https://nowmoney.me/blog/basic-salary-in-uae-labour-law/
- https://rousanlaw.com/bonus-commission-are-not-part-of-the-basic-wage-according-to-the-uae-new-employment-law-no-33-of-2021/
- https://www.sovereigngroup.com/news/a-comprehensive-guide-to-leave-entitlements-in-the-uae/
- https://www.jafza.ae/resource-centre/guides/how-to-calculate-gratuity-for-employees-of-jafza-companies/
- https://payslip.ae/annual-leave
- https://payslip.ae/final-settlement
- https://thegratuitycalculator.ae/leave-salary-calculator-uae/
- https://bcl.ae/leave-encashment-calculator-2026/
- https://www.yomly.com/hr-toolkit/online-leave-salary-calculator-for-uae/
- https://radixhr.com/leave-salary-calculator
- https://radixhr.com/overtime-calculator
- https://www.bayzat.com/blog/overtime-calculation-uae/
- https://uaecalculator.ae/overtime-calculator-uae/
- https://www.uaegratuity-calculator.com/overtime-calculator-uae/
- https://www.timechart.org/blogs/overtime-calculation-in-uae.html
- https://gratuitycalculatordubaiuae.ae/

Gratuity and VAT research (2026-09-25):


- https://u.ae/en/information-and-services/jobs/end-of-service-benefits-for-employees-in-the-private-sector/calculations-for-gratuity-pay-
- https://u.ae/en/information-and-services/jobs/end-of-service-benefits-for-employees-in-the-private-sector/provisions-for-end-of-service-benefits
- https://u.ae/cy/information-and-services/jobs/employment-in-the-private-sector/end-of-service-benefits-for-employees-in-the-private-sector
- https://mohre.gov.ae/en/guidance-and-awareness-portal-new/employee-companies/dear-worker-know-your-rights
- https://www.mohre.gov.ae/en/laws-and-regulations/Laws/faq.aspx
- https://www.mohre.gov.ae/assets/download/e82f7872/Federal%20Decree-Law%20No.%2033%20of%202021%20Regarding%20the%20Regulation%20of%20Employment%20Relationship%20and%20its%20amendments_638990571068264034.pdf.aspx
- https://uaelegislation.gov.ae/en/legislations/1547/download (Cabinet Resolution No. 1 of 2022)
- https://gulfnews.com/living-in-uae/ask-us/unpaid-leave-days-will-not-be-included-in-gratuity-calculation-mohre-1.1673617486269
- https://www.khaleejtimes.com/uae/legal/new-uae-labour-law-how-to-calculate-gratuity-if-youre-leaving-your-job-after-feb-2
- https://www.khaleejtimes.com/uae/legal/uae-how-will-end-of-service-benefits-gratuity-be-calculated-if-i-take-up-part-time-job
- https://www.khaleejtimes.com/uae/jobs/gratuity-calculator
- https://bcl.ae/blogs/gratuity-calculation-uae/
- https://uaeahead.com/uae-gratuity-calculator-guide/
- https://www.clydeco.com/en/insights/2024/02/transformative-labour-laws-2023
- https://global.lockton.com/us/en/news-insights/uae-to-replace-end-of-service-gratuity-with-funded-workplace-savings-plan
- https://en.adgm.thomsonreuters.com/rulebook/59-end-service-gratuity
- https://pensionsmonitor.com/2025/02/04/adgm-enables-end-of-service-benefits-savings-scheme-from-1-april-2025/
- https://dda.gov.ae/en/gratuity-calculator/gratuity-calculator
- https://gratuitycalculatoruae.ae/
- https://app.bayzat.com/tools/gratuity-calculator
- https://howuae.ae/gratuity-calculator-uae/
- https://www.zoho.com/en-ae/payroll/gratuity-calculator/
- https://www.thenationalnews.com/business/gratuity-calculator/
- https://mof.gov.ae/en/public-finance/tax/vat/
- https://u.ae/en/information-and-services/finance-and-investment/taxation/valueaddedtaxvat/about-vat
- https://tax.gov.ae/en/faqs
- https://tax.gov.ae/en/taxes/Vat/vat.topics/registration.for.vat.aspx
- https://tax.gov.ae/en/content/zerorating.of.export.of.services.aspx
- https://taxsummaries.pwc.com/united-arab-emirates/corporate/other-taxes
- https://www.cleartax.com/ae/vat-calculator
- https://tallysolutions.com/mena/uae-vat/online-vat-calculator/
- https://profitbooks.net/uae-vat-calculator/
- https://comfi.ai/tools/vat-calculator
- https://vatcalculatoruae.com/
- https://www.calcuae.com/calculators/vat
- https://num8ers.com/tools/vat-calculator/
- https://www.daftra.com/en/hub/vat-inclusive-exclusive-uae
