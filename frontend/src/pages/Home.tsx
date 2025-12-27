import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/axios';
import { PostCard } from '../components/PostCard';
import ServiceBookingModal from '../components/ServiceBookingModal';
// Removed LazyImage for faster image loading
import { useSEO } from '../utils/seo';
import { generateAISearchSchema, generateKnowledgeGraphSchema, generateFAQSchema, injectAISearchOptimizations } from '../utils/aiSearchOptimization';
import { generateOrganizationSchema, injectStructuredData } from '../utils/structuredData';
import { getImageSources } from '../utils/imageUtils';

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featured_image?: string;
  published_at: string;
  category: {
    id: number;
    name: string;
  };
  user: {
    name: string;
  };
}


interface HomeSetting {
  key: string;
  type: string;
  value: string;
  image_url?: string;
}

interface HomeSettings {
  settings: HomeSetting[];
  grouped: {
    text: HomeSetting[];
    image: HomeSetting[];
    boolean: HomeSetting[];
  };
}

export default function Home() {
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [homeSettings, setHomeSettings] = useState<HomeSettings | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [bookingModal, setBookingModal] = useState<{ isOpen: boolean; serviceName: string }>({
    isOpen: false,
    serviceName: '',
  });

  // Helper function to get setting value
  const getSettingValue = (key: string, defaultValue: string = '') => {
    if (!homeSettings) return defaultValue;
    const setting = homeSettings.settings.find(s => s.key === key);
    return setting ? setting.value : defaultValue;
  };


  // Helper function to check boolean setting
  const getBooleanSetting = (key: string, defaultValue: boolean = false) => {
    if (!homeSettings) return defaultValue;
    const setting = homeSettings.settings.find(s => s.key === key);
    return setting ? setting.value === '1' : defaultValue;
  };

  // Helper function to get image URL
  const getImageUrl = (key: string, defaultValue: string = '') => {
    if (!homeSettings) return defaultValue;
    const setting = homeSettings.settings.find(s => s.key === key);
    if (!setting || setting.type !== 'image') return defaultValue;
    // If setting has image_url but it's using wrong port, construct correct URL
    if (setting.value) {
      const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || import.meta.env.VITE_APP_URL || 'http://localhost:8001';
      return `${baseUrl}/api/storage/${setting.value}`;
    }
    return defaultValue;
  };

  // Helper function to render image with WebP support
  const renderImage = (src: string, alt: string, className: string = '', props: any = {}) => {
    const sources = getImageSources(src);
    
    // Skip WebP for SVG, external URLs, or storage URLs (no conversion needed)
    if (src.endsWith('.svg') || src.includes('/storage/') || src.startsWith('http') || sources.webpSrc === sources.originalSrc) {
      return <img src={sources.originalSrc} alt={alt} className={className} {...props} />;
    }
    
    // Use picture element with WebP fallback for local PNG/JPG images
    return (
      <picture>
        <source srcSet={sources.webpSrc} type="image/webp" />
        <img src={sources.originalSrc} alt={alt} className={className} {...props} />
      </picture>
    );
  };

  useSEO({
    title: 'AI Automation, LLM Integration, AI Chatbots & AI Agents Services | Workflow Automation Expert | Business Intelligence Solutions',
    description: 'Expert AI automation, LLM integration, AI chatbots, and AI agents services. Specializing in GPT-4, OpenAI, large language models, conversational AI, intelligent workflow automation, AI-powered CRM integration, Power BI dashboards, and business intelligence solutions. 8+ years experience with n8n, Make.com, AI agents, and autonomous systems. Global remote services available.',
    image: '/images/professional_busines_b4d6588a.webp',
    url: '/',
    keywords: [
      'AI automation expert', 'LLM integration services', 'GPT-4 integration', 'OpenAI automation', 
      'large language model integration', 'AI workflow automation', 'intelligent automation solutions',
      'AI agents development', 'AI chatbots development', 'conversational AI', 'autonomous AI agents',
      'natural language processing automation', 'AI chatbot builder',
      'GPT-4 chatbot', 'OpenAI chatbot integration', 'LLM chatbot development', 'AI agent framework',
      'autonomous AI systems', 'intelligent AI agents', 'AI-powered CRM integration', 'business intelligence AI', 
      'AI consulting services', 'workflow automation with AI', 'AI-driven analytics', 'LLM consulting', 
      'AI automation specialist', 'AI chatbot specialist', 'AI agent specialist', 'conversational AI expert',
      'global automation expert', 'n8n AI integration', 'Make.com AI workflows', 'Zoho CRM AI',
      'Power BI AI dashboards', 'remote AI services', 'AI business solutions', 'enterprise AI automation',
      'custom AI chatbots', 'enterprise AI agents', 'AI chatbot platform', 'AI agent platform'
    ],
    structuredData: 'custom',
    customStructuredData: generateAISearchSchema()
  });

  useEffect(() => {
    fetchFeaturedPosts();
    fetchHomeSettings();
    
    // Inject AI search optimizations
    injectAISearchOptimizations();
    
    // Add additional structured data for AI search engines
    const knowledgeGraphSchema = generateKnowledgeGraphSchema();
    const faqSchema = generateFAQSchema();
    const organizationSchema = generateOrganizationSchema();
    
    // Inject knowledge graph schema
    const kgScript = document.createElement('script');
    kgScript.type = 'application/ld+json';
    kgScript.textContent = JSON.stringify(knowledgeGraphSchema);
    document.head.appendChild(kgScript);
    
    // Inject FAQ schema
    const faqScript = document.createElement('script');
    faqScript.type = 'application/ld+json';
    faqScript.textContent = JSON.stringify(faqSchema);
    document.head.appendChild(faqScript);
    
    // Inject Organization schema for better SEO
    injectStructuredData(organizationSchema);
    
    // Add scroll animation observer with fallback
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove('opacity-0');
            entry.target.classList.add('animate-fade-in-up', 'opacity-100');
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    // Observe all sections with scroll-animate class
    const animatedElements = document.querySelectorAll('.scroll-animate');
    animatedElements.forEach((el) => {
      observer.observe(el);
    });

    // Fallback: Make all content visible after 2 seconds if animations fail
    const fallbackTimer = setTimeout(() => {
      animatedElements.forEach((el) => {
        el.classList.remove('opacity-0');
        el.classList.add('opacity-100');
      });
    }, 2000);

    // Scroll to top button visibility
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const fetchFeaturedPosts = async () => {
    try {
      const response = await apiClient.get('/posts?per_page=3');
      setFeaturedPosts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching featured posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHomeSettings = async () => {
    try {
      const response = await apiClient.get('/home-settings');
      setHomeSettings(response.data);
    } catch (error) {
      console.error('Error fetching home settings:', error);
    }
  };


  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div>
      {/* Hero Section - Ultra Engaging Show Stopper */}
      <section 
        className="relative text-white py-32 md:py-48 overflow-hidden min-h-[90vh] flex items-center"
      >
        {/* Gradient overlay */}
        <div 
          className="absolute inset-0 -z-10"
          style={{
            background: `linear-gradient(135deg, rgba(37, 99, 235, 0.85) 0%, rgba(147, 51, 234, 0.8) 30%, rgba(219, 39, 119, 0.85) 60%, rgba(37, 99, 235, 0.9) 100%)`
          }}
        />
        {/* Hero image as proper img element for better LCP - visible and high priority */}
        {(() => {
          const heroImage = getImageUrl('hero_image', '/images/modern_technology_ab_8cef6e70.jpg');
          const sources = getImageSources(heroImage);
          return (
            <picture>
              {sources.webpSrc !== sources.originalSrc && !heroImage.includes('/storage/') && !heroImage.startsWith('http') && (
                <source srcSet={sources.webpSrc} type="image/webp" />
              )}
              <img 
                src={sources.originalSrc} 
                alt=""
                className="absolute inset-0 w-full h-full object-cover -z-10"
                fetchPriority="high"
                loading="eager"
                decoding="async"
                width="1920"
                height="1080"
                style={{ willChange: 'auto' }}
              />
            </picture>
          );
        })()}
        {/* Enhanced Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-6000"></div>
        </div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
            </div>
            
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-white/20 backdrop-blur-md rounded-full border border-white/30 animate-fade-in">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-sm font-semibold">Available for New Projects</span>
              <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold">FREE Consultation</span>
            </div>

            {/* Main Headline - Ultra Prominent */}
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-extrabold mb-8 leading-tight">
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-white via-yellow-200 to-white animate-gradient">
                {getSettingValue('hero_title', 'Automate Your Business With AI')}
              </span>
            </h1>
            
            {/* Subtitle with animation */}
            <p className="text-3xl md:text-4xl lg:text-5xl mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 font-bold leading-tight">
              {getSettingValue('hero_subtitle', 'Transform Your Business with AI-Powered Automation & Large Language Models')}
            </p>
            
            {/* Description */}
            <p className="text-xl md:text-2xl text-blue-50 mb-10 max-w-4xl mx-auto leading-relaxed font-medium">
              Streamline operations, boost productivity, and drive growth with our comprehensive AI automation, LLM integration, AI chatbots, and AI agents solutions. From GPT-4 powered workflows, intelligent automation, conversational AI chatbots, and autonomous AI agents to AI-driven CRM integration, Power BI dashboards, and intelligent automation - we deliver measurable results for businesses worldwide using cutting-edge AI, large language models, and intelligent agent technologies.
            </p>

            {/* Key Stats - Show Stopper */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all transform hover:scale-110">
                <div className="text-4xl md:text-5xl font-extrabold text-yellow-300 mb-1">8+</div>
                <div className="text-sm md:text-base text-blue-100 font-semibold">Years Experience</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all transform hover:scale-110">
                <div className="text-4xl md:text-5xl font-extrabold text-yellow-300 mb-1">100+</div>
                <div className="text-sm md:text-base text-blue-100 font-semibold">Projects Delivered</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all transform hover:scale-110">
                <div className="text-4xl md:text-5xl font-extrabold text-yellow-300 mb-1">50+</div>
                <div className="text-sm md:text-base text-blue-100 font-semibold">AI Workflows</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all transform hover:scale-110">
                <div className="text-4xl md:text-5xl font-extrabold text-yellow-300 mb-1">20+</div>
                <div className="text-sm md:text-base text-blue-100 font-semibold">Integrations</div>
              </div>
            </div>
            
            {/* Service Highlights with Images - Enhanced */}
            <div className="grid md:grid-cols-3 gap-6 mb-10 max-w-5xl mx-auto">
              <Link to="/workflows" className="group relative bg-white/15 backdrop-blur-lg rounded-2xl p-6 border-2 border-white/30 hover:border-white/50 hover:bg-white/25 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 mb-4 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center text-3xl transform group-hover:rotate-12 transition-transform">
                    🤖
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">AI Workflow Automation</h3>
                  <p className="text-sm text-blue-100 mb-3">GPT-4, OpenAI, n8n, Make.com</p>
                  <p className="text-xs text-yellow-200 font-semibold flex items-center gap-1">
                    View AI Workflows 
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </p>
                </div>
              </Link>
              <Link to="/blog" className="group relative bg-white/15 backdrop-blur-lg rounded-2xl p-6 border-2 border-white/30 hover:border-white/50 hover:bg-white/25 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 mb-4 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center text-3xl transform group-hover:rotate-12 transition-transform">
                    📊
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">AI Business Intelligence</h3>
                  <p className="text-sm text-blue-100 mb-3">AI-Powered Analytics, Power BI</p>
                  <p className="text-xs text-yellow-200 font-semibold flex items-center gap-1">
                    Read Blog 
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </p>
                </div>
              </Link>
              <Link to="/resources" className="group relative bg-white/15 backdrop-blur-lg rounded-2xl p-6 border-2 border-white/30 hover:border-white/50 hover:bg-white/25 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 mb-4 bg-gradient-to-br from-pink-400 to-blue-500 rounded-xl flex items-center justify-center text-3xl transform group-hover:rotate-12 transition-transform">
                    🔗
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">AI CRM Integration</h3>
                  <p className="text-sm text-blue-100 mb-3">LLM-Powered CRM, Zoho, HubSpot</p>
                  <p className="text-xs text-yellow-200 font-semibold flex items-center gap-1">
                    Free AI Tools 
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </p>
                </div>
              </Link>
            </div>
            
            {/* Contact Info */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-lg mb-8">
              <div className="flex items-center gap-2 hover:text-blue-200 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span>Ajman, U.A.E</span>
              </div>
              <div className="flex items-center gap-2 hover:text-blue-200 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <a href="mailto:contact@naqashthaheem.com" className="hover:underline">
                  contact@naqashthaheem.com
                </a>
              </div>
            </div>

            {/* Ultra Prominent CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-10">
              <button
                onClick={() => setBookingModal({ isOpen: true, serviceName: 'Consultation' })}
                className="group relative px-10 py-5 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 text-blue-900 rounded-2xl font-extrabold text-xl hover:from-yellow-300 hover:via-yellow-200 hover:to-yellow-300 hover:shadow-2xl transform hover:scale-110 transition-all duration-500 overflow-hidden border-4 border-white/50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                <div className="relative z-10 flex items-center gap-3">
                  <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Book FREE Consultation</span>
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full animate-ping"></div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">!</span>
                </div>
              </button>
              <Link
                to="/contact"
                className="group relative px-10 py-5 bg-white/20 backdrop-blur-md text-white rounded-2xl font-extrabold text-xl hover:bg-white/30 hover:shadow-2xl transform hover:scale-110 transition-all duration-500 border-4 border-white/50 hover:border-white/80"
              >
                <div className="relative z-10 flex items-center gap-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Get In Touch</span>
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </Link>
            </div>

            {/* Social Media Links */}
            <div className="flex gap-6 justify-center">
              <a 
                href="https://www.linkedin.com/in/naqash-thaheem-297464147" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-blue-200 transform hover:scale-110 transition-all duration-300"
                aria-label="LinkedIn"
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              <a 
                href="https://github.com/naqash-thaheem" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-blue-200 transform hover:scale-110 transition-all duration-300"
                aria-label="GitHub"
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <a 
                href="https://www.fiverr.com/hoiyothaheem" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-green-300 transform hover:scale-110 transition-all duration-300"
                aria-label="Fiverr"
              >
                <img 
                  src="/images/fiverr-icon.svg" 
                  alt="Fiverr" 
                  className="w-8 h-8"
                  width="32"
                  height="32"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    // Fallback to SVG if image doesn't exist
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    svg.setAttribute('class', 'w-8 h-8');
                    svg.setAttribute('fill', 'none');
                    svg.setAttribute('stroke', 'currentColor');
                    svg.setAttribute('viewBox', '0 0 24 24');
                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    path.setAttribute('stroke-linecap', 'round');
                    path.setAttribute('stroke-linejoin', 'round');
                    path.setAttribute('stroke-width', '2');
                    path.setAttribute('d', 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z');
                    svg.appendChild(path);
                    target.parentNode?.appendChild(svg);
                  }}
                />
              </a>
              <a 
                href="mailto:contact@naqashthaheem.com"
                className="text-white hover:text-blue-200 transform hover:scale-110 transition-all duration-300"
                aria-label="Email"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Notification Banner */}
      {getBooleanSetting('notification_enabled', false) && (
        <div className={`py-4 px-4 ${
          getSettingValue('notification_type', 'info') === 'success' ? 'bg-green-600' :
          getSettingValue('notification_type', 'info') === 'warning' ? 'bg-yellow-600' :
          getSettingValue('notification_type', 'info') === 'error' ? 'bg-red-600' :
          'bg-blue-600'
        } text-white`}>
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-lg font-medium">
              {getSettingValue('notification_message', 'Welcome to our new platform!')}
            </p>
          </div>
        </div>
      )}

      {/* Our Services Section */}
      <section className="py-16 bg-white scroll-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">Our Services</h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            Comprehensive AI automation, LLM integration, AI chatbots, AI agents, and intelligent workflow solutions to streamline your business operations and drive growth
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-blue-100">
              <div className="mb-4">
                {renderImage(
                  "/images/AI Automation.png",
                  "AI Workflow Automation",
                  "w-full h-48 object-cover rounded-lg",
                  { loading: "lazy", width: "400", height: "192", decoding: "async", fetchPriority: "low", style: { aspectRatio: '400/192', minHeight: '192px' } }
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Workflow Automation</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Automate repetitive tasks, streamline business processes, and reduce manual errors with AI-powered intelligent workflow solutions. Integrate GPT-4, OpenAI, and large language models (LLM) with n8n, Make.com, and Zapier for next-generation automation.
              </p>
              <div className="flex flex-col gap-2">
                <Link to="/workflows" className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-2 group text-sm">
                  View Workflows 
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                </Link>
                <button
                  onClick={() => setBookingModal({ isOpen: true, serviceName: 'Workflow Automation' })}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
                >
                  Book Now
                </button>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-purple-100">
              <div className="mb-4">
                {renderImage(
                  "/images/Move_from_Data_to_Decisions_version_1.png",
                  "AI Business Intelligence",
                  "w-full h-48 object-cover rounded-lg",
                  { loading: "lazy", width: "400", height: "192", decoding: "async", fetchPriority: "low", style: { aspectRatio: '400/192', minHeight: '192px' } }
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Business Intelligence</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Create interactive Power BI dashboards powered by AI. Generate actionable insights using LLM-driven analytics, natural language processing, and AI-powered data visualization for intelligent, data-driven business decisions.
              </p>
              <div className="flex flex-col gap-2">
                <Link to="/blog" className="text-purple-600 hover:text-purple-700 font-semibold inline-flex items-center gap-2 group text-sm">
                  Read Blog 
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <button
                  onClick={() => setBookingModal({ isOpen: true, serviceName: 'Business Intelligence' })}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-semibold text-sm"
                >
                  Book Now
                </button>
            </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-green-100">
              <div className="mb-4">
                {renderImage(
                  "/images/Automation.png",
                  "AI System Integrations",
                  "w-full h-48 object-cover rounded-lg",
                  { loading: "lazy", width: "400", height: "192", decoding: "async", fetchPriority: "low", style: { aspectRatio: '400/192', minHeight: '192px' } }
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI System Integrations</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Connect your CRM, marketing tools, databases, and third-party services into a unified AI-powered ecosystem. Leverage LLM integration, AI agents, and intelligent automation to create seamless, intelligent workflows that work together.
              </p>
              <div className="flex flex-col gap-2">
                <Link to="/projects" className="text-green-600 hover:text-green-700 font-semibold inline-flex items-center gap-2 group text-sm">
                  View Projects 
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <button
                  onClick={() => setBookingModal({ isOpen: true, serviceName: 'System Integrations' })}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
                >
                  Book Now
                </button>
            </div>
          </div>
            <div className="bg-gradient-to-br from-orange-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-orange-100">
              <div className="mb-4">
                {renderImage(
                  "/images/Web_development.png",
                  "AI-Powered Full-Stack Development",
                  "w-full h-48 object-cover rounded-lg",
                  { loading: "lazy", width: "400", height: "192", decoding: "async", fetchPriority: "low", style: { aspectRatio: '400/192', minHeight: '192px' } }
                )}
        </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI-Powered Full-Stack Development</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Build scalable web applications, APIs, and custom software solutions with AI integration. Develop intelligent applications using modern frameworks like React, .NET Core, and Laravel, enhanced with GPT-4, OpenAI APIs, and LLM capabilities.
              </p>
              <div className="flex flex-col gap-2">
                <Link to="/contact" className="text-orange-600 hover:text-orange-700 font-semibold inline-flex items-center gap-2 group text-sm">
                  Start a Project 
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <button
                  onClick={() => setBookingModal({ isOpen: true, serviceName: 'Full-Stack Development' })}
                  className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-semibold text-sm"
                >
                  Book Now
                </button>
          </div>
                  </div>
            <div className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-indigo-100">
              <div className="mb-4">
                {renderImage(
                  "/images/SEO.png",
                  "AI-Powered SEO & Digital Marketing",
                  "w-full h-48 object-cover rounded-lg",
                  { loading: "lazy", width: "400", height: "192", decoding: "async", fetchPriority: "low", style: { aspectRatio: '400/192', minHeight: '192px' } }
                )}
                  </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI-Powered SEO & Digital Marketing</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Improve your online visibility with AI-driven SEO solutions. Leverage LLM-powered content optimization, GPT-4 for keyword research, AI content strategy, intelligent technical SEO audits, and AI-based performance tracking.
              </p>
              <div className="flex flex-col gap-2">
                <Link to="/contact" className="text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-2 group text-sm">
                  Learn More 
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
            </Link>
                <button
                  onClick={() => setBookingModal({ isOpen: true, serviceName: 'SEO & Digital Marketing' })}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-sm"
                >
                  Book Now
                </button>
          </div>
        </div>
            <div className="bg-gradient-to-br from-pink-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-pink-100">
              <div className="mb-4">
                {renderImage(
                  "/images/Al Content Marketing.png",
                  "Content Marketing & SEO Writing",
                  "w-full h-48 object-cover rounded-lg",
                  { loading: "lazy", width: "400", height: "192", decoding: "async", fetchPriority: "low", style: { aspectRatio: '400/192', minHeight: '192px' } }
                )}
          </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Content Marketing & LLM-Powered SEO Writing</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Create SEO-optimized content using GPT-4 and large language models. Generate engaging blog posts, articles, landing pages, and content strategies with AI-powered writing that ranks well and resonates with your audience.
              </p>
              <div className="flex flex-col gap-2">
                <Link to="/contact" className="text-pink-600 hover:text-pink-700 font-semibold inline-flex items-center gap-2 group text-sm">
                  Learn More 
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
                <button
                  onClick={() => setBookingModal({ isOpen: true, serviceName: 'Content Marketing & SEO Writing' })}
                  className="w-full bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors font-semibold text-sm"
                >
                  Book Now
                </button>
            </div>
            </div>
            <div className="bg-gradient-to-br from-cyan-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-cyan-100">
              <div className="mb-4">
                {renderImage(
                  "/images/link  Building.png",
                  "Link Building & Outreach",
                  "w-full h-48 object-cover rounded-lg",
                  { loading: "lazy", width: "400", height: "192", decoding: "async", fetchPriority: "low", style: { aspectRatio: '400/192', minHeight: '192px' } }
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Link Building & Outreach</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Build high-quality backlinks through strategic outreach, guest posting, and relationship building to boost your domain authority.
              </p>
              <div className="flex flex-col gap-2">
                <Link to="/contact" className="text-cyan-600 hover:text-cyan-700 font-semibold inline-flex items-center gap-2 group text-sm">
                Learn More 
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
                <button
                  onClick={() => setBookingModal({ isOpen: true, serviceName: 'Link Building & Outreach' })}
                  className="w-full bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors font-semibold text-sm"
                >
                  Book Now
                </button>
            </div>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-teal-100">
              <div className="mb-4">
                {renderImage(
                  "/images/AI Automation.png",
                  "AI Chatbots & Conversational AI",
                  "w-full h-48 object-cover rounded-lg",
                  { loading: "lazy", width: "400", height: "192", decoding: "async", fetchPriority: "low", style: { aspectRatio: '400/192', minHeight: '192px' } }
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Chatbots & Conversational AI</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Build intelligent AI chatbots powered by GPT-4, OpenAI, and large language models (LLM) for customer support, lead generation, and automated conversations. Create conversational AI agents that understand context, provide personalized responses, and integrate seamlessly with your CRM, website, and messaging platforms.
              </p>
              <div className="flex flex-col gap-2">
                <Link to="/contact" className="text-teal-600 hover:text-teal-700 font-semibold inline-flex items-center gap-2 group text-sm">
                  Learn More 
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <button
                  onClick={() => setBookingModal({ isOpen: true, serviceName: 'AI Chatbots & Conversational AI' })}
                  className="w-full bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors font-semibold text-sm"
                >
                  Book Now
                </button>
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-emerald-100">
              <div className="mb-4">
                {renderImage(
                  "/images/Workflow.png",
                  "AI Agents & Autonomous Systems",
                  "w-full h-48 object-cover rounded-lg",
                  { loading: "lazy", width: "400", height: "192", decoding: "async", fetchPriority: "low", style: { aspectRatio: '400/192', minHeight: '192px' } }
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Agents & Autonomous Systems</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Develop intelligent AI agents that autonomously perform complex tasks, make decisions, and interact with multiple systems. Create LLM-powered autonomous agents using GPT-4, OpenAI APIs, and advanced AI frameworks for data processing, workflow automation, customer service, and business intelligence operations.
              </p>
              <div className="flex flex-col gap-2">
                <Link to="/workflows" className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-2 group text-sm">
                  View Workflows 
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <button
                  onClick={() => setBookingModal({ isOpen: true, serviceName: 'AI Agents & Autonomous Systems' })}
                  className="w-full bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-semibold text-sm"
                >
                  Book Now
                </button>
              </div>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-rose-100">
              <div className="mb-4">
                {renderImage(
                  "/images/Social Media.png",
                  "Social Media Marketing",
                  "w-full h-48 object-cover rounded-lg",
                  { loading: "lazy", width: "400", height: "192", decoding: "async", fetchPriority: "low", style: { aspectRatio: '400/192', minHeight: '192px' } }
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Social Media Marketing</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Grow your brand presence across social platforms with strategic content, community management, and performance-driven campaigns.
              </p>
              <div className="flex flex-col gap-2">
                <Link to="/contact" className="text-rose-600 hover:text-rose-700 font-semibold inline-flex items-center gap-2 group text-sm">
                  Learn More 
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
                <button
                  onClick={() => setBookingModal({ isOpen: true, serviceName: 'Social Media Marketing' })}
                  className="w-full bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors font-semibold text-sm"
                >
                  Book Now
                </button>
            </div>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-teal-100">
              <div className="mb-4">
                {renderImage(
                  "/images/AI Analytics.png",
                  "AI Data Analytics & Intelligent Reporting",
                  "w-full h-48 object-cover rounded-lg",
                  { loading: "lazy", width: "400", height: "192", decoding: "async", fetchPriority: "low", style: { aspectRatio: '400/192', minHeight: '192px' } }
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Data Analytics & Intelligent Reporting</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Transform raw data into actionable insights using AI. Leverage LLM-powered analytics, intelligent reporting, AI-driven KPI dashboards, and automated data processing pipelines with natural language query capabilities.
              </p>
              <div className="flex flex-col gap-2">
                <Link to="/contact" className="text-teal-600 hover:text-teal-700 font-semibold inline-flex items-center gap-2 group text-sm">
                  Learn More 
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
                <button
                  onClick={() => setBookingModal({ isOpen: true, serviceName: 'Data Analytics & Reporting' })}
                  className="w-full bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors font-semibold text-sm"
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fiverr Gigs Section */}
      <section className="py-16 bg-gradient-to-br from-green-50 to-white scroll-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Available on Fiverr</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional automation and business intelligence services available on Fiverr
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Gig 1 */}
            <a
              href="https://www.fiverr.com/s/WEpQVQ7"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-green-100 group"
            >
              <div className="h-48 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <svg className="w-24 h-24 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">Automation Services</h3>
                  <svg className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
                <p className="text-gray-600 mb-4">Workflow automation, CRM integration, and business process optimization</p>
                <div className="flex items-center text-green-600 font-semibold">
                  <span>View on Fiverr</span>
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </a>

            {/* Gig 2 */}
            <a
              href="https://www.fiverr.com/s/xXgqwml"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-green-100 group"
            >
              <div className="h-48 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <svg className="w-24 h-24 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">Business Intelligence</h3>
                  <svg className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
                <p className="text-gray-600 mb-4">Power BI dashboards, data analysis, and business intelligence solutions</p>
                <div className="flex items-center text-green-600 font-semibold">
                  <span>View on Fiverr</span>
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </a>

            {/* Gig 3 */}
            <a
              href="https://www.fiverr.com/s/P2YQbLp"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-green-100 group"
            >
              <div className="h-48 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <svg className="w-24 h-24 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">System Integration</h3>
                  <svg className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
                <p className="text-gray-600 mb-4">CRM integration, API development, and system connectivity solutions</p>
                <div className="flex items-center text-green-600 font-semibold">
                  <span>View on Fiverr</span>
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </a>
          </div>
          <div className="text-center mt-12">
            <a
              href="https://www.fiverr.com/hoiyothaheem"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-green-600 text-white px-8 py-4 rounded-full hover:bg-green-700 transform hover:scale-105 transition-all duration-300 font-semibold text-lg shadow-lg"
            >
              View All Services on Fiverr
            </a>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions Section */}
      <section className="py-16 bg-white scroll-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Common questions about global AI automation, CRM integration, and business intelligence services
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">What services does Naqash Thaheem offer?</h3>
                <p className="text-gray-600">
                  Naqash offers AI automation workflows, CRM integration services, Power BI dashboard development, web development, and business intelligence solutions globally. He specializes in n8n, Make.com, Zoho CRM, HubSpot, and OpenAI integrations, serving clients worldwide with remote services.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">What is AI automation and how can it help my business?</h3>
                <p className="text-gray-600">
                  AI automation uses artificial intelligence to automate repetitive business processes, reducing manual work and improving efficiency. It can help businesses save time, reduce errors, and scale operations by automating tasks like data processing, email marketing, CRM updates, and workflow management.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">What tools does Naqash use for automation?</h3>
                <p className="text-gray-600">
                  Naqash uses n8n, Make.com, Zapier, OpenAI GPT models, Zoho CRM, HubSpot, Power BI, React, .NET Core, Laravel, and Python for creating comprehensive automation solutions and business intelligence dashboards.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">How can I get started with automation for my business?</h3>
                <p className="text-gray-600">
                  Start by identifying repetitive tasks in your business, then contact Naqash for a remote consultation. He can analyze your processes and recommend the best automation solutions using tools like n8n, Make.com, or custom integrations, regardless of your location.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">What is the cost of automation services?</h3>
                <p className="text-gray-600">
                  Automation service costs vary based on complexity and requirements. Contact Naqash at contact@naqashthaheem.com for a personalized quote based on your specific business needs and automation goals.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Does Naqash provide ongoing support for automation solutions?</h3>
                <p className="text-gray-600">
                  Yes, Naqash provides comprehensive remote support and maintenance for all automation solutions globally. This includes monitoring, troubleshooting, updates, and optimization to ensure your workflows continue running efficiently, regardless of your location.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Insights Section - Enhanced */}
      <section className="py-16 bg-white scroll-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">
            Latest Insights
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            Thoughts on automation, AI, and business transformation
          </p>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : featuredPosts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {featuredPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-600">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg">No posts published yet. Check back soon!</p>
            </div>
          )}
          <div className="text-center">
            <Link
              to="/blog"
              className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white px-10 py-4 rounded-full hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-300 font-semibold text-lg shadow-lg"
            >
              View All Posts
            </Link>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-16 bg-gradient-to-br from-purple-50 to-white scroll-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Join Our Community</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get help, share solutions, and connect with others working on automation and business intelligence projects
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-purple-100">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
                </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Community Issues & Solutions</h3>
                <p className="text-gray-600 mb-6">
                  Browse technical issues, share your solutions, and get help from the community. Whether you're working with n8n, Make.com, Power BI, or any automation tool, find answers and contribute to the community knowledge base.
                </p>
                <Link
                  to="/community/issues"
                  className="inline-block bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-full hover:from-purple-700 hover:to-purple-800 transform hover:scale-105 transition-all duration-300 font-semibold text-lg shadow-lg"
                >
                  Visit Community Issues →
                </Link>
                </div>
              </div>
              </div>
        </div>
      </section>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 transform hover:scale-110 transition-all duration-300 z-50 animate-bounce"
          aria-label="Scroll to top"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}

      {/* Service Booking Modal */}
      <ServiceBookingModal
        isOpen={bookingModal.isOpen}
        onClose={() => setBookingModal({ isOpen: false, serviceName: '' })}
        serviceName={bookingModal.serviceName}
      />
    </div>
  );
}
