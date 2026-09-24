// JSON-LD builders for the portfolio pages. Entities share stable @ids so Google can
// connect the Person, WebSite and ProfessionalService across every page.
import { SITE_URL, profile, skillGroups } from '../data/profile';
import type { Service } from '../data/services';
import type { CaseStudy } from '../data/caseStudies';

export const PERSON_ID = `${SITE_URL}/#person`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const BUSINESS_ID = `${SITE_URL}/#business`;

const abs = (path: string) => (path.startsWith('http') ? path : `${SITE_URL}${path}`);

export function personSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': PERSON_ID,
    name: profile.name,
    jobTitle: profile.title,
    description: profile.summary,
    url: SITE_URL,
    email: `mailto:${profile.email}`,
    image: abs('/images/og-default.png'),
    address: { '@type': 'PostalAddress', addressCountry: 'AE' },
    knowsAbout: [
      'Technical Project Management',
      'AI Automation',
      'n8n Workflow Automation',
      'Business Process Automation',
      'CRM Implementation',
      'Zoho CRM',
      'HubSpot',
      'Technical SEO',
      'Keyword Research',
      'QA Automation',
      'Playwright',
      'Selenium',
      'SaaS Product Development',
      'Power BI',
    ],
    hasOccupation: {
      '@type': 'Occupation',
      name: 'Technical Project Manager',
      occupationLocation: { '@type': 'Country', name: 'United Arab Emirates' },
      skills: skillGroups.flatMap((g) => g.skills).slice(0, 40).join(', '),
    },
    sameAs: profile.sameAs,
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: 'Naqash Thaheem',
    url: SITE_URL,
    inLanguage: 'en',
    publisher: { '@id': PERSON_ID },
  };
}

export function businessSchema(serviceList: Service[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': BUSINESS_ID,
    name: 'Naqash Thaheem: Technical Project Management & AI Automation',
    url: SITE_URL,
    image: abs('/images/og-default.png'),
    email: profile.email,
    founder: { '@id': PERSON_ID },
    areaServed: [
      { '@type': 'Country', name: 'United Arab Emirates' },
      { '@type': 'Place', name: 'Worldwide (remote)' },
    ],
    address: { '@type': 'PostalAddress', addressCountry: 'AE' },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Services',
      itemListElement: serviceList.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.name, url: abs(`/services/${s.slug}`) },
      })),
    },
  };
}

export function serviceSchema(service: Service) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': abs(`/services/${service.slug}#service`),
    name: service.name,
    serviceType: service.name,
    description: service.seoDescription,
    url: abs(`/services/${service.slug}`),
    provider: { '@id': PERSON_ID },
    areaServed: [
      { '@type': 'Country', name: 'United Arab Emirates' },
      { '@type': 'Place', name: 'Worldwide (remote)' },
    ],
  };
}

export function caseStudySchema(study: CaseStudy) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': abs(`/case-studies/${study.slug}#article`),
    headline: study.seoTitle,
    description: study.seoDescription,
    url: abs(`/case-studies/${study.slug}`),
    mainEntityOfPage: abs(`/case-studies/${study.slug}`),
    image: abs('/images/og-default.png'),
    author: { '@id': PERSON_ID, '@type': 'Person', name: profile.name, url: abs('/about') },
    publisher: { '@id': PERSON_ID },
    about: study.industry,
    keywords: study.keywords.join(', '),
    inLanguage: 'en',
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: abs(item.path),
    })),
  };
}

export function faqSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

export function itemListSchema(name: string, items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: abs(item.path),
    })),
  };
}
