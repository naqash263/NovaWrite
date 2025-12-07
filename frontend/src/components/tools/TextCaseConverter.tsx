import { useState, useEffect } from 'react';
import { useSEO } from '../../utils/seo';

type CaseType = 
  | 'lowercase' 
  | 'uppercase' 
  | 'title' 
  | 'sentence' 
  | 'camel' 
  | 'pascal' 
  | 'snake' 
  | 'kebab' 
  | 'screaming-snake' 
  | 'alternating' 
  | 'inverse';

export default function TextCaseConverter() {
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [selectedCase, setSelectedCase] = useState<CaseType>('lowercase');

  useSEO({
    title: 'Free Text Case Converter Online - Uppercase, Lowercase, camelCase Converter | No Signup',
    description: 'Free text case converter online - no signup required. Convert text to uppercase, lowercase, title case, camelCase, PascalCase, snake_case, kebab-case, and more. Instant conversion with copy to clipboard. Perfect for developers and writers.',
    url: '/resources/utility-tools/text-case-converter',
    keywords: [
      'free text case converter online', 'text case converter', 'free text case converter', 'text case converter online',
      'case converter online', 'uppercase lowercase converter', 'camelCase converter',
      'snake_case converter', 'kebab-case converter', 'text case tool', 'case changer',
      'text transformer', 'string case converter', 'online case converter', 'free case converter'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Text Case Converter',
      'description': 'Free online text case converter. Convert text to various case formats.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/text-case-converter',
      'applicationCategory': 'UtilityApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Uppercase, lowercase, title case',
        'camelCase, PascalCase',
        'snake_case, kebab-case, SCREAMING_SNAKE_CASE',
        'Sentence case, alternating case',
        'Copy to clipboard'
      ]
    }
  });

  const convertCase = (text: string, caseType: CaseType): string => {
    if (!text) return '';

    switch (caseType) {
      case 'lowercase':
        return text.toLowerCase();
      
      case 'uppercase':
        return text.toUpperCase();
      
      case 'title':
        return text
          .toLowerCase()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      
      case 'sentence':
        return text
          .toLowerCase()
          .split('. ')
          .map(sentence => sentence.charAt(0).toUpperCase() + sentence.slice(1))
          .join('. ');
      
      case 'camel':
        return text
          .toLowerCase()
          .replace(/[^a-z0-9]+(.)/g, (_, char) => char.toUpperCase())
          .replace(/^[A-Z]/, char => char.toLowerCase());
      
      case 'pascal':
        return text
          .toLowerCase()
          .replace(/[^a-z0-9]+(.)/g, (_, char) => char.toUpperCase())
          .replace(/^[a-z]/, char => char.toUpperCase());
      
      case 'snake':
        return text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');
      
      case 'kebab':
        return text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      
      case 'screaming-snake':
        return text
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');
      
      case 'alternating':
        return text
          .split('')
          .map((char, index) => 
            index % 2 === 0 ? char.toLowerCase() : char.toUpperCase()
          )
          .join('');
      
      case 'inverse':
        return text
          .split('')
          .map(char => {
            if (char === char.toUpperCase()) {
              return char.toLowerCase();
            } else if (char === char.toLowerCase()) {
              return char.toUpperCase();
            }
            return char;
          })
          .join('');
      
      default:
        return text;
    }
  };

  useEffect(() => {
    if (inputText) {
      setOutputText(convertCase(inputText, selectedCase));
    } else {
      setOutputText('');
    }
  }, [inputText, selectedCase]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Text copied to clipboard!');
    } catch (err) {
      alert('Failed to copy text. Please select and copy manually.');
    }
  };

  const caseOptions: { value: CaseType; label: string; description: string }[] = [
    { value: 'lowercase', label: 'lowercase', description: 'all lowercase letters' },
    { value: 'uppercase', label: 'UPPERCASE', description: 'ALL UPPERCASE LETTERS' },
    { value: 'title', label: 'Title Case', description: 'First Letter Of Each Word' },
    { value: 'sentence', label: 'Sentence case', description: 'First letter of sentence' },
    { value: 'camel', label: 'camelCase', description: 'firstWordLowercase' },
    { value: 'pascal', label: 'PascalCase', description: 'FirstWordUppercase' },
    { value: 'snake', label: 'snake_case', description: 'words_separated_by_underscores' },
    { value: 'kebab', label: 'kebab-case', description: 'words-separated-by-hyphens' },
    { value: 'screaming-snake', label: 'SCREAMING_SNAKE_CASE', description: 'WORDS_IN_UPPERCASE_WITH_UNDERSCORES' },
    { value: 'alternating', label: 'AlTeRnAtInG cAsE', description: 'alternating upper and lower' },
    { value: 'inverse', label: 'iNVERSE cASE', description: 'invert current case' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Free Text Case Converter Online</h1>
        <p className="text-gray-600 mb-6">
          Free text case converter online - no signup required. Convert text between different case formats instantly. Perfect for developers, writers, and content creators. Supports 11+ case formats including camelCase, snake_case, and kebab-case.
        </p>

        <div className="space-y-6">
          {/* Case Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Case Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {caseOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedCase(option.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    selectedCase === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{option.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Input Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Input Text
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter text to convert..."
              className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{inputText.length} characters</span>
              <button
                onClick={() => setInputText('')}
                className="text-blue-600 hover:text-blue-700"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Output Text */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Converted Text ({caseOptions.find(o => o.value === selectedCase)?.label})
              </label>
              <button
                onClick={() => copyToClipboard(outputText)}
                disabled={!outputText}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Copy
              </button>
            </div>
            <textarea
              value={outputText}
              readOnly
              placeholder="Converted text will appear here..."
              className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none bg-gray-50 font-mono"
            />
            <div className="text-xs text-gray-500 mt-1">
              {outputText.length} characters
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setInputText('Hello World Example Text')}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              Load Example
            </button>
            <button
              onClick={() => {
                setInputText(outputText);
                setOutputText('');
              }}
              disabled={!outputText}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Use Output as Input
            </button>
          </div>
        </div>
      </div>

      {/* SEO Content */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">About Text Case Converter</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 mb-4">
            Text case converter helps you transform text between different case formats instantly. 
            Whether you're coding, writing, or formatting content, this tool makes case conversion quick and easy.
          </p>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Supported Case Formats</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>lowercase</strong> - All letters in lowercase</li>
            <li><strong>UPPERCASE</strong> - All letters in uppercase</li>
            <li><strong>Title Case</strong> - First letter of each word capitalized</li>
            <li><strong>Sentence case</strong> - First letter of sentence capitalized</li>
            <li><strong>camelCase</strong> - First word lowercase, subsequent words capitalized</li>
            <li><strong>PascalCase</strong> - First letter of each word capitalized</li>
            <li><strong>snake_case</strong> - Words separated by underscores</li>
            <li><strong>kebab-case</strong> - Words separated by hyphens</li>
            <li><strong>SCREAMING_SNAKE_CASE</strong> - Uppercase with underscores</li>
            <li><strong>AlTeRnAtInG cAsE</strong> - Alternating upper and lower case</li>
            <li><strong>iNVERSE cASE</strong> - Invert the current case</li>
          </ul>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Use Cases</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Convert variable names for programming (camelCase, snake_case)</li>
            <li>Format titles and headings (Title Case)</li>
            <li>Normalize text data (lowercase, uppercase)</li>
            <li>Create CSS class names (kebab-case)</li>
            <li>Format API endpoints and URLs</li>
            <li>Prepare text for different coding conventions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

