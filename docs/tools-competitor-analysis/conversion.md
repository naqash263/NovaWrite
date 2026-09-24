# Conversion tools: competitor analysis and QA (reviewed 2026-09-24)

Hub: `/resources/conversion-tools`. Tools: length, weight, volume, temperature, area, speed, currency, time zone,
date calculator, number system, text, color, file size, percentage and BMI.

Content lives in `frontend/src/data/tools/conversion.ts`; tests in `frontend/e2e/tools/conversion.spec.ts`.
Competitor pages could not be fetched from the research environment (the egress proxy blocked `WebFetch` for
unitconverters.net, rapidtables.com and calculator.net), so competitor capabilities come from search-result
snippets listed under Sources, plus widely known features of Google's built-in converters. Nothing else is claimed.

## Cross-cutting findings

| Issue found | Fix |
| --- | --- |
| Duplicated "About X" / FAQ / "Use cases" blocks with `h3`/`h4` headings inside components | Removed; the page template renders how-to, features and FAQ. Remaining in-tool headings are `h2` |
| Labels not associated with inputs/selects (`<label>` without `htmlFor`) | Every control is labelled (`htmlFor`/`id`, `aria-label` for icon buttons, `aria-pressed` for mode toggles) |
| Five measurement converters were copy-pasted with rounded factors (e.g. lb = 0.453592, US gal = 3.78541, acre = 4046.86) and `toFixed(6)` output (tiny values showed as 0.000000) | New shared `UnitConverter.tsx` with exact factors, 12-significant-digit auto formatting (scientific notation for extremes), precision selector, formula line, all-units table, presets, copy buttons and validation |
| Swap replaced the input with a rounded result, losing precision | Swap now exchanges units and keeps the typed value |
| `type="number"` inputs silently turned invalid text into 0 | Text inputs with `inputMode="decimal"` and explicit messages; thousands separators (1,000) accepted |
| Status regions | Use `aria-live="polite"`; `role="status"` is avoided because the page reserves it for the lazy-load spinner |

Conversion constants used (all exact by definition unless noted): 1 in = 2.54 cm, 1 ft = 0.3048 m,
1 mi = 1,609.344 m, 1 nmi = 1,852 m, 1 lb = 0.45359237 kg, 1 oz = 28.349523125 g, 1 US gal = 3.785411784 L,
1 imp gal = 4.54609 L, 1 acre = 4,046.8564224 m², 1 mph = 1.609344 km/h, 1 kn = 1.852 km/h,
°F = °C × 9/5 + 32, K = °C + 273.15, Mach 1 ≈ 340.29 m/s (ISA sea level, approximation, labelled as such).
File sizes: KB/MB/GB/TB/PB are decimal SI (powers of 1,000); KiB/MiB/GiB/TiB/PiB are binary IEC (powers of 1,024).

## Length converter

Competitors: Google unit converter, UnitConverters.net, RapidTables, Calculator.net, Worldometer.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| Instant conversion, swap | All | Yes (swap rounded the value) | Yes, lossless swap |
| Exact factors | All | Yes | Yes |
| Feet + inches output | RapidTables, Inch Calculator | No | Yes |
| All units at once / tables | UnitConverters.net, Worldometer | No | All-units table |
| Formula shown | Worldometer, RapidTables | Static text only | Live "1 m = x ft" line |
| Precision control | Some | Fixed 6 decimals | Auto / 0–8 decimals |
| Micrometers, nanometers | UnitConverters.net | No | Yes |

## Weight converter

Competitors: Google unit converter, UnitConverters.net, RapidTables, Calculator.net.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| kg ↔ lb, oz, g, stone, tons | All | Yes, rounded factors | Yes, exact factors |
| Pounds + ounces, stones + pounds | Common | No | Yes |
| Troy ounces, carats | UnitConverters.net | No | Yes |
| Copy result | Some | No | Yes |

## Volume converter

Competitors: Google unit converter, UnitConverters.net, The Calculator Site, MiniWebtool, Go Tools.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| US vs imperial units | All | Partial (no imperial quart/pint), mixed in one list | Grouped US / imperial / metric |
| Cooking units | All | Yes, rounded | Yes, exact (derived from 231 in³ gallon) |
| Cubic feet / inches | Most | No | Yes |
| All units at once | MiniWebtool | No | Yes |

## Temperature converter

Competitors: Google, CalculatorSoup, Metric-Conversions.org, TemperatureTool, RapidTables.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| °C, °F, K | All | Yes (labelled "°K") | Yes, "K" |
| Rankine | CalculatorSoup, Metric-Conversions.org | No | Yes |
| Formula shown per pair | CalculatorSoup, TemperatureConvert | Static paragraph | Live, per pair |
| Below-absolute-zero validation | Rare | No (accepted −500 K) | Yes |
| All scales at once | TemperatureTool | No | Yes |
| Reference points | Most | Yes | Yes (adds body temperature, absolute zero) |

## Area converter

Competitors: UnitConverters.net (40 area units), The Calculator Site, Omni Calculator, Google.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| m², ft², acres, hectares | All | Yes, rounded (acre 4046.86) | Exact |
| All units at once | UnitConverters.net | No | Yes |
| Regional land units (marla, kanal, bigha) | Some | No | Backlog |

## Speed converter

Competitors: Calkoo, MiniWebtool (speedometer chart), GraphCalcX, Toolsana, Google.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| km/h, mph, m/s, ft/s, knots, Mach | All | Yes, rounded km/h and knot factors, Mach at 343 m/s unlabelled | Exact factors; Mach basis stated (340.29 m/s) |
| All units update together | GraphCalcX | No | Yes |
| Speed-of-light / pace units | MiniWebtool | No | Backlog (pace) |

## Currency converter

Competitors: Xe, OANDA, Google currency converter.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| Mid-market rates | Xe, OANDA | Yes (ExchangeRate-API v4) | Yes |
| Honest failure handling | n/a | **Bug:** on any failure it silently used years-old hard-coded rates and cleared the warning, so stale numbers looked live | Clear "Live exchange rates are unavailable" message, no estimate, Try again button |
| Rate date | Xe shows timestamp | Browser clock time ("Last updated" = when fetched) | Provider's rate date |
| Requests | n/a | One request per currency pair, plus a 5-minute polling interval for daily data | One USD table per load, cross rates computed locally |
| Inverse rate, popular currencies | Xe | No | Yes |
| Small amounts | n/a | `toFixed(2)` showed 0.00 | Currency-aware decimals, 4 for amounts under 1 |
| Unsupported entries | n/a | Gold/silver (always failed), Croatian kuna (retired 2023) | Removed |
| Historical charts, alerts | Xe, OANDA | No | Backlog |

The component fetches `https://api.exchangerate-api.com/v4/latest/USD`. Tests mock it with `page.route`
(success, HTTP 503, and the fixture's empty 204 stub).

## Time zone converter

Competitors: timeanddate.com, Savvy Time, Dateful, Koalendar, Almanac.com.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| DST-aware | All | **Bug:** fixed offsets (EST −5, PST −8…) so results were an hour off for much of the year; "AEDT"/"NZDT" hard-coded year-round | IANA zones via `Intl`, DST for the chosen date |
| Unambiguous zones | Cities | **Bug:** two options with value "CST" (US Central and China) so China was unreachable; "BST" meant Bangladesh | City-based IANA zones, full browser list |
| Past/future dates | timeanddate | Time only (today) | Date + time |
| Day change indicator, offsets | Most | No | +1/−1 day, UTC offsets, difference |
| DST gap/overlap handling | Rare | No | Warnings |
| Multiple cities | Savvy Time, timeanddate | No | "Same moment in other major cities" |
| Meeting planner, shareable links | timeanddate, Savvy Time | No | Backlog |

## Date calculator

Competitors: timeanddate.com (duration, add/subtract, workdays), Calculator.net (date, age), CalculatorSoup.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| Correct dates in all time zones | All | **Bug:** `new Date('YYYY-MM-DD')` is UTC midnight, then read in local time → one day early west of UTC (age, add, subtract) | UTC calendar arithmetic; tested in America/Los_Angeles |
| Days between dates | All | Yes, but years/months from 365/30-day approximations | Exact years/months/days, weeks, hours |
| Business days | timeanddate, Calculator.net | No | Weekday count (Mon–Fri) |
| Include end date | timeanddate | No | Yes |
| Add/subtract years, months, weeks | All | Days only | All four, month-end clamping |
| Age with next birthday | Calculator.net | Age only, negative for future dates | Age on any date, totals, next birthday, validation |
| Public holidays | timeanddate | No | Backlog |

## Number system converter

Competitors: RapidTables (bin/dec/hex/oct, base converter, two's complement), Math is Fun, Omni Calculator.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| Correct result after changing base | All | **Bug:** selects called the converter with stale state, and the initial "10" showed no result | Derived state |
| Invalid digits | All reject | **Bug:** `parseInt` truncation ("12" in binary → 1) | Named invalid digit message |
| Large numbers | RapidTables | Lost precision above 2^53 | BigInt, exact |
| Custom bases | RapidTables | No | 2–36 |
| All bases at once | RapidTables | No | Table with copy buttons |
| Two's complement, fractions | RapidTables | No | Backlog |

## Text converter

Competitors: ConvertCase.co (18 formats), StripHTML Case Converter, CaseConverter.cc.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| Upper/lower/title/sentence | All | Yes; sentence case only capitalised the first character of the whole text | Every sentence |
| camelCase, snake_case, kebab-case, CONSTANT_CASE | StripHTML, ConvertCase | No | Yes, plus PascalCase |
| Base64 of non-Latin text | n/a | **Bug:** `btoa` threw on é, emoji, etc. | UTF-8 safe, URL-safe input accepted |
| Text ↔ binary | Some | Wrong for characters above U+00FF | UTF-8 bytes |
| Live output | All | Case only; others needed a click | All |
| Copy / download | All | Copy only (no fallback) | Copy, download .txt, Use as input |

## Color converter

Competitors: RapidTables (HEX, RGB, HSV, HSL, CMYK), Convert a Color, LumenCalculator (alpha).

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| HEX ↔ RGB ↔ HSL | All | Yes | Yes |
| HSV, CMYK | RapidTables, Convert a Color | No | Yes |
| Shorthand hex, validation | Most | No shorthand; invalid text fed to `<input type=color>` | #F00 accepted; clear message |
| Copy per format | Most | No | Yes |
| Contrast ratio | Rare | No | WCAG ratio vs white/black |
| Alpha / named colors | LumenCalculator | No | Backlog |

## File size converter

Competitors: CodeShack, MiniWebtool, developers.do, CalculatorHub, WhatIsMyIP.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| Decimal vs binary | All | **Bug:** 1,024-based factors labelled as KB/MB/GB with "1 KB = 1,024 bytes" | Both standards, IEC names (KiB…) for binary |
| Bits | Most | No | bit, Mb, Gb |
| All units at once | CalculatorHub, MiniWebtool | No | Yes |
| Explanation | developers.do | Misleading | "Why a 1 TB drive shows ~931 GB" note |

## Percentage calculator

Competitors: Calculator.net, GigaCalculator, CalculatorSoup, Pearson.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| What is X% of Y | All | **Missing** (the most common query) | Yes |
| X is what % of Y | All | Yes | Yes |
| Percentage change | All | Missing | Yes (increase/decrease wording) |
| Increase / decrease / discount | All | Yes | Yes, with amount added/saved |
| Reverse percentage | CalculatorSoup, Pearson | No | Yes |
| Percentage difference | GigaCalculator, Calculator.net | No | Yes |
| Formula shown | Pearson (step by step) | Static paragraph | Formula with the user's numbers |

## BMI calculator

Competitors: Calculator.net, CDC Adult BMI Calculator, CalculatorSoup, GigaCalculator.

| Capability | Competitors | This tool before | This tool now |
| --- | --- | --- | --- |
| Result updates correctly | All | **Bug:** `calculateBMI()` ran with the previous state, lagging one keystroke | Derived state (tested key by key) |
| Metric and US units | All | Yes (US height in inches only) | kg/cm, lb/ft/in |
| Healthy weight range | Calculator.net | No | Yes |
| BMI Prime | Calculator.net | No | Yes |
| Obesity classes | CDC, Calculator.net | Single "Obese" | Classes I–III (WHO) |
| Label consistent with shown number | n/a | 24.96 showed "25.0" but "Normal" | Category from the rounded value |
| Children / age & sex percentiles | Calculator.net, CDC | No | Backlog (noted as not for under 20s) |

## Backlog (larger gaps)

- Shareable URLs with value and units for all converters.
- Currency: historical charts, rate alerts, searchable picker, server-side cached rates via the Laravel API.
- Time zones: meeting planner with working-hours grid; search by city name.
- Date: public-holiday calendars for business days; countdown.
- Number system: two's complement / fixed bit width; fractional values.
- Color: alpha channel, CSS named colors, palettes.
- BMI: child and teen BMI-for-age percentiles.
- Area: regional land units; length: fractional inches.

## Sources

- https://www.unitconverters.net/length-converter.html
- https://www.unitconverters.net/area-converter.html
- https://www.rapidtables.com/convert/length/meter-to-feet.html
- https://www.worldometers.info/converters/length/meters-to-feet/
- https://www.inchcalculator.com/convert/meter-to-foot/
- https://support.google.com/websearch/answer/3284611?hl=en
- https://www.calculator.net/conversion-calculator.html
- https://www.thecalculatorsite.com/conversions/liquidvolume.php
- https://miniwebtool.com/volume-converter/
- https://go-tools.org/tools/volume-converter
- https://www.calculatorsoup.com/calculators/conversions/temperature.php
- https://www.metric-conversions.org/temperature/
- https://www.temperaturetool.com/
- https://www.omnicalculator.com/conversion/area-converter
- https://www.calkoo.com/en/speed-converter
- https://miniwebtool.com/speed-converter/
- https://graphcalcx.com/calculators/unit-converters/speed-converter/
- https://www.xe.com/en-us/currencyconverter/
- https://help.xe.com/hc/en-gb/articles/360019467737-What-is-the-mid-market-rate
- https://www.oanda.com/currency-converter/en/
- https://www.timeanddate.com/worldclock/converter-classic.html
- https://savvytime.com/converter
- https://dateful.com/time-zone-converter
- https://koalendar.com/tools/timezone-converter
- https://www.timeanddate.com/date/duration.html
- https://www.timeanddate.com/date/workdays.html
- https://www.timeanddate.com/date/dateadd.html
- https://www.calculator.net/date-calculator.html
- https://www.calculator.net/age-calculator.html
- https://www.calculatorsoup.com/calculators/time/date-day.php
- https://www.rapidtables.com/convert/number/hex-dec-bin-converter.html
- https://www.rapidtables.com/convert/number/base-converter.html
- https://www.mathsisfun.com/binary-decimal-hexadecimal-converter.html
- https://convertcase.co/
- https://www.striphtml.com/text-tools/convert-case/
- https://caseconverter.cc/
- https://www.rapidtables.com/convert/color/index.html
- https://convertacolor.com/
- https://lumencalculator.com/color-converter/
- https://codeshack.io/file-size-converter/
- https://miniwebtool.com/file-size-converter/
- https://www.developers.do/tools/file-size-converter
- https://calculatorhub.com/tools/file-size-calculator/
- https://www.calculator.net/percent-calculator.html
- https://www.gigacalculator.com/calculators/percentage-calculator.php
- https://www.calculatorsoup.com/calculators/algebra/percent-change-calculator.php
- https://www.pearson.com/channels/calculators/percentage-calculator
- https://www.calculator.net/bmi-calculator.html
- https://www.cdc.gov/bmi/adult-calculator/index.html
- https://www.calculatorsoup.com/calculators/health/bmi-calculator.php
