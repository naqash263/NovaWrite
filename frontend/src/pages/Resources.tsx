import { useSEO } from '../utils/seo';
import { generateBreadcrumbSchema, generateFAQSchema, injectStructuredData } from '../utils/structuredData';
import { useEffect } from 'react';

export default function Resources() {
  useSEO({
    title: 'Free Resources - Automation Tools & Templates | Naqash Thaheem',
    description: 'Free automation tools, templates, and guides for AI workflows, CRM integration, and business intelligence. Download ready-to-use solutions.',
    url: '/resources',
    keywords: ['free automation tools', 'CRM templates', 'Power BI templates', 'workflow guides', 'AI automation resources', 'business intelligence tools']
  });

  useEffect(() => {
    // Add breadcrumb structured data
    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Home', url: 'https://naqashthaheem.com/' },
      { name: 'Resources', url: 'https://naqashthaheem.com/resources' }
    ]);
    injectStructuredData(breadcrumbSchema);

    // Add FAQ structured data
    const faqSchema = generateFAQSchema([
      {
        question: "Are these resources completely free?",
        answer: "Yes, all the resources on this page are completely free to download and use. No registration or payment required."
      },
      {
        question: "Can I modify these templates for my business?",
        answer: "Absolutely! All templates are provided with source files and can be customized to fit your specific business needs."
      },
      {
        question: "Do you provide support for these resources?",
        answer: "Basic support is available through our contact form. For extensive customization, we offer paid consulting services."
      }
    ]);
    injectStructuredData(faqSchema);
  }, []);

  const tools = [
    {
      title: "Power BI Dashboard Template",
      description: "Complete Power BI template for sales performance tracking with pre-built KPIs, charts, and data connections.",
      category: "Business Intelligence",
      downloadCount: "2.3k",
      fileSize: "15.2 MB",
      features: ["Pre-built KPIs", "Interactive charts", "Data refresh automation", "Mobile responsive"],
      downloadUrl: "#",
      image: "/images/business_analytics_d_948bb4c2.jpg"
    },
    {
      title: "n8n Workflow Templates",
      description: "Collection of ready-to-use n8n workflows for common automation tasks including email marketing, data processing, and CRM integration.",
      category: "Automation",
      downloadCount: "1.8k",
      fileSize: "8.7 MB",
      features: ["Email automation", "CRM sync", "Data processing", "API integrations"],
      downloadUrl: "#",
      image: "/images/ai_artificial_intell_c522e573.jpg"
    },
    {
      title: "Zoho CRM Custom Fields Template",
      description: "Pre-configured custom fields and modules for Zoho CRM to streamline recruitment and sales processes.",
      category: "CRM Integration",
      downloadCount: "1.5k",
      fileSize: "3.1 MB",
      features: ["Custom modules", "Field mappings", "Validation rules", "Workflow triggers"],
      downloadUrl: "#",
      image: "/images/technology_coding_pr_27f67dc5.jpg"
    },
    {
      title: "Python Data Scraping Scripts",
      description: "Collection of Python scripts for web scraping, data extraction, and processing with error handling and rate limiting.",
      category: "Data Processing",
      downloadCount: "3.1k",
      fileSize: "12.4 MB",
      features: ["Web scraping", "Data cleaning", "Rate limiting", "Error handling"],
      downloadUrl: "#",
      image: "/images/modern_technology_ab_8cef6e70.jpg"
    },
    {
      title: "Email Marketing Automation Kit",
      description: "Complete email marketing automation setup with templates, sequences, and tracking for various business scenarios.",
      category: "Marketing",
      downloadCount: "2.7k",
      fileSize: "6.8 MB",
      features: ["Email templates", "Automation sequences", "A/B testing", "Analytics tracking"],
      downloadUrl: "#",
      image: "/images/professional_busines_b4d6588a.jpg"
    },
    {
      title: "API Integration Checklist",
      description: "Comprehensive checklist and documentation for integrating third-party APIs with proper error handling and security measures.",
      category: "Development",
      downloadCount: "1.9k",
      fileSize: "2.3 MB",
      features: ["Integration checklist", "Security guidelines", "Error handling", "Testing procedures"],
      downloadUrl: "#",
      image: "/images/technology_coding_pr_27f67dc5.jpg"
    }
  ];

  const guides = [
    {
      title: "Complete Guide to AI Automation",
      description: "Step-by-step guide to implementing AI-powered automation in your business processes.",
      readTime: "15 min read",
      difficulty: "Beginner",
      topics: ["AI basics", "Workflow design", "Implementation", "Best practices"]
    },
    {
      title: "Power BI Dashboard Creation",
      description: "Learn how to create professional Power BI dashboards from scratch with real-world examples.",
      readTime: "25 min read",
      difficulty: "Intermediate",
      topics: ["Data modeling", "Visualization", "DAX formulas", "Sharing & security"]
    },
    {
      title: "CRM Integration Best Practices",
      description: "Comprehensive guide to integrating and customizing CRM systems for maximum efficiency.",
      readTime: "20 min read",
      difficulty: "Intermediate",
      topics: ["API integration", "Data mapping", "Customization", "Testing"]
    },
    {
      title: "Data Scraping & Processing",
      description: "Complete tutorial on web scraping, data extraction, and processing using Python.",
      readTime: "30 min read",
      difficulty: "Advanced",
      topics: ["Web scraping", "Data cleaning", "Storage", "Legal considerations"]
    }
  ];

  return (
    <div className="bg-gray-50 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Free Resources</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Download ready-to-use automation tools, templates, and comprehensive guides to accelerate your business processes.
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
              No Registration Required
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Ready to Use
            </span>
          </div>
        </div>

        {/* Tools Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Free Tools & Templates</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tools.map((tool, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
                <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <img 
                    src={tool.image} 
                    alt={tool.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                      {tool.category}
                    </span>
                    <span className="text-sm text-gray-500">{tool.downloadCount} downloads</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{tool.title}</h3>
                  <p className="text-gray-600 mb-4">{tool.description}</p>
                  
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Features:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {tool.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{tool.fileSize}</span>
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                      Download Free
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Guides Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Comprehensive Guides</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {guides.map((guide, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                      {guide.difficulty}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                      {guide.readTime}
                    </span>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{guide.title}</h3>
                <p className="text-gray-600 mb-6">{guide.description}</p>
                
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Topics Covered:</h4>
                  <div className="flex flex-wrap gap-2">
                    {guide.topics.map((topic, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
                
                <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-semibold">
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
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Are these resources completely free?</h3>
              <p className="text-gray-600">
                Yes, all the resources on this page are completely free to download and use. No registration or payment required. 
                We believe in sharing knowledge to help the community grow.
              </p>
            </div>
            
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Can I modify these templates for my business?</h3>
              <p className="text-gray-600">
                Absolutely! All templates are provided with source files and can be customized to fit your specific business needs. 
                We encourage you to adapt them to your requirements.
              </p>
            </div>
            
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Do you provide support for these resources?</h3>
              <p className="text-gray-600">
                Basic support is available through our contact form. For extensive customization or implementation help, 
                we offer paid consulting services to ensure your success.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">How often are these resources updated?</h3>
              <p className="text-gray-600">
                We regularly update our resources to keep them current with the latest technologies and best practices. 
                Check back monthly for new additions and updates.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

