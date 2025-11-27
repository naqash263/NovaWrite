import { useState } from 'react';

interface Unit {
  name: string;
  symbol: string;
  toLiters: number;
}

const units: Unit[] = [
  { name: 'Liters', symbol: 'L', toLiters: 1 },
  { name: 'Milliliters', symbol: 'mL', toLiters: 0.001 },
  { name: 'Cubic Meters', symbol: 'm³', toLiters: 1000 },
  { name: 'Cubic Centimeters', symbol: 'cm³', toLiters: 0.001 },
  { name: 'US Gallons', symbol: 'US gal', toLiters: 3.78541 },
  { name: 'UK Gallons', symbol: 'UK gal', toLiters: 4.54609 },
  { name: 'US Fluid Ounces', symbol: 'US fl oz', toLiters: 0.0295735 },
  { name: 'UK Fluid Ounces', symbol: 'UK fl oz', toLiters: 0.0284131 },
  { name: 'Cups (US)', symbol: 'cup', toLiters: 0.236588 },
  { name: 'Pints (US)', symbol: 'pt', toLiters: 0.473176 },
  { name: 'Quarts (US)', symbol: 'qt', toLiters: 0.946353 },
  { name: 'Tablespoons (US)', symbol: 'tbsp', toLiters: 0.0147868 },
  { name: 'Teaspoons (US)', symbol: 'tsp', toLiters: 0.00492892 },
];

export default function VolumeConverter() {
  const [fromValue, setFromValue] = useState<string>('1');
  const [fromUnit, setFromUnit] = useState<string>('L');
  const [toUnit, setToUnit] = useState<string>('US gal');

  const convert = (value: number, from: string, to: string): number => {
    const fromUnitData = units.find(u => u.symbol === from);
    const toUnitData = units.find(u => u.symbol === to);
    
    if (!fromUnitData || !toUnitData) return 0;
    
    const liters = value * fromUnitData.toLiters;
    return liters / toUnitData.toLiters;
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

