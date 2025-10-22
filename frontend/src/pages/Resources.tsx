import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSEO } from '../utils/seo';
import { generateBreadcrumbSchema, generateFAQSchema, injectStructuredData } from '../utils/structuredData';
import { useEffect } from 'react';
import ComingSoon from '../components/ComingSoon';

export default function Resources() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  useSEO({
    title: 'Professional Tools & Resources - AI-Powered Career Tools | Naqash Thaheem',
    description: 'Professional AI-powered tools for career advancement including CV Builder and Watermark Remover. Boost your productivity with free, easy-to-use automation tools.',
    url: '/resources',
    keywords: ['CV builder', 'resume builder', 'watermark remover', 'AI tools', 'career tools', 'professional templates', 'productivity tools', 'free tools']
  });

  useEffect(() => {
    // Add breadcrumb structured data
    const breadcrumbSchema = generateBreadcrumbSchema();
    injectStructuredData(breadcrumbSchema);

    // Add FAQ structured data
    const faqSchema = generateFAQSchema();
    injectStructuredData(faqSchema);
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
      available: false,
      features: ['AI-generated content', 'Job-specific tailoring', 'Multiple formats', 'Professional tone']
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
      available: false,
      features: ['Mock interviews', 'Question bank', 'AI feedback', 'Industry-specific']
    },
    {
      id: 'linkedin-optimizer',
      name: 'LinkedIn Profile Optimizer',
      description: 'Optimize your LinkedIn profile for maximum visibility',
      icon: '💼',
      available: false,
      features: ['Profile analysis', 'Keyword optimization', 'Headline suggestions', 'Skills recommendations']
    },
    {
      id: 'salary-negotiation',
      name: 'Salary Negotiation Tool',
      description: 'AI-powered salary negotiation guidance',
      icon: '💰',
      available: false,
      features: ['Market research', 'Negotiation scripts', 'Counter-offer strategies', 'Industry benchmarks']
    },
    {
      id: 'skill-assessment',
      name: 'Skill Assessment',
      description: 'Evaluate and improve your professional skills',
      icon: '📊',
      available: false,
      features: ['Skill gap analysis', 'Learning paths', 'Progress tracking', 'Certification recommendations']
    },
    {
      id: 'job-tracker',
      name: 'Job Application Tracker',
      description: 'Track and manage your job applications',
      icon: '📋',
      available: false,
      features: ['Application tracking', 'Interview scheduling', 'Follow-up reminders', 'Progress analytics']
    },
  ];

  const availableTools = [
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
  ];

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
      id: 'cover-letter-generator',
      title: "AI Cover Letter Generator",
      description: "Generate personalized cover letters tailored to specific job postings. AI-powered content that matches your CV and the job requirements.",
      category: "Career Tools",
      features: ["Job-specific tailoring", "AI-generated content", "Multiple tones", "CV integration"],
      icon: "✉️",
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
      id: 'interview-prep',
      title: "Interview Preparation Tool",
      description: "Practice interviews with AI-powered feedback. Industry-specific questions, mock interviews, and personalized improvement suggestions.",
      category: "Career Tools",
      features: ["Mock interviews", "AI feedback", "Industry questions", "Progress tracking"],
      icon: "🎯",
      expectedRelease: "Q3 2024"
    },
    {
      id: 'linkedin-optimizer',
      title: "LinkedIn Profile Optimizer",
      description: "Maximize your LinkedIn visibility with AI-powered profile optimization. Get keyword suggestions, headline improvements, and engagement strategies.",
      category: "Career Tools",
      features: ["Profile analysis", "Keyword optimization", "Headline suggestions", "Skills recommendations"],
      icon: "💼",
      expectedRelease: "Q4 2024"
    },
    {
      id: 'salary-negotiation',
      title: "Salary Negotiation Tool",
      description: "Master salary negotiations with AI-powered guidance. Get market research, negotiation scripts, and industry-specific strategies.",
      category: "Career Tools",
      features: ["Market research", "Negotiation scripts", "Counter-offer strategies", "Industry benchmarks"],
      icon: "💰",
      expectedRelease: "Q4 2024"
    },
    {
      id: 'skill-assessment',
      title: "Professional Skill Assessment",
      description: "Evaluate your skills and get personalized improvement plans. Identify skill gaps and get recommendations for growth.",
      category: "Career Tools",
      features: ["Skill gap analysis", "Learning paths", "Progress tracking", "Certification recommendations"],
      icon: "📊",
      expectedRelease: "Q1 2025"
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
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Professional Tools & Resources</h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-8">
            Boost your career and productivity with AI-powered tools designed for professionals. Create stunning CVs, optimize your content, and accelerate your success with our free, easy-to-use automation tools.
          </p>
          <div className="bg-blue-50 rounded-2xl p-8 mb-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Choose Our Tools?</h2>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">AI-Powered Efficiency</h3>
                  <p className="text-sm text-gray-600">Save hours with intelligent automation that delivers professional results in minutes.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Professional Quality</h3>
                  <p className="text-sm text-gray-600">Enterprise-grade tools that produce results worthy of top-tier professionals.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Zero Learning Curve</h3>
                  <p className="text-sm text-gray-600">Intuitive interfaces designed for immediate productivity - no training required.</p>
                </div>
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

        {/* Available Tools Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Available Tools</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {availableTools.map((tool, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100">
                <div className="p-8">
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-3xl mb-4">
                      {tool.icon}
                    </div>
                    <div className="ml-4">
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium">
                        {tool.category}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{tool.title}</h3>
                  <p className="text-gray-600 mb-6 text-lg leading-relaxed">{tool.description}</p>
                  
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Key Features:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {tool.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h5 className="font-semibold text-blue-900 mb-1">Business Impact</h5>
                        <p className="text-sm text-blue-800">{tool.benefits}</p>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => navigate(tool.path)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold text-lg"
                  >
                    Try {tool.title.split(' ')[0]} Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Coming Soon Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Coming Soon</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            We're constantly developing new tools to help you succeed. Here's what's coming next to boost your productivity and career growth.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {comingSoonTools.map((tool, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-100">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center text-3xl mx-auto mb-4">
                    {tool.icon}
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium mb-3 inline-block">
                    {tool.expectedRelease}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{tool.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{tool.description}</p>
                  
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">Features:</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {tool.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-1">
                          <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm">
                    Notify Me
                    </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Guides Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Professional Guides</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Master the skills that matter most for your career success. Our guides are designed by industry professionals to deliver real, measurable results.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            {guides.map((guide, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full font-medium">
                      {guide.difficulty}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-medium">
                      {guide.readTime}
                    </span>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{guide.title}</h3>
                <p className="text-gray-600 mb-6 text-lg leading-relaxed">{guide.description}</p>
                
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">What You'll Learn:</h4>
                  <div className="flex flex-wrap gap-2">
                    {guide.topics.map((topic, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h5 className="font-semibold text-green-900 mb-1">Expected Results</h5>
                      <p className="text-sm text-green-800">{guide.benefits}</p>
                    </div>
                  </div>
                </div>
                
                <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-semibold text-lg">
                  Read Guide
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
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
              <h3 className="text-xl font-semibold text-gray-900 mb-3">What new tools are you developing?</h3>
              <p className="text-gray-600">
                We're actively developing LinkedIn Profile Optimizer, Salary Negotiation Tool, Professional Skill Assessment, and Job Application Tracker. 
                These tools will help you optimize your online presence, negotiate better salaries, assess your skills, and manage your job search more effectively.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">When will the upcoming tools be available?</h3>
              <p className="text-gray-600">
                We're actively developing new tools based on user feedback and industry needs. Resume Templates and Cover Letter Generator are expected in Q2 2024, 
                with Portfolio Builder and Interview Prep tools following in Q3 2024. LinkedIn Optimizer and Salary Negotiation tools are planned for Q4 2024, 
                with Skill Assessment and Job Tracker coming in Q1 2025. Sign up for notifications to be the first to know when they're released.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-80 flex-shrink-0`}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Tools & Resources</h2>
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
                    onClick={() => handleToolClick(item)}
                    className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                      selectedTool === item.id
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900">{item.name}</h3>
                          {item.available ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Available
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Coming Soon
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Use the sidebar to navigate between different tools and resources.
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Mobile Sidebar Toggle */}
            <div className="lg:hidden mb-6">
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>Browse Tools</span>
              </button>
            </div>

            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}