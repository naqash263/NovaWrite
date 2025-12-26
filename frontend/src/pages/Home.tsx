import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/axios';
import { PostCard } from '../components/PostCard';
import AdPlacement from '../components/AdPlacement';
import ServiceBookingModal from '../components/ServiceBookingModal';
// Removed LazyImage for faster image loading
import { useSEO } from '../utils/seo';
import { generateAISearchSchema, generateKnowledgeGraphSchema, generateFAQSchema, injectAISearchOptimizations } from '../utils/aiSearchOptimization';
import { generateOrganizationSchema, injectStructuredData } from '../utils/structuredData';

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

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  submit?: string;
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
  const [contactForm, setContactForm] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactErrors, setContactErrors] = useState<Partial<ContactFormData>>({});
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

  useSEO({
    title: 'AI Automation & LLM Integration Services | Workflow Automation Expert | Business Intelligence Solutions',
    description: 'Expert AI automation and LLM integration services. Specializing in GPT-4, OpenAI, large language models, intelligent workflow automation, AI-powered CRM integration, Power BI dashboards, and business intelligence solutions. 8+ years experience with n8n, Make.com, AI agents, and machine learning automation. Global remote services available.',
    image: '/images/professional_busines_b4d6588a.jpg',
    url: '/',
    keywords: [
      'AI automation expert', 'LLM integration services', 'GPT-4 integration', 'OpenAI automation', 
      'large language model integration', 'AI workflow automation', 'intelligent automation solutions',
      'AI agents development', 'machine learning automation', 'natural language processing automation',
      'AI-powered CRM integration', 'business intelligence AI', 'AI consulting services',
      'workflow automation with AI', 'AI-driven analytics', 'LLM consulting', 'AI automation specialist',
      'global automation expert', 'n8n AI integration', 'Make.com AI workflows', 'Zoho CRM AI',
      'Power BI AI dashboards', 'remote AI services', 'AI business solutions', 'enterprise AI automation'
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

  const validateContactForm = (): boolean => {
    const errors: Partial<ContactFormData> = {};

    // Normalize values by trimming
    const trimmedName = contactForm.name.trim();
    const trimmedEmail = contactForm.email.trim();
    const trimmedSubject = contactForm.subject.trim();
    const trimmedMessage = contactForm.message.trim();

    // Validate name
    if (!trimmedName) {
      errors.name = 'Name is required';
    } else if (trimmedName.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address';
    }

    // Validate subject
    if (!trimmedSubject) {
      errors.subject = 'Subject is required';
    } else if (trimmedSubject.length < 3) {
      errors.subject = 'Subject must be at least 3 characters';
    }

    // Validate message
    if (!trimmedMessage) {
      errors.message = 'Message is required';
    } else if (trimmedMessage.length < 10) {
      errors.message = 'Message must be at least 10 characters';
    }

    setContactErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateContactForm()) {
      return;
    }

    try {
      await apiClient.post('/contact', contactForm);
      setContactSubmitted(true);
      setContactErrors({});
      setTimeout(() => {
        setContactForm({ name: '', email: '', subject: '', message: '' });
        setContactSubmitted(false);
      }, 3000);
    } catch (error: any) {
      setContactErrors({
        ...contactErrors,
        submit: error.response?.data?.message || 'Failed to send message. Please try again.'
      });
    }
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setContactForm({
      ...contactForm,
      [e.target.name]: e.target.value
    });
    // Clear error for this field when user starts typing
    if (contactErrors[e.target.name as keyof ContactFormData]) {
      setContactErrors({
        ...contactErrors,
        [e.target.name]: undefined
      });
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
      {/* Hero Section - Enhanced */}
      <section 
        className="relative text-white py-24 md:py-32 bg-cover bg-center bg-no-repeat overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(37, 99, 235, 0.9) 0%, rgba(29, 78, 216, 0.85) 50%, rgba(30, 64, 175, 0.9) 100%), url('${getImageUrl('hero_image', '/images/modern_technology_ab_8cef6e70.jpg')}')`
        }}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white">
              {getSettingValue('hero_title', 'AI Automation & LLM Integration Services')}
            </h1>
            
            <p className="text-2xl md:text-3xl mb-4 text-blue-50 font-semibold">
              {getSettingValue('hero_subtitle', 'Transform Your Business with AI-Powered Automation & Large Language Models')}
            </p>
            
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              Streamline operations, boost productivity, and drive growth with our comprehensive AI automation and LLM integration solutions. From GPT-4 powered workflows and intelligent automation to AI-driven CRM integration, Power BI dashboards, and machine learning automation - we deliver measurable results for businesses worldwide using cutting-edge AI and large language model technologies.
            </p>
            
            {/* Service Highlights with Links */}
            <div className="grid md:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto">
              <Link to="/workflows" className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-4 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
                <div className="text-3xl mb-2">🤖</div>
                <h3 className="font-semibold text-white mb-1">AI Workflow Automation</h3>
                <p className="text-sm text-blue-100">GPT-4, OpenAI, n8n, Make.com</p>
                <p className="text-xs text-blue-200 mt-2">View AI Workflows →</p>
              </Link>
              <Link to="/blog" className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-4 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
                <div className="text-3xl mb-2">📊</div>
                <h3 className="font-semibold text-white mb-1">AI Business Intelligence</h3>
                <p className="text-sm text-blue-100">AI-Powered Analytics, Power BI</p>
                <p className="text-xs text-blue-200 mt-2">Read Blog →</p>
              </Link>
              <Link to="/resources" className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-4 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
                <div className="text-3xl mb-2">🔗</div>
                <h3 className="font-semibold text-white mb-1">AI CRM Integration</h3>
                <p className="text-sm text-blue-100">LLM-Powered CRM, Zoho, HubSpot</p>
                <p className="text-xs text-blue-200 mt-2">Free AI Tools →</p>
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

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <button
                onClick={() => setBookingModal({ isOpen: true, serviceName: 'Consultation' })}
                className="bg-white text-blue-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-50 hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                Book Consultation
              </button>
              <Link
                to="/contact"
                className="bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-700 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-white"
              >
                Get In Touch
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

      {/* Stats Section - Enhanced with hover effects */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50 scroll-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border-t-4 border-blue-600">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 mb-2">8+</div>
              <div className="text-gray-600 font-semibold">Years Experience</div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border-t-4 border-purple-600">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-purple-800 mb-2">100+</div>
              <div className="text-gray-600 font-semibold">Projects Delivered</div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border-t-4 border-green-600">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-800 mb-2">50+</div>
              <div className="text-gray-600 font-semibold">Automation Workflows</div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border-t-4 border-orange-600">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-800 mb-2">20+</div>
              <div className="text-gray-600 font-semibold">Client Integrations</div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Process Section */}
      <section className="py-16 bg-white scroll-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Process</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A proven methodology to deliver automation solutions that drive real business results
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl shadow-lg border border-blue-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">How We Work</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Understand & Analyze</h4>
                      <p className="text-gray-600 text-sm">Deep dive into your business processes to identify automation opportunities</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Design & Prototype</h4>
                      <p className="text-gray-600 text-sm">Create scalable solutions with clear ROI and measurable outcomes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Implement & Optimize</h4>
                      <p className="text-gray-600 text-sm">Deploy robust solutions with ongoing support and continuous improvement</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="relative">
                <img
                  src="/images/How we work.png"
                  alt="Our Process - How We Work"
                  className="w-full rounded-2xl shadow-2xl"
                  loading="lazy"
                  width="600"
                  height="200"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-transparent rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-blue-800 text-white scroll-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Why Choose Us?</h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              We bring a unique combination of technical expertise and business understanding to every project
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white bg-opacity-10 backdrop-blur-lg p-8 rounded-2xl hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105">
              <div className="mb-4">
                <img 
                  src="/images/business_analytics.png" 
                  alt="Results-Driven" 
                  className="w-full h-40 object-cover rounded-lg opacity-90"
                  loading="lazy"
                />
              </div>
              <h3 className="text-2xl font-bold mb-3">Results-Driven</h3>
              <p className="text-blue-100 leading-relaxed">
                Every solution is designed with measurable outcomes in mind. We focus on delivering tangible ROI through automation and efficiency improvements.
              </p>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-lg p-8 rounded-2xl hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105">
              <div className="mb-4">
                <img 
                  src="/images/Automation.png" 
                  alt="Fast & Reliable" 
                  className="w-full h-40 object-cover rounded-lg opacity-90"
                  loading="lazy"
                />
              </div>
              <h3 className="text-2xl font-bold mb-3">Fast & Reliable</h3>
              <p className="text-blue-100 leading-relaxed">
                Quick turnaround times without compromising quality. We understand the importance of meeting deadlines in business-critical projects.
              </p>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-lg p-8 rounded-2xl hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105">
              <div className="mb-4">
                <img 
                  src="/images/ai_artificial_intell_c522e573.jpg" 
                  alt="Innovative Solutions" 
                  className="w-full h-40 object-cover rounded-lg opacity-90"
                  loading="lazy"
                />
              </div>
              <h3 className="text-2xl font-bold mb-3">Innovative Solutions</h3>
              <p className="text-blue-100 leading-relaxed">
                Leveraging cutting-edge AI and automation technologies to solve complex business problems with elegant, scalable solutions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Expertise Section - Enhanced */}
      <section className="py-16 bg-white scroll-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">AI & LLM Expertise</h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            Specializing in AI automation, large language model (LLM) integration, GPT-4 workflows, intelligent data analytics, and enterprise AI system integrations
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-blue-100">
              <div className="mb-4">
                <img 
                  src="/images/AI Automation.png" 
                  alt="AI Automation & LLM Workflows" 
                  className="w-full h-48 object-cover rounded-lg"
                  loading="lazy"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">AI Automation & LLM Workflows</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Design and implement intelligent automation solutions using GPT-4, OpenAI, large language models (LLM), n8n, Make.com, and Zapier for next-generation AI-powered workflows
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>GPT-4 & LLM integration with AI agents</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>AI-powered workflow automation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>Machine learning process optimization</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>Natural language processing automation</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-purple-100">
              <div className="mb-4">
                <img 
                  src="/images/Move_from_Data_to_Decisions_version_1.png" 
                  alt="AI Data Analysis & Power BI" 
                  className="w-full h-48 object-cover rounded-lg"
                  loading="lazy"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">AI Data Analysis & Power BI</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Transform complex data into actionable insights using AI, machine learning, and LLM-powered analytics with advanced visualization dashboards
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">✓</span>
                  <span>AI-powered Power BI dashboard design</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">✓</span>
                  <span>LLM-driven KPI tracking & reporting</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">✓</span>
                  <span>Machine learning predictive analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">✓</span>
                  <span>Natural language data querying</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-green-100">
              <div className="mb-4">
                <img 
                  src="/images/Automation.png" 
                  alt="AI CRM & LLM System Integrations" 
                  className="w-full h-48 object-cover rounded-lg"
                  loading="lazy"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">AI CRM & LLM System Integrations</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Seamlessly connect business systems with AI-powered integrations. Leverage GPT-4 and LLM capabilities with Zoho CRM, HubSpot, and custom API integrations for intelligent automation
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>AI-powered CRM customization & automation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>LLM-enhanced third-party API integration</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Intelligent data migration & synchronization</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>AI agent-based workflow orchestration</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Ad: Content Top */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <AdPlacement position="content-top" />
      </div>

      {/* Skills Progress Bars Section */}
      <section className="py-16 bg-gray-50 scroll-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Technical Proficiency</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A comprehensive skill set across automation platforms, programming languages, and business tools
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Automation & AI</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-gray-700">n8n Workflow Automation</span>
                    <span className="font-semibold text-blue-600">95%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full animate-progress-95"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-gray-700">Make.com / Zapier</span>
                    <span className="font-semibold text-blue-600">90%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full animate-progress-90"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-gray-700">OpenAI GPT Integration</span>
                    <span className="font-semibold text-blue-600">92%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full animate-progress-92"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-gray-700">AI Agents & Chatbots</span>
                    <span className="font-semibold text-blue-600">88%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full animate-progress-88"></div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Data & Analytics</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-gray-700">Power BI Dashboards</span>
                    <span className="font-semibold text-purple-600">93%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full animate-progress-93"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-gray-700">Python Data Analysis</span>
                    <span className="font-semibold text-purple-600">85%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full animate-progress-85"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-gray-700">SQL & Database Management</span>
                    <span className="font-semibold text-purple-600">90%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full animate-progress-90"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-gray-700">Data Scraping & ETL</span>
                    <span className="font-semibold text-purple-600">87%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full animate-progress-87"></div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">CRM & Integrations</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-gray-700">Zoho CRM</span>
                    <span className="font-semibold text-green-600">94%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full animate-progress-94"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-gray-700">HubSpot</span>
                    <span className="font-semibold text-green-600">86%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full animate-progress-86"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-gray-700">REST API Integration</span>
                    <span className="font-semibold text-green-600">91%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full animate-progress-91"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-gray-700">Webhook & Event Systems</span>
                    <span className="font-semibold text-green-600">89%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full animate-progress-89"></div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Development</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-gray-700">React & TypeScript</span>
                    <span className="font-semibold text-orange-600">88%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full animate-progress-88"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-gray-700">.NET Core / C#</span>
                    <span className="font-semibold text-orange-600">85%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full animate-progress-85"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-gray-700">Laravel / PHP</span>
                    <span className="font-semibold text-orange-600">82%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full animate-progress-82"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-gray-700">Cloud Platforms (AWS/Azure)</span>
                    <span className="font-semibold text-orange-600">80%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full animate-progress-80"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Showcase Section */}
      <section className="py-16 bg-white scroll-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Service Solutions</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real-world solutions delivering measurable business impact for our clients
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Project 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100">
              <div className="h-48 overflow-hidden">
                <img 
                  src="/images/Move_from_Data_to_Decisions_version_1.png" 
                  alt="Sales Performance Dashboard" 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Sales Performance Dashboard</h3>
                <p className="text-gray-600 mb-4">Interactive Power BI dashboard tracking real-time KPIs, revenue trends, and team performance metrics</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">Power BI</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">SQL</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">DAX</span>
                </div>
              </div>
            </div>

            {/* Project 2 */}
            <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100">
              <div className="h-48 overflow-hidden">
                <img 
                  src="/images/ai_artificial_intell_c522e573.jpg" 
                  alt="AI Resume Screening System" 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">AI Resume Screening System</h3>
                <p className="text-gray-600 mb-4">Automated recruitment workflow using GPT-4 to analyze resumes and match candidates with job requirements</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">OpenAI</span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">n8n</span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">Zoho</span>
                </div>
              </div>
            </div>

            {/* Project 3 */}
            <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100">
              <div className="h-48 overflow-hidden">
                <img 
                  src="/images/technology_coding_pr_27f67dc5.jpg" 
                  alt="CRM Integration Platform" 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">CRM Integration Platform</h3>
                <p className="text-gray-600 mb-4">Unified integration connecting Zoho CRM with marketing tools, email platforms, and analytics services</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">Zoho CRM</span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">Make.com</span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">APIs</span>
                </div>
              </div>
            </div>

            {/* Project 4 */}
            <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100">
              <div className="h-48 overflow-hidden">
                <img 
                  src="/images/technology_coding_pr_27f67dc5.jpg" 
                  alt="Job Aggregation System" 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Job Aggregation System</h3>
                <p className="text-gray-600 mb-4">Multi-source job scraping platform aggregating 10,000+ jobs daily from LinkedIn, Indeed, and Glassdoor</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full">Python</span>
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full">Scrapy</span>
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full">PostgreSQL</span>
                </div>
              </div>
            </div>

            {/* Project 5 */}
            <div className="bg-gradient-to-br from-red-50 to-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100">
              <div className="h-48 overflow-hidden">
                <img 
                  src="/images/professional_busines_b4d6588a.jpg" 
                  alt="Email Marketing Automation" 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Email Marketing Automation</h3>
                <p className="text-gray-600 mb-4">Personalized email campaigns with AI-generated content and automated follow-up sequences</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full">n8n</span>
                  <span className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full">OpenAI</span>
                  <span className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full">SMTP</span>
                </div>
              </div>
            </div>

            {/* Project 6 */}
            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100">
              <div className="h-48 overflow-hidden">
                <img 
                  src="/images/professional_busines_b4d6588a1.jpg" 
                  alt="Lead Enrichment Pipeline" 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Lead Enrichment Pipeline</h3>
                <p className="text-gray-600 mb-4">Automated lead data enrichment using multiple APIs to enhance contact information and company details</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full">Zapier</span>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full">Clearbit</span>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full">HubSpot</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center mt-12">
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/workflows"
                className="inline-block bg-blue-600 text-white px-8 py-4 rounded-full hover:bg-blue-700 transform hover:scale-105 transition-all duration-300 font-semibold text-lg shadow-lg"
              >
                View All Workflows
              </Link>
              <Link
                to="/projects"
                className="inline-block bg-purple-600 text-white px-8 py-4 rounded-full hover:bg-purple-700 transform hover:scale-105 transition-all duration-300 font-semibold text-lg shadow-lg"
              >
                View All Projects
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links Section - All Pages */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50 scroll-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Explore Our Platform</h2>
            <p className="text-xl text-gray-600">Access tools, resources, and services to help your business grow</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              to="/workflows"
              className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 text-center"
            >
              <div className="text-4xl mb-3">⚙️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Workflows</h3>
              <p className="text-gray-600 text-sm">Automation templates and solutions</p>
            </Link>
            <Link
              to="/blog"
              className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 text-center"
            >
              <div className="text-4xl mb-3">📝</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Blog</h3>
              <p className="text-gray-600 text-sm">Latest insights and tutorials</p>
            </Link>
            <Link
              to="/blog"
              className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 text-center"
            >
              <div className="text-4xl mb-3">📚</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Blog & Tutorials</h3>
              <p className="text-gray-600 text-sm">Learn automation and BI skills</p>
            </Link>
            <Link
              to="/resources"
              className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 text-center"
            >
              <div className="text-4xl mb-3">🛠️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Resources</h3>
              <p className="text-gray-600 text-sm">Free tools and utilities</p>
            </Link>
            <Link
              to="/community/issues"
              className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 text-center"
            >
              <div className="text-4xl mb-3">💬</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Community</h3>
              <p className="text-gray-600 text-sm">Get help and share solutions</p>
            </Link>
            <Link
              to="/projects"
              className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 text-center"
            >
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Projects</h3>
              <p className="text-gray-600 text-sm">View our portfolio</p>
            </Link>
            <Link
              to="/about"
              className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 text-center"
            >
              <div className="text-4xl mb-3">ℹ️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">About</h3>
              <p className="text-gray-600 text-sm">Learn more about us</p>
            </Link>
            <Link
              to="/contact"
              className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 text-center"
            >
              <div className="text-4xl mb-3">📧</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Contact</h3>
              <p className="text-gray-600 text-sm">Get in touch with us</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Experience Timeline Section - Minimized */}
      <section className="py-16 bg-white scroll-animate">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our AI & Automation Experience</h2>
            <p className="text-xl text-gray-600">8+ years of delivering excellence in AI automation, LLM integration, and intelligent analytics solutions</p>
          </div>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-400 to-blue-600 hidden md:block"></div>
            
            {/* Timeline items */}
            <div className="space-y-12">
              {/* Item 1 - Right */}
              <div className="relative flex items-center justify-between md:justify-end">
                <div className="md:w-5/12"></div>
                <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-blue-600 rounded-full border-4 border-white shadow-lg hidden md:block"></div>
                <div className="md:w-5/12 bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <span className="text-blue-600 font-bold text-sm">2024 - Present</span>
                  <h3 className="text-xl font-bold text-gray-900 mt-2 mb-2">Senior AI Automation Specialist</h3>
                  <p className="text-gray-600 mb-3">Leading complex AI automation and LLM integration projects with GPT-4, OpenAI, and enterprise AI system implementations</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">GPT-4 Integration</span>
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">LLM Automation</span>
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">AI Power BI</span>
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">OpenAI N8N</span>
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">AI Agents</span>
                  </div>
                </div>
              </div>

              {/* Item 2 - Left */}
              <div className="relative flex items-center justify-between md:justify-start">
                <div className="md:w-5/12 bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <span className="text-purple-600 font-bold text-sm">2021 - 2023</span>
                  <h3 className="text-xl font-bold text-gray-900 mt-2 mb-2">Support Engineer </h3>
                  <p className="text-gray-600 mb-3">Application and infrastructure support for Riayati (MOHAP’s Health Information Exchange).

Ensured ITSM process adherence (request, incident, problem & change management).

Generated performance & downtime reports, conducted CAB meetings, and maintained SLA compliance.</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">Zoho Service Desk</span>
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">Riayati</span>
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">Power BI</span>
                  </div>
                </div>
                <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-purple-600 rounded-full border-4 border-white shadow-lg hidden md:block"></div>
                <div className="md:w-5/12"></div>
              </div>

              {/* Item 3 - Right */}
              <div className="relative flex items-center justify-between md:justify-end">
                <div className="md:w-5/12"></div>
                <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-green-600 rounded-full border-4 border-white shadow-lg hidden md:block"></div>
                <div className="md:w-5/12 bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <span className="text-green-600 font-bold text-sm">2017 - 2021</span>
                  <h3 className="text-xl font-bold text-gray-900 mt-2 mb-2">System Analyst & Automation Specialist</h3>
                  <p className="text-gray-600 mb-3">Built scalable web applications and RESTful APIs using React, Laravel,Python</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full">React</span>
                    <span className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full">Laravel</span>
                    <span className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full">Python</span>
                    <span className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full">Zoho Creator</span>
                  </div>
                </div>
              </div>

              {/* Item 4 - Left */}
              <div className="relative flex items-center justify-between md:justify-start">
                <div className="md:w-5/12 bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <span className="text-orange-600 font-bold text-sm">2016 - 2017</span>
                  <h3 className="text-xl font-bold text-gray-900 mt-2 mb-2">Software Developer</h3>
                  <p className="text-gray-600 mb-3">Started career building applications and learning automation tools and data analysis techniques</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-orange-50 text-orange-700 text-xs rounded-full">PHP</span>
                    <span className="px-3 py-1 bg-orange-50 text-orange-700 text-xs rounded-full">Python</span>
                  </div>
                </div>
                <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-orange-600 rounded-full border-4 border-white shadow-lg hidden md:block"></div>
                <div className="md:w-5/12"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section - Enhanced */}
      <section className="py-16 bg-white scroll-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">Our Services</h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            Comprehensive solutions to streamline your business operations and drive growth
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-blue-100">
              <div className="mb-4">
                <img 
                  src="/images/AI Automation.png" 
                  alt="AI Workflow Automation" 
                  className="w-full h-48 object-cover rounded-lg"
                  loading="lazy"
                />
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
                <img 
                  src="/images/Move_from_Data_to_Decisions_version_1.png" 
                  alt="AI Business Intelligence" 
                  className="w-full h-48 object-cover rounded-lg"
                  loading="lazy"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Business Intelligence</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Create interactive Power BI dashboards powered by AI and machine learning. Generate actionable insights using LLM-driven analytics, natural language processing, and AI-powered data visualization for intelligent, data-driven business decisions.
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
                <img 
                  src="/images/Automation.png" 
                  alt="AI System Integrations" 
                  className="w-full h-48 object-cover rounded-lg"
                  loading="lazy"
                />
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
                <img 
                  src="/images/Web_development.png" 
                  alt="AI-Powered Full-Stack Development" 
                  className="w-full h-48 object-cover rounded-lg"
                  loading="lazy"
                />
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
                <img 
                  src="/images/SEO.png" 
                  alt="AI-Powered SEO & Digital Marketing" 
                  className="w-full h-48 object-cover rounded-lg"
                  loading="lazy"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI-Powered SEO & Digital Marketing</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Improve your online visibility with AI-driven SEO solutions. Leverage LLM-powered content optimization, GPT-4 for keyword research, AI content strategy, intelligent technical SEO audits, and machine learning-based performance tracking.
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
                <img 
                  src="/images/professional_busines_b4d6588a1.jpg" 
                  alt="Content Marketing & SEO Writing" 
                  className="w-full h-48 object-cover rounded-lg"
                  loading="lazy"
                />
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
                <img 
                  src="/images/professional_busines_b4d6588a.jpg" 
                  alt="Link Building & Outreach" 
                  className="w-full h-48 object-cover rounded-lg"
                  loading="lazy"
                />
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
            <div className="bg-gradient-to-br from-rose-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-rose-100">
              <div className="mb-4">
                <img 
                  src="/images/professional_busines_b4d6588a1.jpg" 
                  alt="Social Media Marketing" 
                  className="w-full h-48 object-cover rounded-lg"
                  loading="lazy"
                />
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
                <img 
                  src="/images/Move_from_Data_to_Decisions_version_1.png" 
                  alt="AI Data Analytics & Intelligent Reporting" 
                  className="w-full h-48 object-cover rounded-lg"
                  loading="lazy"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Data Analytics & Intelligent Reporting</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Transform raw data into actionable insights using AI and machine learning. Leverage LLM-powered analytics, intelligent reporting, AI-driven KPI dashboards, and automated data processing pipelines with natural language query capabilities.
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

      {/* Fiverr Reviews Section */}
      <section className="py-16 bg-white scroll-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Client Reviews</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              What clients say about my Fiverr services
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Review 1 */}
            <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-green-100">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 mb-6 italic leading-relaxed">
                "Amazing customer support, hopped on a call twice to clarify and get all the details accordingly to our vision. Hoiyothaheem is one of our favorite Fiverr specialist, thanks for the outstanding work!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  JD
                </div>
                <div>
                  <div className="font-bold text-gray-900">mantaskarmaza</div>
                  <div className="text-sm text-gray-500">via Fiverr</div>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-green-100">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 mb-6 italic leading-relaxed">
                "Outstanding Power BI dashboard! The insights are clear and actionable. Highly recommend this seller."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  SM
                </div>
                <div>
                  <div className="font-bold text-gray-900">tomgibbons426</div>
                  <div className="text-sm text-gray-500">via Fiverr</div>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-green-100">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 mb-6 italic leading-relaxed">
                "Perfect CRM integration! Everything works seamlessly. Great communication throughout the project."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  RK
                </div>
                <div>
                  <div className="font-bold text-gray-900">masterbig</div>
                  <div className="text-sm text-gray-500">via Fiverr</div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center mt-12">
            <a
              href="https://www.fiverr.com/hoiyothaheem"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-green-600 hover:text-green-700 font-semibold text-lg"
            >
              Read More Reviews on Fiverr →
            </a>
          </div>
        </div>
      </section>

      {/* AI-Friendly FAQ Section */}
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

      {/* Contact Form Section */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-blue-800 text-white scroll-animate">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Let's Work Together</h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Have a project in mind? Send us a message and we'll get back to you within 24 hours
            </p>
          </div>
          
          {contactSubmitted ? (
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-12 text-center">
              <svg className="w-20 h-20 mx-auto mb-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-3xl font-bold mb-4">Thank You!</h3>
              <p className="text-xl text-blue-100">Your message has been received. I'll get back to you soon!</p>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold mb-2 text-blue-100">Your Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={contactForm.name}
                    onChange={handleContactChange}
                    className={`w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 border ${contactErrors.name ? 'border-red-400' : 'border-white border-opacity-30'} text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all`}
                    placeholder="John Doe"
                  />
                  {contactErrors.name && (
                    <p className="text-red-300 text-sm mt-1">{contactErrors.name}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold mb-2 text-blue-100">Your Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={contactForm.email}
                    onChange={handleContactChange}
                    className={`w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 border ${contactErrors.email ? 'border-red-400' : 'border-white border-opacity-30'} text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all`}
                    placeholder="john@example.com"
                  />
                  {contactErrors.email && (
                    <p className="text-red-300 text-sm mt-1">{contactErrors.email}</p>
                  )}
                </div>
              </div>
              <div className="mb-6">
                <label htmlFor="subject" className="block text-sm font-semibold mb-2 text-blue-100">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={contactForm.subject}
                  onChange={handleContactChange}
                  className={`w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 border ${contactErrors.subject ? 'border-red-400' : 'border-white border-opacity-30'} text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all`}
                  placeholder="Project Inquiry"
                />
                {contactErrors.subject && (
                  <p className="text-red-300 text-sm mt-1">{contactErrors.subject}</p>
                )}
              </div>
              <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-semibold mb-2 text-blue-100">Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={contactForm.message}
                  onChange={handleContactChange}
                  rows={6}
                  className={`w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 border ${contactErrors.message ? 'border-red-400' : 'border-white border-opacity-30'} text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all resize-none`}
                  placeholder="Tell me about your project..."
                ></textarea>
                {contactErrors.message && (
                  <p className="text-red-300 text-sm mt-1">{contactErrors.message}</p>
                )}
              </div>
              {contactErrors.submit && (
                <div className="mb-4 p-4 bg-red-500 bg-opacity-20 border border-red-400 text-red-200 rounded-lg">
                  {contactErrors.submit}
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-white text-blue-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-50 transform hover:scale-105 transition-all duration-300 shadow-lg"
              >
                Send Message
              </button>
            </form>
          )}
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
