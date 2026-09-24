import UnitConverter, { formatNumber, type ConverterUnit } from './UnitConverter';

// Exact factors to kilograms (1 lb = 0.45359237 kg by definition).
const units: ConverterUnit[] = [
  { id: 'kg', name: 'Kilograms', symbol: 'kg', factor: 1, group: 'Metric' },
  { id: 'g', name: 'Grams', symbol: 'g', factor: 0.001, group: 'Metric' },
  { id: 'mg', name: 'Milligrams', symbol: 'mg', factor: 1e-6, group: 'Metric' },
  { id: 'ug', name: 'Micrograms', symbol: 'µg', factor: 1e-9, group: 'Metric' },
  { id: 't', name: 'Metric tons (tonnes)', symbol: 't', factor: 1000, group: 'Metric' },
  { id: 'lb', name: 'Pounds', symbol: 'lb', factor: 0.45359237, group: 'Imperial / US' },
  { id: 'oz', name: 'Ounces', symbol: 'oz', factor: 0.028349523125, group: 'Imperial / US' },
  { id: 'st', name: 'Stones', symbol: 'st', factor: 6.35029318, group: 'Imperial / US' },
  { id: 'short-ton', name: 'US short tons', symbol: 'US ton', factor: 907.18474, group: 'Imperial / US' },
  { id: 'long-ton', name: 'UK long tons', symbol: 'UK ton', factor: 1016.0469088, group: 'Imperial / US' },
  { id: 'ozt', name: 'Troy ounces', symbol: 'oz t', factor: 0.0311034768, group: 'Other' },
  { id: 'ct', name: 'Carats', symbol: 'ct', factor: 0.0002, group: 'Other' },
];

function stonesAndPounds(kg: number): string {
  const totalPounds = Math.abs(kg) / 0.45359237;
  let stones = Math.floor(totalPounds / 14);
  let pounds = Math.round((totalPounds - stones * 14) * 100) / 100;
  if (pounds >= 14) {
    stones += 1;
    pounds -= 14;
  }
  return `${kg < 0 ? '-' : ''}${formatNumber(stones)} st ${formatNumber(pounds)} lb`;
}

function poundsAndOunces(kg: number): string {
  const totalOunces = Math.abs(kg) / 0.028349523125;
  let pounds = Math.floor(totalOunces / 16);
  let ounces = Math.round((totalOunces - pounds * 16) * 100) / 100;
  if (ounces >= 16) {
    pounds += 1;
    ounces -= 16;
  }
  return `${kg < 0 ? '-' : ''}${formatNumber(pounds)} lb ${formatNumber(ounces)} oz`;
}

export default function WeightConverter() {
  return (
    <UnitConverter
      quantity="weight"
      units={units}
      defaultFrom="kg"
      defaultTo="lb"
      presets={[
        { label: 'kg → lb', value: '1', from: 'kg', to: 'lb' },
        { label: 'lb → kg', value: '1', from: 'lb', to: 'kg' },
        { label: 'oz → g', value: '1', from: 'oz', to: 'g' },
        { label: 'st → kg', value: '10', from: 'st', to: 'kg' },
      ]}
      extraRows={(value, from) => [
        { label: 'Pounds and ounces', value: poundsAndOunces(value * from.factor) },
        { label: 'Stones and pounds', value: stonesAndPounds(value * from.factor) },
      ]}
      note={
        <p>
          Uses exact definitions: 1 pound = 0.45359237 kg, 1 ounce = 1/16 lb, 1 stone = 14 lb. Ounces are avoirdupois ounces; use troy ounces for
          precious metals.
        </p>
      }
    />
  );
}
