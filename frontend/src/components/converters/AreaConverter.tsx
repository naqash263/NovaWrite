import { useState } from 'react';

interface Unit {
  name: string;
  symbol: string;
  toSquareMeters: number;
}

const units: Unit[] = [
  { name: 'Square Meters', symbol: 'm²', toSquareMeters: 1 },
  { name: 'Square Kilometers', symbol: 'km²', toSquareMeters: 1000000 },
  { name: 'Square Centimeters', symbol: 'cm²', toSquareMeters: 0.0001 },
  { name: 'Square Millimeters', symbol: 'mm²', toSquareMeters: 0.000001 },
  { name: 'Square Feet', symbol: 'ft²', toSquareMeters: 0.092903 },
  { name: 'Square Inches', symbol: 'in²', toSquareMeters: 0.00064516 },
  { name: 'Square Yards', symbol: 'yd²', toSquareMeters: 0.836127 },
  { name: 'Acres', symbol: 'ac', toSquareMeters: 4046.86 },
  { name: 'Hectares', symbol: 'ha', toSquareMeters: 10000 },
  { name: 'Square Miles', symbol: 'mi²', toSquareMeters: 2589988.11 },
];

export default function AreaConverter() {
  const [fromValue, setFromValue] = useState<string>('1');
  const [fromUnit, setFromUnit] = useState<string>('m²');
  const [toUnit, setToUnit] = useState<string>('ft²');

  const convert = (value: number, from: string, to: string): number => {
    const fromUnitData = units.find(u => u.symbol === from);
    const toUnitData = units.find(u => u.symbol === to);
    
    if (!fromUnitData || !toUnitData) return 0;
    
    const squareMeters = value * fromUnitData.toSquareMeters;
    return squareMeters / toUnitData.toSquareMeters;
  };

  const result = convert(parseFloat(fromValue) || 0, fromUnit, toUnit);

  const swapUnits = () => {
    const tempUnit = fromUnit;
    setFromUnit(toUnit);
    setToUnit(tempUnit);
    setFromValue(result.toFixed(6));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <input
              type="number"
              value={fromValue}
              onChange={(e) => setFromValue(e.target.value)}
              className="flex-1 min-w-0 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-lg"
              placeholder="Enter value"
              inputMode="decimal"
            />
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <input
              type="text"
              value={isNaN(result) ? '' : result.toFixed(6)}
              readOnly
              className="flex-1 min-w-0 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-base sm:text-lg font-semibold"
            />
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

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={swapUnits}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium touch-manipulation shadow-sm"
        >
          ↕ Swap Units
        </button>
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Conversion:</strong> {fromValue || '0'} {units.find(u => u.symbol === fromUnit)?.name} = {result.toFixed(6)} {units.find(u => u.symbol === toUnit)?.name}
        </p>
      </div>
    </div>
  );
}

