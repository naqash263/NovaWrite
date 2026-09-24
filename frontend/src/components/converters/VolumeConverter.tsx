import UnitConverter, { type ConverterUnit } from './UnitConverter';

// Exact factors to litres. US units derive from 1 US gallon = 231 in³ = 3.785411784 L;
// imperial (UK) units from 1 imperial gallon = 4.54609 L.
const US_GAL = 3.785411784;
const UK_GAL = 4.54609;

const units: ConverterUnit[] = [
  { id: 'l', name: 'Liters', symbol: 'L', factor: 1, group: 'Metric' },
  { id: 'ml', name: 'Milliliters', symbol: 'mL', factor: 0.001, group: 'Metric' },
  { id: 'm3', name: 'Cubic meters', symbol: 'm³', factor: 1000, group: 'Metric' },
  { id: 'cm3', name: 'Cubic centimeters', symbol: 'cm³', factor: 0.001, group: 'Metric' },
  { id: 'us-gal', name: 'US gallons', symbol: 'US gal', factor: US_GAL, group: 'US customary' },
  { id: 'us-qt', name: 'US quarts', symbol: 'US qt', factor: US_GAL / 4, group: 'US customary' },
  { id: 'us-pt', name: 'US pints', symbol: 'US pt', factor: US_GAL / 8, group: 'US customary' },
  { id: 'us-cup', name: 'US cups', symbol: 'cup', factor: US_GAL / 16, group: 'US customary' },
  { id: 'us-floz', name: 'US fluid ounces', symbol: 'US fl oz', factor: US_GAL / 128, group: 'US customary' },
  { id: 'us-tbsp', name: 'US tablespoons', symbol: 'tbsp', factor: US_GAL / 256, group: 'US customary' },
  { id: 'us-tsp', name: 'US teaspoons', symbol: 'tsp', factor: US_GAL / 768, group: 'US customary' },
  { id: 'ft3', name: 'Cubic feet', symbol: 'ft³', factor: 28.316846592, group: 'US customary' },
  { id: 'in3', name: 'Cubic inches', symbol: 'in³', factor: 0.016387064, group: 'US customary' },
  { id: 'uk-gal', name: 'Imperial gallons', symbol: 'UK gal', factor: UK_GAL, group: 'Imperial (UK)' },
  { id: 'uk-qt', name: 'Imperial quarts', symbol: 'UK qt', factor: UK_GAL / 4, group: 'Imperial (UK)' },
  { id: 'uk-pt', name: 'Imperial pints', symbol: 'UK pt', factor: UK_GAL / 8, group: 'Imperial (UK)' },
  { id: 'uk-floz', name: 'Imperial fluid ounces', symbol: 'UK fl oz', factor: UK_GAL / 160, group: 'Imperial (UK)' },
];

export default function VolumeConverter() {
  return (
    <UnitConverter
      quantity="volume"
      units={units}
      defaultFrom="l"
      defaultTo="us-gal"
      presets={[
        { label: 'L → US gal', value: '1', from: 'l', to: 'us-gal' },
        { label: 'cup → mL', value: '1', from: 'us-cup', to: 'ml' },
        { label: 'US fl oz → mL', value: '1', from: 'us-floz', to: 'ml' },
        { label: 'UK gal → L', value: '1', from: 'uk-gal', to: 'l' },
      ]}
      note={
        <p>
          US and imperial units differ: 1 US gallon = 3.785411784 L, 1 imperial (UK) gallon = 4.54609 L. A US cup here is the legal customary cup
          (1/16 US gallon ≈ 236.59 mL).
        </p>
      }
    />
  );
}
