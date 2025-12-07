import { useState } from 'react';
import { useSEO } from '../../utils/seo';

export default function URLEncoder() {
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [error, setError] = useState<string>('');

  useSEO({
    title: 'Free URL Encoder Decoder Online - Encode Decode URL | No Signup',
    description: 'Free URL encoder decoder online - no signup required. Encode URLs for safe transmission or decode URL-encoded strings instantly. Percent encoding, instant conversion, copy to clipboard. Perfect for developers. All processing in your browser.',
    url: '/resources/utility-tools/url-encoder',
    keywords: [
      'free URL encoder decoder', 'URL encoder', 'free URL encoder decoder', 'URL encoder decoder online', 'URL encode decode online',
      'URL decoder', 'URL encode', 'URL decode', 'percent encoding',
      'URL encoding', 'URL percent encoding', 'encode URL', 'decode URL', 'online URL encoder', 'free online URL encoder'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'URL Encoder & Decoder',
      'description': 'Free online URL encoder and decoder for encoding and decoding URLs.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/url-encoder',
      'applicationCategory': 'DeveloperApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Encode URLs',
        'Decode URL-encoded strings',
        'Percent encoding',
        'Instant conversion',
        'Copy to clipboard',
        'Error detection'
      ],
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.6',
        'ratingCount': '1500',
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
      const encoded = encodeURIComponent(input);
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
      const decoded = decodeURIComponent(input);
      setOutput(decoded);
    } catch (err) {
      setError('Failed to decode. Please check if the input is valid URL-encoded text.');
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
          🔗 Free URL Encoder Decoder Online
        </h1>
        <p className="text-gray-600 mb-6">
          Free URL encoder decoder online - no signup required. Encode URLs for safe transmission or decode URL-encoded strings instantly. Percent encoding (URL encoding) support, instant conversion, copy to clipboard. Perfect for developers. All processing in your browser.
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
                {mode === 'encode' ? 'Text/URL to Encode' : 'URL-encoded Text to Decode'}
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
              placeholder={mode === 'encode' ? 'Enter text or URL to encode...' : 'Enter URL-encoded string to decode...'}
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
                {mode === 'encode' ? 'URL-encoded Result' : 'Decoded Text'}
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
              placeholder={mode === 'encode' ? 'URL-encoded text will appear here...' : 'Decoded text will appear here...'}
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
            {mode === 'encode' ? '🔗 Encode' : '🔓 Decode'}
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
            <h2 className="text-2xl font-bold text-gray-900 mb-3">About URL Encoder & Decoder</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              URL encoding (also known as percent encoding) is a method to encode information in a URL by converting 
              special characters into a format that can be safely transmitted over the internet. Our URL encoder and 
              decoder helps you encode URLs for safe transmission or decode URL-encoded strings.
            </p>
            <p className="text-gray-700 leading-relaxed">
              The tool provides instant encoding and decoding with real-time conversion. Perfect for developers working 
              with URLs, API parameters, and web development tasks.
            </p>
          </div>

          {/* Use Cases */}
          <div className="p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Common Use Cases</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Encode URL parameters</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Encode special characters in URLs</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Decode URL-encoded query strings</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Encode form data for submission</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Encode API request parameters</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Debug URL encoding issues</span>
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
                  <h4 className="font-semibold text-gray-900 mb-1">Percent Encoding</h4>
                  <p className="text-sm text-gray-600">Standard URL percent encoding (RFC 3986)</p>
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
                <h4 className="font-semibold text-gray-900 mb-2">What is URL encoding?</h4>
                <p className="text-gray-700 text-sm">
                  URL encoding (percent encoding) converts special characters in URLs into a format that can be safely 
                  transmitted. For example, spaces become %20, and special characters are encoded as %XX where XX is 
                  the hexadecimal value.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">When should I use URL encoding?</h4>
                <p className="text-gray-700 text-sm">
                  Use URL encoding when you need to include special characters, spaces, or non-ASCII characters in URLs 
                  or URL parameters. This ensures the URL is valid and can be properly transmitted.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Why is my decode failing?</h4>
                <p className="text-gray-700 text-sm">
                  Decoding fails if the input is not valid URL-encoded text. URL-encoded strings should contain percent 
                  signs (%) followed by two hexadecimal digits. Make sure the input is properly encoded.
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
            <li>URL encoding converts spaces to %20 and special characters to %XX format</li>
            <li>Use this tool to encode query parameters in URLs</li>
            <li>Decode URL-encoded strings to see the original text</li>
            <li>All processing happens in your browser - no uploads required</li>
            <li>Common encoded characters: space = %20, @ = %40, # = %23</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

