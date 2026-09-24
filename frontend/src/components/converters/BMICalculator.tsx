import { useId, useState } from 'react';
import { CopyButton, parseNumberInput } from './UnitConverter';

type UnitSystem = 'metric' | 'imperial';

const LB = 0.45359237; // kg, exact
const IN = 0.0254; // m, exact

// WHO adult BMI classification (kg/m²).
const categories = [
  { max: 18.5, label: 'Underweight', range: 'Below 18.5', tone: 'bg-sky-100 text-sky-900' },
  { max: 25, label: 'Healthy weight', range: '18.5 – 24.9', tone: 'bg-emerald-100 text-emerald-900' },
  { max: 30, label: 'Overweight', range: '25.0 – 29.9', tone: 'bg-amber-100 text-amber-900' },
  { max: 35, label: 'Obesity class I', range: '30.0 – 34.9', tone: 'bg-orange-100 text-orange-900' },
  { max: 40, label: 'Obesity class II', range: '35.0 – 39.9', tone: 'bg-red-100 text-red-900' },
  { max: Infinity, label: 'Obesity class III', range: '40.0 and above', tone: 'bg-red-200 text-red-950' },
];

/** Category for a BMI rounded to one decimal, so the label always matches the number shown. */
const categoryFor = (bmi: number) => categories.find((c) => Math.round(bmi * 10) / 10 < c.max)!;

const inputClass =
  'w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-3 text-base focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function BMICalculator() {
  const id = useId();
  const [system, setSystem] = useState<UnitSystem>('metric');
  const [kg, setKg] = useState('');
  const [cm, setCm] = useState('');
  const [lb, setLb] = useState('');
  const [ft, setFt] = useState('');
  const [inches, setInches] = useState('');

  let error: string | null = null;
  let heightM: number | null = null;
  let weightKg: number | null = null;

  const nums = system === 'metric' ? [kg, cm] : [lb, ft, inches];
  const parsed = nums.map(parseNumberInput);
  const filled = system === 'metric' ? parsed.every((v) => v !== null) : parsed[0] !== null && (parsed[1] !== null || parsed[2] !== null);

  if (!filled) error = null;
  else if (parsed.some((v) => v !== null && (Number.isNaN(v) || v < 0))) error = 'Enter positive numbers only.';
  else if (system === 'metric') {
    weightKg = parsed[0]!;
    heightM = parsed[1]! / 100;
  } else {
    weightKg = parsed[0]! * LB;
    heightM = ((parsed[1] ?? 0) * 12 + (parsed[2] ?? 0)) * IN;
  }

  if (!error && heightM !== null && weightKg !== null) {
    if (heightM < 0.5 || heightM > 2.8) error = system === 'metric' ? 'Enter a height between 50 and 280 cm.' : 'Enter a height between 1 ft 8 in and 9 ft 2 in.';
    else if (weightKg < 2 || weightKg > 650) error = system === 'metric' ? 'Enter a weight between 2 and 650 kg.' : 'Enter a weight between 5 and 1,430 lb.';
  }

  const bmi = !error && heightM && weightKg ? weightKg / heightM ** 2 : null;
  const category = bmi !== null ? categoryFor(bmi) : null;
  const healthy = heightM && !error ? { min: 18.5 * heightM ** 2, max: 24.9 * heightM ** 2 } : null;
  const fmtWeight = (kgValue: number) => (system === 'metric' ? `${kgValue.toFixed(1)} kg` : `${(kgValue / LB).toFixed(1)} lb`);
  const markerPct = bmi !== null ? Math.min(100, Math.max(0, ((bmi - 15) / (40 - 15)) * 100)) : 0;

  const clear = () => {
    setKg('');
    setCm('');
    setLb('');
    setFt('');
    setInches('');
  };

  const numberInput = (key: string, label: string, value: string, set: (v: string) => void, placeholder: string) => (
    <div className="min-w-0">
      <label htmlFor={`${id}-${key}`} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={`${id}-${key}`}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(e) => set(e.target.value)}
        className={`${inputClass} text-lg`}
        placeholder={placeholder}
      />
    </div>
  );

  const tab = (value: UnitSystem, label: string) => (
    <button
      type="button"
      aria-pressed={system === value}
      onClick={() => setSystem(value)}
      className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 sm:flex-none ${
        system === value ? 'bg-blue-600 text-white' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex gap-2" role="group" aria-label="Units">
        {tab('metric', 'Metric (kg, cm)')}
        {tab('imperial', 'US / Imperial (lb, ft, in)')}
      </div>

      {system === 'metric' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {numberInput('kg', 'Weight (kg)', kg, setKg, 'e.g. 70')}
          {numberInput('cm', 'Height (cm)', cm, setCm, 'e.g. 175')}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {numberInput('lb', 'Weight (lb)', lb, setLb, 'e.g. 160')}
          {numberInput('ft', 'Height (ft)', ft, setFt, 'e.g. 5')}
          {numberInput('in', 'Height (in)', inches, setInches, 'e.g. 9')}
        </div>
      )}

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 sm:p-5" aria-live="polite">
        {error && (
          <p className="text-sm font-medium text-red-700" data-testid="bmi-error">
            {error}
          </p>
        )}
        {!error && bmi === null && <p className="text-sm text-gray-700">Enter your weight and height to see your BMI.</p>}
        {bmi !== null && category && healthy && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-blue-700">Your BMI</p>
                <p className="text-4xl font-bold text-blue-950" data-testid="bmi-value">
                  {bmi.toFixed(1)}
                </p>
              </div>
              <span className={`rounded-full px-4 py-2 text-sm font-semibold ${category.tone}`} data-testid="bmi-category">
                {category.label}
              </span>
            </div>
            <div aria-hidden="true">
              <div className="relative h-2.5 rounded-full bg-gradient-to-r from-sky-300 via-emerald-400 via-40% to-red-400">
                <span className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-blue-950 shadow" style={{ left: `${markerPct}%` }} />
              </div>
              <div className="mt-1 flex justify-between text-xs text-blue-800">
                <span>15</span>
                <span>18.5</span>
                <span>25</span>
                <span>30</span>
                <span>40</span>
              </div>
            </div>
            <p className="text-sm text-blue-900" data-testid="bmi-healthy">
              Healthy weight for your height (BMI 18.5–24.9): {fmtWeight(healthy.min)} – {fmtWeight(healthy.max)}
            </p>
            <p className="text-sm text-blue-900">BMI Prime: {(bmi / 25).toFixed(2)} (1.00 is the top of the healthy range)</p>
            <div className="flex flex-wrap gap-2">
              <CopyButton text={`BMI ${bmi.toFixed(1)} (${category.label})`} label="Copy result" />
              <button
                type="button"
                onClick={clear}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <caption className="px-4 pt-3 text-left text-sm font-semibold text-gray-900">Adult BMI categories (WHO)</caption>
          <tbody>
            {categories.map((c) => (
              <tr key={c.label} className={`border-t border-gray-100 ${category?.label === c.label ? 'bg-blue-50 font-semibold' : ''}`}>
                <th scope="row" className="px-4 py-2 font-normal">
                  {c.label}
                </th>
                <td className="px-4 py-2 text-right font-mono">{c.range}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        BMI is a screening measure for adults aged 20 and over. It does not measure body fat directly and is not suitable for children, teenagers
        (who use age- and sex-specific percentiles) or during pregnancy. Talk to a healthcare professional about your individual health.
      </p>
    </div>
  );
}
