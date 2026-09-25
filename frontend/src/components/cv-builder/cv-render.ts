// Fills CV template HTML ({{placeholders}}) with escaped CV data. Shared by the
// live preview and the HTML/PDF/TXT exports.
import type { CVData } from "./cv-form";
import { builtinTemplate } from "./builtin-template";
import { applyHiddenSections, descriptionLines, formatDateRange, formatMonth, normalizeLayout, personalDetails, type CvLayout } from "./cv-sections";

export interface CvTemplateStyle {
  primaryColor: string;
  secondaryColor: string;
  fontSize: number;
  fontFamily: string;
}

export interface CvTemplateLike {
  id?: string | number;
  name?: string;
  html_content?: string | null;
}

type Entry = Record<string, unknown>;

/** Escapes user text before it is interpolated into template HTML. */
export const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Only allow http(s)/mailto links and image data URLs from user input. */
const safeUrl = (value: unknown, allowDataImage = false): string => {
  const url = String(value ?? '').trim();
  if (/^(https?:|mailto:)/i.test(url)) return escapeHtml(url);
  if (allowDataImage && /^data:image\/(png|jpe?g|gif|webp|avif);base64,/i.test(url)) return escapeHtml(url);
  return '';
};

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : v === null || v === undefined ? '' : String(v).trim());

/** Drops entries where every field is empty (the form starts with one blank row per section). */
const filled = <T extends Entry>(items: unknown, keys: string[]): T[] =>
  (Array.isArray(items) ? items : []).filter((item): item is T => Boolean(item) && typeof item === 'object' && keys.some((k) => text((item as Entry)[k])));

const dateRange = (start: unknown, end: unknown) => escapeHtml(formatDateRange(start, end));

/** Plain lines keep their line breaks; lines written as "- …" / "• …" become a real list. */
const descriptionHtml = (value: unknown) => {
  const lines = descriptionLines(value);
  if (!lines.length) return '';
  if (!lines.some((l) => l.bullet)) return `<p class="item-description">${escapeHtml(text(value))}</p>`;
  let html = '';
  let list: string[] = [];
  const flush = () => {
    if (list.length) html += `<ul class="item-bullets">${list.join('')}</ul>`;
    list = [];
  };
  for (const line of lines) {
    if (line.bullet) list.push(`<li>${escapeHtml(line.text)}</li>`);
    else {
      flush();
      html += `<p class="item-description">${escapeHtml(line.text)}</p>`;
    }
  }
  flush();
  return html;
};

const formatWorkExperience = (experiences: unknown) =>
  filled(experiences, ['jobTitle', 'company', 'description'])
    .map(
      (exp) => `
    <div class="experience-card">
      <div class="experience-header">
        <h4 class="item-title">${escapeHtml(exp.jobTitle)}</h4>
        <span class="item-date">${dateRange(exp.startDate, exp.endDate)}</span>
      </div>
      <div class="item-subtitle">${escapeHtml(exp.company)}</div>
      ${descriptionHtml(exp.description)}
    </div>`,
    )
    .join('');

const formatProjects = (projects: unknown) =>
  filled(projects, ['name', 'description', 'technologies'])
    .map((project) => {
      const tech = text(project.technologies)
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const url = safeUrl(project.url);
      return `
    <div class="project-card">
      <div class="project-header">
        <h4 class="item-title">${escapeHtml(project.name)}</h4>
        ${text(project.startDate) ? `<span class="item-date">${dateRange(project.startDate, project.endDate)}</span>` : ''}
      </div>
      ${tech.length ? `<div class="tech-tags">${tech.map((t) => `<span class="tech-tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
      ${descriptionHtml(project.description)}
      ${url ? `<a href="${url}" class="project-link" target="_blank" rel="noopener noreferrer">${url}</a>` : ''}
    </div>`;
    })
    .join('');

const formatEducation = (education: unknown) =>
  filled(education, ['degree', 'institution'])
    .map(
      (edu) => `
    <div class="education-item">
      <div class="education-header">
        <h4 class="item-title">${escapeHtml(edu.degree)}</h4>
        <span class="item-date">${escapeHtml(edu.graduationYear)}</span>
      </div>
      <div class="item-subtitle">${escapeHtml(edu.institution)}</div>
    </div>`,
    )
    .join('');

const formatCertificates = (certificates: unknown) =>
  filled(certificates, ['name', 'issuer'])
    .map((cert) => {
      const url = safeUrl(cert.url);
      return `
    <div class="certificate-item">
      <div class="certificate-header">
        <h4 class="item-title">${escapeHtml(cert.name)}</h4>
        <span class="item-date">${escapeHtml(formatMonth(cert.date))}</span>
      </div>
      <div class="item-subtitle">${escapeHtml(cert.issuer)}</div>
      ${text(cert.credentialId) ? `<div class="credential-id" style="font-size: 11px; color: #666; margin-top: 4px;">ID: ${escapeHtml(cert.credentialId)}</div>` : ''}
      ${url ? `<a href="${url}" class="certificate-link" target="_blank" rel="noopener noreferrer">Verify</a>` : ''}
    </div>`;
    })
    .join('');

const formatLanguages = (languages: unknown) =>
  filled(languages, ['language'])
    .map(
      (lang) => `
    <div class="language-item">
      <span class="language-name">${escapeHtml(lang.language)}</span>
      <span class="proficiency-level">${escapeHtml(lang.proficiency)}</span>
    </div>`,
    )
    .join('');

const formatAchievements = (achievements: unknown) =>
  filled(achievements, ['title', 'description'])
    .map(
      (achievement) => `
    <div class="achievement-item">
      <div class="achievement-header">
        <h4 class="item-title">${escapeHtml(achievement.title)}</h4>
        ${text(achievement.date) ? `<span class="item-date">${escapeHtml(achievement.date)}</span>` : ''}
      </div>
      ${descriptionHtml(achievement.description)}
    </div>`,
    )
    .join('');

// Interests are stored as { category, items } (items is a comma-separated string);
// older data and AI extraction may use plain strings or { name }.
const formatInterests = (interests: unknown) =>
  (Array.isArray(interests) ? interests : [])
    .map((interest) => {
      if (typeof interest === 'string') return interest.trim() ? `<div class="interest-item"><span class="interest-name">${escapeHtml(interest)}</span></div>` : '';
      const i = (interest ?? {}) as Entry;
      if (text(i.items)) {
        const label = text(i.category);
        return `<div class="interest-item">${label ? `<strong>${escapeHtml(label)}:</strong> ` : ''}<span class="interest-name">${escapeHtml(i.items)}</span></div>`;
      }
      return text(i.name) ? `<div class="interest-item"><span class="interest-name">${escapeHtml(i.name)}</span></div>` : '';
    })
    .join('');

const formatReferences = (references: unknown) =>
  filled(references, ['name', 'company', 'email', 'phone'])
    .map(
      (ref) => `
    <div class="reference-item">
      <h4 class="item-title">${escapeHtml(ref.name)}</h4>
      ${text(ref.position ?? ref.title) ? `<div class="item-subtitle">${escapeHtml(ref.position ?? ref.title)}</div>` : ''}
      ${text(ref.company ?? ref.organization) ? `<div class="item-subtitle">${escapeHtml(ref.company ?? ref.organization)}</div>` : ''}
      <div class="contact-info">
        ${text(ref.email) ? `<span class="contact-item">Email: ${escapeHtml(ref.email)}</span>` : ''}
        ${text(ref.phone) ? `<span class="contact-item">Phone: ${escapeHtml(ref.phone)}</span>` : ''}
      </div>
    </div>`,
    )
    .join('');

const skillsText = (skills: unknown) => (Array.isArray(skills) ? skills.map(text).filter(Boolean).join(', ') : text(skills));

/** {{#if key}}…{{/if}} blocks: kept when the matching CV field is non-empty. */
const processConditionals = (html: string, data: CVData) =>
  html.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key: string, content: string) => {
    const field = key === 'profileImage' ? 'profilePictureUrl' : key;
    const value = (data as Record<string, unknown>)[field];
    const present = Array.isArray(value) ? value.length > 0 : Boolean(text(value));
    return present ? content : '';
  });

/** Puts `section#summary`, `section#experience`, … (ids used by the built-in template) in the chosen order. */
const reorderSections = (doc: Document, order: string[]) => {
  const found = order.map((key) => doc.querySelector(`section#${key}, [data-section="${key}"]`)).filter((el): el is Element => Boolean(el));
  const parent = found[0]?.parentElement;
  if (!parent) return;
  const siblings = found.filter((el) => el.parentElement === parent);
  if (siblings.length < 2) return;
  const first = [...parent.children].find((child) => siblings.includes(child));
  if (!first) return;
  const marker = doc.createComment('sections');
  parent.insertBefore(marker, first);
  for (const el of siblings) parent.insertBefore(el, marker);
  marker.remove();
};

// Hide entire section if placeholder is empty
const hideEmptySections = (html: string, order?: string[]) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const sections = doc.querySelectorAll('section, .section, [class*="section"], div[id*="section"], div[id*="projects"], div[id*="certificates"], div[id*="languages"], div[id*="achievements"], div[id*="interests"], div[id*="references"], div[id*="skills"]');

  sections.forEach((section) => {
    const sectionTitle = section.querySelector('.section-title, h2, h3, h4, [class*="title"], [class*="heading"]');
    const sectionTitleText = sectionTitle?.textContent?.trim() || '';
    const sectionContent = section.cloneNode(true) as Element;
    const clonedTitle = sectionContent.querySelector('.section-title, h2, h3, h4, [class*="title"], [class*="heading"]');
    if (clonedTitle) clonedTitle.remove();
    const contentText = sectionContent.textContent?.trim() || '';
    const hasContent = contentText.length > 1 && !contentText.includes('{{') && contentText !== sectionTitleText;
    const explicitlyEmpty = /<!-- no-[a-z-]+ -->/.test(section.innerHTML) && contentText.length === 0;
    if (!hasContent || explicitlyEmpty) section.remove();
  });

  doc.querySelectorAll('div:empty, p:empty, section:empty, .section:empty').forEach((container) => container.remove());
  if (order) reorderSections(doc, order);
  return doc.body.innerHTML;
};

/** Fills a template's placeholders with (escaped) CV data. Exported for exports and tests. */
export function renderTemplateHtml(data: CVData, style: CvTemplateStyle, template?: CvTemplateLike | null, layout?: Partial<CvLayout> | null): string {
  const sectionLayout = layout ? normalizeLayout(layout) : null;
  if (sectionLayout) data = applyHiddenSections(data, sectionLayout.hidden);
  const source = template?.html_content ? template : builtinTemplate;
  let html: string = source.html_content || '';

  html = html
    .replace(/\{\{primaryColor\}\}/g, escapeHtml(style.primaryColor))
    .replace(/\{\{secondaryColor\}\}/g, escapeHtml(style.secondaryColor))
    .replace(/\{\{fontFamily\}\}/g, escapeHtml(style.fontFamily))
    .replace(/\{\{fontSize\}\}/g, escapeHtml(style.fontSize));

  html = processConditionals(html, data);

  const photo = safeUrl(data.profilePictureUrl, true);
  const scalars: Record<string, string> = {
    fullName: escapeHtml(data.fullName),
    jobTitle: escapeHtml(data.jobTitle),
    email: escapeHtml(data.email),
    phoneNumber: escapeHtml(data.phoneNumber),
    address: escapeHtml(data.address),
    professionalSummary: escapeHtml(data.professionalSummary),
    profilePictureUrl: photo,
    profileImage: photo,
    skills: escapeHtml(skillsText(data.skills)),
    personalDetails: personalDetails(data)
      .map((d) => `<span class="cv-detail">${escapeHtml(d.label)}: ${escapeHtml(d.value)}</span>`)
      .join(''),
  };
  const blocks: Record<string, string> = {
    workExperience: formatWorkExperience(data.workExperience),
    projects: formatProjects(data.projects),
    education: formatEducation(data.education),
    certificates: formatCertificates(data.certificates),
    languages: formatLanguages(data.languages),
    achievements: formatAchievements(data.achievements),
    interests: formatInterests(data.interests),
    references: formatReferences(data.references),
  };

  html = html.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    if (key in scalars) return scalars[key];
    if (key in blocks) return blocks[key] || `<!-- no-${key} -->`;
    return match;
  });

  return hideEmptySections(html, sectionLayout?.order);
}

