import { useState, useEffect } from 'react';
import { useSEO } from '../utils/seo';
import apiClient from '../api/axios';
import { useHomeSettings } from '../hooks/useHomeSettings';
import { generateBreadcrumbSchema, generateFAQSchema, injectStructuredData } from '../utils/structuredData';

export default function Contact() {
  const { getImageUrl } = useHomeSettings();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  useSEO({
    title: 'Contact Naqash Thaheem - Free Consultation | AI Automation Expert',
    description: 'Get in touch with Naqash Thaheem for AI automation, CRM integration, Power BI dashboards, and business intelligence projects. Get a free consultation for your automation needs. Remote services available worldwide.',
    keywords: ['contact Naqash Thaheem', 'AI automation consultation', 'CRM integration services', 'Power BI development', 'business intelligence consulting', 'workflow automation expert', 'automation project quote', 'remote automation services', 'n8n consultant', 'Make.com specialist', 'Zoho CRM expert', 'free consultation', 'automation expert contact'],
    url: '/contact',
    structuredData: 'custom',
    customStructuredData: {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "name": "Contact Naqash Thaheem - AI Automation Expert",
      "description": "Get in touch with Naqash Thaheem for AI automation, CRM integration, and business intelligence projects",
      "url": "https://naqashthaheem.com/contact",
      "mainEntity": {
        "@type": "Person",
        "name": "Naqash Thaheem",
        "jobTitle": "Systems Analyst & Automation Specialist",
        "email": "contact@naqashthaheem.com",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Ajman",
          "addressCountry": "AE"
        },
        "sameAs": [
          "https://linkedin.com/in/naqash-thaheem",
          "https://github.com/naqash-thaheem"
        ]
      }
    }
  });

  useEffect(() => {
    // Add breadcrumb schema
    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Home', url: 'https://naqashthaheem.com' },
      { name: 'Contact', url: 'https://naqashthaheem.com/contact' }
    ]);
    injectStructuredData(breadcrumbSchema);

    // Add FAQ schema for Contact page
    const faqSchema = generateFAQSchema([
      {
        question: 'How can I contact Naqash Thaheem for automation services?',
        answer: 'You can contact Naqash Thaheem via email at contact@naqashthaheem.com, through the contact form on this page, or via LinkedIn at linkedin.com/in/naqash-thaheem. He typically responds within 24 hours.'
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
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      const response = await apiClient.post('/contact', formData);
      setSubmitStatus({
        type: 'success',
        message: response.data.message
      });
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error: any) {
      setSubmitStatus({
        type: 'error',
        message: error.response?.data?.message || 'Something went wrong. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50">
      {/* Hero Section with Background Image */}
      <div 
        className="relative bg-cover bg-center py-20 mb-16"
        style={{
          backgroundImage: `linear-gradient(rgba(37, 99, 235, 0.9), rgba(30, 64, 175, 0.9)), url('${getImageUrl('contact_image', '/images/business_analytics_d_948bb4c2.jpg')}')`
        }}
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-white mb-4">Get In Touch</h1>
          <p className="text-xl text-blue-100">Let's discuss your next automation project</p>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">

        <div className="bg-white rounded-lg shadow-md p-8">
          <p className="text-gray-700 text-lg mb-8 text-center">
            I'm always interested in discussing new projects, automation opportunities, and innovative ideas.
            Feel free to reach out!
          </p>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                <a href="mailto:contact@naqashthaheem.com" className="text-blue-600 hover:underline">
                  contact@naqashthaheem.com
                </a>
              </div>
            </div>


            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Location</h3>
                <p className="text-gray-600">Ajman, United Arab Emirates</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
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

          <div className="mt-12 p-6 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Areas of Expertise</h3>
            <div className="flex flex-wrap gap-2">
              <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-700">AI Automation</span>
              <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-700">CRM Integration</span>
              <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-700">Data Processing</span>
              <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-700">Web Development</span>
              <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-700">Business Intelligence</span>
            </div>
          </div>

          {/* Contact Form */}
          <div className="mt-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Send a Message</h3>
            
            {submitStatus.type && (
              <div className={`p-4 rounded-lg mb-6 ${
                submitStatus.type === 'success' 
                  ? 'bg-green-100 border border-green-400 text-green-700'
                  : 'bg-red-100 border border-red-400 text-red-700'
              }`}>
                {submitStatus.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="What's this about?"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                  placeholder="Tell me about your project, questions, or how I can help..."
                  minLength={10}
                ></textarea>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        </div>
      </div>
    </div>
  );
}
