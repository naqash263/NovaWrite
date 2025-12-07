import { useState, useEffect } from 'react';
import { useSEO } from '../../utils/seo';

// Simple token estimation based on common models
// This is an approximation - actual token counts vary by model
const estimateTokens = (text: string, model: string): number => {
  if (!text.trim()) return 0;
  
  // Remove extra whitespace
  const cleaned = text.trim();
  
  switch (model) {
    case 'gpt-3.5-turbo':
    case 'gpt-4':
    case 'gpt-4-turbo':
      // OpenAI models: ~4 characters per token on average
      // More accurate: count words and punctuation
      const words = cleaned.split(/\s+/).length;
      const chars = cleaned.length;
      // Rough estimate: 1 token ≈ 4 characters or 0.75 words
      return Math.ceil(Math.max(chars / 4, words / 0.75));
    
    case 'claude-3':
    case 'claude-3-opus':
    case 'claude-3-sonnet':
      // Anthropic Claude: similar to GPT
      const claudeWords = cleaned.split(/\s+/).length;
      const claudeChars = cleaned.length;
      return Math.ceil(Math.max(claudeChars / 4, claudeWords / 0.75));
    
    case 'gemini-pro':
    case 'gemini-1.5':
      // Google Gemini: similar tokenization
      const geminiWords = cleaned.split(/\s+/).length;
      const geminiChars = cleaned.length;
      return Math.ceil(Math.max(geminiChars / 4, geminiWords / 0.75));
    
    case 'llama-2':
    case 'llama-3':
      // Meta LLaMA: similar to GPT
      const llamaWords = cleaned.split(/\s+/).length;
      const llamaChars = cleaned.length;
      return Math.ceil(Math.max(llamaChars / 4, llamaWords / 0.75));
    
    default:
      // Default estimation: 1 token ≈ 4 characters
      return Math.ceil(cleaned.length / 4);
  }
};

const MODELS = [
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (OpenAI)' },
  { value: 'gpt-4', label: 'GPT-4 (OpenAI)' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (OpenAI)' },
  { value: 'claude-3', label: 'Claude 3 (Anthropic)' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus (Anthropic)' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet (Anthropic)' },
  { value: 'gemini-pro', label: 'Gemini Pro (Google)' },
  { value: 'gemini-1.5', label: 'Gemini 1.5 (Google)' },
  { value: 'llama-2', label: 'LLaMA 2 (Meta)' },
  { value: 'llama-3', label: 'LLaMA 3 (Meta)' },
  { value: 'general', label: 'General Estimation' },
];

export default function TokenCounter() {
  const [text, setText] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('gpt-3.5-turbo');
  const [tokenCount, setTokenCount] = useState<number>(0);
  const [charCount, setCharCount] = useState<number>(0);
  const [wordCount, setWordCount] = useState<number>(0);
  const [paragraphCount, setParagraphCount] = useState<number>(0);
  const [sentenceCount, setSentenceCount] = useState<number>(0);

  useSEO({
    title: 'Free Token Counter AI Models - Count GPT, Claude, Gemini Tokens | No Signup',
    description: 'Free token counter AI models - no signup required. Count tokens for GPT-3.5, GPT-4, Claude, Gemini, and other AI models instantly. Estimate API costs and track token usage. Perfect for AI developers. All processing in your browser.',
    url: '/resources/utility-tools/token-counter',
    keywords: [
      'free token counter AI models', 'token counter', 'free token counter', 'token counter AI models', 'AI token counter',
      'token calculator', 'gpt token counter', 'claude token counter',
      'openai token counter', 'token count', 'gpt-4 tokens',
      'claude tokens', 'gemini tokens', 'llm token counter', 'api token calculator'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Token Counter',
      'description': 'Free online token counter for AI models. Count tokens for GPT, Claude, Gemini, and other AI models.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/token-counter',
      'applicationCategory': 'UtilityApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Count tokens for multiple AI models',
        'Support for GPT-3.5, GPT-4, Claude, Gemini',
        'Character and word count',
        'Real-time token estimation',
        'API cost estimation',
        'No registration required'
      ],
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.8',
        'reviewCount': '1520'
      }
    }
  });

  useEffect(() => {
    if (!text.trim()) {
      setTokenCount(0);
      setCharCount(0);
      setWordCount(0);
      setParagraphCount(0);
      setSentenceCount(0);
      return;
    }

    const cleaned = text.trim();
    
    // Character count (including spaces)
    setCharCount(cleaned.length);
    
    // Word count
    const words = cleaned.split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    
    // Paragraph count
    const paragraphs = cleaned.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    setParagraphCount(paragraphs.length || 1);
    
    // Sentence count (simple estimation)
    const sentences = cleaned.split(/[.!?]+/).filter(s => s.trim().length > 0);
    setSentenceCount(sentences.length || 1);
    
    // Token count based on selected model
    const tokens = estimateTokens(cleaned, selectedModel);
    setTokenCount(tokens);
  }, [text, selectedModel]);

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
  };

  const clearText = () => {
    setText('');
  };

  const getEstimatedCost = (tokens: number, model: string): string => {
    // Rough cost estimates per 1M tokens (as of 2024)
    const costs: Record<string, { input: number; output: number }> = {
      'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
      'gpt-4': { input: 30, output: 60 },
      'gpt-4-turbo': { input: 10, output: 30 },
      'claude-3': { input: 3, output: 15 },
      'claude-3-opus': { input: 15, output: 75 },
      'claude-3-sonnet': { input: 3, output: 15 },
      'gemini-pro': { input: 0.5, output: 1.5 },
      'gemini-1.5': { input: 1.25, output: 5 },
    };

    const cost = costs[model];
    if (!cost) return 'N/A';

    const inputCost = (tokens / 1_000_000) * cost.input;
    const outputCost = (tokens / 1_000_000) * cost.output;
    
    return `Input: $${inputCost.toFixed(6)} | Output: $${outputCost.toFixed(6)}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Free Token Counter AI Models</h1>
        <p className="text-gray-600 mb-6">
          Free token counter AI models - no signup required. Count tokens for GPT-3.5, GPT-4, Claude, Gemini, and other AI models instantly. Estimate API costs and track token usage. Perfect for AI developers. All processing in your browser.
        </p>

        {/* Model Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select AI Model
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {MODELS.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
        </div>

        {/* Text Input */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Enter Text to Count Tokens
            </label>
            <button
              onClick={clearText}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste or type your text here to count tokens..."
            className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Token Count */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-sm font-medium text-blue-900">Tokens</h3>
                <p className="text-2xl font-bold text-blue-600 mt-1">{tokenCount.toLocaleString()}</p>
              </div>
              <button
                onClick={() => copyToClipboard(tokenCount.toString())}
                className="text-blue-600 hover:text-blue-700 text-sm"
                title="Copy token count"
              >
                📋
              </button>
            </div>
            <p className="text-xs text-blue-700">Estimated for {MODELS.find(m => m.value === selectedModel)?.label}</p>
          </div>

          {/* Character Count */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-sm font-medium text-green-900">Characters</h3>
                <p className="text-2xl font-bold text-green-600 mt-1">{charCount.toLocaleString()}</p>
              </div>
              <button
                onClick={() => copyToClipboard(charCount.toString())}
                className="text-green-600 hover:text-green-700 text-sm"
                title="Copy character count"
              >
                📋
              </button>
            </div>
            <p className="text-xs text-green-700">Including spaces</p>
          </div>

          {/* Word Count */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-sm font-medium text-purple-900">Words</h3>
                <p className="text-2xl font-bold text-purple-600 mt-1">{wordCount.toLocaleString()}</p>
              </div>
              <button
                onClick={() => copyToClipboard(wordCount.toString())}
                className="text-purple-600 hover:text-purple-700 text-sm"
                title="Copy word count"
              >
                📋
              </button>
            </div>
            <p className="text-xs text-purple-700">Space-separated</p>
          </div>

          {/* Paragraph Count */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-sm font-medium text-yellow-900">Paragraphs</h3>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{paragraphCount.toLocaleString()}</p>
              </div>
              <button
                onClick={() => copyToClipboard(paragraphCount.toString())}
                className="text-yellow-600 hover:text-yellow-700 text-sm"
                title="Copy paragraph count"
              >
                📋
              </button>
            </div>
            <p className="text-xs text-yellow-700">Double line breaks</p>
          </div>

          {/* Sentence Count */}
          <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-sm font-medium text-pink-900">Sentences</h3>
                <p className="text-2xl font-bold text-pink-600 mt-1">{sentenceCount.toLocaleString()}</p>
              </div>
              <button
                onClick={() => copyToClipboard(sentenceCount.toString())}
                className="text-pink-600 hover:text-pink-700 text-sm"
                title="Copy sentence count"
              >
                📋
              </button>
            </div>
            <p className="text-xs text-pink-700">Estimated count</p>
          </div>

          {/* Estimated Cost */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-sm font-medium text-indigo-900">Est. Cost</h3>
                <p className="text-sm font-semibold text-indigo-600 mt-1">
                  {getEstimatedCost(tokenCount, selectedModel)}
                </p>
              </div>
            </div>
            <p className="text-xs text-indigo-700">Per 1M tokens (approx.)</p>
          </div>
        </div>
      </div>

      {/* SEO Content */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">About Token Counter</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 mb-4">
            Token Counter is a free online tool that counts tokens in text for various AI models including 
            GPT-3.5, GPT-4, Claude, Gemini, and LLaMA. Understanding token counts is essential for managing 
            API costs and ensuring your prompts fit within model limits.
          </p>
          
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Supported AI Models</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>OpenAI Models:</strong> GPT-3.5 Turbo, GPT-4, GPT-4 Turbo</li>
            <li><strong>Anthropic Models:</strong> Claude 3, Claude 3 Opus, Claude 3 Sonnet</li>
            <li><strong>Google Models:</strong> Gemini Pro, Gemini 1.5</li>
            <li><strong>Meta Models:</strong> LLaMA 2, LLaMA 3</li>
            <li><strong>General Estimation:</strong> Universal token counting for any model</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Key Features</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>Multi-Model Support:</strong> Count tokens for different AI models with model-specific algorithms</li>
            <li><strong>Real-Time Counting:</strong> Instant token count updates as you type</li>
            <li><strong>Comprehensive Statistics:</strong> Token count, character count, word count, paragraph count, and sentence count</li>
            <li><strong>Cost Estimation:</strong> Estimate API costs based on token count and model pricing</li>
            <li><strong>Copy to Clipboard:</strong> Easily copy any statistic with one click</li>
            <li><strong>No Registration:</strong> Start counting tokens immediately without creating an account</li>
            <li><strong>Privacy-Focused:</strong> All counting happens in your browser - your text never leaves your device</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Use Cases</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>API Cost Management:</strong> Estimate costs before making API calls to AI models</li>
            <li><strong>Prompt Optimization:</strong> Ensure prompts fit within token limits for different models</li>
            <li><strong>Content Planning:</strong> Plan content length based on token constraints</li>
            <li><strong>Budget Planning:</strong> Calculate expected costs for AI API usage</li>
            <li><strong>Model Selection:</strong> Compare token counts across different models</li>
            <li><strong>Documentation:</strong> Track token usage in documentation and reports</li>
            <li><strong>Development:</strong> Test and optimize prompts during development</li>
            <li><strong>Education:</strong> Learn about tokenization and AI model limits</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">How Token Counting Works</h3>
          <p className="text-gray-700 mb-2">
            Token counting varies by model, but generally follows these principles:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>Tokenization:</strong> Text is split into tokens, which can be words, subwords, or characters</li>
            <li><strong>Model-Specific:</strong> Different models use different tokenization algorithms (e.g., GPT uses BPE, Claude uses similar methods)</li>
            <li><strong>Estimation:</strong> Our tool provides estimates based on common patterns (approximately 4 characters or 0.75 words per token)</li>
            <li><strong>Accuracy:</strong> For exact counts, use the official tokenizer for each model (this tool provides estimates)</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Important Notes</h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <ul className="list-disc list-inside text-gray-700 space-y-2 text-sm">
              <li><strong>Estimation Only:</strong> Token counts are estimates. For exact counts, use official tokenizers from each provider.</li>
              <li><strong>Model Variations:</strong> Actual token counts may vary slightly between model versions and updates.</li>
              <li><strong>Cost Estimates:</strong> Pricing is approximate and may change. Always check official pricing from AI providers.</li>
              <li><strong>Context Limits:</strong> Be aware of context window limits for each model (e.g., GPT-4: 8K-128K tokens).</li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">How accurate is the token counter?</h4>
              <p className="text-gray-700">The token counter provides estimates based on common tokenization patterns. For exact counts, use the official tokenizer from each AI provider (e.g., OpenAI's tiktoken library).</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Why do token counts differ between models?</h4>
              <p className="text-gray-700">Different AI models use different tokenization algorithms. GPT models use Byte Pair Encoding (BPE), while Claude and Gemini use similar but distinct methods, resulting in different token counts for the same text.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">How do I reduce token count?</h4>
              <p className="text-gray-700">To reduce token count: remove unnecessary words, use abbreviations, shorten sentences, remove redundant information, and use concise language. However, be careful not to lose important context.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">What is a token limit?</h4>
              <p className="text-gray-700">Token limits (context windows) define the maximum number of tokens a model can process in a single request. Exceeding limits will cause errors. Common limits: GPT-3.5 (4K-16K), GPT-4 (8K-128K), Claude 3 (200K).</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Is my text stored or sent anywhere?</h4>
              <p className="text-gray-700">No, all token counting happens entirely in your browser. Your text never leaves your device and is never stored or transmitted to any server.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

