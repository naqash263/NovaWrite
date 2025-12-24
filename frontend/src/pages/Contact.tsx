import { useState, useEffect, useRef } from 'react';
import { useSEO } from '../utils/seo';
import apiClient from '../api/axios';
import { useHomeSettings } from '../hooks/useHomeSettings';
import { generateBreadcrumbSchema, generateFAQSchema, injectStructuredData } from '../utils/structuredData';
import AdPlacement from '../components/AdPlacement';

interface FormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  subject: string;
  message: string;
  inquiry_type: 'general' | 'consultation' | 'project' | 'partnership' | 'other';
  file_id: number | null;
}

interface FormErrors {
  [key: string]: string;
}

export default function Contact() {
  const { getImageUrl } = useHomeSettings();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    message: '',
    inquiry_type: 'general',
    file_id: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ id: number; name: string } | null>(null);
  const [charCount, setCharCount] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState<{
    inquiry_type?: string;
    suggestions?: string[];
    sentiment?: { sentiment: string; score: number };
    loading?: boolean;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_MESSAGE_LENGTH = 5000;
  const MIN_MESSAGE_LENGTH = 10;

  useSEO({
    title: 'Contact Naqash Thaheem - Free Consultation | AI Automation Expert',
    description: 'Get in touch with Naqash Thaheem for AI automation, CRM integration, Power BI dashboards, and business intelligence projects. Get a free consultation for your automation needs. Remote services available worldwide.',
    keywords: ['contact Naqash Thaheem', 'AI automation consultation', 'CRM integration services', 'Power BI development', 'business intelligence consulting', 'workflow automation expert', 'automation project quote', 'remote automation services', 'n8n consultant', 'Make.com specialist', 'Zoho CRM expert', 'free consultation', 'automation expert contact'],
    url: '/contact',
    image: 'https://naqashthaheem.com/images/business_analytics_d_948bb4c2.jpg',
    structuredData: 'custom',
    customStructuredData: {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "name": "Contact Naqash Thaheem - AI Automation Expert",
      "description": "Get in touch with Naqash Thaheem for AI automation, CRM integration, and business intelligence projects. Free consultation available.",
      "url": "https://naqashthaheem.com/contact",
      "image": "https://naqashthaheem.com/images/business_analytics_d_948bb4c2.jpg",
      "mainEntity": {
        "@type": "Person",
        "name": "Naqash Thaheem",
        "jobTitle": "Systems Analyst & Automation Specialist",
        "email": "contact@naqashthaheem.com",
        "telephone": "+971-XX-XXX-XXXX",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Ajman",
          "addressRegion": "Ajman",
          "addressCountry": "AE",
          "addressCountryName": "United Arab Emirates"
        },
        "sameAs": [
          "https://www.linkedin.com/in/naqash-thaheem-297464147",
          "https://github.com/naqash-thaheem"
        ],
        "knowsAbout": [
          "AI Automation",
          "CRM Integration",
          "Business Intelligence",
          "Workflow Automation",
          "Data Processing"
        ],
        "offers": {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "AI Automation Consultation",
            "description": "Free consultation for AI automation, CRM integration, and business intelligence projects"
          }
        }
      },
      "potentialAction": {
        "@type": "CommunicateAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://naqashthaheem.com/contact",
          "actionPlatform": [
            "http://schema.org/DesktopWebPlatform",
            "http://schema.org/MobileWebPlatform"
          ]
        },
        "result": {
          "@type": "Message",
          "name": "Contact Form Submission"
        }
      }
    }
  });

  useEffect(() => {
    // Load saved form data from localStorage
    const savedData = localStorage.getItem('contact_form_draft');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(prev => ({ ...prev, ...parsed }));
        setCharCount(parsed.message?.length || 0);
      } catch (e) {
        console.error('Failed to load saved form data:', e);
      }
    }

    // Add breadcrumb schema
    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Home', url: 'https://naqashthaheem.com' },
      { name: 'Contact', url: 'https://naqashthaheem.com/contact' }
    ]);
    injectStructuredData(breadcrumbSchema);

    // Add FAQ schema
    const faqSchema = generateFAQSchema([
      {
        question: 'How can I contact Naqash Thaheem for automation services?',
        answer: 'You can contact Naqash Thaheem via email at contact@naqashthaheem.com, through the contact form on this page, or via LinkedIn at www.linkedin.com/in/naqash-thaheem-297464147. He typically responds within 24 hours.'
      },
      {
        question: 'What is the typical response time for inquiries?',
        answer: 'Naqash Thaheem typically responds to all inquiries within 24 hours. For urgent projects, please mention it in your message for priority response.'
      },
      {
        question: 'Does Naqash provide free consultations?',
        answer: 'Yes, Naqash offers free initial consultations for all automation, CRM integration, and business intelligence projects. Contact him to discuss your specific needs and requirements.'
      },
      {
        question: 'Are the services available remotely?',
        answer: 'Yes, Naqash Thaheem provides remote automation services to clients worldwide including the US, UK, Canada, Australia, Germany, Netherlands, and Singapore.'
      }
    ]);
    injectStructuredData(faqSchema);

    // Add Open Graph and Twitter Card meta tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    const ogImage = document.querySelector('meta[property="og:image"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');
    const twitterCard = document.querySelector('meta[name="twitter:card"]');
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    const twitterImage = document.querySelector('meta[name="twitter:image"]');

    if (!ogTitle) {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:title');
      meta.content = 'Contact Naqash Thaheem - Free Consultation | AI Automation Expert';
      document.head.appendChild(meta);
    }
    if (!ogDescription) {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:description');
      meta.content = 'Get in touch with Naqash Thaheem for AI automation, CRM integration, Power BI dashboards, and business intelligence projects. Free consultation available.';
      document.head.appendChild(meta);
    }
    if (!ogImage) {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:image');
      meta.content = 'https://naqashthaheem.com/images/business_analytics_d_948bb4c2.jpg';
      document.head.appendChild(meta);
    }
    if (!ogUrl) {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:url');
      meta.content = 'https://naqashthaheem.com/contact';
      document.head.appendChild(meta);
    }
    if (!twitterCard) {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'twitter:card');
      meta.content = 'summary_large_image';
      document.head.appendChild(meta);
    }
    if (!twitterTitle) {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'twitter:title');
      meta.content = 'Contact Naqash Thaheem - AI Automation Expert';
      document.head.appendChild(meta);
    }
    if (!twitterDescription) {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'twitter:description');
      meta.content = 'Get in touch for AI automation, CRM integration, and business intelligence projects. Free consultation available.';
      document.head.appendChild(meta);
    }
    if (!twitterImage) {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'twitter:image');
      meta.content = 'https://naqashthaheem.com/images/business_analytics_d_948bb4c2.jpg';
      document.head.appendChild(meta);
    }
  }, []);

  // Auto-save form data to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.name || formData.email || formData.message) {
        localStorage.setItem('contact_form_draft', JSON.stringify(formData));
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData]);

  // Cleanup analysis timeout on unmount
  useEffect(() => {
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, []);

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return '';
      case 'subject':
        if (!value.trim()) return 'Subject is required';
        if (value.trim().length < 3) return 'Subject must be at least 3 characters';
        return '';
      case 'message':
        if (!value.trim()) return 'Message is required';
        if (value.trim().length < MIN_MESSAGE_LENGTH) return `Message must be at least ${MIN_MESSAGE_LENGTH} characters`;
        if (value.length > MAX_MESSAGE_LENGTH) return `Message must not exceed ${MAX_MESSAGE_LENGTH} characters`;
        return '';
      case 'phone':
        if (value && !/^[\d\s\-\+\(\)]+$/.test(value)) return 'Please enter a valid phone number';
        return '';
      default:
        return '';
    }
  };

  // AI-powered analysis
  const analyzeMessage = async (message: string, subject: string) => {
    if (message.length < 20) {
      setAiAnalysis(null);
      return;
    }

    setAiAnalysis(prev => ({ ...prev, loading: true }));

    try {
      const response = await apiClient.post('/contact/analyze', {
        message,
        subject,
      });

      if (response.data.success) {
        const data = response.data.data;
        setAiAnalysis({
          inquiry_type: data.inquiry_type,
          suggestions: data.suggestions || [],
          sentiment: data.sentiment,
          loading: false,
        });

        // Auto-update inquiry type if confidence is high
        if (data.confidence > 0.7 && data.inquiry_type !== formData.inquiry_type) {
          setFormData(prev => ({ ...prev, inquiry_type: data.inquiry_type as any }));
        }
      }
    } catch (error) {
      // Silently fail - AI is optional
      setAiAnalysis(prev => ({ ...prev, loading: false }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Update character count for message field
    if (name === 'message') {
      setCharCount(value.length);

      // Debounced AI analysis
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
      analysisTimeoutRef.current = setTimeout(() => {
        analyzeMessage(value, formData.subject);
      }, 1500);
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Real-time validation
    const error = validateField(name, value);
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, file: 'File size must be less than 10MB' }));
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, file: 'Please upload a PDF, image, or Word document' }));
      return;
    }

    setUploadingFile(true);
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.file;
      return newErrors;
    });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'document');

      const response = await apiClient.post('/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success && response.data.data) {
        setUploadedFile({
          id: response.data.data.id,
          name: response.data.data.name || file.name,
        });
        setFormData(prev => ({ ...prev, file_id: response.data.data.id }));
      }
    } catch (error: any) {
      setErrors(prev => ({
        ...prev,
        file: error.response?.data?.message || 'Failed to upload file. Please try again.',
      }));
    } finally {
      setUploadingFile(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setFormData(prev => ({ ...prev, file_id: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: FormErrors = {};
    Object.keys(formData).forEach(key => {
      if (key !== 'file_id' && key !== 'phone' && key !== 'company') {
        const error = validateField(key, formData[key as keyof FormData] as string);
        if (error) newErrors[key] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to first error
      const firstErrorField = Object.keys(newErrors)[0];
      const fieldElement = formRef.current?.querySelector(`[name="${firstErrorField}"]`);
      fieldElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      const response = await apiClient.post('/contact', formData);
      setSubmitStatus({
        type: 'success',
        message: response.data.message || 'Thank you for your message! I\'ll get back to you within 24 hours.'
      });
      
      // Clear form and localStorage
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        subject: '',
        message: '',
        inquiry_type: 'general',
        file_id: null,
      });
      setCharCount(0);
      setUploadedFile(null);
      setErrors({});
      localStorage.removeItem('contact_form_draft');
      
      // Scroll to success message
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error: any) {
      setSubmitStatus({
        type: 'error',
        message: error.response?.data?.message || error.response?.data?.errors?.[Object.keys(error.response.data.errors || {})[0]]?.[0] || 'Something went wrong. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Hero Section with Background Image */}
      <div 
        className="relative bg-cover bg-center py-20 mb-16 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(37, 99, 235, 0.9), rgba(30, 64, 175, 0.9)), url('${getImageUrl('contact_image', '/images/business_analytics_d_948bb4c2.jpg')}')`
        }}
      >
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 animate-fade-in">
            Get In Touch
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 animate-fade-in-delay">
            Let's discuss your next automation project
          </p>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Ad Placement - Top */}
        <AdPlacement position="content-top" className="mb-8" />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Contact Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-8 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4 group">
                  <div className="bg-blue-100 p-3 rounded-full group-hover:bg-blue-200 transition-colors">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                    <a href="mailto:contact@naqashthaheem.com" className="text-blue-600 hover:underline transition-colors">
                      contact@naqashthaheem.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="bg-blue-100 p-3 rounded-full group-hover:bg-blue-200 transition-colors">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Location</h3>
                    <p className="text-gray-600">Ajman, United Arab Emirates</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="bg-blue-100 p-3 rounded-full group-hover:bg-blue-200 transition-colors">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Professional Networks</h3>
                    <div className="space-y-1">
                      <p className="text-gray-600">LinkedIn / GitHub</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-3">Areas of Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {['AI Automation', 'CRM Integration', 'Data Processing', 'Web Development', 'Business Intelligence'].map((skill) => (
                    <span key={skill} className="bg-white px-3 py-1.5 rounded-full text-sm text-gray-700 font-medium shadow-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Ad Placement - Sidebar */}
              <div className="mt-8">
                <AdPlacement position="sidebar" />
              </div>
            </div>
          </div>

          {/* Right Side - Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Send a Message</h2>
                <p className="text-gray-600">
                  I'm always interested in discussing new projects, automation opportunities, and innovative ideas.
                  Feel free to reach out!
                </p>
              </div>
              
              {submitStatus.type && (
                <div className={`p-4 rounded-lg mb-6 animate-fade-in ${
                  submitStatus.type === 'success' 
                    ? 'bg-green-50 border-2 border-green-200 text-green-800'
                    : 'bg-red-50 border-2 border-red-200 text-red-800'
                }`}>
                  <div className="flex items-center gap-2">
                    {submitStatus.type === 'success' ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                    <p className="font-medium">{submitStatus.message}</p>
                  </div>
                </div>
              )}

              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      autoComplete="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                        errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter your full name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600 animate-fade-in">{errors.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                        errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="your.email@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600 animate-fade-in">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      autoComplete="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                        errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="+1 (555) 123-4567"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600 animate-fade-in">{errors.phone}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="company" className="block text-sm font-semibold text-gray-700 mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Your company name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="inquiry_type" className="block text-sm font-semibold text-gray-700 mb-2">
                    Inquiry Type
                    {aiAnalysis?.inquiry_type && (
                      <span className="ml-2 text-xs text-blue-600 font-normal">
                        (AI detected: {aiAnalysis.inquiry_type.replace('_', ' ')})
                      </span>
                    )}
                  </label>
                  <select
                    id="inquiry_type"
                    name="inquiry_type"
                    value={formData.inquiry_type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="consultation">Free Consultation</option>
                    <option value="project">Project Discussion</option>
                    <option value="partnership">Partnership Opportunity</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      errors.subject ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="What's this about?"
                  />
                  {errors.subject && (
                    <p className="mt-1 text-sm text-red-600 animate-fade-in">{errors.subject}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                    Message <span className="text-red-500">*</span>
                    {aiAnalysis?.loading && (
                      <span className="ml-2 text-xs text-blue-600 font-normal">
                        <span className="inline-block animate-spin mr-1">⟳</span>
                        AI analyzing...
                      </span>
                    )}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={8}
                    value={formData.message}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none ${
                      errors.message ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Tell me about your project, questions, or how I can help..."
                    minLength={MIN_MESSAGE_LENGTH}
                    maxLength={MAX_MESSAGE_LENGTH}
                  ></textarea>
                  <div className="flex justify-between items-center mt-2">
                    <div>
                      {errors.message && (
                        <p className="text-sm text-red-600 animate-fade-in">{errors.message}</p>
                      )}
                      {aiAnalysis?.suggestions && aiAnalysis.suggestions.length > 0 && (
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs font-semibold text-blue-900 mb-1">💡 AI Suggestions:</p>
                          <ul className="text-xs text-blue-800 space-y-1">
                            {aiAnalysis.suggestions.map((suggestion, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-blue-600 mt-0.5">•</span>
                                <span>{suggestion}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <p className={`text-sm ${
                      charCount > MAX_MESSAGE_LENGTH 
                        ? 'text-red-600' 
                        : charCount > MAX_MESSAGE_LENGTH * 0.9 
                        ? 'text-yellow-600' 
                        : 'text-gray-500'
                    }`}>
                      {charCount} / {MAX_MESSAGE_LENGTH}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Attach File (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
                    {uploadedFile ? (
                      <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                          <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">{uploadedFile.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={removeFile}
                          className="text-red-600 hover:text-red-700 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <input
                          ref={fileInputRef}
                          type="file"
                          id="file"
                          name="file"
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          className="hidden"
                        />
                        <label
                          htmlFor="file"
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">
                            {uploadingFile ? 'Uploading...' : 'Click to upload or drag and drop'}
                          </span>
                          <span className="text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG (Max 10MB)</span>
                        </label>
                      </div>
                    )}
                    {errors.file && (
                      <p className="mt-2 text-sm text-red-600 text-center animate-fade-in">{errors.file}</p>
                    )}
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-transform"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Ad Placement - Bottom */}
            <div className="mt-8">
              <AdPlacement position="content-bottom" />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-fade-in-delay {
          animation: fade-in 0.5s ease-out 0.2s both;
        }
      `}</style>
    </div>
  );
}
