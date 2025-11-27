import { useState } from 'react';

type TemperatureUnit = 'C' | 'F' | 'K';

interface Unit {
  name: string;
  symbol: TemperatureUnit;
}

const units: Unit[] = [
  { name: 'Celsius', symbol: 'C' },
  { name: 'Fahrenheit', symbol: 'F' },
  { name: 'Kelvin', symbol: 'K' },
];

export default function TemperatureConverter() {
  const [fromValue, setFromValue] = useState<string>('0');
  const [fromUnit, setFromUnit] = useState<TemperatureUnit>('C');
  const [toUnit, setToUnit] = useState<TemperatureUnit>('F');

  const convert = (value: number, from: TemperatureUnit, to: TemperatureUnit): number => {
    // Convert to Celsius first
    let celsius = 0;
    
    if (from === 'C') {
      celsius = value;
    } else if (from === 'F') {
      celsius = (value - 32) * 5 / 9;
    } else if (from === 'K') {
      celsius = value - 273.15;
    }
    
    // Convert from Celsius to target
    if (to === 'C') {
      return celsius;
    } else if (to === 'F') {
      return (celsius * 9 / 5) + 32;
    } else if (to === 'K') {
      return celsius + 273.15;
    }
    
    return 0;
  };

  const result = convert(parseFloat(fromValue) || 0, fromUnit, toUnit);

  const swapUnits = () => {
    const tempUnit = fromUnit;
    setFromUnit(toUnit);
    setToUnit(tempUnit);
    setFromValue(result.toFixed(2));
  };

  const handleClear = () => {
    setFromValue('');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1 relative min-w-0">
              <input
                type="number"
                value={fromValue}
                onChange={(e) => setFromValue(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-lg"
                placeholder="Enter temperature"
                inputMode="decimal"
              />
              {fromValue && (
                <button
                  onClick={handleClear}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  aria-label="Clear"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value as TemperatureUnit)}
              className="w-full sm:w-48 px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm sm:text-base touch-manipulation"
            >
              {units.map(unit => (
                <option key={unit.symbol} value={unit.symbol}>
                  {unit.name} (°{unit.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1 relative min-w-0">
              <input
                type="text"
                value={isNaN(result) ? '' : result.toFixed(2)}
                readOnly
                className="w-full px-4 pr-10 py-3 border border-gray-300 rounded-lg bg-gray-50 text-base sm:text-lg font-semibold"
              />
              {result && !isNaN(result) && (
                <button
                  onClick={() => navigator.clipboard.writeText(result.toFixed(2))}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  aria-label="Copy to clipboard"
                  title="Copy result"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              )}
            </div>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value as TemperatureUnit)}
              className="w-full sm:w-48 px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm sm:text-base touch-manipulation"
            >
              {units.map(unit => (
                <option key={unit.symbol} value={unit.symbol}>
                  {unit.name} (°{unit.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={swapUnits}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium touch-manipulation shadow-sm"
        >
          ↕ Swap Units
        </button>
        {fromValue && (
          <button
            onClick={handleClear}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 active:bg-gray-400 transition-colors font-medium touch-manipulation"
          >
            Clear
          </button>
        )}
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Conversion:</strong> {fromValue || '0'}°{fromUnit} = {result.toFixed(2)}°{toUnit}
        </p>
      </div>

      {/* Reference Points */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Temperature Reference Points</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-700">Water Freezes</p>
            <p className="text-gray-600">0°C = 32°F = 273.15K</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Room Temperature</p>
            <p className="text-gray-600">20°C = 68°F = 293.15K</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Water Boils</p>
            <p className="text-gray-600">100°C = 212°F = 373.15K</p>
          </div>
        </div>
      </div>

      {/* SEO & AI-Friendly Content */}
      <div className="mt-8 space-y-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">About Temperature Conversion</h3>
          <p className="text-gray-700 mb-4">
            Temperature conversion is essential for cooking, weather reporting, scientific research, and international communication. 
            Our converter supports Celsius (°C), Fahrenheit (°F), and Kelvin (K) - the three most commonly used temperature scales.
          </p>
          <p className="text-gray-700 mb-4">
            <strong>Temperature Scales:</strong> Celsius is used in most countries for weather and daily life. 
            Fahrenheit is primarily used in the United States. Kelvin is the scientific standard used in physics and chemistry, 
            where 0K represents absolute zero (-273.15°C).
          </p>
          <p className="text-gray-700">
            <strong>Conversion Formulas:</strong> °F = (°C × 9/5) + 32, °C = (°F - 32) × 5/9, K = °C + 273.15. 
            Our converter handles all conversions automatically with precision.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">How do I convert Celsius to Fahrenheit?</h4>
              <p className="text-sm text-gray-600">
                To convert Celsius to Fahrenheit, multiply by 9/5 and add 32. For example, 25°C = (25 × 9/5) + 32 = 77°F. 
                You can use our converter above for instant results.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">What is the difference between Celsius and Fahrenheit?</h4>
              <p className="text-sm text-gray-600">
                Celsius sets water's freezing point at 0° and boiling point at 100°, while Fahrenheit sets them at 32° and 212° respectively. 
                One degree Celsius equals 1.8 degrees Fahrenheit. Celsius is more intuitive for scientific use, while Fahrenheit provides finer granularity for weather.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">When should I use Kelvin?</h4>
              <p className="text-sm text-gray-600">
                Kelvin is used in scientific applications, especially in physics and chemistry. It's an absolute scale starting at absolute zero, 
                making it ideal for calculations involving temperature differences and thermodynamic equations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

