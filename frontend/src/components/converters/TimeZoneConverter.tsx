import { useState, useEffect } from 'react';

const timeZones = [
  { name: 'UTC', offset: 0, label: 'UTC (Coordinated Universal Time)' },
  { name: 'EST', offset: -5, label: 'Eastern Standard Time (US)' },
  { name: 'PST', offset: -8, label: 'Pacific Standard Time (US)' },
  { name: 'CST', offset: -6, label: 'Central Standard Time (US)' },
  { name: 'MST', offset: -7, label: 'Mountain Standard Time (US)' },
  { name: 'GMT', offset: 0, label: 'Greenwich Mean Time' },
  { name: 'CET', offset: 1, label: 'Central European Time' },
  { name: 'EET', offset: 2, label: 'Eastern European Time' },
  { name: 'IST', offset: 5.5, label: 'Indian Standard Time' },
  { name: 'JST', offset: 9, label: 'Japan Standard Time' },
  { name: 'CST', offset: 8, label: 'China Standard Time' },
  { name: 'AEDT', offset: 11, label: 'Australian Eastern Daylight Time' },
  { name: 'NZDT', offset: 13, label: 'New Zealand Daylight Time' },
  { name: 'BRT', offset: -3, label: 'Brasília Time' },
  { name: 'MSK', offset: 3, label: 'Moscow Standard Time' },
  { name: 'GST', offset: 4, label: 'Gulf Standard Time' },
  { name: 'PKT', offset: 5, label: 'Pakistan Standard Time' },
  { name: 'BST', offset: 6, label: 'Bangladesh Standard Time' },
];

export default function TimeZoneConverter() {
  const [fromTimeZone, setFromTimeZone] = useState<string>('UTC');
  const [toTimeZone, setToTimeZone] = useState<string>('EST');
  const [fromTime, setFromTime] = useState<string>('');
  const [convertedTime, setConvertedTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      setFromTime(`${hours}:${minutes}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    convertTime();
  }, [fromTime, fromTimeZone, toTimeZone]);

  const convertTime = () => {
    if (!fromTime) {
      setConvertedTime('');
      return;
    }

    const [hours, minutes] = fromTime.split(':').map(Number);
    const fromTZ = timeZones.find(tz => tz.name === fromTimeZone);
    const toTZ = timeZones.find(tz => tz.name === toTimeZone);

    if (!fromTZ || !toTZ) return;

    // Create a date object with the input time
    const now = new Date();
    const date = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      hours - fromTZ.offset,
      minutes
    ));

    // Convert to target timezone
    const targetHours = (date.getUTCHours() + toTZ.offset + 24) % 24;
    const targetMinutes = date.getUTCMinutes();

    setConvertedTime(
      `${String(targetHours).padStart(2, '0')}:${String(targetMinutes).padStart(2, '0')}`
    );
  };

  const swapTimeZones = () => {
    const tempTZ = fromTimeZone;
    setFromTimeZone(toTimeZone);
    setToTimeZone(tempTZ);
  };

  const getCurrentTime = (timeZone: string) => {
    const tz = timeZones.find(t => t.name === timeZone);
    if (!tz) return '';

    const now = new Date();
    const utcHours = now.getUTCHours();
    const localHours = (utcHours + tz.offset + 24) % 24;
    const minutes = now.getUTCMinutes();

    return `${String(localHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">From Time Zone</label>
          <select
            value={fromTimeZone}
            onChange={(e) => setFromTimeZone(e.target.value)}
            className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white mb-3 text-sm sm:text-base touch-manipulation"
          >
            {timeZones.map(tz => (
              <option key={tz.name} value={tz.name}>
                {tz.label}
              </option>
            ))}
          </select>
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
            <input
              type="time"
              value={fromTime}
              onChange={(e) => setFromTime(e.target.value)}
              className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-lg"
            />
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600">
              Current time in {timeZones.find(tz => tz.name === fromTimeZone)?.label}: {getCurrentTime(fromTimeZone)}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">To Time Zone</label>
          <select
            value={toTimeZone}
            onChange={(e) => setToTimeZone(e.target.value)}
            className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white mb-3 text-sm sm:text-base touch-manipulation"
          >
            {timeZones.map(tz => (
              <option key={tz.name} value={tz.name}>
                {tz.label}
              </option>
            ))}
          </select>
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Converted Time</label>
            <input
              type="text"
              value={convertedTime}
              readOnly
              className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-base sm:text-lg font-semibold"
            />
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600">
              Current time in {timeZones.find(tz => tz.name === toTimeZone)?.label}: {getCurrentTime(toTimeZone)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={swapTimeZones}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          ↕ Swap Time Zones
        </button>
      </div>

      {convertedTime && (
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Conversion:</strong> {fromTime} {fromTimeZone} = {convertedTime} {toTimeZone}
          </p>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-xs text-gray-600">
          <strong>Note:</strong> Time zone conversions account for UTC offsets. 
          Daylight Saving Time (DST) adjustments may affect accuracy for some time zones.
        </p>
      </div>
    </div>
  );
}

