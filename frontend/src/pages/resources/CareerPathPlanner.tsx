import React, { useState } from 'react';
import { useToast } from '../../hooks/use-toast';
import CareerToolLayout from '../../components/career/CareerToolLayout';
import StepIndicator from '../../components/career/StepIndicator';
import { asArray, asText, copyText, inputClass, labelClass, postCareerTool, splitList, toNumber } from '../../components/career/careerUtils';

interface CareerData {
  currentRole: string;
  industry: string;
  experienceYears: string;
  skills: string;
  interests: string;
  goals: string;
  location: string;
  educationLevel: string;
  preferences: string[];
}

interface CareerPath {
  title: string;
  description: string;
  timeline: string;
  probability: string;
  skills: string[];
  nextSteps: string[];
  futureSalary: number | null;
}

interface PlanItem {
  title: string;
  detail: string;
}

interface CareerPlan {
  paths: CareerPath[];
  skillGaps: { skill: string; importance: string; detail: string; resources: string[] }[];
  sections: { title: string; items: PlanItem[] }[];
}

const PREFERENCES = ['Remote work', 'Hybrid work', 'On-site work', 'Startup environment', 'Large corporation', 'People management', 'Individual contributor'];
const STEPS = ['Current Position', 'Skills & Interests', 'Goals', 'Preferences', 'Career Paths', 'Action Plan'];

function toItem(v: unknown, keys: [string, string[]]): PlanItem {
  if (typeof v === 'string') return { title: v, detail: '' };
  const o = (v ?? {}) as Record<string, unknown>;
  const [titleKey, detailKeys] = keys;
  return {
    title: asText(o[titleKey]) || asText(v),
    detail: detailKeys
      .map((k) => (o[k] ? `${k.charAt(0).toUpperCase() + k.slice(1)}: ${asText(o[k])}` : ''))
      .filter(Boolean)
      .join(' · '),
  };
}

function normalizePlan(raw: Record<string, unknown>): CareerPlan {
  const list = (v: unknown) => asArray(v).map(asText).filter(Boolean);
  const sections: CareerPlan['sections'] = [
    { title: 'Education & certifications', items: asArray(raw.education).map((e) => toItem(e, ['name', ['type', 'timeline', 'cost']])) },
    { title: 'Networking', items: asArray(raw.networking).map((e) => toItem(e, ['activity', ['timeline', 'benefit']])) },
    { title: 'Milestones', items: asArray(raw.milestones).map((e) => toItem(e, ['milestone', ['timeline', 'success']])) },
  ];
  // Older response shape: recommendations: [{ category, items: [] }]
  for (const rec of asArray<Record<string, unknown>>(raw.recommendations)) {
    sections.push({ title: asText(rec?.category) || 'Recommendations', items: list(rec?.items).map((t) => ({ title: t, detail: '' })) });
  }
  return {
    paths: asArray<Record<string, unknown>>(raw.careerPaths).map((p) => {
      const salary = (p?.salary ?? {}) as Record<string, unknown>;
      return {
        title: asText(p?.title) || 'Career path',
        description: asText(p?.description),
        timeline: asText(p?.timeline),
        probability: asText(p?.probability),
        skills: list(p?.skills),
        nextSteps: list(p?.nextSteps),
        futureSalary: toNumber(typeof salary === 'object' ? salary.future ?? salary.next : salary),
      };
    }),
    skillGaps: asArray<Record<string, unknown>>(raw.skillGaps).map((g) => ({
      skill: asText(g?.skill ?? g),
      importance: asText(g?.importance),
      detail: [asText(g?.action), g?.timeline ? `Timeline: ${asText(g.timeline)}` : '', g?.currentLevel ? `${asText(g.currentLevel)} → ${asText(g.targetLevel)}` : '']
        .filter(Boolean)
        .join(' · '),
      resources: list(g?.resources),
    })),
    sections: sections.filter((s) => s.items.length > 0),
  };
}

const importanceClass = (v: string) => (/high/i.test(v) ? 'bg-red-100 text-red-800' : /low/i.test(v) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800');

const CareerPathPlanner: React.FC = () => {
  const { addToast } = useToast();
  const [data, setData] = useState<CareerData>({
    currentRole: '',
    industry: '',
    experienceYears: '',
    skills: '',
    interests: '',
    goals: '',
    location: '',
    educationLevel: 'bachelor',
    preferences: [],
  });
  const [plan, setPlan] = useState<CareerPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  const set = (field: keyof CareerData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setData((d) => ({ ...d, [field]: e.target.value }));

  const goTo = (step: number) => {
    setError('');
    setCurrentStep(step);
  };

  const validate = (step: number) => {
    const years = Number(data.experienceYears);
    if (step === 0 && (!data.currentRole.trim() || !data.industry || data.experienceYears === '' || !Number.isInteger(years) || years < 0 || years > 50))
      return 'Enter your current job title, industry and years of experience (0–50).';
    if (step === 1 && (splitList(data.skills).length === 0 || splitList(data.interests).length === 0)) return 'List at least one skill and one career interest.';
    if (step === 2 && data.goals.trim().length < 10) return 'Describe your career goals in a sentence or two.';
    return '';
  };

  const next = (step: number) => {
    const message = validate(step);
    if (message) setError(message);
    else goTo(step + 1);
  };

  const generateCareerPlan = async () => {
    setError('');
    setIsGenerating(true);
    const result = await postCareerTool<Record<string, unknown>>('career-path/generate', {
      current_role: data.currentRole.trim(),
      experience_years: Number(data.experienceYears),
      skills: splitList(data.skills),
      interests: splitList(data.interests),
      career_goals: data.goals.trim().slice(0, 1000),
      industry: data.industry,
      education_level: data.educationLevel,
      location: data.location.trim() || undefined,
      work_preferences: data.preferences,
    });
    setIsGenerating(false);
    if (!result.ok) {
      setError(result.message);
      addToast({ type: 'error', title: 'Generation failed', description: result.message });
      return;
    }
    setPlan(normalizePlan(result.data));
    goTo(4);
    addToast({ type: 'success', title: 'Career plan ready', description: 'Review the suggested paths, then open the action plan.' });
  };

  const planToText = (p: CareerPlan) => {
    const lines = [`Career plan for ${data.currentRole}`, '', 'Career paths:'];
    p.paths.forEach((path) => {
      lines.push(`- ${path.title}${path.timeline ? ` (${path.timeline})` : ''}: ${path.description}`);
      path.nextSteps.forEach((s) => lines.push(`    • ${s}`));
    });
    if (p.skillGaps.length) lines.push('', 'Skill gaps:', ...p.skillGaps.map((g) => `- ${g.skill}${g.importance ? ` [${g.importance}]` : ''}${g.detail ? `: ${g.detail}` : ''}`));
    p.sections.forEach((s) => lines.push('', `${s.title}:`, ...s.items.map((i) => `- ${i.title}${i.detail ? ` (${i.detail})` : ''}`)));
    return lines.join('\n');
  };

  const errorBox = error ? (
    <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      {error}
    </div>
  ) : null;

  const navButtons = (back: number | null, onNext: () => void, nextLabel: string, disabled = false, backLabel = 'Back') => (
    <div className="flex flex-col gap-3 sm:flex-row">
      {back !== null && (
        <button type="button" onClick={() => goTo(back)} className="flex-1 rounded-md bg-gray-600 px-6 py-3 font-medium text-white hover:bg-gray-700">
          {backLabel}
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={disabled}
        className="flex-1 rounded-md bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {nextLabel}
      </button>
    </div>
  );

  const heading = (title: string, text: string) => (
    <div className="text-center">
      <h2 className="mb-2 text-2xl font-bold text-gray-900">{title}</h2>
      <p className="text-gray-600">{text}</p>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            {heading('Current Position', 'Tell us about your current role and industry.')}
            <div className="space-y-4">
              <div>
                <label htmlFor="cp-role" className={labelClass}>
                  Current Job Title *
                </label>
                <input id="cp-role" type="text" value={data.currentRole} onChange={set('currentRole')} maxLength={255} className={inputClass} placeholder="e.g., QA Engineer" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="cp-industry" className={labelClass}>
                    Industry *
                  </label>
                  <select id="cp-industry" value={data.industry} onChange={set('industry')} className={inputClass}>
                    <option value="">Select industry</option>
                    <option value="technology">Technology</option>
                    <option value="finance">Finance</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="education">Education</option>
                    <option value="consulting">Consulting</option>
                    <option value="marketing">Marketing</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="cp-years" className={labelClass}>
                    Years of Experience *
                  </label>
                  <input id="cp-years" type="number" inputMode="numeric" min={0} max={50} step={1} value={data.experienceYears} onChange={set('experienceYears')} className={inputClass} placeholder="e.g., 4" />
                </div>
              </div>
            </div>
            {errorBox}
            {navButtons(null, () => next(0), 'Continue')}
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            {heading('Skills & Interests', 'Your skills show your strengths; your interests show where you want to grow.')}
            <div className="space-y-4">
              <div>
                <label htmlFor="cp-skills" className={labelClass}>
                  Current Skills (comma-separated) *
                </label>
                <input id="cp-skills" type="text" value={data.skills} onChange={set('skills')} className={inputClass} placeholder="e.g., Test Automation, SQL, Stakeholder Communication" />
              </div>
              <div>
                <label htmlFor="cp-interests" className={labelClass}>
                  Career Interests (comma-separated) *
                </label>
                <input id="cp-interests" type="text" value={data.interests} onChange={set('interests')} className={inputClass} placeholder="e.g., Leadership, Product Management, Data Science" />
              </div>
            </div>
            {errorBox}
            {navButtons(0, () => next(1), 'Continue')}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {heading('Goals', 'Where do you want to be, and where do you want to work?')}
            <div className="space-y-4">
              <div>
                <label htmlFor="cp-goals" className={labelClass}>
                  Career Goals *
                </label>
                <textarea id="cp-goals" value={data.goals} onChange={set('goals')} rows={4} maxLength={1000} className={inputClass} placeholder="e.g., Move into a QA lead role within two years and manage a small team." />
                <p className="mt-1 text-right text-sm text-gray-500">{data.goals.length}/1000</p>
              </div>
              <div>
                <label htmlFor="cp-location" className={labelClass}>
                  Preferred Location
                </label>
                <input id="cp-location" type="text" value={data.location} onChange={set('location')} className={inputClass} placeholder="e.g., Dubai or Remote" />
              </div>
            </div>
            {errorBox}
            {navButtons(1, () => next(2), 'Continue')}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {heading('Preferences', 'Optional: these help the plan suggest realistic routes.')}
            <fieldset className="rounded-lg bg-blue-50 p-4 sm:p-6">
              <legend className="px-1 text-lg font-semibold text-gray-900">Work preferences</legend>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {PREFERENCES.map((pref) => (
                  <label key={pref} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={data.preferences.includes(pref)}
                      onChange={(e) =>
                        setData((d) => ({ ...d, preferences: e.target.checked ? [...d.preferences, pref] : d.preferences.filter((p) => p !== pref) }))
                      }
                      className="h-4 w-4"
                    />
                    <span>{pref}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor="cp-education" className={labelClass}>
                Highest Education Level
              </label>
              <select id="cp-education" value={data.educationLevel} onChange={set('educationLevel')} className={inputClass}>
                <option value="high_school">High school</option>
                <option value="bachelor">Bachelor's degree</option>
                <option value="master">Master's degree</option>
                <option value="phd">PhD</option>
              </select>
            </div>
            {errorBox}
            {navButtons(2, generateCareerPlan, isGenerating ? 'Generating Plan…' : 'Generate Career Plan', isGenerating)}
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            {heading('Career Paths', 'Suggested routes from your current role. Salary figures are AI estimates.')}
            {plan && plan.paths.length > 0 ? (
              <div className="space-y-6">
                {plan.paths.map((path, index) => (
                  <article key={index} className="rounded-lg border bg-white p-4 sm:p-6">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="mb-2 text-xl font-semibold text-gray-900">{path.title}</h3>
                        {path.description && <p className="mb-3 text-gray-600">{path.description}</p>}
                        <div className="flex flex-wrap items-center gap-3">
                          {path.timeline && <span className="text-sm text-gray-500">Timeline: {path.timeline}</span>}
                          {path.probability && <span className={`rounded-full px-2 py-1 text-xs font-medium ${importanceClass(path.probability)}`}>{path.probability} likelihood</span>}
                        </div>
                      </div>
                      {path.futureSalary !== null && (
                        <div className="sm:text-right">
                          <div className="text-2xl font-bold text-green-600">{path.futureSalary.toLocaleString('en')}</div>
                          <div className="text-sm text-gray-500">Potential salary (estimate)</div>
                        </div>
                      )}
                    </div>
                    {path.skills.length > 0 && (
                      <div className="mb-4">
                        <h4 className="mb-2 font-medium text-gray-900">Required skills</h4>
                        <ul className="flex flex-wrap gap-2">
                          {path.skills.map((s) => (
                            <li key={s} className="rounded bg-blue-100 px-2 py-1 text-sm text-blue-800">
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {path.nextSteps.length > 0 && (
                      <div>
                        <h4 className="mb-2 font-medium text-gray-900">Next steps</h4>
                        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600">
                          {path.nextSteps.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <p className="italic text-gray-500">No career paths were returned. Try adding more detail to your goals.</p>
            )}
            {navButtons(0, () => goTo(5), 'View Action Plan', false, 'Start Over')}
          </div>
        );

      case 5:
        return (
          <div className="space-y-8">
            {heading('Your Action Plan', 'Close the highest-priority gaps first and review the plan every few months.')}
            {plan && (
              <>
                {plan.skillGaps.length > 0 && (
                  <div className="rounded-lg bg-blue-50 p-4 sm:p-6">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Skill development plan</h3>
                    <ul className="space-y-4">
                      {plan.skillGaps.map((gap) => (
                        <li key={gap.skill} className="rounded-lg bg-white p-4">
                          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                            <h4 className="font-medium text-gray-900">{gap.skill}</h4>
                            {gap.importance && <span className={`rounded-full px-2 py-1 text-xs font-medium ${importanceClass(gap.importance)}`}>{gap.importance} priority</span>}
                          </div>
                          {gap.detail && <p className="text-sm text-gray-600">{gap.detail}</p>}
                          {gap.resources.length > 0 && <p className="mt-1 text-sm text-gray-600">Resources: {gap.resources.join(', ')}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {plan.sections.map((section) => (
                  <div key={section.title} className="rounded-lg border bg-white p-4 sm:p-6">
                    <h3 className="mb-3 text-lg font-semibold text-gray-900">{section.title}</h3>
                    <ul className="space-y-2">
                      {section.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-0.5 text-green-600" aria-hidden="true">
                            ✓
                          </span>
                          <span className="text-gray-700">
                            {item.title}
                            {item.detail && <span className="block text-sm text-gray-500">{item.detail}</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {navButtons(
                  4,
                  async () => {
                    const ok = await copyText(planToText(plan));
                    addToast(
                      ok
                        ? { type: 'success', title: 'Copied to clipboard', description: 'Your career plan has been copied as text.' }
                        : { type: 'error', title: 'Copy failed', description: 'Your browser blocked clipboard access.' },
                    );
                  },
                  'Copy Action Plan',
                  false,
                  'Back to Career Paths',
                )}
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <CareerToolLayout slug="career-path-planner">
      <div className="mx-auto max-w-4xl">
        <StepIndicator steps={STEPS} current={currentStep} />
        <div className="rounded-lg bg-white p-4 shadow-lg sm:p-6 lg:p-8">{renderStepContent()}</div>
      </div>
    </CareerToolLayout>
  );
};

export default CareerPathPlanner;
