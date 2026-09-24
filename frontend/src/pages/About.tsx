import { useSEO } from '../utils/seo';
import { profile, backgroundPillars, processSteps, skillGroups, deliveryPrinciples, industries } from '../data/profile';
import { personSchema, breadcrumbSchema } from '../utils/schema';
import { Section, SectionHeading, PageHero, CheckList, Tags, CtaBand, Eyebrow } from '../components/site/ui';

export default function About() {
  useSEO({
    title: 'About Naqash Thaheem | Technical Project Manager, UAE',
    description:
      'Naqash Thaheem is a UAE-based Technical Project Manager combining project management, AI automation, CRM, technical SEO and QA to deliver business systems.',
    url: '/about',
    keywords: ['Naqash Thaheem', 'technical project manager UAE', 'AI automation specialist', 'business systems specialist'],
    jsonLd: [
      { ...personSchema(), mainEntityOfPage: 'https://naqashthaheem.com/about' },
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'About', path: '/about' },
      ]),
    ],
  });

  return (
    <div className="bg-white text-slate-900">
      <PageHero
        eyebrow="About"
        title="Business + Project Management + Technology + Quality"
        lead={`${profile.summary} ${profile.shortVersion}`}
        breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'About' }]}
      />

      <Section labelledBy="about-me-heading">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <SectionHeading id="about-me-heading" eyebrow="About me" title="From initial requirements through deployment" />
            <div className="space-y-4 text-lg leading-relaxed text-slate-600">
              <p>
                I am a technology and project management professional with experience managing and implementing digital solutions from initial
                requirements through deployment.
              </p>
              {profile.intro.map((p) => (
                <p key={p}>{p}</p>
              ))}
              <p>
                This combination allows me to communicate with both business stakeholders and technical teams while keeping the project focused on
                measurable business outcomes.
              </p>
            </div>
          </div>
          <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8" aria-labelledby="positioning-heading">
            <h3 id="positioning-heading" className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              At a glance
            </h3>
            <dl className="mt-5 space-y-4">
              <div>
                <dt className="text-sm text-slate-500">Role</dt>
                <dd className="font-semibold text-slate-900">{profile.headline}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Based in</dt>
                <dd className="font-semibold text-slate-900">{profile.location}, working with clients remotely</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Best fit</dt>
                <dd className="text-slate-700">
                  Projects where technology needs to connect multiple systems or departments.
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </Section>

      <Section tone="muted" labelledBy="background-heading">
        <SectionHeading
          id="background-heading"
          eyebrow="Background"
          title="Disciplines usually handled by different people"
          intro="My background combines several disciplines, which is what lets me take a project from business problem to production."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {backgroundPillars.map((pillar) => (
            <div key={pillar.title} className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="font-semibold text-slate-900">{pillar.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{pillar.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="process" labelledBy="method-heading">
        <SectionHeading
          id="method-heading"
          eyebrow="How I work"
          title="Project methodology"
          intro="A structured lifecycle, combining traditional project management discipline with Agile execution where appropriate."
        />
        <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {processSteps.map((s) => (
            <li key={s.step} className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-sm font-semibold text-blue-700">{s.step}</span>
                <h3 className="text-lg font-semibold text-slate-900">{s.title}</h3>
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{s.verb}</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {s.items.map((item) => (
                  <li key={item} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                    {item}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="muted" labelledBy="skills-heading">
        <SectionHeading id="skills-heading" eyebrow="Skills" title="Technical skills" />
        <div className="grid gap-5 md:grid-cols-2">
          {skillGroups.map((group) => (
            <div key={group.title} className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="mb-4 font-semibold text-slate-900">{group.title}</h3>
              <ul className="flex flex-wrap gap-1.5" aria-label={`${group.title} skills`}>
                {group.skills.map((skill) => (
                  <li key={skill} className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700">
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section labelledBy="value-heading">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow>Value proposition</Eyebrow>
            <h2 id="value-heading" className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              A project should not simply be technically functional
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              My strongest contribution is usually where a business needs someone who can understand the operational problem, communicate with
              stakeholders, translate requirements into a technical solution, coordinate implementation, verify quality, and drive the project toward
              production.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
            <h3 className="mb-5 font-semibold text-slate-900">It should:</h3>
            <CheckList items={deliveryPrinciples} columns={1} />
          </div>
        </div>
        <div className="mt-12">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Industries</h3>
          <Tags items={industries} label="Industries" />
        </div>
      </Section>

      <CtaBand />
    </div>
  );
}
