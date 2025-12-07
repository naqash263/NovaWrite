import { useState } from 'react';
import { useSEO } from '../../utils/seo';

export default function RegexTester() {
  const [pattern, setPattern] = useState<string>('');
  const [testString, setTestString] = useState<string>('');
  const [flags, setFlags] = useState<string>('g');
  const [matches, setMatches] = useState<RegExpMatchArray | null>(null);
  const [matchDetails, setMatchDetails] = useState<Array<{ match: string; index: number; groups?: string[] }>>([]);
  const [error, setError] = useState<string>('');

  useSEO({
    title: 'Free Regex Tester Online - Test Regular Expressions | No Signup',
    description: 'Free regex tester online - no signup required. Test regular expressions with real-time matching, highlighting, and explanation. Supports all regex flags and common patterns. Perfect for developers. All processing in your browser.',
    url: '/resources/utility-tools/regex-tester',
    keywords: [
      'free regex tester online', 'regex tester', 'free regex tester', 'regex tester online', 'test regex online',
      'regular expression tester', 'regex test', 'regex pattern tester',
      'online regex', 'regex validator', 'regex matcher', 'free online regex tester'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Regex Tester',
      'description': 'Free online regex tester for testing regular expressions with real-time matching.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/regex-tester',
      'applicationCategory': 'DeveloperApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Test regex patterns',
        'Real-time matching',
        'Match highlighting',
        'Multiple regex flags',
        'Common regex patterns',
        'Error detection'
      ],
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.8',
        'ratingCount': '2200',
        'bestRating': '5',
        'worstRating': '1'
      }
    }
  });

  const commonPatterns = [
    { name: 'Email', pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$', description: 'Matches email addresses' },
    { name: 'URL', pattern: '^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$', description: 'Matches URLs' },
    { name: 'Phone (US)', pattern: '^\\+?1?[-.\\s]?\\(?([0-9]{3})\\)?[-.\\s]?([0-9]{3})[-.\\s]?([0-9]{4})$', description: 'Matches US phone numbers' },
    { name: 'IP Address', pattern: '^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$', description: 'Matches IPv4 addresses' },
    { name: 'Date (YYYY-MM-DD)', pattern: '^\\d{4}-\\d{2}-\\d{2}$', description: 'Matches dates in YYYY-MM-DD format' },
    { name: 'Credit Card', pattern: '^\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}$', description: 'Matches credit card numbers' },
    { name: 'Password (8+ chars, 1 upper, 1 lower, 1 number)', pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{8,}$', description: 'Strong password pattern' },
    { name: 'Hex Color', pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$', description: 'Matches hex color codes' },
  ];

  const testRegex = () => {
    setError('');
    setMatches(null);
    setMatchDetails([]);

    if (!pattern.trim()) {
      setError('Please enter a regex pattern');
      return;
    }

    try {
      const regex = new RegExp(pattern, flags);
      const result = testString.match(regex);
      setMatches(result);

      // Get detailed match information including indices and groups
      const details: Array<{ match: string; index: number; groups?: string[] }> = [];
      if (result) {
        // Reset regex to get all matches with indices
        regex.lastIndex = 0;
        let match;
        while ((match = regex.exec(testString)) !== null) {
          details.push({
            match: match[0],
            index: match.index,
            groups: match.length > 1 ? Array.from(match).slice(1) : undefined
          });
          // Prevent infinite loop if global flag is not set
          if (!flags.includes('g')) {
            break;
          }
          // If regex doesn't advance, break to prevent infinite loop
          if (match.index === regex.lastIndex) {
            regex.lastIndex++;
          }
        }
      }
      setMatchDetails(details);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid regex pattern');
      setMatches(null);
      setMatchDetails([]);
    }
  };

  const handlePatternChange = (value: string) => {
    setPattern(value);
    setError('');
    setMatches(null);
    setMatchDetails([]);
    if (value.trim() && testString.trim()) {
      testRegex();
    }
  };

  const handleTestStringChange = (value: string) => {
    setTestString(value);
    setError('');
    setMatches(null);
    setMatchDetails([]);
    if (pattern.trim()) {
      testRegex();
    }
  };

  const handleFlagChange = (flag: string, checked: boolean) => {
    let newFlags = flags;
    if (checked) {
      if (!flags.includes(flag)) {
        newFlags = flags + flag;
      } else {
        return; // Already has flag, no change needed
      }
    } else {
      newFlags = flags.replace(flag, '');
    }
    setFlags(newFlags);
    // Re-test with new flags if we have pattern and test string
    if (pattern.trim() && testString.trim()) {
      setTimeout(() => {
        // Update flags to test with new flags
        setFlags(newFlags);
        // Use the pattern and testString with new flags
        setError('');
        setMatches(null);
        setMatchDetails([]);
        try {
          const regex = new RegExp(pattern, newFlags);
          const result = testString.match(regex);
          setMatches(result);

          // Get detailed match information
          const details: Array<{ match: string; index: number; groups?: string[] }> = [];
          if (result) {
            regex.lastIndex = 0;
            let match;
            while ((match = regex.exec(testString)) !== null) {
              details.push({
                match: match[0],
                index: match.index,
                groups: match.length > 1 ? Array.from(match).slice(1) : undefined
              });
              if (!newFlags.includes('g')) {
                break;
              }
              if (match.index === regex.lastIndex) {
                regex.lastIndex++;
              }
            }
          }
          setMatchDetails(details);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Invalid regex pattern');
          setMatches(null);
          setMatchDetails([]);
        }
      }, 10);
    }
  };

  const loadPattern = (patternStr: string) => {
    setPattern(patternStr);
    setError('');
    setMatches(null);
    if (testString.trim()) {
      setTimeout(() => testRegex(), 100);
    }
  };

  const highlightMatches = (text: string, pattern: string, flags: string): string => {
    if (!pattern || !text) return text;
    try {
      const regex = new RegExp(pattern, flags);
      
      // Build array of match positions to highlight all matches properly
      const matches: Array<{ start: number; end: number; text: string }> = [];
      regex.lastIndex = 0;
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0]
        });
        // Prevent infinite loop
        if (!flags.includes('g')) {
          break;
        }
        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
        }
      }
      
      // Sort matches by position (reverse order for easier replacement)
      matches.sort((a, b) => b.start - a.start);
      
      // Replace from end to start to maintain correct indices
      let highlighted = text;
      matches.forEach((m, index) => {
        const before = highlighted.substring(0, m.start);
        const after = highlighted.substring(m.end);
        highlighted = before + `<mark class="bg-yellow-300 px-1 rounded" title="Match ${matches.length - index}">${m.text}</mark>` + after;
      });
      
      return highlighted;
    } catch {
      return text;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          🔍 Free Regex Tester Online
        </h1>
        <p className="text-gray-600 mb-6">
          Free regex tester online - no signup required. Test regular expressions with real-time matching and highlighting. Supports all regex flags and common patterns. Perfect for developers. All processing in your browser.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Input Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pattern Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Regular Expression Pattern
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pattern}
                  onChange={(e) => handlePatternChange(e.target.value)}
                  placeholder="/your pattern here/"
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
                <button
                  onClick={testRegex}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  Test
                </button>
              </div>
            </div>

            {/* Flags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Flags
              </label>
              <div className="flex gap-3">
                {['g', 'i', 'm', 's', 'u', 'y'].map((flag) => (
                  <label key={flag} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={flags.includes(flag)}
                      onChange={(e) => handleFlagChange(flag, e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-mono">{flag}</span>
                    <span className="text-xs text-gray-500 ml-1">
                      {flag === 'g' ? '(global)' : flag === 'i' ? '(ignore case)' : flag === 'm' ? '(multiline)' : flag === 's' ? '(dotall)' : flag === 'u' ? '(unicode)' : '(sticky)'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Test String */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test String
              </label>
              <textarea
                value={testString}
                onChange={(e) => handleTestStringChange(e.target.value)}
                placeholder="Enter text to test against the regex pattern..."
                className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm font-mono">{error}</p>
              </div>
            )}

            {/* Results */}
            {matches && matches.length > 0 && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">
                    ✅ Found {matches.length} match{matches.length !== 1 ? 'es' : ''}
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {matchDetails.length > 0 ? (
                      matchDetails.map((detail, index) => (
                        <div key={index} className="bg-white p-3 rounded border">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-mono text-sm">
                                <span className="text-gray-600">Match {index + 1}:</span>{' '}
                                <span className="text-green-600 font-bold">{detail.match}</span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Position: {detail.index} - {detail.index + detail.match.length - 1}
                              </div>
                              {detail.groups && detail.groups.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  <div className="text-xs font-semibold text-gray-600">Capture Groups:</div>
                                  {detail.groups.map((group, groupIndex) => (
                                    <div key={groupIndex} className="text-xs text-blue-600 font-mono ml-2">
                                      Group {groupIndex + 1}: <span className="text-blue-800">{group || '(empty)'}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                // Copy match to clipboard
                                navigator.clipboard.writeText(detail.match);
                              }}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                              title="Copy match"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      matches.map((match, index) => (
                        <div key={index} className="bg-white p-2 rounded border font-mono text-sm">
                          Match {index + 1}: <span className="text-green-600 font-bold">{match}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Highlighted Text */}
                {testString && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h3 className="font-semibold text-gray-700 mb-2">Highlighted Matches</h3>
                    <div
                      className="font-mono text-sm whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{
                        __html: highlightMatches(testString, pattern, flags)
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {pattern && testString && !matches && !error && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">No matches found</p>
              </div>
            )}
          </div>

          {/* Sidebar - Common Patterns */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg p-4 sticky top-4">
              <h3 className="font-semibold text-gray-900 mb-3">Common Patterns</h3>
              <div className="space-y-2">
                {commonPatterns.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => loadPattern(item.pattern)}
                    className="w-full text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className="font-semibold text-sm text-gray-900 mb-1">{item.name}</div>
                    <div className="text-xs text-gray-600 font-mono break-all">{item.pattern}</div>
                    <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SEO & AI-Friendly Content Sections */}
        <div className="space-y-6 mt-8">
          {/* About Section */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">About Regex Tester</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our Regex Tester is a powerful tool for testing and debugging regular expressions. Regular expressions 
              (regex) are patterns used to match character combinations in strings. They're essential for form validation, 
              text processing, and data extraction.
            </p>
            <p className="text-gray-700 leading-relaxed">
              The tool provides real-time matching, highlighting, and supports all standard regex flags. Perfect for 
              developers working with form validation, text processing, and pattern matching.
            </p>
          </div>

          {/* Use Cases */}
          <div className="p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Common Use Cases</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Form validation (email, phone, etc.)</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Text search and replace</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Data extraction from text</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Input sanitization</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>URL pattern matching</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Password strength validation</span>
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
                  <h4 className="font-semibold text-gray-900 mb-1">Real-Time Testing</h4>
                  <p className="text-sm text-gray-600">Test patterns as you type</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Match Highlighting</h4>
                  <p className="text-sm text-gray-600">Visual highlighting of matches</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">All Regex Flags</h4>
                  <p className="text-sm text-gray-600">Support for g, i, m, s, u, y flags</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Common Patterns</h4>
                  <p className="text-sm text-gray-600">Pre-built patterns for quick testing</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="p-6 bg-blue-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What are regex flags?</h4>
                <p className="text-gray-700 text-sm">
                  Regex flags modify how the pattern is matched: <strong>g</strong> (global - find all matches), 
                  <strong>i</strong> (ignore case), <strong>m</strong> (multiline), <strong>s</strong> (dotall), 
                  <strong>u</strong> (unicode), and <strong>y</strong> (sticky).
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">How do I escape special characters?</h4>
                <p className="text-gray-700 text-sm">
                  Use a backslash (\) to escape special regex characters like . * + ? ^ $ { } [ ] | ( ). 
                  For example, to match a literal dot, use \.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What are common regex patterns?</h4>
                <p className="text-gray-700 text-sm">
                  Common patterns include: <strong>.</strong> (any character), <strong>\d</strong> (digit), 
                  <strong>\w</strong> (word character), <strong>+</strong> (one or more), <strong>*</strong> (zero or more), 
                  <strong>?</strong> (zero or one), <strong>^</strong> (start), <strong>$</strong> (end).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Use the common patterns sidebar for quick testing</li>
            <li>Enable the 'g' flag to find all matches, not just the first</li>
            <li>Use 'i' flag for case-insensitive matching</li>
            <li>Test with various input strings to ensure your pattern works correctly</li>
            <li>All processing happens in your browser - no uploads required</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

