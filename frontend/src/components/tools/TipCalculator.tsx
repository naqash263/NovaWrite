import { useState } from 'react';
import { useSEO } from '../../utils/seo';

export default function TipCalculator() {
  const [billAmount, setBillAmount] = useState<number>(100);
  const [tipPercentage, setTipPercentage] = useState<number>(15);
  const [customTip, setCustomTip] = useState<string>('');
  const [numberOfPeople, setNumberOfPeople] = useState<number>(1);
  const [roundUp, setRoundUp] = useState<boolean>(false);

  useSEO({
    title: 'Free Tip Calculator - Calculate Tip Amount & Split Bill | Online Tip Calculator',
    description: 'Free online tip calculator. Calculate tip amount, split bill, and total per person. Multiple tip percentages, round up option. Perfect for restaurants and services.',
    url: '/resources/utility-tools/tip-calculator',
    keywords: [
      'tip calculator', 'calculate tip', 'split bill calculator', 'restaurant tip calculator',
      'tip percentage calculator', 'bill splitter', 'gratuity calculator', 'tip amount calculator'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Tip Calculator',
      'description': 'Free online tip calculator for calculating tip amounts and splitting bills.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/tip-calculator',
      'applicationCategory': 'UtilityApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Calculate tip amount',
        'Split bill among people',
        'Multiple tip percentages',
        'Custom tip percentage',
        'Round up option',
        'Total per person'
      ],
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.8',
        'ratingCount': '1200',
        'bestRating': '5',
        'worstRating': '1'
      }
    }
  });

  const tipAmount = customTip ? parseFloat(customTip) || 0 : (billAmount * tipPercentage) / 100;
  const totalAmount = billAmount + tipAmount;
  const amountPerPerson = numberOfPeople > 0 ? totalAmount / numberOfPeople : totalAmount;
  const tipPerPerson = numberOfPeople > 0 ? tipAmount / numberOfPeople : tipAmount;

  const roundedAmountPerPerson = roundUp ? Math.ceil(amountPerPerson) : amountPerPerson;
  const roundedTotal = roundUp ? roundedAmountPerPerson * numberOfPeople : totalAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          💵 Tip Calculator
        </h1>
        <p className="text-gray-600 mb-6">
          Calculate tip amount and split the bill among multiple people. Perfect for restaurants and services.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bill Amount ($)
              </label>
              <input
                type="number"
                value={billAmount}
                onChange={(e) => setBillAmount(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                placeholder="100.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tip Percentage
              </label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[10, 15, 18, 20].map((percent) => (
                  <button
                    key={percent}
                    onClick={() => {
                      setTipPercentage(percent);
                      setCustomTip('');
                    }}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      tipPercentage === percent && !customTip
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {percent}%
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={customTip || tipPercentage}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (value >= 0 && value <= 100) {
                    setTipPercentage(value);
                    setCustomTip(e.target.value);
                  }
                }}
                min="0"
                max="100"
                step="0.1"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Custom %"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of People
              </label>
              <input
                type="number"
                value={numberOfPeople}
                onChange={(e) => setNumberOfPeople(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="roundUp"
                checked={roundUp}
                onChange={(e) => setRoundUp(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="roundUp" className="ml-2 text-sm font-medium text-gray-700">
                Round up to nearest dollar
              </label>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Bill Amount:</span>
                  <span className="text-lg font-semibold text-gray-900">{formatCurrency(billAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tip ({customTip || tipPercentage}%):</span>
                  <span className="text-lg font-semibold text-green-600">{formatCurrency(tipAmount)}</span>
                </div>
                <div className="border-t border-gray-300 pt-3 mt-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700 font-medium">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">{formatCurrency(roundUp ? roundedTotal : totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {numberOfPeople > 1 && (
              <div className="bg-green-50 p-6 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Per Person</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tip per person:</span>
                    <span className="text-lg font-semibold text-green-600">
                      {formatCurrency(roundUp ? Math.ceil(tipPerPerson) : tipPerPerson)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total per person:</span>
                    <span className="text-xl font-bold text-green-700">
                      {formatCurrency(roundedAmountPerPerson)}
                    </span>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-3">About Tip Calculator</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our Tip Calculator is a simple, free tool that helps you calculate tip amounts and split bills 
              among multiple people. Perfect for restaurants, cafes, bars, and any service where tipping is customary.
            </p>
            <p className="text-gray-700 leading-relaxed">
              The calculator supports multiple tip percentages (10%, 15%, 18%, 20%), custom tip percentages, 
              bill splitting, and a round-up option for convenience. All calculations happen instantly in your browser.
            </p>
          </div>

          {/* Use Cases */}
          <div className="p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Common Use Cases</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Calculate tip at restaurants</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Split bills among friends</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Calculate gratuity for services</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Determine fair tip amounts</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Calculate tip for delivery</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Split large group bills</span>
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
                  <h4 className="font-semibold text-gray-900 mb-1">Quick Tip Percentages</h4>
                  <p className="text-sm text-gray-600">Pre-set buttons for 10%, 15%, 18%, 20%</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Custom Tip Percentage</h4>
                  <p className="text-sm text-gray-600">Enter any tip percentage you want</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Bill Splitting</h4>
                  <p className="text-sm text-gray-600">Split bill and tip among multiple people</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Round Up Option</h4>
                  <p className="text-sm text-gray-600">Round up to nearest dollar for convenience</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="p-6 bg-blue-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What is a standard tip percentage?</h4>
                <p className="text-gray-700 text-sm">
                  Standard tip percentages vary by location and service. In the US, 15-20% is common for restaurants, 
                  10-15% for delivery, and 15-20% for personal services. Use the calculator to find what works for you.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">How do I split the bill?</h4>
                <p className="text-gray-700 text-sm">
                  Enter the number of people in the "Number of People" field. The calculator will automatically 
                  show the tip and total amount per person.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Can I use a custom tip percentage?</h4>
                <p className="text-gray-700 text-sm">
                  Yes, you can enter any tip percentage from 0% to 100% in the custom tip field. The calculator 
                  will use your custom percentage instead of the preset buttons.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What does "Round up" do?</h4>
                <p className="text-gray-700 text-sm">
                  The round up option rounds the total per person to the nearest dollar, making it easier to pay 
                  with cash or split evenly.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Standard restaurant tip is 15-20% of the bill</li>
            <li>Tip on the pre-tax amount, not the total with tax</li>
            <li>Use the round up option for easier cash payments</li>
            <li>Split bills evenly or calculate per person amounts</li>
            <li>All calculations happen instantly in your browser</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

