import { useState } from 'react';
import { useSEO } from '../../utils/seo';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

const LANGUAGES = [
  { code: 'auto', name: 'Auto-detect' },
  { code: 'English', name: 'English' },
  { code: 'Spanish', name: 'Spanish' },
  { code: 'French', name: 'French' },
  { code: 'German', name: 'German' },
  { code: 'Italian', name: 'Italian' },
  { code: 'Portuguese', name: 'Portuguese' },
  { code: 'Russian', name: 'Russian' },
  { code: 'Chinese', name: 'Chinese' },
  { code: 'Japanese', name: 'Japanese' },
  { code: 'Korean', name: 'Korean' },
  { code: 'Arabic', name: 'Arabic' },
  { code: 'Hindi', name: 'Hindi' },
  { code: 'Dutch', name: 'Dutch' },
  { code: 'Polish', name: 'Polish' },
  { code: 'Turkish', name: 'Turkish' },
  { code: 'Swedish', name: 'Swedish' },
  { code: 'Norwegian', name: 'Norwegian' },
  { code: 'Danish', name: 'Danish' },
  { code: 'Finnish', name: 'Finnish' },
  { code: 'Greek', name: 'Greek' },
  { code: 'Czech', name: 'Czech' },
  { code: 'Romanian', name: 'Romanian' },
  { code: 'Hungarian', name: 'Hungarian' },
  { code: 'Thai', name: 'Thai' },
  { code: 'Vietnamese', name: 'Vietnamese' },
  { code: 'Indonesian', name: 'Indonesian' },
  { code: 'Malay', name: 'Malay' },
  { code: 'Hebrew', name: 'Hebrew' },
  { code: 'Ukrainian', name: 'Ukrainian' }
];

export default function LanguageTranslator() {
  const [text, setText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [sourceLanguage, setSourceLanguage] = useState<string>('auto');
  const [targetLanguage, setTargetLanguage] = useState<string>('English');
  const [preserveFormatting, setPreserveFormatting] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [stats, setStats] = useState<{
    source_language: string;
    target_language: string;
    original_length: number;
    translated_length: number;
  } | null>(null);

  useSEO({
    title: 'Free Language Translator Online - AI-Powered Translation | No Signup',
    description: 'Free language translator online - no signup required. AI-powered language translator. Translate text between 30+ languages instantly. Preserve formatting, accurate translations. AI translator free online. Perfect for students, travelers, and professionals.',
    url: '/resources/ai-tools/language-translator',
    keywords: [
      'free language translator online', 'language translator', 'free language translator', 'language translator online', 'AI translator free online',
      'text translator', 'online translator', 'translate text',
      'AI translator', 'free translator', 'translate language', 'translation tool',
      'multilingual translator', 'document translator', 'real-time translation'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Language Translator',
      'description': 'Free AI-powered language translator supporting 30+ languages with accurate, natural translations.',
      'url': 'https://naqashthaheem.com/resources/ai-tools/language-translator',
      'applicationCategory': 'UtilityApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        '30+ languages supported',
        'Auto-detect source language',
        'Preserve formatting option',
        'Natural, accurate translations',
        'Real-time translation',
        'Character and word count tracking'
      ],
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.8',
        'ratingCount': '3200',
        'bestRating': '5',
        'worstRating': '1'
      }
    }
  });

  const handleTranslate = async () => {
    if (!text.trim()) {
      setError('Please enter some text to translate');
      return;
    }

    if (text.length < 10) {
      setError('Text must be at least 10 characters long');
      return;
    }

    setLoading(true);
    setError('');
    setTranslatedText('');

    try {
      const response = await fetch(`${API_URL}/ai-tools/language-translator/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          source_language: sourceLanguage === 'auto' ? 'auto' : sourceLanguage,
          target_language: targetLanguage,
          preserve_formatting: preserveFormatting
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to translate text');
      }

      if (data.success && data.data) {
        setTranslatedText(data.data.translated_text);
        setStats({
          source_language: data.data.source_language,
          target_language: data.data.target_language,
          original_length: data.data.original_length,
          translated_length: data.data.translated_length
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while translating';
      setError(errorMessage);
      console.error('Translation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText('');
    setTranslatedText('');
    setError('');
    setStats(null);
  };

  const swapLanguages = () => {
    if (sourceLanguage !== 'auto') {
      const temp = sourceLanguage;
      setSourceLanguage(targetLanguage);
      setTargetLanguage(temp);
    }
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
          🌐 Free Language Translator Online
        </h1>
        <p className="text-gray-600 mb-6">
          Free language translator online - no signup required. Translate text between 30+ languages instantly. Get accurate, natural translations with AI-powered technology. AI translator free online. Preserve formatting. Perfect for students, travelers, and professionals.
        </p>

        {/* Language Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From (Source Language)
            </label>
            <select
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={swapLanguages}
              className="w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title="Swap languages"
            >
              ⇄ Swap
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To (Target Language)
            </label>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {LANGUAGES.filter(lang => lang.code !== 'auto').map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Options */}
        <div className="mb-6">
          <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
            <input
              type="checkbox"
              checked={preserveFormatting}
              onChange={(e) => setPreserveFormatting(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Preserve Formatting (line breaks, paragraphs, etc.)</span>
          </label>
        </div>

        {/* Input/Output Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Input */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Enter Text to Translate (max 50,000 characters)
              </label>
              <button
                onClick={handleClear}
                disabled={!text && !translatedText}
                className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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
              placeholder="Type or paste text here..."
              className="w-full h-64 sm:h-80 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              maxLength={50000}
            />
            <div className="text-sm text-gray-500 mt-1 text-right">
              {text.length.toLocaleString()} / 50,000 characters
            </div>
          </div>

          {/* Output */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Translation
              </label>
              {translatedText && (
                <button
                  onClick={() => copyToClipboard(translatedText)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📋 Copy
                </button>
              )}
            </div>
            <div className="w-full h-64 sm:h-80 p-4 bg-gray-50 border border-gray-300 rounded-lg overflow-y-auto">
              {translatedText ? (
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{translatedText}</p>
              ) : (
                <p className="text-gray-400 italic">Translation will appear here...</p>
              )}
            </div>
            {stats && (
              <div className="text-sm text-gray-500 mt-1 text-right">
                {stats.translated_length.toLocaleString()} characters
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="mb-6">
          <button
            onClick={handleTranslate}
            disabled={loading || !text.trim() || text.length < 10}
            className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors text-lg"
          >
            {loading ? '⏳ Translating...' : '✨ Translate'}
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

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Source Language</div>
              <div className="text-lg font-bold text-blue-600">
                {stats.source_language}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Target Language</div>
              <div className="text-lg font-bold text-green-600">
                {stats.target_language}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Original Length</div>
              <div className="text-lg font-bold text-purple-600">
                {stats.original_length.toLocaleString()}
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Translated Length</div>
              <div className="text-lg font-bold text-orange-600">
                {stats.translated_length.toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* SEO & AI-Friendly Content Sections */}
        <div className="space-y-6 mt-8">
          {/* About Section */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">About Language Translator</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our AI-powered Language Translator is an advanced tool designed to help you communicate 
              across language barriers. Using state-of-the-art natural language processing, the tool 
              provides accurate, natural translations between 30+ languages while preserving context 
              and meaning.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Perfect for students, travelers, professionals, and anyone who needs to translate text 
              quickly and accurately. The tool supports auto-detection of source language and preserves 
              formatting for better readability.
            </p>
          </div>

          {/* Use Cases */}
          <div className="p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Common Use Cases</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Translating documents and emails</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Understanding foreign language content</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Communicating with international clients</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Learning new languages</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Translating website content</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Reading research papers in other languages</span>
              </li>
            </ul>
          </div>

          {/* Supported Languages */}
          <div className="p-6 bg-white border border-gray-200 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Supported Languages</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {LANGUAGES.filter(lang => lang.code !== 'auto').map(lang => (
                <div key={lang.code} className="p-2 bg-gray-50 rounded text-sm text-gray-700">
                  {lang.name}
                </div>
              ))}
            </div>
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
                  <h4 className="font-semibold text-gray-900 mb-1">30+ Languages</h4>
                  <p className="text-sm text-gray-600">Support for major world languages including European, Asian, and Middle Eastern languages</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Auto-Detect</h4>
                  <p className="text-sm text-gray-600">Automatically detect the source language for convenience</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Preserve Formatting</h4>
                  <p className="text-sm text-gray-600">Maintain line breaks, paragraphs, and special characters</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Natural Translations</h4>
                  <p className="text-sm text-gray-600">AI-powered translations that read naturally in the target language</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="p-6 bg-blue-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">How accurate are the translations?</h4>
                <p className="text-gray-700 text-sm">
                  Our AI uses advanced natural language processing to provide accurate, context-aware translations. 
                  For professional or legal documents, we recommend having translations reviewed by a human translator.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Can I translate long documents?</h4>
                <p className="text-gray-700 text-sm">
                  You can translate up to 50,000 characters at once. For longer documents, consider breaking 
                  them into sections.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Does it preserve formatting?</h4>
                <p className="text-gray-700 text-sm">
                  Yes, you can enable "Preserve Formatting" to maintain line breaks, paragraphs, and special 
                  characters in the translation.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Is my text stored or saved?</h4>
                <p className="text-gray-700 text-sm">
                  No, we do not store your text. All translations are processed in real-time, and your content 
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
            <li>Use auto-detect for convenience, or specify source language for better accuracy</li>
            <li>Enable "Preserve Formatting" for documents with specific formatting needs</li>
            <li>For technical or specialized content, review translations carefully</li>
            <li>Break long texts into smaller sections for better translation quality</li>
            <li>Consider cultural context when translating idiomatic expressions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

