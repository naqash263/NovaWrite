// JSON backup of everything the builder stores, so a CV can move between browsers
// or survive clearing site data. Restoring validates the file before using it.
import { defaultCVData, type CVData } from './cv-form';
import { normalizeLayout, type CvLayout } from './cv-sections';
import type { CVStyle } from './template-customizer';

export const BACKUP_APP = 'naqashthaheem-cv-builder';
const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

export interface CvBackup {
  app: typeof BACKUP_APP;
  version: 1;
  exportedAt: string;
  data: CVData;
  style: CVStyle;
  layout: CvLayout;
  templateId?: string;
}

export function makeBackup(data: CVData, style: CVStyle, layout: CvLayout, templateId?: string | number): string {
  const backup: CvBackup = { app: BACKUP_APP, version: 1, exportedAt: new Date().toISOString(), data, style, layout, ...(templateId !== undefined ? { templateId: String(templateId) } : {}) };
  return JSON.stringify(backup, null, 2);
}

const ARRAY_KEYS = ['workExperience', 'education', 'projects', 'certificates', 'languages', 'achievements', 'references', 'interests'] as const;
const STRING_KEYS = ['fullName', 'jobTitle', 'email', 'phoneNumber', 'address', 'profilePictureUrl', 'professionalSummary', 'skills', 'jobDescription', 'nationality', 'visaStatus', 'drivingLicence', 'noticePeriod'] as const;

/** Keeps only known fields with the right types; everything else falls back to the defaults. */
export function sanitizeCvData(value: unknown): CVData {
  const raw = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const out: CVData = { ...defaultCVData };
  for (const key of STRING_KEYS) if (typeof raw[key] === 'string') (out as Record<string, unknown>)[key] = raw[key];
  if (Array.isArray(raw.skills)) out.skills = raw.skills.filter((s) => typeof s === 'string').join(', ');
  for (const key of ARRAY_KEYS) {
    if (!Array.isArray(raw[key])) continue;
    (out as Record<string, unknown>)[key] = (raw[key] as unknown[])
      .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
      .map((item) => Object.fromEntries(Object.entries(item as Record<string, unknown>).map(([k, v]) => [k, typeof v === 'string' ? v : v === null || v === undefined ? '' : String(v)])));
  }
  if (out.profilePictureUrl && !/^(https?:\/\/|data:image\/(png|jpe?g|gif|webp|avif);base64,)/i.test(out.profilePictureUrl)) out.profilePictureUrl = '';
  return out;
}

export type ParsedBackup = { ok: true; data: CVData; style: Partial<CVStyle>; layout: CvLayout; templateId?: string } | { ok: false; message: string };

const NOT_A_BACKUP = 'This file is not a CV builder backup. Choose a .json file saved with "Save backup (.json)".';

export function parseBackup(text: string): ParsedBackup {
  if (text.length > MAX_BACKUP_BYTES) return { ok: false, message: 'This backup file is too large (over 5 MB).' };
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, message: NOT_A_BACKUP };
  }
  if (!json || typeof json !== 'object') return { ok: false, message: NOT_A_BACKUP };
  const backup = json as Partial<CvBackup> & Record<string, unknown>;
  if (backup.app !== BACKUP_APP || !backup.data || typeof backup.data !== 'object') return { ok: false, message: NOT_A_BACKUP };

  const style: Partial<CVStyle> = {};
  const s = (backup.style && typeof backup.style === 'object' ? backup.style : {}) as Record<string, unknown>;
  if (typeof s.primaryColor === 'string' && /^#[0-9a-f]{3,8}$/i.test(s.primaryColor)) style.primaryColor = s.primaryColor;
  if (typeof s.fontFamily === 'string' && /^[\w\s,'-]{1,80}$/.test(s.fontFamily)) style.fontFamily = s.fontFamily;
  if (typeof s.fontSize === 'number' && s.fontSize >= 8 && s.fontSize <= 18) style.fontSize = s.fontSize;
  if (typeof s.templateName === 'string') style.templateName = s.templateName.slice(0, 100);

  return {
    ok: true,
    data: sanitizeCvData(backup.data),
    style,
    layout: normalizeLayout(backup.layout),
    templateId: typeof backup.templateId === 'string' ? backup.templateId : undefined,
  };
}
