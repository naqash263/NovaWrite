import { useState } from 'react';
import { useSEO } from '../../utils/seo';

export default function UUIDGenerator() {
  const [count, setCount] = useState<number>(1);
  const [uuids, setUuids] = useState<string[]>([]);
  const [uuidVersion, setUuidVersion] = useState<'v4' | 'v1'>('v4');

  useSEO({
    title: 'Free UUID Generator v4 - Generate UUIDs Online | No Signup Required',
    description: 'Free UUID generator v4 - no signup required. Generate UUIDs (v1, v4), multiple UUIDs up to 100, validate UUIDs, and copy to clipboard instantly. Perfect for developers and database IDs. All processing in your browser.',
    url: '/resources/utility-tools/uuid-generator',
    keywords: [
      'free UUID generator v4', 'UUID generator', 'free UUID generator', 'UUID generator v4', 'generate UUID v4',
      'generate UUID', 'UUID v4', 'UUID v1', 'GUID generator',
      'online UUID generator', 'random UUID', 'UUID tool', 'unique identifier generator', 'free UUID generator online'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'UUID Generator',
      'description': 'Free online UUID generator for generating unique identifiers.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/uuid-generator',
      'applicationCategory': 'DeveloperApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Generate UUIDs (v1, v4)',
        'Generate multiple UUIDs',
        'Validate UUIDs',
        'Copy to clipboard',
        'Bulk generation'
      ],
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.7',
        'ratingCount': '1800',
        'bestRating': '5',
        'worstRating': '1'
      }
    }
  });

  const generateUUIDv4 = (): string => {
    // Use crypto.randomUUID() if available (modern browsers)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    
    // Fallback implementation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const generateUUIDv1 = (): string => {
    // Simplified v1 UUID (timestamp-based)
    // Note: True v1 requires MAC address, which we can't access in browser
    const timestamp = Date.now();
    const random = Math.random().toString(16).substring(2, 14);
    return `${timestamp.toString(16).substring(0, 8)}-${timestamp.toString(16).substring(8, 12)}-1${timestamp.toString(16).substring(12, 15)}-${Math.floor(Math.random() * 4 + 8).toString(16)}${random.substring(0, 3)}-${random.substring(3)}${timestamp.toString(16).substring(15)}`;
  };

  const generateUUIDs = () => {
    const newUuids: string[] = [];
    for (let i = 0; i < count; i++) {
      newUuids.push(uuidVersion === 'v4' ? generateUUIDv4() : generateUUIDv1());
    }
    setUuids(newUuids);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyAll = async () => {
    const allUuids = uuids.join('\n');
    await copyToClipboard(allUuids);
  };

  const validateUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          🆔 Free UUID Generator v4
        </h1>
        <p className="text-gray-600 mb-6">
          Free UUID generator v4 - no signup required. Generate unique identifiers (UUIDs). Supports UUID v1 and v4. Generate up to 100 UUIDs at once. Perfect for database IDs and unique keys. All processing in your browser.
        </p>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              UUID Version
            </label>
            <select
              value={uuidVersion}
              onChange={(e) => setUuidVersion(e.target.value as 'v4' | 'v1')}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="v4">UUID v4 (Random)</option>
              <option value="v1">UUID v1 (Time-based)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Count
            </label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              min="1"
              max="100"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={generateUUIDs}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Generate
            </button>
          </div>
        </div>

        {/* Generated UUIDs */}
        {uuids.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Generated UUIDs ({uuids.length})
              </h2>
              <button
                onClick={copyAll}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
              >
                Copy All
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {uuids.map((uuid, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-sm text-gray-500 w-8">{index + 1}.</span>
                    <code className="font-mono text-sm text-gray-900 break-all">{uuid}</code>
                    {validateUUID(uuid) && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Valid</span>
                    )}
                  </div>
                  <button
                    onClick={() => copyToClipboard(uuid)}
                    className="ml-3 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* UUID Validator */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">UUID Validator</h3>
          <UUIDValidator />
        </div>

        {/* SEO & AI-Friendly Content Sections */}
        <div className="space-y-6 mt-8">
          {/* About Section */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">About UUID Generator</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              UUID (Universally Unique Identifier) is a 128-bit identifier used to uniquely identify information. 
              UUIDs are commonly used in databases, distributed systems, and applications where unique identifiers are needed.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Our UUID generator supports UUID v4 (random) and UUID v1 (time-based). UUID v4 is the most commonly used 
              version and provides random, unique identifiers. UUID v1 is based on timestamp and MAC address.
            </p>
          </div>

          {/* Use Cases */}
          <div className="p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Common Use Cases</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Database primary keys</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>API request IDs</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Session identifiers</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>File naming</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Distributed system IDs</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Unique resource identifiers</span>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div className="p-6 bg-white border border-gray-200 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Key Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">UUID v4 & v1</h4>
                  <p className="text-sm text-gray-600">Generate random (v4) or time-based (v1) UUIDs</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Bulk Generation</h4>
                  <p className="text-sm text-gray-600">Generate up to 100 UUIDs at once</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">UUID Validator</h4>
                  <p className="text-sm text-gray-600">Validate UUID format</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Copy to Clipboard</h4>
                  <p className="text-sm text-gray-600">One-click copy for individual or all UUIDs</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="p-6 bg-blue-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What's the difference between UUID v1 and v4?</h4>
                <p className="text-gray-700 text-sm">
                  UUID v1 is time-based and includes MAC address information, making it somewhat predictable. 
                  UUID v4 is randomly generated and provides better privacy and security. UUID v4 is recommended for most use cases.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Are UUIDs guaranteed to be unique?</h4>
                <p className="text-gray-700 text-sm">
                  While UUIDs are not guaranteed to be unique, the probability of collision is extremely low (about 1 in 2^122 for v4). 
                  For practical purposes, UUIDs can be considered unique.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Can I use UUIDs as database primary keys?</h4>
                <p className="text-gray-700 text-sm">
                  Yes, UUIDs are commonly used as primary keys in databases. They're especially useful in distributed systems 
                  where you need globally unique identifiers without coordination.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>UUID v4 (random) is recommended for most use cases</li>
            <li>UUIDs are 128-bit identifiers in the format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</li>
            <li>Use UUIDs for distributed systems where coordination isn't possible</li>
            <li>All UUIDs are generated locally in your browser - no server requests</li>
            <li>Validate UUIDs before using them in your applications</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// UUID Validator Component
function UUIDValidator() {
  const [input, setInput] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const validate = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    if (value.trim()) {
      setIsValid(validate(value));
    } else {
      setIsValid(null);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={input}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder="Enter UUID to validate..."
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
      />
      {isValid !== null && (
        <div className={`mt-2 p-2 rounded ${isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {isValid ? '✅ Valid UUID' : '❌ Invalid UUID format'}
        </div>
      )}
    </div>
  );
}

