import React, { useState } from 'react';
import { useSEO } from '../../utils/seo';
import { useToast } from '../../hooks/use-toast';
import ApiKeyManager from '../../components/ApiKeyManager';

interface JobSearchData {
  jobTitle: string;
  location: string;
  experience: string;
  skills: string[];
  preferences: string[];
  salaryRange: string;
  companySize: string;
}

const JobSearchOptimizer: React.FC = () => {
  const { addToast } = useToast();
  const [jobSearchData, setJobSearchData] = useState<JobSearchData>({
    jobTitle: '',
    location: '',
    experience: '',
    skills: [],
    preferences: [],
    salaryRange: '',
    companySize: ''
  });
  const [searchStrategy, setSearchStrategy] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useSEO({
    title: 'Free Job Search Optimizer - AI-Powered Job Search Strategy',
    description: 'Optimize your job search with AI-powered strategies. Get personalized job recommendations, application tips, and networking strategies.',
    url: '/resources/job-search-optimizer',
    keywords: ['job search', 'career tools', 'job recommendations', 'application tips', 'networking', 'AI guidance']
  });

  const steps = [
    { title: 'Job Preferences', description: 'Tell us what kind of job you\'re looking for' },
    { title: 'Skills & Experience', description: 'Share your skills and work preferences' },
    { title: 'Location & Salary', description: 'Set your location and salary expectations' },
    { title: 'Action Plan', description: 'Receive your personalized job search strategy' }
  ];

  const getExperienceYears = (experienceLevel: string): number => {
    switch (experienceLevel) {
      case 'entry': return 1;
      case 'mid': return 4;
      case 'senior': return 8;
      case 'lead': return 12;
      default: return 5;
    }
  };

  const getSalaryExpectation = (salaryRange: string): number => {
    switch (salaryRange) {
      case '$50,000 - $70,000': return 60000;
      case '$70,000 - $90,000': return 80000;
      case '$90,000 - $120,000': return 105000;
      case '$120,000 - $150,000': return 135000;
      case '$150,000+': return 175000;
      default: return 100000;
    }
  };

  const generateSearchStrategy = async () => {
    setIsGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001/api'}/career-tools/job-search/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          job_title: jobSearchData.jobTitle,
          location: jobSearchData.location,
          experience_years: getExperienceYears(jobSearchData.experience),
          skills: jobSearchData.skills,
          salary_expectation: getSalaryExpectation(jobSearchData.salaryRange),
          job_type: 'full_time', // Backend expects specific values
          industry: 'Technology' // Default value since not in interface
        })
      });

      const result = await response.json();

      if (result.success) {
        setSearchStrategy(result.data);
        setCurrentStep(3); // Go to results step (step 3)
        addToast({
          type: 'success',
          title: 'Search Strategy Ready',
          description: 'Your personalized job search strategy has been generated using AI.'
        });
      } else {
        throw new Error(result.message || 'Generation failed');
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Generation Failed',
        description: 'Failed to generate search strategy. Please try again.'
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Preferences</h2>
              <p className="text-gray-600 mb-8">
                Tell us what kind of job you're looking for to get personalized recommendations.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desired Job Title
                </label>
                <input
                  type="text"
                  value={jobSearchData.jobTitle}
                  onChange={(e) => setJobSearchData({...jobSearchData, jobTitle: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Location
                </label>
                <input
                  type="text"
                  value={jobSearchData.location}
                  onChange={(e) => setJobSearchData({...jobSearchData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., San Francisco, CA or Remote"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience
                </label>
                <select
                  value={jobSearchData.experience}
                  onChange={(e) => setJobSearchData({...jobSearchData, experience: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select experience level</option>
                  <option value="entry">Entry Level (0-2 years)</option>
                  <option value="mid">Mid Level (3-5 years)</option>
                  <option value="senior">Senior Level (6-10 years)</option>
                  <option value="lead">Lead/Principal (10+ years)</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setCurrentStep(1)}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-medium"
            >
              Continue
            </button>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Skills & Experience</h2>
              <p className="text-gray-600 mb-8">
                What skills do you have that are relevant to your job search?
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Technical Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={jobSearchData.skills.join(', ')}
                  onChange={(e) => setJobSearchData({...jobSearchData, skills: e.target.value.split(',').map(s => s.trim())})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., JavaScript, React, Node.js, Python, AWS"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Preferences (select all that apply)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Remote Work',
                    'Flexible Hours',
                    'Startup Environment',
                    'Large Corporation',
                    'Team Leadership',
                    'Individual Contributor',
                    'Fast-Paced',
                    'Stable Environment'
                  ].map((pref) => (
                    <label key={pref} className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={jobSearchData.preferences.includes(pref)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setJobSearchData({
                              ...jobSearchData,
                              preferences: [...jobSearchData.preferences, pref]
                            });
                          } else {
                            setJobSearchData({
                              ...jobSearchData,
                              preferences: jobSearchData.preferences.filter(p => p !== pref)
                            });
                          }
                        }}
                      />
                      <span className="text-sm">{pref}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(0)}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 font-medium"
              >
                Back
              </button>
              <button
                onClick={() => setCurrentStep(2)}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-medium"
              >
                Next: Location & Salary
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Location & Salary</h2>
              <p className="text-gray-600 mb-8">
                Help us understand your location and salary expectations.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary Range
                </label>
                <select
                  value={jobSearchData.salaryRange}
                  onChange={(e) => setJobSearchData({...jobSearchData, salaryRange: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select salary range</option>
                  <option value="50-70k">$50,000 - $70,000</option>
                  <option value="70-90k">$70,000 - $90,000</option>
                  <option value="90-120k">$90,000 - $120,000</option>
                  <option value="120-150k">$120,000 - $150,000</option>
                  <option value="150k+">$150,000+</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Size Preference
                </label>
                <select
                  value={jobSearchData.companySize}
                  onChange={(e) => setJobSearchData({...jobSearchData, companySize: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select company size</option>
                  <option value="startup">Startup (1-50 employees)</option>
                  <option value="small">Small (51-200 employees)</option>
                  <option value="medium">Medium (201-1000 employees)</option>
                  <option value="large">Large (1000+ employees)</option>
                  <option value="any">Any size</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 font-medium"
              >
                Back
              </button>
              <button
                onClick={generateSearchStrategy}
                disabled={isGenerating}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isGenerating ? 'Generating Strategy...' : 'Generate Search Strategy'}
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Recommendations</h2>
              <p className="text-gray-600">
                Here are personalized job recommendations based on your profile.
              </p>
            </div>

            <div className="space-y-6">
              {searchStrategy?.jobRecommendations && searchStrategy.jobRecommendations.length > 0 ? (
                searchStrategy.jobRecommendations.map((job: any, index: number) => (
                  <div key={index} className="bg-white border rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">{job?.title || 'Job Title Not Available'}</h3>
                        <p className="text-gray-600 mb-2">{job?.company || 'Company'} • {job?.location || 'Location'}</p>
                        <p className="text-gray-700 mb-3">{job?.description || 'Job description not available'}</p>
                        <div className="flex items-center gap-4">
                          <span className="text-green-600 font-semibold">{job?.salary || 'Salary not specified'}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            job?.match && parseFloat(job?.match) >= 90 ? 'bg-green-100 text-green-800' :
                            job?.match && parseFloat(job?.match) >= 80 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {job?.match || 'N/A'} Match
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Why This Job Matches</h4>
                      <p className="text-gray-600 text-sm">{job?.whyMatch || 'Match details not available'}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Application Tips</h4>
                      <ul className="space-y-1">
                        {job?.applicationTips && job?.applicationTips.length > 0 ? (
                          job?.applicationTips.map((tip: string, tipIndex: number) => (
                            <li key={tipIndex} className="flex items-start gap-2 text-sm text-gray-600">
                              <span className="text-blue-500 mt-1">•</span>
                              <span>{tip}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-sm text-gray-500 italic">No application tips available</li>
                        )}
                      </ul>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-gray-50 border rounded-lg p-6 text-center">
                  <p className="text-gray-500 italic">No job recommendations available at the moment. Please try again later.</p>
                </div>
              )}
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Strategy</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Keywords to Use</h4>
                  <div className="flex flex-wrap gap-2">
                    {searchStrategy?.searchStrategy?.keywords && searchStrategy.searchStrategy.keywords.map((keyword: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Best Platforms</h4>
                  <ul className="space-y-1">
                    {searchStrategy?.searchStrategy?.platforms && searchStrategy.searchStrategy.platforms.map((platform: string, index: number) => (
                      <li key={index} className="text-sm text-gray-600">• {platform}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Best Times to Apply</h4>
                  <p className="text-sm text-gray-600">{searchStrategy?.searchStrategy.timing}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Application Frequency</h4>
                  <p className="text-sm text-gray-600">{searchStrategy?.searchStrategy.frequency}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(0)}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 font-medium"
              >
                Start Over
              </button>
              <button
                onClick={() => setCurrentStep(4)}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-medium"
              >
                Application Tips
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Optimization</h2>
              <p className="text-gray-600">
                Learn how to optimize your applications for better success rates.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resume Tips</h3>
                <ul className="space-y-2">
                  {searchStrategy?.applicationOptimization?.resumeTips && searchStrategy.applicationOptimization.resumeTips.map((tip: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cover Letter Tips</h3>
                <ul className="space-y-2">
                  {searchStrategy?.applicationOptimization?.coverLetterTips && searchStrategy.applicationOptimization.coverLetterTips.map((tip: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Tips</h3>
                <ul className="space-y-2">
                  {searchStrategy?.applicationOptimization?.portfolioTips && searchStrategy.applicationOptimization.portfolioTips.map((tip: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(3)}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 font-medium"
              >
                Back to Jobs
              </button>
              <button
                onClick={() => setCurrentStep(5)}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-medium"
              >
                Networking Plan
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Networking & Interview Strategy</h2>
              <p className="text-gray-600">
                Get comprehensive networking and interview preparation strategies.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Online Networking</h3>
                <ul className="space-y-2">
                  {searchStrategy?.networkingStrategy?.online && searchStrategy.networkingStrategy.online.map((tip: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Offline Networking</h3>
                <ul className="space-y-2">
                  {searchStrategy?.networkingStrategy?.offline && searchStrategy.networkingStrategy.offline.map((tip: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informational Interviews</h3>
              <ul className="space-y-2">
                {searchStrategy?.networkingStrategy?.informationalInterviews && searchStrategy.networkingStrategy.informationalInterviews.map((tip: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Common Interview Questions</h3>
                <ul className="space-y-2">
                  {searchStrategy?.interviewPreparation?.commonQuestions && searchStrategy.interviewPreparation.commonQuestions.map((question: string, index: number) => (
                    <li key={index} className="text-sm text-gray-600">• {question}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Questions</h3>
                <ul className="space-y-2">
                  {searchStrategy?.interviewPreparation?.technicalQuestions && searchStrategy.interviewPreparation.technicalQuestions.map((question: string, index: number) => (
                    <li key={index} className="text-sm text-gray-600">• {question}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary Negotiation Tips</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Research</h4>
                  <p className="text-sm text-gray-600">{searchStrategy?.salaryNegotiation.research}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Timing</h4>
                  <p className="text-sm text-gray-600">{searchStrategy?.salaryNegotiation.timing}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Approach</h4>
                  <p className="text-sm text-gray-600">{searchStrategy?.salaryNegotiation.approach}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Alternatives</h4>
                  <p className="text-sm text-gray-600">{searchStrategy?.salaryNegotiation.alternatives}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(4)}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 font-medium"
              >
                Back to Applications
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(searchStrategy, null, 2));
                  addToast({
                    type: 'success',
                    title: 'Copied to Clipboard',
                    description: 'Your job search strategy has been copied to your clipboard.'
                  });
                }}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-medium"
              >
                Copy Strategy
              </button>
            </div>
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
            Job Search Optimizer
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto mb-6 px-4">
            Optimize your job search with AI-powered strategies. We only ask for essential job search information - no personal details required!
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
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 text-center px-4">
            <h3 className="font-medium text-gray-900 text-sm sm:text-base">{steps[currentStep]?.title || 'Step'}</h3>
            <p className="text-xs sm:text-sm text-gray-600">{steps[currentStep]?.description || 'Description'}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8">
          {renderStepContent()}
        </div>

        {/* Features */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Job Matching</h3>
            <p className="text-gray-600">Get personalized job recommendations based on your profile</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📝</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Application Tips</h3>
            <p className="text-gray-600">Learn how to optimize your resume, cover letter, and portfolio</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤝</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Networking Strategy</h3>
            <p className="text-gray-600">Build professional relationships and expand your network</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobSearchOptimizer;
