// Calls the Laravel CV AI endpoints (CvAiController: POST /api/cv-ai/extract and
// /api/cv-ai/tailor) and turns every failure into a message a person can act on.
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';
import type { CVData } from './cv-form';

type Raw = Record<string, unknown>;
export type CvAiResult = { ok: true; data: Raw } | { ok: false; message: string };

const NETWORK_MESSAGE = 'Network error: the AI service could not be reached. Check your connection and try again, or enter your details manually.';

export async function postCvAi(endpoint: 'extract' | 'tailor', body: FormData | Raw): Promise<CvAiResult> {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (!isForm) headers['Content-Type'] = 'application/json';
  try {
    const token = localStorage.getItem('token');
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    /* storage blocked: continue anonymously */
  }

  let response: Response;
  try {
    response = await fetchWithTimeout(`/api/cv-ai/${endpoint}`, { method: 'POST', headers, body: isForm ? (body as FormData) : JSON.stringify(body) }, 120000);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    return { ok: false, message: /timeout/i.test(message) ? message : NETWORK_MESSAGE };
  }

  let result: { success?: boolean; data?: unknown; message?: unknown; errors?: Record<string, unknown> } | null = null;
  try {
    result = await response.json();
  } catch {
    result = null; // HTML error page from a proxy, empty body, …
  }

  if (response.ok && result?.success && result.data && typeof result.data === 'object') return { ok: true, data: result.data as Raw };

  const serverMessage = typeof result?.message === 'string' ? result.message.trim() : '';
  const firstError = result?.errors
    ? Object.values(result.errors)
        .flat()
        .find((e): e is string => typeof e === 'string' && Boolean(e.trim()))
    : undefined;

  switch (true) {
    case response.status === 422:
      return { ok: false, message: firstError || serverMessage || 'The request was not valid. Please check your input and try again.' };
    case response.status === 429:
      return { ok: false, message: 'Too many requests: the AI service is busy. Please wait a minute and try again.' };
    case response.status === 413:
      return { ok: false, message: 'The file is too large for the server. Please upload a CV smaller than 10 MB.' };
    case response.status >= 500:
      return {
        ok: false,
        message: serverMessage || `The AI service is temporarily unavailable (error ${response.status}). Please try again in a few minutes, or enter your details manually.`,
      };
    case response.ok:
      return { ok: false, message: serverMessage || 'The AI service returned an empty result. Please try again.' };
    default:
      return { ok: false, message: serverMessage || `The AI service returned an error (${response.status}). Please try again.` };
  }
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '');
const objects = (v: unknown): Raw[] => (Array.isArray(v) ? v.filter((x): x is Raw => Boolean(x) && typeof x === 'object' && !Array.isArray(x)) : []);
const list = (v: unknown) => (Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? x.trim() : str((x as Raw)?.name))).filter(Boolean).join(', ') : str(v));
const bullets = (v: unknown) => (Array.isArray(v) ? v.map((x) => str(x)).filter(Boolean).map((x) => `- ${x}`).join('\n') : str(v));

const PROFICIENCY: CVData['languages'][number]['proficiency'][] = ['Beginner', 'Intermediate', 'Advanced', 'Fluent', 'Native'];
const proficiency = (v: unknown): CVData['languages'][number]['proficiency'] => {
  const p = str(v).toLowerCase();
  const exact = PROFICIENCY.find((x) => x.toLowerCase() === p);
  if (exact) return exact;
  if (/native|mother/.test(p)) return 'Native';
  if (/fluent|bilingual|full professional|c2/.test(p)) return 'Fluent';
  if (/advanced|professional|c1/.test(p)) return 'Advanced';
  if (/basic|beginner|elementary|a1|a2/.test(p)) return 'Beginner';
  return 'Intermediate';
};

/**
 * Maps the AI's CV JSON (CvAiService::parseCvData shape) to the builder's data.
 * Only keys the API actually returned are included, so callers can merge.
 */
export function normalizeAiCv(raw: Raw): Partial<CVData> {
  const out: Partial<CVData> = {};
  const has = (key: string) => raw[key] !== undefined && raw[key] !== null;
  for (const key of ['fullName', 'jobTitle', 'email', 'phoneNumber', 'address', 'professionalSummary'] as const) if (has(key)) out[key] = str(raw[key]);
  if (has('workExperience'))
    out.workExperience = objects(raw.workExperience).map((e) => ({
      jobTitle: str(e.jobTitle ?? e.title ?? e.position),
      company: str(e.company ?? e.organization ?? e.employer),
      startDate: str(e.startDate),
      endDate: str(e.endDate),
      description: bullets(e.description ?? e.responsibilities),
    }));
  if (has('education'))
    out.education = objects(raw.education).map((e) => ({
      degree: str(e.degree ?? e.qualification),
      institution: str(e.institution ?? e.school ?? e.university),
      graduationYear: str(e.graduationYear ?? e.year ?? e.endDate),
    }));
  if (has('skills')) out.skills = list(raw.skills);
  if (has('projects'))
    out.projects = objects(raw.projects).map((p) => ({
      name: str(p.name ?? p.title),
      description: bullets(p.description),
      technologies: list(p.technologies),
      url: str(p.url ?? p.link),
      startDate: str(p.startDate),
      endDate: str(p.endDate),
    }));
  // CvAiService returns `certificates`; older responses used `certifications`.
  const certificates = has('certificates') ? raw.certificates : raw.certifications;
  if (certificates !== undefined && certificates !== null)
    out.certificates = objects(certificates).map((c) => ({
      name: str(c.name ?? c.title),
      issuer: str(c.issuer ?? c.organization),
      date: str(c.date ?? c.year),
      credentialId: str(c.credentialId),
      url: str(c.url),
    }));
  if (has('languages'))
    out.languages = (Array.isArray(raw.languages) ? raw.languages : [])
      .map((l) => (typeof l === 'string' ? { language: l.trim(), proficiency: 'Intermediate' as const } : { language: str((l as Raw)?.language ?? (l as Raw)?.name), proficiency: proficiency((l as Raw)?.proficiency ?? (l as Raw)?.level) }))
      .filter((l) => l.language);
  if (has('achievements'))
    out.achievements = (Array.isArray(raw.achievements) ? raw.achievements : [])
      .map((a) => (typeof a === 'string' ? { title: a.trim(), description: '', date: '' } : { title: str((a as Raw)?.title ?? (a as Raw)?.name), description: str((a as Raw)?.description), date: str((a as Raw)?.date) }))
      .filter((a) => a.title || a.description);
  if (has('references'))
    out.references = objects(raw.references).map((r) => ({
      name: str(r.name),
      position: str(r.position ?? r.title),
      company: str(r.company ?? r.organization),
      email: str(r.email),
      phone: str(r.phone),
    }));
  if (has('interests')) {
    const interests = Array.isArray(raw.interests) ? raw.interests : [];
    const plain = interests.filter((i): i is string => typeof i === 'string' && Boolean(i.trim())).map((i) => i.trim());
    const grouped = objects(interests)
      .map((i) => ({ category: str(i.category), items: str(i.items) || str(i.name) }))
      .filter((i) => i.items);
    out.interests = [...grouped, ...(plain.length ? [{ category: 'Interests', items: plain.join(', ') }] : [])];
  }
  return out;
}

/** The CV as sent for tailoring: no photo (large data URL) and no pasted job ad. */
export function cvForAi(data: CVData): Raw {
  const { profilePictureUrl: _photo, jobDescription: _jd, ...rest } = data;
  void _photo;
  void _jd;
  return rest;
}

/** Tailoring merge: take the AI's version of each field, but keep yours where it came back empty. */
export function mergeTailored(current: CVData, tailored: Partial<CVData>): CVData {
  const out: CVData = { ...current };
  for (const [key, value] of Object.entries(tailored) as [keyof CVData, unknown][]) {
    const empty = value === '' || (Array.isArray(value) && value.length === 0);
    if (!empty) (out as Record<string, unknown>)[key] = value;
  }
  return out;
}
