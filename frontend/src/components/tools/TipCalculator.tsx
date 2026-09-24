import { useState } from 'react';

const PRESETS = [10, 15, 18, 20, 25];
const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'PKR', 'AED'];

const parse = (s: string) => (s.trim() === '' ? NaN : Number(s));

export default function TipCalculator() {
  const [bill, setBill] = useState('100');
  const [tipPercent, setTipPercent] = useState('15');
  const [people, setPeople] = useState('1');
  const [tax, setTax] = useState('');
  const [roundUp, setRoundUp] = useState(false);
  const [currency, setCurrency] = useState('USD');

  const billAmount = parse(bill);
  const percent = parse(tipPercent);
  const peopleCount = parse(people);
  const taxAmount = tax.trim() === '' ? 0 : parse(tax);

  const errors = {
    bill: Number.isNaN(billAmount)
      ? 'Enter the bill amount.'
      : billAmount < 0
        ? 'The bill cannot be negative.'
        : billAmount > 1e9
          ? 'Enter a bill up to 1,000,000,000.'
          : '',
    percent: Number.isNaN(percent) ? 'Enter a tip percentage.' : percent < 0 || percent > 100 ? 'Enter a tip between 0 and 100%.' : '',
    people: Number.isNaN(peopleCount)
      ? 'Enter the number of people.'
      : !Number.isInteger(peopleCount) || peopleCount < 1 || peopleCount > 1000
        ? 'Enter a whole number of people from 1 to 1,000.'
        : '',
    tax:
      Number.isNaN(taxAmount) || taxAmount < 0
        ? 'Tax must be 0 or more.'
        : !Number.isNaN(billAmount) && taxAmount > billAmount
          ? 'Tax cannot be more than the bill.'
          : '',
  };
  const valid = !errors.bill && !errors.percent && !errors.people && !errors.tax;

  let result: { tip: number; total: number; tipEach: number; totalEach: number; effectivePercent: number } | null = null;
  if (valid) {
    const tipBase = billAmount - taxAmount;
    const tip = (tipBase * percent) / 100;
    let totalEach = (billAmount + tip) / peopleCount;
    // Round each person's share up to a whole unit; the extra goes to the tip.
    if (roundUp) totalEach = Math.ceil(totalEach - 1e-9);
    const total = totalEach * peopleCount;
    const finalTip = total - billAmount;
    result = {
      tip: finalTip,
      total,
      tipEach: finalTip / peopleCount,
      totalEach,
      effectivePercent: tipBase > 0 ? (finalTip / tipBase) * 100 : 0,
    };
  }

  const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);

  const inputClass = (error: string) =>
    `w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg ${error ? 'border-red-400' : 'border-gray-300'}`;

  const presetValue = PRESETS.find((p) => parse(tipPercent) === p);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="space-y-5">
            <div>
              <label htmlFor="tip-bill" className="block text-sm font-medium text-gray-700 mb-2">
                Bill amount
              </label>
              <input
                id="tip-bill"
                type="number"
                inputMode="decimal"
                value={bill}
                onChange={(e) => setBill(e.target.value)}
                min="0"
                step="0.01"
                aria-invalid={Boolean(errors.bill)}
                aria-describedby={errors.bill ? 'tip-bill-error' : undefined}
                className={inputClass(errors.bill)}
              />
              {errors.bill && <p id="tip-bill-error" className="text-sm text-red-700 mt-1">{errors.bill}</p>}
            </div>

            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-2">Tip percentage</legend>
              <div className="grid grid-cols-5 gap-2 mb-2">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setTipPercent(String(p))}
                    aria-pressed={presetValue === p}
                    className={`py-2.5 rounded-lg border-2 text-sm sm:text-base transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      presetValue === p ? 'border-blue-500 bg-blue-50 text-blue-800 font-semibold' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {p}%
                  </button>
                ))}
              </div>
              <label htmlFor="tip-percent" className="block text-xs text-gray-600 mb-1">
                Custom tip %
              </label>
              <div className="relative">
                <input
                  id="tip-percent"
                  type="number"
                  inputMode="decimal"
                  value={tipPercent}
                  onChange={(e) => setTipPercent(e.target.value)}
                  min="0"
                  max="100"
                  step="0.5"
                  aria-invalid={Boolean(errors.percent)}
                  aria-describedby={errors.percent ? 'tip-percent-error' : undefined}
                  className={`${inputClass(errors.percent)} pr-10`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden="true">%</span>
              </div>
              {errors.percent && <p id="tip-percent-error" className="text-sm text-red-700 mt-1">{errors.percent}</p>}
            </fieldset>

            <div>
              <label htmlFor="tip-people" className="block text-sm font-medium text-gray-700 mb-2">
                Number of people
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label="One person fewer"
                  onClick={() => setPeople(String(Math.max(1, (Number.isInteger(peopleCount) ? peopleCount : 1) - 1)))}
                  className="w-12 flex-none rounded-lg border border-gray-300 text-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  −
                </button>
                <input
                  id="tip-people"
                  type="number"
                  inputMode="numeric"
                  value={people}
                  onChange={(e) => setPeople(e.target.value)}
                  min="1"
                  step="1"
                  aria-invalid={Boolean(errors.people)}
                  aria-describedby={errors.people ? 'tip-people-error' : undefined}
                  className={`${inputClass(errors.people)} text-center min-w-0`}
                />
                <button
                  type="button"
                  aria-label="One more person"
                  onClick={() => setPeople(String(Math.min(1000, (Number.isInteger(peopleCount) ? peopleCount : 0) + 1)))}
                  className="w-12 flex-none rounded-lg border border-gray-300 text-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  +
                </button>
              </div>
              {errors.people && <p id="tip-people-error" className="text-sm text-red-700 mt-1">{errors.people}</p>}
            </div>

            <div>
              <label htmlFor="tip-tax" className="block text-sm font-medium text-gray-700 mb-2">
                Tax included in the bill (optional)
              </label>
              <input
                id="tip-tax"
                type="number"
                inputMode="decimal"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                min="0"
                step="0.01"
                aria-invalid={Boolean(errors.tax)}
                aria-describedby={errors.tax ? 'tip-tax-error' : 'tip-tax-hint'}
                className={inputClass(errors.tax)}
              />
              {errors.tax ? (
                <p id="tip-tax-error" className="text-sm text-red-700 mt-1">{errors.tax}</p>
              ) : (
                <p id="tip-tax-hint" className="text-xs text-gray-500 mt-1">If entered, the tip is calculated on the pre-tax amount.</p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label htmlFor="tip-round" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  id="tip-round"
                  checked={roundUp}
                  onChange={(e) => setRoundUp(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                Round each share up to a whole amount
              </label>
              <label htmlFor="tip-currency" className="flex items-center gap-2 text-sm text-gray-700">
                Currency
                <select
                  id="tip-currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {currencies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4" aria-live="polite">
            {!result ? (
              <p className="p-4 bg-gray-50 rounded-lg text-gray-600">Fix the highlighted fields to see the tip.</p>
            ) : (
              <>
                <div className="bg-green-50 p-5 sm:p-6 rounded-lg">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Per person{peopleCount > 1 ? ` (${peopleCount} people)` : ''}
                  </h2>
                  <dl className="space-y-3">
                    <div className="flex justify-between items-center">
                      <dt className="text-gray-700">Tip each</dt>
                      <dd className="text-lg font-semibold text-green-700" data-testid="tip-each">{money(result.tipEach)}</dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-gray-700 font-medium">Total each</dt>
                      <dd className="text-2xl font-bold text-green-800" data-testid="total-each">{money(result.totalEach)}</dd>
                    </div>
                  </dl>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 sm:p-6 rounded-lg">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Whole bill</h2>
                  <dl className="space-y-3">
                    <div className="flex justify-between items-center">
                      <dt className="text-gray-700">Bill</dt>
                      <dd className="font-semibold text-gray-900">{money(billAmount)}</dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-gray-700">
                        Tip ({Number(result.effectivePercent.toFixed(2))}%{taxAmount > 0 ? ' of pre-tax' : ''})
                      </dt>
                      <dd className="font-semibold text-green-700" data-testid="tip-total">{money(result.tip)}</dd>
                    </div>
                    <div className="flex justify-between items-center border-t border-gray-300 pt-3">
                      <dt className="text-gray-800 font-medium">Total</dt>
                      <dd className="text-2xl font-bold text-blue-700" data-testid="bill-total">{money(result.total)}</dd>
                    </div>
                  </dl>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
