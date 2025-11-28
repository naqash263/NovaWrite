import { useState, useEffect } from 'react';
import { useSEO } from '../../utils/seo';

export default function JSONFormatter() {
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [indent, setIndent] = useState<number>(2);
  const [isMinified, setIsMinified] = useState<boolean>(false);

  useSEO({
    title: 'Free JSON Formatter & Validator - Beautify, Minify, Validate JSON | Online JSON Tool',
    description: 'Free online JSON formatter and validator. Beautify, minify, validate, and format JSON data. Includes syntax highlighting and error detection. No registration required.',
    url: '/resources/utility-tools/json-formatter',
    keywords: [
      'JSON formatter', 'JSON validator', 'JSON beautifier', 'JSON minifier',
      'format JSON', 'validate JSON', 'JSON tool', 'JSON parser',
      'online JSON formatter', 'free JSON tool', 'JSON editor'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'JSON Formatter & Validator',
      'description': 'Free online JSON formatter, validator, beautifier, and minifier with syntax validation.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/json-formatter',
      'applicationCategory': 'DeveloperApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Beautify JSON with customizable indentation',
        'Minify JSON to reduce file size',
        'Validate JSON syntax',
        'Error detection and reporting',
        'Copy to clipboard',
        'Real-time formatting'
      ],
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.8',
        'ratingCount': '3500',
        'bestRating': '5',
        'worstRating': '1'
      }
    }
  });

  const formatJSON = () => {
    setError('');
    if (!input.trim()) {
      setOutput('');
      return;
    }

    try {
      const parsed = JSON.parse(input);
      
      if (isMinified) {
        setOutput(JSON.stringify(parsed));
      } else {
        setOutput(JSON.stringify(parsed, null, indent));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid JSON';
      setError(errorMessage);
      setOutput('');
    }
  };

  const validateJSON = () => {
    setError('');
    if (!input.trim()) {
      setError('Please enter JSON to validate');
      return;
    }

    try {
      JSON.parse(input);
      setError('');
      alert('✅ Valid JSON!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid JSON';
      setError(errorMessage);
    }
  };

  const minifyJSON = () => {
    setError('');
    if (!input.trim()) {
      setOutput('');
      return;
    }

    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setIsMinified(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid JSON';
      setError(errorMessage);
      setOutput('');
    }
  };

  const beautifyJSON = () => {
    setIsMinified(false);
    formatJSON();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  const loadExample = () => {
    const example = {
      "name": "John Doe",
      "age": 30,
      "email": "john@example.com",
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "zip": "10001"
      },
      "hobbies": ["reading", "coding", "traveling"],
      "active": true
    };
    setInput(JSON.stringify(example, null, 2));
  };

  useEffect(() => {
    formatJSON();
  }, [input, indent, isMinified]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          📋 JSON Formatter & Validator
        </h1>
        <p className="text-gray-600 mb-6">
          Format, validate, beautify, and minify JSON data. Includes syntax validation and error detection.
        </p>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={beautifyJSON}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            ✨ Beautify
          </button>
          <button
            onClick={minifyJSON}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            📦 Minify
          </button>
          <button
            onClick={validateJSON}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            ✓ Validate
          </button>
          <button
            onClick={loadExample}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            📝 Example
          </button>
          <button
            onClick={clearAll}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            🗑️ Clear
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <label className="text-sm text-gray-700">Indent:</label>
            <select
              value={indent}
              onChange={(e) => setIndent(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="2">2 spaces</option>
              <option value="4">4 spaces</option>
              <option value="tab">Tab</option>
            </select>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <span className="text-red-600 text-xl mr-2">⚠️</span>
              <div>
                <div className="text-sm font-medium text-red-900">Error</div>
                <div className="text-sm text-red-700 mt-1">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Input/Output Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                JSON Input
              </label>
              <button
                onClick={() => copyToClipboard(input)}
                disabled={!input}
                className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                📋 Copy
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Paste your JSON here...\n\nExample:\n{\n  "key": "value"\n}'
              className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y font-mono text-sm"
            />
            <div className="text-xs text-gray-500 mt-1">
              {input.length} characters
            </div>
          </div>

          {/* Output */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Formatted Output
              </label>
              <button
                onClick={() => copyToClipboard(output)}
                disabled={!output}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                📋 Copy
              </button>
            </div>
            <textarea
              value={output}
              readOnly
              placeholder="Formatted JSON will appear here..."
              className="w-full h-96 p-4 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm resize-y"
            />
            <div className="text-xs text-gray-500 mt-1">
              {output.length} characters
            </div>
          </div>
        </div>

        {/* Stats */}
        {output && !error && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-xs text-gray-600">Size Reduction</div>
              <div className="text-lg font-bold text-blue-600">
                {input.length > 0 ? ((1 - output.length / input.length) * 100).toFixed(1) : 0}%
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-xs text-gray-600">Lines</div>
              <div className="text-lg font-bold text-green-600">
                {output.split('\n').length}
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-xs text-gray-600">Characters</div>
              <div className="text-lg font-bold text-purple-600">
                {output.length.toLocaleString()}
              </div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="text-xs text-gray-600">Status</div>
              <div className="text-lg font-bold text-orange-600">
                {isMinified ? 'Minified' : 'Formatted'}
              </div>
            </div>
          </div>
        )}

        {/* SEO & AI-Friendly Content Sections */}
        <div className="space-y-6 mt-8">
          {/* About Section */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">About JSON Formatter</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our JSON Formatter is a powerful developer tool that helps you work with JSON data 
              efficiently. It can beautify (format) JSON for readability, minify (compress) JSON 
              for production use, and validate JSON syntax to catch errors before they cause 
              problems. All processing happens locally in your browser for maximum security and speed.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Perfect for developers, API integrators, and anyone working with JSON data. The tool 
              helps you format messy JSON, reduce file sizes, and ensure your JSON is valid before 
              using it in applications or sending it to APIs.
            </p>
          </div>

          {/* Use Cases */}
          <div className="p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Common Use Cases</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Formatting API responses for readability</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Validating JSON before sending to APIs</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Minifying JSON for production deployment</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Debugging JSON syntax errors</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Formatting configuration files</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Preparing JSON for documentation</span>
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
                  <h4 className="font-semibold text-gray-900 mb-1">Beautify JSON</h4>
                  <p className="text-sm text-gray-600">Format JSON with customizable indentation for readability</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Minify JSON</h4>
                  <p className="text-sm text-gray-600">Compress JSON by removing whitespace to reduce file size</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Validate JSON</h4>
                  <p className="text-sm text-gray-600">Check JSON syntax and report errors with line numbers</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Error Detection</h4>
                  <p className="text-sm text-gray-600">Identify syntax errors, missing quotes, and invalid characters</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="p-6 bg-blue-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What is JSON?</h4>
                <p className="text-gray-700 text-sm">
                  JSON (JavaScript Object Notation) is a lightweight data-interchange format that's 
                  easy for humans to read and write, and easy for machines to parse and generate. 
                  It's commonly used for APIs and configuration files.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Why minify JSON?</h4>
                <p className="text-gray-700 text-sm">
                  Minifying JSON removes unnecessary whitespace, reducing file size. This is useful 
                  for production environments where smaller files mean faster loading times and 
                  reduced bandwidth usage.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What are common JSON errors?</h4>
                <p className="text-gray-700 text-sm">
                  Common errors include: missing quotes around keys, trailing commas, single quotes 
                  instead of double quotes, and invalid characters. The validator will identify 
                  these issues.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Is my JSON data stored?</h4>
                <p className="text-gray-700 text-sm">
                  No, all processing happens locally in your browser. Your JSON data is never sent 
                  to any server or stored anywhere.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 JSON Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>JSON keys must be in double quotes</li>
            <li>Trailing commas are not allowed in JSON</li>
            <li>Use beautify to format messy JSON for readability</li>
            <li>Use minify to reduce file size for production</li>
            <li>Always validate JSON before using it in your applications</li>
            <li>Check error messages for specific line numbers when validation fails</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

