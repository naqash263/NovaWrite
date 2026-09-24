import React, { useState } from 'react';
import { useToast } from '../../hooks/use-toast';
import CareerToolLayout from '../../components/career/CareerToolLayout';
import StepIndicator from '../../components/career/StepIndicator';
import { asArray, asText, copyText, inputClass, labelClass, postCareerTool, splitList, toNumber } from '../../components/career/careerUtils';

interface ProfileForm {
  headline: string;
  summary: string;
  skills: string;
  industry: string;
}

interface Recommendation {
  category: string;
  priority: string;
  suggestion: string;
  example: string;
}

interface LinkedInAnalysis {
  headlineScore: number | null;
  summaryScore: number | null;
  skillsScore: number | null;
  overallScore: number | null;
  recommendations: Recommendation[];
  keywordSuggestions: string[];
  profileStrengths: string[];
  areasForImprovement: string[];
  industryKeywords: string[];
}

// LinkedIn limits: headline 220 characters; the API accepts an About section up to 2,000.
const HEADLINE_MAX = 220;
const SUMMARY_MAX = 2000;
const STEPS = ['Your Profile', 'Results & Action Plan'];

function normalizeAnalysis(raw: Record<string, unknown>): LinkedInAnalysis {
  const list = (v: unknown) => asArray(v).map(asText).filter(Boolean);
  return {
    headlineScore: toNumber(raw.headlineScore),
    summaryScore: toNumber(raw.summaryScore),
    skillsScore: toNumber(raw.skillsScore),
    overallScore: toNumber(raw.overallScore),
    recommendations: asArray<Record<string, unknown>>(raw.recommendations).map((r) => ({
      category: asText(r?.category) || 'General',
      priority: asText(r?.priority) || 'Medium',
      suggestion: asText(r?.suggestion ?? r?.description),
      example: asText(r?.example ?? r?.action),
    })),
    keywordSuggestions: list(raw.keywordSuggestions),
    profileStrengths: list(raw.profileStrengths ?? raw.strengths),
    areasForImprovement: list(raw.areasForImprovement ?? raw.weaknesses),
    industryKeywords: list(raw.industryKeywords),
  };
}

const score = (n: number | null) => (n === null ? '–' : `${Math.round(n)}%`);

function analysisToText(a: LinkedInAnalysis): string {
  const lines = [
    'LinkedIn profile analysis',
    `Overall: ${score(a.overallScore)} | Headline: ${score(a.headlineScore)} | Summary: ${score(a.summaryScore)} | Skills: ${score(a.skillsScore)}`,
    '',
    'Recommendations:',
    ...a.recommendations.map((r) => `- [${r.priority}] ${r.category}: ${r.suggestion}${r.example ? ` (Example: ${r.example})` : ''}`),
  ];
  if (a.keywordSuggestions.length) lines.push('', `Keyword suggestions: ${a.keywordSuggestions.join(', ')}`);
  if (a.profileStrengths.length) lines.push('', 'Strengths:', ...a.profileStrengths.map((s) => `- ${s}`));
  if (a.areasForImprovement.length) lines.push('', 'Areas for improvement:', ...a.areasForImprovement.map((s) => `- ${s}`));
  if (a.industryKeywords.length) lines.push('', `Industry keywords: ${a.industryKeywords.join(', ')}`);
  return lines.join('\n');
}

const LinkedInOptimizer: React.FC = () => {
  const { addToast } = useToast();
  const [profile, setProfile] = useState<ProfileForm>({ headline: '', summary: '', skills: '', industry: '' });
  const [optimizations, setOptimizations] = useState<LinkedInAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  const skills = splitList(profile.skills);

  const handleAnalyze = async () => {
    if (!profile.headline.trim() && !profile.summary.trim() && skills.length === 0) {
      setError('Add at least your headline, About section or skills so there is something to analyse.');
      return;
    }
    setError('');
    setIsAnalyzing(true);
    const result = await postCareerTool<Record<string, unknown>>('linkedin/analyze', {
      profile_data: {
        headline: profile.headline.trim(),
        summary: profile.summary.trim(),
        skills,
        experience: [],
        education: [],
        industry: profile.industry.trim() || undefined,
      },
    });
    setIsAnalyzing(false);
    if (!result.ok) {
      setError(result.message);
      addToast({ type: 'error', title: 'Analysis failed', description: result.message });
      return;
    }
    setOptimizations(normalizeAnalysis(result.data));
    setCurrentStep(1);
    addToast({ type: 'success', title: 'Analysis complete', description: 'Review the scores and recommendations below.' });
  };

  const addKeyword = (keyword: string) => {
    if (skills.some((s) => s.toLowerCase() === keyword.toLowerCase())) return;
    setProfile((p) => ({ ...p, skills: [...skills, keyword].join(', ') }));
  };

  const priorityClass = (p: string) =>
    /high/i.test(p) ? 'bg-red-100 text-red-800' : /low/i.test(p) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';

  const renderProfileStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Profile Information</h2>
        <p className="text-gray-600">Paste the sections recruiters see first. You don't need to connect your LinkedIn account.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="li-headline" className={labelClass}>
            Current Headline
          </label>
          <input
            id="li-headline"
            type="text"
            value={profile.headline}
            maxLength={HEADLINE_MAX}
            onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
            className={inputClass}
            placeholder="e.g., QA Automation Lead | Playwright, CI/CD | Helping SaaS teams ship faster"
            aria-describedby="li-headline-count"
          />
          <p id="li-headline-count" className="mt-1 flex justify-between gap-2 text-sm text-gray-500">
            <span>Put your role and main keywords first; long headlines are truncated in search results.</span>
            <span data-testid="headline-count" className={profile.headline.length > 200 ? 'text-orange-600' : ''}>
              {profile.headline.length}/{HEADLINE_MAX}
            </span>
          </p>
        </div>

        <div>
          <label htmlFor="li-summary" className={labelClass}>
            About Section
          </label>
          <textarea
            id="li-summary"
            value={profile.summary}
            maxLength={SUMMARY_MAX}
            onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
            rows={6}
            className={inputClass}
            placeholder="Paste your LinkedIn About section..."
          />
          <p className="mt-1 text-right text-sm text-gray-500">
            {profile.summary.length}/{SUMMARY_MAX}
          </p>
        </div>

        <div>
          <label htmlFor="li-skills" className={labelClass}>
            Skills (comma-separated)
          </label>
          <input
            id="li-skills"
            type="text"
            value={profile.skills}
            onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
            className={inputClass}
            placeholder="e.g., Test Automation, Playwright, Project Management, Leadership"
          />
          <p className="mt-1 text-sm text-gray-500">{skills.length} skills listed. Keep the ones most relevant to your target role at the top.</p>
        </div>

        <div>
          <label htmlFor="li-industry" className={labelClass}>
            Target role or industry (optional)
          </label>
          <input
            id="li-industry"
            type="text"
            value={profile.industry}
            onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
            className={inputClass}
            placeholder="e.g., SaaS product management"
          />
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        className="w-full rounded-md bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isAnalyzing ? 'Analyzing Profile…' : 'Analyze My Profile'}
      </button>
    </div>
  );

  const renderResults = (a: LinkedInAnalysis) => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Analysis Results</h2>
        <div className="mb-6 rounded-lg bg-blue-50 p-6">
          <p className="mb-1 text-4xl font-bold text-blue-600" data-testid="overall-score">
            {score(a.overallScore)}
          </p>
          <p className="text-blue-800">Overall profile score</p>
        </div>
      </div>

      <dl className="grid gap-4 sm:grid-cols-3">
        {[
          ['Headline', a.headlineScore],
          ['About section', a.summaryScore],
          ['Skills', a.skillsScore],
        ].map(([label, value]) => (
          <div key={label as string} className="flex flex-col-reverse rounded-lg border bg-white p-4">
            <dt className="text-sm text-gray-600">{label} score</dt>
            <dd className="mb-1 text-2xl font-bold text-green-600">{score(value as number | null)}</dd>
          </div>
        ))}
      </dl>

      <section>
        <h3 className="mb-4 text-xl font-semibold text-gray-900">Recommendations</h3>
        {a.recommendations.length > 0 ? (
          <ul className="space-y-4">
            {a.recommendations.map((rec, index) => (
              <li key={index} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                  <h4 className="font-medium text-gray-900">{rec.category}</h4>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${priorityClass(rec.priority)}`}>{rec.priority} priority</span>
                </div>
                <p className="mb-2 text-gray-600">{rec.suggestion}</p>
                {rec.example && (
                  <p className="rounded bg-gray-50 p-3 text-sm">
                    <strong>Example:</strong> {rec.example}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="italic text-gray-500">No recommendations returned.</p>
        )}
      </section>

      {a.keywordSuggestions.length > 0 && (
        <section>
          <h3 className="mb-2 text-xl font-semibold text-gray-900">Keyword suggestions</h3>
          <p className="mb-3 text-sm text-gray-600">Click a keyword to add it to your skills list, then copy the list into LinkedIn.</p>
          <div className="flex flex-wrap gap-2">
            {a.keywordSuggestions.map((keyword) => {
              const added = skills.some((s) => s.toLowerCase() === keyword.toLowerCase());
              return (
                <button
                  type="button"
                  key={keyword}
                  onClick={() => addKeyword(keyword)}
                  aria-pressed={added}
                  className={`rounded-full px-3 py-1 text-sm ${added ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}
                >
                  {added ? '✓' : '+'} {keyword}
                </button>
              );
            })}
          </div>
          <p className="mt-3 break-words text-sm text-gray-700" data-testid="skills-list">
            <strong>Your skills:</strong> {skills.join(', ') || '–'}
          </p>
        </section>
      )}

      <section>
        <h3 className="mb-4 text-xl font-semibold text-gray-900">Action plan</h3>
        <ol className="space-y-4">
          {[
            ['Headline', a.headlineScore, 'Lead with your target role and two or three keywords, then add the value you bring. Keep the key terms in the first 60 characters.'],
            ['About section', a.summaryScore, 'Open with who you help and how, add two or three quantified achievements and finish with a call to action.'],
            ['Skills', a.skillsScore, 'List the skills from your target job descriptions, pin the top three and ask colleagues for endorsements.'],
            ['Profile completeness', null, 'Add a professional photo, a banner, detailed experience entries, education and certifications.'],
          ].map(([title, value, text], i) => (
            <li key={title as string} className="flex gap-4">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">{i + 1}</span>
              <div>
                <h4 className="font-semibold text-gray-900">
                  {title as string}
                  {value !== null && <span className="ml-2 text-sm font-normal text-gray-500">current score {score(value as number)}</span>}
                </h4>
                <p className="text-gray-600">{text as string}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {(a.profileStrengths.length > 0 || a.areasForImprovement.length > 0) && (
        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <h3 className="mb-2 font-medium text-green-900">What's working well</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm text-green-800">
              {a.profileStrengths.length ? a.profileStrengths.map((s) => <li key={s}>{s}</li>) : <li>No strengths returned.</li>}
            </ul>
          </div>
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <h3 className="mb-2 font-medium text-yellow-900">Areas for improvement</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm text-yellow-800">
              {a.areasForImprovement.length ? a.areasForImprovement.map((s) => <li key={s}>{s}</li>) : <li>No areas returned.</li>}
            </ul>
          </div>
        </section>
      )}

      {a.industryKeywords.length > 0 && (
        <section>
          <h3 className="mb-3 text-xl font-semibold text-gray-900">Industry keywords</h3>
          <ul className="flex flex-wrap gap-2">
            {a.industryKeywords.map((k) => (
              <li key={k} className="rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-800">
                {k}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          type="button"
          onClick={() => setCurrentStep(0)}
          className="flex-1 rounded-md bg-gray-600 px-6 py-3 font-medium text-white hover:bg-gray-700"
        >
          Edit Profile &amp; Re-analyze
        </button>
        <button
          type="button"
          onClick={async () => {
            const ok = await copyText(analysisToText(a));
            addToast(
              ok
                ? { type: 'success', title: 'Copied to clipboard', description: 'Your analysis has been copied as text.' }
                : { type: 'error', title: 'Copy failed', description: 'Your browser blocked clipboard access.' },
            );
          }}
          className="flex-1 rounded-md bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
        >
          Copy Results
        </button>
      </div>
    </div>
  );

  return (
    <CareerToolLayout slug="linkedin-optimizer">
      <div className="mx-auto max-w-4xl">
        <StepIndicator steps={STEPS} current={currentStep} />
        <div className="rounded-lg bg-white p-4 shadow-lg sm:p-6 lg:p-8">
          {currentStep === 1 && optimizations ? renderResults(optimizations) : renderProfileStep()}
        </div>
      </div>
    </CareerToolLayout>
  );
};

export default LinkedInOptimizer;
