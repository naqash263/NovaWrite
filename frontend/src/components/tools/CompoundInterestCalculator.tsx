import { useMemo, useState } from 'react';

type Compounding = 'annually' | 'semiannually' | 'quarterly' | 'monthly' | 'daily';
type ContributionFrequency = 'monthly' | 'yearly';

const compoundingOptions: Record<Compounding, { n: number; label: string }> = {
  annually: { n: 1, label: 'Annually (1× per year)' },
  semiannually: { n: 2, label: 'Semi-annually (2× per year)' },
  quarterly: { n: 4, label: 'Quarterly (4× per year)' },
  monthly: { n: 12, label: 'Monthly (12× per year)' },
  daily: { n: 365, label: 'Daily (365× per year)' },
};

const currencies = ['USD', 'EUR', 'GBP', 'INR', 'PKR', 'AED', 'CAD', 'AUD'];

const parse = (s: string) => (s.trim() === '' ? NaN : Number(s));

interface Inputs {
  principal: number;
  rate: number;
  n: number;
  contribution: number;
  perYear: number;
  atStart: boolean;
}

/**
 * Balance after `years`, using A = P(1 + r/n)^(nt) for the principal and a future-value-of-annuity
 * formula for contributions, with the per-contribution rate derived from the compounding frequency.
 */
function balanceAt(years: number, { principal, rate, n, contribution, perYear, atStart }: Inputs) {
  const r = rate / 100;
  const principalFv = principal * Math.pow(1 + r / n, n * years);
  const count = Math.floor(perYear * years + 1e-9);
  const i = Math.pow(1 + r / n, n / perYear) - 1;
  let contributionsFv = 0;
  if (contribution > 0 && count > 0) {
    // Contributions made before `years` keep growing for any remaining fraction of a period.
    const growthAfterLast = Math.pow(1 + r / n, n * (years - count / perYear));
    contributionsFv = (i === 0 ? contribution * count : contribution * ((Math.pow(1 + i, count) - 1) / i) * (atStart ? 1 + i : 1)) * growthAfterLast;
  }
  const deposited = principal + contribution * count;
  const balance = principalFv + contributionsFv;
  return { balance, deposited, interest: balance - deposited };
}

export default function CompoundInterestCalculator() {
  const [principal, setPrincipal] = useState('10000');
  const [interestRate, setInterestRate] = useState('5');
  const [timePeriod, setTimePeriod] = useState('10');
  const [compounding, setCompounding] = useState<Compounding>('monthly');
  const [contribution, setContribution] = useState('0');
  const [contributionFrequency, setContributionFrequency] = useState<ContributionFrequency>('monthly');
  const [timing, setTiming] = useState<'end' | 'start'>('end');
  const [currency, setCurrency] = useState('USD');

  const p = parse(principal);
  const rate = parse(interestRate);
  const years = parse(timePeriod);
  const c = contribution.trim() === '' ? 0 : parse(contribution);

  const errors = {
    principal: Number.isNaN(p) ? 'Enter the initial amount (0 is allowed).' : p < 0 ? 'The initial amount cannot be negative.' : p > 1e12 ? 'Enter an amount up to 1,000,000,000,000.' : '',
    rate: Number.isNaN(rate) ? 'Enter the annual interest rate.' : rate < 0 || rate > 100 ? 'Enter a rate between 0 and 100%.' : '',
    years: Number.isNaN(years) ? 'Enter the number of years.' : years <= 0 || years > 100 ? 'Enter a period between 0 and 100 years.' : '',
    contribution: Number.isNaN(c) || c < 0 ? 'Contributions must be 0 or more.' : c > 1e10 ? 'Enter a contribution up to 10,000,000,000.' : '',
  };
  const valid = !errors.principal && !errors.rate && !errors.years && !errors.contribution;

  const n = compoundingOptions[compounding].n;
  const perYear = contributionFrequency === 'monthly' ? 12 : 1;
  const atStart = timing === 'start';

  const results = useMemo(() => {
    if (!valid) return null;
    const inputs: Inputs = { principal: p, rate, n, contribution: c, perYear, atStart };
    const final = balanceAt(years, inputs);
    const rows: { year: number; deposited: number; interest: number; balance: number }[] = [];
    const wholeYears = Math.floor(years);
    for (let y = 1; y <= wholeYears; y++) rows.push({ year: y, ...balanceAt(y, inputs) });
    if (years > wholeYears) rows.push({ year: Number(years.toFixed(2)), ...final });
    const apy = (Math.pow(1 + rate / 100 / n, n) - 1) * 100;
    return { final, rows, apy };
  }, [valid, p, rate, years, c, n, perYear, atStart]);

  const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);

  const field = (
    id: string,
    label: string,
    value: string,
    set: (v: string) => void,
    error: string,
    extra?: { suffix?: string; step?: string },
  ) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => set(e.target.value)}
          min="0"
          step={extra?.step}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full p-3 ${extra?.suffix ? 'pr-10' : ''} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg ${
            error ? 'border-red-400' : 'border-gray-300'
          }`}
        />
        {extra?.suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden="true">{extra.suffix}</span>}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-700 mt-1">
          {error}
        </p>
      )}
    </div>
  );

  const selectClass = 'w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="space-y-5">
            {field('ci-principal', `Initial investment (${currency})`, principal, setPrincipal, errors.principal, { step: '100' })}
            {field('ci-rate', 'Annual interest rate', interestRate, setInterestRate, errors.rate, { suffix: '%', step: '0.1' })}
            {field('ci-years', 'Time period (years)', timePeriod, setTimePeriod, errors.years, { step: '1' })}
            <div>
              <label htmlFor="ci-compounding" className="block text-sm font-medium text-gray-700 mb-2">
                Compounding frequency
              </label>
              <select id="ci-compounding" value={compounding} onChange={(e) => setCompounding(e.target.value as Compounding)} className={selectClass}>
                {(Object.keys(compoundingOptions) as Compounding[]).map((k) => (
                  <option key={k} value={k}>
                    {compoundingOptions[k].label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {field('ci-contribution', `Regular contribution (${currency})`, contribution, setContribution, errors.contribution, { step: '10' })}
              <div>
                <label htmlFor="ci-contribution-frequency" className="block text-sm font-medium text-gray-700 mb-2">
                  Contribution frequency
                </label>
                <select
                  id="ci-contribution-frequency"
                  value={contributionFrequency}
                  onChange={(e) => setContributionFrequency(e.target.value as ContributionFrequency)}
                  className={selectClass}
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="ci-timing" className="block text-sm font-medium text-gray-700 mb-2">
                  Contributions made at
                </label>
                <select id="ci-timing" value={timing} onChange={(e) => setTiming(e.target.value as 'end' | 'start')} className={selectClass}>
                  <option value="end">End of each period</option>
                  <option value="start">Start of each period</option>
                </select>
              </div>
              <div>
                <label htmlFor="ci-currency" className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select id="ci-currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className={selectClass}>
                  {currencies.map((cur) => (
                    <option key={cur} value={cur}>
                      {cur}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4 min-w-0" aria-live="polite">
            {!results ? (
              <p className="p-4 bg-gray-50 rounded-lg text-gray-600">Fix the highlighted fields to see your results.</p>
            ) : (
              <>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 sm:p-6 rounded-lg">
                  <h2 className="text-lg font-semibold text-gray-800 mb-2">Future value</h2>
                  <div className="text-3xl font-bold text-green-700 mb-4 break-words" data-testid="ci-future-value">
                    {money(results.final.balance)}
                  </div>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between gap-2">
                      <dt className="text-gray-700">Initial investment</dt>
                      <dd className="font-medium">{money(p)}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-gray-700">Contributions</dt>
                      <dd className="font-medium" data-testid="ci-contributions">{money(results.final.deposited - p)}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-gray-700">Interest earned</dt>
                      <dd className="font-medium text-green-700" data-testid="ci-interest">{money(results.final.interest)}</dd>
                    </div>
                    <div className="flex justify-between gap-2 pt-2 border-t border-green-200">
                      <dt className="text-gray-700">Effective annual yield (APY)</dt>
                      <dd className="font-medium" data-testid="ci-apy">{results.apy.toFixed(3)}%</dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <h2 className="text-sm font-semibold text-gray-800 mb-3">Growth by year</h2>
                  <div className="max-h-80 overflow-auto">
                    <table className="w-full text-xs sm:text-sm" data-testid="ci-table">
                      <thead className="sticky top-0 bg-gray-50">
                        <tr className="border-b">
                          <th scope="col" className="text-left py-2 px-1 sm:px-2">Year</th>
                          <th scope="col" className="text-right py-2 px-1 sm:px-2">Deposited</th>
                          <th scope="col" className="text-right py-2 px-1 sm:px-2">Interest</th>
                          <th scope="col" className="text-right py-2 px-1 sm:px-2">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.rows.map((row) => (
                          <tr key={row.year} className="border-b last:border-0">
                            <td className="py-1.5 px-1 sm:px-2">{row.year}</td>
                            <td className="text-right py-1.5 px-1 sm:px-2 tabular-nums">{money(row.deposited)}</td>
                            <td className="text-right py-1.5 px-1 sm:px-2 tabular-nums">{money(row.interest)}</td>
                            <td className="text-right py-1.5 px-1 sm:px-2 tabular-nums">{money(row.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Assumes a fixed rate with no taxes, fees or withdrawals. Real investment returns vary.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
