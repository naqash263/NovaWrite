import { useSEO } from '../utils/seo';

export default function Workflows() {
  useSEO({
    title: 'Automation Workflows | Naqash Thaheem',
    description: 'Explore automation workflow examples including AI agents, CRM integrations, data processing pipelines, and business process automation.',
  });

  const workflows = [
    {
      title: 'AI-Powered Resume Screening',
      description: 'Automated candidate evaluation system using GPT-4 to analyze resumes, extract key information, match job requirements, and rank candidates based on skills and experience.',
      tools: ['n8n', 'OpenAI GPT-4', 'Zoho CRM', 'PostgreSQL'],
      benefits: ['90% time reduction', 'Consistent evaluation', 'Bias elimination'],
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: 'Multi-Channel Lead Enrichment',
      description: 'Automatically enrich lead data from LinkedIn, company websites, and databases. Extract contact details, company information, and social profiles, then update CRM with enriched data.',
      tools: ['Make.com', 'Apify', 'LinkedIn API', 'HubSpot'],
      benefits: ['500+ leads/day', 'Real-time updates', 'Data accuracy 95%'],
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      title: 'Automated Invoice Processing',
      description: 'Extract data from invoice PDFs using OCR, validate information, categorize expenses, and automatically create entries in accounting system with email notifications.',
      tools: ['n8n', 'Google Vision API', 'Zoho Books', 'Gmail'],
      benefits: ['24/7 processing', 'Zero manual entry', 'Instant validation'],
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
        </svg>
      )
    },
    {
      title: 'Job Board Data Aggregation',
      description: 'Scrape job postings from multiple sources (LinkedIn, Indeed, Glassdoor), deduplicate listings, normalize data format, and populate recruitment database with structured information.',
      tools: ['Apify', 'Octoparse', 'Python', 'Azure MySQL'],
      benefits: ['10k+ jobs daily', 'Multi-source', 'Real-time sync'],
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      title: 'Email Campaign Personalization',
      description: 'Generate personalized email content using AI based on recipient profile, industry, and behavior. Automatically schedule sends at optimal times and track engagement metrics.',
      tools: ['Zapier', 'OpenAI', 'Mailchimp', 'Google Sheets'],
      benefits: ['3x open rate', 'Personalized at scale', 'Smart timing'],
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      title: 'Document Generation & Approval',
      description: 'Auto-generate contracts, proposals, and reports from templates with dynamic data population. Route for approvals, collect e-signatures, and store in cloud with version control.',
      tools: ['n8n', 'Zoho Creator', 'DocuSign', 'OneDrive'],
      benefits: ['Instant generation', 'Automated routing', 'Compliance tracking'],
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <div 
        className="relative bg-cover bg-center py-20 mb-16"
        style={{
          backgroundImage: `linear-gradient(rgba(37, 99, 235, 0.9), rgba(30, 64, 175, 0.9)), url('/images/ai_artificial_intell_c522e573.jpg')`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-white mb-4">Automation Workflows</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Real-world examples of intelligent automation solutions that streamline operations, eliminate repetitive tasks, and drive business efficiency
          </p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Workflows Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {workflows.map((workflow, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-8 hover:shadow-xl transition-shadow">
              <div className="text-blue-600 mb-4">
                {workflow.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{workflow.title}</h3>
              <p className="text-gray-600 mb-6">{workflow.description}</p>
              
              {/* Tools Used */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Tools & Technologies:</h4>
                <div className="flex flex-wrap gap-2">
                  {workflow.tools.map((tool, idx) => (
                    <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Benefits */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Benefits:</h4>
                <ul className="space-y-1">
                  {workflow.benefits.map((benefit, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-blue-600 rounded-lg p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Automate Your Business?</h2>
          <p className="text-xl mb-6 text-blue-100">
            Let's discuss how custom automation workflows can transform your operations
          </p>
          <a
            href="/contact"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
          >
            Get Started
          </a>
        </div>
      </div>
    </div>
  );
}
