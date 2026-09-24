import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/axios';
import { PostCard } from '../components/PostCard';
import { useSEO } from '../utils/seo';
import { pageMeta } from '../data/pageMeta';
import { useHomeSettings } from '../hooks/useHomeSettings';
import { hero, profile, disciplines, experienceAreas, processSteps, automationQuestions, problemsSolved, industries, faqs } from '../data/profile';
import { services } from '../data/services';
import { featuredCaseStudies } from '../data/caseStudies';
import { personSchema, websiteSchema, businessSchema, faqSchema } from '../utils/schema';
import {
  Container,
  Section,
  SectionHeading,
  ServiceCard,
  CaseStudyCard,
  CheckList,
  Tags,
  FaqList,
  CtaBand,
  ArrowRight,
  Eyebrow,
} from '../components/site/ui';

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featured_image?: string;
  published_at: string;
  category: { id: number; name: string };
  user: { name: string };
}

const frameworkPillars = [
  { title: 'Business', text: 'Solve the correct problem, with clear ownership and measurable outcomes.' },
  { title: 'Project Management', text: 'Scope, milestones, risks, stakeholders, change control and UAT.' },
  { title: 'Technology', text: 'AI, automation, APIs, CRM, SaaS and cloud that fit existing operations.' },
  { title: 'Quality', text: 'Automated and manual testing so releases are reliable and maintainable.' },
];

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const { getSettingValue, getBooleanSetting } = useHomeSettings();

  useSEO({
    title: pageMeta.home.title,
    description: pageMeta.home.description,
    url: pageMeta.home.path,
    keywords: pageMeta.home.keywords,
    jsonLd: [personSchema(), websiteSchema(), businessSchema(services), faqSchema(faqs)],
  });

  useEffect(() => {
    let active = true;
    apiClient
      .get('/posts?per_page=3')
      .then((response) => {
        if (active) setPosts(response.data?.data || []);
      })
      .catch(() => {
        /* Blog is optional on the landing page */
      });
    return () => {
      active = false;
    };
  }, []);

  const notificationTone: Record<string, string> = {
    success: 'bg-emerald-700',
    warning: 'bg-amber-600',
    error: 'bg-red-700',
  };

  return (
    <div className="bg-white text-slate-900">
      {getBooleanSetting('notification_enabled', false) && (
        <div role="status" className={`${notificationTone[getSettingValue('notification_type', 'info')] || 'bg-blue-700'} px-4 py-3 text-center text-sm font-medium text-white`}>
          {getSettingValue('notification_message', '')}
        </div>
      )}

      {/* Hero */}
      <section aria-labelledby="hero-heading" className="relative overflow-hidden bg-slate-950 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        <div aria-hidden="true" className="pointer-events-none absolute -top-48 left-1/3 h-[28rem] w-[28rem] rounded-full bg-blue-600/30 blur-3xl" />
        <Container className="relative grid gap-12 py-20 sm:py-24 lg:grid-cols-[1.35fr_1fr] lg:items-center lg:py-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
              Available for new projects · {profile.location}
            </div>
            <h1 id="hero-heading">
              <span className="block text-base font-medium text-sky-300 sm:text-lg">
                {profile.name}: Technical Project Manager, AI Automation &amp; Business Systems Specialist
              </span>
              <span className="mt-4 block text-5xl font-semibold tracking-tight sm:text-6xl">{hero.title}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">{hero.subtitle}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/case-studies"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:bg-blue-500"
              >
                Explore projects <ArrowRight />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10"
              >
                Discuss a project
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-300">One delivery framework</p>
            <p className="mt-2 text-slate-300">Instead of treating AI, automation, CRM, QA and project management as isolated disciplines, I combine them.</p>
            <ul className="mt-6 space-y-4">
              {frameworkPillars.map((pillar, i) => (
                <li key={pillar.title} className="flex gap-4">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-blue-600/20 font-mono text-xs text-sky-300 ring-1 ring-blue-400/30">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-white">{pillar.title}</p>
                    <p className="text-sm text-slate-400">{pillar.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Container>
        <div className="relative border-t border-white/10">
          <Container className="py-5">
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-400" aria-label="Disciplines">
              {disciplines.map((d) => (
                <li key={d} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-sky-400" aria-hidden="true" />
                  {d}
                </li>
              ))}
            </ul>
          </Container>
        </div>
      </section>

      {/* Featured expertise */}
      <Section labelledBy="expertise-heading">
        <SectionHeading
          id="expertise-heading"
          eyebrow="Featured expertise"
          title="Services that take technology from idea to production"
          intro="Six connected capabilities, one accountable delivery partner."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.slug} service={service} />
          ))}
        </div>
      </Section>

      {/* About teaser */}
      <Section tone="muted" labelledBy="about-heading">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow>About</Eyebrow>
            <h2 id="about-heading" className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Not simply building software
            </h2>
            {profile.intro.map((p) => (
              <p key={p} className="mt-4 text-lg leading-relaxed text-slate-600">
                {p}
              </p>
            ))}
            <Link to="/about" className="mt-6 inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:text-blue-800">
              More about my background <ArrowRight />
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h3 className="mb-5 text-lg font-semibold text-slate-900">Project experience includes</h3>
            <CheckList items={experienceAreas} />
          </div>
        </div>
      </Section>

      {/* Featured case studies */}
      <Section labelledBy="projects-heading">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <SectionHeading
            id="projects-heading"
            eyebrow="Featured projects"
            title="Case studies"
            intro="Restaurant SaaS, hospitality, recruitment, sales operations, events and lead generation: real delivery across industries."
          />
          <Link to="/case-studies" className="mb-10 inline-flex flex-none items-center gap-1.5 font-semibold text-blue-700 hover:text-blue-800">
            All case studies <ArrowRight />
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredCaseStudies.map((study) => (
            <CaseStudyCard key={study.slug} study={study} />
          ))}
        </div>
      </Section>

      {/* Process */}
      <Section tone="muted" labelledBy="process-heading">
        <SectionHeading
          id="process-heading"
          eyebrow="How I work"
          title="A structured delivery lifecycle"
          intro="Every engagement follows the same nine stages, scaled to the size of the project."
        />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {processSteps.map((s) => (
            <li key={s.step} className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="font-mono text-xs font-semibold text-blue-700">{s.step}</p>
              <h3 className="mt-1 font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">
                {s.verb}: {s.items.slice(0, 4).join(', ').toLowerCase()}
                {s.items.length > 4 ? '…' : ''}
              </p>
            </li>
          ))}
        </ol>
        <Link to="/about#process" className="mt-8 inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:text-blue-800">
          See the full methodology <ArrowRight />
        </Link>
      </Section>

      {/* Automation approach */}
      <Section tone="dark" labelledBy="approach-heading">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <Eyebrow dark>My approach to automation</Eyebrow>
            <h2 id="approach-heading" className="text-3xl font-semibold tracking-tight sm:text-4xl">
              The process comes before the tool
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-slate-300">
              I don&apos;t begin an automation project by asking <em>&ldquo;Which AI tool should we use?&rdquo;</em> I start with{' '}
              <strong className="text-white">&ldquo;What business process are we trying to improve?&rdquo;</strong>
            </p>
            <p className="mt-4 leading-relaxed text-slate-400">Only after understanding these areas do I select the technology.</p>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2">
            {automationQuestions.map((q, i) => (
              <li key={q} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <span className="font-mono text-xs text-sky-300">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-slate-100">{q}</span>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* Problems */}
      <Section labelledBy="problems-heading">
        <SectionHeading
          id="problems-heading"
          eyebrow="Problems I help solve"
          title="Sound familiar?"
          intro="I can help when a company says:"
        />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {problemsSolved.map((p) => (
            <li key={p} className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-700">
              &ldquo;{p}&rdquo;
            </li>
          ))}
        </ul>
        <div className="mt-12">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Industries</h3>
          <Tags items={industries} label="Industries" />
        </div>
      </Section>

      {/* Latest insights */}
      {posts.length > 0 && (
        <Section tone="muted" labelledBy="insights-heading">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <SectionHeading id="insights-heading" eyebrow="Blog" title="Latest insights" intro="Notes on automation, AI, SEO and delivery." />
            <Link to="/blog" className="mb-10 inline-flex flex-none items-center gap-1.5 font-semibold text-blue-700 hover:text-blue-800">
              View all posts <ArrowRight />
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </Section>
      )}

      {/* FAQ */}
      <Section labelledBy="faq-heading">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <SectionHeading id="faq-heading" eyebrow="FAQ" title="Frequently asked questions" />
          <FaqList faqs={faqs} />
        </div>
      </Section>

      <CtaBand />
    </div>
  );
}
