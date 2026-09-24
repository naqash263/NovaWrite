// Service landing pages. Each page targets one primary search intent (see SEO_ANALYSIS.md).

export interface ServiceSection {
  heading: string;
  intro?: string;
  list?: string[];
  steps?: string[]; // rendered as an ordered flow
  cards?: { title: string; text: string; examples?: string[] }[];
}

export interface Service {
  slug: string;
  name: string;
  navLabel: string;
  icon: 'pm' | 'ai' | 'seo' | 'crm' | 'qa' | 'saas';
  summary: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  h1: string;
  lead: string;
  sections: ServiceSection[];
  tools?: string[];
  faqs: { question: string; answer: string }[];
}

export const services: Service[] = [
  {
    slug: 'technical-project-management',
    name: 'Technical Project Management',
    navLabel: 'Project Management',
    icon: 'pm',
    summary: 'Plan and deliver software, AI, automation, and digital transformation projects, from requirements to UAT, deployment, and closure.',
    seoTitle: 'Technical Project Manager in the UAE | Naqash Thaheem',
    seoDescription:
      'Technical project management for software, AI, CRM and automation projects in the UAE: requirements, WBS, sprints, risk, vendors, UAT, deployment and closure.',
    keywords: ['technical project manager UAE', 'IT project management', 'software project manager', 'digital transformation project management', 'UAT management'],
    h1: 'Technical Project Management',
    lead: 'I manage technology projects from concept to production, combining traditional project management discipline with Agile execution where appropriate.',
    sections: [
      {
        heading: 'Typical responsibilities',
        list: [
          'Business requirement gathering',
          'Project charter creation',
          'Scope definition',
          'Functional requirements',
          'Technical requirements',
          'Work Breakdown Structure',
          'Milestone planning',
          'Sprint planning',
          'Stakeholder management',
          'Risk identification',
          'Dependency management',
          'Change request management',
          'Vendor coordination',
          'Development tracking',
          'QA coordination',
          'UAT management',
          'Deployment planning',
          'Project handover',
          'Lessons learned',
          'Project closure documentation',
        ],
      },
      {
        heading: 'Delivery approaches',
        cards: [
          { title: 'Agile & Scrum', text: 'Sprint planning, backlog refinement, and iterative delivery for products that evolve with user feedback.' },
          { title: 'Waterfall', text: 'Clear phases, sign-offs, and change control for fixed-scope and compliance-driven projects.' },
          { title: 'Hybrid delivery', text: 'Milestone-based governance with Agile execution inside each phase, often the best fit for client projects.' },
        ],
      },
      {
        heading: 'Why a technical project manager',
        intro:
          'My background combines disciplines that are often handled by different people, so I can communicate with business stakeholders and technical teams while keeping the project focused on measurable business outcomes.',
      },
    ],
    tools: ['Project charter', 'WBS', 'Risk register', 'Change requests', 'UAT plans', 'Jira-style boards', 'Microsoft 365', 'Google Workspace'],
    faqs: [
      {
        question: 'What is the difference between a project manager and a technical project manager?',
        answer:
          'A technical project manager also understands the architecture, APIs, data and testing involved, so they can challenge estimates, spot integration risks early, and translate between business stakeholders and developers.',
      },
      {
        question: 'Can you manage external vendors and developers?',
        answer:
          'Yes. Vendor coordination, development tracking, change-request management and acceptance testing are core parts of how I run projects.',
      },
    ],
  },
  {
    slug: 'ai-automation',
    name: 'AI & Automation',
    navLabel: 'AI & Automation',
    icon: 'ai',
    summary: 'AI agents, n8n workflows, and business process automation that connect your CRM, WhatsApp, email, databases, and business tools.',
    seoTitle: 'AI Automation & n8n Workflow Consultant, UAE | Naqash Thaheem',
    seoDescription:
      'AI automation consulting: WhatsApp AI agents, lead qualification, proposal generation and n8n workflows that connect your CRM, email, databases and APIs.',
    keywords: ['AI automation consultant', 'n8n automation expert', 'business process automation', 'WhatsApp AI agent', 'AI agents for business'],
    h1: 'AI Automation & Workflow Automation',
    lead: 'I design practical AI solutions that automate repetitive business processes, and I start with the process, not the tool.',
    sections: [
      {
        heading: 'What I build',
        list: [
          'AI customer support assistants',
          'WhatsApp AI agents',
          'Lead qualification agents',
          'Automated proposal generation',
          'AI-powered recruitment matching',
          'Automated document processing',
          'AI knowledge-base assistants',
          'Email automation',
          'Customer follow-up automation',
          'Appointment and booking assistants',
          'Voice AI workflows',
          'CRM automation',
          'AI-driven business workflows',
        ],
      },
      {
        heading: 'How business process automation works',
        intro: 'I analyze manual business processes and redesign them as automated workflows:',
        steps: ['Business event', 'Automation', 'Decision logic', 'AI processing', 'CRM / database update', 'Notification', 'Reporting'],
      },
      {
        heading: 'Example: lead handling',
        steps: ['Lead received', 'Validate information', 'Enrich lead', 'Score lead', 'Assign salesperson', 'Send personalized message', 'Create CRM opportunity', 'Schedule follow-up'],
      },
      {
        heading: 'Example: customer inquiry',
        steps: ['Customer inquiry', 'AI understands request', 'Checks availability', 'Calculates pricing', 'Responds to customer', 'Creates booking request', 'Alerts business owner'],
      },
      {
        heading: 'n8n workflow automation',
        intro:
          'I build multi-system n8n workflows connecting APIs, CRMs, AI models, databases, WhatsApp, email and business tools. The objective is always to reduce manual work while maintaining visibility and control.',
      },
      {
        heading: 'My approach to automation',
        intro:
          'I do not begin by asking "Which AI tool should we use?" I start with "What business process are we trying to improve?" Then I identify:',
        list: ['Trigger', 'Data source', 'Decision points', 'Manual work', 'AI opportunities', 'Required integrations', 'Human approval points', 'Failure scenarios', 'Monitoring', 'Business outcome'],
      },
    ],
    tools: ['OpenAI', 'n8n', 'Make', 'Zapier', 'REST APIs', 'Webhooks', 'WhatsApp Business API', 'Meta Cloud API', 'Twilio', 'OpenAI TTS', 'Google Workspace', 'Microsoft 365', 'CRM APIs', 'SQL databases'],
    faqs: [
      {
        question: 'Is n8n a good choice for business automation?',
        answer:
          'n8n works well when you need many integrations, custom logic, AI steps and the option to self-host for data control. For very simple two-app automations, Zapier or Make can be quicker to set up.',
      },
      {
        question: 'Can an AI agent reply to customers on WhatsApp?',
        answer:
          'Yes. A WhatsApp AI agent can answer questions from a knowledge base, check availability, calculate prices, collect details and hand over to a person. Provider choice (Meta Cloud API, Twilio or others) depends on business verification and budget.',
      },
    ],
  },
  {
    slug: 'seo-organic-growth',
    name: 'SEO & Organic Growth',
    navLabel: 'SEO & Organic Growth',
    icon: 'seo',
    summary: 'Keyword research, technical SEO, competitor analysis, content strategy, and search optimization, validated with automated testing.',
    seoTitle: 'Technical SEO Consultant in Dubai & UAE | Naqash Thaheem',
    seoDescription:
      'Technical SEO audits, keyword research, competitor analysis and content strategy for UAE businesses, with every fix validated by automated Playwright tests.',
    keywords: ['technical SEO consultant', 'SEO consultant Dubai', 'SEO audit UAE', 'keyword research services', 'competitor SEO analysis'],
    h1: 'SEO & Organic Growth',
    lead:
      'I help businesses improve their website visibility, technical health, search performance, and lead-generation potential by combining marketing objectives with technical implementation.',
    sections: [
      {
        heading: 'The complete path, not just rankings',
        steps: ['Search demand', 'Keyword', 'Search intent', 'Content', 'Technical SEO', 'User experience', 'Conversion'],
      },
      {
        heading: 'Technical SEO',
        intro: 'I analyze websites for technical problems that may prevent search engines from properly crawling, indexing, or ranking pages. Areas reviewed include:',
        list: [
          'Crawlability',
          'Indexability',
          'Robots.txt',
          'XML sitemaps',
          'Canonical URLs',
          'Redirects',
          'HTTP status codes',
          'Broken links',
          '404, 403 & 5xx errors',
          'Duplicate pages',
          'URL structure',
          'HTTPS configuration',
          'WWW vs non-WWW',
          'Core Web Vitals',
          'Mobile usability',
          'Page speed',
          'Structured data',
          'Internal linking',
          'JavaScript rendering issues',
          'Metadata',
          'Heading structure',
          'Image optimization',
        ],
      },
      {
        heading: 'Keyword research process',
        intro: 'Before creating or optimizing content, I research what users are actually searching for:',
        steps: [
          'Identify products and services',
          'Research seed keywords',
          'Analyze search volume',
          'Review keyword difficulty',
          'Understand search intent',
          'Analyze competitor rankings',
          'Identify long-tail opportunities',
          'Find content gaps',
          'Group keywords by topic',
          'Map keywords to pages',
          'Prioritize by business value',
          'Create an SEO content roadmap',
        ],
      },
      {
        heading: 'Search intent analysis',
        intro: 'A keyword alone is not enough. I classify keywords by intent to decide the correct page type.',
        cards: [
          { title: 'Informational', text: 'The user wants information.', examples: ['What is a subnet mask?', 'What is a 404 error?', 'How does CRM automation work?'] },
          { title: 'Commercial investigation', text: 'The user is comparing solutions.', examples: ['Best restaurant POS software', 'Zoho vs HubSpot', 'Best CRM for recruitment agencies'] },
          { title: 'Transactional', text: 'The user is ready to take action.', examples: ['Restaurant POS system UAE', 'Hire n8n automation specialist', 'CRM implementation services'] },
          { title: 'Navigational', text: 'The user wants a specific website, brand, or tool.' },
        ],
      },
      {
        heading: 'Competitor SEO analysis',
        intro:
          'The purpose is not to copy competitors. The goal is to understand what users expect, what Google currently rewards, and what competitors are missing.',
        list: ['Competitor keywords', 'Ranking pages', 'Organic traffic opportunities', 'Content gaps', 'Backlink profiles', 'Page structure', 'Search intent', 'Landing-page strategy', 'Feature comparison', 'Internal linking', 'Content depth', 'SERP positioning'],
      },
      {
        heading: 'On-page SEO',
        intro: 'For each important page, I review and optimize:',
        list: ['Primary keyword', 'Secondary keywords', 'Title tag', 'Meta description', 'H1', 'H2/H3 structure', 'URL', 'Opening paragraph', 'Content coverage', 'Semantic keywords', 'Internal links', 'Image alt text', 'Calls to action', 'Schema opportunities', 'Related questions', 'Readability'],
      },
      {
        heading: 'SEO content strategy',
        intro: 'Each page is designed around a specific search intent. Typical content types include:',
        list: ['How-to articles', 'Product guides', 'Service pages', 'Comparison pages', 'Troubleshooting guides', 'Glossary pages', 'Technical tutorials', 'FAQs', 'Local landing pages', 'Industry-specific content'],
      },
      {
        heading: 'Programmatic & tool-based SEO',
        intro:
          'For websites with calculators, converters or utilities, I evaluate SEO opportunities around the functionality itself, so the tool is technically useful and can attract organic traffic.',
        steps: ['Keyword research', 'Competitor tool analysis', 'Feature gap analysis', 'Tool functionality', 'Automated testing', 'SEO content', 'Technical SEO', 'Performance monitoring'],
      },
      {
        heading: 'SEO quality assurance',
        intro:
          'SEO implementations should be tested too. I validate page response, canonical and meta tags, heading structure, internal links, structured data, redirects, broken URLs, tool and form functionality, responsive layouts, and JavaScript errors, using automated browser testing with Playwright, Selenium or Cypress so SEO and QA work together.',
      },
      {
        heading: 'SEO audit workflow',
        cards: [
          { title: '01 · Website discovery', text: 'Business model, target audience, services, target markets, current website, competitors.' },
          { title: '02 · Technical audit', text: 'Crawlability, indexation, status codes, sitemap, robots, canonicals, redirects, performance, mobile usability.' },
          { title: '03 · Keyword research', text: 'Primary, long-tail, commercial and informational keywords, grouped into clusters.' },
          { title: '04 · Competitor analysis', text: 'Ranking competitors, top pages, content structure, keywords, backlinks, features.' },
          { title: '05 · Content gap analysis', text: 'Missing landing pages, articles, FAQs, tools and comparison content; weak content.' },
          { title: '06 · Optimization', text: 'Content, metadata, page structure, internal links, technical issues, UX, calls to action.' },
          { title: '07 · Testing', text: 'Functionality, responsive layouts, SEO implementation, structured data, broken links, redirects.' },
          { title: '08 · Monitoring', text: 'Rankings, impressions, clicks, CTR, indexed pages, organic traffic, leads, conversions.' },
        ],
      },
      {
        heading: 'SEO reporting',
        intro:
          'Reporting connects rankings with business performance. Only verified results are reported, never estimated or invented numbers.',
        list: ['Organic impressions', 'Organic clicks', 'Click-through rate', 'Average position', 'Ranking keywords', 'Indexed pages', 'Organic sessions', 'Engagement', 'Leads', 'Conversions', 'Landing-page performance', 'Technical issues resolved'],
      },
    ],
    tools: ['Semrush', 'Google Search Console', 'Google Analytics', 'Google Trends', 'Google Keyword Planner', 'PageSpeed Insights', 'Lighthouse', 'Screaming Frog', 'Browser DevTools', 'Playwright'],
    faqs: [
      {
        question: 'What is included in a technical SEO audit?',
        answer:
          'Crawlability and indexation, robots.txt and XML sitemaps, canonicals and redirects, status codes and broken links, Core Web Vitals and mobile usability, structured data, internal linking, metadata and heading structure, and JavaScript rendering.',
      },
      {
        question: 'How long does SEO take to show results?',
        answer:
          'Technical fixes can be picked up as soon as pages are recrawled, while content and authority improvements usually take several months. I report on verified Search Console and analytics data rather than projections.',
      },
      {
        question: 'Why test SEO changes with Playwright?',
        answer:
          'Automated browser tests check titles, meta descriptions, canonicals, structured data and links on every release, so a later code change cannot silently undo SEO work.',
      },
    ],
  },
  {
    slug: 'crm-business-systems',
    name: 'CRM & Business Systems',
    navLabel: 'CRM & Business Systems',
    icon: 'crm',
    summary: 'Design and automate CRM pipelines, data models, integrations, dashboards, and operational workflows in Zoho CRM, HubSpot, and Bitrix24.',
    seoTitle: 'CRM Implementation Consultant: Zoho CRM & HubSpot, UAE',
    seoDescription:
      'CRM implementation and automation for Zoho CRM, HubSpot and Bitrix24: pipeline design, data models, lead scoring, WhatsApp integration, dashboards and training.',
    keywords: ['CRM implementation UAE', 'Zoho CRM consultant', 'HubSpot implementation', 'CRM automation', 'Bitrix24 implementation'],
    h1: 'CRM Implementation & Business Systems',
    lead: 'I work with CRM platforms to turn disconnected sales processes into structured, automated workflows.',
    sections: [
      {
        heading: 'Experience includes',
        list: ['Zoho CRM', 'HubSpot', 'Bitrix24', 'Custom CRM workflows', 'Lead pipelines', 'Deal pipelines', 'Customer lifecycle automation', 'Email workflows', 'WhatsApp integrations', 'CRM API integrations', 'Lead scoring', 'CRM dashboards', 'Automated follow-ups'],
      },
      {
        heading: 'Implementation process',
        steps: ['Business process analysis', 'CRM architecture', 'Pipeline design', 'Data model', 'Automation rules', 'Integration', 'Testing', 'User training', 'Deployment'],
      },
      {
        heading: 'Business systems',
        intro: 'Beyond CRM, I work on the systems that run daily operations:',
        list: ['Recruitment platforms', 'Booking and reservation systems', 'Restaurant POS systems', 'Dashboards and KPI reporting', 'Lead management', 'Customer communication', 'Odoo workflows'],
      },
    ],
    tools: ['Zoho CRM', 'HubSpot', 'Bitrix24', 'Odoo', 'Power BI', 'n8n', 'WhatsApp Business API', 'REST APIs'],
    faqs: [
      {
        question: 'Zoho CRM or HubSpot: which should we choose?',
        answer:
          'It depends on your process, budget and ecosystem. Zoho CRM is highly customisable and cost-effective, especially with other Zoho apps; HubSpot is strong for marketing-led teams. I compare both against your actual pipeline before recommending one.',
      },
      {
        question: 'Can you migrate data from spreadsheets or another CRM?',
        answer: 'Yes. Data model design, cleansing and migration are part of the implementation process, followed by testing and user training.',
      },
    ],
  },
  {
    slug: 'qa-test-automation',
    name: 'QA & Test Automation',
    navLabel: 'QA & Testing',
    icon: 'qa',
    summary: 'Manual and automated testing strategies for SaaS, websites, APIs, and business applications with Playwright, Selenium, and Cypress.',
    seoTitle: 'QA & Test Automation Services: Playwright & Selenium',
    seoDescription:
      'QA and test automation for SaaS, web, mobile and APIs: Playwright, Selenium, Cypress, Appium and Pytest, with regression suites, UAT and release validation.',
    keywords: ['QA automation services', 'test automation UAE', 'Playwright testing', 'Selenium automation', 'API testing'],
    h1: 'QA & Test Automation',
    lead: 'My QA background gives me a quality-focused approach to delivery. I treat testing as part of the development process rather than something that happens only before release.',
    sections: [
      {
        heading: 'Testing experience',
        list: ['Functional testing', 'Regression testing', 'Integration testing', 'API testing', 'UI testing', 'End-to-end testing', 'UAT coordination', 'Cross-browser testing', 'Mobile testing', 'Test case design', 'Bug reporting', 'Release validation'],
      },
      {
        heading: 'Automation approach',
        cards: [
          { title: 'Page Object Model', text: 'Reusable page objects keep suites maintainable as the product grows.' },
          { title: 'API + UI layers', text: 'Fast API checks for business rules, focused UI tests for critical user journeys.' },
          { title: 'CI/CD pipelines', text: 'Tests run on every change so regressions are caught before release, not after.' },
        ],
      },
    ],
    tools: ['Playwright', 'Selenium', 'Cypress', 'Appium', 'Python', 'Pytest', 'API automation', 'CI/CD pipelines'],
    faqs: [
      {
        question: 'Playwright, Selenium or Cypress?',
        answer:
          'Playwright is my default for new web projects because of its speed, auto-waiting and multi-browser support. Selenium suits existing suites and wide language support; Cypress is productive for front-end-heavy teams.',
      },
      {
        question: 'What should be automated first?',
        answer: 'Start with the workflows that would hurt most if they broke, such as login, payments, orders and core APIs, then expand regression coverage release by release.',
      },
    ],
  },
  {
    slug: 'saas-product-development',
    name: 'SaaS & Product Development',
    navLabel: 'SaaS & Product',
    icon: 'saas',
    summary: 'Plan, test, integrate, improve, and launch digital products, translating business requirements into maintainable software.',
    seoTitle: 'SaaS Product Consulting: Planning, QA & Launch',
    seoDescription:
      'SaaS product consulting from requirements and feature planning to API integration, QA, deployment, customer onboarding and release validation.',
    keywords: ['SaaS product consulting', 'SaaS product development', 'product requirements', 'SaaS launch', 'release validation'],
    h1: 'SaaS & Product Development',
    lead: 'My focus is on translating a business requirement into a working and maintainable product.',
    sections: [
      {
        heading: 'Areas I work on',
        list: ['Product requirements', 'Feature planning', 'User workflows', 'Frontend/backend coordination', 'API integration', 'Database workflows', 'QA', 'Deployment', 'Customer onboarding', 'Release validation'],
      },
      {
        heading: 'Product lifecycle',
        steps: ['Requirements', 'Feature planning', 'Architecture', 'Build & integrate', 'Test', 'Deploy', 'Onboard customers', 'Improve'],
      },
    ],
    tools: ['React', 'Node.js', 'PostgreSQL', 'MySQL', 'Electron', 'Docker', 'Git', 'GitHub', 'CI/CD', 'Cloudflare', 'VPS', 'Azure'],
    faqs: [
      {
        question: 'Can you help an existing SaaS product improve quality?',
        answer: 'Yes. A common starting point is a QA review and regression automation for critical workflows, followed by a release-validation process for future versions.',
      },
    ],
  },
];

export function getService(slug: string | undefined) {
  return services.find((s) => s.slug === slug);
}
