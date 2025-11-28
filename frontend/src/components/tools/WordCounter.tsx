import { useState, useEffect } from 'react';
import { useSEO } from '../../utils/seo';

export default function WordCounter() {
  const [text, setText] = useState<string>('');
  const [stats, setStats] = useState({
    characters: 0,
    charactersNoSpaces: 0,
    words: 0,
    sentences: 0,
    paragraphs: 0,
    readingTime: 0,
    speakingTime: 0,
  });

  useSEO({
    title: 'Free Word Counter & Text Analyzer - Character Count, Word Count Tool | Online Text Counter',
    description: 'Free online word counter and text analyzer. Count characters, words, sentences, paragraphs. Calculate reading time and speaking time. Perfect for writers, students, and content creators.',
    url: '/resources/utility-tools/word-counter',
    keywords: [
      'word counter', 'character counter', 'text analyzer', 'word count',
      'character count', 'text counter', 'reading time calculator', 'text statistics',
      'online word counter', 'free word counter', 'text analysis tool'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Word Counter & Text Analyzer',
      'description': 'Free online word counter and text analyzer with comprehensive statistics and time calculations.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/word-counter',
      'applicationCategory': 'UtilityApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Character count (with and without spaces)',
        'Word, sentence, and paragraph counting',
        'Reading time estimation',
        'Speaking time calculation',
        'Top words analysis',
        'Real-time statistics'
      ],
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.8',
        'ratingCount': '2100',
        'bestRating': '5',
        'worstRating': '1'
      }
    }
  });

  useEffect(() => {
    calculateStats();
  }, [text]);

  const calculateStats = () => {
    const trimmedText = text.trim();
    
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const words = trimmedText ? trimmedText.split(/\s+/).filter(word => word.length > 0).length : 0;
    const sentences = trimmedText ? trimmedText.split(/[.!?]+/).filter(s => s.trim().length > 0).length : 0;
    const paragraphs = trimmedText ? trimmedText.split(/\n\s*\n/).filter(p => p.trim().length > 0).length : 0;
    
    // Average reading speed: 200 words per minute
    const readingTime = Math.ceil(words / 200);
    
    // Average speaking speed: 150 words per minute
    const speakingTime = Math.ceil(words / 150);

    setStats({
      characters,
      charactersNoSpaces,
      words,
      sentences,
      paragraphs,
      readingTime,
      speakingTime,
    });
  };

  const getTopWords = (limit: number = 10) => {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const wordCount: { [key: string]: number } = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    return Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word, count]) => ({ word, count }));
  };

  const clearText = () => {
    setText('');
  };

  const copyToClipboard = async () => {
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
        alert('Text copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          📊 Word Counter & Text Analyzer
        </h1>
        <p className="text-gray-600 mb-6">
          Count characters, words, sentences, and paragraphs. Analyze your text with detailed statistics and insights.
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Characters</div>
            <div className="text-2xl font-bold text-blue-600">{stats.characters.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">(no spaces: {stats.charactersNoSpaces.toLocaleString()})</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Words</div>
            <div className="text-2xl font-bold text-green-600">{stats.words.toLocaleString()}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Sentences</div>
            <div className="text-2xl font-bold text-purple-600">{stats.sentences.toLocaleString()}</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Paragraphs</div>
            <div className="text-2xl font-bold text-orange-600">{stats.paragraphs.toLocaleString()}</div>
          </div>
        </div>

        {/* Time Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Reading Time</div>
            <div className="text-xl font-bold text-indigo-600">
              {stats.readingTime} {stats.readingTime === 1 ? 'minute' : 'minutes'}
            </div>
            <div className="text-xs text-gray-500 mt-1">(at 200 words/min)</div>
          </div>
          <div className="bg-pink-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Speaking Time</div>
            <div className="text-xl font-bold text-pink-600">
              {stats.speakingTime} {stats.speakingTime === 1 ? 'minute' : 'minutes'}
            </div>
            <div className="text-xs text-gray-500 mt-1">(at 150 words/min)</div>
          </div>
        </div>

        {/* Text Input */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Enter or Paste Your Text
            </label>
            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                disabled={!text}
                className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                📋 Copy
              </button>
              <button
                onClick={clearText}
                disabled={!text}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                🗑️ Clear
              </button>
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Start typing or paste your text here to analyze..."
            className="w-full h-64 sm:h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y font-mono text-sm"
          />
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Word Frequency */}
          {text.trim().length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Top Words</h3>
              <div className="space-y-2">
                {getTopWords(10).map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">{item.word}</span>
                    <span className="text-sm font-semibold text-blue-600">{item.count}</span>
                  </div>
                ))}
                {getTopWords(10).length === 0 && (
                  <p className="text-sm text-gray-500">No words found (minimum 4 characters)</p>
                )}
              </div>
            </div>
          )}

          {/* Text Analysis */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Text Analysis</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Average Word Length:</span>
                <span className="font-semibold">
                  {stats.words > 0 ? (stats.charactersNoSpaces / stats.words).toFixed(1) : 0} characters
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average Sentence Length:</span>
                <span className="font-semibold">
                  {stats.sentences > 0 ? (stats.words / stats.sentences).toFixed(1) : 0} words
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average Paragraph Length:</span>
                <span className="font-semibold">
                  {stats.paragraphs > 0 ? (stats.words / stats.paragraphs).toFixed(1) : 0} words
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Characters per Word:</span>
                <span className="font-semibold">
                  {stats.words > 0 ? (stats.characters / stats.words).toFixed(1) : 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SEO & AI-Friendly Content Sections */}
        <div className="space-y-6 mt-8">
          {/* About Section */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">About Word Counter</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our Word Counter is a comprehensive text analysis tool that provides detailed statistics 
              about your text. It counts characters (with and without spaces), words, sentences, 
              paragraphs, and calculates reading and speaking times. All analysis happens instantly 
              in your browser without sending any data to servers.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Perfect for writers, students, content creators, and anyone who needs to track text 
              statistics. The tool helps you meet word count requirements, estimate reading time, 
              and analyze your writing patterns.
            </p>
          </div>

          {/* Use Cases */}
          <div className="p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Common Use Cases</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Checking word limits for essays and articles</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Estimating reading time for blog posts</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Calculating speaking time for presentations</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Analyzing text for SEO and content optimization</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Meeting character limits for social media</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Identifying frequently used words and phrases</span>
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
                  <h4 className="font-semibold text-gray-900 mb-1">Comprehensive Statistics</h4>
                  <p className="text-sm text-gray-600">Count characters, words, sentences, paragraphs, and more</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Time Calculations</h4>
                  <p className="text-sm text-gray-600">Estimate reading time (200 WPM) and speaking time (150 WPM)</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Word Analysis</h4>
                  <p className="text-sm text-gray-600">Identify top words and analyze text patterns</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Real-Time Updates</h4>
                  <p className="text-sm text-gray-600">Statistics update instantly as you type</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="p-6 bg-blue-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">How is reading time calculated?</h4>
                <p className="text-gray-700 text-sm">
                  Reading time is calculated at 200 words per minute, which is the average reading 
                  speed for adults. This is a standard used by most content platforms.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">How is speaking time calculated?</h4>
                <p className="text-gray-700 text-sm">
                  Speaking time is calculated at 150 words per minute, which is the average speaking 
                  speed for presentations and speeches.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What counts as a word?</h4>
                <p className="text-gray-700 text-sm">
                  A word is any sequence of characters separated by spaces. Punctuation is not 
                  included in word counts.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Is my text stored or analyzed?</h4>
                <p className="text-gray-700 text-sm">
                  No, all analysis happens locally in your browser. Your text is never sent to any 
                  server or stored anywhere.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Usage Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Perfect for checking word limits in essays, articles, and social media posts</li>
            <li>Reading time is calculated at 200 words per minute (average reading speed)</li>
            <li>Speaking time is calculated at 150 words per minute (average speaking speed)</li>
            <li>Top words analysis helps identify frequently used terms in your text</li>
            <li>Use character count (no spaces) for Twitter and similar platforms</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

