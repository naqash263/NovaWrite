// Shared request/clipboard helpers for the AI tools (text summarizer, article rewriter,
// grammar checker, language translator, keyword extractor). These tools send text to the
// Laravel API, which forwards it to Google Gemini.
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';

export const AI_API_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

/** Error with a user-facing message and the HTTP status (0 = network error). */
export class AiToolError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'AiToolError';
    this.status = status;
  }
}

type ApiBody = { success?: boolean; message?: unknown; errors?: Record<string, unknown>; data?: unknown } | null;

function firstValidationError(body: ApiBody): string | null {
  if (!body?.errors || typeof body.errors !== 'object') return null;
  for (const value of Object.values(body.errors)) {
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
    if (typeof value === 'string') return value;
  }
  return null;
}

/** Maps an HTTP status (and the API's message) to a clear, non-technical message. */
export function aiErrorMessage(status: number, body: ApiBody): string {
  const serverMessage = typeof body?.message === 'string' ? body.message : '';
  if (status === 429 || /quota|rate limit|too many/i.test(serverMessage)) {
    return 'Too many requests: the free AI quota is used up for the moment. Please wait a minute and try again, or log in and add your own Gemini API key.';
  }
  if (status === 422) {
    return firstValidationError(body) || (serverMessage && serverMessage !== 'Validation failed' ? serverMessage : 'Please check your text and try again.');
  }
  if (/too large|shorter content|token count/i.test(serverMessage)) {
    return 'Your text is too long for the AI model. Please shorten it and try again.';
  }
  if (status === 503) {
    return 'The AI service is temporarily unavailable. Please try again in a few minutes.';
  }
  if (status >= 500) {
    return 'The AI service could not process your text right now (server error). Please try again in a few minutes.';
  }
  return 'The AI service returned an unexpected response. Please try again.';
}

/**
 * POSTs JSON to an AI tool endpoint and returns `data` from `{ success: true, data }`.
 * Sends the login token when present so the backend can use the user's own Gemini key.
 * Throws AiToolError with a user-facing message on any failure (except aborts).
 */
export async function postAiTool<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
  try {
    const token = localStorage.getItem('token');
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    // Storage blocked: continue without a token.
  }

  let response: Response;
  try {
    response = await fetch(`${AI_API_URL}${path}`, { method: 'POST', headers, body: JSON.stringify(body), signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new AiToolError('Could not reach the AI service. Check your internet connection and try again.', 0);
  }

  let json: ApiBody = null;
  try {
    json = (await response.json()) as ApiBody;
  } catch {
    json = null;
  }

  if (!response.ok || !json?.success || json.data == null || typeof json.data !== 'object') {
    throw new AiToolError(aiErrorMessage(response.ok ? 0 : response.status, json), response.status);
  }
  return json.data as T;
}

export const isAbortError = (err: unknown) => err instanceof DOMException && err.name === 'AbortError';

/** Returns a function that aborts the previous request and gives a fresh signal; aborts on unmount. */
export function useAbortableRequest() {
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  return useCallback(() => {
    controller.current?.abort();
    controller.current = new AbortController();
    return controller.current.signal;
  }, []);
}

export const countWords = (text: string) => (text.trim() ? text.trim().split(/\s+/u).length : 0);

/** Copy text with visible feedback. `copied` holds the id of the last copied item for 2 s. */
export function useCopyToClipboard() {
  const [copied, setCopied] = useState<string | null>(null);
  const [copyError, setCopyError] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = useCallback(async (text: string, id = 'result') => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      // Fallback for browsers without the async clipboard API.
      try {
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        ok = document.execCommand('copy');
        area.remove();
      } catch {
        ok = false;
      }
    }
    setCopyError(!ok);
    setCopied(ok ? id : null);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setCopied(null);
      setCopyError(false);
    }, 2000);
  }, []);

  return { copied, copyError, copy };
}

/** Saves text as a UTF-8 file. */
export function downloadTextFile(text: string, filename: string, type = 'text/plain') {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Submit on Ctrl/Cmd + Enter inside the input. */
export const isSubmitShortcut = (e: KeyboardEvent) => e.key === 'Enter' && (e.ctrlKey || e.metaKey);

/**
 * Text state capped at `max` characters. Longer pastes are truncated and `truncated`
 * is set so the UI can explain what happened (instead of silently dropping text).
 */
export function useLimitedText(max: number) {
  const [text, setTextState] = useState('');
  const [truncated, setTruncated] = useState(false);
  const setText = useCallback(
    (value: string) => {
      setTruncated(value.length > max);
      setTextState(value.length > max ? value.slice(0, max) : value);
    },
    [max],
  );
  const onChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value), [setText]);
  return { text, setText, onChange, truncated };
}
