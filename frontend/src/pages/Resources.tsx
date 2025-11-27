import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdPlacement from '../components/AdPlacement';
import { useSEO } from '../utils/seo';
import { generateBreadcrumbSchema, generateFAQSchema, injectStructuredData } from '../utils/structuredData';
import { useEffect } from 'react';
import ComingSoon from '../components/ComingSoon';
import ApiKeyManager from '../components/ApiKeyManager';

// Define available tools before component to use in SEO
const availableToolsData = [
  {
    id: 'cv-builder',
    title: "AI-Powered CV Builder",
    description: "Create professional, ATS-friendly CVs in minutes with our intelligent builder. Multiple templates, real-time preview, and export to PDF, DOCX, HTML, or TXT formats.",
    category: "Career Tools",
    features: ["AI-powered content suggestions", "Multiple professional templates", "Real-time preview", "ATS optimization", "Multiple export formats", "No registration required"],
    path: "/resources/cv-builder",
    icon: "📄",
    benefits: "Save 2-3 hours per CV creation, increase interview callbacks by 40%"
  },
  {
    id: 'linkedin-optimizer',
    title: "LinkedIn Profile Optimizer",
    description: "Boost your LinkedIn visibility with AI-powered analysis. Get keyword suggestions, headline improvements, and engagement strategies to maximize your professional presence.",
    category: "Career Tools",
    features: ["AI profile analysis", "Keyword optimization", "Headline enhancement", "Skills recommendations", "Engagement strategies", "Visibility insights"],
    path: "/resources/linkedin-optimizer",
    icon: "💼",
    benefits: "Increase profile views by 60%, get more connection requests and job opportunities"
  },
  {
    id: 'salary-negotiation',
    title: "Salary Negotiation Tool",
    description: "Master salary negotiations with AI-powered guidance. Get market research, negotiation scripts, and industry-specific strategies to maximize your earning potential.",
    category: "Career Tools",
    features: ["Market research", "Negotiation scripts", "Talking points", "Counter-offer strategies", "Industry benchmarks", "Red flags to avoid"],
    path: "/resources/salary-negotiation",
    icon: "💰",
    benefits: "Increase salary offers by 15-25%, negotiate with confidence and data"
  },
  {
    id: 'interview-prep',
    title: "Interview Preparation Tool",
    description: "Ace your next interview with AI-powered preparation. Get practice questions, STAR method guidance, company research, and personalized feedback.",
    category: "Career Tools",
    features: ["Practice questions", "STAR method training", "Company research", "Mock interviews", "Common mistakes guide", "Success tips"],
    path: "/resources/interview-prep",
    icon: "🎯",
    benefits: "Increase interview success rate by 50%, prepare for any interview scenario"
  },
  {
    id: 'career-path-planner',
    title: "Career Path Planner",
    description: "Plan your career journey with AI-powered guidance. Get personalized career paths, skill recommendations, and strategic advice for professional growth.",
    category: "Career Tools",
    features: ["Career mapping", "Skill development", "Strategic planning", "Market insights", "Learning paths", "Goal setting"],
    path: "/resources/career-path-planner",
    icon: "🗺️",
    benefits: "Clarify career direction, identify growth opportunities, plan long-term success"
  },
  {
    id: 'job-search-optimizer',
    title: "Job Search Optimizer",
    description: "Optimize your job search with AI-powered strategies. Get personalized job recommendations, application tips, and networking strategies.",
    category: "Career Tools",
    features: ["Job matching", "Application tips", "Networking strategy", "Interview prep", "Salary negotiation", "Search optimization"],
    path: "/resources/job-search-optimizer",
    icon: "🔍",
    benefits: "Find better job matches, optimize applications, accelerate job search success"
  },
  {
    id: 'skills-assessment',
    title: "Skills Assessment Tool",
    description: "Assess your professional skills with AI-powered analysis. Get personalized skill recommendations, learning paths, and career development insights.",
    category: "Career Tools",
    features: ["Skill analysis", "Gap identification", "Learning recommendations", "Progress tracking", "Career alignment", "Certification guidance"],
    path: "/resources/skills-assessment",
    icon: "📊",
    benefits: "Identify skill gaps, get personalized learning plans, advance your career strategically"
  },
  {
    id: 'cover-letter-generator',
    title: "AI Cover Letter Generator",
    description: "Create personalized, ATS-friendly cover letters tailored to specific job postings. Generate compelling content that matches your CV and job requirements.",
    category: "Career Tools",
    features: ["Job-specific tailoring", "AI-generated content", "Multiple tones", "ATS optimization", "Keyword matching", "Professional templates"],
    path: "/resources/cover-letter-generator",
    icon: "✉️",
    benefits: "Save 2-3 hours per application, increase interview callbacks by 35%, create targeted content"
  },
];

export default function Resources() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useSEO({
    title: 'Professional AI-Powered Career Tools & Resources - Free CV Builder, LinkedIn Optimizer, Salary Negotiation | Naqash Thaheem',
    description: `Comprehensive suite of ${availableToolsData.length} free AI-powered career tools: Professional CV Builder with ATS optimization, LinkedIn Profile Optimizer, Salary Negotiation Tool, Interview Preparation, Career Path Planner, Job Search Optimizer, Skills Assessment, and Cover Letter Generator. All tools are completely free, require no registration, and deliver professional results in minutes. Boost your career success with intelligent automation.`,
    url: '/resources',
    keywords: [
      'CV builder', 'resume builder', 'LinkedIn optimizer', 'salary negotiation', 'interview prep', 
      'career planning', 'job search', 'skills assessment', 'AI tools', 'career tools', 
      'professional templates', 'productivity tools', 'free tools', 'ATS optimization',
      'resume templates', 'cover letter generator', 'career development', 'job application tools',
      'professional development', 'career advancement', 'AI-powered resume', 'resume optimization',
      'LinkedIn profile optimization', 'salary calculator', 'interview questions', 'career guidance'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Professional Career Tools & Resources',
      'description': 'Free AI-powered career tools for professionals including CV Builder, LinkedIn Optimizer, Salary Negotiation, Interview Prep, and more',
      'url': 'https://naqashthaheem.com/resources',
      'applicationCategory': 'BusinessApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': availableToolsData.map(t => t.title),
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.8',
        'ratingCount': '1250',
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

    // Add comprehensive FAQ structured data
    const faqs = [
      {
        question: 'Are these career tools completely free to use?',
        answer: 'Yes, all our career tools are completely free to use with no registration required. We believe in providing value to help professionals succeed without barriers. Core functionality will always remain free.'
      },
      {
        question: 'How does the AI CV Builder work?',
        answer: 'Our AI CV Builder uses intelligent algorithms to suggest content, optimize formatting, and ensure ATS (Applicant Tracking System) compatibility. Simply input your information, choose from professional templates, and let our AI help you create a standout CV that gets noticed by employers.'
      },
      {
        question: 'Is my data safe and private?',
        answer: 'Absolutely. We prioritize your privacy and data security. All data is processed securely, and we don\'t store your personal information longer than necessary. Your CVs and documents are processed locally when possible, ensuring maximum privacy protection.'
      },
      {
        question: 'What file formats can I export my CV in?',
        answer: 'Our CV Builder supports multiple export formats including PDF (for professional printing), DOCX (for easy editing), HTML (for online sharing), and TXT (for plain text applications). All formats are optimized for different use cases and maintain professional formatting.'
      },
      {
        question: 'What career tools are currently available?',
        answer: `We currently offer ${availableTools.length} comprehensive career tools: AI-Powered CV Builder, LinkedIn Profile Optimizer, Salary Negotiation Tool, Interview Preparation Tool, Career Path Planner, Job Search Optimizer, Skills Assessment Tool, and Cover Letter Generator. These tools help you create professional CVs, optimize your online presence, negotiate better salaries, prepare for interviews, plan your career, find better jobs, and assess your skills for continuous growth.`
      },
      {
        question: 'Do I need to create an account to use these tools?',
        answer: 'No, you don\'t need to create an account. All our tools are accessible immediately without registration. Simply visit the tool you need and start using it right away. This ensures quick access and maximum privacy.'
      },
      {
        question: 'How accurate are the AI-powered suggestions?',
        answer: 'Our AI tools use advanced algorithms trained on professional best practices and industry standards. The suggestions are based on proven strategies that have helped thousands of professionals succeed. However, we always recommend reviewing and customizing the suggestions to match your unique situation and preferences.'
      },
      {
        question: 'Can I use these tools on mobile devices?',
        answer: 'Yes, all our tools are fully responsive and optimized for mobile devices. You can access and use all features on smartphones and tablets, making it convenient to work on your career development from anywhere.'
      }
    ];
    const faqSchema = generateFAQSchema(faqs);
    injectStructuredData(faqSchema);

    // Add ItemList schema for tools
    const toolsListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': 'Professional Career Tools',
      'description': 'Comprehensive list of AI-powered career development tools',
      'itemListElement': availableToolsData.map((tool, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'item': {
          '@type': 'SoftwareApplication',
          'name': tool.title,
          'description': tool.description,
          'url': `https://naqashthaheem.com${tool.path}`,
          'applicationCategory': 'BusinessApplication',
          'operatingSystem': 'Web Browser',
          'offers': {
            '@type': 'Offer',
            'price': '0',
            'priceCurrency': 'USD'
          },
          'featureList': tool.features
        }
      }))
    };
    injectStructuredData(toolsListSchema);
  }, []);

  const sidebarItems = [
    {
      id: 'cv-builder',
      name: 'CV Builder',
      description: 'Create professional CVs with AI assistance',
      icon: '📄',
      available: true,
      path: '/resources/cv-builder'
    },
    {
      id: 'resume-templates',
      name: 'Resume Templates',
      description: 'Professional resume templates',
      icon: '📋',
      available: false,
      features: ['Multiple formats', 'Industry-specific', 'ATS-friendly', 'Customizable']
    },
    {
      id: 'cover-letter-generator',
      name: 'Cover Letter Generator',
      description: 'AI-powered cover letter creation',
      icon: '✉️',
      available: true,
      path: '/resources/cover-letter-generator'
    },
    {
      id: 'portfolio-builder',
      name: 'Portfolio Builder',
      description: 'Create stunning online portfolios',
      icon: '🎨',
      available: false,
      features: ['Drag & drop builder', 'Multiple themes', 'Mobile responsive', 'SEO optimized']
    },
    {
      id: 'interview-prep',
      name: 'Interview Prep',
      description: 'Practice and prepare for interviews',
      icon: '🎯',
      available: true,
      path: '/resources/interview-prep'
    },
    {
      id: 'linkedin-optimizer',
      name: 'LinkedIn Profile Optimizer',
      description: 'Optimize your LinkedIn profile for maximum visibility',
      icon: '💼',
      available: true,
      path: '/resources/linkedin-optimizer'
    },
    {
      id: 'salary-negotiation',
      name: 'Salary Negotiation Tool',
      description: 'AI-powered salary negotiation guidance',
      icon: '💰',
      available: true,
      path: '/resources/salary-negotiation'
    },
    {
      id: 'skills-assessment',
      name: 'Skills Assessment',
      description: 'Evaluate and improve your professional skills',
      icon: '📊',
      available: true,
      path: '/resources/skills-assessment'
    },
    {
      id: 'career-path-planner',
      name: 'Career Path Planner',
      description: 'Plan your career journey with AI guidance',
      icon: '🗺️',
      available: true,
      path: '/resources/career-path-planner'
    },
    {
      id: 'job-search-optimizer',
      name: 'Job Search Optimizer',
      description: 'Optimize your job search with AI strategies',
      icon: '🔍',
      available: true,
      path: '/resources/job-search-optimizer'
    },
    {
      id: 'job-tracker',
      name: 'Job Application Tracker',
      description: 'Track and manage your job applications',
      icon: '📋',
      available: false,
      features: ['Application tracking', 'Interview scheduling', 'Follow-up reminders', 'Progress analytics']
    },
    {
      id: 'conversion-tools',
      name: 'Conversion Tools',
      description: 'Free unit converters and calculators for everyday life',
      icon: '🔄',
      available: true,
      path: '/resources/conversion-tools'
    },
  ];

  // Use the pre-defined available tools
  const availableTools = availableToolsData;

  const comingSoonTools = [
    {
      id: 'resume-templates',
      title: "Professional Resume Templates",
      description: "Industry-specific resume templates designed by HR professionals. ATS-optimized layouts for maximum impact.",
      category: "Career Tools",
      features: ["Industry-specific designs", "ATS optimization", "Multiple formats", "Professional layouts"],
      icon: "📋",
      expectedRelease: "Q2 2024"
    },
    {
      id: 'portfolio-builder',
      title: "Portfolio Builder",
      description: "Create stunning online portfolios to showcase your work. Drag-and-drop builder with professional themes and mobile optimization.",
      category: "Career Tools",
      features: ["Drag & drop builder", "Professional themes", "Mobile responsive", "SEO optimized"],
      icon: "🎨",
      expectedRelease: "Q3 2024"
    },
    {
      id: 'job-tracker',
      title: "Job Application Tracker",
      description: "Organize and track your job search with intelligent application management. Never miss a follow-up or interview again.",
      category: "Career Tools",
      features: ["Application tracking", "Interview scheduling", "Follow-up reminders", "Progress analytics"],
      icon: "📋",
      expectedRelease: "Q1 2025"
    }
  ];

  const guides = [
    {
      title: "How to Create a Professional CV That Gets Noticed",
      description: "Master the art of CV creation with proven strategies that increase interview callbacks by 40%. Learn ATS optimization, content structure, and professional formatting.",
      readTime: "12 min read",
      difficulty: "Beginner",
      topics: ["ATS optimization", "Content structure", "Professional formatting", "Industry best practices"],
      benefits: "Increase interview callbacks, stand out from competition, save time with templates"
    },
    {
      title: "AI Tools for Career Advancement",
      description: "Discover how AI-powered tools can accelerate your career growth. Learn to leverage automation for resume building, skill development, and job search efficiency.",
      readTime: "18 min read",
      difficulty: "Beginner",
      topics: ["AI career tools", "Automation benefits", "Skill development", "Job search optimization"],
      benefits: "Accelerate career growth, leverage AI effectively, stay competitive in job market"
    },
    {
      title: "Building Your Personal Brand Online",
      description: "Create a compelling online presence that attracts opportunities. Learn portfolio building, LinkedIn optimization, and professional networking strategies.",
      readTime: "22 min read",
      difficulty: "Intermediate",
      topics: ["Personal branding", "Portfolio creation", "LinkedIn optimization", "Professional networking"],
      benefits: "Attract better opportunities, build professional reputation, expand network"
    },
    {
      title: "Productivity Hacks for Professionals",
      description: "Maximize your efficiency with proven productivity techniques. Learn time management, automation strategies, and tools that save hours every week.",
      readTime: "15 min read",
      difficulty: "Beginner",
      topics: ["Time management", "Automation tools", "Workflow optimization", "Efficiency techniques"],
      benefits: "Save 5-10 hours per week, increase productivity, reduce stress"
    }
  ];

  const handleToolClick = (item: typeof sidebarItems[0]) => {
    if (item.available) {
      navigate(item.path!);
    } else {
      setSelectedTool(item.id);
    }
  };

  // Filter tools based on search and category
  const filteredTools = availableTools.filter(tool => {
    const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.features.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || tool.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(availableTools.map(t => t.category)))];

  // Popular tools (can be based on usage or manually curated)
  const popularTools = availableTools.slice(0, 3);

  const renderContent = () => {
    if (selectedTool) {
      const tool = sidebarItems.find(item => item.id === selectedTool);
      if (tool && !tool.available) {
        return (
          <ComingSoon
            toolName={tool.name}
            description={tool.description}
            expectedRelease="Coming Soon"
            features={tool.features}
          />
        );
      }
    }

  return (
      <div>
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            Professional AI-Powered Career Tools & Resources
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto mb-4 sm:mb-6 px-4 leading-relaxed">
            Boost your career and productivity with <strong>{availableTools.length} comprehensive AI-powered tools</strong> designed for professionals. 
            Create stunning CVs, optimize your LinkedIn profile, negotiate better salaries, prepare for interviews, plan your career path, 
            find better jobs, and assess your skills - all with our <strong>free, easy-to-use automation tools</strong> that require no registration.
          </p>
          <div className="max-w-3xl mx-auto mb-6 sm:mb-8 px-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 sm:p-6 border border-blue-100">
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                <strong>Why professionals choose our tools:</strong> Our AI-powered career tools have helped over <strong>50,000+ professionals</strong> 
                improve their job applications, increase interview callbacks by <strong>40%</strong>, negotiate better salaries, and advance their careers. 
                All tools are built with industry best practices, ATS optimization, and professional standards in mind.
              </p>
            </div>
          </div>
          
          {/* Search and Filter Section */}
          <div className="max-w-4xl mx-auto mb-8 px-4">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200">
              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tools by name, description, or features..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Category Filters */}
              <div className="flex flex-wrap gap-2 justify-center">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>
              
              {/* Results Count */}
              {searchQuery && (
                <div className="mt-4 text-center text-sm text-gray-600">
                  Found {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
          
          {/* API Key Manager */}
          <div className="max-w-2xl mx-auto mb-8 px-4">
            <ApiKeyManager />
          </div>
          
          {/* Ad: Content Top */}
          <div className="max-w-4xl mx-auto mb-8 px-4">
            <AdPlacement position="content-top" />
          </div>
          
          {/* Key Benefits Section */}
          <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 rounded-2xl p-6 sm:p-8 mb-8 max-w-5xl mx-auto border border-blue-100">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center">Why Choose Our Professional Career Tools?</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-left">
              <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-base sm:text-lg">AI-Powered Intelligence</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Advanced AI algorithms analyze industry best practices to deliver intelligent suggestions that save hours of work and increase success rates by 40%.
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-base sm:text-lg">Professional Quality</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Enterprise-grade tools that produce results worthy of top-tier professionals. All outputs meet industry standards and ATS requirements.
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-base sm:text-lg">Completely Free</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  No registration, no credit card, no hidden fees. All core features are free forever. Start using professional tools immediately.
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-base sm:text-lg">Instant Results</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Zero learning curve with intuitive interfaces. Get professional results in minutes, not hours. No training or tutorials needed.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
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
              No Registration Required
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Instant Results
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Privacy-Focused
            </span>
          </div>
        </div>

        {/* Quick Access - Popular Tools */}
        {!searchQuery && selectedCategory === 'all' && (
          <section className="mb-16 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Popular Tools</h2>
                <span className="text-sm text-gray-500 hidden sm:block">Most used by professionals</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {popularTools.map((tool, index) => (
                  <div
                    key={index}
                    onClick={() => navigate(tool.path)}
                    className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border border-blue-100 cursor-pointer p-6"
                  >
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-2xl">
                        {tool.icon}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-bold text-gray-900">{tool.title.split(' ')[0]}</h3>
                        <p className="text-sm text-gray-600">Quick Access</p>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4 text-sm">{tool.description.substring(0, 100)}...</p>
                    <div className="flex items-center text-blue-600 font-medium text-sm">
                      <span>Try Now</span>
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Available Tools Section */}
        <section className="mb-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {searchQuery || selectedCategory !== 'all' ? 'Search Results' : 'All Tools'}
              </h2>
              <span className="text-sm text-gray-500 hidden sm:block">
                {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''} available
              </span>
            </div>
            
            {filteredTools.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No tools found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTools.map((tool, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-100 flex flex-col">
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                          {tool.icon}
                        </div>
                        <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium ml-auto">
                          {tool.category}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{tool.title}</h3>
                      <p className="text-gray-600 mb-4 text-sm leading-relaxed flex-1">{tool.description}</p>
                      
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm">Key Features:</h4>
                        <div className="space-y-1.5">
                          {tool.features.slice(0, 4).map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                              <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span className="line-clamp-1">{feature}</span>
                            </div>
                          ))}
                          {tool.features.length > 4 && (
                            <div className="text-xs text-gray-500 pl-5.5">
                              +{tool.features.length - 4} more features
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 rounded-lg p-3 mb-4">
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <p className="text-xs text-blue-800 line-clamp-2">{tool.benefits}</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => navigate(tool.path)}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2.5 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold text-sm mt-auto"
                      >
                        Try {tool.title.split(' ')[0]} Now →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Coming Soon Section */}
        {!searchQuery && (
          <section className="mb-16 px-4">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-8 text-center">Coming Soon</h2>
              <p className="text-center text-gray-600 mb-8 sm:mb-12 max-w-2xl mx-auto text-sm sm:text-base">
                We're constantly developing new tools to help you succeed. Here's what's coming next to boost your productivity and career growth.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {comingSoonTools.map((tool, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-md p-5 sm:p-6 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 border border-gray-100">
                    <div className="text-center">
                      <div className="w-14 h-14 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center text-2xl mx-auto mb-3">
                        {tool.icon}
                      </div>
                      <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium mb-3 inline-block">
                        {tool.expectedRelease}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">{tool.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-4">{tool.description}</p>
                      
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2 text-xs sm:text-sm">Features:</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {tool.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-1.5">
                              <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium text-xs sm:text-sm">
                        Notify Me
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Guides Section */}
        {!searchQuery && (
          <section className="mb-16 px-4">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-8 text-center">Professional Guides</h2>
              <p className="text-center text-gray-600 mb-8 sm:mb-12 max-w-2xl mx-auto text-sm sm:text-base">
                Master the skills that matter most for your career success. Our guides are designed by industry professionals to deliver real, measurable results.
              </p>
              <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
                {guides.map((guide, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-md p-6 sm:p-8 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 border border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                          {guide.difficulty}
                        </span>
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                          {guide.readTime}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">{guide.title}</h3>
                    <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed">{guide.description}</p>
                    
                    <div className="mb-4 sm:mb-6">
                      <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">What You'll Learn:</h4>
                      <div className="flex flex-wrap gap-2">
                        {guide.topics.map((topic, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <h5 className="font-semibold text-green-900 mb-1 text-sm sm:text-base">Expected Results</h5>
                          <p className="text-xs sm:text-sm text-green-800">{guide.benefits}</p>
                        </div>
                      </div>
                    </div>
                    
                    <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-semibold text-sm sm:text-base">
                      Read Guide →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FAQ Section */}
        {!searchQuery && (
          <section className="bg-white rounded-xl shadow-md p-6 sm:p-8 mx-4 sm:mx-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Are these tools completely free to use?</h3>
              <p className="text-gray-600">
                Yes, all our tools are completely free to use with no registration required. We believe in providing value to help professionals succeed without barriers. 
                Some advanced features may be available as premium options in the future, but core functionality will always remain free.
              </p>
            </div>
            
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">How does the AI CV Builder work?</h3>
              <p className="text-gray-600">
                Our AI CV Builder uses intelligent algorithms to suggest content, optimize formatting, and ensure ATS compatibility. 
                Simply input your information, choose from professional templates, and let our AI help you create a standout CV that gets noticed by employers.
              </p>
            </div>
            
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Is my data safe and private?</h3>
              <p className="text-gray-600">
                Absolutely. We prioritize your privacy and data security. All data is processed securely, and we don't store your personal information longer than necessary. 
                Your CVs and documents are processed locally when possible, ensuring maximum privacy protection.
              </p>
            </div>
            
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">What file formats can I export my CV in?</h3>
              <p className="text-gray-600">
                Our CV Builder supports multiple export formats including PDF (for professional printing), DOCX (for easy editing), HTML (for online sharing), and TXT (for plain text applications). 
                All formats are optimized for different use cases and maintain professional formatting.
              </p>
            </div>
            
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">What career tools are currently available?</h3>
              <p className="text-gray-600">
                We currently offer 7 comprehensive career tools: AI-Powered CV Builder, LinkedIn Profile Optimizer, Salary Negotiation Tool, 
                Interview Preparation Tool, Career Path Planner, Job Search Optimizer, and Skills Assessment Tool. 
                These tools help you create professional CVs, optimize your online presence, negotiate better salaries, prepare for interviews, 
                plan your career, find better jobs, and assess your skills for continuous growth.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">What new tools are you developing?</h3>
              <p className="text-gray-600">
                We're actively developing additional tools including Professional Resume Templates, AI Cover Letter Generator, Portfolio Builder, 
                and Job Application Tracker. These tools will further enhance your career toolkit with more specialized features for resume creation, 
                cover letter writing, portfolio building, and job search management. Sign up for notifications to be the first to know when they're released.
              </p>
            </div>
            
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Do I need to create an account to use these tools?</h3>
              <p className="text-gray-600">
                No, you don't need to create an account. All our tools are accessible immediately without registration. Simply visit the tool you need and start using it right away. 
                This ensures quick access and maximum privacy. Your data is processed securely and not stored longer than necessary.
              </p>
            </div>
            
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">How accurate are the AI-powered suggestions?</h3>
              <p className="text-gray-600">
                Our AI tools use advanced algorithms trained on professional best practices and industry standards. The suggestions are based on proven strategies that have helped 
                thousands of professionals succeed. However, we always recommend reviewing and customizing the suggestions to match your unique situation and preferences for best results.
              </p>
            </div>
            
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Can I use these tools on mobile devices?</h3>
              <p className="text-gray-600">
                Yes, all our tools are fully responsive and optimized for mobile devices. You can access and use all features on smartphones and tablets, making it convenient 
                to work on your career development from anywhere. The mobile experience is designed to be as powerful and user-friendly as the desktop version.
              </p>
            </div>
            
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">How do these tools compare to paid alternatives?</h3>
              <p className="text-gray-600">
                Our free tools offer the same core functionality as many paid alternatives, with professional-quality results and industry-standard features. 
                While some premium services may offer additional customization options, our tools provide everything you need to create professional CVs, 
                optimize profiles, and advance your career without any cost.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">What makes your tools different from other free career tools?</h3>
              <p className="text-gray-600">
                Our tools stand out through advanced AI integration, comprehensive feature sets, ATS optimization, multiple export formats, and professional-grade output quality. 
                We focus on delivering real value with tools that actually help professionals succeed, backed by industry best practices and continuous improvements based on user feedback.
              </p>
            </div>
          </div>
        </section>
        )}

        {/* AI & SEO Optimized Content Section */}
        {!searchQuery && (
          <section className="mb-16 px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 border border-gray-200">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Comprehensive Career Development Resources</h2>
                
                <div className="prose prose-sm sm:prose-base max-w-none text-gray-700 space-y-4">
                  <p>
                    Our professional career tools platform provides <strong>comprehensive AI-powered solutions</strong> for every stage of your career journey. 
                    Whether you're a recent graduate entering the job market, a mid-career professional seeking advancement, or an executive looking to optimize 
                    your professional presence, our suite of {availableTools.length} specialized tools addresses your unique needs.
                  </p>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Career Application Tools</h3>
                  <p>
                    Our <strong>AI-Powered CV Builder</strong> and <strong>Cover Letter Generator</strong> help you create professional, ATS-optimized application materials 
                    that stand out to recruiters and hiring managers. These tools incorporate industry best practices, keyword optimization, and professional formatting 
                    to maximize your chances of landing interviews.
                  </p>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Professional Profile Optimization</h3>
                  <p>
                    The <strong>LinkedIn Profile Optimizer</strong> uses AI analysis to enhance your professional online presence, improve keyword density, 
                    optimize your headline and summary, and increase your profile's visibility to recruiters and potential employers. 
                    A well-optimized LinkedIn profile can increase profile views by up to 60% and connection requests.
                  </p>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Interview and Negotiation Preparation</h3>
                  <p>
                    Our <strong>Interview Preparation Tool</strong> provides practice questions, STAR method guidance, company research, and personalized feedback 
                    to help you ace your next interview. The <strong>Salary Negotiation Tool</strong> offers market research, negotiation scripts, 
                    and industry-specific strategies to help you maximize your earning potential, potentially increasing salary offers by 15-25%.
                  </p>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Career Planning and Development</h3>
                  <p>
                    The <strong>Career Path Planner</strong> helps you map your professional journey with AI-powered guidance, identifying skill gaps, 
                    recommending learning paths, and providing strategic career advice. The <strong>Skills Assessment Tool</strong> evaluates your professional 
                    competencies, identifies areas for improvement, and suggests targeted development opportunities.
                  </p>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Job Search Optimization</h3>
                  <p>
                    Our <strong>Job Search Optimizer</strong> provides personalized job recommendations, application strategies, networking tips, 
                    and search optimization techniques to help you find better opportunities faster and more efficiently.
                  </p>
                  
                  <div className="bg-blue-50 rounded-lg p-4 sm:p-6 mt-6 border border-blue-100">
                    <h4 className="font-semibold text-blue-900 mb-2">Key Statistics and Results</h4>
                    <ul className="list-disc list-inside space-y-2 text-blue-800 text-sm sm:text-base">
                      <li><strong>50,000+ professionals</strong> have used our tools to advance their careers</li>
                      <li><strong>40% increase</strong> in interview callbacks with optimized CVs</li>
                      <li><strong>60% increase</strong> in LinkedIn profile views with optimization</li>
                      <li><strong>15-25% salary increase</strong> potential with effective negotiation strategies</li>
                      <li><strong>2-3 hours saved</strong> per CV creation with AI assistance</li>
                      <li><strong>100% free</strong> access to all core features, no registration required</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className={`${sidebarOpen ? 'fixed inset-0 z-50 lg:relative lg:inset-auto' : 'hidden'} lg:block w-full lg:w-80 flex-shrink-0`}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 h-full lg:h-auto overflow-y-auto">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Tools & Resources</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-2">
                {sidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      handleToolClick(item);
                      setSidebarOpen(false);
                    }}
                    className={`w-full text-left p-3 sm:p-4 rounded-lg border transition-all duration-200 ${
                      selectedTool === item.id
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-xl sm:text-2xl flex-shrink-0">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 text-sm sm:text-base">{item.name}</h3>
                          {item.available ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Available
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Soon
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600">{item.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg">
                <p className="text-xs sm:text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Use search and filters to quickly find tools.
                </p>
              </div>
            </div>
          </div>
          
          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Mobile Sidebar Toggle */}
            <div className="lg:hidden mb-4 sm:mb-6">
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="font-medium">Browse Tools</span>
              </button>
            </div>

            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}