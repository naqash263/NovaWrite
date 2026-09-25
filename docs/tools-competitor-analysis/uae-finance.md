# UAE finance tools: rules, competitor analysis and QA (reviewed 2026-09-25)

Hub: `/resources/utility-tools` (category `finance`). Tools: UAE gratuity calculator
(`uae-gratuity-calculator`) and UAE VAT calculator (`uae-vat-calculator`). Both were added in response to
`docs/GROWTH_AUDIT_2026-09.md` section 5.1 (priorities 1 and 5).

Processing: both run entirely in the browser (`processing: 'browser'`). The arithmetic is in
`frontend/src/components/tools/uaeMoney.ts`: money is held as BigInt fils or as an exact fraction, and it is
rounded half-up to 2 decimals only when displayed.

Research: facts come from web search result snippets. Direct fetches of u.ae, mohre.gov.ae,
uaelegislation.gov.ae, gulfnews.com, khaleejtimes.com and the competitor calculators were blocked by the
research environment's egress proxy, so only what the snippets state is recorded here. Anything we could not
verify is left out of the tool content.

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

`frontend/e2e/tools/uae-finance.spec.ts`: 15 tests (14 desktop + 1 `@mobile`). Expected values are computed
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
