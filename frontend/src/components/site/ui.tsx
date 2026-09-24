// Shared building blocks for the marketing pages (Home, About, Services, Case Studies).
// Uses arbitrary max-width values on purpose: index.css overrides .max-w-7xl & co.
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Service } from '../../data/services';
import type { CaseStudy } from '../../data/caseStudies';

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1200px] px-5 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

export function Section({
  children,
  className = '',
  tone = 'white',
  id,
  labelledBy,
}: {
  children: ReactNode;
  className?: string;
  tone?: 'white' | 'muted' | 'dark';
  id?: string;
  labelledBy?: string;
}) {
  const tones = {
    white: 'bg-white',
    muted: 'bg-slate-50 border-y border-slate-200/70',
    dark: 'bg-slate-950 text-white',
  };
  return (
    <section id={id} aria-labelledby={labelledBy} className={`py-16 sm:py-20 ${tones[tone]} ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}

export function Eyebrow({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <p className={`mb-3 text-xs font-semibold uppercase tracking-[0.16em] ${dark ? 'text-sky-300' : 'text-blue-700'}`}>
      {children}
    </p>
  );
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  intro,
  dark = false,
  align = 'left',
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  intro?: string;
  dark?: boolean;
  align?: 'left' | 'center';
}) {
  return (
    <div className={`mb-10 max-w-3xl ${align === 'center' ? 'mx-auto text-center' : ''}`}>
      {eyebrow && <Eyebrow dark={dark}>{eyebrow}</Eyebrow>}
      <h2 id={id} className={`text-3xl font-semibold tracking-tight sm:text-4xl ${dark ? 'text-white' : 'text-slate-900'}`}>
        {title}
      </h2>
      {intro && <p className={`mt-4 text-lg leading-relaxed ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{intro}</p>}
    </div>
  );
}

const iconPaths: Record<Service['icon'], string> = {
  pm: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  ai: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  seo: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7',
  crm: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  qa: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  saas: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z',
};

export function ServiceIcon({ icon, className = 'h-6 w-6' }: { icon: Service['icon']; className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={iconPaths[icon]} />
    </svg>
  );
}

export function ArrowRight({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  );
}

export function ServiceCard({ service }: { service: Service }) {
  return (
    <Link
      to={`/services/${service.slug}`}
      data-testid="service-card"
      className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
    >
      <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
        <ServiceIcon icon={service.icon} />
      </span>
      <h3 className="text-lg font-semibold text-slate-900">{service.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{service.summary}</p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700">
        Learn more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export function CaseStudyCard({ study }: { study: CaseStudy }) {
  return (
    <Link
      to={`/case-studies/${study.slug}`}
      data-testid="case-study-card"
      className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="font-mono text-xs font-semibold text-slate-400">Project {study.number}</span>
        <span className="truncate rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{study.industry}</span>
      </div>
      <h3 className="text-xl font-semibold text-slate-900 group-hover:text-blue-700">{study.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{study.tagline}</p>
      <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Technologies">
        {study.stack.slice(0, 4).map((tech) => (
          <li key={tech} className="rounded-md border border-slate-200 px-2 py-0.5 text-xs text-slate-600">
            {tech}
          </li>
        ))}
      </ul>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700">
        Read case study <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

/** Renders a "A → B → C" process as an ordered, wrapping flow. */
export function FlowSteps({ steps, dark = false }: { steps: string[]; dark?: boolean }) {
  return (
    <ol className="flex flex-wrap items-center gap-2" data-testid="flow-steps">
      {steps.map((step, i) => (
        <li key={step} className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              dark ? 'border-white/15 bg-white/5 text-slate-100' : 'border-slate-200 bg-white text-slate-700 shadow-sm'
            }`}
          >
            <span className={`font-mono text-[11px] ${dark ? 'text-sky-300' : 'text-blue-700'}`}>{String(i + 1).padStart(2, '0')}</span>
            {step}
          </span>
          {i < steps.length - 1 && (
            <svg className={`h-4 w-4 flex-none ${dark ? 'text-slate-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </li>
      ))}
    </ol>
  );
}

export function CheckList({ items, columns = 2 }: { items: string[]; columns?: 1 | 2 | 3 }) {
  const cols = { 1: '', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3' }[columns];
  return (
    <ul className={`grid gap-x-8 gap-y-2.5 ${cols}`}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-slate-700">
          <svg className="mt-1 h-4 w-4 flex-none text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function Tags({ items, label }: { items: string[]; label: string }) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label={label}>
      {items.map((item) => (
        <li key={item} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700">
          {item}
        </li>
      ))}
    </ul>
  );
}

export function Breadcrumbs({ items, tone = 'dark' }: { items: { name: string; path?: string }[]; tone?: 'dark' | 'light' }) {
  const styles =
    tone === 'dark'
      ? { list: 'text-slate-400', link: 'hover:text-white', current: 'text-slate-200' }
      : { list: 'text-slate-500', link: 'hover:text-slate-900', current: 'text-slate-900' };
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className={`flex flex-wrap items-center gap-1.5 text-sm ${styles.list}`}>
        {items.map((item, i) => (
          <li key={item.name} className="flex items-center gap-1.5">
            {item.path ? (
              <Link to={item.path} className={styles.link}>
                {item.name}
              </Link>
            ) : (
              <span aria-current="page" className={styles.current}>
                {item.name}
              </span>
            )}
            {i < items.length - 1 && <span aria-hidden="true">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHero({
  eyebrow,
  title,
  lead,
  breadcrumbs,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  breadcrumbs?: { name: string; path?: string }[];
  children?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden bg-slate-950 pb-16 pt-12 text-white sm:pb-20 sm:pt-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: 'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-blue-600/25 blur-3xl" />
      <Container className="relative">
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
        {eyebrow && <Eyebrow dark>{eyebrow}</Eyebrow>}
        <h1 className="max-w-[56rem] text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        {lead && <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-300">{lead}</p>}
        {children}
      </Container>
    </header>
  );
}

export function CtaBand({
  title = 'Have a process that should be automated?',
  text = 'Whether you are planning an AI project, implementing a CRM, developing a SaaS product, improving software quality or search visibility, or connecting disconnected business systems, I can help you move from idea to a structured, tested, and deployable solution.',
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section aria-labelledby="cta-heading" className="bg-white py-16 sm:py-20">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 to-slate-900 px-6 py-12 text-white sm:px-12">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />
          <div className="relative max-w-3xl">
            <h2 id="cta-heading" className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {title}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-blue-100">{text}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-slate-900 transition hover:bg-blue-50"
              >
                Let&apos;s discuss your project <ArrowRight />
              </Link>
              <Link
                to="/case-studies"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Explore projects
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export function FaqList({ faqs }: { faqs: { question: string; answer: string }[] }) {
  return (
    <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
      {faqs.map((faq) => (
        <details key={faq.question} className="group p-6 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
            <h3 className="text-base font-semibold text-slate-900">{faq.question}</h3>
            <span className="mt-0.5 flex-none text-slate-400 transition group-open:rotate-45" aria-hidden="true">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </span>
          </summary>
          <p className="mt-3 leading-relaxed text-slate-600">{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}
