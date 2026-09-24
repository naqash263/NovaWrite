import { useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useSEO } from '../../utils/seo';
import { breadcrumbSchema, faqSchema, toolHubSchema } from '../../utils/schema';
import { categoryLabels, getLegacyTool, hubs, toolPath, toolsInHub, type ToolHub } from '../../data/tools';
import { Container, FaqList, PageHero } from '../../components/site/ui';
import AdPlacement from '../../components/AdPlacement';

const hubFaqs: Record<ToolHub, { question: string; answer: string }[]> = {
  'utility-tools': [
    { question: 'Are these tools free?', answer: 'Yes. Every tool is free to use with no signup, no watermark and no usage limit.' },
    {
      question: 'Are my files uploaded to a server?',
      answer: 'No for most tools. PDF, image, text and developer tools run entirely in your browser, so files never leave your device. Each tool page states how it processes data.',
    },
    { question: 'Do the tools work on mobile?', answer: 'Yes. All tools are responsive and work in modern mobile and desktop browsers.' },
  ],
  'conversion-tools': [
    { question: 'Are the conversions accurate?', answer: 'Unit conversions use exact international definitions (for example 1 inch = 2.54 cm). Currency rates come from a live exchange-rate feed and can differ slightly from your bank.' },
    { question: 'Do I need to press a button to convert?', answer: 'No. Results update instantly as you type.' },
    { question: 'Are the converters free?', answer: 'Yes. All converters and calculators are free with no signup.' },
  ],
  'ai-tools': [
    { question: 'Which AI model powers these tools?', answer: 'The tools use Google Gemini models through this site’s API. You can also add your own API key for higher limits.' },
    { question: 'Is my text stored?', answer: 'No. Text is sent to the AI model only to generate your result and is not stored by this site.' },
    { question: 'Should I check AI output?', answer: 'Yes. AI can make mistakes, so review summaries, rewrites and translations before publishing them.' },
  ],
};

export default function ToolHubPage({ hub }: { hub: ToolHub }) {
  const [params] = useSearchParams();
  const legacy = getLegacyTool(hub, params.get('tool'));
  if (legacy) return <Navigate to={toolPath(legacy)} replace />;
  return <HubContent key={hub} hub={hub} />;
}

function HubContent({ hub }: { hub: ToolHub }) {
  const info = hubs[hub];
  const tools = useMemo(() => toolsInHub(hub), [hub]);
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const visible = q ? tools.filter((t) => `${t.name} ${t.summary} ${t.keywords.join(' ')}`.toLowerCase().includes(q)) : tools;
  const path = `/resources/${hub}`;

  useSEO({
    title: info.seoTitle,
    description: info.seoDescription,
    url: path,
    keywords: tools.slice(0, 12).map((t) => t.name.toLowerCase()),
    jsonLd: [
      toolHubSchema(info, tools),
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Resources', path: '/resources' },
        { name: info.name, path },
      ]),
      faqSchema(hubFaqs[hub]),
    ],
  });

  return (
    <div className="bg-slate-50 text-slate-900">
      <PageHero
        eyebrow={`${tools.length} free tools`}
        title={info.h1}
        lead={info.intro}
        breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Resources', path: '/resources' }, { name: info.name }]}
      >
        <div className="mt-8 max-w-xl">
          <label htmlFor="hub-search" className="sr-only">
            Search {info.name.toLowerCase()}
          </label>
          <input
            id="hub-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${tools.length} tools…`}
            className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
          />
        </div>
      </PageHero>

      <Container className="py-10">
        <p className="mb-8 max-w-3xl leading-relaxed text-slate-600" data-testid="hub-answer">
          {info.answer}
        </p>
        <AdPlacement position="content-top" />
        {info.categories.map((category) => {
          const items = visible.filter((t) => t.category === category);
          if (!items.length) return null;
          return (
            <section key={category} aria-labelledby={`cat-${category}`} className="mb-10">
              <h2 id={`cat-${category}`} className="mb-4 text-xl font-semibold tracking-tight">
                {categoryLabels[category]}
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((tool) => (
                  <li key={tool.slug}>
                    <Link
                      to={toolPath(tool)}
                      data-testid="tool-card"
                      className="group flex h-full gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                    >
                      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-slate-50 text-2xl ring-1 ring-slate-200" aria-hidden="true">
                        {tool.icon}
                      </span>
                      <span>
                        <span className="block font-semibold text-slate-900 group-hover:text-blue-700">{tool.name}</span>
                        <span className="mt-1 block text-sm leading-relaxed text-slate-600">{tool.summary}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        {!visible.length && (
          <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            No tools match &ldquo;{query}&rdquo;. Try another word.
          </p>
        )}

        <section aria-labelledby="hub-faq" className="mt-4 max-w-3xl">
          <h2 id="hub-faq" className="mb-4 text-xl font-semibold tracking-tight">
            Frequently asked questions
          </h2>
          <FaqList faqs={hubFaqs[hub]} />
        </section>

        <nav aria-label="Other tool collections" className="mt-10 flex flex-wrap gap-3">
          {(Object.keys(hubs) as ToolHub[])
            .filter((h) => h !== hub)
            .map((h) => (
              <Link key={h} to={`/resources/${h}`} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700">
                {hubs[h].name} →
              </Link>
            ))}
          <Link to="/resources" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700">
            All resources →
          </Link>
        </nav>
      </Container>
    </div>
  );
}
