import { useState, useEffect } from 'react';

type CalculationType = 'percentage' | 'increase' | 'decrease' | 'discount';

export default function PercentageCalculator() {
  const [calculationType, setCalculationType] = useState<CalculationType>('percentage');
  const [value1, setValue1] = useState<string>('');
  const [value2, setValue2] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const calculate = () => {
    const num1 = parseFloat(value1) || 0;
    const num2 = parseFloat(value2) || 0;

    if (!value1 || !value2) {
      setResult('');
      return;
    }

    switch (calculationType) {
      case 'percentage':
        if (num2 === 0) {
          setResult('Cannot divide by zero');
          return;
        }
        const percentage = (num1 / num2) * 100;
        setResult(`${num1} is ${percentage.toFixed(2)}% of ${num2}`);
        break;

      case 'increase':
        const increased = num1 + (num1 * num2 / 100);
        setResult(`${num1} increased by ${num2}% = ${increased.toFixed(2)}`);
        break;

      case 'decrease':
        const decreased = num1 - (num1 * num2 / 100);
        setResult(`${num1} decreased by ${num2}% = ${decreased.toFixed(2)}`);
        break;

      case 'discount':
        const discountAmount = num1 * (num2 / 100);
        const finalPrice = num1 - discountAmount;
        setResult(`Original: ${num1}, Discount: ${num2}%, Final Price: ${finalPrice.toFixed(2)}`);
        break;
    }
  };

  useEffect(() => {
    if (value1 && value2) {
      calculate();
    } else {
      setResult('');
    }
  }, [value1, value2, calculationType]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Calculation Type</label>
        <select
          value={calculationType}
          onChange={(e) => {
            setCalculationType(e.target.value as CalculationType);
            setResult('');
          }}
          className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm sm:text-base touch-manipulation"
        >
          <option value="percentage">What percentage is X of Y?</option>
          <option value="increase">Increase X by Y%</option>
          <option value="decrease">Decrease X by Y%</option>
          <option value="discount">Calculate Discount</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {calculationType === 'percentage' ? 'Value (X)' : 
             calculationType === 'discount' ? 'Original Price' : 'Value'}
          </label>
          <input
            type="number"
            value={value1}
            onChange={(e) => setValue1(e.target.value)}
            className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-lg"
            placeholder="Enter value"
            inputMode="decimal"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {calculationType === 'percentage' ? 'Total (Y)' : 'Percentage (%)'}
          </label>
          <input
            type="number"
            value={value2}
            onChange={(e) => setValue2(e.target.value)}
            className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-lg"
            placeholder="Enter value"
            inputMode="decimal"
          />
        </div>
      </div>

      <button
        onClick={calculate}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium text-base sm:text-lg touch-manipulation shadow-sm"
      >
        Calculate
      </button>

      {result && (
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Result:</strong> {result}
          </p>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Calculation Types</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>What percentage is X of Y?</strong> Calculate what percentage one number is of another</li>
          <li>• <strong>Increase X by Y%</strong> Calculate the result after increasing a number by a percentage</li>
          <li>• <strong>Decrease X by Y%</strong> Calculate the result after decreasing a number by a percentage</li>
          <li>• <strong>Calculate Discount</strong> Calculate the final price after applying a discount percentage</li>
        </ul>
      </div>

      {/* SEO & AI-Friendly Content */}
      <div className="mt-8 space-y-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">About Percentage Calculations</h3>
          <p className="text-gray-700 mb-4">
            Percentage calculations are fundamental in mathematics, finance, shopping, statistics, and everyday life. 
            Our percentage calculator handles various calculation types including finding percentages, calculating increases/decreases, 
            and computing discounts.
          </p>
          <p className="text-gray-700 mb-4">
            <strong>Common Uses:</strong> Calculating discounts during sales, determining tax amounts, analyzing growth rates, 
            computing tips, understanding statistics, and solving math problems. Percentages represent parts per hundred, making 
            comparisons and calculations easier.
          </p>
          <p className="text-gray-700">
            <strong>Formulas:</strong> Percentage = (Part / Whole) × 100, Increase = Original × (1 + Percentage/100), 
            Decrease = Original × (1 - Percentage/100), Discount Price = Original × (1 - Discount%/100).
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">How do I calculate what percentage one number is of another?</h4>
              <p className="text-sm text-gray-600">
                Divide the first number by the second number, then multiply by 100. For example, if 25 is what percentage of 100: 
                (25/100) × 100 = 25%. Use our calculator by selecting "What percentage is X of Y?" and entering your values.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">How do I calculate a percentage increase?</h4>
              <p className="text-sm text-gray-600">
                Multiply the original value by (1 + percentage/100). For example, increasing 100 by 20%: 100 × (1 + 20/100) = 120. 
                Our calculator handles this automatically when you select "Increase X by Y%".
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">How do I calculate a discount?</h4>
              <p className="text-sm text-gray-600">
                Multiply the original price by (1 - discount%/100). For example, a $100 item with 15% off: $100 × (1 - 15/100) = $85. 
                Select "Calculate Discount" in our calculator for instant results.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

