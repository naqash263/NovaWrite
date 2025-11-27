import { useState } from 'react';

type UnitSystem = 'metric' | 'imperial';

export default function BMICalculator() {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [bmi, setBmi] = useState<number | null>(null);
  const [category, setCategory] = useState<string>('');

  const calculateBMI = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);

    if (!w || !h || w <= 0 || h <= 0) {
      setBmi(null);
      setCategory('');
      return;
    }

    let bmiValue: number;

    if (unitSystem === 'metric') {
      // BMI = weight (kg) / height (m)²
      bmiValue = w / (h / 100) ** 2;
    } else {
      // BMI = (weight (lbs) / height (inches)²) × 703
      bmiValue = (w / (h ** 2)) * 703;
    }

    setBmi(bmiValue);

    // Determine category
    if (bmiValue < 18.5) {
      setCategory('Underweight');
    } else if (bmiValue < 25) {
      setCategory('Normal weight');
    } else if (bmiValue < 30) {
      setCategory('Overweight');
    } else {
      setCategory('Obese');
    }
  };

  const getCategoryColor = (cat: string): string => {
    switch (cat) {
      case 'Underweight':
        return 'bg-blue-100 text-blue-800';
      case 'Normal weight':
        return 'bg-green-100 text-green-800';
      case 'Overweight':
        return 'bg-yellow-100 text-yellow-800';
      case 'Obese':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleClear = () => {
    setWeight('');
    setHeight('');
    setBmi(null);
    setCategory('');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Unit System</label>
        <select
          value={unitSystem}
          onChange={(e) => {
            setUnitSystem(e.target.value as UnitSystem);
            setBmi(null);
            setCategory('');
          }}
          className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm sm:text-base touch-manipulation"
        >
          <option value="metric">Metric (kg, cm)</option>
          <option value="imperial">Imperial (lbs, inches)</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Weight ({unitSystem === 'metric' ? 'kg' : 'lbs'})
          </label>
          <input
            type="number"
            value={weight}
            onChange={(e) => {
              setWeight(e.target.value);
              calculateBMI();
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-lg"
            placeholder={`Enter weight in ${unitSystem === 'metric' ? 'kg' : 'lbs'}`}
            step="0.1"
            inputMode="decimal"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Height ({unitSystem === 'metric' ? 'cm' : 'inches'})
          </label>
          <input
            type="number"
            value={height}
            onChange={(e) => {
              setHeight(e.target.value);
              calculateBMI();
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-lg"
            placeholder={`Enter height in ${unitSystem === 'metric' ? 'cm' : 'inches'}`}
            step="0.1"
            inputMode="decimal"
          />
        </div>
      </div>

      {(weight || height) && (
        <div className="flex justify-center">
          <button
            onClick={handleClear}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 active:bg-gray-400 transition-colors font-medium touch-manipulation"
          >
            Clear
          </button>
        </div>
      )}

      {bmi !== null && (
        <div className="bg-blue-50 rounded-lg p-4 sm:p-6">
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600 mb-2">Your BMI</p>
            <p className="text-3xl sm:text-4xl font-bold text-blue-900 mb-3 sm:mb-4">{bmi.toFixed(1)}</p>
            <span className={`inline-block px-3 sm:px-4 py-2 rounded-full font-semibold text-sm sm:text-base ${getCategoryColor(category)}`}>
              {category}
            </span>
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">BMI Categories</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Underweight</span>
            <span className="text-gray-600">&lt; 18.5</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-green-700 font-medium">Normal weight</span>
            <span className="text-gray-600">18.5 - 24.9</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-yellow-700 font-medium">Overweight</span>
            <span className="text-gray-600">25 - 29.9</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-red-700 font-medium">Obese</span>
            <span className="text-gray-600">≥ 30</span>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> BMI is a screening tool and does not directly measure body fat or health. 
          It's important to consult with a healthcare professional for a comprehensive health assessment.
        </p>
      </div>

      {/* SEO & AI-Friendly Content */}
      <div className="mt-8 space-y-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">About BMI (Body Mass Index)</h3>
          <p className="text-gray-700 mb-4">
            Body Mass Index (BMI) is a measure of body fat based on height and weight. It's calculated by dividing weight in kilograms 
            by the square of height in meters (kg/m²). BMI provides a simple numeric measure that helps categorize weight status.
          </p>
          <p className="text-gray-700 mb-4">
            <strong>BMI Categories:</strong> Underweight (&lt;18.5), Normal weight (18.5-24.9), Overweight (25-29.9), Obese (≥30). 
            These categories are general guidelines and may not apply to everyone, especially athletes with high muscle mass or older adults.
          </p>
          <p className="text-gray-700">
            <strong>Limitations:</strong> BMI doesn't distinguish between muscle and fat, so it may not accurately reflect body composition 
            for athletes, pregnant women, or individuals with high muscle mass. Always consult healthcare professionals for personalized health advice.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">How is BMI calculated?</h4>
              <p className="text-sm text-gray-600">
                BMI is calculated using the formula: BMI = weight (kg) / height (m)². For imperial units, 
                the formula is: BMI = (weight (lbs) / height (inches)²) × 703. Our calculator handles both metric and imperial units automatically.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">What is a healthy BMI range?</h4>
              <p className="text-sm text-gray-600">
                A healthy BMI typically falls between 18.5 and 24.9. However, individual factors like age, gender, muscle mass, 
                and overall health should be considered. Consult with a healthcare provider for personalized recommendations.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Is BMI accurate for everyone?</h4>
              <p className="text-sm text-gray-600">
                BMI is a useful screening tool but has limitations. It may not accurately reflect body composition for athletes, 
                pregnant women, older adults, or individuals with high muscle mass. It's best used as part of a comprehensive health assessment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

