import { Link, useParams } from 'react-router-dom';
import { useSEO } from '../utils/seo';
import { caseStudies, getCaseStudy } from '../data/caseStudies';
import { getService } from '../data/services';
import { caseStudySchema, breadcrumbSchema } from '../utils/schema';
import NotFound from './NotFound';
import { Container, PageHero, CheckList, FlowSteps, Tags, CtaBand, ArrowRight } from '../components/site/ui';
import type { ReactNode } from 'react';

function Block({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="scroll-mt-28 border-b border-slate-200 py-10 last:border-b-0">
      <h2 id={id} className="mb-5 text-2xl font-semibold tracking-tight text-slate-900">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Paragraphs({ items }: { items: string[] }) {
  return (
    <div className="space-y-4 text-lg leading-relaxed text-slate-600">
      {items.map((p) => (
        <p key={p}>{p}</p>
      ))}
    </div>
  );
}

export default function CaseStudyDetail() {
  const { slug } = useParams();
  const study = getCaseStudy(slug);
  if (!study) return <NotFound />;
  return <CaseStudyPage key={study.slug} slug={study.slug} />;
}

function CaseStudyPage({ slug }: { slug: string }) {
  const study = getCaseStudy(slug)!;
  const index = caseStudies.findIndex((c) => c.slug === study.slug);
  const prev = caseStudies[(index - 1 + caseStudies.length) % caseStudies.length];
  const next = caseStudies[(index + 1) % caseStudies.length];
  const relatedServices = study.services.map((s) => getService(s)).filter(Boolean);

  useSEO({
    title: study.seoTitle,
    description: study.seoDescription,
    url: `/case-studies/${study.slug}`,
    type: 'website',
    keywords: study.keywords,
    jsonLd: [
      caseStudySchema(study),
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Case Studies', path: '/case-studies' },
        { name: study.name, path: `/case-studies/${study.slug}` },
      ]),
    ],
  });

  const facts = [
    { label: 'Industry', value: study.industry },
    study.location ? { label: 'Location', value: study.location } : null,
    study.role ? { label: 'My role', value: study.role } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <article className="bg-white text-slate-900">
      <PageHero
        eyebrow={`Case study · Project ${study.number}`}
        title={study.name}
        lead={study.tagline}
        breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Case Studies', path: '/case-studies' }, { name: study.name }]}
      >
        <dl className="mt-8 grid max-w-3xl gap-4 sm:grid-cols-3">
          {facts.map((f) => (
            <div key={f.label} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <dt className="text-xs uppercase tracking-wider text-slate-400">{f.label}</dt>
              <dd className="mt-1 font-medium text-white">{f.value}</dd>
            </div>
          ))}
        </dl>
      </PageHero>

      <Container className="grid gap-12 py-8 lg:grid-cols-[1fr_300px]">
        <div>
          <Block id="overview" title="Overview">
            <Paragraphs items={study.overview} />
          </Block>

          {study.problem && (
            <Block id="problem" title="Business problem">
              <Paragraphs items={study.problem} />
            </Block>
          )}

          {study.objectives && (
            <Block id="objectives" title="Objectives">
              <CheckList items={study.objectives} columns={1} />
            </Block>
          )}

          {study.responsibilities && (
            <Block id="role" title="My role">
              <CheckList items={study.responsibilities} />
            </Block>
          )}

          {study.components && (
            <Block id="solution" title={study.components.heading}>
              <CheckList items={study.components.items} />
            </Block>
          )}

          {study.workflow && (
            <Block id="workflow" title={study.workflow.heading}>
              <FlowSteps steps={study.workflow.steps} />
            </Block>
          )}

          {study.sections.map((section, i) => (
            <Block key={section.heading} id={`detail-${i}`} title={section.heading}>
              {section.body && <Paragraphs items={section.body} />}
              {section.list && (
                <div className={section.body ? 'mt-5' : ''}>
                  <CheckList items={section.list} />
                </div>
              )}
            </Block>
          ))}

          <Block id="stack" title="Technology stack">
            <Tags items={study.stack} label="Technology stack" />
          </Block>

          <Block id="outcome" title="Outcome">
            <Paragraphs items={study.outcome} />
            <p className="mt-4 text-sm text-slate-500">Performance figures are published only where verified evidence exists.</p>
          </Block>
        </div>

        <aside className="lg:pt-10">
          <div className="sticky top-32 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Services used</h2>
              <ul className="mt-4 space-y-2">
                {relatedServices.map((s) => (
                  <li key={s!.slug}>
                    <Link to={`/services/${s!.slug}`} className="font-medium text-blue-700 hover:text-blue-800">
                      {s!.name}
                      <ArrowRight className="ml-1 inline h-3.5 w-3.5 align-[-2px]" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-slate-950 p-6 text-white">
              <p className="font-semibold">Planning something similar?</p>
              <p className="mt-2 text-sm text-slate-300">Let&apos;s talk through the business process first.</p>
              <Link to="/contact" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-blue-50">
                Discuss a project <ArrowRight />
              </Link>
            </div>
          </div>
        </aside>
      </Container>

      <nav aria-label="More case studies" className="border-t border-slate-200 bg-slate-50">
        <Container className="grid gap-4 py-10 sm:grid-cols-2">
          <Link to={`/case-studies/${prev.slug}`} rel="prev" className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-300">
            <span className="text-xs uppercase tracking-wider text-slate-500">Previous</span>
            <span className="mt-1 block font-semibold text-slate-900">{prev.name}</span>
          </Link>
          <Link to={`/case-studies/${next.slug}`} rel="next" className="rounded-2xl border border-slate-200 bg-white p-5 text-right transition hover:border-blue-300">
            <span className="text-xs uppercase tracking-wider text-slate-500">Next</span>
            <span className="mt-1 block font-semibold text-slate-900">{next.name}</span>
          </Link>
        </Container>
      </nav>

      <CtaBand />
    </article>
  );
}
