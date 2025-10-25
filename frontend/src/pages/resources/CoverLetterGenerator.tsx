import React, { useState } from 'react';
import { useSEO } from '../../utils/seo';
import { useToast } from '../../hooks/use-toast';
import ApiKeyManager from '../../components/ApiKeyManager';

interface CoverLetterData {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  yourName: string; // Optional - can be generic
  currentPosition: string;
  yearsExperience: string;
  keySkills: string[];
  relevantExperience: string;
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
    yourName: '', // Optional - can be generic
    currentPosition: '',
    yearsExperience: '',
    keySkills: [],
    relevantExperience: '',
    tone: 'professional',
    length: 'medium'
  });
  const [generatedLetter, setGeneratedLetter] = useState<GeneratedCoverLetter | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useSEO({
    title: 'Free AI Cover Letter Generator - Create Professional Cover Letters',
    description: 'Generate personalized, ATS-friendly cover letters with AI. Tailor your cover letter to specific job postings and increase your chances of getting interviews.',
    url: '/resources/cover-letter-generator',
    keywords: ['cover letter generator', 'AI cover letter', 'job application', 'career tools', 'professional writing', 'ATS optimization']
  });

  const steps = [
    { title: 'Job Information', description: 'Enter job details and company information' },
    { title: 'Your Background', description: 'Share your relevant experience and skills' },
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
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Convert years experience string to integer
      const getYearsExperience = (experience: string): number => {
        switch (experience) {
          case '0-1 years': return 1;
          case '2-3 years': return 3;
          case '4-5 years': return 5;
          case '6-10 years': return 8;
          case '10+ years': return 12;
          default: return 5;
        }
      };
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001/api'}/career-tools/cover-letter/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          job_title: formData.jobTitle,
          company_name: formData.companyName,
          job_description: formData.jobDescription,
          years_experience: getYearsExperience(formData.yearsExperience),
          current_position: formData.currentPosition,
          achievements: formData.relevantExperience, // Use relevant experience as achievements
          skills: formData.keySkills.join(', ')
        })
      });

      const result = await response.json();

      if (result.success) {
        setGeneratedLetter(result.data);
        setCurrentStep(2);
        addToast({
          type: 'success',
          title: 'Cover Letter Generated',
          description: 'Your personalized cover letter has been created using AI!'
        });
      } else {
        throw new Error(result.message || 'Generation failed');
      }
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Background</h2>
              <p className="text-gray-600 mb-8">
                Share your relevant experience and skills. We'll keep it simple and focused.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  name="yourName"
                  value={formData.yourName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Leave blank for generic cover letter"
                />
                <p className="text-sm text-gray-500 mt-1">
                  We'll use "Dear Hiring Manager" if you leave this blank.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
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
                    <option value="0-1 years">0-1 years</option>
                    <option value="2-3 years">2-3 years</option>
                    <option value="4-5 years">4-5 years</option>
                    <option value="6-10 years">6-10 years</option>
                    <option value="10+ years">10+ years</option>
                  </select>
                </div>
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
                  placeholder="Briefly describe your most relevant work experience that matches the job requirements..."
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tone
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Length
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
                </div>
              </div>

              <div className="text-center pt-4">
                <button
                  onClick={generateCoverLetter}
                  disabled={isGenerating}
                  className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
                >
                  {isGenerating ? 'Generating...' : 'Generate Cover Letter'}
                </button>
              </div>
            </div>
          </div>
        );

      case 2:
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
                    <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                      {generatedLetter.content}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggestions for Improvement</h3>
                    <ul className="space-y-2">
                      {generatedLetter.suggestions && generatedLetter.suggestions.map((suggestion, index) => (
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
                      {generatedLetter.keywords && generatedLetter.keywords.map((keyword, index) => (
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
                    {generatedLetter.improvements && generatedLetter.improvements.map((improvement, index) => (
                      <li key={index} className="text-sm text-yellow-800 flex items-start">
                        <span className="mr-2">💡</span>
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => navigator.clipboard.writeText(generatedLetter.content)}
                    className="flex-1 bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 font-medium"
                  >
                    Copy Cover Letter
                  </button>
                  <button
                    onClick={() => {
                      setGeneratedLetter(null);
                      setCurrentStep(0);
                    }}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-medium"
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
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            AI Cover Letter Generator
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto mb-6 px-4">
            Create personalized, ATS-friendly cover letters with AI. 
            <span className="text-blue-600 font-semibold"> We only ask for job-relevant information - no personal details required!</span>
          </p>
          
          {/* API Key Manager */}
          <div className="max-w-2xl mx-auto px-4">
            <ApiKeyManager />
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {steps && steps.map((_, index) => (
              <div key={index} className="flex items-center flex-shrink-0">
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                  index <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 sm:w-16 h-1 mx-1 sm:mx-2 ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500 overflow-x-auto px-2">
            {steps && steps.map((step, index) => (
              <span key={index} className={`text-center max-w-16 sm:max-w-20 flex-shrink-0 px-1 ${index === currentStep ? 'font-semibold text-blue-600' : ''}`}>
                {step.title}
              </span>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        {currentStep < 2 && (
          <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-4 sm:px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              disabled={currentStep === 1}
              className="px-4 sm:px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
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