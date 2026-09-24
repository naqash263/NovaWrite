import { Suspense } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSEO } from '../../utils/seo';
import { toolAppSchema, howToSchema, faqSchema, breadcrumbSchema } from '../../utils/schema';
import { getTool, getToolBySlug, hubs, toolPath, type ToolContent, type ToolHub } from '../../data/tools';
import { profile } from '../../data/profile';
import { toolComponents } from './toolComponents';
import ToolSidebar from './ToolSidebar';
import NotFound from '../NotFound';
import AdPlacement from '../../components/AdPlacement';
import ApiKeyBanner from '../../components/ApiKeyBanner';
import ApiKeyManager from '../../components/ApiKeyManager';
import { Breadcrumbs, CheckList, FaqList } from '../../components/site/ui';
import { ErrorBoundary } from '../../components/ErrorBoundary';

const processingCopy: Record<ToolContent['processing'], { label: string; text: string }> = {
  browser: { label: 'Runs in your browser', text: 'Your data is processed locally on your device and is never uploaded to our servers.' },
  server: { label: 'Uses a live data service', text: 'Only the values needed for the calculation are sent to a data provider. Nothing is stored.' },
  ai: { label: 'AI-powered', text: 'Your text is sent to an AI model to generate the result. It is not stored or used for training by this site.' },
};

export default function ToolPage({ hub }: { hub: ToolHub }) {
  const { slug } = useParams();
  const tool = getTool(hub, slug);
  if (!tool || !toolComponents[`${hub}/${tool.slug}`]) return <NotFound />;
  return <ToolPageContent key={tool.slug} tool={tool} />;
}

function ToolPageContent({ tool }: { tool: ToolContent }) {
  const hub = hubs[tool.hub];
  const path = toolPath(tool);
  const Tool = toolComponents[`${tool.hub}/${tool.slug}`];
  const related = tool.related.map((s) => getToolBySlug(s)).filter((t): t is ToolContent => Boolean(t));
  const processing = processingCopy[tool.processing];
  const reviewed = new Date(`${tool.reviewed}T00:00:00Z`);

  useSEO({
    title: tool.seoTitle,
    description: tool.seoDescription,
    url: path,
    keywords: tool.keywords,
    jsonLd: [
      toolAppSchema(tool, path),
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Resources', path: '/resources' },
        { name: hub.name, path: `/resources/${tool.hub}` },
        { name: tool.name, path },
      ]),
      ...(tool.howTo.length ? [howToSchema(tool, path)] : []),
      ...(tool.faqs.length ? [faqSchema(tool.faqs)] : []),
    ],
  });

  return (
    <div className="bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-[1280px] px-5 pb-6 pt-6 sm:px-6 lg:px-8">
          <Breadcrumbs
            tone="light"
            items={[
              { name: 'Home', path: '/' },
              { name: 'Resources', path: '/resources' },
              { name: hub.name, path: `/resources/${tool.hub}` },
              { name: tool.name },
            ]}
          />
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-3xl" aria-hidden="true">
              {tool.icon}
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{tool.name}</h1>
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200"
              data-testid="processing-badge"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              Free · No signup · {processing.label}
            </span>
          </div>
          <p className="mt-3 max-w-3xl text-lg leading-relaxed text-slate-600" data-testid="tool-answer">
            {tool.answer || tool.summary}
          </p>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1280px] gap-6 px-5 py-6 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
        <aside className="order-2 lg:order-1">
          <ToolSidebar hub={tool.hub} />
        </aside>

        <div className="order-1 min-w-0 lg:order-2">
          {tool.processing === 'ai' && (
            <div className="mb-4 space-y-4">
              <ApiKeyBanner />
              <ApiKeyManager />
            </div>
          )}
          <AdPlacement position="content-top" />
          <section aria-label={`${tool.name} tool`} data-testid="tool-root" className="min-w-0">
            <ErrorBoundary
              fallback={
                <div role="alert" data-testid="tool-error" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900">
                  <p className="font-semibold">This tool failed to load.</p>
                  <p className="mt-1 text-sm">Please refresh the page. If the problem continues, contact us so we can fix it.</p>
                </div>
              }
            >
              <Suspense
                fallback={
                  <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white" role="status">
                    <span className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" aria-hidden="true" />
                    <span className="sr-only">Loading {tool.name}…</span>
                  </div>
                }
              >
                <Tool />
              </Suspense>
            </ErrorBoundary>
          </section>
          <AdPlacement position="content-bottom" />

          <div className="mt-8 space-y-6">
            {tool.howTo.length > 0 && (
              <section aria-labelledby="how-to-heading" className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                <h2 id="how-to-heading" className="text-2xl font-semibold tracking-tight">
                  How to use the {tool.name}
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
            )}

            {(tool.features.length > 0 || tool.comparison.advantages.length > 0) && (
              <section aria-labelledby="features-heading" className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                <h2 id="features-heading" className="text-2xl font-semibold tracking-tight">
                  Features
                </h2>
                {tool.features.length > 0 && (
                  <div className="mt-5">
                    <CheckList items={tool.features} />
                  </div>
                )}
                {tool.comparison.advantages.length > 0 && (
                  <>
                    <h3 className="mt-8 text-lg font-semibold">Why use this {tool.name.toLowerCase()}</h3>
                    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-slate-700">
                      {tool.comparison.advantages.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  </>
                )}
              </section>
            )}

            {tool.faqs.length > 0 && (
              <section aria-labelledby="faq-heading">
                <h2 id="faq-heading" className="mb-4 text-2xl font-semibold tracking-tight">
                  {tool.name} FAQ
                </h2>
                <FaqList faqs={tool.faqs} />
              </section>
            )}

            {related.length > 0 && (
              <section aria-labelledby="related-heading">
                <h2 id="related-heading" className="mb-4 text-2xl font-semibold tracking-tight">
                  Related tools
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {related.map((r) => (
                    <li key={r.slug}>
                      <Link
                        to={toolPath(r)}
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
            )}

            <footer className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600" data-testid="tool-meta">
              <p>
                <strong className="text-slate-900">Privacy:</strong> {processing.text}
              </p>
              <p className="mt-2">
                Built and reviewed by{' '}
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
    </div>
  );
}
