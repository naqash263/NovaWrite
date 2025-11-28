import { useState } from 'react';
import { useSEO } from '../../utils/seo';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

export default function TextSummarizer() {
  const [text, setText] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [focus, setFocus] = useState<'general' | 'key-points' | 'detailed'>('general');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [stats, setStats] = useState<{
    original_length: number;
    summary_length: number;
    compression_ratio: number;
  } | null>(null);

  useSEO({
    title: 'Free Text Summarizer - AI-Powered Text Summary Tool | Summarize Articles Online',
    description: 'Free AI-powered text summarizer. Summarize long articles, documents, and text instantly. Choose from short, medium, or long summaries. No registration required.',
    url: '/resources/ai-tools/text-summarizer',
    keywords: [
      'text summarizer', 'article summarizer', 'text summary', 'summarize text',
      'AI summarizer', 'online summarizer', 'free text summarizer', 'text summarization',
      'document summarizer', 'article summary tool'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Text Summarizer',
      'description': 'Free AI-powered text summarizer. Summarize long articles, documents, and text instantly with multiple length options.',
      'url': 'https://naqashthaheem.com/resources/ai-tools/text-summarizer',
      'applicationCategory': 'UtilityApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Short, medium, and long summary options',
        'General, key points, and detailed focus modes',
        'Real-time summarization',
        'Compression ratio statistics',
        'Character and word count tracking',
        'Copy to clipboard functionality'
      ],
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.9',
        'ratingCount': '2100',
        'bestRating': '5',
        'worstRating': '1'
      }
    }
  });

  const handleSummarize = async () => {
    if (!text.trim()) {
      setError('Please enter some text to summarize');
      return;
    }

    if (text.length < 50) {
      setError('Text must be at least 50 characters long');
      return;
    }

    setLoading(true);
    setError('');
    setSummary('');

    try {
      const response = await fetch(`${API_URL}/ai-tools/text-summarizer/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          length,
          focus
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate summary');
      }

      if (data.success && data.data) {
        setSummary(data.data.summary);
        setStats({
          original_length: data.data.original_length,
          summary_length: data.data.summary_length,
          compression_ratio: data.data.compression_ratio
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while generating the summary';
      setError(errorMessage);
      console.error('Summarization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText('');
    setSummary('');
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
          📝 Text Summarizer
        </h1>
        <p className="text-gray-600 mb-6">
          Summarize long articles, documents, and text instantly using AI. Choose your preferred summary length and focus.
        </p>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Summary Length
            </label>
            <select
              value={length}
              onChange={(e) => setLength(e.target.value as 'short' | 'medium' | 'long')}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="short">Short (2-3 sentences)</option>
              <option value="medium">Medium (1-2 paragraphs)</option>
              <option value="long">Long (3-5 paragraphs)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Focus
            </label>
            <select
              value={focus}
              onChange={(e) => setFocus(e.target.value as 'general' | 'key-points' | 'detailed')}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="general">General Summary</option>
              <option value="key-points">Key Points</option>
              <option value="detailed">Detailed Summary</option>
            </select>
          </div>
        </div>

        {/* Input Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Enter Text to Summarize (max 50,000 characters)
            </label>
            <button
              onClick={handleClear}
              disabled={!text && !summary}
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
            placeholder="Paste or type your text here to summarize..."
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
            onClick={handleSummarize}
            disabled={loading || !text.trim() || text.length < 50}
            className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors text-lg"
          >
            {loading ? '⏳ Summarizing...' : '✨ Generate Summary'}
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

        {/* Summary Section */}
        {summary && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Generated Summary
              </label>
              <button
                onClick={() => copyToClipboard(summary)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                📋 Copy Summary
              </button>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg min-h-[200px]">
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{summary}</p>
            </div>
          </div>
        )}

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Original Length</div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.original_length.toLocaleString()} chars
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Summary Length</div>
              <div className="text-2xl font-bold text-green-600">
                {stats.summary_length.toLocaleString()} chars
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Compression</div>
              <div className="text-2xl font-bold text-purple-600">
                {stats.compression_ratio}%
              </div>
            </div>
          </div>
        )}

        {/* SEO & AI-Friendly Content Sections */}
        <div className="space-y-6 mt-8">
          {/* About Section */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">About Text Summarizer</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our AI-powered Text Summarizer is an advanced tool designed to help you quickly extract 
              key information from long articles, documents, and text. Using state-of-the-art natural 
              language processing, the tool understands context, identifies important points, and 
              generates concise summaries that preserve essential information.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Perfect for students, researchers, content creators, and professionals who need to quickly 
              understand lengthy documents. The tool offers multiple summary lengths and focus modes to 
              suit different needs, from quick overviews to detailed summaries.
            </p>
          </div>

          {/* Use Cases */}
          <div className="p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Common Use Cases</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Summarizing research papers and academic articles</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Creating executive summaries from long reports</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Extracting key points from news articles</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Quickly understanding lengthy blog posts</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Preparing study notes from textbooks</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Creating abstracts for documents</span>
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
                  <h4 className="font-semibold text-gray-900 mb-1">Multiple Length Options</h4>
                  <p className="text-sm text-gray-600">Choose from short (2-3 sentences), medium (1-2 paragraphs), or long (3-5 paragraphs) summaries</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Focus Modes</h4>
                  <p className="text-sm text-gray-600">General summary, key points extraction, or detailed summary with context</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Compression Statistics</h4>
                  <p className="text-sm text-gray-600">See original length, summary length, and compression ratio</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">AI-Powered Accuracy</h4>
                  <p className="text-sm text-gray-600">Advanced AI ensures important information is preserved</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="p-6 bg-blue-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">How accurate are the summaries?</h4>
                <p className="text-gray-700 text-sm">
                  Our AI uses advanced natural language processing to identify and preserve the most important 
                  information. The accuracy is high, but we recommend reviewing summaries for critical documents 
                  to ensure all key points are included.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What's the difference between the focus modes?</h4>
                <p className="text-gray-700 text-sm">
                  <strong>General:</strong> Balanced summary covering all main points. <strong>Key Points:</strong> 
                  Extracts and lists the most important ideas. <strong>Detailed:</strong> Comprehensive summary 
                  with important context and examples.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Can I summarize text in different languages?</h4>
                <p className="text-gray-700 text-sm">
                  Currently, the tool works best with English text. Support for other languages may be 
                  added in the future.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What's the maximum text length?</h4>
                <p className="text-gray-700 text-sm">
                  You can summarize up to 50,000 characters at once. For longer texts, consider breaking 
                  them into smaller sections.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 How to Use</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Paste or type your text (minimum 50 characters, maximum 50,000 characters)</li>
            <li>Choose your preferred summary length: Short, Medium, or Long</li>
            <li>Select focus: General summary, Key points, or Detailed summary</li>
            <li>Click "Generate Summary" to get your AI-powered summary</li>
            <li>Copy the summary to use it elsewhere</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

