import { useState, useEffect } from 'react';
import { format } from 'sql-formatter';
import { useSEO } from '../../utils/seo';

export default function SQLFormatter() {
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [indent, setIndent] = useState<number>(2);
  const [language, setLanguage] = useState<string>('sql');
  const [isMinified, setIsMinified] = useState<boolean>(false);

  useSEO({
    title: 'Free SQL Formatter & Beautifier - Format SQL Queries Online | SQL Query Formatter',
    description: 'Free online SQL formatter and beautifier. Format SQL queries with proper indentation, syntax highlighting, and validation. Supports MySQL, PostgreSQL, SQL Server, and more. No registration required.',
    url: '/resources/utility-tools/sql-formatter',
    keywords: [
      'SQL formatter', 'SQL beautifier', 'format SQL', 'SQL query formatter',
      'SQL prettifier', 'SQL validator', 'online SQL formatter', 'free SQL tool',
      'SQL formatter online', 'beautify SQL', 'SQL code formatter'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'SQL Formatter & Beautifier',
      'description': 'Free online SQL formatter and beautifier with syntax validation and multiple database support.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/sql-formatter',
      'applicationCategory': 'DeveloperApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Format SQL queries with proper indentation',
        'Support for MySQL, PostgreSQL, SQL Server',
        'Minify SQL queries',
        'Syntax validation',
        'Copy to clipboard',
        'Real-time formatting'
      ]
    }
  });

  const formatSQL = () => {
    setError('');
    if (!input.trim()) {
      setOutput('');
      return;
    }

    try {
      if (isMinified) {
        // Minify SQL by removing extra whitespace
        setOutput(input.replace(/\s+/g, ' ').trim());
      } else {
        const formatted = format(input, {
          language: language as any,
          indent: ' '.repeat(indent),
          uppercase: false,
          linesBetweenQueries: 2,
        });
        setOutput(formatted);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid SQL';
      setError(errorMessage);
      setOutput('');
    }
  };

  useEffect(() => {
    if (input.trim()) {
      formatSQL();
    } else {
      setOutput('');
      setError('');
    }
  }, [input, indent, language, isMinified]);

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SQL Formatter</h1>
        <p className="text-gray-600 mb-6">
          Format and beautify your SQL queries with proper indentation and syntax highlighting.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Input Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                SQL Query Input
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
              placeholder="Paste your SQL query here..."
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
                Formatted SQL
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
              placeholder="Formatted SQL will appear here..."
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Database Dialect
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="sql">Standard SQL</option>
              <option value="mysql">MySQL</option>
              <option value="postgresql">PostgreSQL</option>
              <option value="mariadb">MariaDB</option>
              <option value="sqlite">SQLite</option>
              <option value="mssql">SQL Server</option>
              <option value="db2">DB2</option>
              <option value="plsql">PL/SQL</option>
            </select>
          </div>

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
              Minify SQL
            </label>
          </div>
        </div>
      </div>

      {/* SEO Content */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">About SQL Formatter</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 mb-4">
            SQL Formatter is a free online tool that formats and beautifies SQL queries 
            with proper indentation, making them more readable and maintainable.
          </p>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Features</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Format SQL queries with proper indentation</li>
            <li>Support for multiple database dialects (MySQL, PostgreSQL, SQL Server, etc.)</li>
            <li>Minify SQL queries to reduce file size</li>
            <li>Syntax validation and error detection</li>
            <li>Customizable indentation (1-8 spaces)</li>
            <li>Copy formatted SQL to clipboard</li>
          </ul>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Use Cases</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Format messy SQL queries for better readability</li>
            <li>Prepare SQL queries for documentation</li>
            <li>Standardize SQL code style across teams</li>
            <li>Minify SQL for production deployment</li>
            <li>Learn SQL formatting best practices</li>
            <li>Debug SQL query structure</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

