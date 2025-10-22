import React, { useState } from 'react';
import { useSEO } from '../../utils/seo';
import { useToast } from '../../hooks/use-toast';

interface CoverLetterData {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  yourName: string;
  yourEmail: string;
  yourPhone: string;
  currentPosition: string;
  yearsExperience: string;
  keySkills: string[];
  relevantExperience: string;
  motivation: string;
  achievements: string;
  tone: 'professional' | 'friendly' | 'enthusiastic' | 'formal';
  length: 'short' | 'medium' | 'long';
}

interface GeneratedCoverLetter {
  content: string;
  suggestions: string[];
  keywords: string[];
  score: number;
  improvements: string[];
}

const CoverLetterGenerator: React.FC = () => {
  const { addToast } = useToast();
  const [formData, setFormData] = useState<CoverLetterData>({
    jobTitle: '',
    companyName: '',
    jobDescription: '',
    yourName: '',
    yourEmail: '',
    yourPhone: '',
    currentPosition: '',
    yearsExperience: '',
    keySkills: [],
    relevantExperience: '',
    motivation: '',
    achievements: '',
    tone: 'professional',
    length: 'medium'
  });
  const [generatedLetter, setGeneratedLetter] = useState<GeneratedCoverLetter | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useSEO({
    title: 'AI Cover Letter Generator - Create Professional Cover Letters | Naqash Thaheem',
    description: 'Generate personalized, ATS-friendly cover letters with AI. Tailor your cover letter to specific job postings and increase your chances of getting interviews.',
    url: '/resources/cover-letter-generator',
    keywords: ['cover letter generator', 'AI cover letter', 'job application', 'career tools', 'professional writing', 'ATS optimization']
  });

  const steps = [
    { title: 'Job Information', description: 'Enter job details and company information' },
    { title: 'Personal Details', description: 'Add your contact information and background' },
    { title: 'Experience & Skills', description: 'Highlight your relevant experience and skills' },
    { title: 'Motivation & Achievements', description: 'Share your motivation and key achievements' },
    { title: 'Customization', description: 'Choose tone and length preferences' },
    { title: 'Generated Cover Letter', description: 'Review and customize your cover letter' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const skills = e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill);
    setFormData(prev => ({ ...prev, keySkills: skills }));
  };

  const generateCoverLetter = async () => {
    setIsGenerating(true);
    try {
      // Simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 3000));

      const mockCoverLetter: GeneratedCoverLetter = {
        content: `Dear Hiring Manager,

I am writing to express my strong interest in the ${formData.jobTitle} position at ${formData.companyName}. With ${formData.yearsExperience} years of experience in ${formData.currentPosition} and a proven track record of ${formData.achievements}, I am confident that I would be a valuable addition to your team.

In my current role, I have successfully ${formData.relevantExperience}, which directly aligns with the requirements outlined in your job posting. My expertise in ${formData.keySkills.join(', ')} has enabled me to ${formData.achievements}, and I am excited about the opportunity to bring these skills to ${formData.companyName}.

What particularly attracts me to this position is ${formData.motivation}. I am impressed by ${formData.companyName}'s commitment to innovation and excellence, and I am eager to contribute to your continued success.

I would welcome the opportunity to discuss how my experience and passion for ${formData.jobTitle} can contribute to your team's goals. Thank you for considering my application.

Best regards,
${formData.yourName}`,
        suggestions: [
          'Add specific metrics or quantifiable achievements',
          'Include a call-to-action in the closing paragraph',
          'Mention any mutual connections or company research',
          'Highlight relevant certifications or education'
        ],
        keywords: [
          formData.jobTitle,
          formData.companyName,
          ...formData.keySkills,
          'experience',
          'skills',
          'achievements'
        ],
        score: 85,
        improvements: [
          'Consider adding more specific examples of your work',
          'Include industry-specific terminology',
          'Add a personal touch that shows company research'
        ]
      };

      setGeneratedLetter(mockCoverLetter);
      setCurrentStep(5);
      addToast({
        type: 'success',
        title: 'Cover Letter Generated',
        description: 'Your personalized cover letter has been created successfully!'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Generation Failed',
        description: 'Failed to generate cover letter. Please try again.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Information</h2>
              <p className="text-gray-600 mb-8">
                Tell us about the job you're applying for to create a targeted cover letter.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Senior Software Engineer"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Tech Solutions Inc."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description *
                </label>
                <textarea
                  name="jobDescription"
                  value={formData.jobDescription}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Paste the job description here..."
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Copy and paste the full job description to help us tailor your cover letter.
                </p>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Personal Details</h2>
              <p className="text-gray-600 mb-8">
                Provide your contact information and current position.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  name="yourName"
                  value={formData.yourName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="yourEmail"
                  value={formData.yourEmail}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="john.doe@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="yourPhone"
                  value={formData.yourPhone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Position *
                </label>
                <input
                  type="text"
                  name="currentPosition"
                  value={formData.currentPosition}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Software Developer"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Years of Experience *
              </label>
              <select
                name="yearsExperience"
                value={formData.yearsExperience}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select experience level</option>
                <option value="0-1">0-1 years</option>
                <option value="2-3">2-3 years</option>
                <option value="4-5">4-5 years</option>
                <option value="6-10">6-10 years</option>
                <option value="10+">10+ years</option>
              </select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Experience & Skills</h2>
              <p className="text-gray-600 mb-8">
                Highlight your relevant experience and key skills for this position.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Skills (comma-separated) *
              </label>
              <input
                type="text"
                value={formData.keySkills.join(', ')}
                onChange={handleSkillsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., React, Node.js, Python, AWS, Agile"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                List your most relevant technical and soft skills for this position.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relevant Experience *
              </label>
              <textarea
                name="relevantExperience"
                value={formData.relevantExperience}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your most relevant work experience that matches the job requirements..."
                required
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Motivation & Achievements</h2>
              <p className="text-gray-600 mb-8">
                Share what motivates you and your key achievements.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Why are you interested in this position? *
              </label>
              <textarea
                name="motivation"
                value={formData.motivation}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Explain what attracts you to this role and company..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Achievements *
              </label>
              <textarea
                name="achievements"
                value={formData.achievements}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your most significant professional achievements..."
                required
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Customization</h2>
              <p className="text-gray-600 mb-8">
                Choose the tone and length for your cover letter.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tone *
                </label>
                <select
                  name="tone"
                  value={formData.tone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="enthusiastic">Enthusiastic</option>
                  <option value="formal">Formal</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Choose the tone that best fits the company culture.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Length *
                </label>
                <select
                  name="length"
                  value={formData.length}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="short">Short (3-4 paragraphs)</option>
                  <option value="medium">Medium (4-5 paragraphs)</option>
                  <option value="long">Long (5-6 paragraphs)</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Select the appropriate length for your industry.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Ready to Generate?</h3>
              <p className="text-sm text-blue-800">
                Click the button below to generate your personalized cover letter based on all the information you've provided.
              </p>
            </div>

            <button
              onClick={generateCoverLetter}
              disabled={isGenerating}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating Cover Letter...' : 'Generate Cover Letter'}
            </button>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Generated Cover Letter</h2>
              <p className="text-gray-600 mb-8">
                Review your personalized cover letter and make any necessary adjustments.
              </p>
            </div>

            {generatedLetter && (
              <>
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">Cover Letter Score</h3>
                      <span className="text-2xl font-bold text-green-600">{generatedLetter.score}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${generatedLetter.score}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">
                      {generatedLetter.content}
                    </pre>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggestions for Improvement</h3>
                    <ul className="space-y-2">
                      {generatedLetter.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2 text-blue-500">•</span>
                          <span className="text-sm text-gray-700">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Keywords Used</h3>
                    <div className="flex flex-wrap gap-2">
                      {generatedLetter.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="font-medium text-yellow-900 mb-2">Additional Improvements</h3>
                  <ul className="space-y-1">
                    {generatedLetter.improvements.map((improvement, index) => (
                      <li key={index} className="text-sm text-yellow-800 flex items-start">
                        <span className="mr-2">💡</span>
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedLetter.content);
                      addToast({
                        type: 'success',
                        title: 'Copied to Clipboard',
                        description: 'Cover letter has been copied to your clipboard.'
                      });
                    }}
                    className="flex-1 bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 font-medium"
                  >
                    Copy Cover Letter
                  </button>
                  <button
                    onClick={() => setCurrentStep(0)}
                    className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 font-medium"
                  >
                    Generate Another
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Cover Letter Generator
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Create personalized, ATS-friendly cover letters tailored to specific job postings. 
            Increase your chances of landing interviews with AI-powered content generation.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((_, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            {steps.map((step, index) => (
              <span key={index} className={`text-center max-w-20 ${index === currentStep ? 'font-semibold text-blue-600' : ''}`}>
                {step.title}
              </span>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        {currentStep < 5 && (
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              disabled={currentStep === 4}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoverLetterGenerator;
