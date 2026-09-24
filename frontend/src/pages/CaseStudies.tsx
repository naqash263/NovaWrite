import { useSEO } from '../utils/seo';
import { caseStudies, featuredCaseStudies } from '../data/caseStudies';
import { breadcrumbSchema, itemListSchema } from '../utils/schema';
import { Section, SectionHeading, PageHero, CaseStudyCard, CtaBand } from '../components/site/ui';
import { Link } from 'react-router-dom';

export default function CaseStudies() {
  const more = caseStudies.filter((c) => !c.featured);

  useSEO({
    title: 'Case Studies: AI Automation, CRM, SaaS & QA Projects',
    description:
      'Portfolio case studies: restaurant POS SaaS QA automation, AI villa booking with WhatsApp, AI talent matching with Zoho CRM, proposal automation and more.',
    url: '/case-studies',
    keywords: ['AI automation case studies', 'CRM implementation case study', 'QA automation case study', 'technical project management portfolio'],
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Case Studies',
        url: 'https://naqashthaheem.com/case-studies',
      },
      itemListSchema(
        'Case studies',
        caseStudies.map((c) => ({ name: c.name, path: `/case-studies/${c.slug}` })),
      ),
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Case Studies', path: '/case-studies' },
      ]),
    ],
  });

  return (
    <div className="bg-white text-slate-900">
      <PageHero
        eyebrow="Portfolio"
        title="Case studies"
        lead="Projects that show the range of my work: SaaS and QA automation, AI and WhatsApp automation, CRM and data, sales operations, and technical lead generation."
        breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Case Studies' }]}
      />

      <Section labelledBy="featured-heading">
        <SectionHeading
          id="featured-heading"
          eyebrow="Featured"
          title="Featured projects"
          intro="Together these six projects demonstrate delivery range without losing focus."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredCaseStudies.map((study) => (
            <CaseStudyCard key={study.slug} study={study} />
          ))}
        </div>
      </Section>

      <Section tone="muted" labelledBy="more-heading">
        <SectionHeading
          id="more-heading"
          eyebrow="More work"
          title="Business and delivery projects"
          intro="Projects that apply project management principles to sales systems and business creation, not only software."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {more.map((study) => (
            <CaseStudyCard key={study.slug} study={study} />
          ))}
        </div>
        <p className="mt-10 text-slate-600">
          Looking for product builds and client work managed in the CMS?{' '}
          <Link to="/projects" className="font-semibold text-blue-700 hover:text-blue-800">
            Browse all projects
          </Link>
          .
        </p>
      </Section>

      <CtaBand />
    </div>
  );
}
