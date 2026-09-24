// Build-time static HTML for crawlers that do not execute JavaScript (GPTBot, ClaudeBot,
// PerplexityBot, social previews, …). Runs after `vite build`:
//
//   node scripts/prerender.mjs
//
// For every marketing and tool route it writes dist/prerender/<path>.html: the built SPA
// shell with the page's own <title>, meta description, canonical, Open Graph tags, JSON-LD and
// a semantic HTML version of the page content inside #root. Apache serves these files for the
// matching URLs (see scripts/deploy-production.sh); React replaces #root on load, and the
// fallback content is hidden for JavaScript users via the `js` class, so there is no layout shift.
// Content comes from the same data modules the React pages use, so the two cannot drift.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const outDir = path.join(dist, 'prerender');
const SITE = 'https://naqashthaheem.com';

const vite = await createServer({ root, logLevel: 'error', server: { middlewareMode: true, hmr: false }, appType: 'custom' });
const load = (p) => vite.ssrLoadModule(p);

try {
  const [{ profile, processSteps, faqs: homeFaqs, experienceAreas, skillGroups, backgroundPillars }, { services }, { caseStudies }, tools, { careerTools }, schema, { pageMeta }] =
    await Promise.all([
      load('/src/data/profile.ts'),
      load('/src/data/services.ts'),
      load('/src/data/caseStudies.ts'),
      load('/src/data/tools/index.ts'),
      load('/src/data/careerTools.ts'),
      load('/src/utils/schema.ts'),
      load('/src/data/pageMeta.ts'),
    ]);
  const { allTools, hubs, toolPath, toolsInHub, categoryLabels, getToolBySlug } = tools;

  const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const list = (items) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
  const links = (items) => `<ul>${items.map((i) => `<li><a href="${esc(i.href)}">${esc(i.label)}</a>${i.text ? ` – ${esc(i.text)}` : ''}</li>`).join('')}</ul>`;
  const faqHtml = (faqs) =>
    faqs?.length ? `<section><h2>Frequently asked questions</h2>${faqs.map((f) => `<h3>${esc(f.question)}</h3><p>${esc(f.answer)}</p>`).join('')}</section>` : '';
  const crumbs = (items) =>
    `<nav aria-label="Breadcrumb"><ol>${items.map((c) => `<li>${c.path ? `<a href="${esc(c.path)}">${esc(c.name)}</a>` : esc(c.name)}</li>`).join('')}</ol></nav>`;

  const siteNav = links([
    { href: '/', label: 'Home' },
    { href: '/services', label: 'Services' },
    { href: '/case-studies', label: 'Case Studies' },
    { href: '/about', label: 'About' },
    { href: '/resources', label: 'Free Tools' },
    { href: '/blog', label: 'Blog' },
    { href: '/contact', label: 'Contact' },
  ]);

  function render({ route, title, description, jsonLd, body, robots = 'index, follow, max-image-preview:large, max-snippet:-1' }) {
    const url = `${SITE}${route}`;
    const head = [
      `<link rel="canonical" href="${esc(url)}" />`,
      `<meta property="og:url" content="${esc(url)}" />`,
      ...jsonLd.map((block) => `<script type="application/ld+json">${JSON.stringify(block).replace(/</g, '\\u003c')}</script>`),
      `<style>html.js #root > [data-prerender]{display:none}</style>`,
    ].join('\n    ');
    let html = template
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
      .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(description)}$2`)
      .replace(/(<meta name="robots" content=")[^"]*(")/, `$1${esc(robots)}$2`)
      .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
      .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(description)}$2`)
      .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
      .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(description)}$2`)
      .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '')
      // Prerendered pages carry their own content; the shell's generic <noscript> block would add a second h1.
      .replace(/<noscript>[\s\S]*?<\/noscript>/, '')
      .replace('</head>', `    ${head}\n  </head>`)
      .replace('<div id="root"></div>', `<div id="root"><div data-prerender><header>${siteNav}</header><main>${body}</main></div></div>`);
    const file = route === '/' ? path.join(outDir, 'index.html') : path.join(outDir, `${route.slice(1)}.html`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, html);
    return file;
  }

  const routes = [];
  const add = (page) => routes.push(render(page));
  const home = { name: 'Home', path: '/' };

  // Home
  add({
    route: '/',
    title: pageMeta.home.title,
    description: pageMeta.home.description,
    jsonLd: [schema.personSchema(), schema.websiteSchema(), schema.businessSchema(services), schema.faqSchema(homeFaqs)],
    body: `<h1>${esc(profile.name)}: ${esc(profile.headline)}</h1><p>${esc(profile.summary)}</p>${profile.intro.map((p) => `<p>${esc(p)}</p>`).join('')}
      <section><h2>Services</h2>${links(services.map((s) => ({ href: `/services/${s.slug}`, label: s.name, text: s.summary })))}</section>
      <section><h2>Featured case studies</h2>${links(caseStudies.filter((c) => c.featured).map((c) => ({ href: `/case-studies/${c.slug}`, label: c.name, text: c.tagline })))}</section>
      <section><h2>Project experience</h2>${list(experienceAreas)}</section>
      <section><h2>How I work</h2><ol>${processSteps.map((s) => `<li><strong>${esc(s.title)}</strong>: ${esc(s.items.join(', '))}</li>`).join('')}</ol></section>
      ${faqHtml(homeFaqs)}<p><a href="/contact">Discuss a project</a></p>`,
  });

  // About
  add({
    route: '/about',
    title: pageMeta.about.title,
    description: pageMeta.about.description,
    jsonLd: [{ ...schema.personSchema(), mainEntityOfPage: `${SITE}/about` }, schema.breadcrumbSchema([home, { name: 'About', path: '/about' }])],
    body: `${crumbs([home, { name: 'About' }])}<h1>About ${esc(profile.name)}</h1><p>${esc(profile.summary)} ${esc(profile.shortVersion)}</p>
      ${profile.intro.map((p) => `<p>${esc(p)}</p>`).join('')}
      <section><h2>Background</h2>${backgroundPillars.map((b) => `<h3>${esc(b.title)}</h3><p>${esc(b.text)}</p>`).join('')}</section>
      <section><h2>Project methodology</h2><ol>${processSteps.map((s) => `<li><strong>${esc(s.title)}</strong>: ${esc(s.items.join(', '))}</li>`).join('')}</ol></section>
      <section><h2>Technical skills</h2>${skillGroups.map((g) => `<h3>${esc(g.title)}</h3><p>${esc(g.skills.join(', '))}</p>`).join('')}</section>`,
  });

  // Services
  add({
    route: '/services',
    title: pageMeta.services.title,
    description: pageMeta.services.description,
    jsonLd: [schema.businessSchema(services), schema.breadcrumbSchema([home, { name: 'Services', path: '/services' }])],
    body: `${crumbs([home, { name: 'Services' }])}<h1>Services</h1><p>${esc(profile.valueProposition)}</p>${links(services.map((s) => ({ href: `/services/${s.slug}`, label: s.name, text: s.summary })))}`,
  });
  for (const s of services) {
    const p = `/services/${s.slug}`;
    add({
      route: p,
      title: s.seoTitle,
      description: s.seoDescription,
      jsonLd: [schema.serviceSchema(s), schema.breadcrumbSchema([home, { name: 'Services', path: '/services' }, { name: s.name, path: p }]), schema.faqSchema(s.faqs)],
      body: `${crumbs([home, { name: 'Services', path: '/services' }, { name: s.name }])}<h1>${esc(s.h1)}</h1><p>${esc(s.lead)}</p>
        ${s.sections.map((sec) => `<section><h2>${esc(sec.heading)}</h2>${sec.intro ? `<p>${esc(sec.intro)}</p>` : ''}${sec.steps ? `<ol>${sec.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>` : ''}${sec.list ? list(sec.list) : ''}${sec.cards ? sec.cards.map((c) => `<h3>${esc(c.title)}</h3><p>${esc(c.text)}</p>${c.examples ? list(c.examples) : ''}`).join('') : ''}</section>`).join('')}
        ${s.tools ? `<section><h2>Tools &amp; technologies</h2><p>${esc(s.tools.join(', '))}</p></section>` : ''}${faqHtml(s.faqs)}<p><a href="/contact">Discuss your project</a></p>`,
    });
  }

  // Case studies
  add({
    route: '/case-studies',
    title: pageMeta.caseStudies.title,
    description: pageMeta.caseStudies.description,
    jsonLd: [schema.itemListSchema('Case studies', caseStudies.map((c) => ({ name: c.name, path: `/case-studies/${c.slug}` }))), schema.breadcrumbSchema([home, { name: 'Case Studies', path: '/case-studies' }])],
    body: `${crumbs([home, { name: 'Case Studies' }])}<h1>Case studies</h1>${links(caseStudies.map((c) => ({ href: `/case-studies/${c.slug}`, label: c.name, text: c.tagline })))}`,
  });
  for (const c of caseStudies) {
    const p = `/case-studies/${c.slug}`;
    add({
      route: p,
      title: c.seoTitle,
      description: c.seoDescription,
      jsonLd: [schema.caseStudySchema(c), schema.breadcrumbSchema([home, { name: 'Case Studies', path: '/case-studies' }, { name: c.name, path: p }])],
      body: `${crumbs([home, { name: 'Case Studies', path: '/case-studies' }, { name: c.name }])}<article><h1>${esc(c.name)}</h1><p>${esc(c.tagline)}</p>
        <p>Industry: ${esc(c.industry)}${c.location ? ` · Location: ${esc(c.location)}` : ''}${c.role ? ` · Role: ${esc(c.role)}` : ''}</p>
        <h2>Overview</h2>${c.overview.map((x) => `<p>${esc(x)}</p>`).join('')}
        ${c.problem ? `<h2>Business problem</h2>${c.problem.map((x) => `<p>${esc(x)}</p>`).join('')}` : ''}
        ${c.objectives ? `<h2>Objectives</h2>${list(c.objectives)}` : ''}${c.responsibilities ? `<h2>My role</h2>${list(c.responsibilities)}` : ''}
        ${c.components ? `<h2>${esc(c.components.heading)}</h2>${list(c.components.items)}` : ''}
        ${c.workflow ? `<h2>${esc(c.workflow.heading)}</h2><ol>${c.workflow.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>` : ''}
        ${c.sections.map((sec) => `<h2>${esc(sec.heading)}</h2>${(sec.body || []).map((x) => `<p>${esc(x)}</p>`).join('')}${sec.list ? list(sec.list) : ''}`).join('')}
        <h2>Technology stack</h2><p>${esc(c.stack.join(', '))}</p><h2>Outcome</h2>${c.outcome.map((x) => `<p>${esc(x)}</p>`).join('')}</article>`,
    });
  }

  // Resources, hubs, tools
  add({
    route: '/resources',
    title: pageMeta.resources.title,
    description: pageMeta.resources.description,
    jsonLd: [schema.breadcrumbSchema([home, { name: 'Resources', path: '/resources' }])],
    body: `${crumbs([home, { name: 'Resources' }])}<h1>Free Online Tools &amp; Career Resources</h1>
      ${Object.values(hubs).map((h) => `<section><h2><a href="/resources/${h.hub}">${esc(h.name)}</a></h2><p>${esc(h.intro)}</p>${links(toolsInHub(h.hub).map((t) => ({ href: toolPath(t), label: t.name })))}</section>`).join('')}
      <section><h2>Career tools</h2>${links(careerTools.map((c) => ({ href: `/resources/${c.slug}`, label: c.name, text: c.summary })))}</section>`,
  });
  const resources = { name: 'Resources', path: '/resources' };
  for (const h of Object.values(hubs)) {
    const p = `/resources/${h.hub}`;
    const hubTools = toolsInHub(h.hub);
    add({
      route: p,
      title: h.seoTitle,
      description: h.seoDescription,
      jsonLd: [schema.toolHubSchema(h, hubTools), schema.breadcrumbSchema([home, resources, { name: h.name, path: p }])],
      body: `${crumbs([home, resources, { name: h.name }])}<h1>${esc(h.h1)}</h1><p>${esc(h.answer)}</p>
        ${h.categories.map((cat) => { const items = hubTools.filter((t) => t.category === cat); return items.length ? `<section><h2>${esc(categoryLabels[cat])}</h2>${links(items.map((t) => ({ href: toolPath(t), label: t.name, text: t.summary })))}</section>` : ''; }).join('')}`,
    });
  }
  for (const t of allTools) {
    const p = toolPath(t);
    const hub = hubs[t.hub];
    const related = t.related.map((s) => getToolBySlug(s)).filter(Boolean);
    add({
      route: p,
      title: t.seoTitle,
      description: t.seoDescription,
      jsonLd: [
        schema.toolAppSchema(t, p),
        schema.breadcrumbSchema([home, resources, { name: hub.name, path: `/resources/${t.hub}` }, { name: t.name, path: p }]),
        ...(t.howTo.length ? [schema.howToSchema(t, p)] : []),
        ...(t.faqs.length ? [schema.faqSchema(t.faqs)] : []),
      ],
      body: `${crumbs([home, resources, { name: hub.name, path: `/resources/${t.hub}` }, { name: t.name }])}<h1>${esc(t.name)}</h1><p>${esc(t.answer || t.summary)}</p>
        <p>Free, no signup. ${t.processing === 'browser' ? 'Runs entirely in your browser; files and text are not uploaded.' : t.processing === 'ai' ? 'Text is processed by an AI model and is not stored.' : 'Uses a live data service for current values.'}</p>
        ${t.howTo.length ? `<section><h2>How to use the ${esc(t.name)}</h2><ol>${t.howTo.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></section>` : ''}
        ${t.features.length ? `<section><h2>Features</h2>${list(t.features)}</section>` : ''}${faqHtml(t.faqs)}
        ${related.length ? `<section><h2>Related tools</h2>${links(related.map((r) => ({ href: toolPath(r), label: r.name, text: r.summary })))}</section>` : ''}
        <p>Built and reviewed by <a href="/about">${esc(profile.name)}</a>, ${esc(profile.title)}. Last reviewed ${esc(t.reviewed)}.</p>`,
    });
  }
  for (const c of careerTools) {
    const p = `/resources/${c.slug}`;
    if (!c.seoTitle || !c.seoDescription) continue; // page keeps client-side SEO until its content is complete
    const related = (c.related || []).map((s) => careerTools.find((x) => x.slug === s)).filter(Boolean);
    add({
      route: p,
      title: c.seoTitle,
      description: c.seoDescription,
      jsonLd: [
        schema.breadcrumbSchema([home, resources, { name: c.name, path: p }]),
        ...(c.faqs?.length ? [schema.faqSchema(c.faqs)] : []),
      ],
      body: `${crumbs([home, resources, { name: c.name }])}<h1>${esc(c.h1 || c.name)}</h1><p>${esc(c.answer || c.summary)}</p>
        ${c.howTo?.length ? `<section><h2>How to use</h2><ol>${c.howTo.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></section>` : ''}
        ${c.features?.length ? `<section><h2>Features</h2>${list(c.features)}</section>` : ''}${faqHtml(c.faqs)}
        ${related.length ? `<section><h2>Related career tools</h2>${links(related.map((r) => ({ href: `/resources/${r.slug}`, label: r.name, text: r.summary })))}</section>` : ''}`,
    });
  }

  console.log(`Prerendered ${routes.length} pages into ${path.relative(root, outDir)}/`);
} finally {
  await vite.close();
}
