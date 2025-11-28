import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSEO } from '../../utils/seo';
import { generateBreadcrumbSchema, generateFAQSchema, injectStructuredData } from '../../utils/structuredData';
import AdPlacement from '../../components/AdPlacement';
import TextToSpeech from '../../components/tools/TextToSpeech';
import PasswordGenerator from '../../components/tools/PasswordGenerator';
import QRCodeGenerator from '../../components/tools/QRCodeGenerator';
import ImageResizer from '../../components/tools/ImageResizer';
import WordCounter from '../../components/tools/WordCounter';
import LoanCalculator from '../../components/tools/LoanCalculator';
import JSONFormatter from '../../components/tools/JSONFormatter';

type ToolType = 
  | 'text-to-speech' | 'password-generator' | 'qr-code-generator' 
  | 'image-resizer' | 'word-counter' | 'loan-calculator' | 'json-formatter';

interface ToolOption {
  id: ToolType;
  name: string;
  icon: string;
  category: 'productivity' | 'developer' | 'financial';
  description: string;
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
}

const toolOptions: ToolOption[] = [
  { 
    id: 'text-to-speech', 
    name: 'Text to Speech', 
    icon: '🔊', 
    category: 'productivity', 
    description: 'Convert text to natural-sounding speech with multiple voices and controls',
    seoTitle: 'Free Text to Speech Converter - Online TTS Tool | Convert Text to Voice',
    seoDescription: 'Free online text to speech converter. Convert any text to natural-sounding speech with multiple voices, adjustable speed, pitch, and volume. No registration required.',
    keywords: ['text to speech', 'TTS', 'speech synthesis', 'text to voice', 'voice generator', 'online TTS']
  },
  { 
    id: 'password-generator', 
    name: 'Password Generator', 
    icon: '🔐', 
    category: 'productivity', 
    description: 'Generate strong, secure, random passwords with customizable options',
    seoTitle: 'Free Password Generator - Strong Random Password Creator | Secure Password Tool',
    seoDescription: 'Generate strong, secure, random passwords instantly. Customize length, character types, and complexity. Includes password strength meter. Free, no registration required.',
    keywords: ['password generator', 'random password', 'strong password', 'secure password', 'password creator']
  },
  { 
    id: 'qr-code-generator', 
    name: 'QR Code Generator', 
    icon: '📱', 
    category: 'productivity', 
    description: 'Generate QR codes for URLs, text, WiFi, contact info, and more',
    seoTitle: 'Free QR Code Generator - Create QR Codes Online | QR Code Maker',
    seoDescription: 'Generate QR codes instantly for URLs, text, WiFi, contact info, and more. Customize colors, size, and error correction. Download as PNG or SVG. Free, no registration required.',
    keywords: ['QR code generator', 'QR code maker', 'QR code creator', 'generate QR code', 'QR code online']
  },
  { 
    id: 'image-resizer', 
    name: 'Image Resizer', 
    icon: '🖼️', 
    category: 'productivity', 
    description: 'Resize images online with adjustable dimensions, format, and quality',
    seoTitle: 'Free Image Resizer - Resize Images Online | Image Size Converter',
    seoDescription: 'Resize images online for free. Adjust width, height, maintain aspect ratio, change format, and adjust quality. Download resized images instantly. No registration required.',
    keywords: ['image resizer', 'resize image', 'image size converter', 'resize photo', 'image compressor']
  },
  { 
    id: 'word-counter', 
    name: 'Word Counter', 
    icon: '📊', 
    category: 'productivity', 
    description: 'Count characters, words, sentences, paragraphs, and analyze text statistics',
    seoTitle: 'Free Word Counter & Text Analyzer - Character Count, Word Count Tool | Online Text Counter',
    seoDescription: 'Free online word counter and text analyzer. Count characters, words, sentences, paragraphs. Calculate reading time and speaking time. Perfect for writers, students, and content creators.',
    keywords: ['word counter', 'character counter', 'text analyzer', 'word count', 'character count', 'text counter']
  },
  { 
    id: 'loan-calculator', 
    name: 'Loan Calculator', 
    icon: '💰', 
    category: 'financial', 
    description: 'Calculate monthly payments, total interest, and view amortization schedule',
    seoTitle: 'Free Loan Calculator - Mortgage, Auto, Personal Loan Calculator | Amortization Calculator',
    seoDescription: 'Free online loan calculator. Calculate monthly payments, total interest, and amortization schedule for mortgages, auto loans, and personal loans. No registration required.',
    keywords: ['loan calculator', 'mortgage calculator', 'auto loan calculator', 'personal loan calculator', 'amortization calculator']
  },
  { 
    id: 'json-formatter', 
    name: 'JSON Formatter', 
    icon: '📋', 
    category: 'developer', 
    description: 'Format, validate, beautify, and minify JSON data with syntax validation',
    seoTitle: 'Free JSON Formatter & Validator - Beautify, Minify, Validate JSON | Online JSON Tool',
    seoDescription: 'Free online JSON formatter and validator. Beautify, minify, validate, and format JSON data. Includes syntax highlighting and error detection. No registration required.',
    keywords: ['JSON formatter', 'JSON validator', 'JSON beautifier', 'JSON minifier', 'format JSON', 'validate JSON']
  },
];

export default function UtilityTools() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTool, setSelectedTool] = useState<ToolType>(
    (searchParams.get('tool') as ToolType) || 'text-to-speech'
  );
  const [searchQuery, setSearchQuery] = useState('');

  const selectedToolInfo = toolOptions.find(t => t.id === selectedTool);
  
  // Dynamic SEO based on selected tool
  const seoTitle = selectedToolInfo?.seoTitle || 'Free Utility Tools - Text to Speech, Password Generator, QR Code & More | Naqash Thaheem';
  const seoDescription = selectedToolInfo?.seoDescription || 'Comprehensive collection of free utility tools: Text to Speech, Password Generator, QR Code Generator, Image Resizer, Word Counter, Loan Calculator, and JSON Formatter. All tools are free and easy to use.';
  const seoKeywords = selectedToolInfo?.keywords || ['utility tools', 'text to speech', 'password generator', 'QR code generator', 'image resizer', 'word counter', 'loan calculator', 'JSON formatter', 'free tools', 'online tools'];

  useSEO({
    title: seoTitle,
    description: seoDescription,
    url: `/resources/utility-tools${selectedTool !== 'text-to-speech' ? `?tool=${selectedTool}` : ''}`,
    keywords: seoKeywords,
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': selectedToolInfo?.name || 'Utility Tools',
      'description': seoDescription,
      'url': 'https://naqashthaheem.com/resources/utility-tools',
      'applicationCategory': 'UtilityApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': toolOptions.map(t => t.name),
    }
  });

  useEffect(() => {
    // Add breadcrumb structured data
    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Home', url: 'https://naqashthaheem.com' },
      { name: 'Resources', url: 'https://naqashthaheem.com/resources' },
      { name: 'Utility Tools', url: 'https://naqashthaheem.com/resources/utility-tools' },
      ...(selectedToolInfo ? [{ name: selectedToolInfo.name, url: `https://naqashthaheem.com/resources/utility-tools?tool=${selectedTool}` }] : [])
    ]);
    injectStructuredData(breadcrumbSchema);

    // Add FAQ structured data
    const faqSchema = generateFAQSchema([
      {
        question: 'Are these utility tools free to use?',
        answer: 'Yes, all utility tools are completely free to use with no registration required. You can use them as many times as you need without any limitations.'
      },
      {
        question: 'Do these tools store my data?',
        answer: 'No, all processing is performed locally in your browser. We do not store, track, or transmit any of your input data. Your privacy is our priority.'
      },
      {
        question: 'Can I use these tools on mobile devices?',
        answer: 'Yes, all utility tools are fully responsive and work perfectly on mobile phones, tablets, and desktop computers.'
      },
      {
        question: 'How accurate are the calculations?',
        answer: 'All calculations use standard formulas and are accurate. Loan calculator uses standard amortization formulas, and all other tools use reliable algorithms.'
      },
      {
        question: 'Can I download the results?',
        answer: 'Yes, many tools support downloading results. QR codes can be downloaded as PNG or SVG, resized images can be downloaded, and JSON can be copied to clipboard.'
      }
    ]);
    injectStructuredData(faqSchema);
  }, [selectedTool, selectedToolInfo]);

  const handleToolSelect = (toolId: ToolType) => {
    setSelectedTool(toolId);
    setSearchParams({ tool: toolId });
  };

  const filteredTools = toolOptions.filter(option =>
    option.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedTools = {
    productivity: filteredTools.filter(t => t.category === 'productivity'),
    financial: filteredTools.filter(t => t.category === 'financial'),
    developer: filteredTools.filter(t => t.category === 'developer'),
  };

  const renderTool = () => {
    switch (selectedTool) {
      case 'text-to-speech': return <TextToSpeech />;
      case 'password-generator': return <PasswordGenerator />;
      case 'qr-code-generator': return <QRCodeGenerator />;
      case 'image-resizer': return <ImageResizer />;
      case 'word-counter': return <WordCounter />;
      case 'loan-calculator': return <LoanCalculator />;
      case 'json-formatter': return <JSONFormatter />;
      default: return <TextToSpeech />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            🛠️ Utility Tools
          </h1>
          <p className="text-gray-600">
            Free online utility tools for productivity, development, and financial calculations
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
                        {category === 'productivity' ? 'Productivity' : category === 'financial' ? 'Financial' : 'Developer'}
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

