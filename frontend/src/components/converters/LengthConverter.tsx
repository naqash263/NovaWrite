import UnitConverter, { formatNumber, type ConverterUnit } from './UnitConverter';

// Exact factors to metres (international yard and pound agreement, 1959: 1 in = 2.54 cm).
const units: ConverterUnit[] = [
  { id: 'm', name: 'Meters', symbol: 'm', factor: 1, group: 'Metric' },
  { id: 'km', name: 'Kilometers', symbol: 'km', factor: 1000, group: 'Metric' },
  { id: 'cm', name: 'Centimeters', symbol: 'cm', factor: 0.01, group: 'Metric' },
  { id: 'mm', name: 'Millimeters', symbol: 'mm', factor: 0.001, group: 'Metric' },
  { id: 'um', name: 'Micrometers', symbol: 'µm', factor: 1e-6, group: 'Metric' },
  { id: 'nm', name: 'Nanometers', symbol: 'nm', factor: 1e-9, group: 'Metric' },
  { id: 'mi', name: 'Miles', symbol: 'mi', factor: 1609.344, group: 'Imperial / US' },
  { id: 'yd', name: 'Yards', symbol: 'yd', factor: 0.9144, group: 'Imperial / US' },
  { id: 'ft', name: 'Feet', symbol: 'ft', factor: 0.3048, group: 'Imperial / US' },
  { id: 'in', name: 'Inches', symbol: 'in', factor: 0.0254, group: 'Imperial / US' },
  { id: 'nmi', name: 'Nautical miles', symbol: 'nmi', factor: 1852, group: 'Other' },
];

function feetAndInches(meters: number): string {
  const sign = meters < 0 ? '-' : '';
  const totalInches = Math.abs(meters) / 0.0254;
  let feet = Math.floor(totalInches / 12);
  let inches = Math.round((totalInches - feet * 12) * 100) / 100;
  if (inches >= 12) {
    feet += 1;
    inches -= 12;
  }
  return `${sign}${formatNumber(feet)} ft ${formatNumber(inches)} in`;
}

export default function LengthConverter() {
  return (
    <UnitConverter
      quantity="length"
      units={units}
      defaultFrom="m"
      defaultTo="ft"
      presets={[
        { label: 'm → ft', value: '1', from: 'm', to: 'ft' },
        { label: 'in → cm', value: '1', from: 'in', to: 'cm' },
        { label: 'km → mi', value: '10', from: 'km', to: 'mi' },
        { label: 'ft → m', value: '6', from: 'ft', to: 'm' },
      ]}
      extraRows={(value, from) => [{ label: 'Feet and inches', value: feetAndInches(value * from.factor) }]}
      note={<p>Uses exact international definitions: 1 inch = 2.54 cm, 1 foot = 0.3048 m, 1 mile = 1,609.344 m and 1 nautical mile = 1,852 m.</p>}
    />
  );
}
