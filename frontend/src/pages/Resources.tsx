import { Link } from 'react-router-dom';
import { useSEO } from '../utils/seo';
import { breadcrumbSchema, faqSchema, itemListSchema } from '../utils/schema';
import { allTools, hubs, toolPath, toolsInHub, type ToolHub } from '../data/tools';
import { careerTools } from '../data/careerTools';
import { Container, FaqList, PageHero, ArrowRight } from '../components/site/ui';
import AdPlacement from '../components/AdPlacement';

const popularSlugs = [
  'pdf-merger',
  'image-compressor',
  'json-formatter',
  'password-generator',
  'qr-code-generator',
  'word-counter',
  'currency-converter',
  'percentage-calculator',
  'text-summarizer',
  'grammar-checker',
  'loan-calculator',
  'regex-tester',
];

const faqs = [
  { question: 'Are these tools really free?', answer: 'Yes. Every tool on this page is free, with no signup, no watermark and no usage cap.' },
  {
    question: 'Do the tools upload my files?',
    answer: 'Most utility tools (PDF, image, text and developer tools) run entirely in your browser, so files never leave your device. AI tools send text to an AI model to generate results. Each tool page states how it handles data.',
  },
  { question: 'Who builds and maintains these tools?', answer: 'The tools are built and tested by Naqash Thaheem, a Technical Project Manager and QA automation specialist. Each tool is covered by automated browser tests.' },
  { question: 'Can I use the tools on my phone?', answer: 'Yes. All tools are responsive and work in current mobile and desktop browsers.' },
];

const hubOrder: ToolHub[] = ['utility-tools', 'conversion-tools', 'ai-tools'];

export default function Resources() {
  const popular = popularSlugs.map((slug) => allTools.find((t) => t.slug === slug)).filter((t): t is (typeof allTools)[number] => Boolean(t));
  const total = allTools.length + careerTools.length;

  useSEO({
    title: 'Free Online Tools & Career Resources | Naqash Thaheem',
    description: `${total} free online tools: PDF and image utilities, developer formatters, unit converters, AI writing tools and career tools like a CV builder. No signup.`,
    url: '/resources',
    keywords: ['free online tools', 'pdf tools', 'unit converter', 'ai writing tools', 'cv builder', 'developer tools'],
    jsonLd: [
      itemListSchema('Free tools and resources', [
        ...hubOrder.map((h) => ({ name: hubs[h].name, path: `/resources/${h}` })),
        ...careerTools.map((c) => ({ name: c.name, path: `/resources/${c.slug}` })),
      ]),
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Resources', path: '/resources' },
      ]),
      faqSchema(faqs),
    ],
  });

  return (
    <div className="bg-slate-50 text-slate-900">
      <PageHero
        eyebrow={`${total} free tools`}
        title="Free Online Tools & Career Resources"
        lead="Practical, tested tools for documents, images, development, conversions, AI writing and your career. No signup, no watermarks, and most tools run entirely in your browser."
        breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Resources' }]}
      />

      <Container className="py-12">
        <section aria-labelledby="collections-heading">
          <h2 id="collections-heading" className="mb-5 text-2xl font-semibold tracking-tight">
            Tool collections
          </h2>
          <ul className="grid gap-5 md:grid-cols-3">
            {hubOrder.map((h) => {
              const tools = toolsInHub(h);
              return (
                <li key={h}>
                  <Link
                    to={`/resources/${h}`}
                    data-testid="hub-card"
                    className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg"
                  >
                    <span className="text-sm font-medium text-blue-700">{tools.length} tools</span>
                    <span className="mt-1 text-xl font-semibold text-slate-900 group-hover:text-blue-700">{hubs[h].name}</span>
                    <span className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{hubs[h].intro}</span>
                    <span className="mt-4 text-sm text-slate-500">{tools.slice(0, 4).map((t) => t.name).join(' · ')}</span>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700">
                      Browse {hubs[h].name.toLowerCase()} <ArrowRight />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="my-10">
          <AdPlacement position="content-top" />
        </div>

        <section aria-labelledby="popular-heading">
          <h2 id="popular-heading" className="mb-5 text-2xl font-semibold tracking-tight">
            Popular tools
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {popular.map((tool) => (
              <li key={tool.slug}>
                <Link to={toolPath(tool)} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-blue-300">
                  <span className="text-xl" aria-hidden="true">
                    {tool.icon}
                  </span>
                  <span className="font-medium text-slate-800">{tool.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="career-heading" className="mt-12">
          <h2 id="career-heading" className="mb-2 text-2xl font-semibold tracking-tight">
            Career tools
          </h2>
          <p className="mb-5 text-slate-600">Build your CV, prepare for interviews and plan your next career move.</p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {careerTools.map((tool) => (
              <li key={tool.slug}>
                <Link
                  to={`/resources/${tool.slug}`}
                  data-testid="career-card"
                  className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-md"
                >
                  <span className="text-2xl" aria-hidden="true">
                    {tool.icon}
                  </span>
                  <span className="mt-3 font-semibold text-slate-900">{tool.name}</span>
                  <span className="mt-1 text-sm leading-relaxed text-slate-600">{tool.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="resources-faq" className="mt-12 max-w-3xl">
          <h2 id="resources-faq" className="mb-4 text-2xl font-semibold tracking-tight">
            Frequently asked questions
          </h2>
          <FaqList faqs={faqs} />
        </section>
      </Container>
    </div>
  );
}
