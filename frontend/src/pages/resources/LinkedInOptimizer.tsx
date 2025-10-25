import React, { useState } from 'react';
import { useSEO } from '../../utils/seo';
import { useToast } from '../../hooks/use-toast';
import ApiKeyManager from '../../components/ApiKeyManager';

interface LinkedInProfile {
  headline: string;
  summary: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    description: string;
    duration?: string;
  }>;
  education: Array<{
    degree: string;
    school: string;
    year: string;
  }>;
  profileUrl: string;
  location?: string;
  industry?: string;
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
    // Basic LinkedIn URL validation (supports country-specific domains like ae.linkedin.com)
    const linkedinRegex = /^https?:\/\/(www\.)?([a-z]{2}\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
    return linkedinRegex.test(url);
  };

  const extractProfileData = async (url: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001/api'}/linkedin/extract-profile`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ url })
      });

      const result = await response.json();

      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to extract profile data');
      }
    } catch (error) {
      console.error('Profile extraction error:', error);
      throw new Error('Failed to extract data from LinkedIn URL');
    }
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
        
        try {
          const extractedData = await extractProfileData(profile.profileUrl) as any;
          profileData = { ...profileData, ...extractedData };
          setProfile(profileData);
        } catch (error) {
          addToast({
            type: 'warning',
            title: 'URL Extraction Failed',
            description: 'Could not extract data from LinkedIn URL. Please fill in the form manually.'
          });
        }
      }
      
      // Check if we have enough data to analyze
      if (!profileData.headline && !profileData.summary && (!profileData.skills || profileData.skills.length === 0)) {
        addToast({
          type: 'error',
          title: 'Insufficient Data',
          description: 'Please provide at least a headline, summary, or skills to analyze your LinkedIn profile.'
        });
        setIsAnalyzing(false);
        return;
      }
      
      // Call real AI analysis
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001/api'}/career-tools/linkedin/analyze`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          profile_data: {
            headline: profileData.headline,
            summary: profileData.summary,
            skills: profileData.skills,
            experience: profileData.experience,
            education: profileData.education,
            location: profileData.location,
            industry: profileData.industry
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        setOptimizations(result.data);
        setCurrentStep(6); // Changed to step 6 to show extracted data first
        addToast({
          type: 'success',
          title: 'Analysis Complete',
          description: 'Your LinkedIn profile has been analyzed using AI. Check the recommendations below.'
        });
      } else {
        throw new Error(result.message || 'Analysis failed');
      }
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
              {/* LinkedIn Profile URL field hidden as requested - users will fill manually */}

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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Extracted Profile Data</h2>
              <p className="text-gray-600 mb-6">Here's the data we extracted from your LinkedIn profile:</p>
            </div>

            <div className="bg-white rounded-lg border p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional Headline</h3>
                <p className="text-gray-700">{profile.headline}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{profile.summary}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {profile.experience && profile.experience.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Experience</h3>
                  <div className="space-y-3">
                    {profile.experience && profile.experience.length > 0 ? (
                      profile.experience.map((exp, index) => (
                        <div key={index} className="border-l-4 border-blue-500 pl-4">
                          <h4 className="font-medium text-gray-900">{exp?.title || 'Position'}</h4>
                          <p className="text-gray-600">{exp?.company || 'Company'}</p>
                          {exp?.duration && <p className="text-sm text-gray-500">{exp.duration}</p>}
                          <p className="text-sm text-gray-700 mt-1">{exp?.description || 'No description available'}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 italic">No experience data available</p>
                    )}
                  </div>
                </div>
              )}

              {profile.education && profile.education.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Education</h3>
                  <div className="space-y-2">
                    {profile.education && profile.education.length > 0 ? (
                      profile.education.map((edu, index) => (
                        <div key={index} className="border-l-4 border-green-500 pl-4">
                          <h4 className="font-medium text-gray-900">{edu?.degree || 'Degree'}</h4>
                          <p className="text-gray-600">{edu?.school || 'School'}</p>
                          <p className="text-sm text-gray-500">{edu?.year || 'Year'}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 italic">No education data available</p>
                    )}
                  </div>
                </div>
              )}

              {(profile.location || profile.industry) && (
                <div className="grid md:grid-cols-2 gap-4">
                  {profile.location && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Location</h3>
                      <p className="text-gray-700">{profile.location}</p>
                    </div>
                  )}
                  {profile.industry && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Industry</h3>
                      <p className="text-gray-700">{profile.industry}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(0)}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 font-medium"
              >
                Start Over
              </button>
              <button
                onClick={() => setCurrentStep(6)}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-medium"
              >
                View Analysis Results
              </button>
            </div>
          </div>
        );

      case 6:
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
              {/* Actionable Solutions Section */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">🎯 Actionable Solutions</h3>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Wins You Can Implement Today</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                        <div>
                          <h5 className="font-medium text-gray-900">Optimize Your Headline</h5>
                          <p className="text-sm text-gray-600">Add industry keywords and your unique value proposition</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                        <div>
                          <h5 className="font-medium text-gray-900">Enhance Your Summary</h5>
                          <p className="text-sm text-gray-600">Include quantifiable achievements and specific skills</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                        <div>
                          <h5 className="font-medium text-gray-900">Add Missing Skills</h5>
                          <p className="text-sm text-gray-600">Include trending keywords relevant to your industry</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                        <div>
                          <h5 className="font-medium text-gray-900">Use Industry Keywords</h5>
                          <p className="text-sm text-gray-600">Incorporate trending terms to improve search visibility</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">5</div>
                        <div>
                          <h5 className="font-medium text-gray-900">Quantify Achievements</h5>
                          <p className="text-sm text-gray-600">Add specific numbers and metrics to your experience</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">6</div>
                        <div>
                          <h5 className="font-medium text-gray-900">Update Regularly</h5>
                          <p className="text-sm text-gray-600">Keep your profile fresh with recent accomplishments</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">📋 Detailed Recommendations</h3>
                <div className="space-y-4">
                  {optimizations?.recommendations && optimizations.recommendations.length > 0 ? (
                    optimizations.recommendations.map((rec: any, index: number) => (
                      <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{rec?.category || 'General'}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            rec?.priority === 'High' ? 'bg-red-100 text-red-800' :
                            rec?.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {rec?.priority || 'Medium'} Priority
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">{rec?.suggestion || 'No suggestion available'}</p>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          <strong>Example:</strong> {rec?.example || 'No example available'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No recommendations available</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Keyword Suggestions</h3>
                <div className="flex flex-wrap gap-2">
                  {optimizations?.keywordSuggestions && optimizations.keywordSuggestions.length > 0 ? (
                    optimizations.keywordSuggestions.map((keyword: string, index: number) => (
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
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No keyword suggestions available</p>
                  )}
                </div>
              </div>

              {/* Step-by-Step Action Plan */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">🚀 Step-by-Step Action Plan</h3>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900">Your Personalized Improvement Roadmap</h4>
                    <p className="text-sm text-gray-600 mt-1">Follow these steps to optimize your LinkedIn profile for maximum impact</p>
                  </div>
                  <div className="p-6">
                    <div className="space-y-6">
                      {/* Step 1: Headline Optimization */}
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900 mb-2">Optimize Your Headline (Priority: High)</h5>
                          <p className="text-gray-600 mb-3">Your headline is the first thing people see. Make it compelling and keyword-rich.</p>
                          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                            <p className="text-sm font-medium text-red-800 mb-2">Current Score: {optimizations?.headlineScore}%</p>
                            <p className="text-sm text-red-700 mb-3">Target: 85%+ for maximum visibility</p>
                            <div className="space-y-2">
                              <p className="text-sm text-gray-700"><strong>Action Items:</strong></p>
                              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                                <li>• Include your primary role and industry</li>
                                <li>• Add 2-3 relevant keywords</li>
                                <li>• Mention your unique value proposition</li>
                                <li>• Keep it under 120 characters</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Step 2: Summary Enhancement */}
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900 mb-2">Enhance Your Summary (Priority: High)</h5>
                          <p className="text-gray-600 mb-3">Your summary should tell your professional story and highlight key achievements.</p>
                          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <p className="text-sm font-medium text-yellow-800 mb-2">Current Score: {optimizations?.summaryScore}%</p>
                            <p className="text-sm text-yellow-700 mb-3">Target: 80%+ for better engagement</p>
                            <div className="space-y-2">
                              <p className="text-sm text-gray-700"><strong>Action Items:</strong></p>
                              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                                <li>• Start with a compelling opening statement</li>
                                <li>• Include quantifiable achievements (numbers, percentages)</li>
                                <li>• Mention specific skills and technologies</li>
                                <li>• Add a call-to-action at the end</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Step 3: Skills Optimization */}
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900 mb-2">Optimize Your Skills (Priority: Medium)</h5>
                          <p className="text-gray-600 mb-3">Skills help you appear in relevant searches and showcase your expertise.</p>
                          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <p className="text-sm font-medium text-green-800 mb-2">Current Score: {optimizations?.skillsScore}%</p>
                            <p className="text-sm text-green-700 mb-3">Target: 90%+ for maximum searchability</p>
                            <div className="space-y-2">
                              <p className="text-sm text-gray-700"><strong>Action Items:</strong></p>
                              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                                <li>• Add 10-15 relevant skills (not more than 20)</li>
                                <li>• Include both technical and soft skills</li>
                                <li>• Use trending keywords in your industry</li>
                                <li>• Get endorsements from colleagues</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Step 4: Profile Completion */}
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900 mb-2">Complete Your Profile (Priority: Medium)</h5>
                          <p className="text-gray-600 mb-3">A complete profile appears more professional and trustworthy to recruiters.</p>
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <div className="space-y-2">
                              <p className="text-sm text-gray-700"><strong>Action Items:</strong></p>
                              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                                <li>• Add a professional profile photo</li>
                                <li>• Include a background banner image</li>
                                <li>• Fill in all experience sections with details</li>
                                <li>• Add education and certifications</li>
                                <li>• Write detailed job descriptions</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Profile Strengths</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900 mb-2">What's Working Well</h4>
                    <ul className="space-y-1">
                      {optimizations?.profileStrengths && optimizations.profileStrengths.length > 0 ? (
                        optimizations.profileStrengths.map((strength: string, index: number) => (
                          <li key={index} className="text-sm text-green-800 flex items-center">
                            <span className="mr-2">✓</span>
                            {strength}
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-gray-500 italic">No strengths identified</li>
                      )}
                    </ul>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-yellow-900 mb-2">Areas for Improvement</h4>
                    <ul className="space-y-1">
                      {optimizations?.areasForImprovement && optimizations.areasForImprovement.length > 0 ? (
                        optimizations.areasForImprovement.map((area: string, index: number) => (
                          <li key={index} className="text-sm text-yellow-800 flex items-center">
                            <span className="mr-2">!</span>
                            {area}
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-gray-500 italic">No areas for improvement identified</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Industry Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {optimizations?.industryKeywords && optimizations.industryKeywords.length > 0 ? (
                    optimizations.industryKeywords.map((keyword: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                      >
                        {keyword}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No industry keywords available</p>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  These keywords are trending in your industry and can help improve your profile visibility.
                </p>
              </div>
            </div>

            {/* Next Steps Section */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">🎯 Your Next Steps</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Immediate Actions (Today)</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Update your headline with recommended keywords</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Add quantifiable achievements to your summary</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Include 3-5 trending skills from our suggestions</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">This Week</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Complete all profile sections (experience, education)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Add a professional profile photo and banner</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Request endorsements from colleagues</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                <h5 className="font-semibold text-gray-900 mb-2">💡 Pro Tip</h5>
                <p className="text-sm text-gray-600">
                  LinkedIn profiles with complete information get 40x more opportunities. Focus on completing 
                  your profile first, then optimize for keywords. Update your profile regularly to maintain 
                  visibility in search results.
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
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            LinkedIn Profile Optimizer
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto mb-6 px-4">
            Boost your LinkedIn visibility with AI-powered analysis and optimization recommendations.
            Get more profile views, connection requests, and job opportunities.
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
