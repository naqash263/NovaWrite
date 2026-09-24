import { Link, useParams } from 'react-router-dom';
import { useSEO } from '../utils/seo';
import { getService, services } from '../data/services';
import { caseStudies } from '../data/caseStudies';
import { serviceSchema, breadcrumbSchema, faqSchema } from '../utils/schema';
import NotFound from './NotFound';
import {
  Section,
  SectionHeading,
  PageHero,
  CheckList,
  FlowSteps,
  Tags,
  FaqList,
  CtaBand,
  CaseStudyCard,
  ServiceIcon,
  ArrowRight,
  Container,
} from '../components/site/ui';

export default function ServiceDetail() {
  const { slug } = useParams();
  const service = getService(slug);
  if (!service) return <NotFound />;
  return <ServicePage key={service.slug} slug={service.slug} />;
}

function ServicePage({ slug }: { slug: string }) {
  const service = getService(slug)!;
  const related = caseStudies.filter((c) => c.services.includes(service.slug)).slice(0, 3);
  const others = services.filter((s) => s.slug !== service.slug);

  useSEO({
    title: service.seoTitle,
    description: service.seoDescription,
    url: `/services/${service.slug}`,
    keywords: service.keywords,
    jsonLd: [
      serviceSchema(service),
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Services', path: '/services' },
        { name: service.name, path: `/services/${service.slug}` },
      ]),
      faqSchema(service.faqs),
    ],
  });

  return (
    <div className="bg-white text-slate-900">
      <PageHero
        eyebrow="Service"
        title={service.h1}
        lead={service.lead}
        breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Services', path: '/services' }, { name: service.name }]}
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500"
          >
            Discuss your project <ArrowRight />
          </Link>
          <Link
            to="/case-studies"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            See case studies
          </Link>
        </div>
      </PageHero>

      {service.sections.map((section, index) => {
        const id = `section-${index}`;
        return (
          <Section key={section.heading} tone={index % 2 === 1 ? 'muted' : 'white'} labelledBy={id}>
            <SectionHeading id={id} title={section.heading} intro={section.intro} />
            {section.steps && <FlowSteps steps={section.steps} />}
            {section.list && <CheckList items={section.list} columns={section.list.length > 12 ? 3 : 2} />}
            {section.cards && (
              <div className={`grid gap-5 sm:grid-cols-2 ${section.cards.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
                {section.cards.map((card) => (
                  <div key={card.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                    <h3 className="font-semibold text-slate-900">{card.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{card.text}</p>
                    {card.examples && (
                      <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-sm text-slate-500">
                        {card.examples.map((ex) => (
                          <li key={ex}>&ldquo;{ex}&rdquo;</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>
        );
      })}

      {service.tools && (
        <Section tone={service.sections.length % 2 === 1 ? 'muted' : 'white'} labelledBy="tools-heading">
          <SectionHeading id="tools-heading" eyebrow="Toolkit" title="Tools & technologies" />
          <Tags items={service.tools} label="Tools and technologies" />
        </Section>
      )}

      {related.length > 0 && (
        <Section labelledBy="related-heading">
          <SectionHeading id="related-heading" eyebrow="Proof of work" title="Related case studies" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((study) => (
              <CaseStudyCard key={study.slug} study={study} />
            ))}
          </div>
        </Section>
      )}

      <Section tone="muted" labelledBy="faq-heading">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <SectionHeading id="faq-heading" eyebrow="FAQ" title={`${service.name}: common questions`} />
          <FaqList faqs={service.faqs} />
        </div>
      </Section>

      <CtaBand />

      <nav aria-label="Other services" className="border-t border-slate-200 bg-white py-12">
        <Container>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Other services</p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {others.map((s) => (
              <li key={s.slug}>
                <Link
                  to={`/services/${s.slug}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                >
                  <ServiceIcon icon={s.icon} className="h-5 w-5 flex-none text-blue-700" />
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </nav>
    </div>
  );
}
