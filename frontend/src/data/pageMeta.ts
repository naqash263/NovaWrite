// SEO metadata for static pages. Used by the React pages (useSEO) and by the build-time
// prerenderer (scripts/prerender.mjs), so crawlers without JavaScript see the same tags.
export interface PageMeta {
  path: string;
  title: string;
  description: string;
  keywords: string[];
}

export const pageMeta = {
  home: {
    path: '/',
    title: 'Naqash Thaheem | Technical Project Manager & AI Automation',
    description:
      'UAE-based Technical Project Manager helping businesses plan, automate, integrate, test and deliver digital systems: AI automation, n8n, CRM, SEO and QA.',
    keywords: ['technical project manager UAE', 'AI automation consultant', 'n8n automation', 'CRM implementation', 'technical SEO', 'QA automation'],
  },
  about: {
    path: '/about',
    title: 'About Naqash Thaheem | Technical Project Manager, UAE',
    description:
      'Naqash Thaheem is a UAE-based Technical Project Manager combining project management, AI automation, CRM, technical SEO and QA to deliver business systems.',
    keywords: ['Naqash Thaheem', 'technical project manager UAE', 'AI automation specialist', 'business systems specialist'],
  },
  services: {
    path: '/services',
    title: 'Services: Project Management, AI Automation, SEO & QA',
    description:
      'Technical project management, AI and n8n automation, SEO and organic growth, CRM implementation, QA test automation and SaaS product consulting in the UAE.',
    keywords: ['technical project management services', 'AI automation services', 'SEO services UAE', 'CRM implementation', 'QA automation services'],
  },
  caseStudies: {
    path: '/case-studies',
    title: 'Case Studies: AI Automation, CRM, SaaS & QA Projects',
    description:
      'Portfolio case studies: restaurant POS SaaS QA automation, AI villa booking with WhatsApp, AI talent matching with Zoho CRM, proposal automation and more.',
    keywords: ['AI automation case studies', 'CRM implementation case study', 'QA automation case study', 'technical project management portfolio'],
  },
  resources: {
    path: '/resources',
    title: 'Free Online Tools & Career Resources | Naqash Thaheem',
    description:
      'Free online tools: PDF and image utilities, developer formatters, unit converters, AI writing tools and career tools like a CV builder. No signup needed.',
    keywords: ['free online tools', 'pdf tools', 'unit converter', 'ai writing tools', 'cv builder', 'developer tools'],
  },
} satisfies Record<string, PageMeta>;
