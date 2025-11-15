import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/axios';
import { PostCard } from '../components/PostCard';
import AdPlacement from '../components/AdPlacement';
// Removed LazyImage for faster image loading
import { useSEO } from '../utils/seo';
import { generateAISearchSchema, generateKnowledgeGraphSchema, generateFAQSchema, injectAISearchOptimizations } from '../utils/aiSearchOptimization';

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
    title: 'Naqash Thaheem - Global AI Automation Expert & Systems Analyst',
    description: 'Global AI automation specialist offering workflow automation, CRM integration, Power BI dashboards, and business intelligence solutions worldwide. 8+ years experience with n8n, Make.com, OpenAI, and Zoho CRM. Remote services available.',
    image: '/images/professional_busines_b4d6588a.jpg',
    url: '/',
    keywords: ['AI automation expert', 'global automation specialist', 'workflow automation consultant', 'CRM integration expert', 'Power BI consultant', 'business intelligence specialist', 'n8n automation expert', 'Make.com specialist', 'OpenAI integration', 'Zoho CRM expert', 'remote automation services', 'international consultant'],
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
            {/* Profile Image with enhanced animation */}
            <div className="mb-8 transform hover:scale-105 transition-transform duration-300">
              <img
                src={getImageUrl('profile_image', '/images/professional_busines_b4d6588a.jpg')} 
                alt={getSettingValue('profile_alt_text', 'Naqash Thaheem')}
                className="w-40 h-40 md:w-48 md:h-48 rounded-full mx-auto border-4 border-white shadow-2xl object-cover ring-4 ring-blue-300 ring-opacity-50"
                loading="eager"
              />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white">
              {getSettingValue('hero_title', 'Naqash Thaheem')}
            </h1>
            
            <p className="text-2xl md:text-3xl mb-4 text-blue-50 font-semibold">
              {getSettingValue('hero_subtitle', 'Systems Analyst & Automation Specialist')}
            </p>
            
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              Global AI automation specialist transforming businesses worldwide through intelligent workflows, CRM integrations, and data-driven insights. Specializing in n8n, Make.com, OpenAI, Power BI, and Zoho CRM solutions. Remote services available globally.
            </p>
            
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
              <Link
                to="/contact"
                className="bg-white text-blue-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-50 hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                Get In Touch
              </Link>
            </div>

            {/* Social Media Links */}
            <div className="flex gap-6 justify-center">
              <a 
                href="https://linkedin.com/in/naqash-thaheem" 
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

      {/* Video Introduction Section */}
      <section className="py-16 bg-white scroll-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Professional Background</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Learn about my journey in automation, systems analysis, and business intelligence
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl shadow-lg border border-blue-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">My Approach</h3>
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
                  src="/images/business_analytics_d_948bb4c2.jpg"
                  alt="Business Analytics and Automation"
                  className="w-full rounded-2xl shadow-2xl"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-transparent rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Me Section */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-blue-800 text-white scroll-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Why Choose Me?</h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              I bring a unique combination of technical expertise and business understanding to every project
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white bg-opacity-10 backdrop-blur-lg p-8 rounded-2xl hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold mb-3">Results-Driven</h3>
              <p className="text-blue-100 leading-relaxed">
                Every solution is designed with measurable outcomes in mind. I focus on delivering tangible ROI through automation and efficiency improvements.
              </p>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-lg p-8 rounded-2xl hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105">
              <div className="text-5xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold mb-3">Fast & Reliable</h3>
              <p className="text-blue-100 leading-relaxed">
                Quick turnaround times without compromising quality. I understand the importance of meeting deadlines in business-critical projects.
              </p>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-lg p-8 rounded-2xl hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105">
              <div className="text-5xl mb-4">💡</div>
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
          <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">Core Expertise</h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            Specializing in intelligent automation, data analytics, and enterprise system integrations
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-blue-100">
              <div className="text-blue-600 mb-4">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">AI Automation & Workflows</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Design and implement intelligent automation solutions using n8n, Make.com, Zapier, and OpenAI models
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>GPT-4 integration & AI agents</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>Custom workflow automation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>Process optimization</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-purple-100">
              <div className="text-purple-600 mb-4">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Data Analysis & Power BI</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Transform complex data into actionable insights with advanced analytics and visualization dashboards
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">✓</span>
                  <span>Power BI dashboard design</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">✓</span>
                  <span>KPI tracking & reporting</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">✓</span>
                  <span>Predictive analytics</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-green-100">
              <div className="text-green-600 mb-4">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">CRM & System Integrations</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Seamlessly connect business systems with Zoho CRM, HubSpot, and custom API integrations
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>CRM customization & automation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Third-party API integration</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Data migration & synchronization</span>
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

      {/* Portfolio Showcase Section */}
      <section className="py-16 bg-white scroll-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Projects</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real-world solutions delivering measurable business impact
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Project 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100">
              <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
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
              <div className="h-48 bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
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
              <div className="h-48 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
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
              <div className="h-48 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
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
              <div className="h-48 bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
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
              <div className="h-48 bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center">
                <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
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
            <Link
              to="/workflows"
              className="inline-block bg-blue-600 text-white px-8 py-4 rounded-full hover:bg-blue-700 transform hover:scale-105 transition-all duration-300 font-semibold text-lg shadow-lg"
            >
              View All Projects
            </Link>
          </div>
        </div>
      </section>

      {/* Experience Timeline Section */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50 scroll-animate">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Professional Journey</h2>
            <p className="text-xl text-gray-600">8+ years of delivering excellence in automation and analytics</p>
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
                  <h3 className="text-xl font-bold text-gray-900 mt-2 mb-2">Senior Automation Specialist</h3>
                  <p className="text-gray-600 mb-3">Leading complex automation projects with AI integration and enterprise system implementations</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">AI Integration</span>
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">Power BI</span>
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">N8N</span>
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">Make.com</span>
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">Vibe Code</span>
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
          <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">What I Offer</h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            Comprehensive solutions to streamline your business operations and drive growth
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-blue-100">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Workflow Automation</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Automate repetitive tasks, streamline business processes, and reduce manual errors with intelligent workflow solutions tailored to your needs.
              </p>
              <Link to="/workflows" className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-2 group">
                View Automation Examples 
                <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-purple-100">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Business Intelligence</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Create interactive Power BI dashboards, generate actionable insights, and make data-driven decisions with comprehensive analytics solutions.
              </p>
              <Link to="/about" className="text-purple-600 hover:text-purple-700 font-semibold inline-flex items-center gap-2 group">
                Learn More 
                <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-green-100">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">System Integrations</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Connect your CRM, marketing tools, databases, and third-party services into a unified ecosystem that works seamlessly together.
              </p>
              <Link to="/about" className="text-green-600 hover:text-green-700 font-semibold inline-flex items-center gap-2 group">
                View Projects 
                <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-orange-100">
              <div className="text-4xl mb-4">💻</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Full-Stack Development</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Build scalable web applications, APIs, and custom software solutions using modern frameworks like React, .NET Core, and Laravel.
              </p>
              <Link to="/contact" className="text-orange-600 hover:text-orange-700 font-semibold inline-flex items-center gap-2 group">
                Start a Project 
                <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50 scroll-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Client Success Stories</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from businesses that transformed their operations with automation and analytics
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 mb-6 italic leading-relaxed">
                "Naqash transformed our sales process with an automated CRM workflow that saved us 20+ hours per week. The Power BI dashboard he built gives us real-time insights we never had before."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  AS
                </div>
                <div>
                  <div className="font-bold text-gray-900">Ahmed Saleh</div>
                  <div className="text-sm text-gray-500">Sales Director, Tech Solutions LLC</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 mb-6 italic leading-relaxed">
                "The AI-powered resume screening system cut our hiring time by 60%. Naqash's technical expertise and business understanding made the project a huge success."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  LK
                </div>
                <div>
                  <div className="font-bold text-gray-900">Lisa Khan</div>
                  <div className="text-sm text-gray-500">HR Manager, Global Enterprises</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 mb-6 italic leading-relaxed">
                "Professional, reliable, and incredibly skilled. The email automation system Naqash built increased our engagement rates by 45%. Highly recommend!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  MR
                </div>
                <div>
                  <div className="font-bold text-gray-900">Mohammed Rashid</div>
                  <div className="text-sm text-gray-500">Marketing Director, Digital Agency</div>
                </div>
              </div>
            </div>

            {/* Testimonial 4 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 mb-6 italic leading-relaxed">
                "The data scraping solution Naqash built for us processes 50,000+ records daily with 99.9% accuracy. It's been running flawlessly for 8 months now."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  SK
                </div>
                <div>
                  <div className="font-bold text-gray-900">Sarah Kim</div>
                  <div className="text-sm text-gray-500">Data Manager, TechCorp Solutions</div>
                </div>
              </div>
            </div>

            {/* Testimonial 5 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 mb-6 italic leading-relaxed">
                "Outstanding technical expertise and communication. The Power BI dashboard Naqash created gives us insights we never had before. ROI was achieved in just 2 weeks."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  DA
                </div>
                <div>
                  <div className="font-bold text-gray-900">David Anderson</div>
                  <div className="text-sm text-gray-500">CEO, Analytics Pro</div>
                </div>
              </div>
            </div>

            {/* Testimonial 6 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 mb-6 italic leading-relaxed">
                "Naqash's automation solutions saved us 30+ hours per week. The n8n workflows he built are robust and easy to maintain. Highly recommended!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  EM
                </div>
                <div>
                  <div className="font-bold text-gray-900">Emma Martinez</div>
                  <div className="text-sm text-gray-500">Operations Director, FlowTech</div>
                </div>
              </div>
            </div>
          </div>

          {/* Client Logos Section */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Trusted by Leading Companies</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center opacity-60">
              <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-center h-16">
                <span className="text-gray-600 font-semibold text-sm">TechCorp</span>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-center h-16">
                <span className="text-gray-600 font-semibold text-sm">Analytics Pro</span>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-center h-16">
                <span className="text-gray-600 font-semibold text-sm">FlowTech</span>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-center h-16">
                <span className="text-gray-600 font-semibold text-sm">DataFlow</span>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-center h-16">
                <span className="text-gray-600 font-semibold text-sm">AutoSys</span>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-center h-16">
                <span className="text-gray-600 font-semibold text-sm">BI Solutions</span>
              </div>
            </div>
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

      {/* Contact Form Section */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-blue-800 text-white scroll-animate">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Let's Work Together</h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Have a project in mind? Send me a message and I'll get back to you within 24 hours
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
    </div>
  );
}
