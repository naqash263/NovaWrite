// Small presentational pieces shared by the AI tools. Headings start at h2 (the page owns h1).
import type { ReactNode } from 'react';
import { countWords } from './aiToolClient';

export const inputClass =
  'w-full rounded-lg border border-gray-300 p-3 text-base text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 aria-[invalid=true]:border-red-400';
export const primaryButtonClass =
  'inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-8 py-3 text-lg font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400 sm:w-auto';
export const secondaryButtonClass =
  'inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50';

export function ToolCard({ children }: { children: ReactNode }) {
  return <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">{children}</div>;
}

/** "123 words · 1,234 / 5,000 characters" with limit hints. */
export function TextCounter({ id, text, min, max, truncated }: { id: string; text: string; min: number; max: number; truncated: boolean }) {
  const chars = text.length;
  const near = chars >= max * 0.9;
  return (
    <div id={id} className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm text-gray-500">
      <span>
        Minimum {min.toLocaleString()} {min === 1 ? 'character' : 'characters'}, maximum {max.toLocaleString()}.
      </span>
      <span data-testid="text-counter" className={near ? 'font-medium text-amber-700' : undefined}>
        {countWords(text).toLocaleString()} words · {chars.toLocaleString()} / {max.toLocaleString()} characters
      </span>
      {truncated && (
        <span className="w-full font-medium text-amber-700" data-testid="truncated-notice">
          Your text was longer than {max.toLocaleString()} characters, so only the first {max.toLocaleString()} were kept.
        </span>
      )}
    </div>
  );
}

export function ErrorAlert({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div role="alert" data-testid="tool-error-message" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <span aria-hidden="true">⚠️</span>
      <span>{message}</span>
    </div>
  );
}

/** Rendered only while a request is in flight (the page checks for no idle role="status"). */
export function LoadingNotice({ label }: { label: string }) {
  return (
    <div role="status" data-testid="ai-loading" className="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
      <span className="h-5 w-5 flex-none animate-spin rounded-full border-2 border-blue-600 border-t-transparent" aria-hidden="true" />
      <span>{label} This usually takes a few seconds.</span>
    </div>
  );
}

export function AiNotice() {
  return (
    <p className="text-xs leading-relaxed text-gray-500">
      Your text is sent to Google Gemini through this site&apos;s API to generate the result. AI output can contain mistakes, so
      review it before you use it. Press Ctrl + Enter (⌘ + Enter on Mac) in the text box to run.
    </p>
  );
}

/** Copy feedback announced to screen readers. */
export function CopyFeedback({ copied, copyError }: { copied: boolean; copyError: boolean }) {
  return (
    <span aria-live="polite" className="text-sm text-gray-600" data-testid="copy-feedback">
      {copied ? 'Copied to clipboard' : copyError ? 'Copy failed. Select the text and copy it manually.' : ''}
    </span>
  );
}
