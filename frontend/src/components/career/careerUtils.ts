// Shared helpers for the AI-backed career tools (/resources/{slug}).
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';

export const careerApiUrl = (path: string) =>
  `${import.meta.env.VITE_API_URL || 'http://localhost:8001/api'}/career-tools/${path.replace(/^\//, '')}`;

export type CareerApiResult<T> = { ok: true; data: T } | { ok: false; message: string };

/**
 * POSTs to a career-tools endpoint and normalises success / validation / network errors
 * into a message the page can show to the user.
 */
export async function postCareerTool<T = unknown>(path: string, body: unknown): Promise<CareerApiResult<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
  try {
    const token = localStorage.getItem('token');
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    /* storage blocked: continue anonymously */
  }
  try {
    const response = await fetchWithTimeout(careerApiUrl(path), { method: 'POST', headers, body: JSON.stringify(body) }, 120000);
    let result: { success?: boolean; data?: T; message?: string; errors?: Record<string, string[]> } | null = null;
    try {
      result = await response.json();
    } catch {
      result = null;
    }
    if (response.ok && result?.success && result.data) return { ok: true, data: result.data };
    const firstError = result?.errors ? Object.values(result.errors).flat()[0] : undefined;
    return { ok: false, message: firstError || result?.message || `The AI service returned an error (${response.status}). Please try again.` };
  } catch (error) {
    return { ok: false, message: error instanceof Error && error.message ? error.message : 'Network error. Check your connection and try again.' };
  }
}

/** Splits a comma/newline separated list typed by the user into trimmed, non-empty items. */
export const splitList = (value: string) =>
  value
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

/** Coerces an AI field that should be a list into an array (drops null / objects without text). */
export function asArray<T = unknown>(value: unknown): T[] {
  if (Array.isArray(value)) return value.filter((v) => v !== null && v !== undefined) as T[];
  if (value && typeof value === 'object') return Object.values(value as Record<string, T>);
  if (typeof value === 'string' && value.trim()) return [value as unknown as T];
  return [];
}

/** Renders any AI value (string, number, object with a text-like key) as a display string. */
export function asText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join(', ');
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>;
    for (const key of ['text', 'script', 'name', 'title', 'skill', 'activity', 'milestone', 'question', 'description', 'value']) {
      if (typeof o[key] === 'string') return o[key] as string;
    }
    return Object.values(o).map(asText).filter(Boolean).join(' – ');
  }
  return '';
}

export const toNumber = (value: unknown): number | null => {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.replace(/[^0-9.-]/g, '')) : NaN;
  return Number.isFinite(n) ? n : null;
};

/** Triggers a client-side download of a text file. */
export function downloadTextFile(filename: string, text: string, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Shared Tailwind classes so every career form control looks and focuses the same. */
export const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';
export const labelClass = 'mb-2 block text-sm font-medium text-gray-700';

/** Step indicator: numbered dots that wrap on narrow screens instead of overflowing. */
export const stepDotClass = (active: boolean) =>
  `flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-medium sm:h-8 sm:w-8 sm:text-sm ${
    active ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
  }`;
