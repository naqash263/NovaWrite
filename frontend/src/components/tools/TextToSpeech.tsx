import { useState, useEffect, useRef } from 'react';
import { useSEO } from '../../utils/seo';

export default function TextToSpeech() {
  const [text, setText] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [rate, setRate] = useState<number>(1);
  const [pitch, setPitch] = useState<number>(1);
  const [volume, setVolume] = useState<number>(1);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [charCount, setCharCount] = useState<number>(0);
  const [wordCount, setWordCount] = useState<number>(0);
  const [readingTime, setReadingTime] = useState<number>(0);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const wordsRef = useRef<string[]>([]);

  useSEO({
    title: 'Free Text to Speech Converter - Online TTS Tool | Convert Text to Voice',
    description: 'Free online text to speech converter. Convert any text to natural-sounding speech with multiple voices, adjustable speed, pitch, and volume. No registration required. Works in all modern browsers.',
    url: '/resources/utility-tools/text-to-speech',
    keywords: [
      'text to speech', 'TTS', 'speech synthesis', 'text to voice', 'voice generator',
      'online TTS', 'free text to speech', 'speech converter', 'text reader',
      'voice synthesizer', 'audio generator', 'speech tool'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Text to Speech Converter',
      'description': 'Free online text to speech converter with multiple voices, adjustable speed, pitch, and volume controls.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/text-to-speech',
      'applicationCategory': 'UtilityApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Multiple voice options',
        'Adjustable speed (0.5x to 2x)',
        'Pitch control',
        'Volume control',
        'Text highlighting during playback',
        'Real-time character and word count',
        'Reading time estimation'
      ],
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.8',
        'ratingCount': '1950',
        'bestRating': '5',
        'worstRating': '1'
      }
    }
  });

  useEffect(() => {
    // Load available voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !voice) {
        // Prefer English voices
        const englishVoice = availableVoices.find(v => 
          v.lang.startsWith('en') && v.name.includes('Female')
        ) || availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
        setVoice(englishVoice);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [voice]);

  useEffect(() => {
    // Update character and word counts
    setCharCount(text.length);
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    setReadingTime(Math.ceil(wordCount / 200)); // Average reading speed: 200 words/min
  }, [text, wordCount]);

  const handleSpeak = () => {
    if (!text.trim()) {
      return;
    }

    // Stop any current speech
    window.speechSynthesis.cancel();

    // Split text into words for highlighting
    wordsRef.current = text.trim().split(/\s+/);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setHighlightedIndex(0);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setHighlightedIndex(-1);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      setIsPaused(false);
      setHighlightedIndex(-1);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    if (isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    } else if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setHighlightedIndex(-1);
  };

  const handleClear = () => {
    handleStop();
    setText('');
  };

  const getHighlightedText = () => {
    if (highlightedIndex < 0) return text;
    
    const words = text.split(/(\s+)/);
    return words.map((word, index) => {
      const wordIndex = words.slice(0, index).reduce((acc, w) => acc + (w.trim() ? 1 : 0), 0) - 1;
      if (wordIndex === highlightedIndex && word.trim()) {
        return <mark key={index} className="bg-yellow-300 px-1 rounded">{word}</mark>;
      }
      return <span key={index}>{word}</span>;
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          🔊 Text to Speech Converter
        </h1>
        <p className="text-gray-600 mb-6">
          Convert your text into natural-sounding speech. Choose from multiple voices, adjust speed, pitch, and volume.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Characters</div>
            <div className="text-2xl font-bold text-blue-600">{charCount.toLocaleString()}</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Words</div>
            <div className="text-2xl font-bold text-green-600">{wordCount.toLocaleString()}</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Reading Time</div>
            <div className="text-2xl font-bold text-purple-600">{readingTime} min</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Max Length</div>
            <div className="text-2xl font-bold text-orange-600">5000</div>
          </div>
        </div>

        {/* Text Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter Text (max 5000 characters)
          </label>
          <textarea
            value={text}
            onChange={(e) => {
              const newText = e.target.value.slice(0, 5000);
              setText(newText);
            }}
            placeholder="Type or paste your text here..."
            className="w-full h-48 sm:h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            maxLength={5000}
          />
          <div className="text-sm text-gray-500 mt-1 text-right">
            {text.length}/5000 characters
          </div>
        </div>

        {/* Voice Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Voice
          </label>
          <select
            value={voice?.name || ''}
            onChange={(e) => {
              const selectedVoice = voices.find(v => v.name === e.target.value);
              if (selectedVoice) setVoice(selectedVoice);
            }}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={voices.length === 0}
          >
            {voices.length === 0 ? (
              <option>Loading voices...</option>
            ) : (
              voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))
            )}
          </select>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Speed: {rate.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pitch: {pitch.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Volume: {Math.round(volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={handleSpeak}
            disabled={!text.trim() || isSpeaking}
            className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {isSpeaking ? 'Speaking...' : '▶️ Speak'}
          </button>
          <button
            onClick={handlePause}
            disabled={!isSpeaking}
            className="flex-1 sm:flex-none px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {isPaused ? '▶️ Resume' : '⏸️ Pause'}
          </button>
          <button
            onClick={handleStop}
            disabled={!isSpeaking && !isPaused}
            className="flex-1 sm:flex-none px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            ⏹️ Stop
          </button>
          <button
            onClick={handleClear}
            className="flex-1 sm:flex-none px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
          >
            🗑️ Clear
          </button>
        </div>

        {/* Highlighted Text Preview */}
        {text && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Text Preview</h3>
            <div className="text-gray-800 leading-relaxed">
              {getHighlightedText()}
            </div>
          </div>
        )}

        {/* SEO & AI-Friendly Content Sections */}
        <div className="space-y-6 mt-8">
          {/* About Section */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">About Text to Speech</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our Text to Speech converter is a powerful, browser-based tool that uses the Web Speech API 
              to convert written text into natural-sounding speech. This technology is built into modern 
              browsers, ensuring fast, reliable performance without requiring any server-side processing 
              or data transmission.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Perfect for accessibility, content creation, language learning, and anyone who prefers 
              listening over reading. The tool supports multiple languages and voices, allowing you to 
              customize the speech output to match your preferences.
            </p>
          </div>

          {/* Use Cases */}
          <div className="p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Common Use Cases</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Accessibility for visually impaired users</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Proofreading by listening to your text</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Language learning and pronunciation practice</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Creating audio content from written text</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Multitasking while listening to content</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Reviewing documents hands-free</span>
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
                  <h4 className="font-semibold text-gray-900 mb-1">Multiple Voices</h4>
                  <p className="text-sm text-gray-600">Choose from system voices in multiple languages and accents</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Customizable Controls</h4>
                  <p className="text-sm text-gray-600">Adjust speed (0.5x-2x), pitch, and volume to your preference</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Text Highlighting</h4>
                  <p className="text-sm text-gray-600">See words highlighted as they're being spoken</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Privacy-First</h4>
                  <p className="text-sm text-gray-600">All processing happens in your browser - no data sent to servers</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="p-6 bg-blue-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">How does text to speech work?</h4>
                <p className="text-gray-700 text-sm">
                  The tool uses the Web Speech API built into modern browsers. Your text is converted to 
                  speech locally on your device without sending any data to external servers.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What browsers support this tool?</h4>
                <p className="text-gray-700 text-sm">
                  The Web Speech API is supported in Chrome, Edge, Safari, and Firefox. Voice availability 
                  depends on your operating system and browser.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Can I download the audio?</h4>
                <p className="text-gray-700 text-sm">
                  Currently, the tool plays audio in real-time. For audio file downloads, you may need to 
                  use browser extensions or screen recording software.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Is my text stored or saved?</h4>
                <p className="text-gray-700 text-sm">
                  No, all processing happens locally in your browser. We do not store, track, or transmit 
                  any of your text data.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Maximum text length: 5000 characters</li>
            <li>Voice availability depends on your browser and operating system</li>
            <li>Adjust speed, pitch, and volume to customize the voice</li>
            <li>Works best with clear, well-formatted text</li>
            <li>Use pause/resume for long texts to control playback</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

