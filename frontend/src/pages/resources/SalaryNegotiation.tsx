import React, { useState } from 'react';
import { useSEO } from '../../utils/seo';
import { useToast } from '../../hooks/use-toast';
import ApiKeyManager from '../../components/ApiKeyManager';

interface SalaryData {
  currentSalary: string;
  desiredSalary: string;
  jobTitle: string;
  location: string;
  experience: string;
  companySize: string;
  industry: string;
}

const SalaryNegotiation: React.FC = () => {
  const { addToast } = useToast();
  const [salaryData, setSalaryData] = useState<SalaryData>({
    currentSalary: '',
    desiredSalary: '',
    jobTitle: '',
    location: '',
    experience: '',
    companySize: '',
    industry: ''
  });
  const [negotiationPlan, setNegotiationPlan] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useSEO({
    title: 'Salary Negotiation Tool - AI-Powered Negotiation Guidance | Naqash Thaheem',
    description: 'Master salary negotiations with AI-powered guidance. Get market research, negotiation scripts, and industry-specific strategies to maximize your earning potential.',
    url: '/resources/salary-negotiation',
    keywords: ['salary negotiation', 'career tools', 'AI guidance', 'negotiation scripts', 'market research', 'career advancement']
  });

  const steps = [
    { title: 'Salary Information', description: 'Enter your current and desired salary details' },
    { title: 'Job Details', description: 'Provide job title, location, and experience level' },
    { title: 'Company Information', description: 'Share company size and industry details' },
    { title: 'Market Research', description: 'Get salary benchmarks and market data' },
    { title: 'Negotiation Strategy', description: 'Receive personalized negotiation plan' },
    { title: 'Scripts & Tips', description: 'Get ready-to-use negotiation scripts' }
  ];

  const generateNegotiationPlan = async () => {
    setIsGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001/api'}/career-tools/salary-negotiation/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          current_salary: salaryData.currentSalary,
          desired_salary: salaryData.desiredSalary,
          job_title: salaryData.jobTitle,
          location: salaryData.location,
          experience_years: salaryData.experience,
          education_level: 'Bachelor', // Default value since not in interface
          skills: [], // Default empty array since not in interface
          company_size: salaryData.companySize
        })
      });

      const result = await response.json();

      if (result.success) {
        setNegotiationPlan(result.data);
        setCurrentStep(5);
        addToast({
          type: 'success',
          title: 'Negotiation Plan Ready',
          description: 'Your personalized salary negotiation strategy has been generated using AI.'
        });
      } else {
        throw new Error(result.message || 'Generation failed');
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Generation Failed',
        description: 'Failed to generate negotiation plan. Please try again.'
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Salary Information</h2>
              <p className="text-gray-600 mb-8">
                Let's start with your current and desired salary information.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Salary (Annual)
                </label>
                <input
                  type="number"
                  value={salaryData.currentSalary}
                  onChange={(e) => setSalaryData({...salaryData, currentSalary: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 75000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desired Salary (Annual)
                </label>
                <input
                  type="number"
                  value={salaryData.desiredSalary}
                  onChange={(e) => setSalaryData({...salaryData, desiredSalary: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 90000"
                />
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Details</h2>
              <p className="text-gray-600 mb-8">
                Tell us about the position you're negotiating for.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  value={salaryData.jobTitle}
                  onChange={(e) => setSalaryData({...salaryData, jobTitle: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={salaryData.location}
                    onChange={(e) => setSalaryData({...salaryData, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., San Francisco, CA"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience
                  </label>
                  <select
                    value={salaryData.experience}
                    onChange={(e) => setSalaryData({...salaryData, experience: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select experience</option>
                    <option value="0-1">0-1 years</option>
                    <option value="2-3">2-3 years</option>
                    <option value="4-6">4-6 years</option>
                    <option value="7-10">7-10 years</option>
                    <option value="10+">10+ years</option>
                  </select>
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
                Continue
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Company Information</h2>
              <p className="text-gray-600 mb-8">
                Help us understand the company context for better recommendations.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Size
                </label>
                <select
                  value={salaryData.companySize}
                  onChange={(e) => setSalaryData({...salaryData, companySize: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select company size</option>
                  <option value="startup">Startup (1-50 employees)</option>
                  <option value="small">Small (51-200 employees)</option>
                  <option value="medium">Medium (201-1000 employees)</option>
                  <option value="large">Large (1000+ employees)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry
                </label>
                <select
                  value={salaryData.industry}
                  onChange={(e) => setSalaryData({...salaryData, industry: e.target.value})}
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
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 font-medium"
              >
                Back
              </button>
              <button
                onClick={generateNegotiationPlan}
                disabled={isGenerating}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isGenerating ? 'Generating Plan...' : 'Generate Negotiation Plan'}
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Negotiation Strategy</h2>
              <p className="text-gray-600">
                Here's your personalized salary negotiation plan based on market data and best practices.
              </p>
            </div>

            {/* Market Research */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Market Research</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Market Range</p>
                  <p className="text-lg font-semibold">
                    ${negotiationPlan?.marketSalary.min.toLocaleString()} - ${negotiationPlan?.marketSalary.max.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Median Salary</p>
                  <p className="text-lg font-semibold">
                    ${negotiationPlan?.marketSalary.median.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Negotiation Strategy */}
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Strategy</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Target Salary</p>
                  <p className="text-lg font-semibold text-green-600">
                    ${negotiationPlan?.negotiationStrategy.targetSalary.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Anchor Point</p>
                  <p className="text-lg font-semibold text-green-600">
                    ${negotiationPlan?.negotiationStrategy.anchorPoint.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Walk Away Point</p>
                  <p className="text-lg font-semibold text-red-600">
                    ${negotiationPlan?.negotiationStrategy.walkAwayPoint.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Talking Points */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Key Talking Points</h3>
              <ul className="space-y-2">
                {negotiationPlan?.talkingPoints.map((point: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Scripts */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Negotiation Scripts</h3>
              <div className="space-y-4">
                {Object.entries(negotiationPlan?.scripts || {}).map(([key, value]) => (
                  <div key={key} className="bg-white border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <p className="text-gray-700 italic">"{value as string}"</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Red Flags */}
            <div className="bg-red-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">What to Avoid</h3>
              <ul className="space-y-2">
                {negotiationPlan?.redFlags.map((flag: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">✗</span>
                    <span className="text-gray-700">{flag}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Alternatives */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Alternative Benefits to Consider</h3>
              <div className="grid md:grid-cols-2 gap-2">
                {negotiationPlan?.alternatives.map((alt: string, index: number) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 text-center">
                    <span className="text-gray-700">{alt}</span>
                  </div>
                ))}
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
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(negotiationPlan, null, 2));
                  addToast({
                    type: 'success',
                    title: 'Copied to Clipboard',
                    description: 'Your negotiation plan has been copied to your clipboard.'
                  });
                }}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-medium"
              >
                Copy Plan
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
            Salary Negotiation Tool
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto mb-6 px-4">
            Master salary negotiations with AI-powered guidance. Get market research, 
            negotiation scripts, and industry-specific strategies to maximize your earning potential.
          </p>
          
          {/* Under Progress Banner */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl">🚧</span>
              </div>
              <h2 className="text-2xl font-bold text-yellow-800">Under Progress</h2>
            </div>
            <p className="text-yellow-700 text-lg mb-4 text-center">
              We're currently enhancing this tool with more advanced features and better AI integration.
            </p>
            <p className="text-yellow-600 text-center">
              Check back soon for the complete salary negotiation experience!
            </p>
          </div>
          
          {/* API Key Manager */}
          <div className="max-w-2xl mx-auto px-4">
            <ApiKeyManager />
          </div>
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
                  <div className={`w-16 h-1 mx-2 ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <h3 className="font-medium text-gray-900">{steps[currentStep].title}</h3>
            <p className="text-sm text-gray-600">{steps[currentStep].description}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {renderStepContent()}
        </div>

        {/* Features */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Market Research</h3>
            <p className="text-gray-600">Get real-time salary data and market benchmarks</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Negotiation Scripts</h3>
            <p className="text-gray-600">Ready-to-use scripts for every negotiation scenario</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Strategic Planning</h3>
            <p className="text-gray-600">Personalized strategies based on your specific situation</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryNegotiation;
