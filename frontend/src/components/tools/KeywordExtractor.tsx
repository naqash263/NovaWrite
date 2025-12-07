import { useState } from 'react';
import { useSEO } from '../../utils/seo';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

export default function KeywordExtractor() {
  const [text, setText] = useState<string>('');
  const [maxKeywords, setMaxKeywords] = useState<number>(10);
  const [includeRelated, setIncludeRelated] = useState<boolean>(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useSEO({
    title: 'Free Keyword Extractor Online - AI-Powered Keyword Extraction | No Signup',
    description: 'Free keyword extractor online - no signup required. AI-powered keyword extractor. Extract keywords from text, articles, and documents instantly. Generate SEO keywords, find related keywords, analyze keyword density. Perfect for content creators and SEO professionals.',
    url: '/resources/ai-tools/keyword-extractor',
    keywords: [
      'free keyword extractor online', 'keyword extractor', 'free keyword extractor', 'keyword extractor online', 'extract keywords online',
      'extract keywords', 'keyword generator', 'SEO keywords',
      'keyword finder', 'keyword analysis', 'AI keyword extractor', 'online keyword extractor',
      'keyword density', 'related keywords', 'long-tail keywords', 'free online keyword extractor'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Keyword Extractor',
      'description': 'Free AI-powered keyword extractor. Extract keywords from text and generate SEO keywords.',
      'url': 'https://naqashthaheem.com/resources/ai-tools/keyword-extractor',
      'applicationCategory': 'UtilityApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Extract keywords from text',
        'Generate SEO keywords',
        'Find related keywords',
        'Keyword density analysis',
        'Long-tail keyword suggestions'
      ]
    }
  });

  const extractKeywords = async () => {
    if (!text.trim() || text.length < 10) {
      setError('Please enter at least 10 characters of text.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setKeywords([]);

    try {
      const response = await fetch(`${API_URL}/ai-tools/keyword-extractor/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          maxKeywords,
          includeRelated,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to extract keywords');
      }

      if (data.success && data.data) {
        setKeywords(data.data.keywords || []);
      } else {
        throw new Error(data.message || 'Failed to extract keywords');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while extracting keywords');
      setKeywords([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyKeywords = async () => {
    if (keywords.length === 0) return;
    
    const keywordsText = keywords.join(', ');
    try {
      await navigator.clipboard.writeText(keywordsText);
      alert('Keywords copied to clipboard!');
    } catch (err) {
      alert('Failed to copy keywords. Please select and copy manually.');
    }
  };

  const copyAsList = async () => {
    if (keywords.length === 0) return;
    
    const keywordsList = keywords.map((kw, index) => `${index + 1}. ${kw}`).join('\n');
    try {
      await navigator.clipboard.writeText(keywordsList);
      alert('Keywords copied as list!');
    } catch (err) {
      alert('Failed to copy keywords. Please select and copy manually.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Free Keyword Extractor Online</h1>
        <p className="text-gray-600 mb-6">
          Free keyword extractor online - no signup required. Extract keywords from your text using AI instantly. Generate SEO keywords, find related keywords, analyze keyword density. Perfect for SEO, content analysis, and keyword research.
        </p>

        <div className="space-y-6">
          {/* Text Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Text to Extract Keywords From
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your text here... (minimum 10 characters)"
              className="w-full h-48 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{text.length} characters</span>
              <button
                onClick={() => setText('')}
                className="text-blue-600 hover:text-blue-700"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Keywords: {maxKeywords}
              </label>
              <input
                type="range"
                min="5"
                max="50"
                value={maxKeywords}
                onChange={(e) => setMaxKeywords(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>5</span>
                <span>50</span>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeRelated"
                checked={includeRelated}
                onChange={(e) => setIncludeRelated(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="includeRelated" className="text-sm text-gray-700">
                Include Related Keywords
              </label>
            </div>
          </div>

          {/* Extract Button */}
          <button
            onClick={extractKeywords}
            disabled={isProcessing || text.length < 10}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Extracting Keywords...' : 'Extract Keywords'}
          </button>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Keywords Result */}
          {keywords.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Extracted Keywords ({keywords.length})
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={copyKeywords}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    Copy (Comma-separated)
                  </button>
                  <button
                    onClick={copyAsList}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    Copy (List)
                  </button>
                </div>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <strong>Comma-separated:</strong> {keywords.join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SEO Content */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">About Keyword Extractor</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 mb-4">
            Keyword Extractor uses AI to automatically identify and extract the most important keywords 
            from your text. Perfect for SEO optimization, content analysis, and keyword research.
          </p>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Features</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Extract keywords from any text or article</li>
            <li>Generate SEO-friendly keywords</li>
            <li>Find related keywords and synonyms</li>
            <li>Customizable keyword count (5-50 keywords)</li>
            <li>Copy keywords in multiple formats</li>
            <li>AI-powered keyword extraction</li>
          </ul>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Use Cases</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>SEO keyword research and optimization</li>
            <li>Content analysis and topic identification</li>
            <li>Generate meta keywords for websites</li>
            <li>Find relevant keywords for blog posts</li>
            <li>Analyze competitor content</li>
            <li>Create keyword lists for PPC campaigns</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

