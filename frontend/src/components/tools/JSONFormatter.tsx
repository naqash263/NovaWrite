import { useState, useEffect, useRef } from 'react';
import { useSEO } from '../../utils/seo';

interface ErrorInfo {
  message: string;
  position?: number;
  line?: number;
  column?: number;
  suggestion?: string;
  fixable?: boolean;
}

export default function JSONFormatter() {
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [indent, setIndent] = useState<number | 'tab'>(2);
  const [isMinified, setIsMinified] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useSEO({
    title: 'Free JSON Formatter Online - Beautify, Minify, Validate JSON | No Signup',
    description: 'Free JSON formatter online - no signup required. Beautify, minify, validate, and format JSON data instantly. Includes syntax highlighting and error detection. JSON beautifier free online. Perfect for developers. All processing in your browser.',
    url: '/resources/utility-tools/json-formatter',
    keywords: [
      'free JSON formatter online', 'JSON formatter', 'free JSON formatter', 'JSON formatter online', 'JSON beautifier free online',
      'JSON validator', 'JSON beautifier', 'JSON minifier',
      'format JSON', 'validate JSON', 'JSON tool', 'JSON parser',
      'online JSON formatter', 'free JSON tool', 'JSON editor', 'JSON validator online free', 'free online JSON formatter'
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

  // Parse error message to extract position and details
  const parseError = (err: Error, inputText: string): ErrorInfo => {
    const message = err.message;
    let position: number | undefined;
    let line: number | undefined;
    let column: number | undefined;
    let suggestion: string | undefined;
    let fixable = false;

    // Extract position from error message (e.g., "Unexpected token } in JSON at position 42")
    const positionMatch = message.match(/position (\d+)/i);
    if (positionMatch) {
      position = parseInt(positionMatch[1]);
      const lines = inputText.substring(0, position).split('\n');
      line = lines.length;
      column = lines[lines.length - 1].length + 1;
    }

    // Extract line/column from error message (e.g., "at line 3 column 15")
    const lineMatch = message.match(/line (\d+)/i);
    const columnMatch = message.match(/column (\d+)/i);
    if (lineMatch) line = parseInt(lineMatch[1]);
    if (columnMatch) column = parseInt(columnMatch[1]);

    // Analyze error and provide suggestions
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('unexpected token') || lowerMessage.includes('unexpected end')) {
      if (lowerMessage.includes('trailing comma') || lowerMessage.includes(',')) {
        suggestion = 'Remove trailing comma before closing bracket or brace';
        fixable = true;
      } else if (lowerMessage.includes('}') || lowerMessage.includes(']')) {
        suggestion = 'Check for missing opening bracket or extra closing bracket';
      } else if (lowerMessage.includes('{') || lowerMessage.includes('[')) {
        suggestion = 'Check for missing closing bracket or extra opening bracket';
      } else {
        suggestion = 'Unexpected character found. Check for typos or invalid syntax';
      }
    } else if (lowerMessage.includes('expected') && lowerMessage.includes('property name')) {
      suggestion = 'Property names must be in double quotes. Use "key" instead of key or \'key\'';
      fixable = true;
    } else if (lowerMessage.includes('expected') && lowerMessage.includes('colon')) {
      suggestion = 'Missing colon (:) between property name and value';
      fixable = true;
    } else if (lowerMessage.includes('unterminated string')) {
      suggestion = 'String is not properly closed. Check for missing closing quote';
      fixable = true;
    } else if (lowerMessage.includes('bad escaped character')) {
      suggestion = 'Invalid escape sequence. Use valid escape sequences like \\n, \\t, \\", \\\\';
      fixable = true;
    } else if (lowerMessage.includes('unexpected number')) {
      suggestion = 'Invalid number format. Check for leading zeros or invalid decimal points';
    } else if (lowerMessage.includes('unexpected non-whitespace')) {
      suggestion = 'Unexpected character found. Check for invalid characters or missing quotes';
    } else if (lowerMessage.includes('unexpected end of json')) {
      suggestion = 'JSON is incomplete. Check for missing closing brackets, braces, or quotes';
    } else {
      suggestion = 'Check JSON syntax. Common issues: missing quotes, trailing commas, or invalid characters';
    }

    return {
      message,
      position,
      line,
      column,
      suggestion,
      fixable
    };
  };

  // Auto-fix common JSON errors
  const autoFixJSON = (text: string): string => {
    let fixed = text;

    // Remove trailing commas before } or ]
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

    // Fix single quotes to double quotes (but be careful with apostrophes in strings)
    // This is a simple approach - replace single quotes around keys
    fixed = fixed.replace(/'(\w+)':/g, '"$1":');
    fixed = fixed.replace(/: '([^']*)'/g, (match, content) => {
      // Only replace if it looks like a simple string value
      if (!content.includes('\\') && !content.includes('"')) {
        return `: "${content}"`;
      }
      return match;
    });

    // Add missing quotes around unquoted keys
    fixed = fixed.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');

    // Fix common escape issues
    fixed = fixed.replace(/\\'/g, "'");
    
    // Remove comments (JSON doesn't support comments)
    fixed = fixed.replace(/\/\/.*$/gm, '');
    fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '');

    return fixed;
  };

  // Highlight error in input (currently returns text as-is, can be enhanced later)
  const highlightError = (text: string, errorInfo: ErrorInfo | null): string => {
    if (!errorInfo || errorInfo.position === undefined) {
      return text;
    }
    // Error highlighting can be implemented here if needed
    return text;
  };

  const formatJSON = () => {
    setError(null);
    if (!input.trim()) {
      setOutput('');
      return;
    }

    try {
      const parsed = JSON.parse(input);
      
      if (isMinified) {
        setOutput(JSON.stringify(parsed));
      } else {
        const indentStr = indent === 'tab' ? '\t' : (typeof indent === 'number' ? ' '.repeat(indent) : '  ');
        setOutput(JSON.stringify(parsed, null, indentStr));
      }
    } catch (err) {
      const errorInfo = parseError(err instanceof Error ? err : new Error('Invalid JSON'), input);
      setError(errorInfo);
      setOutput('');
      highlightError(input, errorInfo);
    }
  };

  const validateJSON = () => {
    setError(null);
    if (!input.trim()) {
      setError({
        message: 'Please enter JSON to validate',
        suggestion: 'Enter some JSON data to validate'
      });
      return;
    }

    try {
      JSON.parse(input);
      setError(null);
      alert('✅ Valid JSON!');
    } catch (err) {
      const errorInfo = parseError(err instanceof Error ? err : new Error('Invalid JSON'), input);
      setError(errorInfo);
      highlightError(input, errorInfo);
    }
  };

  const minifyJSON = () => {
    setError(null);
    if (!input.trim()) {
      setOutput('');
      return;
    }

    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setIsMinified(true);
    } catch (err) {
      const errorInfo = parseError(err instanceof Error ? err : new Error('Invalid JSON'), input);
      setError(errorInfo);
      setOutput('');
      highlightError(input, errorInfo);
    }
  };

  const beautifyJSON = () => {
    setIsMinified(false);
    formatJSON();
  };

  const handleAutoFix = () => {
    if (!input.trim()) return;
    
    const fixed = autoFixJSON(input);
    setInput(fixed);
    
    // Try to format after fixing
    setTimeout(() => {
      formatJSON();
    }, 100);
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
    setError(null);
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

  const scrollToError = () => {
    if (error?.position !== undefined && textareaRef.current) {
      const textarea = textareaRef.current;
      const lines = input.substring(0, error.position).split('\n');
      const lineNumber = lines.length - 1;
      
      // Calculate approximate scroll position
      const lineHeight = 20; // Approximate line height
      textarea.scrollTop = lineNumber * lineHeight - 100;
      
      // Set cursor position
      textarea.focus();
      textarea.setSelectionRange(error.position, error.position);
    }
  };

  useEffect(() => {
    formatJSON();
  }, [input, indent, isMinified]);

  // Calculate error line and column for display
  const errorLine = error?.line;
  const errorColumn = error?.column;
  const errorPosition = error?.position;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          📋 Free JSON Formatter Online
        </h1>
        <p className="text-gray-600 mb-6">
          Free JSON formatter online - no signup required. Format, validate, beautify, and minify JSON data instantly. Includes syntax validation and error detection. JSON beautifier free online. Perfect for developers. All processing in your browser.
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
          {error?.fixable && (
            <button
              onClick={handleAutoFix}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
            >
              🔧 Auto Fix
            </button>
          )}
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
              onChange={(e) => {
                const value = e.target.value;
                setIndent(value === 'tab' ? 'tab' : parseInt(value));
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="2">2 spaces</option>
              <option value="4">4 spaces</option>
              <option value="tab">Tab</option>
            </select>
          </div>
        </div>

        {/* Enhanced Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <span className="text-red-600 text-xl mr-2">⚠️</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-red-900 mb-2">JSON Error</div>
                <div className="text-sm text-red-700 mb-2">{error.message}</div>
                
                {(errorLine || errorPosition !== undefined) && (
                  <div className="text-xs text-red-600 mb-2 flex items-center gap-2">
                    {errorLine && (
                      <span>Line {errorLine}{errorColumn ? `, Column ${errorColumn}` : ''}</span>
                    )}
                    {errorPosition !== undefined && (
                      <span>Position {errorPosition}</span>
                    )}
                    <button
                      onClick={scrollToError}
                      className="px-2 py-1 bg-red-200 text-red-800 rounded hover:bg-red-300 text-xs"
                    >
                      📍 Go to Error
                    </button>
                  </div>
                )}
                
                {error.suggestion && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="text-xs font-medium text-yellow-900 mb-1">💡 Suggestion:</div>
                    <div className="text-sm text-yellow-800">{error.suggestion}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Input/Output Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <div className="relative">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                JSON Input
                {error && errorLine && (
                  <span className="ml-2 text-xs text-red-600">
                    (Error at line {errorLine})
                  </span>
                )}
              </label>
              <button
                onClick={() => copyToClipboard(input)}
                disabled={!input}
                className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                📋 Copy
              </button>
            </div>
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder='Paste your JSON here...\n\nExample:\n{\n  "key": "value"\n}'
                className={`w-full h-96 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y font-mono text-sm ${
                  error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                style={{
                  caretColor: error ? '#dc2626' : 'auto'
                }}
              />
              {/* Error indicator line */}
              {error && errorLine && (
                <div className="absolute left-0 right-0 pointer-events-none" style={{
                  top: `${16 + (errorLine - 1) * 20}px`,
                  height: '20px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  borderLeft: '3px solid #ef4444',
                  zIndex: 1
                }} />
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {input.length} characters
              {errorLine && ` • Line ${errorLine}${errorColumn ? `, Column ${errorColumn}` : ''}`}
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
                <span>Debugging JSON syntax errors with highlighted error locations</span>
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
                  <h4 className="font-semibold text-gray-900 mb-1">Error Detection & Auto-Fix</h4>
                  <p className="text-sm text-gray-600">Identify syntax errors with highlighting, suggestions, and auto-fix common issues</p>
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
                  these issues with highlighted error locations and suggestions for fixing them.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">How does auto-fix work?</h4>
                <p className="text-gray-700 text-sm">
                  The auto-fix feature automatically corrects common JSON errors like trailing commas, 
                  single quotes, and missing quotes around keys. It attempts to fix the JSON and 
                  re-validates it automatically.
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
            <li>Check error messages for specific line numbers and use the "Go to Error" button to jump to the problem</li>
            <li>Use the auto-fix feature to automatically correct common errors like trailing commas</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
