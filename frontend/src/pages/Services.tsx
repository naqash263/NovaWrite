import { useSEO } from '../utils/seo';
import { services } from '../data/services';
import { businessSchema, breadcrumbSchema, itemListSchema } from '../utils/schema';
import { Section, SectionHeading, PageHero, ServiceCard, CtaBand, FlowSteps } from '../components/site/ui';

export default function Services() {
  useSEO({
    title: 'Services: Project Management, AI Automation, SEO & QA',
    description:
      'Technical project management, AI and n8n automation, SEO and organic growth, CRM implementation, QA test automation and SaaS product consulting in the UAE.',
    url: '/services',
    keywords: ['technical project management services', 'AI automation services', 'SEO services UAE', 'CRM implementation', 'QA automation services'],
    jsonLd: [
      businessSchema(services),
      itemListSchema(
        'Services',
        services.map((s) => ({ name: s.name, path: `/services/${s.slug}` })),
      ),
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Services', path: '/services' },
      ]),
    ],
  });

  return (
    <div className="bg-white text-slate-900">
      <PageHero
        eyebrow="Services"
        title="Plan, build, automate, optimize, test and scale"
        lead="I help businesses plan, build, automate, optimize, test, and scale digital systems, working across both the technical and business sides of digital transformation."
        breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Services' }]}
      />

      <Section labelledBy="services-heading">
        <SectionHeading id="services-heading" eyebrow="What I do" title="Six connected services" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.slug} service={service} />
          ))}
        </div>
      </Section>

      <Section tone="muted" labelledBy="combined-heading">
        <SectionHeading
          id="combined-heading"
          eyebrow="Why combined"
          title="One delivery framework"
          intro="What differentiates my approach is the ability to connect these areas in a single, accountable delivery path:"
        />
        <FlowSteps steps={['Project Management', 'AI & Automation', 'Software & SaaS', 'Technical SEO', 'Quality Assurance', 'Business Systems']} />
      </Section>

      <CtaBand />
    </div>
  );
}
