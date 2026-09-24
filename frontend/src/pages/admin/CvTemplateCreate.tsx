import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, Lightbulb } from 'lucide-react';
import apiClient from '../../api/axios';
import { useSEO } from '../../utils/seo';
import { useToast } from '../../hooks/use-toast';
import { AdminCard, AdminPageHeader, Field, inputClass } from '../../components/admin/ui';
import { apiErrorMessage } from '../../components/admin/utils';

interface CvTemplateFormData {
  name: string;
  description: string;
  category: string;
  ats_score: number;
  html_content: string;
  json_config: Record<string, unknown>;
  customizable_options: string[];
  thumbnail: File | null;
  field_mappings: Record<string, string>;
}

type FormErrors = Partial<Record<keyof CvTemplateFormData, string>>;

const STEPS = [
  { title: 'Basic information', description: 'Name, category and ATS score' },
  { title: 'HTML & CSS', description: 'Template markup with placeholders' },
  { title: 'Preview', description: 'Check the rendered layout' },
  { title: 'Review & save', description: 'Confirm and create' },
];

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General – suitable for most professions' },
  { value: 'executive', label: 'Executive – senior leadership roles' },
  { value: 'tech', label: 'Tech – technology professionals' },
  { value: 'creative', label: 'Creative – designers, artists, writers' },
  { value: 'minimal', label: 'Minimal – clean, simple design' },
  { value: 'professional', label: 'Professional – traditional business style' },
];

const SINGLE_PLACEHOLDERS = ['fullName', 'jobTitle', 'email', 'phoneNumber', 'address', 'professionalSummary', 'skills'];
const ARRAY_PLACEHOLDERS: [string, string][] = [
  ['workExperience', 'Work experience cards with job titles, companies, dates and descriptions'],
  ['projects', 'Project cards with tech tags, descriptions, links and dates'],
  ['education', 'Education entries with degrees, institutions and graduation years'],
  ['certificates', 'Certificate items with verification links and credential IDs'],
  ['languages', 'Language proficiency levels'],
  ['achievements', 'Achievements with titles, descriptions and dates'],
];
const STYLE_PLACEHOLDERS = ['primaryColor', 'secondaryColor', 'fontFamily', 'fontSize'];

const DEFAULT_HTML = `<div class="cv-template">
  <style>
    .cv-template { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; }
    .header { background: {{primaryColor}}; color: white; padding: 20px; }
    .name { font-size: 24px; font-weight: bold; }
    .job-title { font-size: 16px; margin-top: 5px; }
  </style>

  <div class="header">
    <div class="name">{{fullName}}</div>
    <div class="job-title">{{jobTitle}}</div>
    <div class="contact">
      <span>{{email}}</span> | <span>{{phoneNumber}}</span> | <span>{{address}}</span>
    </div>
  </div>

  <div class="content">
    <section>
      <h2>Professional Summary</h2>
      <p>{{professionalSummary}}</p>
    </section>

    <section>
      <h2>Work Experience</h2>
      {{workExperience}}
    </section>

    <section>
      <h2>Education</h2>
      {{education}}
    </section>

    <section>
      <h2>Skills</h2>
      {{skills}}
    </section>
  </div>
</div>`;

const FIELD_MAPPINGS: Record<string, string> = Object.fromEntries(
  [
    'fullName',
    'jobTitle',
    'email',
    'phoneNumber',
    'address',
    'professionalSummary',
    'workExperience',
    'education',
    'skills',
    'projects',
    'certificates',
    'languages',
    'interests',
    'references',
    ...STYLE_PLACEHOLDERS,
  ].map((key) => [`{{${key}}}`, key]),
);

const initialForm: CvTemplateFormData = {
  name: '',
  description: '',
  category: 'general',
  ats_score: 8,
  html_content: DEFAULT_HTML,
  json_config: {
    layout: 'single-column',
    sections: ['header', 'summary', 'experience', 'education', 'skills'],
    features: ['responsive', 'ats-friendly', 'print-ready'],
  },
  customizable_options: STYLE_PLACEHOLDERS,
  thumbnail: null,
  field_mappings: FIELD_MAPPINGS,
};

/** Sample values so the preview looks like a real CV instead of raw placeholders. */
const SAMPLE_DATA: Record<string, string> = {
  fullName: 'Jane Doe',
  jobTitle: 'Senior Software Engineer',
  email: 'jane.doe@example.com',
  phoneNumber: '+1 (555) 123-4567',
  address: 'San Francisco, CA',
  professionalSummary: 'Engineer with 7+ years of experience building reliable web platforms.',
  workExperience: '<div class="experience-card"><div class="item-title">Lead Engineer · Tech Corp</div><div class="item-date">2020 – Present</div></div>',
  education: '<div class="education-item"><div class="item-title">BSc Computer Science</div><div class="item-subtitle">University of Technology</div></div>',
  skills: 'JavaScript, React, Node.js, SQL',
  projects: '',
  certificates: '',
  languages: '',
  achievements: '',
  interests: '',
  references: '',
  primaryColor: '#1d4ed8',
  secondaryColor: '#0f766e',
  fontFamily: 'Arial, sans-serif',
  fontSize: '14px',
};

const fillSample = (html: string) => html.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => SAMPLE_DATA[key] ?? match);

const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
const secondaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-60';

function Callout({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
      <Lightbulb className="mt-0.5 h-4 w-4 flex-none text-blue-600" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <ol className="grid gap-2 sm:grid-cols-4" aria-label="Progress">
      {STEPS.map((step, index) => {
        const number = index + 1;
        const done = number < currentStep;
        const current = number === currentStep;
        return (
          <li
            key={step.title}
            aria-current={current ? 'step' : undefined}
            className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${current ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white'}`}
          >
            <span
              className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-semibold ${
                done ? 'bg-emerald-600 text-white' : current ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {done ? <Check className="h-4 w-4" aria-label="Completed" /> : number}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-slate-900">{step.title}</span>
              <span className="block truncate text-xs text-slate-500">{step.description}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

const STEP_OF_FIELD: Partial<Record<keyof CvTemplateFormData, number>> = { name: 1, description: 1, category: 1, ats_score: 1, thumbnail: 1, html_content: 2 };

export default function CvTemplateCreate() {
  useSEO({ title: 'Create CV Template | Admin', robots: 'noindex, nofollow' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CvTemplateFormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});

  const update = <K extends keyof CvTemplateFormData>(key: K, value: CvTemplateFormData[K]) => setFormData((prev) => ({ ...prev, [key]: value }));

  const validateStep = (step: number): FormErrors => {
    const next: FormErrors = {};
    if (step >= 1) {
      if (!formData.name.trim()) next.name = 'Template name is required.';
      if (!Number.isInteger(formData.ats_score) || formData.ats_score < 1 || formData.ats_score > 10) next.ats_score = 'ATS score must be a whole number from 1 to 10.';
      if (formData.thumbnail && formData.thumbnail.size > 2 * 1024 * 1024) next.thumbnail = 'Thumbnail must be 2MB or smaller.';
    }
    if (step >= 2 && !formData.html_content.trim()) next.html_content = 'HTML content is required.';
    return next;
  };

  const goToFirstErrorStep = (errs: FormErrors) => {
    const steps = (Object.keys(errs) as (keyof CvTemplateFormData)[]).map((key) => STEP_OF_FIELD[key] ?? currentStep);
    if (steps.length) setCurrentStep(Math.min(...steps));
  };

  const handleNextStep = () => {
    const next = validateStep(currentStep);
    setErrors(next);
    if (Object.keys(next).length) {
      goToFirstErrorStep(next);
      return;
    }
    setCurrentStep((s) => Math.min(s + 1, STEPS.length));
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const body = new FormData();
      body.append('name', formData.name.trim());
      body.append('description', formData.description);
      body.append('category', formData.category);
      body.append('ats_score', String(formData.ats_score));
      body.append('html_content', formData.html_content);
      body.append('json_config', JSON.stringify(formData.json_config));
      body.append('customizable_options', JSON.stringify(formData.customizable_options));
      body.append('field_mappings', JSON.stringify(formData.field_mappings));
      if (formData.thumbnail) body.append('thumbnail', formData.thumbnail);
      const { data } = await apiClient.post('/admin/cv-templates-temp', body, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (!data?.success) throw Object.assign(new Error(data?.message || 'Failed to save template'), { response: { data } });
      return data;
    },
    onSuccess: () => {
      addToast({ type: 'success', title: 'Template created', description: `"${formData.name.trim()}" is now available.` });
      queryClient.invalidateQueries({ queryKey: ['admin-cv-templates'] });
      navigate('/admin/cv-templates');
    },
    onError: (err) => {
      const raw = (err as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data?.errors ?? {};
      const fieldErrors: FormErrors = {};
      for (const [key, messages] of Object.entries(raw)) fieldErrors[key as keyof CvTemplateFormData] = Array.isArray(messages) ? messages[0] : String(messages);
      setErrors(fieldErrors);
      goToFirstErrorStep(fieldErrors);
      addToast({ type: 'error', title: 'Could not create template', description: apiErrorMessage(err) });
    },
  });

  const handleSave = () => {
    const next = validateStep(STEPS.length);
    setErrors(next);
    if (Object.keys(next).length) {
      goToFirstErrorStep(next);
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Create CV Template"
        description="Design a custom CV template for the CV builder in four steps."
        actions={
          <Link to="/admin/cv-templates" className={secondaryBtn}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to templates
          </Link>
        }
      />

      <StepIndicator currentStep={currentStep} />

      <AdminCard title={`Step ${currentStep} of ${STEPS.length}: ${STEPS[currentStep - 1].title}`}>
        <div className="space-y-5">
          {currentStep === 1 && (
            <>
              <Callout>This information helps users understand what the template is designed for.</Callout>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Template name" required hint="A descriptive name such as “Modern Professional”." error={errors.name}>
                  {(props) => (
                    <input
                      {...props}
                      type="text"
                      maxLength={255}
                      className={inputClass}
                      placeholder="e.g., Modern Professional"
                      value={formData.name}
                      onChange={(e) => update('name', e.target.value)}
                    />
                  )}
                </Field>
                <Field label="Category" required error={errors.category}>
                  {(props) => (
                    <select {...props} className={inputClass} value={formData.category} onChange={(e) => update('category', e.target.value)}>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
              </div>
              <Field label="Description" hint="When should users pick this template?" error={errors.description}>
                {(props) => (
                  <textarea
                    {...props}
                    rows={4}
                    className={inputClass}
                    placeholder="Describe the template's features, target audience and unique characteristics..."
                    value={formData.description}
                    onChange={(e) => update('description', e.target.value)}
                  />
                )}
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="ATS score (1–10)" required hint="10 = perfect for applicant tracking systems." error={errors.ats_score}>
                  {(props) => (
                    <input
                      {...props}
                      type="number"
                      min={1}
                      max={10}
                      className={inputClass}
                      value={Number.isNaN(formData.ats_score) ? '' : formData.ats_score}
                      onChange={(e) => update('ats_score', parseInt(e.target.value, 10))}
                    />
                  )}
                </Field>
                <Field label="Thumbnail image" hint="Optional. JPG, PNG or GIF up to 2MB." error={errors.thumbnail}>
                  {(props) => (
                    <input
                      {...props}
                      type="file"
                      accept="image/jpeg,image/png,image/gif"
                      className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
                      onChange={(e) => update('thumbnail', e.target.files?.[0] || null)}
                    />
                  )}
                </Field>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <Callout>
                Use semantic HTML, put CSS inside a <code>&lt;style&gt;</code> tag and use placeholders like <code>{'{{fullName}}'}</code> for dynamic content. Array fields generate
                formatted HTML automatically and empty sections are hidden.
              </Callout>
              <Field label="HTML/CSS template code" required error={errors.html_content}>
                {(props) => (
                  <textarea
                    {...props}
                    rows={20}
                    spellCheck={false}
                    className={`${inputClass} font-mono text-xs`}
                    value={formData.html_content}
                    onChange={(e) => update('html_content', e.target.value)}
                  />
                )}
              </Field>
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Single values</p>
                  <div className="flex flex-wrap gap-1">
                    {SINGLE_PLACEHOLDERS.map((key) => (
                      <code key={key} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{`{{${key}}}`}</code>
                    ))}
                  </div>
                  <p className="mb-2 mt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Styling variables</p>
                  <div className="flex flex-wrap gap-1">
                    {STYLE_PLACEHOLDERS.map((key) => (
                      <code key={key} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{`{{${key}}}`}</code>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 lg:col-span-2">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Array fields (auto-formatted HTML)</p>
                  <dl className="grid gap-2 sm:grid-cols-2">
                    {ARRAY_PLACEHOLDERS.map(([key, description]) => (
                      <div key={key}>
                        <dt>
                          <code className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-800">{`{{${key}}}`}</code>
                        </dt>
                        <dd className="mt-0.5 text-xs text-slate-600">{description}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-3 text-xs text-slate-500">
                    Style generated items with classes such as <code>.experience-card</code>, <code>.project-card</code>, <code>.item-title</code> and <code>.item-date</code>. Placeholders are
                    case-sensitive.
                  </p>
                </div>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <Callout>The preview fills placeholders with sample data. It is rendered in an isolated frame so template styles do not affect the admin.</Callout>
              {formData.html_content.trim() ? (
                <iframe
                  title="CV template preview"
                  sandbox=""
                  srcDoc={fillSample(formData.html_content)}
                  className="h-[28rem] w-full rounded-lg border border-slate-200 bg-white"
                />
              ) : (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  No template code yet. Go back to step 2 and add your HTML/CSS.
                </p>
              )}
            </>
          )}

          {currentStep === 4 && (
            <div className="grid gap-4 md:grid-cols-2">
              <dl className="space-y-2 rounded-lg border border-slate-200 p-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Name</dt>
                  <dd className="text-right font-medium text-slate-900">{formData.name || '—'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Category</dt>
                  <dd className="text-right font-medium capitalize text-slate-900">{formData.category}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">ATS score</dt>
                  <dd className="text-right font-medium text-slate-900">{formData.ats_score}/10</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Thumbnail</dt>
                  <dd className="truncate text-right font-medium text-slate-900">{formData.thumbnail?.name ?? 'None'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Description</dt>
                  <dd className="mt-1 text-slate-900">{formData.description || 'No description provided'}</dd>
                </div>
              </dl>
              <div className="rounded-lg border border-slate-200 p-4 text-sm">
                <p className="text-slate-500">Template code</p>
                <pre className="mt-2 max-h-40 overflow-auto rounded bg-slate-50 p-2 font-mono text-xs text-slate-700">{formData.html_content.substring(0, 400)}</pre>
                <p className="mt-2 text-xs text-slate-500">{formData.html_content.length.toLocaleString()} characters</p>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-between">
            <div>
              {currentStep > 1 && (
                <button type="button" className={secondaryBtn} onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}>
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Previous
                </button>
              )}
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Link to="/admin/cv-templates" className={secondaryBtn}>
                Cancel
              </Link>
              {currentStep < STEPS.length ? (
                <button type="button" className={primaryBtn} onClick={handleNextStep}>
                  Next <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : (
                <button type="button" className={primaryBtn} onClick={handleSave} disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving…' : 'Save template'}
                </button>
              )}
            </div>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
