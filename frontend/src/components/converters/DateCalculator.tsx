import { useState, useEffect } from 'react';

type CalculationType = 'age' | 'difference' | 'add' | 'subtract';

export default function DateCalculator() {
  const [calculationType, setCalculationType] = useState<CalculationType>('age');
  const [birthDate, setBirthDate] = useState<string>('');
  const [date1, setDate1] = useState<string>('');
  const [date2, setDate2] = useState<string>('');
  const [baseDate, setBaseDate] = useState<string>('');
  const [daysToAdd, setDaysToAdd] = useState<string>('');
  const [result, setResult] = useState<string>('');

  // Auto-calculate when values change
  useEffect(() => {
    switch (calculationType) {
      case 'age':
        if (!birthDate) {
          setResult('');
          return;
        }
        const birth = new Date(birthDate);
        const today = new Date();
        
        let years = today.getFullYear() - birth.getFullYear();
        let months = today.getMonth() - birth.getMonth();
        let days = today.getDate() - birth.getDate();

        if (days < 0) {
          months--;
          const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
          days += lastMonth.getDate();
        }

        if (months < 0) {
          years--;
          months += 12;
        }

        setResult(`${years} years, ${months} months, ${days} days`);
        break;
      case 'difference':
        if (!date1 || !date2) {
          setResult('');
          return;
        }
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const diffYears = Math.floor(diffDays / 365);
        const diffMonths = Math.floor((diffDays % 365) / 30);
        const diffDaysRemainder = diffDays % 30;

        setResult(`${diffDays} days (${diffYears} years, ${diffMonths} months, ${diffDaysRemainder} days)`);
        break;
      case 'add':
        if (!baseDate || !daysToAdd) {
          setResult('');
          return;
        }
        const addDate = new Date(baseDate);
        addDate.setDate(addDate.getDate() + parseInt(daysToAdd));
        setResult(addDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
        break;
      case 'subtract':
        if (!baseDate || !daysToAdd) {
          setResult('');
          return;
        }
        const subDate = new Date(baseDate);
        subDate.setDate(subDate.getDate() - parseInt(daysToAdd));
        setResult(subDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
        break;
    }
  }, [birthDate, date1, date2, baseDate, daysToAdd, calculationType]);

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
          <option value="age">Age Calculator</option>
          <option value="difference">Date Difference</option>
          <option value="add">Add Days to Date</option>
          <option value="subtract">Subtract Days from Date</option>
        </select>
      </div>

      {calculationType === 'age' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Birth Date</label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          />
        </div>
      )}

      {calculationType === 'difference' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Date</label>
            <input
              type="date"
              value={date1}
              onChange={(e) => setDate1(e.target.value)}
              className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Second Date</label>
            <input
              type="date"
              value={date2}
              onChange={(e) => setDate2(e.target.value)}
              className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>
        </div>
      )}

      {(calculationType === 'add' || calculationType === 'subtract') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Base Date</label>
            <input
              type="date"
              value={baseDate}
              onChange={(e) => setBaseDate(e.target.value)}
              className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Days</label>
            <input
              type="number"
              value={daysToAdd}
              onChange={(e) => setDaysToAdd(e.target.value)}
              className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-lg"
              placeholder="Enter number of days"
              inputMode="numeric"
            />
          </div>
        </div>
      )}

      {result && (
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Result:</strong> {result}
          </p>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Quick Reference</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Age Calculator:</strong> Calculate your age from your birth date</li>
          <li>• <strong>Date Difference:</strong> Find the number of days between two dates</li>
          <li>• <strong>Add Days:</strong> Calculate what date it will be after adding days</li>
          <li>• <strong>Subtract Days:</strong> Calculate what date it was before subtracting days</li>
        </ul>
      </div>
    </div>
  );
}

