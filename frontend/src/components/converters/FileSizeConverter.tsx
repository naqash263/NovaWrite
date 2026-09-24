import UnitConverter, { type ConverterUnit } from './UnitConverter';

// Factors to bytes. Decimal (SI) units use powers of 1,000; binary (IEC) units use powers of 1,024.
const units: ConverterUnit[] = [
  { id: 'bit', name: 'Bits', symbol: 'bit', factor: 1 / 8, group: 'Bits and bytes' },
  { id: 'B', name: 'Bytes', symbol: 'B', factor: 1, group: 'Bits and bytes' },
  { id: 'KB', name: 'Kilobytes (1,000 B)', symbol: 'KB', factor: 1e3, group: 'Decimal (SI, powers of 1,000)' },
  { id: 'MB', name: 'Megabytes (1,000 KB)', symbol: 'MB', factor: 1e6, group: 'Decimal (SI, powers of 1,000)' },
  { id: 'GB', name: 'Gigabytes (1,000 MB)', symbol: 'GB', factor: 1e9, group: 'Decimal (SI, powers of 1,000)' },
  { id: 'TB', name: 'Terabytes (1,000 GB)', symbol: 'TB', factor: 1e12, group: 'Decimal (SI, powers of 1,000)' },
  { id: 'PB', name: 'Petabytes (1,000 TB)', symbol: 'PB', factor: 1e15, group: 'Decimal (SI, powers of 1,000)' },
  { id: 'KiB', name: 'Kibibytes (1,024 B)', symbol: 'KiB', factor: 1024, group: 'Binary (IEC, powers of 1,024)' },
  { id: 'MiB', name: 'Mebibytes (1,024 KiB)', symbol: 'MiB', factor: 1024 ** 2, group: 'Binary (IEC, powers of 1,024)' },
  { id: 'GiB', name: 'Gibibytes (1,024 MiB)', symbol: 'GiB', factor: 1024 ** 3, group: 'Binary (IEC, powers of 1,024)' },
  { id: 'TiB', name: 'Tebibytes (1,024 GiB)', symbol: 'TiB', factor: 1024 ** 4, group: 'Binary (IEC, powers of 1,024)' },
  { id: 'PiB', name: 'Pebibytes (1,024 TiB)', symbol: 'PiB', factor: 1024 ** 5, group: 'Binary (IEC, powers of 1,024)' },
  { id: 'Mbit', name: 'Megabits (1,000,000 bits)', symbol: 'Mb', factor: 1e6 / 8, group: 'Network (bits)' },
  { id: 'Gbit', name: 'Gigabits (1,000,000,000 bits)', symbol: 'Gb', factor: 1e9 / 8, group: 'Network (bits)' },
];

export default function FileSizeConverter() {
  return (
    <UnitConverter
      quantity="data size"
      units={units}
      defaultFrom="GB"
      defaultTo="MB"
      presets={[
        { label: 'GB → MB', value: '1', from: 'GB', to: 'MB' },
        { label: 'MB → GB', value: '500', from: 'MB', to: 'GB' },
        { label: '1 TB drive → GiB', value: '1', from: 'TB', to: 'GiB' },
        { label: 'GiB → GB', value: '1', from: 'GiB', to: 'GB' },
        { label: 'Mb → MB', value: '100', from: 'Mbit', to: 'MB' },
      ]}
      note={
        <p>
          <strong>Which standard?</strong> KB, MB, GB and TB here are decimal SI units (1 KB = 1,000 bytes), as used by storage makers and macOS.
          KiB, MiB, GiB and TiB are binary IEC units (1 KiB = 1,024 bytes); Windows uses the binary values but labels them KB, MB and GB. That is why
          a 1 TB drive shows as about 931 GB in Windows.
        </p>
      }
    />
  );
}
