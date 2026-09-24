import UnitConverter, { type ConverterUnit } from './UnitConverter';

const units: ConverterUnit[] = [
  { id: 'c', name: 'Celsius', symbol: '°C', factor: 1 },
  { id: 'f', name: 'Fahrenheit', symbol: '°F', factor: 1 },
  { id: 'k', name: 'Kelvin', symbol: 'K', factor: 1 },
  { id: 'r', name: 'Rankine', symbol: '°R', factor: 1 },
];

const toCelsius: Record<string, (v: number) => number> = {
  c: (v) => v,
  f: (v) => ((v - 32) * 5) / 9,
  k: (v) => v - 273.15,
  r: (v) => ((v - 491.67) * 5) / 9,
};

const fromCelsius: Record<string, (c: number) => number> = {
  c: (c) => c,
  f: (c) => (c * 9) / 5 + 32,
  k: (c) => c + 273.15,
  r: (c) => ((c + 273.15) * 9) / 5,
};

const formulas: Record<string, string> = {
  'c-f': '°F = °C × 9/5 + 32',
  'f-c': '°C = (°F − 32) × 5/9',
  'c-k': 'K = °C + 273.15',
  'k-c': '°C = K − 273.15',
  'f-k': 'K = (°F − 32) × 5/9 + 273.15',
  'k-f': '°F = (K − 273.15) × 9/5 + 32',
  'c-r': '°R = (°C + 273.15) × 9/5',
  'r-c': '°C = (°R − 491.67) × 5/9',
  'f-r': '°R = °F + 459.67',
  'r-f': '°F = °R − 459.67',
  'k-r': '°R = K × 9/5',
  'r-k': 'K = °R × 5/9',
};

const ABSOLUTE_ZERO_C = -273.15;

const referencePoints = [
  { label: 'Absolute zero', c: -273.15 },
  { label: 'Water freezes', c: 0 },
  { label: 'Room temperature', c: 20 },
  { label: 'Body temperature', c: 37 },
  { label: 'Water boils (sea level)', c: 100 },
];

const fmt = (n: number) => String(Math.round(n * 100) / 100);

export default function TemperatureConverter() {
  return (
    <UnitConverter
      quantity="temperature"
      units={units}
      defaultFrom="c"
      defaultTo="f"
      defaultValue="0"
      convert={(value, from, to) => {
        // Round to 12 significant digits to hide float noise such as 211.99999999999997.
        const result = fromCelsius[to.id](toCelsius[from.id](value));
        return Number(result.toPrecision(12));
      }}
      validate={(value, from) =>
        toCelsius[from.id](value) < ABSOLUTE_ZERO_C - 1e-9
          ? `That is below absolute zero (0 K = −273.15 °C = −459.67 °F), the lowest possible temperature.`
          : null
      }
      formula={(from, to) => (from.id === to.id ? 'Same unit: no conversion needed' : formulas[`${from.id}-${to.id}`])}
      presets={[
        { label: '°C → °F', value: '25', from: 'c', to: 'f' },
        { label: '°F → °C', value: '98.6', from: 'f', to: 'c' },
        { label: '°C → K', value: '0', from: 'c', to: 'k' },
        { label: 'Oven 350 °F → °C', value: '350', from: 'f', to: 'c' },
      ]}
      note={
        <div>
          <h2 className="mb-2 text-sm font-semibold text-gray-900">Temperature reference points</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500">
                  <th scope="col" className="py-1 pr-3 font-medium">Point</th>
                  <th scope="col" className="py-1 pr-3 font-medium">°C</th>
                  <th scope="col" className="py-1 pr-3 font-medium">°F</th>
                  <th scope="col" className="py-1 font-medium">K</th>
                </tr>
              </thead>
              <tbody>
                {referencePoints.map((p) => (
                  <tr key={p.label} className="border-t border-gray-200">
                    <th scope="row" className="py-1 pr-3 font-normal">{p.label}</th>
                    <td className="py-1 pr-3 font-mono">{fmt(p.c)}</td>
                    <td className="py-1 pr-3 font-mono">{fmt(fromCelsius.f(p.c))}</td>
                    <td className="py-1 font-mono">{fmt(fromCelsius.k(p.c))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      }
    />
  );
}
