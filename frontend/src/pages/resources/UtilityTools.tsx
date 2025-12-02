import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSEO } from '../../utils/seo';
import { generateBreadcrumbSchema, generateFAQSchema, injectStructuredData } from '../../utils/structuredData';
import AdPlacement from '../../components/AdPlacement';
import PasswordGenerator from '../../components/tools/PasswordGenerator';
import QRCodeGenerator from '../../components/tools/QRCodeGenerator';
import ImageResizer from '../../components/tools/ImageResizer';
import WordCounter from '../../components/tools/WordCounter';
import LoanCalculator from '../../components/tools/LoanCalculator';
import JSONFormatter from '../../components/tools/JSONFormatter';
import PDFMerger from '../../components/tools/PDFMerger';
import PDFSplitter from '../../components/tools/PDFSplitter';
import PDFCompressor from '../../components/tools/PDFCompressor';
import PDFRotate from '../../components/tools/PDFRotate';
import TipCalculator from '../../components/tools/TipCalculator';
import CompoundInterestCalculator from '../../components/tools/CompoundInterestCalculator';
import Base64Encoder from '../../components/tools/Base64Encoder';
import URLEncoder from '../../components/tools/URLEncoder';
import RegexTester from '../../components/tools/RegexTester';
import UUIDGenerator from '../../components/tools/UUIDGenerator';
import JWTDecoder from '../../components/tools/JWTDecoder';
import TextToImage from '../../components/tools/TextToImage';
import LoremIpsumGenerator from '../../components/tools/LoremIpsumGenerator';
import TextCaseConverter from '../../components/tools/TextCaseConverter';
import HashGenerator from '../../components/tools/HashGenerator';
import ImageCompressor from '../../components/tools/ImageCompressor';

type ToolType = 
  | 'password-generator' | 'qr-code-generator' 
  | 'image-resizer' | 'word-counter' | 'loan-calculator' | 'json-formatter'
  | 'pdf-merger' | 'pdf-splitter' | 'pdf-compressor' | 'pdf-rotate'
  | 'tip-calculator' | 'compound-interest-calculator' | 'base64-encoder' | 'url-encoder'
  | 'regex-tester' | 'uuid-generator' | 'jwt-decoder' | 'text-to-image'
  | 'lorem-ipsum-generator' | 'text-case-converter' | 'hash-generator' | 'image-compressor';

interface ToolOption {
  id: ToolType;
  name: string;
  icon: string;
  category: 'productivity' | 'developer' | 'financial' | 'pdf';
  description: string;
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
}

const toolOptions: ToolOption[] = [
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
    id: 'text-to-image', 
    name: 'Text to Image', 
    icon: '✨', 
    category: 'productivity', 
    description: 'Create beautiful images from text with customizable colors, fonts, and layouts',
    seoTitle: 'Free Text to Image Generator - Create Images from Text Online | Text Image Maker',
    seoDescription: 'Free online text to image generator. Create beautiful images from text with customizable colors, fonts, and layouts. Perfect for social media posts, quotes, and graphics.',
    keywords: ['text to image', 'text image generator', 'create image from text', 'text image maker', 'quote image generator']
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
    id: 'tip-calculator', 
    name: 'Tip Calculator', 
    icon: '💵', 
    category: 'financial', 
    description: 'Calculate tip amount, split bill, and total per person',
    seoTitle: 'Free Tip Calculator - Calculate Tip Amount & Split Bill | Online Tip Calculator',
    seoDescription: 'Free online tip calculator. Calculate tip amount, split bill, and total per person. Multiple tip percentages, round up option. Perfect for restaurants and services.',
    keywords: ['tip calculator', 'calculate tip', 'split bill calculator', 'restaurant tip calculator', 'tip percentage calculator']
  },
  { 
    id: 'compound-interest-calculator', 
    name: 'Compound Interest Calculator', 
    icon: '📈', 
    category: 'financial', 
    description: 'Calculate future value, investment growth, and returns with compound interest',
    seoTitle: 'Free Compound Interest Calculator - Investment Growth Calculator | Future Value Calculator',
    seoDescription: 'Free online compound interest calculator. Calculate future value, investment growth, and returns. Supports multiple compounding frequencies and additional contributions.',
    keywords: ['compound interest calculator', 'investment calculator', 'future value calculator', 'compound interest', 'investment growth calculator']
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
  { 
    id: 'base64-encoder', 
    name: 'Base64 Encoder', 
    icon: '🔐', 
    category: 'developer', 
    description: 'Encode text to Base64 or decode Base64 to text with UTF-8 support',
    seoTitle: 'Free Base64 Encoder & Decoder - Encode Decode Base64 Online | Base64 Converter',
    seoDescription: 'Free online Base64 encoder and decoder. Encode text to Base64 or decode Base64 to text. Instant conversion, copy to clipboard. Perfect for developers and data encoding.',
    keywords: ['Base64 encoder', 'Base64 decoder', 'Base64 converter', 'encode Base64', 'decode Base64', 'Base64 encode decode']
  },
  { 
    id: 'url-encoder', 
    name: 'URL Encoder', 
    icon: '🔗', 
    category: 'developer', 
    description: 'Encode URLs for safe transmission or decode URL-encoded strings',
    seoTitle: 'Free URL Encoder & Decoder - Encode Decode URL Online | URL Percent Encoding',
    seoDescription: 'Free online URL encoder and decoder. Encode URLs for safe transmission or decode URL-encoded strings. Percent encoding, instant conversion, copy to clipboard.',
    keywords: ['URL encoder', 'URL decoder', 'URL encode', 'URL decode', 'percent encoding', 'URL encoding']
  },
  { 
    id: 'regex-tester', 
    name: 'Regex Tester', 
    icon: '🔍', 
    category: 'developer', 
    description: 'Test regular expressions with real-time matching and highlighting',
    seoTitle: 'Free Regex Tester - Test Regular Expressions Online | Regex Pattern Tester',
    seoDescription: 'Free online regex tester. Test regular expressions with real-time matching, highlighting, and explanation. Supports all regex flags and common patterns.',
    keywords: ['regex tester', 'regular expression tester', 'regex test', 'regex pattern tester', 'online regex']
  },
  { 
    id: 'uuid-generator', 
    name: 'UUID Generator', 
    icon: '🆔', 
    category: 'developer', 
    description: 'Generate unique identifiers (UUIDs) - v1 and v4 support',
    seoTitle: 'Free UUID Generator - Generate UUIDs Online | UUID v1 v4 Generator',
    seoDescription: 'Free online UUID generator. Generate UUIDs (v1, v4), multiple UUIDs, validate UUIDs, and copy to clipboard. Perfect for developers and database IDs.',
    keywords: ['UUID generator', 'generate UUID', 'UUID v4', 'UUID v1', 'GUID generator', 'online UUID generator']
  },
  { 
    id: 'jwt-decoder', 
    name: 'JWT Decoder', 
    icon: '🔓', 
    category: 'developer', 
    description: 'Decode JWT tokens to view header and payload',
    seoTitle: 'Free JWT Decoder - Decode JWT Tokens Online | JWT Token Decoder',
    seoDescription: 'Free online JWT decoder. Decode JWT tokens to view header and payload. Pretty print JSON, validate structure. Perfect for debugging JWT tokens.',
    keywords: ['JWT decoder', 'decode JWT', 'JWT token decoder', 'JWT parser', 'online JWT decoder']
  },
  { 
    id: 'pdf-merger', 
    name: 'PDF Merger', 
    icon: '🔗', 
    category: 'pdf', 
    description: 'Combine multiple PDF files into one document with drag-and-drop reordering',
    seoTitle: 'Free PDF Merger - Combine Multiple PDFs Online | Merge PDF Files',
    seoDescription: 'Free online PDF merger. Combine multiple PDF files into one document. Drag and drop reordering, preview before merging. No registration required.',
    keywords: ['PDF merger', 'merge PDF', 'combine PDF', 'PDF combiner', 'merge PDF files', 'online PDF merger']
  },
  { 
    id: 'pdf-splitter', 
    name: 'PDF Splitter', 
    icon: '✂️', 
    category: 'pdf', 
    description: 'Split PDF into individual pages or extract specific pages and ranges',
    seoTitle: 'Free PDF Splitter - Split PDF Pages Online | Extract PDF Pages',
    seoDescription: 'Free online PDF splitter. Extract specific pages from PDF, split PDF into multiple files, or extract page ranges. All processing happens in your browser.',
    keywords: ['PDF splitter', 'split PDF', 'extract PDF pages', 'PDF page extractor', 'split PDF online', 'free PDF splitter']
  },
  { 
    id: 'pdf-compressor', 
    name: 'PDF Compressor', 
    icon: '📦', 
    category: 'pdf', 
    description: 'Reduce PDF file size while maintaining quality with multiple compression levels',
    seoTitle: 'Free PDF Compressor - Reduce PDF File Size Online | Compress PDF Files',
    seoDescription: 'Free online PDF compressor. Reduce PDF file size while maintaining quality. Choose compression level (low, medium, high). All processing happens in your browser.',
    keywords: ['PDF compressor', 'compress PDF', 'reduce PDF size', 'PDF file size reducer', 'online PDF compressor', 'free PDF compressor']
  },
  { 
    id: 'pdf-rotate', 
    name: 'PDF Rotate', 
    icon: '🔄', 
    category: 'pdf', 
    description: 'Rotate PDF pages 90°, 180°, or 270° to fix orientation issues',
    seoTitle: 'Free PDF Rotate - Rotate PDF Pages Online | Rotate PDF 90, 180, 270 Degrees',
    seoDescription: 'Free online PDF rotator. Rotate PDF pages 90°, 180°, or 270°. Rotate all pages or selected pages. All processing happens in your browser.',
    keywords: ['PDF rotate', 'rotate PDF', 'rotate PDF pages', 'PDF page rotator', 'online PDF rotate', 'free PDF rotate']
  },
  { 
    id: 'lorem-ipsum-generator', 
    name: 'Lorem Ipsum Generator', 
    icon: '📝', 
    category: 'productivity', 
    description: 'Generate placeholder text in paragraphs, words, or sentences with multiple text types',
    seoTitle: 'Free Lorem Ipsum Generator - Generate Placeholder Text Online | Lorem Ipsum Text Generator',
    seoDescription: 'Free online Lorem Ipsum generator. Generate placeholder text in paragraphs, words, or sentences. Multiple text types: Lorem Ipsum, Bacon Ipsum, Cupcake Ipsum, Hipster Ipsum. Copy to clipboard. No registration required.',
    keywords: ['lorem ipsum generator', 'lorem ipsum', 'placeholder text generator', 'dummy text generator', 'lorem ipsum text', 'generate lorem ipsum']
  },
  { 
    id: 'text-case-converter', 
    name: 'Text Case Converter', 
    icon: '🔄', 
    category: 'developer', 
    description: 'Convert text between uppercase, lowercase, camelCase, snake_case, kebab-case, and more',
    seoTitle: 'Free Text Case Converter - Uppercase, Lowercase, camelCase, snake_case Converter | Text Case Tool',
    seoDescription: 'Free online text case converter. Convert text to uppercase, lowercase, title case, camelCase, PascalCase, snake_case, kebab-case, and more. Copy to clipboard. No registration required.',
    keywords: ['text case converter', 'case converter', 'uppercase lowercase converter', 'camelCase converter', 'snake_case converter', 'kebab-case converter']
  },
  { 
    id: 'hash-generator', 
    name: 'Hash Generator', 
    icon: '🔐', 
    category: 'developer', 
    description: 'Generate MD5, SHA-1, SHA-256, and SHA-512 hashes from text or files',
    seoTitle: 'Free Hash Generator - MD5, SHA-1, SHA-256, SHA-512 Hash Generator | Online Hash Tool',
    seoDescription: 'Free online hash generator. Generate MD5, SHA-1, SHA-256, and SHA-512 hashes from text or files. Compare hashes, copy to clipboard. Perfect for developers and security professionals. No registration required.',
    keywords: ['hash generator', 'MD5 generator', 'SHA-256 generator', 'SHA-1 generator', 'SHA-512 generator', 'hash calculator', 'online hash tool']
  },
];

export default function UtilityTools() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTool, setSelectedTool] = useState<ToolType>(
    (searchParams.get('tool') as ToolType) || 'password-generator'
  );
  const [searchQuery, setSearchQuery] = useState('');

  const selectedToolInfo = toolOptions.find(t => t.id === selectedTool);
  
  // Dynamic SEO based on selected tool
  const seoTitle = selectedToolInfo?.seoTitle || 'Free Utility Tools - Password Generator, QR Code, PDF Tools & More | Naqash Thaheem';
  const seoDescription = selectedToolInfo?.seoDescription || 'Comprehensive collection of free utility tools: Password Generator, QR Code Generator, Image Resizer, Word Counter, Loan Calculator, JSON Formatter, and PDF tools. All tools are free and easy to use.';
  const seoKeywords = selectedToolInfo?.keywords || ['utility tools', 'password generator', 'QR code generator', 'image resizer', 'word counter', 'loan calculator', 'JSON formatter', 'PDF tools', 'free tools', 'online tools'];

  useSEO({
    title: seoTitle,
    description: seoDescription,
    url: `/resources/utility-tools${selectedTool !== 'password-generator' ? `?tool=${selectedTool}` : ''}`,
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
    pdf: filteredTools.filter(t => t.category === 'pdf'),
  };

  const renderTool = () => {
    switch (selectedTool) {
      case 'password-generator': return <PasswordGenerator />;
      case 'qr-code-generator': return <QRCodeGenerator />;
      case 'image-resizer': return <ImageResizer />;
      case 'word-counter': return <WordCounter />;
      case 'loan-calculator': return <LoanCalculator />;
      case 'tip-calculator': return <TipCalculator />;
      case 'compound-interest-calculator': return <CompoundInterestCalculator />;
      case 'json-formatter': return <JSONFormatter />;
      case 'base64-encoder': return <Base64Encoder />;
      case 'url-encoder': return <URLEncoder />;
      case 'regex-tester': return <RegexTester />;
      case 'uuid-generator': return <UUIDGenerator />;
      case 'jwt-decoder': return <JWTDecoder />;
      case 'text-to-image': return <TextToImage />;
      case 'pdf-merger': return <PDFMerger />;
      case 'pdf-splitter': return <PDFSplitter />;
      case 'pdf-compressor': return <PDFCompressor />;
      case 'pdf-rotate': return <PDFRotate />;
      case 'lorem-ipsum-generator': return <LoremIpsumGenerator />;
      case 'text-case-converter': return <TextCaseConverter />;
      case 'hash-generator': return <HashGenerator />;
      case 'image-compressor': return <ImageCompressor />;
      default: return <PasswordGenerator />;
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
            Free online utility tools for productivity, development, financial calculations, and PDF manipulation
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
                        {category === 'productivity' ? 'Productivity' : category === 'financial' ? 'Financial' : category === 'developer' ? 'Developer' : 'PDF Tools'}
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

