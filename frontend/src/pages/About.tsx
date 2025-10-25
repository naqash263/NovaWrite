import { useSEO } from '../utils/seo';
import { useHomeSettings } from '../hooks/useHomeSettings';

export default function About() {
  const { getImageUrl } = useHomeSettings();
  
  useSEO({
    title: 'About | Naqash Thaheem',
    description: 'AI Automation Specialist | CRM Integrations | Power BI | OpenAI | Make.com | n8n with 8+ years of experience in building AI-powered automation workflows, CRM integrations, and scalable web platforms.',
  });

  return (
    <div className="bg-gray-50">
      {/* Hero Section with AI Image */}
      <div 
        className="relative bg-cover bg-center py-20 mb-16"
        style={{
          backgroundImage: `linear-gradient(rgba(37, 99, 235, 0.9), rgba(30, 64, 175, 0.9)), url('${getImageUrl('about_image', '/images/ai_artificial_intell_c522e573.jpg')}')`
        }}
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-white mb-4">About Me</h1>
          <p className="text-xl text-blue-100">Transforming Business Through Intelligent Automation</p>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">

        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Professional Summary</h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            Systems Analyst and Automation Specialist with 8+ years of experience in building AI-powered automation workflows, CRM integrations, and scalable web platforms. Proven expertise in data scraping, processing, and enrichment for recruitment and business intelligence. Skilled at designing databases, developing backend/frontend applications, and leading cross-functional teams to deliver high-impact digital solutions. Strong focus on efficiency, compliance (GDPR/CCPA), and cloud security.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Core Skills</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-blue-600 mb-2">Automation & AI</h3>
              <p className="text-gray-700 text-sm">n8n, Make.com, Zapier, OpenAI (GPT models), AI Agents, OCR, Embeddings, Pinecone, pgVector</p>
            </div>
            <div>
              <h3 className="font-semibold text-blue-600 mb-2">Data Analysis & Power BI</h3>
              <p className="text-gray-700 text-sm">Power BI Dashboard Design, DAX Formulas, Data Modeling, KPI Tracking, Predictive Analytics, Report Automation, Excel Power Query, SQL Analytics</p>
            </div>
            <div>
              <h3 className="font-semibold text-blue-600 mb-2">CRM & Integrations</h3>
              <p className="text-gray-700 text-sm">Zoho CRM, HubSpot, LinkedIn Recruiter, Zoho Creator, Wrike, Salesforce</p>
            </div>
            <div>
              <h3 className="font-semibold text-blue-600 mb-2">Web & App Development</h3>
              <p className="text-gray-700 text-sm">React.js, Vite, .NET Core, Django, Flutter, Supabase, Laravel, Node.js</p>
            </div>
            <div>
              <h3 className="font-semibold text-blue-600 mb-2">Databases & Cloud</h3>
              <p className="text-gray-700 text-sm">Azure MySQL, PostgreSQL, Firestore, Supabase, SharePoint/OneDrive Migration, Cloudflare, Microsoft 365, AWS</p>
            </div>
            <div>
              <h3 className="font-semibold text-blue-600 mb-2">Data Scraping & Processing</h3>
              <p className="text-gray-700 text-sm">Octoparse, Apify, Jobin, Zyte API, Custom parsing (LinkedIn, Indeed, Stepstone, Xing), BeautifulSoup, Selenium</p>
            </div>
          </div>
        </div>

        {/* Featured Projects Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Projects</h2>
          <div className="space-y-6">
            <div className="border-l-4 border-blue-600 pl-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">📊 Recruitment Analytics Dashboard (Power BI)</h3>
              <p className="text-gray-700 mb-3">
                Developed comprehensive Power BI dashboard for talent acquisition tracking with real-time metrics on candidate pipeline, source effectiveness, time-to-hire, and diversity analytics. Integrated with Azure SQL database and automated daily refreshes.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">Power BI</span>
                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">DAX</span>
                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">Azure SQL</span>
                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">Dataflows</span>
              </div>
            </div>

            <div className="border-l-4 border-blue-600 pl-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">🤖 AI Resume Parser & Matching System</h3>
              <p className="text-gray-700 mb-3">
                Built intelligent system to automatically parse resumes, extract skills, experience, and qualifications using GPT-4, then match candidates to job openings with similarity scoring. Integrated with CRM for automated candidate ranking.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">OpenAI GPT-4</span>
                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">n8n</span>
                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">Embeddings</span>
                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">Zoho CRM</span>
              </div>
            </div>

            <div className="border-l-4 border-blue-600 pl-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">🔗 Multi-Platform Job Aggregation Pipeline</h3>
              <p className="text-gray-700 mb-3">
                Created automated pipeline to scrape and aggregate job postings from 15+ sources including LinkedIn, Indeed, and Glassdoor. Processes 10,000+ jobs daily with deduplication, data normalization, and enrichment with company data.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">Apify</span>
                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">Python</span>
                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">PostgreSQL</span>
                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">Azure</span>
              </div>
            </div>

            <div className="border-l-4 border-blue-600 pl-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">💻 TFT Recruitment Platform</h3>
              <p className="text-gray-700 mb-3">
                Full-stack recruitment platform with AI-powered talent-job matching, credit-based system, automated workflows, and comprehensive dashboards. Handles end-to-end recruitment process from sourcing to placement tracking.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">React</span>
                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">.NET Core</span>
                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">MySQL</span>
                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">Power BI</span>
              </div>
            </div>

            <div className="border-l-4 border-blue-600 pl-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">📈 Sales Performance Dashboard Suite</h3>
              <p className="text-gray-700 mb-3">
                Designed interactive Power BI dashboards for sales team with territory analysis, revenue forecasting, product performance metrics, and customer segmentation. Includes automated email distribution and mobile optimization.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">Power BI</span>
                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">Power Automate</span>
                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">Excel</span>
                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">SharePoint</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Professional Experience</h2>
          
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Chief Data Officer – Talent For The Team</h3>
            <p className="text-gray-600 mb-2">2025 – Present</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Leading data-driven recruitment platform development combining AI job-talent matchmaking, CRM automation, and credit-based engagement system</li>
              <li>Architected TFT Platform with React (frontend), .NET Core (backend), and MySQL (Azure)</li>
              <li>Designed and implemented matching algorithms using embeddings + similarity search</li>
              <li>Built dashboards in Power BI to track KPIs</li>
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Systems Analyst – Private Company, UAE</h3>
            <p className="text-gray-600 mb-2">2016 – Present</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Automated office operations, workflows, and client systems, reducing costs and improving efficiency</li>
              <li>Implemented Zoho CRM + Make.com integrations for recruitment workflows</li>
              <li>Developed custom dashboards and compliance pipelines</li>
              <li>Built n8n-powered workflows for automation</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900">Freelance Automation & AI Developer</h3>
            <p className="text-gray-600 mb-2">Ongoing</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Delivered n8n-based automation projects including Facebook API posting, LinkedIn scraping pipelines</li>
              <li>Built AI chatbot workflows with memory & embeddings</li>
              <li>Developed Zoho CRM Talents Module for recruitment companies</li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Education & Languages</h2>
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900">Master's in Information Technology</h3>
            <p className="text-gray-600">Institute of Southern Punjab, Multan, Pakistan (2012 – 2014)</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Languages</h3>
            <p className="text-gray-700">English (Fluent), Urdu (Fluent), Hindi (Fluent)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
