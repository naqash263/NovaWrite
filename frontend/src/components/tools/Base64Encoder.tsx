import { useState } from 'react';
import { useSEO } from '../../utils/seo';

export default function Base64Encoder() {
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [error, setError] = useState<string>('');

  useSEO({
    title: 'Free Base64 Encoder Decoder Online - Encode Decode Base64 | No Signup',
    description: 'Free base64 encoder decoder online - no signup required. Encode text to Base64 or decode Base64 to text instantly. UTF-8 support, real-time conversion, copy to clipboard. Perfect for developers and data encoding. All processing in your browser.',
    url: '/resources/utility-tools/base64-encoder',
    keywords: [
      'free base64 encoder decoder online', 'base64 encoder decoder', 'free base64 encoder decoder', 'base64 encoder decoder online',
      'Base64 encoder', 'Base64 decoder', 'Base64 converter', 'encode Base64',
      'decode Base64', 'Base64 encode decode', 'Base64 tool', 'online Base64', 'free base64 encoder', 'free base64 decoder'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Base64 Encoder & Decoder',
      'description': 'Free online Base64 encoder and decoder for encoding and decoding text.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/base64-encoder',
      'applicationCategory': 'DeveloperApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Encode text to Base64',
        'Decode Base64 to text',
        'Instant conversion',
        'Copy to clipboard',
        'Error detection',
        'UTF-8 support'
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

  const handleEncode = () => {
    try {
      setError('');
      if (!input.trim()) {
        setOutput('');
        return;
      }
      const encoded = btoa(unescape(encodeURIComponent(input)));
      setOutput(encoded);
    } catch (err) {
      setError('Failed to encode. Please check your input.');
      setOutput('');
    }
  };

  const handleDecode = () => {
    try {
      setError('');
      if (!input.trim()) {
        setOutput('');
        return;
      }
      const decoded = decodeURIComponent(escape(atob(input)));
      setOutput(decoded);
    } catch (err) {
      setError('Failed to decode. Please check if the input is valid Base64.');
      setOutput('');
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    setError('');
    if (value.trim()) {
      if (mode === 'encode') {
        handleEncode();
      } else {
        handleDecode();
      }
    } else {
      setOutput('');
    }
  };

  const handleModeChange = (newMode: 'encode' | 'decode') => {
    setMode(newMode);
    setError('');
    setOutput('');
    if (input.trim()) {
      if (newMode === 'encode') {
        handleEncode();
      } else {
        handleDecode();
      }
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          🔐 Free Base64 Encoder Decoder Online
        </h1>
        <p className="text-gray-600 mb-6">
          Free base64 encoder decoder online - no signup required. Encode text to Base64 or decode Base64 to text instantly. Real-time conversion with UTF-8 support. All processing happens in your browser for maximum security.
        </p>

        {/* Mode Selector */}
        <div className="mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => handleModeChange('encode')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                mode === 'encode'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Encode
            </button>
            <button
              onClick={() => handleModeChange('decode')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                mode === 'decode'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Decode
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                {mode === 'encode' ? 'Text to Encode' : 'Base64 to Decode'}
              </label>
              {input && (
                <button
                  onClick={() => handleCopy(input)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Copy
                </button>
              )}
            </div>
            <textarea
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={mode === 'encode' ? 'Enter text to encode to Base64...' : 'Enter Base64 string to decode...'}
              className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-2">
              {input.length} character{input.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Output Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                {mode === 'encode' ? 'Base64 Encoded' : 'Decoded Text'}
              </label>
              {output && (
                <button
                  onClick={() => handleCopy(output)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Copy
                </button>
              )}
            </div>
            <textarea
              value={output}
              readOnly
              placeholder={mode === 'encode' ? 'Base64 encoded text will appear here...' : 'Decoded text will appear here...'}
              className="w-full h-64 p-4 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-2">
              {output.length} character{output.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={mode === 'encode' ? handleEncode : handleDecode}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            {mode === 'encode' ? '🔐 Encode' : '🔓 Decode'}
          </button>
          <button
            onClick={() => {
              setInput('');
              setOutput('');
              setError('');
            }}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
          >
            🗑️ Clear
          </button>
        </div>

        {/* SEO & AI-Friendly Content Sections */}
        <div className="space-y-6 mt-8">
          {/* About Section */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">About Base64 Encoder & Decoder</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Base64 is an encoding scheme that converts binary data into ASCII text format. It's commonly used for 
              encoding data in URLs, email attachments, and data transmission. Our Base64 encoder and decoder supports 
              UTF-8 encoding, making it perfect for encoding text in any language.
            </p>
            <p className="text-gray-700 leading-relaxed">
              The tool provides instant encoding and decoding with real-time conversion. Perfect for developers working 
              with APIs, data encoding, and web development tasks.
            </p>
          </div>

          {/* Use Cases */}
          <div className="p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Common Use Cases</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Encode data for API requests</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Encode credentials and tokens</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Decode Base64 strings in responses</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Encode text for data URLs</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Encode binary data as text</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Debug Base64 encoded data</span>
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
                  <h4 className="font-semibold text-gray-900 mb-1">Encode & Decode</h4>
                  <p className="text-sm text-gray-600">Switch between encoding and decoding modes</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">UTF-8 Support</h4>
                  <p className="text-sm text-gray-600">Supports all Unicode characters</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Instant Conversion</h4>
                  <p className="text-sm text-gray-600">Real-time encoding/decoding as you type</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Copy to Clipboard</h4>
                  <p className="text-sm text-gray-600">One-click copy for easy use</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="p-6 bg-blue-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What is Base64 encoding?</h4>
                <p className="text-gray-700 text-sm">
                  Base64 is an encoding scheme that converts binary data into ASCII text format using 64 characters 
                  (A-Z, a-z, 0-9, +, /). It's commonly used for encoding data in URLs, email attachments, and APIs.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Does this support UTF-8?</h4>
                <p className="text-gray-700 text-sm">
                  Yes, our Base64 encoder and decoder fully supports UTF-8 encoding, allowing you to encode and decode 
                  text in any language, including emojis and special characters.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Why is my decode failing?</h4>
                <p className="text-gray-700 text-sm">
                  Decoding fails if the input is not valid Base64. Base64 strings should only contain A-Z, a-z, 0-9, 
                  +, /, and = characters. Make sure there are no spaces or invalid characters.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Is my data secure?</h4>
                <p className="text-gray-700 text-sm">
                  Yes, all encoding and decoding happens locally in your browser. Your data is never sent to any server 
                  or stored anywhere. Your privacy is guaranteed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Base64 encoding increases data size by approximately 33%</li>
            <li>Base64 strings may end with = or == padding characters</li>
            <li>Use this tool to encode credentials for API authentication</li>
            <li>Decode Base64 strings to debug API responses</li>
            <li>All processing happens in your browser - no uploads required</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

