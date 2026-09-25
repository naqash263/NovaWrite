import { useDeferredValue, useId, useMemo } from 'react';
import type { CVData } from './cv-form';
import { matchCv } from './ats-match';

const scoreTone = (score: number) => (score >= 75 ? 'text-green-700 bg-green-50 border-green-200' : score >= 50 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-red-700 bg-red-50 border-red-200');

/**
 * Paste a job description and see which of its keywords the CV already contains.
 * Runs in the browser; the job description is saved with the CV in local storage only.
 */
export default function AtsMatchPanel({ data, onDataChange }: { data: CVData; onDataChange: (data: CVData) => void }) {
  const headingId = useId();
  const inputId = useId();
  const jobDescription = data.jobDescription || '';
  const deferred = useDeferredValue(jobDescription);
  const result = useMemo(() => (deferred.trim().length >= 30 ? matchCv(data, deferred) : null), [data, deferred]);

  const addToSkills = (keyword: string) => {
    const current = String(data.skills || '').trim();
    const list = current ? current.split(/\s*,\s*/) : [];
    if (list.some((s) => s.toLowerCase() === keyword.toLowerCase())) return;
    onDataChange({ ...data, skills: current ? `${current.replace(/,\s*$/, '')}, ${keyword}` : keyword });
  };

  return (
    <section aria-labelledby={headingId} className="mx-auto mt-8 max-w-4xl rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <h3 id={headingId} className="text-lg font-semibold text-gray-900">
        ATS keyword match
      </h3>
      <p className="mt-1 text-sm text-gray-600">
        Paste a job ad to see which of its keywords your CV already uses. The check runs in your browser and nothing is uploaded. It is a guide to wording, not a
        prediction of any employer&apos;s system.
      </p>
      <label htmlFor={inputId} className="mt-4 block text-sm font-medium text-gray-700">
        Job description for keyword match
      </label>
      <textarea
        id={inputId}
        value={jobDescription}
        onChange={(e) => onDataChange({ ...data, jobDescription: e.target.value })}
        rows={6}
        placeholder="Paste the full job description here…"
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {!result && <p className="mt-2 text-xs text-gray-500">Paste at least a few sentences of the job description to see your match.</p>}

      {result && (
        <div className="mt-4 space-y-4" aria-live="polite">
          <div className={`flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 ${scoreTone(result.score)}`}>
            <span className="text-3xl font-bold" data-testid="ats-score">
              {result.score}%
            </span>
            <span className="text-sm">
              keyword match: {result.matched.length} of {result.keywords.length} top keywords found in your CV
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-2 text-sm font-semibold text-gray-900">Matched keywords</h4>
              <ul data-testid="ats-matched" className="flex flex-wrap gap-1.5">
                {result.matched.length === 0 && <li className="text-sm text-gray-500">None yet</li>}
                {result.matched.map((k) => (
                  <li key={k.term} className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs text-green-800">
                    {k.display}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-semibold text-gray-900">Missing keywords</h4>
              <ul data-testid="ats-missing" className="flex flex-wrap gap-1.5">
                {result.missing.length === 0 && <li className="text-sm text-gray-500">None: every top keyword appears in your CV</li>}
                {result.missing.map((k) => (
                  <li key={k.term}>
                    <button
                      type="button"
                      onClick={() => addToSkills(k.display)}
                      aria-label={`Add ${k.display} to skills`}
                      className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs text-red-800 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      + {k.display}
                    </button>
                  </li>
                ))}
              </ul>
              {result.missing.length > 0 && <p className="mt-2 text-xs text-gray-500">Click a keyword to add it to your skills. Only add skills you really have.</p>}
            </div>
          </div>

          {result.suggestions.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-gray-900">Suggestions</h4>
              <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                {result.suggestions.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
