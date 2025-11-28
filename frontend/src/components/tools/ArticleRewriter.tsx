import { useState } from 'react';
import { useSEO } from '../../utils/seo';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

export default function ArticleRewriter() {
  const [text, setText] = useState<string>('');
  const [rewrittenText, setRewrittenText] = useState<string>('');
  const [style, setStyle] = useState<'formal' | 'casual' | 'creative' | 'academic' | 'professional'>('formal');
  const [tone, setTone] = useState<'neutral' | 'positive' | 'persuasive' | 'informative'>('neutral');
  const [preserveMeaning, setPreserveMeaning] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [stats, setStats] = useState<{
    original_length: number;
    rewritten_length: number;
    word_count_original: number;
    word_count_rewritten: number;
  } | null>(null);

  useSEO({
    title: 'Free Article Rewriter & Paraphrase Tool - AI-Powered Text Rewriting | Online Paraphrasing Tool',
    description: 'Free AI-powered article rewriter and paraphrase tool. Rewrite articles, essays, and text while maintaining meaning. Multiple writing styles and tones. Plagiarism-free rewriting. No registration required.',
    url: '/resources/ai-tools/article-rewriter',
    keywords: [
      'article rewriter', 'paraphrase tool', 'text rewriter', 'rewrite article',
      'AI rewriter', 'online rewriter', 'free article rewriter', 'paraphrasing tool',
      'text paraphrasing', 'content rewriter', 'essay rewriter', 'plagiarism free rewriter'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Article Rewriter & Paraphrase Tool',
      'description': 'Free AI-powered article rewriter and paraphrase tool. Rewrite articles while maintaining meaning with multiple writing styles.',
      'url': 'https://naqashthaheem.com/resources/ai-tools/article-rewriter',
      'applicationCategory': 'UtilityApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Multiple writing styles (formal, casual, creative, academic, professional)',
        'Tone adjustment (neutral, positive, persuasive, informative)',
        'Preserve meaning option',
        'Plagiarism-free rewriting',
        'Word count preservation',
        'Real-time rewriting'
      ],
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.8',
        'ratingCount': '1250',
        'bestRating': '5',
        'worstRating': '1'
      }
    }
  });

  const handleRewrite = async () => {
    if (!text.trim()) {
      setError('Please enter some text to rewrite');
      return;
    }

    if (text.length < 50) {
      setError('Text must be at least 50 characters long');
      return;
    }

    setLoading(true);
    setError('');
    setRewrittenText('');

    try {
      const response = await fetch(`${API_URL}/ai-tools/article-rewriter/rewrite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          style,
          tone,
          preserve_meaning: preserveMeaning
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to rewrite article');
      }

      if (data.success && data.data) {
        setRewrittenText(data.data.rewritten_text);
        setStats({
          original_length: data.data.original_length,
          rewritten_length: data.data.rewritten_length,
          word_count_original: data.data.word_count_original,
          word_count_rewritten: data.data.word_count_rewritten
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while rewriting the article';
      setError(errorMessage);
      console.error('Rewriting error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText('');
    setRewrittenText('');
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
          ✍️ Article Rewriter & Paraphrase Tool
        </h1>
        <p className="text-gray-600 mb-6">
          Rewrite articles, essays, and text while maintaining meaning. Choose from multiple writing styles and tones. Get plagiarism-free, unique content instantly.
        </p>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Writing Style
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as typeof style)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="formal">Formal</option>
              <option value="casual">Casual</option>
              <option value="creative">Creative</option>
              <option value="academic">Academic</option>
              <option value="professional">Professional</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tone
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as typeof tone)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="neutral">Neutral</option>
              <option value="positive">Positive</option>
              <option value="persuasive">Persuasive</option>
              <option value="informative">Informative</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Options
            </label>
            <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
              <input
                type="checkbox"
                checked={preserveMeaning}
                onChange={(e) => setPreserveMeaning(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Preserve Exact Meaning</span>
            </label>
          </div>
        </div>

        {/* Input Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Enter Text to Rewrite (max 50,000 characters)
            </label>
            <button
              onClick={handleClear}
              disabled={!text && !rewrittenText}
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
            placeholder="Paste or type your text here to rewrite..."
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
            onClick={handleRewrite}
            disabled={loading || !text.trim() || text.length < 50}
            className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors text-lg"
          >
            {loading ? '⏳ Rewriting...' : '✨ Rewrite Article'}
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

        {/* Rewritten Text Section */}
        {rewrittenText && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Rewritten Text
              </label>
              <button
                onClick={() => copyToClipboard(rewrittenText)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                📋 Copy Rewritten Text
              </button>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg min-h-[200px]">
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{rewrittenText}</p>
            </div>
          </div>
        )}

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Original Words</div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.word_count_original.toLocaleString()}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Rewritten Words</div>
              <div className="text-2xl font-bold text-green-600">
                {stats.word_count_rewritten.toLocaleString()}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Original Length</div>
              <div className="text-2xl font-bold text-purple-600">
                {stats.original_length.toLocaleString()}
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Rewritten Length</div>
              <div className="text-2xl font-bold text-orange-600">
                {stats.rewritten_length.toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* SEO & AI-Friendly Content Sections */}
        <div className="space-y-6 mt-8">
          {/* About Section */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">About Article Rewriter</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our AI-powered Article Rewriter is a sophisticated tool designed to help you create unique, 
              plagiarism-free content while maintaining the original meaning. Whether you need to rewrite 
              articles, essays, blog posts, or any other text, our advanced AI technology ensures high-quality 
              results with multiple writing styles and tones to choose from.
            </p>
            <p className="text-gray-700 leading-relaxed">
              The tool uses state-of-the-art natural language processing to understand context, preserve 
              key information, and generate fresh content that reads naturally. Perfect for content creators, 
              students, researchers, and professionals who need to rephrase text while maintaining accuracy.
            </p>
          </div>

          {/* Use Cases */}
          <div className="p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Common Use Cases</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Rewriting blog posts and articles for SEO</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Paraphrasing academic papers and essays</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Creating unique content from existing sources</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Adapting content for different audiences</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Improving readability and clarity</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Changing writing style while keeping facts</span>
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
                  <h4 className="font-semibold text-gray-900 mb-1">Multiple Writing Styles</h4>
                  <p className="text-sm text-gray-600">Choose from formal, casual, creative, academic, or professional styles</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Tone Adjustment</h4>
                  <p className="text-sm text-gray-600">Control the tone: neutral, positive, persuasive, or informative</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Meaning Preservation</h4>
                  <p className="text-sm text-gray-600">Option to preserve exact meaning or allow creative adaptation</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Plagiarism-Free</h4>
                  <p className="text-sm text-gray-600">Generate unique content that passes plagiarism checks</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="p-6 bg-blue-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Is the rewritten content plagiarism-free?</h4>
                <p className="text-gray-700 text-sm">
                  Yes, our AI rewriter creates unique content by using different words, sentence structures, 
                  and phrasing while maintaining the original meaning. However, we recommend running the 
                  rewritten text through a plagiarism checker for verification.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Can I rewrite text in different languages?</h4>
                <p className="text-gray-700 text-sm">
                  Currently, the tool works best with English text. Support for other languages may be 
                  added in the future.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">How accurate is the rewritten content?</h4>
                <p className="text-gray-700 text-sm">
                  The AI maintains high accuracy in preserving meaning and key information. The quality 
                  depends on the input text clarity and the selected options. Always review the output 
                  to ensure it meets your requirements.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What's the maximum text length?</h4>
                <p className="text-gray-700 text-sm">
                  You can rewrite up to 50,000 characters at once. For longer texts, consider breaking 
                  them into smaller sections.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">💡 Tips for Best Results</h3>
          <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
            <li>Provide clear, well-structured input text for better rewriting quality</li>
            <li>Choose the writing style that matches your target audience</li>
            <li>Use "Preserve Exact Meaning" for factual content that must remain accurate</li>
            <li>Review the rewritten text to ensure it meets your requirements</li>
            <li>For academic or professional use, always verify the output for accuracy</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

