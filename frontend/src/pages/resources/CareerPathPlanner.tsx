import React, { useState } from 'react';
import { useSEO } from '../../utils/seo';
import { useToast } from '../../hooks/use-toast';
import ApiKeyManager from '../../components/ApiKeyManager';

interface CareerData {
  currentRole: string;
  industry: string;
  experience: string;
  skills: string[];
  interests: string[];
  goals: string;
  location: string;
}

const CareerPathPlanner: React.FC = () => {
  const { addToast } = useToast();
  const [careerData, setCareerData] = useState<CareerData>({
    currentRole: '',
    industry: '',
    experience: '',
    skills: [],
    interests: [],
    goals: '',
    location: ''
  });
  const [careerPlan, setCareerPlan] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useSEO({
    title: 'Career Path Planner - AI-Powered Career Guidance | Naqash Thaheem',
    description: 'Plan your career journey with AI-powered guidance. Get personalized career paths, skill recommendations, and strategic advice for professional growth.',
    url: '/resources/career-path-planner',
    keywords: ['career planning', 'career path', 'professional development', 'career guidance', 'AI tools', 'career growth']
  });

  const steps = [
    { title: 'Current Position', description: 'Tell us about your current role and industry' },
    { title: 'Skills & Experience', description: 'Highlight your current skills and experience level' },
    { title: 'Interests & Goals', description: 'Share your career interests and goals' },
    { title: 'Location & Preferences', description: 'Specify your location and work preferences' },
    { title: 'Career Analysis', description: 'Get AI-powered career analysis and recommendations' },
    { title: 'Action Plan', description: 'Receive your personalized career development plan' }
  ];

  const generateCareerPlan = async () => {
    setIsGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001/api'}/career-tools/career-path/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          current_role: formData.currentRole,
          experience_years: formData.experienceYears,
          skills: formData.skills,
          interests: formData.interests,
          career_goals: formData.careerGoals,
          industry: formData.industry,
          education_level: formData.educationLevel
        })
      });

      const result = await response.json();

      if (result.success) {
        setCareerPlan(result.data);
        setCurrentStep(4);
        addToast({
          type: 'success',
          title: 'Career Plan Ready',
          description: 'Your personalized career development plan has been generated using AI.'
        });
      } else {
        throw new Error(result.message || 'Generation failed');
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Generation Failed',
        description: 'Failed to generate career plan. Please try again.'
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Current Position</h2>
              <p className="text-gray-600 mb-8">
                Tell us about your current role and industry to start planning your career path.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Job Title
                </label>
                <input
                  type="text"
                  value={careerData.currentRole}
                  onChange={(e) => setCareerData({...careerData, currentRole: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Software Engineer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry
                </label>
                <select
                  value={careerData.industry}
                  onChange={(e) => setCareerData({...careerData, industry: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select industry</option>
                  <option value="technology">Technology</option>
                  <option value="finance">Finance</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="education">Education</option>
                  <option value="consulting">Consulting</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience
                </label>
                <select
                  value={careerData.experience}
                  onChange={(e) => setCareerData({...careerData, experience: e.target.value})}
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
                What skills do you currently have? This helps us identify your strengths and areas for growth.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={careerData.skills.join(', ')}
                  onChange={(e) => setCareerData({...careerData, skills: e.target.value.split(',').map(s => s.trim())})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., JavaScript, React, Node.js, Python, AWS"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Career Interests (comma-separated)
                </label>
                <input
                  type="text"
                  value={careerData.interests.join(', ')}
                  onChange={(e) => setCareerData({...careerData, interests: e.target.value.split(',').map(s => s.trim())})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Leadership, Product Management, Entrepreneurship, Data Science"
                />
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
                Continue
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Interests & Goals</h2>
              <p className="text-gray-600 mb-8">
                What are your career aspirations and what motivates you professionally?
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Career Goals
                </label>
                <textarea
                  value={careerData.goals}
                  onChange={(e) => setCareerData({...careerData, goals: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your career goals and aspirations..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Location
                </label>
                <input
                  type="text"
                  value={careerData.location}
                  onChange={(e) => setCareerData({...careerData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., San Francisco, CA or Remote"
                />
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
                onClick={() => setCurrentStep(3)}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-medium"
              >
                Continue
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Location & Preferences</h2>
              <p className="text-gray-600 mb-8">
                Help us understand your work preferences and location requirements.
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Preferences</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-3" />
                  <span>Remote work preferred</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-3" />
                  <span>Hybrid work arrangement</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-3" />
                  <span>On-site work preferred</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-3" />
                  <span>Startup environment</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-3" />
                  <span>Large corporation</span>
                </label>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 font-medium"
              >
                Back
              </button>
              <button
                onClick={generateCareerPlan}
                disabled={isGenerating}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isGenerating ? 'Generating Plan...' : 'Generate Career Plan'}
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Career Analysis</h2>
              <p className="text-gray-600">
                Based on your profile, here are the recommended career paths and opportunities.
              </p>
            </div>

            <div className="space-y-6">
              {careerPlan?.careerPaths.map((path: any, index: number) => (
                <div key={index} className="bg-white border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{path.title}</h3>
                      <p className="text-gray-600 mb-3">{path.description}</p>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">Timeline: {path.timeline}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          path.probability === 'High' ? 'bg-green-100 text-green-800' :
                          path.probability === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {path.probability} Probability
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ${path.salary.future.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">Potential Salary</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Required Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {path.skills.map((skill: string, skillIndex: number) => (
                        <span key={skillIndex} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Next Steps</h4>
                    <ul className="space-y-1">
                      {path.nextSteps.map((step: string, stepIndex: number) => (
                        <li key={stepIndex} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(0)}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 font-medium"
              >
                Start Over
              </button>
              <button
                onClick={() => setCurrentStep(5)}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-medium"
              >
                View Action Plan
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Action Plan</h2>
              <p className="text-gray-600">
                Here's your personalized career development plan with specific actions and timelines.
              </p>
            </div>

            <div className="space-y-6">
              {careerPlan?.recommendations.map((rec: any, index: number) => (
                <div key={index} className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{rec.category}</h3>
                  <ul className="space-y-2">
                    {rec.items.map((item: string, itemIndex: number) => (
                      <li key={itemIndex} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Skill Development Plan</h3>
              <div className="space-y-4">
                {careerPlan?.skillGaps.map((gap: any, index: number) => (
                  <div key={index} className="bg-white rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{gap.skill}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        gap.importance === 'High' ? 'bg-red-100 text-red-800' :
                        gap.importance === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {gap.importance} Priority
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {gap.currentLevel} → {gap.targetLevel}
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 mb-1">Resources:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {gap.resources.map((resource: string, resIndex: number) => (
                          <li key={resIndex} className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>{resource}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Insights</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Industry Growth</h4>
                  <p className="text-gray-700">{careerPlan?.marketInsights.industryGrowth}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">In-Demand Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {careerPlan?.marketInsights.inDemandSkills.map((skill: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Salary Trends</h4>
                  <p className="text-gray-700">{careerPlan?.marketInsights.salaryTrends}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Remote Work</h4>
                  <p className="text-gray-700">{careerPlan?.marketInsights.remoteWork}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(4)}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 font-medium"
              >
                Back to Analysis
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(careerPlan, null, 2));
                  addToast({
                    type: 'success',
                    title: 'Copied to Clipboard',
                    description: 'Your career plan has been copied to your clipboard.'
                  });
                }}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-medium"
              >
                Copy Action Plan
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
            Career Path Planner
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto mb-6 px-4">
            Plan your career journey with AI-powered guidance. Get personalized career paths, 
            skill recommendations, and strategic advice for professional growth.
          </p>
          
          {/* API Key Manager */}
          <div className="max-w-2xl mx-auto px-4">
            <ApiKeyManager />
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {steps.map((_, index) => (
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
            <h3 className="font-medium text-gray-900 text-sm sm:text-base">{steps[currentStep].title}</h3>
            <p className="text-xs sm:text-sm text-gray-600">{steps[currentStep].description}</p>
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
              <span className="text-2xl">🗺️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Career Mapping</h3>
            <p className="text-gray-600">Get personalized career paths based on your profile</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📈</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Skill Development</h3>
            <p className="text-gray-600">Identify skill gaps and get learning recommendations</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Strategic Planning</h3>
            <p className="text-gray-600">Get actionable steps with timelines and milestones</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerPathPlanner;
