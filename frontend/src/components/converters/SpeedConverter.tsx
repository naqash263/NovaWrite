import UnitConverter, { type ConverterUnit } from './UnitConverter';

// Factors to metres per second. Mach uses the speed of sound in the International
// Standard Atmosphere at sea level (15 °C): 340.29 m/s. Real Mach 1 varies with temperature.
const units: ConverterUnit[] = [
  { id: 'kmh', name: 'Kilometers per hour', symbol: 'km/h', factor: 1 / 3.6 },
  { id: 'mph', name: 'Miles per hour', symbol: 'mph', factor: 0.44704 },
  { id: 'ms', name: 'Meters per second', symbol: 'm/s', factor: 1 },
  { id: 'fts', name: 'Feet per second', symbol: 'ft/s', factor: 0.3048 },
  { id: 'kn', name: 'Knots', symbol: 'kn', factor: 1852 / 3600 },
  { id: 'kms', name: 'Kilometers per second', symbol: 'km/s', factor: 1000 },
  { id: 'mach', name: 'Mach (sea level, 15 °C)', symbol: 'Ma', factor: 340.29 },
];

export default function SpeedConverter() {
  return (
    <UnitConverter
      quantity="speed"
      units={units}
      defaultFrom="kmh"
      defaultTo="mph"
      defaultValue="100"
      presets={[
        { label: 'km/h → mph', value: '100', from: 'kmh', to: 'mph' },
        { label: 'mph → km/h', value: '60', from: 'mph', to: 'kmh' },
        { label: 'knots → km/h', value: '1', from: 'kn', to: 'kmh' },
        { label: 'm/s → km/h', value: '1', from: 'ms', to: 'kmh' },
      ]}
      note={
        <p>
          Exact definitions: 1 mph = 1.609344 km/h, 1 knot = 1 nautical mile per hour = 1.852 km/h. Mach is an approximation based on the speed of
          sound at sea level in the standard atmosphere (340.29 m/s).
        </p>
      }
    />
  );
}
