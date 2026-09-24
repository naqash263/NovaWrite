import React, { useState } from 'react';
import { useToast } from '../../hooks/use-toast';
import CareerToolLayout from '../../components/career/CareerToolLayout';
import StepIndicator from '../../components/career/StepIndicator';
import { asArray, asText, copyText, inputClass, labelClass, postCareerTool, splitList } from '../../components/career/careerUtils';

interface InterviewData {
  jobTitle: string;
  company: string;
  industry: string;
  experience: string;
  interviewType: string;
  technicalSkills: string;
  softSkills: string;
}

interface PracticeQuestion {
  question: string;
  category: string;
  difficulty: string;
  tips: string;
  sampleAnswer: string;
}

interface PrepPlan {
  practiceQuestions: PracticeQuestion[];
  star: { key: string; text: string }[];
  keyPoints: string[];
  culture: string;
  recentNews: string;
  values: string[];
  interviewTips: string[];
  technicalPrep: { topic: string; importance: string; resources: string[] }[];
  questionsToAsk: string[];
  confidenceTips: string[];
  commonMistakes: string[];
}

// Values accepted by CareerToolsController::generateInterviewPrep.
const INTERVIEW_TYPES = [
  { value: 'phone', label: 'Phone Interview', icon: '📞' },
  { value: 'video', label: 'Video Interview', icon: '💻' },
  { value: 'in-person', label: 'In-Person Interview', icon: '🤝' },
  { value: 'panel', label: 'Panel Interview', icon: '👥' },
];

const STAR_DEFAULTS = [
  { key: 'Situation', text: 'Set the scene briefly: where you were working, the team and the challenge.' },
  { key: 'Task', text: 'Explain what you were responsible for and what success looked like.' },
  { key: 'Action', text: 'Describe the specific steps you took. Say "I", not "we", so your contribution is clear.' },
  { key: 'Result', text: 'Share the outcome, ideally with a number, and what you learned.' },
];

const STEPS = ['Job Details', 'Interview Type', 'Skills & Experience', 'Practice Questions', 'STAR Method', 'Company Research'];

function normalizePlan(raw: Record<string, unknown>): PrepPlan {
  const list = (v: unknown) => asArray(v).map(asText).filter(Boolean);
  const research = (raw.companyResearch ?? raw.companyInsights ?? {}) as Record<string, unknown>;
  const starRaw = raw.starMethod && typeof raw.starMethod === 'object' ? Object.entries(raw.starMethod as Record<string, unknown>) : [];
  return {
    practiceQuestions: asArray<Record<string, unknown>>(raw.practiceQuestions)
      .map((q) => (typeof q === 'string' ? { question: q } : q) as Record<string, unknown>)
      .map((q) => ({
        question: asText(q.question),
        category: asText(q.category) || 'General',
        difficulty: asText(q.difficulty),
        tips: asText(q.tips),
        sampleAnswer: asText(q.sampleAnswer ?? q.answer),
      }))
      .filter((q) => q.question),
    star: starRaw.length ? starRaw.map(([key, v]) => ({ key: key.charAt(0).toUpperCase() + key.slice(1), text: asText(v) })) : STAR_DEFAULTS,
    keyPoints: list(research.keyPoints),
    culture: asText(research.culture),
    recentNews: asText(research.recentNews),
    values: list(research.values),
    interviewTips: list(research.interviewTips ?? raw.successTips),
    technicalPrep: asArray<Record<string, unknown>>(raw.technicalPrep).map((t) => ({
      topic: asText(t?.topic ?? t),
      importance: asText(t?.importance),
      resources: asArray(t?.resources).map(asText).filter(Boolean),
    })),
    questionsToAsk: list(raw.questionsToAsk),
    confidenceTips: list(raw.confidenceTips),
    commonMistakes: list(raw.commonMistakes),
  };
}

function planToText(plan: PrepPlan, data: InterviewData): string {
  const lines = [`Interview prep: ${data.jobTitle} at ${data.company}`, '', 'Practice questions:'];
  plan.practiceQuestions.forEach((q, i) => {
    lines.push(`${i + 1}. ${q.question} (${q.category}${q.difficulty ? `, ${q.difficulty}` : ''})`);
    if (q.tips) lines.push(`   Tip: ${q.tips}`);
    if (q.sampleAnswer) lines.push(`   Sample answer: ${q.sampleAnswer}`);
  });
  lines.push('', 'STAR method:', ...plan.star.map((s) => `- ${s.key}: ${s.text}`));
  if (plan.keyPoints.length) lines.push('', 'Company research:', ...plan.keyPoints.map((p) => `- ${p}`));
  if (plan.questionsToAsk.length) lines.push('', 'Questions to ask:', ...plan.questionsToAsk.map((p) => `- ${p}`));
  if (plan.confidenceTips.length) lines.push('', 'Confidence tips:', ...plan.confidenceTips.map((p) => `- ${p}`));
  return lines.join('\n');
}

const BulletList = ({ items, marker = '✓', markerClass = 'text-green-600' }: { items: string[]; marker?: string; markerClass?: string }) => (
  <ul className="space-y-2">
    {items.map((item) => (
      <li key={item} className="flex items-start gap-2">
        <span className={`mt-0.5 ${markerClass}`} aria-hidden="true">
          {marker}
        </span>
        <span className="text-gray-700">{item}</span>
      </li>
    ))}
  </ul>
);

const InterviewPrep: React.FC = () => {
  const { addToast } = useToast();
  const [data, setData] = useState<InterviewData>({
    jobTitle: '',
    company: '',
    industry: '',
    experience: '',
    interviewType: '',
    technicalSkills: '',
    softSkills: '',
  });
  const [prepPlan, setPrepPlan] = useState<PrepPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);

  const set = (field: keyof InterviewData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setData((d) => ({ ...d, [field]: e.target.value }));

  const goTo = (step: number) => {
    setError('');
    setCurrentStep(step);
  };

  const continueFromJob = () => {
    if (!data.jobTitle.trim() || !data.company.trim() || !data.industry) {
      setError('Enter the job title, company name and industry to continue.');
      return;
    }
    goTo(1);
  };

  const generatePrepPlan = async () => {
    const technical = splitList(data.technicalSkills);
    const soft = splitList(data.softSkills);
    if (!data.experience || technical.length === 0 || soft.length === 0) {
      setError('Select your experience level and list at least one technical and one soft skill.');
      return;
    }
    setError('');
    setIsGenerating(true);
    const result = await postCareerTool<Record<string, unknown>>('interview-prep/generate', {
      job_title: data.jobTitle.trim(),
      company_name: data.company.trim(),
      industry: data.industry,
      experience_level: data.experience,
      interview_type: data.interviewType,
      technical_skills: technical,
      soft_skills: soft,
    });
    setIsGenerating(false);
    if (!result.ok) {
      setError(result.message);
      addToast({ type: 'error', title: 'Generation failed', description: result.message });
      return;
    }
    setPrepPlan(normalizePlan(result.data));
    setOpenQuestion(null);
    goTo(3);
    addToast({ type: 'success', title: 'Prep plan ready', description: 'Open each question to see tips and a sample answer.' });
  };

  const navButtons = (back: () => void, next: () => void, nextLabel: string, disabled = false, backLabel = 'Back') => (
    <div className="flex flex-col gap-3 sm:flex-row">
      <button type="button" onClick={back} className="flex-1 rounded-md bg-gray-600 px-6 py-3 font-medium text-white hover:bg-gray-700">
        {backLabel}
      </button>
      <button
        type="button"
        onClick={next}
        disabled={disabled}
        className="flex-1 rounded-md bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {nextLabel}
      </button>
    </div>
  );

  const errorBox = error ? (
    <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      {error}
    </div>
  ) : null;

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-bold text-gray-900">Job Details</h2>
              <p className="text-gray-600">Tell us about the position you're interviewing for.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="ip-jobTitle" className={labelClass}>
                  Job Title *
                </label>
                <input id="ip-jobTitle" type="text" value={data.jobTitle} onChange={set('jobTitle')} maxLength={255} className={inputClass} placeholder="e.g., Senior Software Engineer" />
              </div>
              <div>
                <label htmlFor="ip-company" className={labelClass}>
                  Company Name *
                </label>
                <input id="ip-company" type="text" value={data.company} onChange={set('company')} maxLength={255} className={inputClass} placeholder="e.g., TechCorp Inc." />
              </div>
              <div>
                <label htmlFor="ip-industry" className={labelClass}>
                  Industry *
                </label>
                <select id="ip-industry" value={data.industry} onChange={set('industry')} className={inputClass}>
                  <option value="">Select industry</option>
                  <option value="technology">Technology</option>
                  <option value="finance">Finance</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="education">Education</option>
                  <option value="consulting">Consulting</option>
                  <option value="retail">Retail &amp; e-commerce</option>
                  <option value="government">Government &amp; non-profit</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            {errorBox}
            <button type="button" onClick={continueFromJob} className="w-full rounded-md bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700">
              Continue
            </button>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-bold text-gray-900">Interview Type</h2>
              <p className="text-gray-600">What type of interview are you preparing for?</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2" role="radiogroup" aria-label="Interview type">
              {INTERVIEW_TYPES.map((type) => (
                <button
                  type="button"
                  role="radio"
                  aria-checked={data.interviewType === type.value}
                  key={type.value}
                  onClick={() => setData({ ...data, interviewType: type.value })}
                  className={`rounded-lg border-2 p-4 text-left transition-colors ${
                    data.interviewType === type.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-2xl" aria-hidden="true">
                      {type.icon}
                    </span>
                    <span className="font-medium">{type.label}</span>
                  </span>
                </button>
              ))}
            </div>
            {navButtons(() => goTo(0), () => goTo(2), 'Continue', !data.interviewType)}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-bold text-gray-900">Skills &amp; Experience</h2>
              <p className="text-gray-600">Highlight the skills the interviewer is likely to probe.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="ip-experience" className={labelClass}>
                  Experience Level *
                </label>
                <select id="ip-experience" value={data.experience} onChange={set('experience')} className={inputClass}>
                  <option value="">Select experience level</option>
                  <option value="entry">Entry Level (0-2 years)</option>
                  <option value="mid">Mid Level (3-5 years)</option>
                  <option value="senior">Senior Level (6-10 years)</option>
                  <option value="executive">Lead / Executive (10+ years)</option>
                </select>
              </div>
              <div>
                <label htmlFor="ip-technical" className={labelClass}>
                  Technical Skills (comma-separated) *
                </label>
                <input id="ip-technical" type="text" value={data.technicalSkills} onChange={set('technicalSkills')} className={inputClass} placeholder="e.g., JavaScript, React, SQL, AWS" />
              </div>
              <div>
                <label htmlFor="ip-soft" className={labelClass}>
                  Soft Skills (comma-separated) *
                </label>
                <input id="ip-soft" type="text" value={data.softSkills} onChange={set('softSkills')} className={inputClass} placeholder="e.g., Communication, Stakeholder Management, Mentoring" />
              </div>
            </div>
            {errorBox}
            {navButtons(() => goTo(1), generatePrepPlan, isGenerating ? 'Generating Plan…' : 'Generate Prep Plan', isGenerating)}
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-bold text-gray-900">Practice Questions</h2>
              <p className="text-gray-600">
                Personalised questions for {data.jobTitle} at {data.company}. Answer out loud before opening the sample.
              </p>
            </div>
            {prepPlan && prepPlan.practiceQuestions.length > 0 ? (
              <ol className="space-y-4">
                {prepPlan.practiceQuestions.map((q, index) => (
                  <li key={index} className="rounded-lg border bg-white p-4 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="mb-2 font-semibold text-gray-900">{q.question}</h3>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">{q.category}</span>
                          {q.difficulty && <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">{q.difficulty}</span>}
                        </div>
                      </div>
                      {(q.tips || q.sampleAnswer) && (
                        <button
                          type="button"
                          aria-expanded={openQuestion === index}
                          aria-controls={`ip-answer-${index}`}
                          onClick={() => setOpenQuestion(openQuestion === index ? null : index)}
                          className="self-start whitespace-nowrap font-medium text-blue-700 hover:text-blue-900"
                        >
                          {openQuestion === index ? 'Hide Answer' : 'View Answer'}
                        </button>
                      )}
                    </div>
                    {openQuestion === index && (
                      <div id={`ip-answer-${index}`} className="mt-4 space-y-3 border-t pt-4">
                        {q.tips && (
                          <p className="text-sm text-gray-700">
                            <strong>Tip:</strong> {q.tips}
                          </p>
                        )}
                        {q.sampleAnswer && (
                          <div className="rounded-lg bg-gray-50 p-4">
                            <p className="mb-1 text-sm font-semibold text-gray-900">Sample answer</p>
                            <p className="italic text-gray-700">{q.sampleAnswer}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="italic text-gray-500">No practice questions were returned. Try generating the plan again.</p>
            )}
            {navButtons(() => goTo(2), () => goTo(4), 'Learn STAR Method', false, 'Edit Details')}
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-bold text-gray-900">STAR Method</h2>
              <p className="text-gray-600">Structure behavioural answers so they are specific and easy to follow.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {(prepPlan?.star ?? STAR_DEFAULTS).map((s) => (
                <div key={s.key} className="rounded-lg border bg-white p-4 sm:p-6">
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">{s.key}</h3>
                  <p className="text-gray-600">{s.text}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-blue-50 p-4 sm:p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Example STAR answer</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="font-semibold text-blue-800">Situation</dt>
                  <dd className="text-gray-700">In my previous role our team was dealing with a critical bug that was affecting the production system.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-blue-800">Task</dt>
                  <dd className="text-gray-700">I was responsible for leading the debugging effort and restoring the service within 24 hours.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-blue-800">Action</dt>
                  <dd className="text-gray-700">I organised the team, analysed the logs, identified the root cause and shipped a tested fix.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-blue-800">Result</dt>
                  <dd className="text-gray-700">We restored the service in 18 hours and added monitoring so the issue could not recur unnoticed.</dd>
                </div>
              </dl>
            </div>
            {navButtons(() => goTo(3), () => goTo(5), 'Company Research', false, 'Back to Questions')}
          </div>
        );

      case 5:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-bold text-gray-900">Company Research</h2>
              <p className="text-gray-600">AI-generated starting points for {data.company}. Verify facts on the company's own website and recent news.</p>
            </div>
            {prepPlan && (
              <div className="space-y-6">
                {(prepPlan.keyPoints.length > 0 || prepPlan.culture || prepPlan.recentNews || prepPlan.values.length > 0) && (
                  <div className="rounded-lg border bg-white p-4 sm:p-6">
                    <h3 className="mb-3 text-lg font-semibold text-gray-900">About the company</h3>
                    {prepPlan.keyPoints.length > 0 && <BulletList items={prepPlan.keyPoints} marker="•" markerClass="text-blue-600" />}
                    {prepPlan.culture && (
                      <p className="mt-3 text-gray-700">
                        <strong>Culture:</strong> {prepPlan.culture}
                      </p>
                    )}
                    {prepPlan.values.length > 0 && (
                      <p className="mt-3 text-gray-700">
                        <strong>Values:</strong> {prepPlan.values.join(', ')}
                      </p>
                    )}
                    {prepPlan.recentNews && (
                      <p className="mt-3 text-gray-700">
                        <strong>Recent news:</strong> {prepPlan.recentNews}
                      </p>
                    )}
                  </div>
                )}
                {prepPlan.technicalPrep.length > 0 && (
                  <div className="rounded-lg border bg-white p-4 sm:p-6">
                    <h3 className="mb-3 text-lg font-semibold text-gray-900">Technical topics to revise</h3>
                    <ul className="space-y-3">
                      {prepPlan.technicalPrep.map((t) => (
                        <li key={t.topic}>
                          <span className="font-medium text-gray-900">{t.topic}</span>
                          {t.importance && <span className="ml-2 text-sm text-gray-500">({t.importance} importance)</span>}
                          {t.resources.length > 0 && <p className="text-sm text-gray-600">Resources: {t.resources.join(', ')}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="grid gap-6 md:grid-cols-2">
                  {prepPlan.questionsToAsk.length > 0 && (
                    <div className="rounded-lg bg-blue-50 p-4 sm:p-6">
                      <h3 className="mb-3 text-lg font-semibold text-gray-900">Questions to ask the interviewer</h3>
                      <BulletList items={prepPlan.questionsToAsk} marker="?" markerClass="text-blue-700" />
                    </div>
                  )}
                  {(prepPlan.confidenceTips.length > 0 || prepPlan.interviewTips.length > 0) && (
                    <div className="rounded-lg bg-green-50 p-4 sm:p-6">
                      <h3 className="mb-3 text-lg font-semibold text-gray-900">Interview tips</h3>
                      <BulletList items={[...prepPlan.interviewTips, ...prepPlan.confidenceTips]} />
                    </div>
                  )}
                  {prepPlan.commonMistakes.length > 0 && (
                    <div className="rounded-lg bg-red-50 p-4 sm:p-6">
                      <h3 className="mb-3 text-lg font-semibold text-gray-900">Common mistakes to avoid</h3>
                      <BulletList items={prepPlan.commonMistakes} marker="✗" markerClass="text-red-600" />
                    </div>
                  )}
                </div>
              </div>
            )}
            {navButtons(
              () => goTo(4),
              async () => {
                if (!prepPlan) return;
                const ok = await copyText(planToText(prepPlan, data));
                addToast(
                  ok
                    ? { type: 'success', title: 'Copied to clipboard', description: 'Your prep plan has been copied as text.' }
                    : { type: 'error', title: 'Copy failed', description: 'Your browser blocked clipboard access.' },
                );
              },
              'Copy Prep Plan',
              false,
              'Back to STAR Method',
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <CareerToolLayout slug="interview-prep">
      <div className="mx-auto max-w-4xl">
        <StepIndicator steps={STEPS} current={currentStep} />
        <div className="rounded-lg bg-white p-4 shadow-lg sm:p-6 lg:p-8">{renderStepContent()}</div>
      </div>
    </CareerToolLayout>
  );
};

export default InterviewPrep;
