import UnitConverter, { type ConverterUnit } from './UnitConverter';

// Exact factors to square metres (derived from 1 ft = 0.3048 m).
const units: ConverterUnit[] = [
  { id: 'm2', name: 'Square meters', symbol: 'm²', factor: 1, group: 'Metric' },
  { id: 'km2', name: 'Square kilometers', symbol: 'km²', factor: 1e6, group: 'Metric' },
  { id: 'cm2', name: 'Square centimeters', symbol: 'cm²', factor: 1e-4, group: 'Metric' },
  { id: 'mm2', name: 'Square millimeters', symbol: 'mm²', factor: 1e-6, group: 'Metric' },
  { id: 'ha', name: 'Hectares', symbol: 'ha', factor: 1e4, group: 'Metric' },
  { id: 'ac', name: 'Acres', symbol: 'ac', factor: 4046.8564224, group: 'Imperial / US' },
  { id: 'mi2', name: 'Square miles', symbol: 'mi²', factor: 2589988.110336, group: 'Imperial / US' },
  { id: 'yd2', name: 'Square yards', symbol: 'yd²', factor: 0.83612736, group: 'Imperial / US' },
  { id: 'ft2', name: 'Square feet', symbol: 'ft²', factor: 0.09290304, group: 'Imperial / US' },
  { id: 'in2', name: 'Square inches', symbol: 'in²', factor: 0.00064516, group: 'Imperial / US' },
];

export default function AreaConverter() {
  return (
    <UnitConverter
      quantity="area"
      units={units}
      defaultFrom="m2"
      defaultTo="ft2"
      presets={[
        { label: 'm² → ft²', value: '1', from: 'm2', to: 'ft2' },
        { label: 'acre → ha', value: '1', from: 'ac', to: 'ha' },
        { label: 'acre → ft²', value: '1', from: 'ac', to: 'ft2' },
        { label: 'ha → acres', value: '1', from: 'ha', to: 'ac' },
      ]}
      note={<p>Uses exact international definitions: 1 ft² = 0.09290304 m², 1 acre = 43,560 ft² = 4,046.8564224 m², 1 hectare = 10,000 m².</p>}
    />
  );
}
