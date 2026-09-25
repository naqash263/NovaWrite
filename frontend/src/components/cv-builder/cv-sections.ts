// Shared CV helpers: section order / visibility, date formatting, the optional
// Gulf personal-details line and bullet parsing. Used by the preview, PDF and Word exports.
import type { CVData } from './cv-form';

export const SECTION_KEYS = [
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certificates',
  'achievements',
  'languages',
  'interests',
  'references',
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

/** Heading used in the built-in template, the PDF and the Word file. */
export const SECTION_TITLES: Record<SectionKey, string> = {
  summary: 'Profile',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certificates: 'Certifications',
  achievements: 'Achievements',
  languages: 'Languages',
  interests: 'Interests',
  references: 'References',
};

export interface CvLayout {
  order: SectionKey[];
  hidden: SectionKey[];
}

export const defaultCvLayout: CvLayout = { order: [...SECTION_KEYS], hidden: [] };

const isSectionKey = (value: unknown): value is SectionKey => typeof value === 'string' && (SECTION_KEYS as readonly string[]).includes(value);

/** Accepts anything (saved or imported JSON) and returns a complete, valid layout. */
export function normalizeLayout(value: unknown): CvLayout {
  const raw = (value && typeof value === 'object' ? value : {}) as Partial<Record<keyof CvLayout, unknown>>;
  const order = Array.isArray(raw.order) ? raw.order.filter(isSectionKey) : [];
  const unique = [...new Set(order)];
  for (const key of SECTION_KEYS) if (!unique.includes(key)) unique.push(key);
  const hidden = Array.isArray(raw.hidden) ? [...new Set(raw.hidden.filter(isSectionKey))] : [];
  return { order: unique, hidden };
}

/** Moves a section one place up (-1) or down (+1). */
export function moveSection(layout: CvLayout, key: SectionKey, direction: -1 | 1): CvLayout {
  const order = [...layout.order];
  const from = order.indexOf(key);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= order.length) return layout;
  [order[from], order[to]] = [order[to], order[from]];
  return { ...layout, order };
}

/** Returns the CV with hidden sections emptied, so every template and export leaves them out. */
export function applyHiddenSections(data: CVData, hidden: SectionKey[]): CVData {
  if (!hidden.length) return data;
  const out = { ...data };
  for (const key of hidden) {
    if (key === 'summary') out.professionalSummary = '';
    else if (key === 'experience') out.workExperience = [];
    else if (key === 'skills') out.skills = '';
    else out[key] = [];
  }
  return out;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2021-03" (from <input type="month">) becomes "Mar 2021"; anything else is kept as typed. */
export function formatMonth(value: unknown): string {
  const text = typeof value === 'string' ? value.trim() : value === null || value === undefined ? '' : String(value).trim();
  const m = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(text);
  if (m) {
    const month = Number(m[2]);
    if (month >= 1 && month <= 12) return `${MONTHS[month - 1]} ${m[1]}`;
  }
  return text;
}

/** "Mar 2021 – Present", "Jan 2018 – Feb 2021" or '' when both dates are empty. */
export function formatDateRange(start: unknown, end: unknown): string {
  const s = formatMonth(start);
  const e = formatMonth(end);
  if (!s && !e) return '';
  return `${s}${s ? ' – ' : ''}${e || 'Present'}`;
}

/** Optional Gulf details as label/value pairs, only the ones that are filled in. */
export function personalDetails(data: Partial<CVData>): { label: string; value: string }[] {
  const pairs: [string, unknown][] = [
    ['Nationality', data.nationality],
    ['Visa status', data.visaStatus],
    ['Driving licence', data.drivingLicence],
    ['Notice period', data.noticePeriod],
  ];
  return pairs
    .map(([label, value]) => ({ label, value: typeof value === 'string' ? value.trim() : '' }))
    .filter((p) => p.value);
}

export const BULLET_PATTERN = /^\s*[-•*▪–]\s+/;

/** Splits a description into lines, marking the ones written as bullets ("- ", "• ", "* "). */
export function descriptionLines(value: unknown): { bullet: boolean; text: string }[] {
  const text = typeof value === 'string' ? value : '';
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (BULLET_PATTERN.test(line) ? { bullet: true, text: line.replace(BULLET_PATTERN, '').trim() } : { bullet: false, text: line }))
    .filter((line) => line.text);
}
