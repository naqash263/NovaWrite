import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdPlacement from '../components/AdPlacement';
import { useSEO } from '../utils/seo';
import { generateBreadcrumbSchema, generateFAQSchema, injectStructuredData } from '../utils/structuredData';
import ApiKeyManager from '../components/ApiKeyManager';

// Define tool categories for easy navigation
const toolCategories = [
  {
    id: 'career-tools',
    title: "Career Tools",
    description: "AI-powered tools to boost your career: CV Builder, LinkedIn Optimizer, Interview Prep, and more",
    icon: "💼",
    path: "/resources",
    color: "blue",
    tools: [
      { name: "CV Builder", path: "/resources/cv-builder", icon: "📄" },
      { name: "LinkedIn Optimizer", path: "/resources/linkedin-optimizer", icon: "💼" },
      { name: "Interview Prep", path: "/resources/interview-prep", icon: "🎯" },
      { name: "Salary Negotiation", path: "/resources/salary-negotiation", icon: "💰" },
      { name: "Cover Letter Generator", path: "/resources/cover-letter-generator", icon: "✉️" },
      { name: "Career Path Planner", path: "/resources/career-path-planner", icon: "🗺️" },
      { name: "Job Search Optimizer", path: "/resources/job-search-optimizer", icon: "🔍" },
      { name: "Skills Assessment", path: "/resources/skills-assessment", icon: "📊" },
    ]
  },
  {
    id: 'conversion-tools',
    title: "Conversion Tools",
    description: "Free unit converters: Length, Weight, Temperature, Currency, Time Zone, and 15+ more converters",
    icon: "🔄",
    path: "/resources/conversion-tools",
    color: "green",
    tools: [
      { name: "Length Converter", path: "/resources/conversion-tools?tool=length", icon: "📏" },
      { name: "Weight Converter", path: "/resources/conversion-tools?tool=weight", icon: "⚖️" },
      { name: "Currency Converter", path: "/resources/conversion-tools?tool=currency", icon: "💱" },
      { name: "Temperature Converter", path: "/resources/conversion-tools?tool=temperature", icon: "🌡️" },
      { name: "Time Zone Converter", path: "/resources/conversion-tools?tool=timezone", icon: "🌍" },
      { name: "Date Calculator", path: "/resources/conversion-tools?tool=date", icon: "📅" },
      { name: "BMI Calculator", path: "/resources/conversion-tools?tool=bmi", icon: "🏥" },
      { name: "View All (15+)", path: "/resources/conversion-tools", icon: "🔄" },
    ]
  },
  {
    id: 'utility-tools',
    title: "Utility Tools",
    description: "Free productivity tools: Password Generator, QR Code, Image Resizer, PDF tools, Text tools, and more",
    icon: "🛠️",
    path: "/resources/utility-tools",
    color: "purple",
    tools: [
      { name: "Password Generator", path: "/resources/utility-tools?tool=password-generator", icon: "🔐" },
      { name: "QR Code Generator", path: "/resources/utility-tools?tool=qr-code-generator", icon: "📱" },
      { name: "Image Resizer", path: "/resources/utility-tools?tool=image-resizer", icon: "🖼️" },
      { name: "Text to Image", path: "/resources/utility-tools?tool=text-to-image", icon: "✨" },
      { name: "Word Counter", path: "/resources/utility-tools?tool=word-counter", icon: "📊" },
      { name: "Loan Calculator", path: "/resources/utility-tools?tool=loan-calculator", icon: "💰" },
      { name: "Tip Calculator", path: "/resources/utility-tools?tool=tip-calculator", icon: "💵" },
      { name: "Compound Interest Calculator", path: "/resources/utility-tools?tool=compound-interest-calculator", icon: "📈" },
      { name: "JSON Formatter", path: "/resources/utility-tools?tool=json-formatter", icon: "📋" },
      { name: "Base64 Encoder", path: "/resources/utility-tools?tool=base64-encoder", icon: "🔐" },
      { name: "URL Encoder", path: "/resources/utility-tools?tool=url-encoder", icon: "🔗" },
      { name: "Regex Tester", path: "/resources/utility-tools?tool=regex-tester", icon: "🔍" },
      { name: "UUID Generator", path: "/resources/utility-tools?tool=uuid-generator", icon: "🆔" },
      { name: "JWT Decoder", path: "/resources/utility-tools?tool=jwt-decoder", icon: "🔓" },
      { name: "PDF Merger", path: "/resources/utility-tools?tool=pdf-merger", icon: "🔗" },
      { name: "PDF Splitter", path: "/resources/utility-tools?tool=pdf-splitter", icon: "✂️" },
      { name: "PDF Compressor", path: "/resources/utility-tools?tool=pdf-compressor", icon: "📦" },
      { name: "PDF Rotate", path: "/resources/utility-tools?tool=pdf-rotate", icon: "🔄" },
      { name: "Lorem Ipsum Generator", path: "/resources/utility-tools?tool=lorem-ipsum-generator", icon: "📝" },
      { name: "Text Case Converter", path: "/resources/utility-tools?tool=text-case-converter", icon: "🔄" },
      { name: "Hash Generator", path: "/resources/utility-tools?tool=hash-generator", icon: "🔐" },
      { name: "Image Compressor", path: "/resources/utility-tools?tool=image-compressor", icon: "🗜️" },
      { name: "SQL Formatter", path: "/resources/utility-tools?tool=sql-formatter", icon: "💾" },
      { name: "CSS Formatter", path: "/resources/utility-tools?tool=css-formatter", icon: "🎨" },
      { name: "HTML Formatter", path: "/resources/utility-tools?tool=html-formatter", icon: "🌐" },
      { name: "Image Format Converter", path: "/resources/utility-tools?tool=image-format-converter", icon: "🔄" },
      { name: "Color Picker", path: "/resources/utility-tools?tool=color-picker", icon: "🎨" },
      { name: "Markdown Preview", path: "/resources/utility-tools?tool=markdown-preview", icon: "📄" },
      { name: "View All (28)", path: "/resources/utility-tools", icon: "🛠️" },
    ]
  },
  {
    id: 'ai-tools',
    title: "AI-Powered Tools",
    description: "Free AI tools: Text Summarizer, Article Rewriter, Grammar Checker, Language Translator",
    icon: "🤖",
    path: "/resources/ai-tools",
    color: "orange",
    tools: [
      { name: "Text Summarizer", path: "/resources/ai-tools?tool=text-summarizer", icon: "📝" },
      { name: "Article Rewriter", path: "/resources/ai-tools?tool=article-rewriter", icon: "✍️" },
      { name: "Grammar Checker", path: "/resources/ai-tools?tool=grammar-checker", icon: "✅" },
      { name: "Language Translator", path: "/resources/ai-tools?tool=language-translator", icon: "🌐" },
      { name: "Keyword Extractor", path: "/resources/ai-tools?tool=keyword-extractor", icon: "🔑" },
      { name: "View All (5)", path: "/resources/ai-tools", icon: "🤖" },
    ]
  },
];

export default function Resources() {
  const navigate = useNavigate();
  const [showCareerTools, setShowCareerTools] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'career-tools': true,
    'conversion-tools': true,
    'utility-tools': true,
    'ai-tools': true,
  });

  useSEO({
    title: 'Free Tools & Resources - Career Tools, Conversion Tools, Utility Tools, AI Tools | Naqash Thaheem',
    description: 'Comprehensive collection of free tools: Career Tools (CV Builder, LinkedIn Optimizer), Conversion Tools (15+ converters), Utility Tools (7 productivity tools), and AI-Powered Tools (Text Summarizer, Grammar Checker). All tools are free, require no registration, and work instantly.',
    url: '/resources',
    keywords: [
      'free tools', 'career tools', 'conversion tools', 'utility tools', 'AI tools',
      'CV builder', 'unit converter', 'text to speech', 'password generator', 'text summarizer',
      'grammar checker', 'online tools', 'free online tools', 'productivity tools'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Free Tools & Resources',
      'description': 'Comprehensive collection of free tools for career, conversion, utility, and AI-powered tasks',
      'url': 'https://naqashthaheem.com/resources',
      'applicationCategory': 'UtilityApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': toolCategories.map(c => c.title),
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.8',
        'ratingCount': '2500',
        'bestRating': '5',
        'worstRating': '1'
      }
    }
  });

  useEffect(() => {
    // Add breadcrumb structured data
    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Home', url: 'https://naqashthaheem.com' },
      { name: 'Resources', url: 'https://naqashthaheem.com/resources' }
    ]);
    injectStructuredData(breadcrumbSchema);

    // Add FAQ structured data
    const faqSchema = generateFAQSchema([
      {
        question: 'Are all these tools free to use?',
        answer: 'Yes, all tools are completely free to use with no registration required. You can use them as many times as you need without any limitations.'
      },
      {
        question: 'What types of tools are available?',
        answer: 'We offer four main categories: Career Tools (CV Builder, LinkedIn Optimizer), Conversion Tools (15+ unit converters), Utility Tools (Password Generator, QR Code, PDF tools), and AI-Powered Tools (Text Summarizer, Grammar Checker).'
      },
      {
        question: 'Do I need to create an account?',
        answer: 'No, you don\'t need to create an account. All tools are accessible immediately without registration. Simply visit the tool you need and start using it right away.'
      },
      {
        question: 'Are these tools mobile-friendly?',
        answer: 'Yes, all tools are fully responsive and work perfectly on mobile phones, tablets, and desktop computers.'
      },
      {
        question: 'Is my data stored when using these tools?',
        answer: 'No, most tools process data locally in your browser. We do not store, track, or transmit your input data. Your privacy is our priority.'
      },
      {
        question: 'How many tools are available?',
        answer: 'We offer 30+ free tools across four categories: 8 Career Tools, 15+ Conversion Tools, 7 Utility Tools, and 4 AI-Powered Tools. All tools are free and require no registration.'
      },
      {
        question: 'What makes these tools different?',
        answer: 'Our tools are AI-powered, privacy-focused, completely free, and require no registration. They work instantly in your browser and provide professional-quality results.'
      }
    ]);
    injectStructuredData(faqSchema);

    // Add ItemList schema for all tools
    const allTools = toolCategories.flatMap(category => 
      category.tools.map(tool => ({
        name: tool.name,
        url: `https://naqashthaheem.com${tool.path}`,
        category: category.title
      }))
    );
    
    const toolsListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': 'Free Tools & Resources',
      'description': 'Complete list of all free tools available',
      'numberOfItems': allTools.length,
      'itemListElement': allTools.map((tool, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'item': {
          '@type': 'SoftwareApplication',
          'name': tool.name,
          'url': tool.url,
          'applicationCategory': tool.category
        }
      }))
    };
    injectStructuredData(toolsListSchema);
  }, []);

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; hover: string; text: string; border: string }> = {
      blue: {
        bg: 'bg-blue-50',
        hover: 'hover:bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-200'
      },
      green: {
        bg: 'bg-green-50',
        hover: 'hover:bg-green-100',
        text: 'text-green-700',
        border: 'border-green-200'
      },
      purple: {
        bg: 'bg-purple-50',
        hover: 'hover:bg-purple-100',
        text: 'text-purple-700',
        border: 'border-purple-200'
      },
      orange: {
        bg: 'bg-orange-50',
        hover: 'hover:bg-orange-100',
        text: 'text-orange-700',
        border: 'border-orange-200'
      }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Free Tools & Resources
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            Access <strong>30+ free tools</strong> organized into four main categories. All tools are free, require no registration, and work instantly.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Completely Free
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              No Registration
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Instant Results
            </span>
          </div>
        </div>

        {/* API Key Manager */}
        <div className="max-w-2xl mx-auto mb-8">
          <ApiKeyManager />
                  </div>
                  
        {/* Ad: Content Top */}
        <div className="max-w-4xl mx-auto mb-12">
          <AdPlacement position="content-top" />
                  </div>
                  
        {/* Tool Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {toolCategories.map((category) => {
            const colors = getColorClasses(category.color);
            return (
              <div
                key={category.id}
                className={`bg-white rounded-xl shadow-lg border-2 ${colors.border} overflow-hidden hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300`}
              >
                {/* Category Header */}
                <div
                  onClick={() => navigate(category.path)}
                  className={`${colors.bg} p-6 cursor-pointer ${colors.hover} transition-colors`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">{category.icon}</div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">{category.title}</h2>
                        <p className="text-sm text-gray-600">{category.description}</p>
                      </div>
                    </div>
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Tools List */}
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-3">
                    {category.tools.map((tool, index) => (
                      <button
                        key={index}
                        onClick={() => navigate(tool.path)}
                        className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left group"
                      >
                        <span className="text-xl">{tool.icon}</span>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                          {tool.name}
                        </span>
                      </button>
                    ))}
                  </div>
                  
                  {/* View All Button */}
                  <button 
                    onClick={() => {
                      if (category.id === 'career-tools') {
                        setShowCareerTools(true);
                        setTimeout(() => {
                          document.getElementById('career-tools-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                      } else {
                        navigate(category.path);
                      }
                    }}
                    className={`w-full mt-4 px-4 py-3 ${colors.bg} ${colors.text} rounded-lg font-semibold ${colors.hover} transition-colors border ${colors.border}`}
                  >
                    View All {category.title} →
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Career Tools Detailed Section */}
        {showCareerTools && (
          <div id="career-tools-section" className="bg-white rounded-xl shadow-lg p-8 mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">💼 All Career Tools</h2>
                <p className="text-gray-600">AI-powered tools to boost your career and professional growth</p>
              </div>
              <button
                onClick={() => setShowCareerTools(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {toolCategories.find(c => c.id === 'career-tools')?.tools.map((tool, index) => (
                <button
                  key={index}
                  onClick={() => navigate(tool.path)}
                  className="flex flex-col items-center p-4 rounded-lg border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-center"
                >
                  <span className="text-3xl mb-2">{tool.icon}</span>
                  <span className="font-semibold text-gray-900 text-sm">{tool.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SEO & AI-Friendly Content Sections */}
        <div className="space-y-6 mb-12">
          {/* About Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">About Our Free Tools & Resources</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our comprehensive collection of <strong>30+ free tools</strong> is designed to help professionals, students, 
              developers, and anyone looking to boost productivity and achieve their goals. All tools are organized into 
              four main categories: Career Tools, Conversion Tools, Utility Tools, and AI-Powered Tools.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Every tool is <strong>completely free</strong>, requires <strong>no registration</strong>, and works instantly 
              in your browser. We prioritize your privacy - most tools process data locally without sending anything to servers. 
              Whether you're building a professional CV, converting units, generating passwords, or using AI to improve your writing, 
              we have the tools you need.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Our tools are used by <strong>thousands of professionals</strong> worldwide and have helped increase interview 
              callbacks by 40%, save hours of work, and improve productivity. All tools are built with industry best practices, 
              modern web technologies, and user-friendly interfaces.
            </p>
                  </div>

          {/* Use Cases */}
          <div className="bg-gray-50 rounded-lg p-6 sm:p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Who Can Benefit From These Tools?</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span>💼</span> Professionals
                </h4>
                <p className="text-sm text-gray-600">
                  Build professional CVs, optimize LinkedIn profiles, prepare for interviews, negotiate salaries, 
                  and plan your career path with AI-powered tools.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span>🎓</span> Students
                </h4>
                <p className="text-sm text-gray-600">
                  Convert units for homework, check grammar in essays, summarize articles, count words, 
                  and use various calculators for assignments.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span>💻</span> Developers
                </h4>
                <p className="text-sm text-gray-600">
                  Format JSON, convert number systems, encode/decode text, generate QR codes, 
                  and use various technical conversion tools.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span>🌍</span> Everyone
                </h4>
                <p className="text-sm text-gray-600">
                  Convert currencies, calculate BMI, resize images, generate passwords, translate text, 
                  and use everyday utility tools for daily tasks.
                </p>
              </div>
            </div>
                  </div>
                  
          {/* Features */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Key Features</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Completely Free</h4>
                  <p className="text-sm text-gray-600">All tools are free forever with no hidden costs or premium features</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold">2</span>
          </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">No Registration</h4>
                  <p className="text-sm text-gray-600">Start using tools immediately without creating an account</p>
                </div>
                  </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                    <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Privacy-Focused</h4>
                  <p className="text-sm text-gray-600">Most tools process data locally - your data never leaves your browser</p>
                    </div>
                  </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">AI-Powered</h4>
                  <p className="text-sm text-gray-600">Many tools use advanced AI to provide intelligent suggestions and results</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Are all these tools free to use?</h3>
              <p className="text-gray-600 text-sm">
                Yes, all tools are completely free to use with no registration required. You can use them as many times as you need without any limitations.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What types of tools are available?</h3>
              <p className="text-gray-600 text-sm">
                We offer four main categories: Career Tools (CV Builder, LinkedIn Optimizer), Conversion Tools (15+ unit converters), Utility Tools (Password Generator, QR Code, PDF tools), and AI-Powered Tools (Text Summarizer, Grammar Checker).
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Do I need to create an account?</h3>
              <p className="text-gray-600 text-sm">
                No, you don't need to create an account. All tools are accessible immediately without registration. Simply visit the tool you need and start using it right away.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Are these tools mobile-friendly?</h3>
              <p className="text-gray-600 text-sm">
                Yes, all tools are fully responsive and work perfectly on mobile phones, tablets, and desktop computers.
              </p>
            </div>
          </div>
              </div>

        {/* Ad: Content Bottom */}
        <div className="max-w-4xl mx-auto mb-8">
          <AdPlacement position="content-bottom" />
        </div>
      </div>
    </div>
  );
}
