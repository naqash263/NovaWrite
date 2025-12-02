import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSEO } from '../../utils/seo';
import { generateBreadcrumbSchema, generateFAQSchema, injectStructuredData } from '../../utils/structuredData';
import AdPlacement from '../../components/AdPlacement';
import TextSummarizer from '../../components/tools/TextSummarizer';
import ArticleRewriter from '../../components/tools/ArticleRewriter';
import GrammarChecker from '../../components/tools/GrammarChecker';
import LanguageTranslator from '../../components/tools/LanguageTranslator';
import KeywordExtractor from '../../components/tools/KeywordExtractor';

type AIToolType = 
  | 'text-summarizer' | 'article-rewriter' | 'grammar-checker' | 'language-translator' | 'keyword-extractor';

interface AIToolOption {
  id: AIToolType;
  name: string;
  icon: string;
  category: 'text' | 'writing' | 'analysis';
  description: string;
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
}

const aiToolOptions: AIToolOption[] = [
  { 
    id: 'text-summarizer', 
    name: 'Text Summarizer', 
    icon: '📝', 
    category: 'text', 
    description: 'Summarize long articles, documents, and text instantly using AI',
    seoTitle: 'Free Text Summarizer - AI-Powered Text Summary Tool | Summarize Articles Online',
    seoDescription: 'Free AI-powered text summarizer. Summarize long articles, documents, and text instantly. Choose from short, medium, or long summaries. No registration required.',
    keywords: ['text summarizer', 'article summarizer', 'text summary', 'summarize text', 'AI summarizer', 'online summarizer']
  },
  { 
    id: 'article-rewriter', 
    name: 'Article Rewriter', 
    icon: '✍️', 
    category: 'writing', 
    description: 'Rewrite articles and text while maintaining meaning with multiple styles',
    seoTitle: 'Free Article Rewriter & Paraphrase Tool - AI-Powered Text Rewriting | Online Paraphrasing Tool',
    seoDescription: 'Free AI-powered article rewriter and paraphrase tool. Rewrite articles, essays, and text while maintaining meaning. Multiple writing styles and tones. Plagiarism-free rewriting. No registration required.',
    keywords: ['article rewriter', 'paraphrase tool', 'text rewriter', 'rewrite article', 'AI rewriter', 'online rewriter', 'paraphrasing tool']
  },
  { 
    id: 'grammar-checker', 
    name: 'Grammar Checker', 
    icon: '✅', 
    category: 'writing', 
    description: 'Check spelling, grammar, and style errors with AI-powered corrections',
    seoTitle: 'Free Grammar Checker & Corrector - AI-Powered Grammar Check Tool | Online Grammar Checker',
    seoDescription: 'Free AI-powered grammar checker and corrector. Check spelling, grammar, and style errors instantly. Get suggestions for improvements. Perfect for writers, students, and professionals. No registration required.',
    keywords: ['grammar checker', 'grammar corrector', 'spell checker', 'grammar check', 'AI grammar checker', 'online grammar checker']
  },
  { 
    id: 'language-translator', 
    name: 'Language Translator', 
    icon: '🌐', 
    category: 'text', 
    description: 'Translate text between 30+ languages with AI-powered accuracy',
    seoTitle: 'Free Language Translator - AI-Powered Translation Tool | Translate Text Online',
    seoDescription: 'Free AI-powered language translator. Translate text between 30+ languages instantly. Preserve formatting, accurate translations. Perfect for students, travelers, and professionals. No registration required.',
    keywords: ['language translator', 'text translator', 'online translator', 'translate text', 'AI translator', 'free translator']
  },
];

export default function AITools() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTool, setSelectedTool] = useState<AIToolType>(
    (searchParams.get('tool') as AIToolType) || 'text-summarizer'
  );
  const [searchQuery, setSearchQuery] = useState('');

  const selectedToolInfo = aiToolOptions.find(t => t.id === selectedTool);
  
  // Dynamic SEO based on selected tool
  const seoTitle = selectedToolInfo?.seoTitle || 'Free AI-Powered Tools - Text Summarizer & More | Naqash Thaheem';
  const seoDescription = selectedToolInfo?.seoDescription || 'Free AI-powered utility tools: Text Summarizer, Article Rewriter, Grammar Checker, and more. All tools use advanced AI to help you work smarter. No registration required.';
  const seoKeywords = selectedToolInfo?.keywords || ['AI tools', 'text summarizer', 'AI-powered tools', 'free AI tools', 'online AI tools', 'text analysis'];

  useSEO({
    title: seoTitle,
    description: seoDescription,
    url: `/resources/ai-tools${selectedTool !== 'text-summarizer' ? `?tool=${selectedTool}` : ''}`,
    keywords: seoKeywords,
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': selectedToolInfo?.name || 'AI Tools',
      'description': seoDescription,
      'url': 'https://naqashthaheem.com/resources/ai-tools',
      'applicationCategory': 'UtilityApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': aiToolOptions.map(t => t.name),
    }
  });

  useEffect(() => {
    // Add breadcrumb structured data
    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Home', url: 'https://naqashthaheem.com' },
      { name: 'Resources', url: 'https://naqashthaheem.com/resources' },
      { name: 'AI Tools', url: 'https://naqashthaheem.com/resources/ai-tools' },
      ...(selectedToolInfo ? [{ name: selectedToolInfo.name, url: `https://naqashthaheem.com/resources/ai-tools?tool=${selectedTool}` }] : [])
    ]);
    injectStructuredData(breadcrumbSchema);

    // Add FAQ structured data
    const faqSchema = generateFAQSchema([
      {
        question: 'Are these AI tools free to use?',
        answer: 'Yes, all AI tools are completely free to use with no registration required. We use advanced AI technology to provide these services at no cost to you.'
      },
      {
        question: 'How accurate are the AI-generated results?',
        answer: 'Our AI tools use state-of-the-art language models to provide accurate and high-quality results. The accuracy depends on the input quality and the specific tool being used.'
      },
      {
        question: 'Is there a limit on how many times I can use these tools?',
        answer: 'There are reasonable usage limits to ensure fair access for all users. Limits are reset daily, and authenticated users may have higher limits.'
      },
      {
        question: 'Do these tools store my data?',
        answer: 'We process your data to generate results, but we do not store your input text or generated content. Your privacy is important to us.'
      },
      {
        question: 'Can I use these tools on mobile devices?',
        answer: 'Yes, all AI tools are fully responsive and work perfectly on mobile phones, tablets, and desktop computers.'
      }
    ]);
    injectStructuredData(faqSchema);
  }, [selectedTool, selectedToolInfo]);

  const handleToolSelect = (toolId: AIToolType) => {
    setSelectedTool(toolId);
    setSearchParams({ tool: toolId });
  };

  const filteredTools = aiToolOptions.filter(option =>
    option.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedTools = {
    text: filteredTools.filter(t => t.category === 'text'),
    writing: filteredTools.filter(t => t.category === 'writing'),
    analysis: filteredTools.filter(t => t.category === 'analysis'),
  };

  const renderTool = () => {
    switch (selectedTool) {
      case 'text-summarizer': return <TextSummarizer />;
      case 'article-rewriter': return <ArticleRewriter />;
      case 'grammar-checker': return <GrammarChecker />;
      case 'language-translator': return <LanguageTranslator />;
      case 'keyword-extractor': return <KeywordExtractor />;
      default: return <TextSummarizer />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            🤖 AI-Powered Tools
          </h1>
          <p className="text-gray-600">
            Free AI-powered utility tools for text processing, writing, and analysis
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 sticky top-4">
              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Tool List */}
              <div className="space-y-2">
                {Object.entries(groupedTools).map(([category, tools]) => (
                  tools.length > 0 && (
                    <div key={category} className="mb-4">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        {category === 'text' ? 'Text Tools' : category === 'writing' ? 'Writing Tools' : 'Analysis Tools'}
                      </h3>
                      {tools.map((tool) => (
                        <button
                          key={tool.id}
                          onClick={() => handleToolSelect(tool.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors text-sm ${
                            selectedTool === tool.id
                              ? 'bg-blue-100 text-blue-900 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span className="mr-2">{tool.icon}</span>
                          {tool.name}
                        </button>
                      ))}
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Ad at top of tool */}
            <div className="mb-6">
              <AdPlacement position="content-top" />
            </div>
            
            {renderTool()}
            <AdPlacement position="content-bottom" />
          </div>
        </div>
      </div>
    </div>
  );
}

