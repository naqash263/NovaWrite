import { useState } from 'react';
import { copyToClipboard } from '../../utils/clipboard';

interface Unit {
  name: string;
  symbol: string;
  toMeters: number; // Conversion factor to meters
}

const units: Unit[] = [
  { name: 'Meters', symbol: 'm', toMeters: 1 },
  { name: 'Kilometers', symbol: 'km', toMeters: 1000 },
  { name: 'Centimeters', symbol: 'cm', toMeters: 0.01 },
  { name: 'Millimeters', symbol: 'mm', toMeters: 0.001 },
  { name: 'Miles', symbol: 'mi', toMeters: 1609.344 },
  { name: 'Yards', symbol: 'yd', toMeters: 0.9144 },
  { name: 'Feet', symbol: 'ft', toMeters: 0.3048 },
  { name: 'Inches', symbol: 'in', toMeters: 0.0254 },
  { name: 'Nautical Miles', symbol: 'nmi', toMeters: 1852 },
];

export default function LengthConverter() {
  const [fromValue, setFromValue] = useState<string>('1');
  const [fromUnit, setFromUnit] = useState<string>('m');
  const [toUnit, setToUnit] = useState<string>('ft');

  const convert = (value: number, from: string, to: string): number => {
    const fromUnitData = units.find(u => u.symbol === from);
    const toUnitData = units.find(u => u.symbol === to);
    
    if (!fromUnitData || !toUnitData) return 0;
    
    // Convert to meters first, then to target unit
    const meters = value * fromUnitData.toMeters;
    return meters / toUnitData.toMeters;
  };

  const result = convert(parseFloat(fromValue) || 0, fromUnit, toUnit);

  const swapUnits = () => {
    const tempUnit = fromUnit;
    setFromUnit(toUnit);
    setToUnit(tempUnit);
    setFromValue(result.toFixed(6));
  };

  const handleClear = () => {
    setFromValue('');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* From */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1 relative min-w-0">
              <input
                type="number"
                value={fromValue}
                onChange={(e) => setFromValue(e.target.value)}
                className="w-full px-4 py-3 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-lg"
                placeholder="Enter value"
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
              onChange={(e) => setFromUnit(e.target.value)}
              className="w-full sm:w-56 px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm sm:text-base touch-manipulation"
            >
              {units.map(unit => (
                <option key={unit.symbol} value={unit.symbol}>
                  {unit.name} ({unit.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1 relative min-w-0">
              <input
                type="text"
                value={isNaN(result) ? '' : result.toFixed(6)}
                readOnly
                className="w-full px-4 py-3 sm:py-3 border border-gray-300 rounded-lg bg-gray-50 text-base sm:text-lg font-semibold"
              />
              {result && !isNaN(result) && (
                <button
                  onClick={() => copyToClipboard(result.toFixed(6))}
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
              onChange={(e) => setToUnit(e.target.value)}
              className="w-full sm:w-56 px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm sm:text-base touch-manipulation"
            >
              {units.map(unit => (
                <option key={unit.symbol} value={unit.symbol}>
                  {unit.name} ({unit.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
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

      {/* Conversion Info */}
      {fromValue && !isNaN(parseFloat(fromValue)) && (
        <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
          <div className="flex items-start justify-between">
            <p className="text-sm text-blue-800 flex-1">
              <strong>Conversion:</strong> {fromValue} {units.find(u => u.symbol === fromUnit)?.name} = {result.toFixed(6)} {units.find(u => u.symbol === toUnit)?.name}
            </p>
            <button
              onClick={() => copyToClipboard(`${fromValue} ${units.find(u => u.symbol === fromUnit)?.name} = ${result.toFixed(6)} ${units.find(u => u.symbol === toUnit)?.name}`)}
              className="ml-2 p-1 text-blue-600 hover:text-blue-800 transition-colors"
              aria-label="Copy conversion"
              title="Copy conversion"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* SEO & AI-Friendly Content */}
      <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
        <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">About Length Conversion</h3>
          <p className="text-gray-700 mb-4">
            Length conversion is essential for various applications including construction, engineering, travel, and everyday measurements. 
            Our length converter supports all major length units including metric (meters, kilometers, centimeters, millimeters) and imperial 
            (miles, yards, feet, inches) systems, as well as nautical miles for maritime applications.
          </p>
          <p className="text-gray-700 mb-4">
            <strong>Common Conversions:</strong> 1 meter = 3.28084 feet, 1 kilometer = 0.621371 miles, 1 inch = 2.54 centimeters, 
            1 mile = 1.60934 kilometers. All conversions use precise conversion factors for maximum accuracy.
          </p>
          <p className="text-gray-700">
            <strong>Use Cases:</strong> Construction measurements, travel distance calculations, scientific research, 
            engineering projects, real estate measurements, and international unit conversions.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Frequently Asked Questions</h3>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">How do I convert meters to feet?</h4>
              <p className="text-sm text-gray-600">
                To convert meters to feet, multiply the number of meters by 3.28084. For example, 5 meters = 16.4042 feet. 
                You can use our converter above by selecting meters as the "From" unit and feet as the "To" unit.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">What is the conversion from kilometers to miles?</h4>
              <p className="text-sm text-gray-600">
                To convert kilometers to miles, multiply by 0.621371. For example, 10 kilometers = 6.21371 miles. 
                This is useful for converting distances in road signs, travel planning, and international measurements.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">How accurate are the conversions?</h4>
              <p className="text-sm text-gray-600">
                All length conversions are accurate to 6 decimal places using standard conversion factors. 
                The conversions follow international standards and are suitable for both everyday use and professional applications.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

