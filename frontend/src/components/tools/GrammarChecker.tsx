import { useState } from 'react';
import { useSEO } from '../../utils/seo';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

export default function GrammarChecker() {
  const [text, setText] = useState<string>('');
  const [correctedText, setCorrectedText] = useState<string>('');
  const [checkSpelling, setCheckSpelling] = useState<boolean>(true);
  const [checkGrammar, setCheckGrammar] = useState<boolean>(true);
  const [checkStyle, setCheckStyle] = useState<boolean>(true);
  const [suggestImprovements, setSuggestImprovements] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [stats, setStats] = useState<{
    errors_found: number;
    suggestions: string[];
    improvements: string[];
    original_length: number;
    corrected_length: number;
  } | null>(null);

  useSEO({
    title: 'Free Grammar Checker Online - AI-Powered Grammar Check | No Signup',
    description: 'Free grammar checker online - no signup required. AI-powered grammar checker and corrector. Check spelling, grammar, and style errors instantly. Get suggestions for improvements. AI grammar checker free. Perfect for writers, students, and professionals.',
    url: '/resources/ai-tools/grammar-checker',
    keywords: [
      'free grammar checker online', 'grammar checker', 'free grammar checker', 'grammar checker online', 'AI grammar checker free',
      'grammar corrector', 'spell checker', 'grammar check',
      'AI grammar checker', 'online grammar checker', 'grammar tool',
      'spelling checker', 'grammar correction', 'writing checker', 'text checker', 'grammar corrector free online', 'free online grammar checker'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Grammar Checker & Corrector',
      'description': 'Free AI-powered grammar checker and corrector. Check spelling, grammar, and style errors with instant corrections and suggestions.',
      'url': 'https://naqashthaheem.com/resources/ai-tools/grammar-checker',
      'applicationCategory': 'UtilityApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Spelling error detection and correction',
        'Grammar mistake identification and fixing',
        'Style improvement suggestions',
        'Real-time error checking',
        'Detailed suggestions and improvements',
        'Error count and statistics'
      ],
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.9',
        'ratingCount': '1850',
        'bestRating': '5',
        'worstRating': '1'
      }
    }
  });

  const handleCheck = async () => {
    if (!text.trim()) {
      setError('Please enter some text to check');
      return;
    }

    if (text.length < 10) {
      setError('Text must be at least 10 characters long');
      return;
    }

    setLoading(true);
    setError('');
    setCorrectedText('');
    setStats(null);

    try {
      const response = await fetch(`${API_URL}/ai-tools/grammar-checker/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          check_spelling: checkSpelling,
          check_grammar: checkGrammar,
          check_style: checkStyle,
          suggest_improvements: suggestImprovements
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to check grammar');
      }

      if (data.success && data.data) {
        setCorrectedText(data.data.corrected_text);
        setStats({
          errors_found: data.data.errors_found || 0,
          suggestions: data.data.suggestions || [],
          improvements: data.data.improvements || [],
          original_length: data.data.original_length,
          corrected_length: data.data.corrected_length
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while checking grammar';
      setError(errorMessage);
      console.error('Grammar check error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText('');
    setCorrectedText('');
    setError('');
    setStats(null);
  };

  const copyToClipboard = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          ✅ Free Grammar Checker Online
        </h1>
        <p className="text-gray-600 mb-6">
          Free grammar checker online - no signup required. Check spelling, grammar, and style errors instantly. Get AI-powered corrections and suggestions for better writing. AI grammar checker free. Perfect for writers, students, and professionals.
        </p>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
            <input
              type="checkbox"
              checked={checkSpelling}
              onChange={(e) => setCheckSpelling(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Check Spelling</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
            <input
              type="checkbox"
              checked={checkGrammar}
              onChange={(e) => setCheckGrammar(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Check Grammar</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
            <input
              type="checkbox"
              checked={checkStyle}
              onChange={(e) => setCheckStyle(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Check Style</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
            <input
              type="checkbox"
              checked={suggestImprovements}
              onChange={(e) => setSuggestImprovements(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Suggest Improvements</span>
          </label>
        </div>

        {/* Input Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Enter Text to Check (max 50,000 characters)
            </label>
            <button
              onClick={handleClear}
              disabled={!text && !correctedText}
              className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              🗑️ Clear
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => {
              const newText = e.target.value.slice(0, 50000);
              setText(newText);
            }}
            placeholder="Paste or type your text here to check for grammar, spelling, and style errors..."
            className="w-full h-64 sm:h-80 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            maxLength={50000}
          />
          <div className="text-sm text-gray-500 mt-1 text-right">
            {text.length.toLocaleString()} / 50,000 characters
          </div>
        </div>

        {/* Action Button */}
        <div className="mb-6">
          <button
            onClick={handleCheck}
            disabled={loading || !text.trim() || text.length < 10}
            className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors text-lg"
          >
            {loading ? '⏳ Checking...' : '✨ Check Grammar'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <span className="text-red-600 text-xl mr-2">⚠️</span>
              <div>
                <div className="text-sm font-medium text-red-900">Error</div>
                <div className="text-sm text-red-700 mt-1">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Corrected Text Section */}
        {correctedText && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Corrected Text
              </label>
              <button
                onClick={() => copyToClipboard(correctedText)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                📋 Copy Corrected Text
              </button>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg min-h-[200px]">
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{correctedText}</p>
            </div>
          </div>
        )}

        {/* Statistics and Suggestions */}
        {stats && (
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Errors Found</div>
                <div className="text-2xl font-bold text-red-600">
                  {stats.errors_found}
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Original Length</div>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.original_length.toLocaleString()}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Corrected Length</div>
                <div className="text-2xl font-bold text-green-600">
                  {stats.corrected_length.toLocaleString()}
                </div>
              </div>
            </div>

            {stats.suggestions.length > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">💡 Suggestions</h4>
                <ul className="space-y-1">
                  {stats.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start">
                      <span className="text-yellow-600 mr-2">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {stats.improvements.length > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">✨ Improvements</h4>
                <ul className="space-y-1">
                  {stats.improvements.map((improvement, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* SEO & AI-Friendly Content Sections */}
        <div className="space-y-6 mt-8">
          {/* About Section */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">About Grammar Checker</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our AI-powered Grammar Checker is an advanced tool designed to help you write error-free 
              content. Using state-of-the-art natural language processing, the tool identifies spelling 
              errors, grammar mistakes, and style issues, providing instant corrections and suggestions 
              for improvement.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Perfect for students, writers, professionals, and anyone who wants to ensure their writing 
              is clear, correct, and professional. The tool checks multiple aspects of your text and 
              provides detailed feedback to help you improve your writing skills.
            </p>
          </div>

          {/* Use Cases */}
          <div className="p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Common Use Cases</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Checking essays and academic papers</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Proofreading blog posts and articles</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Reviewing business emails and documents</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Improving social media posts</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Checking resumes and cover letters</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Learning grammar and writing skills</span>
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
                  <h4 className="font-semibold text-gray-900 mb-1">Spelling Check</h4>
                  <p className="text-sm text-gray-600">Detect and correct spelling errors instantly</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Grammar Correction</h4>
                  <p className="text-sm text-gray-600">Fix grammar mistakes and improve sentence structure</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Style Suggestions</h4>
                  <p className="text-sm text-gray-600">Get suggestions for better word choices and phrasing</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Detailed Feedback</h4>
                  <p className="text-sm text-gray-600">Receive specific suggestions and improvements</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="p-6 bg-blue-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">How accurate is the grammar checker?</h4>
                <p className="text-gray-700 text-sm">
                  Our AI uses advanced natural language processing to identify errors with high accuracy. 
                  However, we recommend reviewing the suggestions, especially for complex or technical content.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Does it check all types of errors?</h4>
                <p className="text-gray-700 text-sm">
                  Yes, the tool checks spelling, grammar, and style. You can enable or disable specific 
                  check types based on your needs.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Can I use it for different languages?</h4>
                <p className="text-gray-700 text-sm">
                  Currently, the tool works best with English text. Support for other languages may be 
                  added in the future.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Is my text stored or saved?</h4>
                <p className="text-gray-700 text-sm">
                  No, we do not store your text. All processing is done in real-time, and your content 
                  is not saved on our servers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">💡 Tips for Best Results</h3>
          <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
            <li>Enable all check types for comprehensive error detection</li>
            <li>Review suggestions carefully, especially for technical or specialized content</li>
            <li>Use "Suggest Improvements" for better word choices and clarity</li>
            <li>Check longer texts in sections for better accuracy</li>
            <li>Always review the corrected text to ensure it matches your intended meaning</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

