import React, { useState } from 'react';
import { useToast } from '../../hooks/use-toast';
import CareerToolLayout from '../../components/career/CareerToolLayout';
import StepIndicator from '../../components/career/StepIndicator';
import { asArray, asText, copyText, inputClass, labelClass, postCareerTool, splitList, toNumber } from '../../components/career/careerUtils';

interface JobSearchData {
  jobTitle: string;
  location: string;
  experienceYears: string;
  industry: string;
  skills: string;
  preferences: string[];
  jobType: string;
  currency: string;
  salary: string;
  companySize: string;
}

interface JobRecommendation {
  title: string;
  company: string;
  location: string;
  salary: string;
  match: string;
  description: string;
  whyMatch: string;
  applicationTips: string[];
}

interface Strategy {
  jobs: JobRecommendation[];
  keywords: string[];
  platforms: string[];
  timing: string;
  frequency: string;
  resumeTips: string[];
  coverLetterTips: string[];
  portfolioTips: string[];
  online: string[];
  offline: string[];
  informational: string[];
  commonQuestions: string[];
  technicalQuestions: string[];
  salaryTips: { label: string; text: string }[];
}

const PREFERENCES = ['Remote Work', 'Flexible Hours', 'Startup Environment', 'Large Corporation', 'Team Leadership', 'Individual Contributor', 'Fast-Paced', 'Stable Environment'];
const STEPS = ['Target Role', 'Skills & Preferences', 'Job Type & Salary', 'Your Strategy'];
const TABS = [
  { id: 'jobs', label: 'Jobs' },
  { id: 'applications', label: 'Applications' },
  { id: 'networking', label: 'Networking' },
] as const;
type TabId = (typeof TABS)[number]['id'];

function normalizeStrategy(raw: Record<string, unknown>): Strategy {
  const obj = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
  const list = (v: unknown) => asArray(v).map(asText).filter(Boolean);
  const search = obj(raw.searchStrategy);
  const app = obj(raw.applicationOptimization);
  const net = obj(raw.networkingStrategy);
  const interview = obj(raw.interviewPreparation ?? raw.interviewPrep);
  const salary = obj(raw.salaryNegotiation);
  return {
    jobs: asArray<Record<string, unknown>>(raw.jobRecommendations).map((j) => ({
      title: asText(j?.title) || 'Suggested role',
      company: asText(j?.company),
      location: asText(j?.location),
      salary: asText(j?.salary),
      match: asText(j?.match),
      description: asText(j?.description),
      whyMatch: asText(j?.whyMatch),
      applicationTips: list(j?.applicationTips),
    })),
    keywords: list(search.keywords),
    platforms: list(search.platforms ?? search.jobBoards),
    timing: asText(search.timing),
    frequency: asText(search.frequency),
    resumeTips: list(app.resumeTips),
    coverLetterTips: list(app.coverLetterTips),
    portfolioTips: list(app.portfolioTips),
    online: list(net.online),
    offline: list(net.offline),
    informational: list(net.informationalInterviews),
    commonQuestions: list(interview.commonQuestions),
    technicalQuestions: list(interview.technicalQuestions ?? interview.technicalFocus),
    salaryTips: Object.entries(salary)
      .map(([k, v]) => ({ label: k.charAt(0).toUpperCase() + k.slice(1), text: asText(v) }))
      .filter((t) => t.text),
  };
}

const Card = ({ title, items, marker = '•' }: { title: string; items: string[]; marker?: string }) =>
  items.length ? (
    <div className="rounded-lg border bg-white p-4 sm:p-6">
      <h3 className="mb-3 text-lg font-semibold text-gray-900">{title}</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
            <span className="mt-0.5 text-blue-600" aria-hidden="true">
              {marker}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  ) : null;

const JobSearchOptimizer: React.FC = () => {
  const { addToast } = useToast();
  const [data, setData] = useState<JobSearchData>({
    jobTitle: '',
    location: '',
    experienceYears: '',
    industry: '',
    skills: '',
    preferences: [],
    jobType: 'full_time',
    currency: 'USD',
    salary: '',
    companySize: '',
  });
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [tab, setTab] = useState<TabId>('jobs');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  const set = (field: keyof JobSearchData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setData((d) => ({ ...d, [field]: e.target.value }));

  const goTo = (step: number) => {
    setError('');
    setCurrentStep(step);
  };

  const validate = (step: number) => {
    const years = Number(data.experienceYears);
    if (step === 0 && (!data.jobTitle.trim() || !data.location.trim() || !data.industry || data.experienceYears === '' || !Number.isInteger(years) || years < 0 || years > 50))
      return 'Enter the job title, location, industry and your years of experience (0–50).';
    if (step === 1 && splitList(data.skills).length === 0) return 'List at least one skill.';
    if (step === 2) {
      const salary = toNumber(data.salary);
      if (!data.jobType || salary === null || salary < 0) return 'Choose a job type and enter your expected annual salary as a number.';
    }
    return '';
  };

  const next = (step: number) => {
    const message = validate(step);
    if (message) setError(message);
    else goTo(step + 1);
  };

  const generateSearchStrategy = async () => {
    const message = validate(2);
    if (message) {
      setError(message);
      return;
    }
    setError('');
    setIsGenerating(true);
    const result = await postCareerTool<Record<string, unknown>>('job-search/generate', {
      job_title: data.jobTitle.trim(),
      location: data.location.trim(),
      experience_years: Number(data.experienceYears),
      skills: splitList(data.skills),
      salary_expectation: toNumber(data.salary),
      currency: data.currency,
      job_type: data.jobType,
      industry: data.industry,
      preferences: data.preferences,
      company_size: data.companySize || undefined,
    });
    setIsGenerating(false);
    if (!result.ok) {
      setError(result.message);
      addToast({ type: 'error', title: 'Generation failed', description: result.message });
      return;
    }
    setStrategy(normalizeStrategy(result.data));
    setTab('jobs');
    goTo(3);
    addToast({ type: 'success', title: 'Search strategy ready', description: 'Work through the Jobs, Applications and Networking tabs.' });
  };

  const strategyToText = (s: Strategy) =>
    [
      `Job search strategy: ${data.jobTitle} (${data.location})`,
      '',
      `Keywords: ${s.keywords.join(', ')}`,
      `Job boards: ${s.platforms.join(', ')}`,
      s.timing ? `Timing: ${s.timing}` : '',
      s.frequency ? `Frequency: ${s.frequency}` : '',
      '',
      'Example roles to search for:',
      ...s.jobs.map((j) => `- ${j.title}${j.company ? ` at ${j.company}` : ''}${j.location ? ` (${j.location})` : ''}`),
      '',
      'CV tips:',
      ...s.resumeTips.map((t) => `- ${t}`),
      '',
      'Cover letter tips:',
      ...s.coverLetterTips.map((t) => `- ${t}`),
      '',
      'Networking:',
      ...[...s.online, ...s.offline, ...s.informational].map((t) => `- ${t}`),
      '',
      'Interview questions to prepare:',
      ...[...s.commonQuestions, ...s.technicalQuestions].map((t) => `- ${t}`),
    ]
      .filter((l, i, all) => l !== '' || (i > 0 && all[i - 1] !== ''))
      .join('\n');

  const errorBox = error ? (
    <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      {error}
    </div>
  ) : null;

  const navButtons = (back: number | null, onNext: () => void, nextLabel: string, disabled = false) => (
    <div className="flex flex-col gap-3 sm:flex-row">
      {back !== null && (
        <button type="button" onClick={() => goTo(back)} className="flex-1 rounded-md bg-gray-600 px-6 py-3 font-medium text-white hover:bg-gray-700">
          Back
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

  const renderResults = (s: Strategy) => (
    <div className="space-y-6">
      {heading('Your Job Search Strategy', `A focused plan for ${data.jobTitle} roles in ${data.location}.`)}

      <div role="tablist" aria-label="Strategy sections" className="flex flex-wrap gap-2 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`js-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`js-panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2 font-medium ${tab === t.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`js-panel-${tab}`} aria-labelledby={`js-tab-${tab}`} className="space-y-6">
        {tab === 'jobs' && (
          <>
            <div className="rounded-lg bg-blue-50 p-4 sm:p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Search strategy</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 font-medium text-gray-900">Keywords to search</h4>
                  <ul className="flex flex-wrap gap-2" data-testid="search-keywords">
                    {s.keywords.map((k) => (
                      <li key={k} className="rounded bg-blue-100 px-2 py-1 text-sm text-blue-800">
                        {k}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="mb-2 font-medium text-gray-900">Job boards</h4>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                    {s.platforms.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
                {s.timing && (
                  <div>
                    <h4 className="mb-1 font-medium text-gray-900">When to apply</h4>
                    <p className="text-sm text-gray-700">{s.timing}</p>
                  </div>
                )}
                {s.frequency && (
                  <div>
                    <h4 className="mb-1 font-medium text-gray-900">Application pace</h4>
                    <p className="text-sm text-gray-700">{s.frequency}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="mb-1 text-lg font-semibold text-gray-900">Example roles to search for</h3>
              <p className="mb-4 text-sm text-gray-600">These are AI-generated examples, not live vacancies. Use the keywords above on job boards to find open roles.</p>
              {s.jobs.length ? (
                <ul className="space-y-4">
                  {s.jobs.map((job, i) => (
                    <li key={i} className="rounded-lg border bg-white p-4 sm:p-6">
                      <h4 className="text-lg font-semibold text-gray-900">{job.title}</h4>
                      <p className="mb-2 text-gray-600">{[job.company, job.location].filter(Boolean).join(' • ')}</p>
                      {job.description && <p className="mb-2 text-gray-700">{job.description}</p>}
                      <p className="mb-2 flex flex-wrap gap-3 text-sm">
                        {job.salary && <span className="font-semibold text-green-700">{job.salary}</span>}
                        {job.match && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-800">{job.match} match</span>}
                      </p>
                      {job.whyMatch && <p className="text-sm text-gray-600">{job.whyMatch}</p>}
                      {job.applicationTips.length > 0 && (
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
                          {job.applicationTips.map((t) => (
                            <li key={t}>{t}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="italic text-gray-500">No example roles were returned.</p>
              )}
            </div>
          </>
        )}

        {tab === 'applications' && (
          <div className="grid gap-6 md:grid-cols-3">
            <Card title="CV tips" items={s.resumeTips} marker="✓" />
            <Card title="Cover letter tips" items={s.coverLetterTips} marker="✓" />
            <Card title="Portfolio tips" items={s.portfolioTips} marker="✓" />
          </div>
        )}

        {tab === 'networking' && (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              <Card title="Online networking" items={s.online} />
              <Card title="Offline networking" items={s.offline} />
              <Card title="Informational interviews" items={s.informational} />
              <Card title="Interview questions to prepare" items={[...s.commonQuestions, ...s.technicalQuestions]} marker="?" />
            </div>
            {s.salaryTips.length > 0 && (
              <div className="rounded-lg bg-green-50 p-4 sm:p-6">
                <h3 className="mb-3 text-lg font-semibold text-gray-900">Salary negotiation tips</h3>
                <dl className="grid gap-4 md:grid-cols-2">
                  {s.salaryTips.map((t) => (
                    <div key={t.label}>
                      <dt className="font-medium text-gray-900">{t.label}</dt>
                      <dd className="text-sm text-gray-700">{t.text}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </>
        )}
      </div>

      {navButtons(
        0,
        async () => {
          const ok = await copyText(strategyToText(s));
          addToast(
            ok
              ? { type: 'success', title: 'Copied to clipboard', description: 'Your job search strategy has been copied as text.' }
              : { type: 'error', title: 'Copy failed', description: 'Your browser blocked clipboard access.' },
          );
        },
        'Copy Strategy',
      )}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            {heading('Target Role', 'Tell us what kind of job you are looking for.')}
            <div className="space-y-4">
              <div>
                <label htmlFor="js-title" className={labelClass}>
                  Desired Job Title *
                </label>
                <input id="js-title" type="text" value={data.jobTitle} onChange={set('jobTitle')} maxLength={255} className={inputClass} placeholder="e.g., Senior Software Engineer" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="js-location" className={labelClass}>
                    Preferred Location *
                  </label>
                  <input id="js-location" type="text" value={data.location} onChange={set('location')} maxLength={100} className={inputClass} placeholder="e.g., Dubai or Remote" />
                </div>
                <div>
                  <label htmlFor="js-years" className={labelClass}>
                    Years of Experience *
                  </label>
                  <input id="js-years" type="number" inputMode="numeric" min={0} max={50} step={1} value={data.experienceYears} onChange={set('experienceYears')} className={inputClass} placeholder="e.g., 5" />
                </div>
              </div>
              <div>
                <label htmlFor="js-industry" className={labelClass}>
                  Industry *
                </label>
                <select id="js-industry" value={data.industry} onChange={set('industry')} className={inputClass}>
                  <option value="">Select industry</option>
                  <option value="Technology">Technology</option>
                  <option value="Finance">Finance</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            {errorBox}
            {navButtons(null, () => next(0), 'Continue')}
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            {heading('Skills & Preferences', 'What skills and working style should the search target?')}
            <div>
              <label htmlFor="js-skills" className={labelClass}>
                Skills (comma-separated) *
              </label>
              <input id="js-skills" type="text" value={data.skills} onChange={set('skills')} className={inputClass} placeholder="e.g., JavaScript, React, Stakeholder Management" />
            </div>
            <fieldset>
              <legend className={labelClass}>Work Preferences (select all that apply)</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {PREFERENCES.map((pref) => (
                  <label key={pref} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={data.preferences.includes(pref)}
                      onChange={(e) =>
                        setData((d) => ({ ...d, preferences: e.target.checked ? [...d.preferences, pref] : d.preferences.filter((p) => p !== pref) }))
                      }
                    />
                    <span className="text-sm">{pref}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {errorBox}
            {navButtons(0, () => next(1), 'Next: Job Type & Salary')}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {heading('Job Type & Salary', 'Set the contract type and the salary you are targeting.')}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="js-type" className={labelClass}>
                  Job Type *
                </label>
                <select id="js-type" value={data.jobType} onChange={set('jobType')} className={inputClass}>
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label htmlFor="js-size" className={labelClass}>
                  Company Size Preference
                </label>
                <select id="js-size" value={data.companySize} onChange={set('companySize')} className={inputClass}>
                  <option value="">Any size</option>
                  <option value="startup">Startup (1-50 employees)</option>
                  <option value="small">Small (51-200 employees)</option>
                  <option value="medium">Medium (201-1,000 employees)</option>
                  <option value="large">Large (1,000+ employees)</option>
                </select>
              </div>
              <div>
                <label htmlFor="js-currency" className={labelClass}>
                  Currency
                </label>
                <select id="js-currency" value={data.currency} onChange={set('currency')} className={inputClass}>
                  {['USD', 'EUR', 'GBP', 'AED', 'SAR', 'INR', 'PKR', 'CAD', 'AUD'].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="js-salary" className={labelClass}>
                  Expected Annual Salary *
                </label>
                <input id="js-salary" type="number" inputMode="numeric" min={0} value={data.salary} onChange={set('salary')} className={inputClass} placeholder="e.g., 90000" />
              </div>
            </div>
            {errorBox}
            {navButtons(1, generateSearchStrategy, isGenerating ? 'Generating Strategy…' : 'Generate Search Strategy', isGenerating)}
          </div>
        );

      case 3:
        return strategy ? renderResults(strategy) : null;

      default:
        return null;
    }
  };

  return (
    <CareerToolLayout slug="job-search-optimizer">
      <div className="mx-auto max-w-4xl">
        <StepIndicator steps={STEPS} current={currentStep} />
        <div className="rounded-lg bg-white p-4 shadow-lg sm:p-6 lg:p-8">{renderStepContent()}</div>
      </div>
    </CareerToolLayout>
  );
};

export default JobSearchOptimizer;
