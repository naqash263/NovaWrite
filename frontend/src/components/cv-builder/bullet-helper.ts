// Local (no AI) writing help for experience bullets: strong action verbs, quantified
// bullet patterns and a quick check for weak openings and missing numbers.
import { descriptionLines } from './cv-sections';

export const ACTION_VERBS: { group: string; verbs: string[] }[] = [
  { group: 'Leadership', verbs: ['Led', 'Managed', 'Directed', 'Coordinated', 'Mentored', 'Supervised'] },
  { group: 'Results', verbs: ['Increased', 'Reduced', 'Improved', 'Delivered', 'Achieved', 'Exceeded'] },
  { group: 'Building', verbs: ['Built', 'Designed', 'Developed', 'Launched', 'Implemented', 'Automated'] },
  { group: 'Analysis', verbs: ['Analysed', 'Evaluated', 'Forecast', 'Identified', 'Audited', 'Researched'] },
  { group: 'People', verbs: ['Negotiated', 'Presented', 'Trained', 'Partnered', 'Resolved', 'Persuaded'] },
];

export const BULLET_PATTERNS = [
  'Increased [metric] by [X%] in [time period] by [what you did]',
  'Reduced [cost / time / errors] by [X] by [action you took]',
  'Led a team of [N] to deliver [project] [on time / under budget]',
  'Built [tool or process] that [result for customers or the business]',
  'Managed [budget / accounts / portfolio] worth [AED X] across [scope]',
];

const WEAK_OPENINGS = ['Responsible for', 'Duties included', 'Worked on', 'Helped with', 'Helped', 'Assisted with', 'Assisted', 'Tasked with', 'Involved in', 'Participated in', 'In charge of'];

export interface BulletCheck {
  count: number;
  withNumbers: number;
  weakStarts: string[];
}

/** Counts lines, lines with a number, and lines that open with a weak phrase. */
export function analyzeBullets(description: string): BulletCheck {
  const lines = descriptionLines(description).map((l) => l.text);
  const weakStarts: string[] = [];
  for (const line of lines) {
    const weak = WEAK_OPENINGS.find((w) => line.toLowerCase().startsWith(w.toLowerCase()));
    if (weak && !weakStarts.includes(weak)) weakStarts.push(weak);
  }
  return { count: lines.length, withNumbers: lines.filter((l) => /\d/.test(l)).length, weakStarts };
}

/** Appends a new "- …" bullet line to a description. */
export function appendBullet(description: string, start: string): string {
  const trimmed = description.replace(/\s+$/, '');
  return `${trimmed ? `${trimmed}\n` : ''}- ${start}`;
}
