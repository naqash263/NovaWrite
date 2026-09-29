// Client-side keyword match between a CV and a job description. Runs entirely in the
// browser: nothing is sent to a server. It is a guide, not a copy of any employer's ATS.
import type { CVData } from './cv-form';
import { analyzeBullets } from './bullet-helper';
import { descriptionLines } from './cv-sections';

export interface AtsKeyword {
  /** Lower-case form used for matching. */
  term: string;
  /** How the keyword was written in the job description (e.g. "Tableau", "A/B testing"). */
  display: string;
  count: number;
}

export interface AtsResult {
  score: number;
  keywords: AtsKeyword[];
  matched: AtsKeyword[];
  missing: AtsKeyword[];
  suggestions: string[];
}

// Common English words plus job-ad filler that never makes a useful CV keyword.
const STOP_WORDS = new Set(
  (
    'a about above after again against all also am an and any are as at be because been before being below between both but by can could did do does doing down during each ' +
    'etc few for from further had has have having he her here hers him his how i if in into is it its itself just let me more most must my no nor not now of off on once only or other ' +
    'our ours out over own per same she should so some such than that the their theirs them then there these they this those through to too under until up upon us very via was we ' +
    'were what when where which while who whom why will with within without would you your yours yourself ' +
    'ability able across additional apply applicant applicants approximately around based benefits best candidate candidates company competitive day days degree desirable desired ' +
    'duties environment equal essential excellent experience experienced familiarity good great help high highly ideal ideally including job join key knowledge least level looking ' +
    'make minimum new offer opportunity opportunities plus position preferred proven related relevant required requirement requirements responsibilities responsibility responsible ' +
    'role roles salary seeking skill skills strong successful support team teams understanding using well within work working world year years hiring hire need needs needed ' +
    'want wants like also able others one two three four five six seven eight nine ten first based every many much across along build building own owning run running write writing ' +
    'use used get getting take taking ensure ensuring provide providing within various other etc eg ie e.g i.e'
  ).split(/\s+/),
);

const TOKEN = /[a-z0-9][a-z0-9+#./&-]*[a-z0-9+#]|[a-z0-9]/gi;

/** Very small stemmer so "dashboards" matches "dashboard" and "testing" matches "tested". */
const stem = (word: string) => {
  let w = word.toLowerCase();
  if (w.length > 5 && w.endsWith('ing')) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith('ied')) w = `${w.slice(0, -3)}y`;
  else if (w.length > 4 && w.endsWith('ed')) w = w.slice(0, -2);
  else if (w.length > 4 && w.endsWith('ies')) w = `${w.slice(0, -3)}y`;
  else if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us') && !w.endsWith('is')) w = w.slice(0, -1);
  return w;
};

const tokens = (value: string) => (value.match(TOKEN) ?? []).map((t) => t.replace(/[.\-/&]+$/, ''));

const isKeywordToken = (token: string) => {
  const lower = token.toLowerCase();
  if (STOP_WORDS.has(lower)) return false;
  if (/^\d+([.,]\d+)?%?$/.test(lower)) return false;
  return lower.length > 1 || /^[cr]$/.test(lower);
};

/** Picks the most important keywords (single words and repeated or capitalised two-word phrases). */
export function extractKeywords(jobDescription: string, max = 20): AtsKeyword[] {
  const counts = new Map<string, { display: string; count: number; weight: number; first: number }>();
  let position = 0;
  const add = (term: string, display: string, weight: number) => {
    const entry = counts.get(term);
    if (entry) {
      entry.count += 1;
      entry.weight += weight;
    } else counts.set(term, { display, count: 1, weight, first: position++ });
  };

  // Split into phrases at punctuation so two-word keywords never cross a sentence or list item.
  for (const phrase of jobDescription.split(/[\n\r;:,()!?•·|]+|\.(?=\s|$)/)) {
    const words = tokens(phrase);
    words.forEach((word, i) => {
      if (!isKeywordToken(word)) return;
      const special = /[+#./]/.test(word) || (/^[A-Z0-9]{2,}$/.test(word) && /[A-Z]/.test(word));
      const capitalised = /^[A-Z]/.test(word) && i > 0;
      add(stem(word), word, 1 + (special ? 1 : 0) + (capitalised ? 0.5 : 0));
      const nextWord = words[i + 1];
      if (nextWord && isKeywordToken(nextWord)) {
        const both = /^[A-Z]/.test(word) && /^[A-Z]/.test(nextWord);
        add(`${stem(word)} ${stem(nextWord)}`, `${word} ${nextWord}`, both ? 2 : 1.2);
      }
    });
  }

  const candidates = [...counts.entries()]
    .map(([term, v]) => ({ term, display: v.display, count: v.count, weight: v.weight, first: v.first, phrase: term.includes(' ') }))
    // A two-word phrase must repeat or be written as a proper name ("Google Analytics") to count.
    .filter((c) => !c.phrase || c.count >= 2 || c.weight >= 2)
    .sort((a, b) => b.weight - a.weight || a.first - b.first);

  const picked: typeof candidates = [];
  for (const c of candidates) {
    if (picked.length >= max) break;
    // Skip a single word already covered by a chosen phrase that appears as often.
    if (!c.phrase && picked.some((p) => p.phrase && p.term.split(' ').includes(c.term) && p.count >= c.count)) continue;
    picked.push(c);
  }
  return picked.map(({ term, display, count }) => ({ term, display, count }));
}

/** All the text of a CV, for keyword matching. */
export function cvPlainText(data: CVData): string {
  const parts: string[] = [];
  const visit = (value: unknown) => {
    if (typeof value === 'string') {
      if (!value.startsWith('data:')) parts.push(value);
    } else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') Object.values(value).forEach(visit);
  };
  const { jobDescription: _jd, profilePictureUrl: _photo, ...rest } = data;
  void _jd;
  void _photo;
  visit(rest);
  return parts.join('\n');
}

export function matchCv(data: CVData, jobDescription: string): AtsResult {
  const keywords = extractKeywords(jobDescription);
  const cvStems = tokens(cvPlainText(data)).map(stem);
  const cvSequence = ` ${cvStems.join(' ')} `;
  const has = (term: string) => cvSequence.includes(` ${term} `);
  const matched = keywords.filter((k) => has(k.term));
  const missing = keywords.filter((k) => !has(k.term));
  const score = keywords.length ? Math.round((matched.length / keywords.length) * 100) : 0;

  const suggestions: string[] = [];
  if (missing.length) {
    suggestions.push(
      `Add the missing keywords you genuinely have (${missing
        .slice(0, 5)
        .map((k) => k.display)
        .join(', ')}) to your skills, summary or experience bullets, using the job ad's wording.`,
    );
  }
  if (!String(data.professionalSummary || '').trim()) suggestions.push('Add a 2–3 line professional summary that names the target role and your strongest matching skills.');
  const title = String(data.jobTitle || '').trim().toLowerCase();
  if (title && !jobDescription.toLowerCase().includes(title)) suggestions.push('Your headline job title does not appear in the job description; mirror the exact title if it fits your experience.');
  const bullets = (Array.isArray(data.workExperience) ? data.workExperience : []).flatMap((e) => descriptionLines(e?.description).map((l) => l.text));
  const check = analyzeBullets(bullets.join('\n'));
  if (bullets.length && check.withNumbers < bullets.length / 2) suggestions.push(`Only ${check.withNumbers} of ${bullets.length} experience lines include a number; quantify results (%, time saved, revenue, team size).`);
  if (check.weakStarts.length) suggestions.push(`Replace weak openings such as "${check.weakStarts[0]}" with an action verb (Led, Built, Reduced, Increased…).`);
  if (!String(data.email || '').trim() || !String(data.phoneNumber || '').trim()) suggestions.push('Add both an email address and a phone number so recruiters and ATS can reach you.');
  return { score, keywords, matched, missing, suggestions };
}
