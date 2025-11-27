import { useState } from 'react';

type NumberSystem = 'decimal' | 'binary' | 'hexadecimal' | 'octal';

export default function NumberSystemConverter() {
  const [fromSystem, setFromSystem] = useState<NumberSystem>('decimal');
  const [toSystem, setToSystem] = useState<NumberSystem>('binary');
  const [fromValue, setFromValue] = useState<string>('10');
  const [result, setResult] = useState<string>('');

  const convert = (value: string, from: NumberSystem, to: NumberSystem): string => {
    if (!value) return '';

    try {
      let decimal: number;

      // Convert to decimal first
      switch (from) {
        case 'decimal':
          decimal = parseInt(value, 10);
          break;
        case 'binary':
          decimal = parseInt(value, 2);
          break;
        case 'hexadecimal':
          decimal = parseInt(value, 16);
          break;
        case 'octal':
          decimal = parseInt(value, 8);
          break;
        default:
          return '';
      }

      if (isNaN(decimal)) {
        return 'Invalid input';
      }

      // Convert from decimal to target system
      switch (to) {
        case 'decimal':
          return decimal.toString(10);
        case 'binary':
          return decimal.toString(2);
        case 'hexadecimal':
          return decimal.toString(16).toUpperCase();
        case 'octal':
          return decimal.toString(8);
        default:
          return '';
      }
    } catch (error) {
      return 'Invalid input';
    }
  };

  const handleInputChange = (value: string) => {
    setFromValue(value);
    const converted = convert(value, fromSystem, toSystem);
    setResult(converted);
  };

  const swapSystems = () => {
    const tempSystem = fromSystem;
    setFromSystem(toSystem);
    setToSystem(tempSystem);
    const converted = convert(fromValue, toSystem, tempSystem);
    setResult(converted);
  };

  const getPlaceholder = (system: NumberSystem): string => {
    switch (system) {
      case 'decimal':
        return 'Enter decimal number (0-9)';
      case 'binary':
        return 'Enter binary number (0-1)';
      case 'hexadecimal':
        return 'Enter hex number (0-9, A-F)';
      case 'octal':
        return 'Enter octal number (0-7)';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
          <select
            value={fromSystem}
            onChange={(e) => {
              setFromSystem(e.target.value as NumberSystem);
              handleInputChange(fromValue);
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white mb-3"
          >
            <option value="decimal">Decimal (Base 10)</option>
            <option value="binary">Binary (Base 2)</option>
            <option value="hexadecimal">Hexadecimal (Base 16)</option>
            <option value="octal">Octal (Base 8)</option>
          </select>
          <input
            type="text"
            value={fromValue}
            onChange={(e) => handleInputChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-mono"
            placeholder={getPlaceholder(fromSystem)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
          <select
            value={toSystem}
            onChange={(e) => {
              setToSystem(e.target.value as NumberSystem);
              handleInputChange(fromValue);
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white mb-3"
          >
            <option value="decimal">Decimal (Base 10)</option>
            <option value="binary">Binary (Base 2)</option>
            <option value="hexadecimal">Hexadecimal (Base 16)</option>
            <option value="octal">Octal (Base 8)</option>
          </select>
          <input
            type="text"
            value={result}
            readOnly
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-lg font-mono font-semibold"
          />
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={swapSystems}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          ↕ Swap Systems
        </button>
      </div>

      {result && result !== 'Invalid input' && (
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Conversion:</strong> {fromValue}<sub>{fromSystem === 'decimal' ? '10' : fromSystem === 'binary' ? '2' : fromSystem === 'hexadecimal' ? '16' : '8'}</sub> = {result}<sub>{toSystem === 'decimal' ? '10' : toSystem === 'binary' ? '2' : toSystem === 'hexadecimal' ? '16' : '8'}</sub>
          </p>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Number System Reference</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <p className="font-medium mb-1">Decimal (Base 10)</p>
            <p>Uses digits 0-9. Standard number system.</p>
          </div>
          <div>
            <p className="font-medium mb-1">Binary (Base 2)</p>
            <p>Uses digits 0-1. Used in computing.</p>
          </div>
          <div>
            <p className="font-medium mb-1">Hexadecimal (Base 16)</p>
            <p>Uses digits 0-9 and A-F. Common in programming.</p>
          </div>
          <div>
            <p className="font-medium mb-1">Octal (Base 8)</p>
            <p>Uses digits 0-7. Less common but useful.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

