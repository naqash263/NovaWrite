import React, { useState } from 'react';
import { useToast } from '../../hooks/use-toast';
import CareerToolLayout from '../../components/career/CareerToolLayout';
import StepIndicator from '../../components/career/StepIndicator';
import { asArray, asText, copyText, inputClass, labelClass, postCareerTool, toNumber } from '../../components/career/careerUtils';

const SKILL_CATEGORIES: { name: string; skills: string[] }[] = [
  {
    name: 'Technical Skills',
    skills: ['JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'Docker', 'Kubernetes', 'Machine Learning', 'Data Analysis', 'SQL', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Swift', 'Kotlin', 'Rust', 'TypeScript']
  },
  {
    name: 'Soft Skills',
    skills: ['Leadership', 'Communication', 'Problem Solving', 'Teamwork', 'Time Management', 'Adaptability', 'Critical Thinking', 'Emotional Intelligence', 'Active Listening', 'Conflict Resolution', 'Empathy', 'Patience', 'Creativity', 'Innovation', 'Resilience']
  },
  {
    name: 'Business Skills',
    skills: ['Project Management', 'Strategic Planning', 'Financial Analysis', 'Marketing', 'Sales', 'Customer Service', 'Negotiation', 'Business Development', 'Budget Management', 'Risk Assessment', 'Process Improvement', 'Change Management', 'Stakeholder Management', 'Vendor Management', 'Contract Management']
  },
  {
    name: 'Design Skills',
    skills: ['UI/UX Design', 'Graphic Design', 'Web Design', 'Prototyping', 'User Research', 'Figma', 'Adobe Creative Suite', 'Wireframing', 'Brand Design', 'Print Design', 'Motion Graphics', 'Video Editing', 'Photography', 'Illustration', 'Color Theory']
  },
  {
    name: 'Healthcare Skills',
    skills: ['Patient Care', 'Medical Terminology', 'Clinical Assessment', 'Treatment Planning', 'Medical Records', 'HIPAA Compliance', 'Emergency Response', 'Medication Management', 'Diagnostic Testing', 'Patient Education', 'Care Coordination', 'Quality Assurance', 'Infection Control', 'Vital Signs', 'Medical Equipment']
  },
  {
    name: 'Education Skills',
    skills: ['Curriculum Development', 'Lesson Planning', 'Classroom Management', 'Student Assessment', 'Educational Technology', 'Differentiated Instruction', 'Special Education', 'Parent Communication', 'Professional Development', 'Educational Research', 'Learning Analytics', 'Student Engagement', 'Behavioral Management', 'Educational Psychology', 'Teaching Methods']
  },
  {
    name: 'Finance Skills',
    skills: ['Financial Modeling', 'Risk Management', 'Investment Analysis', 'Portfolio Management', 'Financial Reporting', 'Auditing', 'Tax Planning', 'Compliance', 'Budgeting', 'Forecasting', 'Mergers & Acquisitions', 'Derivatives', 'Credit Analysis', 'Insurance', 'Regulatory Reporting']
  },
  {
    name: 'Marketing Skills',
    skills: ['Digital Marketing', 'Content Marketing', 'Social Media Marketing', 'SEO/SEM', 'Email Marketing', 'Brand Management', 'Market Research', 'Analytics', 'Campaign Management', 'Public Relations', 'Event Planning', 'Influencer Marketing', 'Marketing Automation', 'Customer Segmentation', 'Conversion Optimization']
  },
  {
    name: 'Sales Skills',
    skills: ['Lead Generation', 'Prospecting', 'Cold Calling', 'Sales Presentations', 'Negotiation', 'Relationship Building', 'CRM Management', 'Sales Forecasting', 'Pipeline Management', 'Account Management', 'Territory Management', 'Sales Training', 'Customer Retention', 'Upselling', 'Cross-selling']
  },
  {
    name: 'Operations Skills',
    skills: ['Process Optimization', 'Supply Chain Management', 'Quality Control', 'Inventory Management', 'Logistics', 'Vendor Management', 'Cost Reduction', 'Efficiency Improvement', 'Lean Manufacturing', 'Six Sigma', 'Project Management', 'Resource Planning', 'Performance Metrics', 'Continuous Improvement', 'Risk Management']
  },
  {
    name: 'Human Resources Skills',
    skills: ['Recruitment', 'Talent Acquisition', 'Employee Relations', 'Performance Management', 'Training & Development', 'Compensation & Benefits', 'HR Analytics', 'Workplace Diversity', 'Employee Engagement', 'Labor Relations', 'HR Compliance', 'Succession Planning', 'Organizational Development', 'Change Management', 'HR Technology']
  },
  {
    name: 'Legal Skills',
    skills: ['Legal Research', 'Contract Law', 'Litigation', 'Regulatory Compliance', 'Intellectual Property', 'Corporate Law', 'Employment Law', 'Real Estate Law', 'Criminal Law', 'Family Law', 'Tax Law', 'Immigration Law', 'Environmental Law', 'Healthcare Law', 'International Law']
  }
];

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;
const IMPORTANCE = ['Low', 'Medium', 'High'] as const;
const STEPS = ['Profile', 'Select Skills', 'Rate Skills', 'Results', 'Recommendations', 'Learning Path'];

interface Skill {
  name: string;
  level: (typeof LEVELS)[number];
  category: string;
  importance: (typeof IMPORTANCE)[number];
}

interface AssessmentData {
  skills: Skill[];
  experienceYears: string;
  industry: string;
  currentRole: string;
  goals: string;
}

interface Results {
  overallScore: number | null;
  categoryScores: { name: string; score: number }[];
  strengths: { skill: string; level: string; score: number | null; note: string }[];
  gaps: { skill: string; level: string; score: number | null; note: string }[];
  recommendations: { category: string; skills: { name: string; priority: string; levels: string; action: string; timeline: string; resources: string[] }[] }[];
  learningPath: { title: string; timeline: string; focus: string; skills: string[]; activities: string[]; resources: string[] }[];
  roles: { title: string; match: number | null; salaryRange: string; requiredSkills: string[]; missingSkills: string[]; nextSteps: string[] }[];
  overallMatch: number | null;
  trendingSkills: string[];
  emergingRoles: string[];
}

function normalizeResults(raw: Record<string, unknown>): Results {
  const obj = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
  const list = (v: unknown) => asArray(v).map(asText).filter(Boolean);
  const skillEntry = (v: unknown, noteKey: string) => {
    const o = typeof v === 'string' ? { skill: v } : obj(v);
    return {
      skill: asText(o.skill ?? o.name) || 'Skill',
      level: asText(o.level ?? o.currentLevel),
      score: toNumber(o.score ?? o.percentage),
      note: asText(o[noteKey]),
    };
  };
  const alignment = obj(raw.careerAlignment);
  const insights = obj(raw.industryInsights);
  return {
    overallScore: toNumber(raw.overallScore),
    categoryScores: Object.entries(obj(raw.categoryScores))
      .map(([name, v]) => ({ name, score: toNumber(v) ?? 0 }))
      .filter((c) => c.name),
    strengths: asArray(raw.strengths).map((s) => skillEntry(s, 'evidence')),
    gaps: asArray(raw.weaknesses).map((s) => skillEntry(s, 'improvement')),
    recommendations: asArray<Record<string, unknown>>(raw.recommendations).map((r) => ({
      category: asText(r?.category) || 'Recommendations',
      skills: asArray<Record<string, unknown>>(r?.skills).map((sk) => ({
        name: asText(sk?.name ?? sk?.skill ?? sk),
        priority: asText(sk?.priority) || 'Medium',
        levels: sk?.currentLevel || sk?.targetLevel ? `${asText(sk.currentLevel) || 'Current'} → ${asText(sk.targetLevel) || 'Target'}` : '',
        action: asText(sk?.action),
        timeline: asText(sk?.timeline),
        resources: list(sk?.resources),
      })),
    })),
    learningPath: asArray<Record<string, unknown>>(raw.learningPath).map((p) => ({
      title: asText(p?.title ?? p?.phase) || 'Learning phase',
      timeline: asText(p?.phase && p?.title ? p.phase : p?.timeline),
      focus: asText(p?.focus),
      skills: list(p?.skills),
      activities: list(p?.activities),
      resources: list(p?.resources),
    })),
    roles: asArray<Record<string, unknown>>(alignment.recommendedRoles).map((r) => ({
      title: asText(r?.title) || 'Role',
      match: toNumber(r?.match),
      salaryRange: asText(r?.salaryRange),
      requiredSkills: list(r?.requiredSkills),
      missingSkills: list(r?.missingSkills),
      nextSteps: list(r?.nextSteps),
    })),
    overallMatch: toNumber(alignment.overallMatch ?? alignment.match),
    trendingSkills: list(insights.trendingSkills),
    emergingRoles: list(insights.emergingRoles),
  };
}

const pct = (n: number | null) => (n === null ? '–' : `${Math.round(n)}%`);
const priorityClass = (p: string) => (/high/i.test(p) ? 'bg-red-100 text-red-800' : /low/i.test(p) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800');
const Chips = ({ items, className }: { items: string[]; className: string }) => (
  <ul className="flex flex-wrap gap-1.5">
    {items.map((i) => (
      <li key={i} className={`rounded px-2 py-1 text-xs ${className}`}>
        {i}
      </li>
    ))}
  </ul>
);

const SkillsAssessment: React.FC = () => {
  const { addToast } = useToast();
  const [data, setData] = useState<AssessmentData>({ skills: [], experienceYears: '', industry: '', currentRole: '', goals: '' });
  const [results, setResults] = useState<Results | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [filter, setFilter] = useState('');
  const [customSkill, setCustomSkill] = useState('');

  const has = (name: string) => data.skills.some((s) => s.name.toLowerCase() === name.toLowerCase());

  const toggleSkill = (name: string, category: string) =>
    setData((d) => ({
      ...d,
      skills: d.skills.some((s) => s.name === name) ? d.skills.filter((s) => s.name !== name) : [...d.skills, { name, category, level: 'Intermediate', importance: 'Medium' }],
    }));

  const addCustomSkill = () => {
    const name = customSkill.trim();
    if (!name) return;
    if (!has(name)) setData((d) => ({ ...d, skills: [...d.skills, { name, category: 'Custom Skills', level: 'Intermediate', importance: 'Medium' }] }));
    setCustomSkill('');
  };

  const updateSkill = (name: string, field: 'level' | 'importance', value: string) =>
    setData((d) => ({ ...d, skills: d.skills.map((s) => (s.name === name ? { ...s, [field]: value } : s)) }));

  const goTo = (step: number) => {
    setError('');
    setCurrentStep(step);
  };

  const validateProfile = () => {
    const years = Number(data.experienceYears);
    if (data.experienceYears === '' || !Number.isInteger(years) || years < 0 || years > 50 || !data.industry || !data.currentRole.trim() || data.goals.trim().length < 5)
      return 'Enter your years of experience (0–50), industry, current role and career goal.';
    return '';
  };

  const generateAssessment = async () => {
    if (data.skills.length === 0) {
      setError('Select at least one skill.');
      return;
    }
    setError('');
    setIsGenerating(true);
    const describe = (s: Skill) => `${s.name} (${s.level}, importance: ${s.importance})`;
    const result = await postCareerTool<Record<string, unknown>>('skills-assessment/generate', {
      technical_skills: data.skills.filter((s) => s.category !== 'Soft Skills').map(describe),
      soft_skills: data.skills.filter((s) => s.category === 'Soft Skills').map(describe),
      experience_years: Number(data.experienceYears),
      current_role: data.currentRole.trim(),
      career_goals: data.goals.trim().slice(0, 1000),
      industry: data.industry,
    });
    setIsGenerating(false);
    if (!result.ok) {
      setError(result.message);
      addToast({ type: 'error', title: 'Assessment failed', description: result.message });
      return;
    }
    setResults(normalizeResults(result.data));
    goTo(3);
    addToast({ type: 'success', title: 'Assessment complete', description: 'Review your scores, then open the recommendations.' });
  };

  const resultsToText = (r: Results) =>
    [
      `Skills assessment: ${data.currentRole} (${data.industry})`,
      `Overall score: ${pct(r.overallScore)}`,
      ...r.categoryScores.map((c) => `- ${c.name}: ${pct(c.score)}`),
      '',
      'Strengths:',
      ...r.strengths.map((s) => `- ${s.skill}${s.level ? ` (${s.level})` : ''}`),
      '',
      'Skill gaps:',
      ...r.gaps.map((s) => `- ${s.skill}${s.note ? `: ${s.note}` : ''}`),
      '',
      'Learning path:',
      ...r.learningPath.map((p) => `- ${p.title}${p.timeline ? ` (${p.timeline})` : ''}: ${[...p.skills].join(', ')}`),
    ].join('\n');

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

  const q = filter.trim().toLowerCase();
  const visibleCategories = SKILL_CATEGORIES.map((c) => ({ ...c, skills: q ? c.skills.filter((s) => s.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)) : c.skills })).filter(
    (c) => c.skills.length > 0,
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            {heading('Your Profile', 'This context lets the assessment compare your skills with your goal.')}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="sa-years" className={labelClass}>
                  Years of Experience *
                </label>
                <input id="sa-years" type="number" inputMode="numeric" min={0} max={50} step={1} value={data.experienceYears} onChange={(e) => setData({ ...data, experienceYears: e.target.value })} className={inputClass} placeholder="e.g., 5" />
              </div>
              <div>
                <label htmlFor="sa-industry" className={labelClass}>
                  Industry *
                </label>
                <select id="sa-industry" value={data.industry} onChange={(e) => setData({ ...data, industry: e.target.value })} className={inputClass}>
                  <option value="">Select industry</option>
                  <option value="technology">Technology &amp; Software</option>
                  <option value="healthcare">Healthcare &amp; Medical</option>
                  <option value="finance">Finance &amp; Banking</option>
                  <option value="education">Education &amp; Training</option>
                  <option value="marketing">Marketing &amp; Advertising</option>
                  <option value="sales">Sales &amp; Business Development</option>
                  <option value="consulting">Consulting &amp; Professional Services</option>
                  <option value="manufacturing">Manufacturing &amp; Production</option>
                  <option value="retail">Retail &amp; E-commerce</option>
                  <option value="hospitality">Hospitality &amp; Tourism</option>
                  <option value="real-estate">Real Estate &amp; Construction</option>
                  <option value="legal">Legal &amp; Compliance</option>
                  <option value="human-resources">Human Resources</option>
                  <option value="operations">Operations &amp; Supply Chain</option>
                  <option value="non-profit">Non-profit &amp; Government</option>
                  <option value="media">Media &amp; Entertainment</option>
                  <option value="transportation">Transportation &amp; Logistics</option>
                  <option value="energy">Energy &amp; Utilities</option>
                  <option value="agriculture">Agriculture &amp; Food</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="sa-role" className={labelClass}>
                  Current Role *
                </label>
                <input id="sa-role" type="text" maxLength={255} value={data.currentRole} onChange={(e) => setData({ ...data, currentRole: e.target.value })} className={inputClass} placeholder="e.g., Registered Nurse" />
              </div>
              <div>
                <label htmlFor="sa-goal" className={labelClass}>
                  Career Goal *
                </label>
                <input id="sa-goal" type="text" maxLength={1000} value={data.goals} onChange={(e) => setData({ ...data, goals: e.target.value })} className={inputClass} placeholder="e.g., Become a nurse manager within 3 years" />
              </div>
            </div>
            {errorBox}
            {navButtons(
              null,
              () => {
                const message = validateProfile();
                if (message) setError(message);
                else goTo(1);
              },
              'Next: Select Skills',
            )}
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            {heading('Select Skills', 'Pick the skills you use, or type your own. Click a selected skill again to remove it.')}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="sa-filter" className={labelClass}>
                  Filter skills
                </label>
                <input id="sa-filter" type="search" value={filter} onChange={(e) => setFilter(e.target.value)} className={inputClass} placeholder="e.g., design, SQL, patient" />
              </div>
              <div>
                <label htmlFor="sa-custom" className={labelClass}>
                  Add a skill that is not listed
                </label>
                <div className="flex gap-2">
                  <input
                    id="sa-custom"
                    type="text"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomSkill();
                      }
                    }}
                    className={inputClass}
                    placeholder="e.g., Power BI"
                  />
                  <button type="button" onClick={addCustomSkill} className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
                    Add
                  </button>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-700" aria-live="polite" data-testid="selected-count">
              {data.skills.length} skill{data.skills.length === 1 ? '' : 's'} selected
            </p>
            <div className="space-y-4">
              {visibleCategories.map((category) => (
                <div key={category.name} className="rounded-lg border bg-white p-4 sm:p-6">
                  <h3 className="mb-3 text-lg font-semibold text-gray-900">{category.name}</h3>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    {category.skills.map((skill) => {
                      const selected = data.skills.some((s) => s.name === skill);
                      return (
                        <button
                          type="button"
                          key={skill}
                          aria-pressed={selected}
                          onClick={() => toggleSkill(skill, category.name)}
                          className={`rounded-md border p-2 text-sm transition-colors ${
                            selected ? 'border-blue-300 bg-blue-100 text-blue-800' : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {selected ? '✓ ' : ''}
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {visibleCategories.length === 0 && <p className="text-gray-600">No listed skill matches “{filter}”. Add it as your own skill above.</p>}
            </div>
            {errorBox}
            {navButtons(0, () => (data.skills.length ? goTo(2) : setError('Select at least one skill.')), 'Next: Rate Skills')}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {heading('Rate Your Skills', 'Be honest: the assessment is only as useful as your ratings.')}
            <ul className="space-y-4">
              {data.skills.map((skill, index) => (
                <li key={skill.name} className="rounded-lg border bg-white p-4 sm:p-6">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{skill.name}</h3>
                      <p className="text-sm text-gray-600">{skill.category}</p>
                    </div>
                    <button type="button" onClick={() => toggleSkill(skill.name, skill.category)} className="text-red-600 hover:text-red-800" aria-label={`Remove ${skill.name}`}>
                      Remove
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor={`sa-level-${index}`} className={labelClass}>
                        Proficiency level
                      </label>
                      <select id={`sa-level-${index}`} value={skill.level} onChange={(e) => updateSkill(skill.name, 'level', e.target.value)} className={inputClass}>
                        {LEVELS.map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor={`sa-importance-${index}`} className={labelClass}>
                        Importance to your goal
                      </label>
                      <select id={`sa-importance-${index}`} value={skill.importance} onChange={(e) => updateSkill(skill.name, 'importance', e.target.value)} className={inputClass}>
                        {IMPORTANCE.map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {errorBox}
            {navButtons(1, generateAssessment, isGenerating ? 'Analyzing Skills…' : 'Complete Assessment', isGenerating || data.skills.length === 0)}
          </div>
        );

      case 3:
        return results ? (
          <div className="space-y-8">
            {heading('Assessment Results', `Your skills compared with the goal: ${data.goals}`)}
            <div className="rounded-lg bg-blue-50 p-6 text-center">
              <p className="mb-1 text-4xl font-bold text-blue-600" data-testid="overall-score">
                {pct(results.overallScore)}
              </p>
              <p className="text-blue-800">Overall skills score</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {results.categoryScores.length > 0 && (
                <div className="rounded-lg border bg-white p-4 sm:p-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Category scores</h3>
                  <ul className="space-y-3">
                    {results.categoryScores.map((c) => (
                      <li key={c.name} className="flex items-center justify-between gap-3">
                        <span className="text-gray-700">{c.name}</span>
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-20 rounded-full bg-gray-200 sm:w-24" aria-hidden="true">
                            <span className="block h-2 rounded-full bg-blue-600" style={{ width: `${Math.min(100, Math.max(0, c.score))}%` }} />
                          </span>
                          <span className="text-sm font-medium text-gray-900">{pct(c.score)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="rounded-lg border bg-white p-4 sm:p-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Top strengths</h3>
                {results.strengths.length ? (
                  <ul className="space-y-3">
                    {results.strengths.slice(0, 4).map((s) => (
                      <li key={s.skill}>
                        <span className="font-medium text-gray-900">{s.skill}</span>
                        {s.level && <span className="ml-2 text-sm text-gray-600">({s.level})</span>}
                        {s.score !== null && <span className="ml-2 font-semibold text-green-600">{pct(s.score)}</span>}
                        {s.note && <p className="text-sm text-gray-600">{s.note}</p>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="italic text-gray-500">No strengths returned.</p>
                )}
              </div>
            </div>

            {results.gaps.length > 0 && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 sm:p-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Skill gaps</h3>
                <ul className="space-y-3">
                  {results.gaps.map((g) => (
                    <li key={g.skill}>
                      <span className="font-medium text-gray-900">{g.skill}</span>
                      {g.level && <span className="ml-2 text-sm text-gray-600">({g.level})</span>}
                      {g.note && <p className="text-sm text-gray-700">{g.note}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(results.roles.length > 0 || results.overallMatch !== null) && (
              <div className="rounded-lg border bg-white p-4 sm:p-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Career alignment</h3>
                {results.overallMatch !== null && (
                  <p className="mb-4 text-gray-700">
                    Overall match with your goal: <strong className="text-blue-700">{pct(results.overallMatch)}</strong>
                  </p>
                )}
                <ul className="space-y-4">
                  {results.roles.map((role) => (
                    <li key={role.title} className="rounded-lg bg-gray-50 p-4">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-medium text-gray-900">{role.title}</h4>
                        {role.match !== null && <span className="font-semibold text-green-700">{pct(role.match)} match</span>}
                      </div>
                      {role.salaryRange && <p className="mb-2 text-sm text-gray-600">Salary (estimate): {role.salaryRange}</p>}
                      {role.missingSkills.length > 0 && (
                        <div className="mb-2">
                          <p className="mb-1 text-sm font-medium text-gray-700">Skills to add</p>
                          <Chips items={role.missingSkills} className="bg-red-100 text-red-800" />
                        </div>
                      )}
                      {role.nextSteps.length > 0 && (
                        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600">
                          {role.nextSteps.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(results.trendingSkills.length > 0 || results.emergingRoles.length > 0) && (
              <div className="rounded-lg bg-purple-50 p-4 sm:p-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Industry insights</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {results.trendingSkills.length > 0 && (
                    <div>
                      <h4 className="mb-2 font-medium text-gray-900">Trending skills</h4>
                      <Chips items={results.trendingSkills} className="bg-purple-100 text-purple-800" />
                    </div>
                  )}
                  {results.emergingRoles.length > 0 && (
                    <div>
                      <h4 className="mb-2 font-medium text-gray-900">Emerging roles</h4>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                        {results.emergingRoles.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {navButtons(2, () => goTo(4), 'View Recommendations', false, 'Edit Ratings')}
          </div>
        ) : null;

      case 4:
        return results ? (
          <div className="space-y-8">
            {heading('Skill Recommendations', 'Prioritised actions for the skills that matter most for your goal.')}
            {results.recommendations.length ? (
              results.recommendations.map((rec) => (
                <div key={rec.category} className="rounded-lg border bg-white p-4 sm:p-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">{rec.category}</h3>
                  <ul className="space-y-4">
                    {rec.skills.map((sk) => (
                      <li key={sk.name} className="rounded-lg bg-gray-50 p-4">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-medium text-gray-900">{sk.name}</h4>
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${priorityClass(sk.priority)}`}>{sk.priority} priority</span>
                        </div>
                        {sk.levels && <p className="mb-1 text-sm text-gray-600">{sk.levels}</p>}
                        {sk.action && (
                          <p className="mb-1 text-sm text-gray-700">
                            <strong>Action:</strong> {sk.action}
                          </p>
                        )}
                        {sk.timeline && (
                          <p className="mb-1 text-sm text-gray-600">
                            <strong>Timeline:</strong> {sk.timeline}
                          </p>
                        )}
                        {sk.resources.length > 0 && <p className="text-sm text-gray-600">Resources: {sk.resources.join(', ')}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p className="italic text-gray-500">No recommendations were returned.</p>
            )}
            {navButtons(3, () => goTo(5), 'Learning Path', false, 'Back to Results')}
          </div>
        ) : null;

      case 5:
        return results ? (
          <div className="space-y-8">
            {heading('Learning Path', 'Work through the phases in order; revisit the assessment when you finish one.')}
            {results.learningPath.length ? (
              <ol className="space-y-6">
                {results.learningPath.map((phase, index) => (
                  <li key={index} className="rounded-lg border bg-white p-4 sm:p-6">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">{index + 1}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{phase.title}</h3>
                        {phase.timeline && <p className="text-sm text-gray-500">{phase.timeline}</p>}
                      </div>
                    </div>
                    {phase.focus && <p className="mb-3 text-gray-600">{phase.focus}</p>}
                    {phase.skills.length > 0 && (
                      <div className="mb-3">
                        <h4 className="mb-2 font-medium text-gray-900">Skills to develop</h4>
                        <Chips items={phase.skills} className="bg-blue-100 text-blue-800" />
                      </div>
                    )}
                    {phase.activities.length > 0 && (
                      <div className="mb-3">
                        <h4 className="mb-2 font-medium text-gray-900">Activities</h4>
                        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600">
                          {phase.activities.map((a) => (
                            <li key={a}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {phase.resources.length > 0 && <p className="text-sm text-gray-600">Resources: {phase.resources.join(', ')}</p>}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="italic text-gray-500">No learning path was returned.</p>
            )}
            {navButtons(
              4,
              async () => {
                const ok = await copyText(resultsToText(results));
                addToast(
                  ok
                    ? { type: 'success', title: 'Copied to clipboard', description: 'Your skills assessment has been copied as text.' }
                    : { type: 'error', title: 'Copy failed', description: 'Your browser blocked clipboard access.' },
                );
              },
              'Copy Assessment',
              false,
              'Back to Recommendations',
            )}
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <CareerToolLayout slug="skills-assessment">
      <div className="mx-auto max-w-4xl">
        <StepIndicator steps={STEPS} current={currentStep} />
        <div className="rounded-lg bg-white p-4 shadow-lg sm:p-6 lg:p-8">{renderStepContent()}</div>
      </div>
    </CareerToolLayout>
  );
};

export default SkillsAssessment;
