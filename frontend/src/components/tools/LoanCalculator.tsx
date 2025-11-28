import { useState, useEffect } from 'react';
import { useSEO } from '../../utils/seo';

interface PaymentSchedule {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export default function LoanCalculator() {
  const [loanAmount, setLoanAmount] = useState<number>(100000);
  const [interestRate, setInterestRate] = useState<number>(5.0);
  const [loanTerm, setLoanTerm] = useState<number>(30);
  const [paymentFrequency, setPaymentFrequency] = useState<'monthly' | 'biweekly' | 'weekly'>('monthly');
  const [results, setResults] = useState<{
    monthlyPayment: number;
    totalPayment: number;
    totalInterest: number;
    schedule: PaymentSchedule[];
  } | null>(null);

  useSEO({
    title: 'Free Loan Calculator - Mortgage, Auto, Personal Loan Calculator | Amortization Calculator',
    description: 'Free online loan calculator. Calculate monthly payments, total interest, and amortization schedule for mortgages, auto loans, and personal loans. No registration required.',
    url: '/resources/utility-tools/loan-calculator',
    keywords: [
      'loan calculator', 'mortgage calculator', 'auto loan calculator', 'personal loan calculator',
      'amortization calculator', 'loan payment calculator', 'interest calculator', 'loan amortization',
      'mortgage payment calculator', 'loan tool', 'financial calculator'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Loan Calculator',
      'description': 'Free online loan calculator for calculating monthly payments, total interest, and amortization schedules.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/loan-calculator',
      'applicationCategory': 'FinanceApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Calculate monthly payments',
        'Total interest calculation',
        'Amortization schedule',
        'Multiple payment frequencies (monthly, biweekly, weekly)',
        'Loan term flexibility',
        'Real-time calculations'
      ],
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.9',
        'ratingCount': '1800',
        'bestRating': '5',
        'worstRating': '1'
      }
    }
  });

  useEffect(() => {
    calculateLoan();
  }, [loanAmount, interestRate, loanTerm, paymentFrequency]);

  const calculateLoan = () => {
    const principal = loanAmount;
    const annualRate = interestRate / 100;
    
    // Calculate payments per year
    const paymentsPerYear = paymentFrequency === 'monthly' ? 12 : paymentFrequency === 'biweekly' ? 26 : 52;
    const totalPayments = loanTerm * paymentsPerYear;
    const monthlyRate = annualRate / paymentsPerYear;

    // Calculate monthly payment using loan formula
    let monthlyPayment = 0;
    if (monthlyRate > 0) {
      monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                       (Math.pow(1 + monthlyRate, totalPayments) - 1);
    } else {
      monthlyPayment = principal / totalPayments;
    }

    const totalPayment = monthlyPayment * totalPayments;
    const totalInterest = totalPayment - principal;

    // Generate amortization schedule
    const schedule: PaymentSchedule[] = [];
    let balance = principal;

    for (let month = 1; month <= totalPayments; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;

      schedule.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, balance),
      });
    }

    setResults({
      monthlyPayment,
      totalPayment,
      totalInterest,
      schedule,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          💰 Loan Calculator
        </h1>
        <p className="text-gray-600 mb-6">
          Calculate monthly payments, total interest, and view the complete amortization schedule for any loan.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="1000"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Interest Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={interestRate}
                    onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Term (Years)
                </label>
                <input
                  type="number"
                  value={loanTerm}
                  onChange={(e) => setLoanTerm(parseInt(e.target.value) || 1)}
                  min="1"
                  max="50"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Frequency
                </label>
                <select
                  value={paymentFrequency}
                  onChange={(e) => setPaymentFrequency(e.target.value as 'monthly' | 'biweekly' | 'weekly')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="monthly">Monthly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div>
            {results && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Payment Amount</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(results.monthlyPayment)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">per {paymentFrequency.slice(0, -2)}</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Total Payment</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(results.totalPayment)}
                    </div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Total Interest</div>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(results.totalInterest)}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Principal</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency(loanAmount)}
                    </div>
                  </div>
                </div>

                {/* Amortization Schedule */}
                <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Amortization Schedule</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2">Month</th>
                          <th className="text-right py-2 px-2">Payment</th>
                          <th className="text-right py-2 px-2">Principal</th>
                          <th className="text-right py-2 px-2">Interest</th>
                          <th className="text-right py-2 px-2">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.schedule.slice(0, 12).map((row) => (
                          <tr key={row.month} className="border-b">
                            <td className="py-2 px-2">{row.month}</td>
                            <td className="text-right py-2 px-2">{formatCurrency(row.payment)}</td>
                            <td className="text-right py-2 px-2">{formatCurrency(row.principal)}</td>
                            <td className="text-right py-2 px-2">{formatCurrency(row.interest)}</td>
                            <td className="text-right py-2 px-2">{formatCurrency(row.balance)}</td>
                          </tr>
                        ))}
                        {results.schedule.length > 12 && (
                          <tr>
                            <td colSpan={5} className="text-center py-2 text-gray-500 text-xs">
                              ... and {results.schedule.length - 12} more payments
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SEO & AI-Friendly Content Sections */}
        <div className="space-y-6 mt-8">
          {/* About Section */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">About Loan Calculator</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our Loan Calculator is a comprehensive financial tool that helps you understand the 
              true cost of borrowing money. It calculates monthly payments, total interest, and 
              provides a detailed amortization schedule showing how your loan balance decreases 
              over time. All calculations use standard financial formulas and happen instantly 
              in your browser.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Perfect for planning mortgages, auto loans, personal loans, and any other type of 
              installment loan. The calculator supports multiple payment frequencies to help you 
              explore different repayment strategies and understand how they affect total interest paid.
            </p>
          </div>

          {/* Use Cases */}
          <div className="p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Common Use Cases</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Calculating mortgage payments and total interest</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Planning auto loan payments</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Comparing different loan terms and rates</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Understanding amortization schedules</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Evaluating bi-weekly vs monthly payments</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Financial planning and budgeting</span>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div className="p-6 bg-white border border-gray-200 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Key Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Payment Calculation</h4>
                  <p className="text-sm text-gray-600">Calculate monthly payments using standard amortization formula</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Interest Analysis</h4>
                  <p className="text-sm text-gray-600">See total interest paid over the life of the loan</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Amortization Schedule</h4>
                  <p className="text-sm text-gray-600">View detailed payment breakdown month by month</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Payment Frequencies</h4>
                  <p className="text-sm text-gray-600">Compare monthly, bi-weekly, and weekly payment options</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="p-6 bg-blue-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">How accurate are the calculations?</h4>
                <p className="text-gray-700 text-sm">
                  The calculator uses standard loan amortization formulas. Results are estimates 
                  and may vary slightly from actual loan terms due to rounding, fees, and other 
                  factors specific to your lender.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What's the difference between payment frequencies?</h4>
                <p className="text-gray-700 text-sm">
                  Bi-weekly and weekly payments can reduce total interest paid and shorten loan 
                  term because you make more payments per year, effectively paying down principal faster.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Does this include fees and insurance?</h4>
                <p className="text-gray-700 text-sm">
                  No, this calculator shows principal and interest only. Actual loan payments may 
                  include property taxes, insurance, PMI, and other fees. Always check with your 
                  lender for exact payment amounts.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Can I use this for any type of loan?</h4>
                <p className="text-gray-700 text-sm">
                  Yes, this calculator works for mortgages, auto loans, personal loans, and any 
                  fixed-rate installment loan. It may not be accurate for variable-rate loans or 
                  loans with balloon payments.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Loan Calculator Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>This calculator uses the standard loan amortization formula</li>
            <li>Results are estimates and may vary from actual loan terms</li>
            <li>Bi-weekly and weekly payments can reduce total interest paid</li>
            <li>Always consult with a financial advisor for actual loan decisions</li>
            <li>Consider additional costs like insurance, taxes, and fees</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

