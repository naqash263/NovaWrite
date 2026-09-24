import React, { useState } from 'react';
import { useToast } from '../../hooks/use-toast';
import CareerToolLayout from '../../components/career/CareerToolLayout';
import StepIndicator from '../../components/career/StepIndicator';
import { asArray, asText, copyText, downloadTextFile, inputClass, labelClass, postCareerTool, splitList, toNumber } from '../../components/career/careerUtils';

interface CoverLetterData {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  yourName: string;
  currentPosition: string;
  yearsExperience: string;
  keySkills: string;
  relevantExperience: string;
  tone: 'professional' | 'friendly' | 'enthusiastic' | 'formal';
  length: 'short' | 'medium' | 'long';
}

interface GeneratedCoverLetter {
  content: string;
  suggestions: string[];
  keywords: string[];
  score: number | null;
  improvements: string[];
}

// Limits enforced by the API (CareerToolsController::generateCoverLetter).
const LIMITS = { jobDescription: 2000, relevantExperience: 1000, keySkills: 500 };

const YEARS: Record<string, number> = { '0-1 years': 1, '2-3 years': 3, '4-5 years': 5, '6-10 years': 8, '10+ years': 12 };

const STEPS = ['Job Information', 'Your Background', 'Your Cover Letter'];

type Errors = Partial<Record<keyof CoverLetterData, string>>;

function normalizeLetter(raw: Record<string, unknown>, name: string): GeneratedCoverLetter {
  let content = asText(raw.content ?? raw.coverLetter ?? raw.letter);
  if (name.trim()) content = content.replace(/\[(Your )?Name\]/gi, name.trim());
  const density = raw.keywordDensity && typeof raw.keywordDensity === 'object' && !Array.isArray(raw.keywordDensity) ? Object.keys(raw.keywordDensity) : [];
  return {
    content,
    suggestions: asArray(raw.suggestions).map(asText).filter(Boolean),
    keywords: (asArray(raw.keywords).length ? asArray(raw.keywords) : density).map(asText).filter(Boolean),
    score: toNumber(raw.score ?? raw.atsScore),
    improvements: asArray(raw.improvements).map(asText).filter(Boolean),
  };
}

const CoverLetterGenerator: React.FC = () => {
  const { addToast } = useToast();
  const [formData, setFormData] = useState<CoverLetterData>({
    jobTitle: '',
    companyName: '',
    jobDescription: '',
    yourName: '',
    currentPosition: '',
    yearsExperience: '',
    keySkills: '',
    relevantExperience: '',
    tone: 'professional',
    length: 'medium',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [generatedLetter, setGeneratedLetter] = useState<GeneratedCoverLetter | null>(null);
  const [letterText, setLetterText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiError, setApiError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof CoverLetterData]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validateStep = (step: number): boolean => {
    const next: Errors = {};
    if (step === 0) {
      if (!formData.jobTitle.trim()) next.jobTitle = 'Enter the job title you are applying for.';
      if (!formData.companyName.trim()) next.companyName = 'Enter the company name.';
      if (formData.jobDescription.trim().length < 30) next.jobDescription = 'Paste the job description (at least 30 characters).';
    } else {
      if (!formData.currentPosition.trim()) next.currentPosition = 'Enter your current or most recent position.';
      if (!formData.yearsExperience) next.yearsExperience = 'Select your years of experience.';
      if (splitList(formData.keySkills).length === 0) next.keySkills = 'List at least one skill.';
      if (!formData.relevantExperience.trim()) next.relevantExperience = 'Describe your most relevant experience or achievement.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (validateStep(currentStep)) setCurrentStep((s) => Math.min(1, s + 1));
  };

  const generateCoverLetter = async () => {
    if (!validateStep(0)) {
      setCurrentStep(0);
      return;
    }
    if (!validateStep(1)) return;
    setIsGenerating(true);
    setApiError('');
    const result = await postCareerTool<Record<string, unknown>>('cover-letter/generate', {
      job_title: formData.jobTitle.trim(),
      company_name: formData.companyName.trim(),
      job_description: formData.jobDescription.trim(),
      years_experience: YEARS[formData.yearsExperience] ?? 5,
      current_position: formData.currentPosition.trim(),
      achievements: formData.relevantExperience.trim(),
      skills: splitList(formData.keySkills).join(', '),
      // Extra context used by the AI prompt (the API passes all fields through).
      tone: formData.tone,
      length: formData.length,
      applicant_name: formData.yourName.trim() || undefined,
    });
    setIsGenerating(false);

    if (!result.ok) {
      setApiError(result.message);
      addToast({ type: 'error', title: 'Generation failed', description: result.message });
      return;
    }
    const letter = normalizeLetter(result.data, formData.yourName);
    if (!letter.content) {
      setApiError('The AI service returned an empty letter. Please try again.');
      return;
    }
    setGeneratedLetter(letter);
    setLetterText(letter.content);
    setCurrentStep(2);
    addToast({ type: 'success', title: 'Cover letter generated', description: 'Review and personalise the draft before sending it.' });
  };

  const fieldError = (name: keyof CoverLetterData) =>
    errors[name] ? (
      <p id={`${name}-error`} className="mt-1 text-sm text-red-600" role="alert">
        {errors[name]}
      </p>
    ) : null;

  const wordCount = letterText.trim() ? letterText.trim().split(/\s+/).length : 0;
  const fileName = `Cover-Letter-${(formData.companyName || 'Company').replace(/[^a-z0-9]+/gi, '-')}.txt`;

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-bold text-gray-900">Job Information</h2>
              <p className="text-gray-600">Tell us about the job you're applying for to create a targeted cover letter.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="cl-jobTitle" className={labelClass}>
                  Job Title *
                </label>
                <input
                  id="cl-jobTitle"
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleInputChange}
                  className={inputClass}
                  placeholder="e.g., Senior Software Engineer"
                  maxLength={255}
                  aria-invalid={Boolean(errors.jobTitle)}
                  aria-describedby={errors.jobTitle ? 'jobTitle-error' : undefined}
                />
                {fieldError('jobTitle')}
              </div>

              <div>
                <label htmlFor="cl-companyName" className={labelClass}>
                  Company Name *
                </label>
                <input
                  id="cl-companyName"
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className={inputClass}
                  placeholder="e.g., Tech Solutions Inc."
                  maxLength={255}
                  aria-invalid={Boolean(errors.companyName)}
                  aria-describedby={errors.companyName ? 'companyName-error' : undefined}
                />
                {fieldError('companyName')}
              </div>

              <div>
                <label htmlFor="cl-jobDescription" className={labelClass}>
                  Job Description *
                </label>
                <textarea
                  id="cl-jobDescription"
                  name="jobDescription"
                  value={formData.jobDescription}
                  onChange={handleInputChange}
                  rows={6}
                  maxLength={LIMITS.jobDescription}
                  className={inputClass}
                  placeholder="Paste the job description here..."
                  aria-invalid={Boolean(errors.jobDescription)}
                  aria-describedby="jobDescription-hint"
                />
                <p id="jobDescription-hint" className="mt-1 flex flex-wrap justify-between gap-2 text-sm text-gray-500">
                  <span>Paste the responsibilities and requirements; they contain the keywords that matter.</span>
                  <span>
                    {formData.jobDescription.length}/{LIMITS.jobDescription}
                  </span>
                </p>
                {fieldError('jobDescription')}
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-bold text-gray-900">Your Background</h2>
              <p className="text-gray-600">Share your relevant experience and skills. We only ask for job-relevant information.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="cl-yourName" className={labelClass}>
                  Your Name (optional)
                </label>
                <input
                  id="cl-yourName"
                  type="text"
                  name="yourName"
                  value={formData.yourName}
                  onChange={handleInputChange}
                  className={inputClass}
                  placeholder="Leave blank for a generic sign-off"
                  autoComplete="name"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="cl-currentPosition" className={labelClass}>
                    Current Position *
                  </label>
                  <input
                    id="cl-currentPosition"
                    type="text"
                    name="currentPosition"
                    value={formData.currentPosition}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="e.g., Software Developer"
                    maxLength={255}
                    aria-invalid={Boolean(errors.currentPosition)}
                  />
                  {fieldError('currentPosition')}
                </div>

                <div>
                  <label htmlFor="cl-yearsExperience" className={labelClass}>
                    Years of Experience *
                  </label>
                  <select
                    id="cl-yearsExperience"
                    name="yearsExperience"
                    value={formData.yearsExperience}
                    onChange={handleInputChange}
                    className={inputClass}
                    aria-invalid={Boolean(errors.yearsExperience)}
                  >
                    <option value="">Select experience level</option>
                    {Object.keys(YEARS).map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  {fieldError('yearsExperience')}
                </div>
              </div>

              <div>
                <label htmlFor="cl-keySkills" className={labelClass}>
                  Key Skills (comma-separated) *
                </label>
                <input
                  id="cl-keySkills"
                  type="text"
                  name="keySkills"
                  value={formData.keySkills}
                  onChange={handleInputChange}
                  maxLength={LIMITS.keySkills}
                  className={inputClass}
                  placeholder="e.g., React, Node.js, Stakeholder Management, Agile"
                  aria-invalid={Boolean(errors.keySkills)}
                />
                <p className="mt-1 text-sm text-gray-500">List the skills from the job description that you genuinely have.</p>
                {fieldError('keySkills')}
              </div>

              <div>
                <label htmlFor="cl-relevantExperience" className={labelClass}>
                  Relevant Experience and Achievements *
                </label>
                <textarea
                  id="cl-relevantExperience"
                  name="relevantExperience"
                  value={formData.relevantExperience}
                  onChange={handleInputChange}
                  rows={4}
                  maxLength={LIMITS.relevantExperience}
                  className={inputClass}
                  placeholder="e.g., Led the migration of our billing system to AWS, cutting release time from two weeks to two days."
                  aria-invalid={Boolean(errors.relevantExperience)}
                />
                <p className="mt-1 text-right text-sm text-gray-500">
                  {formData.relevantExperience.length}/{LIMITS.relevantExperience}
                </p>
                {fieldError('relevantExperience')}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="cl-tone" className={labelClass}>
                    Tone
                  </label>
                  <select id="cl-tone" name="tone" value={formData.tone} onChange={handleInputChange} className={inputClass}>
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="enthusiastic">Enthusiastic</option>
                    <option value="formal">Formal</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="cl-length" className={labelClass}>
                    Length
                  </label>
                  <select id="cl-length" name="length" value={formData.length} onChange={handleInputChange} className={inputClass}>
                    <option value="short">Short (3 paragraphs)</option>
                    <option value="medium">Medium (4 paragraphs)</option>
                    <option value="long">Long (5 paragraphs)</option>
                  </select>
                </div>
              </div>

              {apiError && (
                <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {apiError}
                </div>
              )}

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={generateCoverLetter}
                  disabled={isGenerating}
                  className="rounded-md bg-blue-600 px-8 py-3 text-lg font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isGenerating ? 'Generating…' : 'Generate Cover Letter'}
                </button>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-bold text-gray-900">Your Cover Letter</h2>
              <p className="text-gray-600">Review the draft, add a specific detail from your own work, then copy or download it.</p>
            </div>

            {generatedLetter && (
              <>
                <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
                  {generatedLetter.score !== null && (
                    <div className="mb-4">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Keyword match score</h3>
                        <span className="text-2xl font-bold text-green-600">{Math.round(generatedLetter.score)}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div className="h-2 rounded-full bg-green-600" style={{ width: `${Math.min(100, Math.max(0, generatedLetter.score))}%` }} />
                      </div>
                    </div>
                  )}

                  <label htmlFor="cl-output" className={labelClass}>
                    Cover letter (editable)
                  </label>
                  <textarea
                    id="cl-output"
                    data-testid="cover-letter-output"
                    value={letterText}
                    onChange={(e) => setLetterText(e.target.value)}
                    rows={16}
                    className={`${inputClass} leading-relaxed text-gray-800`}
                  />
                  <p className="mt-1 text-sm text-gray-500">{wordCount} words</p>
                </div>

                {(generatedLetter.suggestions.length > 0 || generatedLetter.keywords.length > 0) && (
                  <div className="grid gap-6 md:grid-cols-2">
                    {generatedLetter.suggestions.length > 0 && (
                      <div>
                        <h3 className="mb-3 text-lg font-semibold text-gray-900">Suggestions for improvement</h3>
                        <ul className="list-disc space-y-2 pl-5 text-sm text-gray-700">
                          {generatedLetter.suggestions.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {generatedLetter.keywords.length > 0 && (
                      <div>
                        <h3 className="mb-3 text-lg font-semibold text-gray-900">Keywords covered</h3>
                        <ul className="flex flex-wrap gap-2">
                          {generatedLetter.keywords.map((k) => (
                            <li key={k} className="rounded bg-blue-100 px-2 py-1 text-sm text-blue-800">
                              {k}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {generatedLetter.improvements.length > 0 && (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                    <h3 className="mb-2 font-medium text-yellow-900">Additional improvements</h3>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-yellow-800">
                      {generatedLetter.improvements.map((i) => (
                        <li key={i}>{i}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await copyText(letterText);
                      addToast(
                        ok
                          ? { type: 'success', title: 'Copied', description: 'Your cover letter is on the clipboard.' }
                          : { type: 'error', title: 'Copy failed', description: 'Select the text and copy it manually.' },
                      );
                    }}
                    className="flex-1 rounded-md bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700"
                  >
                    Copy Cover Letter
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadTextFile(fileName, letterText)}
                    className="flex-1 rounded-md border border-gray-300 bg-white px-6 py-3 font-medium text-gray-800 hover:bg-gray-50"
                  >
                    Download .txt
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 rounded-md bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
                  >
                    Edit Details &amp; Regenerate
                  </button>
                </div>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <CareerToolLayout slug="cover-letter-generator">
      <div className="mx-auto max-w-4xl">
        <StepIndicator steps={STEPS} current={currentStep} />

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-8">{renderStepContent()}</div>

        {currentStep < 2 && (
          <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row">
            <button
              type="button"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="rounded-md border border-gray-300 bg-white px-6 py-3 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            {currentStep === 0 && (
              <button type="button" onClick={goNext} className="rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700">
                Next
              </button>
            )}
          </div>
        )}
      </div>
    </CareerToolLayout>
  );
};

export default CoverLetterGenerator;
