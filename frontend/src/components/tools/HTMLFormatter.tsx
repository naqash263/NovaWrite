import { useState, useEffect } from 'react';
import { useSEO } from '../../utils/seo';

export default function HTMLFormatter() {
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [indent, setIndent] = useState<number>(2);
  const [isMinified, setIsMinified] = useState<boolean>(false);

  useSEO({
    title: 'Free HTML Formatter & Beautifier - Format HTML Online | HTML Code Formatter',
    description: 'Free online HTML formatter and beautifier. Format HTML code with proper indentation, minify HTML, and validate syntax. Perfect for developers and web designers. No registration required.',
    url: '/resources/utility-tools/html-formatter',
    keywords: [
      'HTML formatter', 'HTML beautifier', 'format HTML', 'HTML code formatter',
      'HTML prettifier', 'HTML minifier', 'online HTML formatter', 'free HTML tool',
      'HTML formatter online', 'beautify HTML', 'minify HTML'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'HTML Formatter & Beautifier',
      'description': 'Free online HTML formatter, beautifier, and minifier with syntax validation.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/html-formatter',
      'applicationCategory': 'DeveloperApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Format HTML with proper indentation',
        'Minify HTML to reduce file size',
        'Preserve HTML comments',
        'Copy to clipboard',
        'Real-time formatting'
      ]
    }
  });

  const formatHTML = () => {
    setError('');
    if (!input.trim()) {
      setOutput('');
      return;
    }

    try {
      if (isMinified) {
        // Minify HTML
        const minified = input
          .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .replace(/>\s+</g, '><') // Remove spaces between tags
          .trim();
        setOutput(minified);
      } else {
        // Format HTML
        let formatted = input
          .replace(/<!--[\s\S]*?-->/g, (match) => match) // Keep comments
          .replace(/>\s+</g, '>\n<') // Add newlines between tags
          .replace(/\s+/g, ' ') // Normalize spaces
          .trim();

        // Apply indentation
        const lines = formatted.split('\n');
        let indentLevel = 0;
        const indented = lines.map(line => {
          const trimmed = line.trim();
          if (!trimmed) return '';
          
          // Decrease indent for closing tags
          if (trimmed.startsWith('</')) {
            indentLevel = Math.max(0, indentLevel - 1);
          }
          
          const result = ' '.repeat(indentLevel * indent) + trimmed;
          
          // Increase indent for opening tags (but not self-closing or void elements)
          if (trimmed.startsWith('<') && !trimmed.startsWith('</') && 
              !trimmed.endsWith('/>') && 
              !trimmed.match(/<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)/i)) {
            indentLevel++;
          }
          
          return result;
        }).filter(line => line).join('\n');

        setOutput(indented);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid HTML';
      setError(errorMessage);
      setOutput('');
    }
  };

  useEffect(() => {
    if (input.trim()) {
      formatHTML();
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">HTML Formatter</h1>
        <p className="text-gray-600 mb-6">
          Format and beautify your HTML code with proper indentation, or minify it for production.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Input Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                HTML Code Input
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
              placeholder="Paste your HTML code here..."
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
                Formatted HTML
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
              placeholder="Formatted HTML will appear here..."
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
              Minify HTML
            </label>
          </div>
        </div>
      </div>

      {/* SEO Content */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">About HTML Formatter</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 mb-4">
            HTML Formatter is a free online tool that formats and beautifies HTML code 
            with proper indentation, making it more readable and maintainable.
          </p>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Features</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Format HTML with proper indentation</li>
            <li>Minify HTML to reduce file size</li>
            <li>Preserve HTML comments</li>
            <li>Customizable indentation (1-8 spaces)</li>
            <li>Copy formatted HTML to clipboard</li>
            <li>Real-time formatting</li>
          </ul>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Use Cases</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Format messy HTML code for better readability</li>
            <li>Prepare HTML for documentation</li>
            <li>Standardize HTML code style across teams</li>
            <li>Minify HTML for production deployment</li>
            <li>Learn HTML formatting best practices</li>
            <li>Debug HTML structure</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

