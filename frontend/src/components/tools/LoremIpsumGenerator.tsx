import { useState } from 'react';
import { useSEO } from '../../utils/seo';

const LOREM_IPSUM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'ut', 'aliquip', 'ex', 'ea',
  'commodo', 'consequat', 'duis', 'aute', 'irure', 'dolor', 'in', 'reprehenderit',
  'voluptate', 'velit', 'esse', 'cillum', 'dolore', 'eu', 'fugiat', 'nulla',
  'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat', 'non', 'proident',
  'sunt', 'in', 'culpa', 'qui', 'officia', 'deserunt', 'mollit', 'anim', 'id',
  'est', 'laborum'
];

const PLACEHOLDER_TEXTS = {
  lorem: {
    name: 'Lorem Ipsum',
    words: LOREM_IPSUM_WORDS,
    firstSentence: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
  },
  bacon: {
    name: 'Bacon Ipsum',
    words: ['bacon', 'ipsum', 'dolor', 'amet', 'short', 'loin', 'ribeye', 'pork', 'chop', 'tenderloin', 'brisket', 'sirloin', 'meatball', 'pork', 'belly', 'ham', 'hock', 'shank', 'turkey', 'chicken', 'beef', 'pork', 'loin', 'ribs', 'sausage', 'bacon', 'ham', 'pork', 'chop', 'tenderloin'],
    firstSentence: 'Bacon ipsum dolor amet short loin ribeye pork chop tenderloin.'
  },
  cupcake: {
    name: 'Cupcake Ipsum',
    words: ['cupcake', 'ipsum', 'dolor', 'sit', 'amet', 'chocolate', 'cake', 'sweet', 'sugar', 'frosting', 'sprinkles', 'vanilla', 'buttercream', 'cherry', 'strawberry', 'blueberry', 'raspberry', 'muffin', 'donut', 'cookie', 'brownie', 'pie', 'tart', 'pastry', 'cream', 'icing', 'glaze', 'topping', 'filling', 'decoration'],
    firstSentence: 'Cupcake ipsum dolor sit amet chocolate cake sweet.'
  },
  hipster: {
    name: 'Hipster Ipsum',
    words: ['hipster', 'ipsum', 'dolor', 'sit', 'amet', 'artisan', 'organic', 'sustainable', 'vegan', 'gluten-free', 'locally', 'sourced', 'farm-to-table', 'craft', 'beer', 'coffee', 'vinyl', 'record', 'vintage', 'retro', 'indie', 'alternative', 'minimalist', 'aesthetic', 'trendy', 'unique', 'authentic', 'handmade', 'bespoke', 'curated'],
    firstSentence: 'Hipster ipsum dolor sit amet artisan organic sustainable.'
  }
};

export default function LoremIpsumGenerator() {
  const [textType, setTextType] = useState<keyof typeof PLACEHOLDER_TEXTS>('lorem');
  const [outputType, setOutputType] = useState<'paragraphs' | 'words' | 'sentences'>('paragraphs');
  const [count, setCount] = useState<number>(3);
  const [generatedText, setGeneratedText] = useState<string>('');
  const [startWithLorem, setStartWithLorem] = useState<boolean>(true);

  useSEO({
    title: 'Free Lorem Ipsum Generator - Generate Placeholder Text Online | Lorem Ipsum Text Generator',
    description: 'Free online Lorem Ipsum generator. Generate placeholder text in paragraphs, words, or sentences. Multiple text types: Lorem Ipsum, Bacon Ipsum, Cupcake Ipsum, Hipster Ipsum. Copy to clipboard. No registration required.',
    url: '/resources/utility-tools/lorem-ipsum-generator',
    keywords: [
      'lorem ipsum generator', 'lorem ipsum', 'placeholder text generator', 'dummy text generator',
      'lorem ipsum text', 'generate lorem ipsum', 'bacon ipsum', 'cupcake ipsum', 'hipster ipsum',
      'placeholder text', 'dummy text', 'text generator', 'online lorem ipsum'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Lorem Ipsum Generator',
      'description': 'Free online Lorem Ipsum generator. Generate placeholder text in paragraphs, words, or sentences.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/lorem-ipsum-generator',
      'applicationCategory': 'UtilityApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Generate paragraphs, words, or sentences',
        'Multiple text types (Lorem, Bacon, Cupcake, Hipster)',
        'Customizable count',
        'Copy to clipboard',
        'HTML format option'
      ]
    }
  });

  const getRandomWord = (): string => {
    const words = PLACEHOLDER_TEXTS[textType].words;
    return words[Math.floor(Math.random() * words.length)];
  };

  const generateSentence = (): string => {
    const wordCount = Math.floor(Math.random() * 10) + 8; // 8-17 words
    const words: string[] = [];
    
    for (let i = 0; i < wordCount; i++) {
      words.push(getRandomWord());
    }
    
    // Capitalize first word
    words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    
    return words.join(' ') + '.';
  };

  const generateParagraph = (): string => {
    const sentenceCount = Math.floor(Math.random() * 3) + 3; // 3-5 sentences
    const sentences: string[] = [];
    
    for (let i = 0; i < sentenceCount; i++) {
      sentences.push(generateSentence());
    }
    
    return sentences.join(' ');
  };

  const generateText = () => {
    let result = '';
    
    if (outputType === 'words') {
      const words: string[] = [];
      for (let i = 0; i < count; i++) {
        words.push(getRandomWord());
      }
      result = words.join(' ');
    } else if (outputType === 'sentences') {
      const sentences: string[] = [];
      for (let i = 0; i < count; i++) {
        sentences.push(generateSentence());
      }
      result = sentences.join(' ');
    } else {
      // paragraphs
      const paragraphs: string[] = [];
      for (let i = 0; i < count; i++) {
        paragraphs.push(generateParagraph());
      }
      result = paragraphs.join('\n\n');
    }
    
    // Start with Lorem Ipsum if enabled and using lorem type
    if (startWithLorem && textType === 'lorem' && outputType === 'paragraphs') {
      result = PLACEHOLDER_TEXTS.lorem.firstSentence + ' ' + result;
    }
    
    setGeneratedText(result);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedText);
      alert('Text copied to clipboard!');
    } catch (err) {
      alert('Failed to copy text. Please select and copy manually.');
    }
  };

  const copyAsHTML = () => {
    const htmlText = generatedText
      .split('\n\n')
      .map(p => `<p>${p}</p>`)
      .join('\n');
    
    navigator.clipboard.writeText(htmlText).then(() => {
      alert('HTML text copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy text. Please select and copy manually.');
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lorem Ipsum Generator</h1>
        <p className="text-gray-600 mb-6">
          Generate placeholder text for your designs, mockups, and prototypes. Choose from multiple text types and formats.
        </p>

        <div className="space-y-6">
          {/* Text Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(PLACEHOLDER_TEXTS).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => setTextType(key as keyof typeof PLACEHOLDER_TEXTS)}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    textType === key
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {value.name}
                </button>
              ))}
            </div>
          </div>

          {/* Output Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Output Type
            </label>
            <div className="flex flex-wrap gap-3">
              {(['paragraphs', 'words', 'sentences'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setOutputType(type)}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors capitalize ${
                    outputType === type
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Count Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Count: {count}
            </label>
            <input
              type="range"
              min="1"
              max={outputType === 'words' ? '100' : outputType === 'sentences' ? '20' : '10'}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>{outputType === 'words' ? '100' : outputType === 'sentences' ? '20' : '10'}</span>
            </div>
          </div>

          {/* Start with Lorem option (only for lorem type) */}
          {textType === 'lorem' && outputType === 'paragraphs' && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="startWithLorem"
                checked={startWithLorem}
                onChange={(e) => setStartWithLorem(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="startWithLorem" className="text-sm text-gray-700">
                Start with "Lorem ipsum dolor sit amet..."
              </label>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={generateText}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Generate {outputType.charAt(0).toUpperCase() + outputType.slice(1)}
          </button>

          {/* Generated Text Output */}
          {generatedText && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Generated Text
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    Copy Text
                  </button>
                  {outputType === 'paragraphs' && (
                    <button
                      onClick={copyAsHTML}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      Copy as HTML
                    </button>
                  )}
                </div>
              </div>
              <textarea
                value={generatedText}
                readOnly
                className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none"
                style={{ whiteSpace: 'pre-wrap' }}
              />
              <p className="text-xs text-gray-500 mt-2">
                {generatedText.split(/\s+/).length} words • {generatedText.length} characters
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SEO Content */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">About Lorem Ipsum Generator</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 mb-4">
            Lorem Ipsum is placeholder text commonly used in the design and publishing industries. 
            It's used to demonstrate the visual form of a document or typeface without relying on meaningful content.
          </p>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Features</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Generate paragraphs, words, or sentences</li>
            <li>Multiple text types: Lorem Ipsum, Bacon Ipsum, Cupcake Ipsum, Hipster Ipsum</li>
            <li>Customizable count (1-100 words, 1-20 sentences, 1-10 paragraphs)</li>
            <li>Copy to clipboard with one click</li>
            <li>Copy as HTML format for web development</li>
            <li>Word and character count</li>
          </ul>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Use Cases</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Web design mockups and prototypes</li>
            <li>Print design layouts</li>
            <li>Testing typography and font choices</li>
            <li>Filling space in templates</li>
            <li>Demonstrating content structure</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

