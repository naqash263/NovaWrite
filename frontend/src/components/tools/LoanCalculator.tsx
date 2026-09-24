import { useMemo, useState } from 'react';

type Frequency = 'monthly' | 'biweekly' | 'weekly';

interface Row {
  period: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

const frequencies: Record<Frequency, { perYear: number; label: string; per: string }> = {
  monthly: { perYear: 12, label: 'Monthly (12 per year)', per: 'per month' },
  biweekly: { perYear: 26, label: 'Bi-weekly (26 per year)', per: 'every two weeks' },
  weekly: { perYear: 52, label: 'Weekly (52 per year)', per: 'per week' },
};

const currencies = ['USD', 'EUR', 'GBP', 'INR', 'PKR', 'AED', 'CAD', 'AUD'];

const parse = (s: string) => (s.trim() === '' ? NaN : Number(s));

/** Standard amortising-loan payment: P·r / (1 − (1 + r)^−n), or P / n at 0%. */
function periodicPayment(principal: number, ratePerPeriod: number, periods: number) {
  if (ratePerPeriod === 0) return principal / periods;
  return (principal * ratePerPeriod) / (1 - Math.pow(1 + ratePerPeriod, -periods));
}

function amortize(principal: number, ratePerPeriod: number, payment: number, extra: number, maxPeriods: number): Row[] {
  const rows: Row[] = [];
  let balance = principal;
  for (let period = 1; period <= maxPeriods && balance > 0.005; period++) {
    const interest = balance * ratePerPeriod;
    const principalPaid = Math.min(payment + extra - interest, balance);
    balance -= principalPaid;
    if (balance < 0.005) balance = 0;
    rows.push({ period, payment: principalPaid + interest, principal: principalPaid, interest, balance });
  }
  return rows;
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  prefix?: string;
  suffix?: string;
  step?: string;
  hint?: string;
}

function NumberField({ id, label, value, onChange, error, prefix, suffix, step, hint }: FieldProps) {
  const describedBy = [error ? `${id}-error` : '', hint ? `${id}-hint` : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" aria-hidden="true">{prefix}</span>}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min="0"
          step={step}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`w-full ${prefix ? 'pl-12' : 'pl-4'} ${suffix ? 'pr-10' : 'pr-4'} py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            error ? 'border-red-400' : 'border-gray-300'
          }`}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden="true">{suffix}</span>}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-gray-500 mt-1">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-700 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

export default function LoanCalculator() {
  const [loanAmount, setLoanAmount] = useState('100000');
  const [interestRate, setInterestRate] = useState('5');
  const [loanTerm, setLoanTerm] = useState('30');
  const [extraPayment, setExtraPayment] = useState('');
  const [paymentFrequency, setPaymentFrequency] = useState<Frequency>('monthly');
  const [currency, setCurrency] = useState('USD');
  const [view, setView] = useState<'yearly' | 'all'>('yearly');

  const amount = parse(loanAmount);
  const rate = parse(interestRate);
  const years = parse(loanTerm);
  const extra = extraPayment.trim() === '' ? 0 : parse(extraPayment);

  const errors = {
    amount: Number.isNaN(amount)
      ? 'Enter the loan amount.'
      : amount <= 0
        ? 'The loan amount must be greater than 0.'
        : amount > 1e12
          ? 'Enter an amount up to 1,000,000,000,000.'
          : '',
    rate: Number.isNaN(rate) ? 'Enter the annual interest rate.' : rate < 0 || rate > 100 ? 'Enter a rate between 0 and 100%.' : '',
    years: Number.isNaN(years) ? 'Enter the loan term.' : years <= 0 || years > 50 ? 'Enter a term between 0 and 50 years.' : '',
    extra: Number.isNaN(extra) || extra < 0 ? 'Extra payment must be 0 or more.' : '',
  };
  const valid = !errors.amount && !errors.rate && !errors.years && !errors.extra;

  const freq = frequencies[paymentFrequency];

  const results = useMemo(() => {
    if (!valid) return null;
    const periods = Math.max(1, Math.round(years * freq.perYear));
    const r = rate / 100 / freq.perYear;
    const payment = periodicPayment(amount, r, periods);
    const base = amortize(amount, r, payment, 0, periods);
    const schedule = extra > 0 ? amortize(amount, r, payment, extra, periods) : base;
    const totalInterest = schedule.reduce((s, row) => s + row.interest, 0);
    const baseInterest = base.reduce((s, row) => s + row.interest, 0);
    return {
      payment,
      periods,
      schedule,
      totalInterest,
      totalPaid: amount + totalInterest,
      interestSaved: baseInterest - totalInterest,
      periodsSaved: periods - schedule.length,
    };
  }, [valid, amount, rate, years, extra, freq.perYear]);

  const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);

  const yearly = useMemo(() => {
    if (!results) return [];
    const out: { year: number; principal: number; interest: number; balance: number }[] = [];
    results.schedule.forEach((row) => {
      const year = Math.ceil(row.period / freq.perYear);
      const last = out[out.length - 1];
      if (!last || last.year !== year) out.push({ year, principal: row.principal, interest: row.interest, balance: row.balance });
      else {
        last.principal += row.principal;
        last.interest += row.interest;
        last.balance = row.balance;
      }
    });
    return out;
  }, [results, freq.perYear]);

  const describeDuration = (periods: number) => {
    const totalYears = periods / freq.perYear;
    let y = Math.floor(totalYears + 1e-9);
    let rest = Math.round((totalYears - y) * 12);
    if (rest === 12) {
      y += 1;
      rest = 0;
    }
    const parts = [y ? `${y} year${y !== 1 ? 's' : ''}` : '', rest ? `${rest} month${rest !== 1 ? 's' : ''}` : ''].filter(Boolean);
    return parts.join(' ') || 'less than a month';
  };

  const downloadCsv = () => {
    if (!results) return;
    const lines = ['Payment,Payment amount,Principal,Interest,Balance'];
    results.schedule.forEach((r) =>
      lines.push([r.period, r.payment.toFixed(2), r.principal.toFixed(2), r.interest.toFixed(2), r.balance.toFixed(2)].join(',')),
    );
    const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'amortization-schedule.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const symbol = new Intl.NumberFormat('en-US', { style: 'currency', currency }).formatToParts(0).find((p) => p.type === 'currency')?.value ?? '';

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="space-y-5">
            <NumberField id="loan-amount" label="Loan amount" value={loanAmount} onChange={setLoanAmount} error={errors.amount} prefix={symbol} step="1000" />
            <NumberField id="loan-rate" label="Annual interest rate (APR)" value={interestRate} onChange={setInterestRate} error={errors.rate} suffix="%" step="0.1" />
            <NumberField id="loan-term" label="Loan term (years)" value={loanTerm} onChange={setLoanTerm} error={errors.years} step="1" />
            <div>
              <label htmlFor="loan-frequency" className="block text-sm font-medium text-gray-700 mb-2">
                Payment frequency
              </label>
              <select
                id="loan-frequency"
                value={paymentFrequency}
                onChange={(e) => setPaymentFrequency(e.target.value as Frequency)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {(Object.keys(frequencies) as Frequency[]).map((f) => (
                  <option key={f} value={f}>
                    {frequencies[f].label}
                  </option>
                ))}
              </select>
            </div>
            <NumberField
              id="loan-extra"
              label="Extra payment each period (optional)"
              value={extraPayment}
              onChange={setExtraPayment}
              error={errors.extra}
              prefix={symbol}
              step="10"
              hint="Goes straight to principal and shortens the loan."
            />
            <div>
              <label htmlFor="loan-currency" className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                id="loan-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results */}
          <div aria-live="polite">
            {!results ? (
              <p className="p-4 bg-gray-50 rounded-lg text-gray-600" data-testid="loan-empty">
                Enter a valid loan amount, rate and term to see your payment.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg sm:col-span-2">
                    <div className="text-sm text-gray-600 mb-1">Payment</div>
                    <div className="text-3xl font-bold text-blue-700" data-testid="loan-payment">
                      {money(results.payment)}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {freq.per} for {results.periods} payments
                      {extra > 0 ? ` (plus ${money(extra)} extra)` : ''}
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Total paid</div>
                    <div className="text-xl font-bold text-green-700" data-testid="loan-total">
                      {money(results.totalPaid)}
                    </div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Total interest</div>
                    <div className="text-xl font-bold text-red-700" data-testid="loan-interest">
                      {money(results.totalInterest)}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Principal</div>
                    <div className="text-xl font-bold text-purple-700">{money(amount)}</div>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Paid off in</div>
                    <div className="text-xl font-bold text-amber-800" data-testid="loan-duration">
                      {describeDuration(results.schedule.length)}
                    </div>
                  </div>
                </div>
                {extra > 0 && results.interestSaved > 0.005 && (
                  <p className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-900" data-testid="loan-savings">
                    Paying {money(extra)} extra saves {money(results.interestSaved)} in interest
                    {results.periodsSaved > 0 ? ` and finishes ${describeDuration(results.periodsSaved)} early` : ''}.
                  </p>
                )}

                {/* Amortization Schedule */}
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h2 className="text-sm font-semibold text-gray-800">Amortization schedule</h2>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden" role="group" aria-label="Schedule view">
                        {(['yearly', 'all'] as const).map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setView(v)}
                            aria-pressed={view === v}
                            className={`px-3 py-1 text-xs font-medium ${view === v ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                          >
                            {v === 'yearly' ? 'By year' : 'Every payment'}
                          </button>
                        ))}
                      </div>
                      <button type="button" onClick={downloadCsv} className="px-3 py-1 text-xs font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-100">
                        Download CSV
                      </button>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-auto">
                    <table className="w-full text-xs sm:text-sm" data-testid="loan-schedule">
                      <thead className="sticky top-0 bg-gray-50">
                        <tr className="border-b">
                          <th scope="col" className="text-left py-2 px-1 sm:px-2">{view === 'yearly' ? 'Year' : '#'}</th>
                          <th scope="col" className="text-right py-2 px-1 sm:px-2">Principal</th>
                          <th scope="col" className="text-right py-2 px-1 sm:px-2">Interest</th>
                          <th scope="col" className="text-right py-2 px-1 sm:px-2">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(view === 'yearly'
                          ? yearly.map((y) => ({ key: y.year, label: y.year, principal: y.principal, interest: y.interest, balance: y.balance }))
                          : results.schedule.map((r) => ({ key: r.period, label: r.period, principal: r.principal, interest: r.interest, balance: r.balance }))
                        ).map((row) => (
                          <tr key={row.key} className="border-b last:border-0">
                            <td className="py-1.5 px-1 sm:px-2">{row.label}</td>
                            <td className="text-right py-1.5 px-1 sm:px-2 tabular-nums">{money(row.principal)}</td>
                            <td className="text-right py-1.5 px-1 sm:px-2 tabular-nums">{money(row.interest)}</td>
                            <td className="text-right py-1.5 px-1 sm:px-2 tabular-nums">{money(row.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Estimates use the standard amortization formula with a fixed rate. Taxes, insurance and fees are not included.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
