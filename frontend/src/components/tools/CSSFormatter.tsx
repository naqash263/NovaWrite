import { useState, useEffect } from 'react';
import { useSEO } from '../../utils/seo';

export default function CSSFormatter() {
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [indent, setIndent] = useState<number>(2);
  const [isMinified, setIsMinified] = useState<boolean>(false);

  useSEO({
    title: 'Free CSS Formatter & Beautifier - Format CSS Online | CSS Code Formatter',
    description: 'Free online CSS formatter and beautifier. Format CSS code with proper indentation, minify CSS, and validate syntax. Perfect for developers and web designers. No registration required.',
    url: '/resources/utility-tools/css-formatter',
    keywords: [
      'CSS formatter', 'CSS beautifier', 'format CSS', 'CSS code formatter',
      'CSS prettifier', 'CSS minifier', 'online CSS formatter', 'free CSS tool',
      'CSS formatter online', 'beautify CSS', 'minify CSS'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'CSS Formatter & Beautifier',
      'description': 'Free online CSS formatter, beautifier, and minifier with syntax validation.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/css-formatter',
      'applicationCategory': 'DeveloperApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Format CSS with proper indentation',
        'Minify CSS to reduce file size',
        'Syntax validation',
        'Copy to clipboard',
        'Real-time formatting'
      ]
    }
  });

  const formatCSS = () => {
    setError('');
    if (!input.trim()) {
      setOutput('');
      return;
    }

    try {
      if (isMinified) {
        // Minify CSS
        const minified = input
          .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .replace(/;\s*}/g, '}') // Remove semicolon before closing brace
          .replace(/\s*{\s*/g, '{') // Remove spaces around opening brace
          .replace(/;\s*/g, ';') // Remove spaces after semicolon
          .replace(/\s*:\s*/g, ':') // Remove spaces around colon
          .replace(/\s*,\s*/g, ',') // Remove spaces around comma
          .trim();
        setOutput(minified);
      } else {
        // Format CSS
        let formatted = input
          .replace(/\/\*[\s\S]*?\*\//g, (match) => match) // Keep comments
          .replace(/\s*{\s*/g, ' {\n')
          .replace(/;\s*/g, ';\n')
          .replace(/\s*}\s*/g, '\n}\n')
          .replace(/\s*:\s*/g, ': ')
          .replace(/\s*,\s*/g, ', ');

        // Apply indentation
        const lines = formatted.split('\n');
        let indentLevel = 0;
        const indented = lines.map(line => {
          const trimmed = line.trim();
          if (!trimmed) return '';
          
          if (trimmed.includes('}')) {
            indentLevel = Math.max(0, indentLevel - 1);
          }
          
          const result = ' '.repeat(indentLevel * indent) + trimmed;
          
          if (trimmed.includes('{') && !trimmed.includes('}')) {
            indentLevel++;
          }
          
          return result;
        }).filter(line => line).join('\n');

        setOutput(indented);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid CSS';
      setError(errorMessage);
      setOutput('');
    }
  };

  useEffect(() => {
    if (input.trim()) {
      formatCSS();
    } else {
      setOutput('');
      setError('');
    }
  }, [input, indent, isMinified]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (err) {
      alert('Failed to copy. Please select and copy manually.');
    }
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">CSS Formatter</h1>
        <p className="text-gray-600 mb-6">
          Format and beautify your CSS code with proper indentation, or minify it for production.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Input Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                CSS Code Input
              </label>
              <button
                onClick={clearAll}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear All
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your CSS code here..."
              className="w-full h-96 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
            <div className="text-xs text-gray-500 mt-1">
              {input.length} characters
            </div>
          </div>

          {/* Output Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Formatted CSS
              </label>
              {output && (
                <button
                  onClick={() => copyToClipboard(output)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Copy
                </button>
              )}
            </div>
            <textarea
              value={output}
              readOnly
              placeholder="Formatted CSS will appear here..."
              className="w-full h-96 p-4 border border-gray-300 rounded-lg resize-none bg-gray-50 font-mono text-sm"
            />
            {error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Indentation: {indent} spaces
            </label>
            <input
              type="range"
              min="1"
              max="8"
              value={indent}
              onChange={(e) => setIndent(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="minify"
              checked={isMinified}
              onChange={(e) => setIsMinified(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="minify" className="text-sm text-gray-700">
              Minify CSS
            </label>
          </div>
        </div>
      </div>

      {/* SEO Content */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">About CSS Formatter</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 mb-4">
            CSS Formatter is a free online tool that formats and beautifies CSS code 
            with proper indentation, making it more readable and maintainable.
          </p>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Features</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Format CSS with proper indentation</li>
            <li>Minify CSS to reduce file size</li>
            <li>Preserve CSS comments</li>
            <li>Customizable indentation (1-8 spaces)</li>
            <li>Copy formatted CSS to clipboard</li>
            <li>Real-time formatting</li>
          </ul>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Use Cases</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Format messy CSS code for better readability</li>
            <li>Prepare CSS for documentation</li>
            <li>Standardize CSS code style across teams</li>
            <li>Minify CSS for production deployment</li>
            <li>Learn CSS formatting best practices</li>
            <li>Debug CSS structure</li>
          </ul>
        </div>
      </div>
    </div>
  );
}


