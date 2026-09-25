import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../../utils/seo';
import { breadcrumbSchema, faqSchema, PERSON_ID } from '../../utils/schema';
import { SITE_URL, profile } from '../../data/profile';
import { careerTools, getCareerTool } from '../../data/careerTools';
import { Breadcrumbs, FaqList } from '../site/ui';
import ApiKeyManager from '../ApiKeyManager';
import AdPlacement from '../AdPlacement';

const privacyCopy = {
  ai: 'The details you enter are sent to this site’s AI service only to generate your result. Avoid entering sensitive personal data such as ID numbers or your home address.',
  mixed:
    'Your CV is autosaved in your own browser so you can return to it. Editing and exports happen on your device; only the optional AI upload and tailoring features send data to the server.',
} as const;

/**
 * Page shell for the career tools at /resources/{slug}: owns the single H1, the
 * answer-first intro, SEO + JSON-LD (WebApplication, BreadcrumbList, HowTo, FAQPage),
 * the visible how-to, FAQ, related tools and the reviewer line.
 */
export default function CareerToolLayout({ slug, children }: { slug: string; children: ReactNode }) {
  const tool = getCareerTool(slug);
  const path = `/resources/${tool.slug}`;
  const url = `${SITE_URL}${path}`;
  const related = tool.related.map((s) => careerTools.find((t) => t.slug === s)).filter((t): t is (typeof careerTools)[number] => Boolean(t));
  const reviewed = new Date(`${tool.reviewed}T00:00:00Z`);

  useSEO({
    title: tool.seoTitle,
    description: tool.seoDescription,
    url: path,
    keywords: tool.keywords,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        '@id': `${url}#app`,
        name: tool.h1,
        url,
        description: tool.seoDescription,
        abstract: tool.answer,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Any (runs in a web browser)',
        browserRequirements: 'Requires JavaScript',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        featureList: tool.features,
        keywords: tool.keywords.join(', '),
        dateModified: tool.reviewed,
        author: { '@id': PERSON_ID, '@type': 'Person', name: profile.name, url: `${SITE_URL}/about` },
        publisher: { '@id': PERSON_ID },
        inLanguage: 'en',
      },
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Resources', path: '/resources' },
        { name: tool.name, path },
      ]),
      {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: `How to use the ${tool.h1}`,
        description: tool.summary,
        step: tool.howTo.map((text, i) => ({
          '@type': 'HowToStep',
          position: i + 1,
          name: text.split(/[.:,]/)[0].slice(0, 80),
          text,
          url: `${url}#how-to-step-${i + 1}`,
        })),
      },
      faqSchema(tool.faqs),
    ],
  });

  return (
    <div className="bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-[1280px] px-4 pb-6 pt-6 sm:px-6 lg:px-8">
          <Breadcrumbs
            tone="light"
            items={[
              { name: 'Home', path: '/' },
              { name: 'Resources', path: '/resources' },
              { name: tool.name },
            ]}
          />
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-3xl" aria-hidden="true">
              {tool.icon}
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{tool.h1}</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              Free · No signup · {tool.processing === 'ai' ? 'AI-powered' : 'Autosaves in your browser'}
            </span>
          </div>
          <p className="mt-3 max-w-3xl text-lg leading-relaxed text-slate-600" data-testid="tool-answer">
            {tool.answer}
          </p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <ApiKeyManager />
        </div>

        <section aria-label={`${tool.h1} tool`} data-testid="tool-root" className="min-w-0">
          {children}
        </section>

        {/* The CV builder places its own ad units; the other career tools share these two. */}
        {slug !== 'cv-builder' && <AdPlacement position="content-bottom" className="mt-10" />}

        <div className="mt-10 space-y-6">
          <section aria-labelledby="how-to-heading" className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 id="how-to-heading" className="text-2xl font-semibold tracking-tight">
              How to use the {tool.h1}
            </h2>
            <ol className="mt-5 space-y-3">
              {tool.howTo.map((step, i) => (
                <li key={step} id={`how-to-step-${i + 1}`} className="flex gap-4">
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-blue-50 font-mono text-xs font-semibold text-blue-800 ring-1 ring-blue-100">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 leading-relaxed text-slate-700">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {slug !== 'cv-builder' && <AdPlacement position="content-middle" />}

          <section aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="mb-4 text-2xl font-semibold tracking-tight">
              {tool.name} FAQ
            </h2>
            <FaqList faqs={tool.faqs} />
          </section>

          <section aria-labelledby="related-heading">
            <h2 id="related-heading" className="mb-4 text-2xl font-semibold tracking-tight">
              Related career tools
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-testid="related-tools">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    to={`/resources/${r.slug}`}
                    className="flex h-full gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-sm"
                  >
                    <span className="text-xl" aria-hidden="true">
                      {r.icon}
                    </span>
                    <span>
                      <span className="block font-semibold text-slate-900">{r.name}</span>
                      <span className="mt-0.5 block text-sm text-slate-600">{r.summary}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <footer className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600" data-testid="tool-meta">
            <p>
              <strong className="text-slate-900">Privacy:</strong> {privacyCopy[tool.processing]}
            </p>
            <p className="mt-2">
              Reviewed by{' '}
              <Link to="/about" className="font-medium text-blue-700 hover:text-blue-800">
                {profile.name}
              </Link>
              , {profile.title}. Last reviewed{' '}
              <time dateTime={tool.reviewed}>
                {reviewed.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}
              </time>
              .
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
