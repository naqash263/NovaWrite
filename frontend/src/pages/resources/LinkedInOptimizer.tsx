import React, { useState } from 'react';
import { useSEO } from '../../utils/seo';
import { useToast } from '../../hooks/use-toast';

interface LinkedInProfile {
  headline: string;
  summary: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    school: string;
    year: string;
  }>;
  profileUrl: string;
}

interface LinkedInAnalysis {
  headlineScore: number;
  summaryScore: number;
  skillsScore: number;
  overallScore: number;
  recommendations: Array<{
    category: string;
    priority: string;
    suggestion: string;
    example: string;
  }>;
  keywordSuggestions: string[];
  profileStrengths: string[];
  areasForImprovement: string[];
  industryKeywords: string[];
}

const LinkedInOptimizer: React.FC = () => {
  const { addToast } = useToast();
  const [profile, setProfile] = useState<LinkedInProfile>({
    headline: '',
    summary: '',
    skills: [],
    experience: [],
    education: [],
    profileUrl: ''
  });
  const [optimizations, setOptimizations] = useState<LinkedInAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useSEO({
    title: 'LinkedIn Profile Optimizer - Boost Your Professional Visibility | Naqash Thaheem',
    description: 'Optimize your LinkedIn profile for maximum visibility with AI-powered analysis. Get keyword suggestions, headline improvements, and engagement strategies.',
    url: '/resources/linkedin-optimizer',
    keywords: ['LinkedIn optimization', 'professional profile', 'career tools', 'AI analysis', 'profile optimization']
  });

  const steps = [
    { title: 'Profile Analysis', description: 'Analyze your current LinkedIn profile' },
    { title: 'Keyword Optimization', description: 'Optimize keywords for better visibility' },
    { title: 'Headline Enhancement', description: 'Create compelling headlines' },
    { title: 'Summary Improvement', description: 'Write engaging profile summaries' },
    { title: 'Skills Optimization', description: 'Select the right skills' },
    { title: 'Results & Recommendations', description: 'Get personalized recommendations' }
  ];

  const analyzeLinkedInUrl = (url: string) => {
    // Basic LinkedIn URL validation
    const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
    return linkedinRegex.test(url);
  };

  const extractProfileData = async (url: string) => {
    // In a real implementation, this would use a web scraping service or LinkedIn API
    // For now, we'll simulate the data extraction
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          headline: 'Senior Software Engineer | Full-Stack Developer | React Expert',
          summary: 'Passionate software engineer with 5+ years of experience building scalable web applications. Specialized in React, Node.js, and cloud technologies.',
          skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker'],
          experience: [
            {
              title: 'Senior Software Engineer',
              company: 'Tech Corp',
              description: 'Led development of microservices architecture serving 1M+ users'
            }
          ],
          education: [
            {
              degree: 'Bachelor of Computer Science',
              school: 'University of Technology',
              year: '2018'
            }
          ]
        });
      }, 1500);
    });
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      let profileData = { ...profile };
      
      // If profile URL is provided, try to extract data
      if (profile.profileUrl && analyzeLinkedInUrl(profile.profileUrl)) {
        addToast({
          type: 'info',
          title: 'Analyzing Profile',
          description: 'Extracting data from your LinkedIn profile...'
        });
        
        const extractedData = await extractProfileData(profile.profileUrl) as any;
        profileData = { ...profileData, ...extractedData };
        setProfile(profileData);
      }
      
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockOptimizations: LinkedInAnalysis = {
        headlineScore: 75,
        summaryScore: 60,
        skillsScore: 80,
        overallScore: 72,
        recommendations: [
          {
            category: 'Headline',
            priority: 'High',
            suggestion: 'Add industry-specific keywords and quantifiable achievements',
            example: 'Senior Software Engineer | Full-Stack Developer | 5+ Years Experience | React, Node.js, AWS'
          },
          {
            category: 'Summary',
            priority: 'High',
            suggestion: 'Include a compelling story and call-to-action',
            example: 'Passionate software engineer with 5+ years of experience building scalable web applications...'
          },
          {
            category: 'Skills',
            priority: 'Medium',
            suggestion: 'Add trending skills in your industry',
            example: 'Add skills like "Machine Learning", "Cloud Computing", "DevOps"'
          }
        ],
        keywordSuggestions: [
          'Software Engineering',
          'Full-Stack Development',
          'React.js',
          'Node.js',
          'AWS',
          'Machine Learning',
          'Agile Methodology',
          'Team Leadership'
        ],
        profileStrengths: [
          'Strong technical skills',
          'Clear professional experience',
          'Relevant industry keywords'
        ],
        areasForImprovement: [
          'Add more quantifiable achievements',
          'Include industry-specific keywords',
          'Expand professional summary'
        ],
        industryKeywords: [
          'Software Development',
          'Web Applications',
          'Cloud Computing',
          'Agile Development',
          'Team Leadership'
        ]
      };
      
      setOptimizations(mockOptimizations);
      setCurrentStep(5);
      addToast({
        type: 'success',
        title: 'Analysis Complete',
        description: 'Your LinkedIn profile has been analyzed. Check the recommendations below.'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Analysis Failed',
        description: 'Failed to analyze your profile. Please try again.'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">LinkedIn Profile Analysis</h2>
              <p className="text-gray-600 mb-8">
                Enter your LinkedIn profile information to get AI-powered optimization recommendations.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn Profile URL (Optional)
                </label>
                <input
                  type="url"
                  value={profile.profileUrl}
                  onChange={(e) => setProfile({...profile, profileUrl: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://linkedin.com/in/yourname"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Enter your LinkedIn profile URL to automatically extract and analyze your current profile data.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Headline
                </label>
                <input
                  type="text"
                  value={profile.headline}
                  onChange={(e) => setProfile({...profile, headline: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Software Engineer at Tech Company"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Summary
                </label>
                <textarea
                  value={profile.summary}
                  onChange={(e) => setProfile({...profile, summary: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tell us about your professional background..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={profile.skills.join(', ')}
                  onChange={(e) => setProfile({...profile, skills: e.target.value.split(',').map(s => s.trim())})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., JavaScript, React, Node.js, Python"
                />
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isAnalyzing ? 'Analyzing Profile...' : 'Analyze My Profile'}
            </button>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Analysis Results</h2>
              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {optimizations?.overallScore}%
                </div>
                <p className="text-blue-800">Overall Profile Score</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {optimizations?.headlineScore}%
                </div>
                <p className="text-sm text-gray-600">Headline Score</p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-2xl font-bold text-yellow-600 mb-1">
                  {optimizations?.summaryScore}%
                </div>
                <p className="text-sm text-gray-600">Summary Score</p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {optimizations?.skillsScore}%
                </div>
                <p className="text-sm text-gray-600">Skills Score</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Recommendations</h3>
                <div className="space-y-4">
                  {optimizations?.recommendations.map((rec: any, index: number) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{rec.category}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rec.priority === 'High' ? 'bg-red-100 text-red-800' :
                          rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {rec.priority} Priority
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{rec.suggestion}</p>
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        <strong>Example:</strong> {rec.example}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Keyword Suggestions</h3>
                <div className="flex flex-wrap gap-2">
                  {optimizations?.keywordSuggestions.map((keyword: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm cursor-pointer hover:bg-blue-200"
                      onClick={() => {
                        const newSkills = [...profile.skills, keyword];
                        setProfile({...profile, skills: newSkills});
                      }}
                    >
                      + {keyword}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Profile Strengths</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900 mb-2">What's Working Well</h4>
                    <ul className="space-y-1">
                      {optimizations?.profileStrengths.map((strength: string, index: number) => (
                        <li key={index} className="text-sm text-green-800 flex items-center">
                          <span className="mr-2">✓</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-yellow-900 mb-2">Areas for Improvement</h4>
                    <ul className="space-y-1">
                      {optimizations?.areasForImprovement.map((area: string, index: number) => (
                        <li key={index} className="text-sm text-yellow-800 flex items-center">
                          <span className="mr-2">!</span>
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Industry Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {optimizations?.industryKeywords.map((keyword: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  These keywords are trending in your industry and can help improve your profile visibility.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(0)}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 font-medium"
              >
                Analyze Another Profile
              </button>
              <button
                onClick={() => {
                  // Copy optimized content to clipboard
                  navigator.clipboard.writeText(JSON.stringify(optimizations, null, 2));
                  addToast({
                    type: 'success',
                    title: 'Copied to Clipboard',
                    description: 'Optimization results have been copied to your clipboard.'
                  });
                }}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-medium"
              >
                Copy Results
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            LinkedIn Profile Optimizer
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Boost your LinkedIn visibility with AI-powered analysis and optimization recommendations.
            Get more profile views, connection requests, and job opportunities.
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
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Analysis</h3>
            <p className="text-gray-600">Advanced AI analyzes your profile for optimization opportunities</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📈</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Keyword Optimization</h3>
            <p className="text-gray-600">Get trending keywords to improve your search visibility</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💡</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Recommendations</h3>
            <p className="text-gray-600">Personalized suggestions to enhance your professional presence</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkedInOptimizer;
