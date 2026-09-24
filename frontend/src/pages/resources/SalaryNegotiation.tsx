import React, { useState } from 'react';
import { useToast } from '../../hooks/use-toast';
import CareerToolLayout from '../../components/career/CareerToolLayout';
import StepIndicator from '../../components/career/StepIndicator';
import { asArray, asText, copyText, inputClass, labelClass, postCareerTool, splitList, toNumber } from '../../components/career/careerUtils';

interface SalaryData {
  currency: string;
  currentSalary: string;
  desiredSalary: string;
  jobTitle: string;
  location: string;
  experienceYears: string;
  educationLevel: string;
  skills: string;
  companySize: string;
  industry: string;
}

interface Plan {
  market: { min: number | null; max: number | null; median: number | null; source: string };
  range: { walkAway: number | null; target: number | null; anchor: number | null };
  approach: string;
  timing: string;
  talkingPoints: string[];
  scripts: { situation: string; script: string }[];
  benefits: string[];
  redFlags: string[];
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'INR', 'PKR', 'CAD', 'AUD'];
const STEPS = ['Salary', 'Job Details', 'Company', 'Your Plan'];

const humanize = (key: string) => key.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').trim().replace(/^./, (c) => c.toUpperCase());

function normalizePlan(raw: Record<string, unknown>): Plan {
  const obj = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
  const market = obj(raw.marketSalary);
  const range = obj(raw.negotiationRange);
  const legacy = obj(raw.negotiationStrategy);
  const strategy = obj(raw.strategy);
  const scriptsRaw = raw.scripts;
  const scripts = Array.isArray(scriptsRaw)
    ? scriptsRaw.map((s) => (typeof s === 'string' ? { situation: 'Script', script: s } : { situation: asText(obj(s).situation) || 'Script', script: asText(obj(s).script ?? obj(s).text) }))
    : Object.entries(obj(scriptsRaw)).map(([k, v]) => ({ situation: humanize(k), script: asText(v) }));
  const list = (v: unknown) => asArray(v).map(asText).filter(Boolean);
  return {
    market: { min: toNumber(market.min), max: toNumber(market.max), median: toNumber(market.median), source: asText(market.source) },
    range: {
      walkAway: toNumber(range.minimum ?? legacy.walkAwayPoint),
      target: toNumber(range.target ?? legacy.targetSalary),
      anchor: toNumber(range.maximum ?? legacy.anchorPoint),
    },
    approach: asText(strategy.approach),
    timing: asText(strategy.timing),
    talkingPoints: list(strategy.keyPoints ?? raw.talkingPoints),
    scripts: scripts.filter((s) => s.script),
    benefits: [...list(raw.benefits), ...list(raw.fallbackOptions), ...list(raw.alternatives)],
    redFlags: list(raw.redFlags),
  };
}

const SalaryNegotiation: React.FC = () => {
  const { addToast } = useToast();
  const [salaryData, setSalaryData] = useState<SalaryData>({
    currency: 'USD',
    currentSalary: '',
    desiredSalary: '',
    jobTitle: '',
    location: '',
    experienceYears: '',
    educationLevel: 'bachelor',
    skills: '',
    companySize: '',
    industry: '',
  });
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  const set = (field: keyof SalaryData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setSalaryData((d) => ({ ...d, [field]: e.target.value }));

  const money = (n: number | null) => {
    if (n === null) return '–';
    try {
      return new Intl.NumberFormat('en', { style: 'currency', currency: salaryData.currency, maximumFractionDigits: 0 }).format(n);
    } catch {
      return `${salaryData.currency} ${Math.round(n).toLocaleString('en')}`;
    }
  };

  const current = toNumber(salaryData.currentSalary);
  const desired = toNumber(salaryData.desiredSalary);
  const raise = current !== null && desired !== null && current > 0 ? { amount: desired - current, percent: ((desired - current) / current) * 100 } : null;

  const goTo = (step: number) => {
    setError('');
    setCurrentStep(step);
  };

  const validate = (step: number): string => {
    if (step === 0) {
      if (current === null || current < 0 || desired === null || desired <= 0) return 'Enter your current and desired annual salary as numbers.';
    }
    if (step === 1) {
      const years = Number(salaryData.experienceYears);
      if (!salaryData.jobTitle.trim() || !salaryData.location.trim()) return 'Enter the job title and location.';
      if (salaryData.experienceYears === '' || !Number.isInteger(years) || years < 0 || years > 50) return 'Enter your years of experience as a whole number from 0 to 50.';
      if (splitList(salaryData.skills).length === 0) return 'List at least one key skill.';
    }
    if (step === 2 && !salaryData.companySize) return 'Select the company size.';
    return '';
  };

  const next = (step: number) => {
    const message = validate(step);
    if (message) {
      setError(message);
      return;
    }
    goTo(step + 1);
  };

  const generateNegotiationPlan = async () => {
    const message = validate(2);
    if (message) {
      setError(message);
      return;
    }
    setError('');
    setIsGenerating(true);
    const result = await postCareerTool<Record<string, unknown>>('salary-negotiation/generate', {
      current_salary: current,
      desired_salary: desired,
      currency: salaryData.currency,
      job_title: salaryData.jobTitle.trim(),
      location: salaryData.location.trim(),
      experience_years: Number(salaryData.experienceYears),
      education_level: salaryData.educationLevel,
      skills: splitList(salaryData.skills),
      company_size: salaryData.companySize,
      industry: salaryData.industry || undefined,
    });
    setIsGenerating(false);
    if (!result.ok) {
      setError(result.message);
      addToast({ type: 'error', title: 'Generation failed', description: result.message });
      return;
    }
    setPlan(normalizePlan(result.data));
    goTo(3);
    addToast({ type: 'success', title: 'Negotiation plan ready', description: 'Check the numbers against a salary survey before you negotiate.' });
  };

  const planToText = (p: Plan) =>
    [
      `Salary negotiation plan: ${salaryData.jobTitle} (${salaryData.location})`,
      `Current: ${money(current)} | Desired: ${money(desired)}${raise ? ` (${raise.percent.toFixed(1)}% raise)` : ''}`,
      `Market range: ${money(p.market.min)} - ${money(p.market.max)} (median ${money(p.market.median)})`,
      `Anchor: ${money(p.range.anchor)} | Target: ${money(p.range.target)} | Walk-away: ${money(p.range.walkAway)}`,
      '',
      'Talking points:',
      ...p.talkingPoints.map((t) => `- ${t}`),
      '',
      'Scripts:',
      ...p.scripts.map((s) => `- ${s.situation}: "${s.script}"`),
      '',
      'Benefits to negotiate:',
      ...p.benefits.map((b) => `- ${b}`),
    ].join('\n');

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

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-bold text-gray-900">Salary Information</h2>
              <p className="text-gray-600">Start with your current pay and what you want to ask for.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label htmlFor="sn-currency" className={labelClass}>
                  Currency
                </label>
                <select id="sn-currency" value={salaryData.currency} onChange={set('currency')} className={inputClass}>
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="sn-current" className={labelClass}>
                  Current Salary (annual) *
                </label>
                <input id="sn-current" type="number" inputMode="numeric" min={0} value={salaryData.currentSalary} onChange={set('currentSalary')} className={inputClass} placeholder="e.g., 75000" />
              </div>
              <div>
                <label htmlFor="sn-desired" className={labelClass}>
                  Desired Salary (annual) *
                </label>
                <input id="sn-desired" type="number" inputMode="numeric" min={0} value={salaryData.desiredSalary} onChange={set('desiredSalary')} className={inputClass} placeholder="e.g., 90000" />
              </div>
            </div>
            {raise && (
              <p
                data-testid="raise-summary"
                className={`rounded-md p-3 text-sm ${raise.amount < 0 ? 'bg-orange-50 text-orange-800' : 'bg-blue-50 text-blue-900'}`}
                aria-live="polite"
              >
                {raise.amount >= 0
                  ? `You are asking for a raise of ${money(raise.amount)} (${raise.percent.toFixed(1)}%).`
                  : `Your desired salary is ${money(-raise.amount)} (${Math.abs(raise.percent).toFixed(1)}%) below your current salary. Double-check the figures.`}
              </p>
            )}
            {errorBox}
            {navButtons(null, () => next(0), 'Continue')}
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-bold text-gray-900">Job Details</h2>
              <p className="text-gray-600">Tell us about the position you're negotiating for.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="sn-jobTitle" className={labelClass}>
                  Job Title *
                </label>
                <input id="sn-jobTitle" type="text" value={salaryData.jobTitle} onChange={set('jobTitle')} maxLength={255} className={inputClass} placeholder="e.g., Senior Software Engineer" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="sn-location" className={labelClass}>
                    Location *
                  </label>
                  <input id="sn-location" type="text" value={salaryData.location} onChange={set('location')} maxLength={100} className={inputClass} placeholder="e.g., Dubai, UAE" />
                </div>
                <div>
                  <label htmlFor="sn-years" className={labelClass}>
                    Years of Experience *
                  </label>
                  <input id="sn-years" type="number" inputMode="numeric" min={0} max={50} step={1} value={salaryData.experienceYears} onChange={set('experienceYears')} className={inputClass} placeholder="e.g., 6" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="sn-education" className={labelClass}>
                    Education Level
                  </label>
                  <select id="sn-education" value={salaryData.educationLevel} onChange={set('educationLevel')} className={inputClass}>
                    <option value="high_school">High school</option>
                    <option value="bachelor">Bachelor's degree</option>
                    <option value="master">Master's degree</option>
                    <option value="phd">PhD</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="sn-skills" className={labelClass}>
                    Key Skills (comma-separated) *
                  </label>
                  <input id="sn-skills" type="text" value={salaryData.skills} onChange={set('skills')} className={inputClass} placeholder="e.g., Python, Team Leadership" />
                </div>
              </div>
            </div>
            {errorBox}
            {navButtons(0, () => next(1), 'Continue')}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-bold text-gray-900">Company Information</h2>
              <p className="text-gray-600">Company size and industry change typical pay bands and flexibility.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="sn-size" className={labelClass}>
                  Company Size *
                </label>
                <select id="sn-size" value={salaryData.companySize} onChange={set('companySize')} className={inputClass}>
                  <option value="">Select company size</option>
                  <option value="startup">Startup (1-50 employees)</option>
                  <option value="small">Small (51-200 employees)</option>
                  <option value="medium">Medium (201-1,000 employees)</option>
                  <option value="large">Large (1,001-10,000 employees)</option>
                  <option value="enterprise">Enterprise (10,000+ employees)</option>
                </select>
              </div>
              <div>
                <label htmlFor="sn-industry" className={labelClass}>
                  Industry
                </label>
                <select id="sn-industry" value={salaryData.industry} onChange={set('industry')} className={inputClass}>
                  <option value="">Select industry</option>
                  <option value="technology">Technology</option>
                  <option value="finance">Finance</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="education">Education</option>
                  <option value="consulting">Consulting</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            {errorBox}
            {navButtons(1, generateNegotiationPlan, isGenerating ? 'Generating Plan…' : 'Generate Negotiation Plan', isGenerating)}
          </div>
        );

      case 3:
        return plan ? (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-bold text-gray-900">Your Negotiation Strategy</h2>
              <p className="text-gray-600">AI estimates based on your inputs. Confirm the market range with a salary survey before you negotiate.</p>
            </div>

            <div className="rounded-lg bg-blue-50 p-4 sm:p-6">
              <h3 className="mb-4 text-xl font-semibold text-gray-900">Market research</h3>
              <dl className="grid gap-4 md:grid-cols-2">
                <div>
                  <dt className="mb-1 text-sm text-gray-600">Market range</dt>
                  <dd className="text-lg font-semibold" data-testid="market-range">
                    {money(plan.market.min)} – {money(plan.market.max)}
                  </dd>
                </div>
                <div>
                  <dt className="mb-1 text-sm text-gray-600">Median salary</dt>
                  <dd className="text-lg font-semibold">{money(plan.market.median)}</dd>
                </div>
              </dl>
              {plan.market.source && <p className="mt-3 text-sm text-gray-600">Source note: {plan.market.source}</p>}
            </div>

            <div className="rounded-lg bg-green-50 p-4 sm:p-6">
              <h3 className="mb-4 text-xl font-semibold text-gray-900">Your numbers</h3>
              <dl className="grid gap-4 sm:grid-cols-3">
                <div>
                  <dt className="mb-1 text-sm text-gray-600">Anchor (first ask)</dt>
                  <dd className="text-lg font-semibold text-green-700">{money(plan.range.anchor)}</dd>
                </div>
                <div>
                  <dt className="mb-1 text-sm text-gray-600">Target</dt>
                  <dd className="text-lg font-semibold text-green-700" data-testid="target-salary">
                    {money(plan.range.target)}
                  </dd>
                </div>
                <div>
                  <dt className="mb-1 text-sm text-gray-600">Walk-away point</dt>
                  <dd className="text-lg font-semibold text-red-700">{money(plan.range.walkAway)}</dd>
                </div>
              </dl>
              {(plan.approach || plan.timing) && (
                <p className="mt-4 text-sm text-gray-700">
                  {plan.approach && (
                    <>
                      <strong>Approach:</strong> {plan.approach}.{' '}
                    </>
                  )}
                  {plan.timing && (
                    <>
                      <strong>Timing:</strong> {plan.timing}.
                    </>
                  )}
                </p>
              )}
            </div>

            {plan.talkingPoints.length > 0 && (
              <div>
                <h3 className="mb-3 text-xl font-semibold text-gray-900">Key talking points</h3>
                <ul className="list-disc space-y-2 pl-5 text-gray-700">
                  {plan.talkingPoints.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            {plan.scripts.length > 0 && (
              <div>
                <h3 className="mb-3 text-xl font-semibold text-gray-900">Negotiation scripts</h3>
                <div className="space-y-4">
                  {plan.scripts.map((s, i) => (
                    <div key={i} className="rounded-lg border bg-white p-4">
                      <h4 className="mb-2 font-medium text-gray-900">{s.situation}</h4>
                      <p className="italic text-gray-700">“{s.script}”</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {plan.redFlags.length > 0 && (
              <div className="rounded-lg bg-red-50 p-4 sm:p-6">
                <h3 className="mb-3 text-xl font-semibold text-gray-900">What to avoid</h3>
                <ul className="list-disc space-y-2 pl-5 text-gray-700">
                  {plan.redFlags.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            )}

            {plan.benefits.length > 0 && (
              <div>
                <h3 className="mb-3 text-xl font-semibold text-gray-900">Benefits and alternatives to negotiate</h3>
                <ul className="grid gap-2 md:grid-cols-2">
                  {plan.benefits.map((b) => (
                    <li key={b} className="rounded-lg bg-gray-50 p-3 text-gray-700">
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {navButtons(
              0,
              async () => {
                const ok = await copyText(planToText(plan));
                addToast(
                  ok
                    ? { type: 'success', title: 'Copied to clipboard', description: 'Your negotiation plan has been copied as text.' }
                    : { type: 'error', title: 'Copy failed', description: 'Your browser blocked clipboard access.' },
                );
              },
              'Copy Plan',
            )}
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <CareerToolLayout slug="salary-negotiation">
      <div className="mx-auto max-w-4xl">
        <StepIndicator steps={STEPS} current={currentStep} />
        <div className="rounded-lg bg-white p-4 shadow-lg sm:p-6 lg:p-8">{renderStepContent()}</div>
      </div>
    </CareerToolLayout>
  );
};

export default SalaryNegotiation;
