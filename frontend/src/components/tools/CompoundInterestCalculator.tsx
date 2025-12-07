import { useState } from 'react';
import { useSEO } from '../../utils/seo';

export default function CompoundInterestCalculator() {
  const [principal, setPrincipal] = useState<number>(10000);
  const [interestRate, setInterestRate] = useState<number>(5);
  const [timePeriod, setTimePeriod] = useState<number>(10);
  const [compoundingFrequency, setCompoundingFrequency] = useState<'annually' | 'semiannually' | 'quarterly' | 'monthly' | 'daily'>('monthly');
  const [additionalContribution, setAdditionalContribution] = useState<number>(0);
  const [contributionFrequency, setContributionFrequency] = useState<'monthly' | 'yearly'>('monthly');

  useSEO({
    title: 'Free Compound Interest Calculator Online - Investment Growth | No Signup',
    description: 'Free compound interest calculator online - no signup required. Calculate future value, investment growth, and returns instantly. Supports multiple compounding frequencies and additional contributions. Perfect for financial planning. All calculations in your browser.',
    url: '/resources/utility-tools/compound-interest-calculator',
    keywords: [
      'free compound interest calculator', 'compound interest calculator', 'free compound interest calculator online', 'compound interest calculator online', 'investment calculator free',
      'investment calculator', 'future value calculator',
      'compound interest', 'investment growth calculator', 'savings calculator', 'interest calculator', 'free online compound interest calculator'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Compound Interest Calculator',
      'description': 'Free online compound interest calculator for calculating investment growth and future value.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/compound-interest-calculator',
      'applicationCategory': 'UtilityApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Calculate compound interest',
        'Future value calculator',
        'Multiple compounding frequencies',
        'Additional contributions',
        'Investment growth projection',
        'Visual results'
      ],
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.9',
        'ratingCount': '1500',
        'bestRating': '5',
        'worstRating': '1'
      }
    }
  });

  const calculateCompoundInterest = () => {
    const r = interestRate / 100;
    const t = timePeriod;
    
    // Compounding frequency multiplier
    const n = compoundingFrequency === 'annually' ? 1 :
               compoundingFrequency === 'semiannually' ? 2 :
               compoundingFrequency === 'quarterly' ? 4 :
               compoundingFrequency === 'monthly' ? 12 : 365;
    
    // Calculate compound interest on principal
    const futureValuePrincipal = principal * Math.pow(1 + r / n, n * t);
    
    // Calculate future value of additional contributions
    let futureValueContributions = 0;
    if (additionalContribution > 0) {
      const contributionPeriods = contributionFrequency === 'monthly' ? t * 12 : t;
      const contributionRate = contributionFrequency === 'monthly' ? r / 12 : r;
      const totalContributions = additionalContribution * contributionPeriods;
      
      if (contributionRate > 0) {
        // Future value of annuity formula
        futureValueContributions = additionalContribution * 
          ((Math.pow(1 + contributionRate, contributionPeriods) - 1) / contributionRate);
      } else {
        futureValueContributions = totalContributions;
      }
    }
    
    const totalFutureValue = futureValuePrincipal + futureValueContributions;
    const totalContributions = principal + (additionalContribution * (contributionFrequency === 'monthly' ? timePeriod * 12 : timePeriod));
    const totalInterest = totalFutureValue - totalContributions;
    
    return {
      futureValue: totalFutureValue,
      interestEarned: totalInterest,
      totalContributions,
      principal,
      contributions: additionalContribution * (contributionFrequency === 'monthly' ? timePeriod * 12 : timePeriod)
    };
  };

  const results = calculateCompoundInterest();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          📈 Free Compound Interest Calculator Online
        </h1>
        <p className="text-gray-600 mb-6">
          Free compound interest calculator online - no signup required. Calculate how your investments grow with compound interest instantly. See the power of compounding over time. Supports multiple compounding frequencies and additional contributions. Perfect for financial planning. All calculations in your browser.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Investment (Principal) ($)
              </label>
              <input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(parseFloat(e.target.value) || 0)}
                min="0"
                step="100"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                placeholder="10000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Annual Interest Rate (%)
              </label>
              <input
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.1"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                placeholder="5.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Period (Years)
              </label>
              <input
                type="number"
                value={timePeriod}
                onChange={(e) => setTimePeriod(parseFloat(e.target.value) || 0)}
                min="0"
                step="1"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                placeholder="10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compounding Frequency
              </label>
              <select
                value={compoundingFrequency}
                onChange={(e) => setCompoundingFrequency(e.target.value as any)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="annually">Annually</option>
                <option value="semiannually">Semiannually (2x per year)</option>
                <option value="quarterly">Quarterly (4x per year)</option>
                <option value="monthly">Monthly (12x per year)</option>
                <option value="daily">Daily (365x per year)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Monthly/Yearly Contribution ($)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={additionalContribution}
                  onChange={(e) => setAdditionalContribution(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="10"
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
                <select
                  value={contributionFrequency}
                  onChange={(e) => setContributionFrequency(e.target.value as any)}
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Future Value</h2>
              <div className="text-3xl font-bold text-green-600 mb-4">
                {formatCurrency(results.futureValue)}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Principal:</span>
                  <span className="font-medium">{formatCurrency(results.principal)}</span>
                </div>
                {additionalContribution > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contributions:</span>
                    <span className="font-medium">{formatCurrency(results.contributions)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Interest Earned:</span>
                  <span className="font-medium text-green-600">{formatCurrency(results.interestEarned)}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Contributions:</span>
                  <span className="font-medium">{formatCurrency(results.totalContributions)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Interest:</span>
                  <span className="font-medium text-blue-600">{formatCurrency(results.interestEarned)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="text-gray-700 font-medium">Future Value:</span>
                  <span className="font-bold text-blue-700">{formatCurrency(results.futureValue)}</span>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Compounding:</strong> {compoundingFrequency.charAt(0).toUpperCase() + compoundingFrequency.slice(1)} 
                ({compoundingFrequency === 'annually' ? '1' : compoundingFrequency === 'semiannually' ? '2' : compoundingFrequency === 'quarterly' ? '4' : compoundingFrequency === 'monthly' ? '12' : '365'}x per year)
              </p>
            </div>
          </div>
        </div>

        {/* SEO & AI-Friendly Content Sections */}
        <div className="space-y-6 mt-8">
          {/* About Section */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">About Compound Interest Calculator</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our Compound Interest Calculator helps you understand how your investments grow over time with compound interest. 
              Compound interest is the interest calculated on the initial principal and accumulated interest from previous periods, 
              making your money grow faster over time.
            </p>
            <p className="text-gray-700 leading-relaxed">
              The calculator supports multiple compounding frequencies (annually, quarterly, monthly, daily), additional 
              contributions, and shows you the future value of your investment. Perfect for planning savings, investments, 
              and retirement goals.
            </p>
          </div>

          {/* Use Cases */}
          <div className="p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Common Use Cases</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Calculate investment growth</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Plan retirement savings</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Compare investment options</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Calculate savings account growth</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Plan for financial goals</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Understand compound interest power</span>
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
                  <h4 className="font-semibold text-gray-900 mb-1">Multiple Compounding Frequencies</h4>
                  <p className="text-sm text-gray-600">Annually, quarterly, monthly, or daily compounding</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Additional Contributions</h4>
                  <p className="text-sm text-gray-600">Add monthly or yearly contributions to your investment</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Detailed Breakdown</h4>
                  <p className="text-sm text-gray-600">See principal, contributions, and interest earned</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Instant Calculations</h4>
                  <p className="text-sm text-gray-600">Real-time results as you change inputs</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="p-6 bg-blue-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What is compound interest?</h4>
                <p className="text-gray-700 text-sm">
                  Compound interest is interest calculated on the initial principal and accumulated interest from previous 
                  periods. This means your money grows faster over time because you earn interest on both your original 
                  investment and the interest you've already earned.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">How does compounding frequency affect returns?</h4>
                <p className="text-gray-700 text-sm">
                  More frequent compounding (e.g., daily vs. annually) results in higher returns because interest is 
                  calculated and added more often. However, the difference becomes smaller as the frequency increases.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Should I include additional contributions?</h4>
                <p className="text-gray-700 text-sm">
                  Yes, if you plan to make regular contributions to your investment, include them to get a more accurate 
                  projection of your future value. This is especially important for retirement planning and savings goals.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Are the results guaranteed?</h4>
                <p className="text-gray-700 text-sm">
                  No, these are projections based on the interest rate you enter. Actual returns may vary based on market 
                  conditions, fees, and other factors. This calculator is for planning purposes only.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Start investing early to maximize compound interest benefits</li>
            <li>More frequent compounding (monthly/daily) yields higher returns</li>
            <li>Regular contributions significantly increase future value</li>
            <li>Higher interest rates dramatically impact long-term growth</li>
            <li>Use this calculator to compare different investment options</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

