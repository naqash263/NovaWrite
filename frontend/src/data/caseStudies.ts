// Portfolio case studies. Content follows the recommended case-study structure:
// overview → context → problem → objectives → role → solution → architecture → stack →
// project management → challenges → testing → result. Sections are optional so that
// nothing is published without a real source. Never add estimated metrics here.

export interface CaseStudySection {
  heading: string;
  body?: string[];
  list?: string[];
}

export interface CaseStudy {
  slug: string;
  number: string;
  name: string;
  tagline: string;
  industry: string;
  location?: string;
  role?: string;
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  summary: string;
  overview: string[];
  problem?: string[];
  objectives?: string[];
  responsibilities?: string[];
  components?: { heading: string; items: string[] };
  workflow?: { heading: string; steps: string[] };
  stack: string[];
  sections: CaseStudySection[];
  outcome: string[];
  services: string[]; // service slugs this case study demonstrates
}

export const caseStudies: CaseStudy[] = [
  {
    slug: 'cloudpos4u-restaurant-pos-saas',
    number: '01',
    name: 'CloudPOS4U',
    tagline: 'Restaurant POS SaaS platform: product, QA automation & release validation',
    industry: 'Restaurant Technology / SaaS',
    role: 'Product planning, QA strategy & test automation',
    featured: true,
    seoTitle: 'CloudPOS4U Case Study: Restaurant POS SaaS & QA Automation',
    seoDescription:
      'How a cloud restaurant POS platform gained a repeatable QA process: Selenium and Pytest automation with Page Objects, API testing, and release validation.',
    keywords: ['restaurant POS SaaS', 'POS QA automation', 'Selenium Page Object Model', 'Pytest API testing', 'CloudPOS4U'],
    summary:
      'A cloud-based restaurant Point-of-Sale platform combining a SaaS environment with an Electron-based local application.',
    overview: [
      'CloudPOS4U is a restaurant Point-of-Sale platform designed to support restaurant operations through a cloud-based SaaS environment combined with an Electron-based local application.',
    ],
    problem: [
      'A POS system sits in the middle of daily restaurant operations, so regressions in login, orders, or authentication directly affect trading. Releases needed a repeatable way to prove that core workflows still worked.',
    ],
    objectives: [
      'Improve product reliability across releases',
      'Create a repeatable QA process that supports future SaaS releases',
      'Automate regression coverage of the most business-critical workflows',
    ],
    responsibilities: [
      'Product planning',
      'QA strategy',
      'Test automation',
      'Website and product positioning',
      'Product branding',
      'User experience review',
      'Release validation',
      'API testing',
      'Selenium automation',
      'Page Object Model architecture',
      'CI/CD planning',
    ],
    stack: ['React', 'Node.js', 'PostgreSQL', 'Electron', 'Python', 'Selenium', 'Pytest', 'REST APIs', 'VPS infrastructure'],
    sections: [
      {
        heading: 'QA automation',
        body: ['I developed automated testing coverage for key POS workflows:'],
        list: ['Login', 'Dashboard', 'Orders', 'Authentication APIs', 'Core application workflows'],
      },
      {
        heading: 'Test architecture',
        body: [
          'The automation architecture was structured around reusable Page Objects and maintainable regression testing, so new tests reuse existing building blocks instead of duplicating selectors and steps.',
        ],
      },
    ],
    outcome: [
      'A structured, reusable regression suite for the workflows restaurants depend on every day, and a QA process designed to scale with future SaaS releases.',
    ],
    services: ['qa-test-automation', 'saas-product-development', 'technical-project-management'],
  },
  {
    slug: 'villas-olimpia-ai-booking-automation',
    number: '02',
    name: 'Villas Olimpia',
    tagline: 'AI-powered villa booking system with a bilingual WhatsApp guest assistant',
    industry: 'Hospitality / Vacation Rentals',
    location: 'San Juan del Sur, Nicaragua',
    role: 'Technical project manager & solution architect',
    featured: true,
    seoTitle: 'Villas Olimpia: AI Villa Booking & WhatsApp Assistant',
    seoDescription:
      'An MVP villa booking platform with Airbnb iCal sync, a pricing rules engine, and a bilingual AI WhatsApp assistant with voice replies for guest inquiries.',
    keywords: ['villa booking system', 'AI WhatsApp assistant', 'vacation rental pricing engine', 'Airbnb iCal sync', 'hospitality automation'],
    summary:
      'An MVP platform to manage villa availability, pricing, booking requests, and AI-powered guest communication.',
    overview: [
      'The objective was to create an MVP platform allowing the business to manage villa availability, pricing, booking requests, customer inquiries, and AI-powered guest communication.',
    ],
    objectives: [
      'Centralise availability and pricing in one booking dashboard',
      'Answer guest inquiries quickly in Spanish and English',
      'Turn inquiries into structured booking requests',
      'Keep property management informed at every step',
    ],
    components: {
      heading: 'Solution components',
      items: [
        'Booking dashboard',
        'Airbnb iCal synchronization',
        'Availability calendar',
        'Pricing rules engine',
        'Seasonal pricing',
        'Weekend pricing',
        'Minimum-stay rules',
        'Manual pricing overrides',
        'AI WhatsApp assistant',
        'Spanish and English support',
        'Voice responses',
        'Knowledge-base management',
        'Booking request workflow',
        'Payment instruction workflow',
        'Customer follow-ups',
        'Public villa website',
      ],
    },
    workflow: {
      heading: 'AI guest assistant flow',
      steps: [
        'Guest inquiry',
        'Check villa availability',
        'Calculate pricing',
        'Validate minimum stay',
        'Answer questions',
        'Collect booking information',
        'Send payment instructions',
        'Notify property management',
      ],
    },
    stack: ['OpenAI', 'OpenAI TTS', 'WhatsApp Business API', 'Twilio', 'Airbnb iCal', 'REST APIs', 'Webhooks'],
    sections: [
      {
        heading: 'WhatsApp integration',
        body: [
          'Several provider approaches were evaluated because of Meta onboarding and business verification constraints. Options explored included:',
        ],
        list: ['Meta Cloud API', 'Twilio', 'QR-based WhatsApp integrations', 'Evolution API', 'Whatsmeow'],
      },
      {
        heading: 'Voice automation',
        body: ['OpenAI Text-to-Speech was incorporated to support AI-generated voice responses to guests.'],
      },
      {
        heading: 'Project management',
        body: [
          'The project was managed through milestones, requirements, change requests, UAT, deployment preparation, and client approvals.',
          'It also required active scope management when additional functionality, such as Airbnb inbox automation and automated scheduled guest messaging, was requested after the original scope was agreed.',
        ],
      },
    ],
    outcome: [
      'An MVP that brings availability, pricing rules, booking requests, and bilingual AI guest communication into one managed workflow, delivered under a milestone and change-request process.',
    ],
    services: ['ai-automation', 'technical-project-management', 'saas-product-development'],
  },
  {
    slug: 'recruitment-one-ai-talent-matching',
    number: '03',
    name: 'Recruitment ONE',
    tagline: 'AI talent matching, Zoho CRM architecture & data infrastructure',
    industry: 'Recruitment / HR Technology',
    location: 'Germany and Switzerland',
    role: 'Chief Data Officer',
    featured: true,
    seoTitle: 'Recruitment ONE Case Study: AI Talent Matching with Zoho CRM',
    seoDescription:
      'Semantic AI talent matching with OpenAI embeddings and Pinecone, a Zoho CRM talent pipeline, Power BI reporting, and a Microsoft 365 migration for a recruiter.',
    keywords: ['AI talent matching', 'recruitment CRM', 'Zoho CRM recruitment', 'OpenAI embeddings Pinecone', 'recruitment Power BI'],
    summary:
      'Technology and data initiatives supporting a recruitment operation in the DACH market, from CRM architecture to semantic matching.',
    overview: [
      'As Chief Data Officer, I worked on technology and data initiatives supporting a recruitment operation serving the German and Swiss markets.',
    ],
    workflow: {
      heading: 'Talent pipeline stages',
      steps: ['New', 'Email Sent', 'CV Pending', 'CV Approved', 'Submitted', 'Awaiting Feedback', 'Interview', 'Offer'],
    },
    stack: ['OpenAI', 'Pinecone', 'Azure MySQL', 'n8n', 'Zoho CRM', 'Power BI', 'Microsoft 365', 'Cloudflare'],
    sections: [
      {
        heading: 'CRM architecture',
        body: [
          'Zoho CRM was selected as the primary CRM platform, with structures for Jobs / Teams and Talents, and a talent pipeline that mirrors how recruiters actually work.',
        ],
      },
      {
        heading: 'AI talent matching',
        body: [
          'A semantic matching architecture was designed so candidates could be matched to jobs by meaning rather than exact keywords. Tens of thousands of talent profiles and jobs were considered within the matching architecture, and relevance could then be reranked using additional business criteria.',
        ],
        list: ['OpenAI embeddings', 'Pinecone vector database', 'Candidate profiles', 'Job descriptions', 'Skill matching', 'Location matching', 'Experience matching'],
      },
      {
        heading: 'Business intelligence',
        body: ['Power BI dashboards provided visibility into recruitment performance and operational metrics.'],
      },
      {
        heading: 'Infrastructure transformation',
        body: [
          "I also participated in the organization's migration from Google Workspace to Microsoft 365, together with the associated domain and DNS infrastructure changes.",
        ],
      },
    ],
    outcome: [
      'A structured CRM foundation, a semantic matching architecture for large talent and job datasets, and reporting that gives leadership visibility of recruitment operations.',
    ],
    services: ['ai-automation', 'crm-business-systems', 'technical-project-management'],
  },
  {
    slug: 'ai-proposal-factory',
    number: '04',
    name: 'AI Proposal Factory',
    tagline: 'Automated proposal generation from CRM opportunities',
    industry: 'Professional Services / Sales Operations',
    role: 'Automation architect',
    featured: true,
    seoTitle: 'AI Proposal Factory: HubSpot to PDF Proposals with n8n',
    seoDescription:
      'An n8n workflow that turns HubSpot deals into branded, AI-written proposals, then creates the PDF, saves it to Drive and notifies by email and WhatsApp.',
    keywords: ['AI proposal generator', 'proposal automation', 'n8n HubSpot workflow', 'automated PDF proposals', 'sales automation'],
    summary: 'A workflow that generates customised business proposals automatically from CRM opportunities.',
    overview: ['A workflow designed to automatically generate customised business proposals from CRM opportunities.'],
    problem: ['Writing proposals by hand is slow and produces inconsistent quality and branding across the sales team.'],
    workflow: {
      heading: 'Workflow',
      steps: [
        'HubSpot opportunity',
        'n8n workflow',
        'Collect customer data',
        'AI analyzes requirements',
        'Proposal content generated',
        'Document generated',
        'PDF created',
        'Stored in Google Drive',
        'Customer email generated',
        'WhatsApp notification',
        'Engagement tracking',
      ],
    },
    stack: ['HubSpot', 'n8n', 'OpenAI', 'Google Drive', 'Google Workspace', 'WhatsApp', 'Email automation'],
    sections: [],
    outcome: [
      'Less manual time spent creating proposals while keeping branding and proposal quality consistent.',
    ],
    services: ['ai-automation', 'crm-business-systems'],
  },
  {
    slug: 'ai-event-management-operating-system',
    number: '05',
    name: 'AI Event Management Operating System',
    tagline: 'One operating system connecting inquiries, proposals, events, and staffing',
    industry: 'Events / Venues',
    role: 'Solution architect',
    featured: true,
    seoTitle: 'AI Event Management OS: Automating Inquiries to Staffing',
    seoDescription:
      'Solution architecture connecting WhatsApp inquiries, calendar availability, proposals, event planning and staff shifts in one AI-assisted operating system.',
    keywords: ['event management automation', 'venue booking automation', 'staff scheduling automation', 'WhatsApp AI events', 'n8n operating system'],
    summary:
      'A solution architecture for an event-location business that needed to connect multiple operational systems.',
    overview: [
      'A solution architecture was developed for an event-location business wanting to connect multiple operational systems into a centralized operating system rather than separate, disconnected tools.',
    ],
    workflow: {
      heading: 'Proposed workflow',
      steps: [
        'WhatsApp inquiry',
        'AI sends event information',
        'Calendar availability checked',
        'Site visit scheduled',
        'Management notified',
        'Lead prioritized',
        'Proposal generated',
        'Customer accepts',
        'Event created',
        'Customer submits timeline',
        'AI assists planning',
        'Management approval',
        'Staffing requirements calculated',
        'Employees receive shift requests',
        'Acceptance / decline managed',
        'Replacements automatically requested',
      ],
    },
    stack: ['n8n', 'Relational database', 'CRM', 'Calendar', 'WhatsApp Business API', 'OpenAI', 'REST APIs', 'Webhooks', 'Accounting integrations'],
    sections: [
      {
        heading: 'Design principle',
        body: [
          'Human approval points stay in the loop, including management approval of event plans, while repetitive coordination such as availability checks, reminders, and shift replacements is automated.',
        ],
      },
    ],
    outcome: ['A target architecture that replaces disconnected tools with one connected operating system for the business.'],
    services: ['ai-automation', 'technical-project-management'],
  },
  {
    slug: 'website-issue-lead-generation-system',
    number: '06',
    name: 'Website Issue Lead Generation System',
    tagline: 'Technical website audits turned into consultative outreach',
    industry: 'Digital Services / Business Development',
    role: 'Designer & operator',
    featured: true,
    seoTitle: 'Website Issue Lead Generation: From Audit to CRM Outreach',
    seoDescription:
      'A lead-generation system that finds businesses with broken websites (502s, SSL or PHP errors), captures evidence, creates CRM leads and sends outreach.',
    keywords: ['website audit lead generation', 'technical SEO audit', 'website error monitoring', 'B2B outreach automation', 'CRM lead generation'],
    summary: 'A lead-generation approach focused on discovering businesses with technical website problems.',
    overview: [
      'I developed a lead-generation approach that combines technical website analysis with consultative business development: find a real, verifiable problem first, then contact the business with evidence.',
    ],
    workflow: {
      heading: 'Process',
      steps: [
        'Website discovery',
        'Technical inspection',
        'Identify critical issue',
        'Capture evidence',
        'Find business contact',
        'Create CRM lead',
        'Personalized WhatsApp / email outreach',
        'Follow-up',
      ],
    },
    stack: ['Technical SEO tooling', 'Browser automation', 'CRM', 'WhatsApp', 'Email automation'],
    sections: [
      {
        heading: 'Issues identified',
        list: ['502 gateway errors', 'Root-domain routing problems', 'PHP fatal errors', 'Broken pages', 'SSL / configuration problems', 'Website availability issues'],
      },
    ],
    outcome: ['Outreach that starts from evidence of a real problem, which makes the first conversation consultative rather than cold.'],
    services: ['seo-organic-growth', 'crm-business-systems'],
  },
  {
    slug: 'lead-generation-operating-system',
    number: '07',
    name: 'Lead Generation Operating System',
    tagline: 'Repeatable B2B outbound: discovery, enrichment, scoring, CRM, outreach',
    industry: 'B2B Sales',
    role: 'Automation architect',
    featured: false,
    seoTitle: 'Lead Generation Operating System: Apollo, Clay, HubSpot & n8n',
    seoDescription:
      'A structured B2B lead generation platform combining Apollo, Clay, HubSpot, n8n, and AI scoring into a repeatable outbound process, not isolated lead lists.',
    keywords: ['lead generation automation', 'AI lead scoring', 'Apollo Clay HubSpot', 'outbound sales automation', 'n8n lead generation'],
    summary: 'A structured lead-generation platform combining prospect discovery, enrichment, scoring, CRM, and outreach.',
    overview: [
      'Designed as a structured lead-generation platform combining prospect discovery, enrichment, scoring, CRM, and outreach. The design focuses on creating a repeatable outbound sales process rather than isolated lead lists.',
    ],
    workflow: {
      heading: 'Example workflow',
      steps: [
        'Prospect discovered',
        'Data enrichment',
        'Qualification',
        'AI scoring',
        'CRM creation',
        'Personalized outreach',
        'Automated follow-up',
        'Salesperson notification',
      ],
    },
    stack: ['Apollo', 'Clay', 'HubSpot', 'n8n', 'AI scoring', 'Email automation', 'CRM workflows'],
    sections: [],
    outcome: ['A repeatable outbound engine where every lead is enriched, scored, and tracked in the CRM.'],
    services: ['ai-automation', 'crm-business-systems'],
  },
  {
    slug: 'socialai-corporate-gifts',
    number: '08',
    name: 'SocialAI Corporate Gifts',
    tagline: 'Launching a UAE corporate gifts business with project discipline',
    industry: 'Corporate Gifts / E-commerce',
    location: 'United Arab Emirates',
    role: 'Project lead',
    featured: false,
    seoTitle: 'SocialAI Corporate Gifts: Digital Business Launch in the UAE',
    seoDescription:
      'Applying project management to a business launch: charter, feasibility, supplier research, pricing, CRM structure, brand identity, and sales workflows.',
    keywords: ['corporate gifts UAE', 'business launch project', 'project charter', 'feasibility analysis', 'drop-shipping strategy'],
    summary: 'A UAE corporate gifts reseller concept built around online sales, supplier relationships, digital marketing, and automation.',
    overview: [
      'A UAE corporate gifts reseller concept designed around online sales, supplier relationships, digital marketing, and automation. It shows how I apply project management principles to business creation as well as software development.',
    ],
    stack: ['CRM', 'Digital marketing', 'Automation', 'Supplier portals'],
    sections: [
      {
        heading: 'Areas developed',
        list: [
          'Project charter',
          'Feasibility analysis',
          'Supplier research',
          'Product strategy',
          'Pricing structure',
          'Customer segment analysis',
          'Lead outreach',
          'CRM structure',
          'Brand identity',
          'Sales workflows',
          'Supplier portal analysis',
          'Drop-shipping strategy',
        ],
      },
    ],
    outcome: ['A structured launch plan covering the commercial, operational, and digital foundations of the business.'],
    services: ['technical-project-management', 'crm-business-systems'],
  },
  {
    slug: 'smart-tuition',
    number: '09',
    name: 'Smart Tuition',
    tagline: 'Education micro-business concept: service design to digital acquisition',
    industry: 'Education',
    role: 'Business planner',
    featured: false,
    seoTitle: 'Smart Tuition: Education Micro-Business & Google Ads Strategy',
    seoDescription:
      'Planning a small tuition centre for early-grade students: service design, pricing, course structure, Google Ads acquisition, branding and domain strategy.',
    keywords: ['tuition centre business plan', 'education marketing', 'Google Ads for tuition', 'service design', 'brand positioning'],
    summary: 'A small tuition centre concept targeting early-grade students.',
    overview: [
      'Smart Tuition was designed as a small tuition centre concept targeting early-grade students. It demonstrates business planning, service design, and digital acquisition strategy.',
    ],
    stack: ['Google Ads', 'Website & domain strategy', 'Brand positioning'],
    sections: [
      {
        heading: 'Planning scope',
        list: ['Service design', 'Pricing', 'Operating hours', 'Course structure', 'Customer acquisition', 'Google advertising', 'Brand positioning', 'Website / domain strategy'],
      },
    ],
    outcome: ['A launch-ready service design with a defined acquisition channel and brand position.'],
    services: ['seo-organic-growth', 'technical-project-management'],
  },
];

export const featuredCaseStudies = caseStudies.filter((c) => c.featured);

export function getCaseStudy(slug: string | undefined) {
  return caseStudies.find((c) => c.slug === slug);
}
