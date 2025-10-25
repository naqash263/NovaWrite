import React, { useState } from 'react';
import { useSEO } from '../../utils/seo';
import { useToast } from '../../hooks/use-toast';
import ApiKeyManager from '../../components/ApiKeyManager';

interface Skill {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  category: string;
  importance: 'Low' | 'Medium' | 'High';
}

interface AssessmentData {
  skills: Skill[];
  experience: string;
  industry: string;
  goals: string;
}

const SkillsAssessment: React.FC = () => {
  const { addToast } = useToast();
  const [assessmentData, setAssessmentData] = useState<AssessmentData>({
    skills: [],
    experience: '',
    industry: '',
    goals: ''
  });
  const [assessmentResults, setAssessmentResults] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useSEO({
    title: 'Free Skills Assessment Tool - AI-Powered Skill Analysis',
    description: 'Assess your professional skills with AI-powered analysis. Get personalized skill recommendations, learning paths, and career development insights.',
    url: '/resources/skills-assessment',
    keywords: ['skills assessment', 'career tools', 'skill analysis', 'professional development', 'learning paths', 'AI guidance']
  });

  const skillCategories = [
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

  const steps = [
    { title: 'Your Skills', description: 'Select and rate your professional skills' },
    { title: 'AI Analysis', description: 'Get AI-powered skill analysis and recommendations' },
    { title: 'Results', description: 'View your personalized skill assessment results' },
    { title: 'Learning Plan', description: 'Receive your personalized development plan' },
    { title: 'Recommendations', description: 'Get personalized skill development recommendations' }
  ];

  const addSkill = (skillName: string, category: string) => {
    const existingSkill = assessmentData.skills.find(s => s.name === skillName);
    if (!existingSkill) {
      setAssessmentData({
        ...assessmentData,
        skills: [...assessmentData.skills, {
          name: skillName,
          level: 'Beginner',
          category,
          importance: 'Medium'
        }]
      });
    }
  };

  const updateSkill = (skillName: string, field: keyof Skill, value: any) => {
    setAssessmentData({
      ...assessmentData,
      skills: assessmentData.skills.map(skill =>
        skill.name === skillName ? { ...skill, [field]: value } : skill
      )
    });
  };

  const removeSkill = (skillName: string) => {
    setAssessmentData({
      ...assessmentData,
      skills: assessmentData.skills.filter(skill => skill.name !== skillName)
    });
  };

  const getExperienceYears = (experienceLevel: string): number => {
    switch (experienceLevel) {
      case 'entry': return 1;
      case 'mid': return 4;
      case 'senior': return 8;
      case 'lead': return 12;
      default: return 5;
    }
  };

  const generateAssessment = async () => {
    setIsGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001/api'}/career-tools/skills-assessment/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          technical_skills: assessmentData.skills.filter(s => s.category === 'Technical Skills').map(s => s.name),
          soft_skills: assessmentData.skills.filter(s => s.category === 'Soft Skills').map(s => s.name),
          experience_years: getExperienceYears(assessmentData.experience),
          current_role: 'Software Developer', // Default value since not in interface
          career_goals: 'Professional development and career growth', // Default value since we removed this field
          industry: assessmentData.industry
        })
      });

      const result = await response.json();

      if (result.success) {
        setAssessmentResults(result.data);
        setCurrentStep(3); // Go to results step (step 3)
        addToast({
          type: 'success',
          title: 'Assessment Complete',
          description: 'Your skills assessment has been completed using AI. Check the results below.'
        });
      } else {
        throw new Error(result.message || 'Assessment failed');
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Assessment Failed',
        description: 'Failed to complete assessment. Please try again.'
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Skills</h2>
              <p className="text-gray-600 mb-8">
                Select and rate your professional skills. We'll keep it simple and focused on what matters most.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level *
                </label>
                <select
                  value={assessmentData.experience}
                  onChange={(e) => setAssessmentData({...assessmentData, experience: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select experience level</option>
                  <option value="entry">Entry Level (0-2 years)</option>
                  <option value="mid">Mid Level (3-5 years)</option>
                  <option value="senior">Senior Level (6-10 years)</option>
                  <option value="lead">Lead/Principal (10+ years)</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">This helps us personalize your skill recommendations</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry *
                </label>
                <select
                  value={assessmentData.industry}
                  onChange={(e) => setAssessmentData({...assessmentData, industry: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select industry</option>
                  <option value="technology">Technology & Software</option>
                  <option value="healthcare">Healthcare & Medical</option>
                  <option value="finance">Finance & Banking</option>
                  <option value="education">Education & Training</option>
                  <option value="marketing">Marketing & Advertising</option>
                  <option value="sales">Sales & Business Development</option>
                  <option value="consulting">Consulting & Professional Services</option>
                  <option value="manufacturing">Manufacturing & Production</option>
                  <option value="retail">Retail & E-commerce</option>
                  <option value="hospitality">Hospitality & Tourism</option>
                  <option value="real-estate">Real Estate & Construction</option>
                  <option value="legal">Legal & Compliance</option>
                  <option value="human-resources">Human Resources</option>
                  <option value="operations">Operations & Supply Chain</option>
                  <option value="non-profit">Non-profit & Government</option>
                  <option value="media">Media & Entertainment</option>
                  <option value="transportation">Transportation & Logistics</option>
                  <option value="energy">Energy & Utilities</option>
                  <option value="agriculture">Agriculture & Food</option>
                  <option value="other">Other</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">Industry-specific skills will be prioritized</p>
              </div>
            </div>

            <button
              onClick={() => setCurrentStep(1)}
              disabled={!assessmentData.experience || !assessmentData.industry}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Next: Select Skills
            </button>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Skill Selection</h2>
              <p className="text-gray-600 mb-8">
                Select and rate your skills across different categories.
              </p>
            </div>

            <div className="space-y-6">
              {skillCategories.map((category) => (
                <div key={category.name} className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{category.name}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {category.skills.map((skill) => (
                      <button
                        key={skill}
                        onClick={() => addSkill(skill, category.name)}
                        disabled={assessmentData.skills.some(s => s.name === skill)}
                        className={`p-2 text-sm rounded-md border transition-colors ${
                          assessmentData.skills.some(s => s.name === skill)
                            ? 'bg-blue-100 border-blue-300 text-blue-800 cursor-not-allowed'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
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
                disabled={assessmentData.skills.length === 0}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Next: Rate Skills
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Skill Assessment</h2>
              <p className="text-gray-600 mb-8">
                Rate your proficiency level for each selected skill.
              </p>
            </div>

            <div className="space-y-4">
              {assessmentData.skills.map((skill, index) => (
                <div key={index} className="bg-white border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{skill.name}</h3>
                      <p className="text-sm text-gray-600">{skill.category}</p>
                    </div>
                    <button
                      onClick={() => removeSkill(skill.name)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Proficiency Level
                      </label>
                      <select
                        value={skill.level}
                        onChange={(e) => updateSkill(skill.name, 'level', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Expert">Expert</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Importance to Your Goals
                      </label>
                      <select
                        value={skill.importance}
                        onChange={(e) => updateSkill(skill.name, 'importance', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 font-medium"
              >
                Back
              </button>
              <button
                onClick={generateAssessment}
                disabled={isGenerating}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isGenerating ? 'Analyzing Skills...' : 'Complete Assessment'}
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Assessment Results</h2>
              <p className="text-gray-600">
                Here's your comprehensive skills analysis and recommendations.
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {assessmentResults?.overallScore}%
                </div>
                <p className="text-blue-800">Overall Skills Score</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Scores</h3>
                <div className="space-y-3">
                  {Object.entries(assessmentResults?.categoryScores || {}).map(([category, score]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-gray-700">{category}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${score}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{score as number}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Strengths</h3>
                <div className="space-y-3">
                  {assessmentResults?.strengths && assessmentResults.strengths.length > 0 ? (
                    assessmentResults.strengths.slice(0, 3).map((strength: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-gray-900">{strength.skill || strength.name || 'Skill'}</span>
                          <span className="text-sm text-gray-600 ml-2">({strength.level || 'Level'})</span>
                        </div>
                        <span className="text-green-600 font-semibold">{strength.score || strength.percentage || 'N/A'}%</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No strengths identified</p>
                  )}
                </div>
              </div>
            </div>

            {/* Industry Insights */}
            {assessmentResults?.industryInsights && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Industry Insights</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Trending Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {assessmentResults.industryInsights.trendingSkills && assessmentResults.industryInsights.trendingSkills.map((skill: string, index: number) => (
                        <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Emerging Roles</h4>
                    <div className="space-y-2">
                      {assessmentResults.industryInsights.emergingRoles && assessmentResults.industryInsights.emergingRoles.map((role: string, index: number) => (
                        <div key={index} className="text-sm text-gray-700">
                          • {role}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {assessmentResults.industryInsights.salaryGrowth && (
                  <div className="mt-4 p-3 bg-white rounded-lg border border-purple-200">
                    <p className="text-sm text-gray-700">
                      <strong>Salary Growth:</strong> {assessmentResults.industryInsights.salaryGrowth}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Career Alignment */}
            {assessmentResults?.careerAlignment && (
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Career Alignment</h3>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700">Overall Career Match</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {assessmentResults.careerAlignment.overallMatch || assessmentResults.careerAlignment.match || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full"
                      style={{ width: `${assessmentResults.careerAlignment.overallMatch || assessmentResults.careerAlignment.match || 0}%` }}
                    ></div>
                  </div>
                </div>

                {assessmentResults.careerAlignment.recommendedRoles && assessmentResults.careerAlignment.recommendedRoles.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Recommended Roles</h4>
                    {assessmentResults.careerAlignment.recommendedRoles.map((role: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900">{role.title || 'Role'}</h5>
                          <span className="text-green-600 font-semibold">{role.match || 0}% Match</span>
                        </div>
                        {role.salaryRange && (
                          <p className="text-sm text-gray-600 mb-2">Salary: {role.salaryRange}</p>
                        )}
                        {role.requiredSkills && role.requiredSkills.length > 0 && (
                          <div className="mb-2">
                            <p className="text-sm font-medium text-gray-700 mb-1">Required Skills:</p>
                            <div className="flex flex-wrap gap-1">
                              {role.requiredSkills.map((skill: string, skillIndex: number) => (
                                <span key={skillIndex} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {role.nextSteps && role.nextSteps.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Next Steps:</p>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {role.nextSteps.map((step: string, stepIndex: number) => (
                                <li key={stepIndex} className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-1">•</span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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
                View Recommendations
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Skill Recommendations</h2>
              <p className="text-gray-600">
                Get personalized recommendations for skill development and career growth.
              </p>
            </div>

            <div className="space-y-6">
              {assessmentResults?.recommendations && assessmentResults.recommendations.length > 0 ? (
                assessmentResults.recommendations.map((rec: any, index: number) => (
                  <div key={index} className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{rec.category || 'Recommendations'}</h3>
                    <div className="space-y-4">
                      {rec.skills && rec.skills.length > 0 ? (
                        rec.skills.map((skill: any, skillIndex: number) => (
                          <div key={skillIndex} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900">{skill.name || skill.skill || 'Skill'}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                skill.priority === 'High' ? 'bg-red-100 text-red-800' :
                                skill.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {skill.priority || 'Medium'} Priority
                              </span>
                            </div>
                            {(skill.currentLevel || skill.targetLevel) && (
                              <div className="text-sm text-gray-600 mb-2">
                                {skill.currentLevel || 'Current'} → {skill.targetLevel || 'Target'}
                              </div>
                            )}
                            {skill.action && (
                              <div className="text-sm text-gray-700 mb-2">
                                <strong>Action:</strong> {skill.action}
                              </div>
                            )}
                            {skill.timeline && (
                              <div className="text-sm text-gray-600 mb-2">
                                <strong>Timeline:</strong> {skill.timeline}
                              </div>
                            )}
                            {skill.resources && skill.resources.length > 0 && (
                              <div>
                                <h5 className="font-medium text-gray-900 mb-1">Resources:</h5>
                                <ul className="text-sm text-gray-600 space-y-1">
                                  {skill.resources.map((resource: string, resIndex: number) => (
                                    <li key={resIndex} className="flex items-start gap-2">
                                      <span className="text-blue-500 mt-1">•</span>
                                      <span>{resource}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 italic">No specific skills recommended for this category</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-gray-500 italic">No recommendations available at the moment. Please try again later.</p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(3)}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 font-medium"
              >
                Back to Results
              </button>
              <button
                onClick={() => setCurrentStep(5)}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-medium"
              >
                Learning Path
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Learning Path</h2>
              <p className="text-gray-600">
                Your personalized learning journey for skill development and career growth.
              </p>
            </div>

            <div className="space-y-6">
              {assessmentResults?.learningPath && assessmentResults.learningPath.length > 0 ? (
                assessmentResults.learningPath.map((phase: any, index: number) => (
                  <div key={index} className="bg-white border rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{phase.title || phase.phase || 'Learning Phase'}</h3>
                        {phase.timeline && (
                          <p className="text-sm text-gray-500">{phase.timeline}</p>
                        )}
                      </div>
                    </div>
                    {phase.focus && (
                      <p className="text-gray-600 mb-4">{phase.focus}</p>
                    )}
                    
                    {phase.skills && phase.skills.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Skills to Develop:</h4>
                        <div className="flex flex-wrap gap-2">
                          {phase.skills.map((skill: string, skillIndex: number) => (
                            <span key={skillIndex} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {phase.activities && phase.activities.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Activities:</h4>
                        <ul className="space-y-1">
                          {phase.activities.map((activity: string, activityIndex: number) => (
                            <li key={activityIndex} className="flex items-start gap-2 text-sm text-gray-600">
                              <span className="text-blue-500 mt-1">•</span>
                              <span>{activity}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {phase.resources && phase.resources.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Resources:</h4>
                        <ul className="space-y-1">
                          {phase.resources.map((resource: string, resourceIndex: number) => (
                            <li key={resourceIndex} className="flex items-start gap-2 text-sm text-gray-600">
                              <span className="text-green-500 mt-1">•</span>
                              <span>{resource}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-gray-500 italic">No learning path available at the moment. Please try again later.</p>
                </div>
              )}
            </div>

            {assessmentResults?.careerAlignment && (
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Career Alignment Summary</h3>
                <div className="space-y-4">
                  {assessmentResults.careerAlignment.recommendedRoles && assessmentResults.careerAlignment.recommendedRoles.length > 0 ? (
                    assessmentResults.careerAlignment.recommendedRoles.map((role: any, index: number) => (
                      <div key={index} className="bg-white rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{role.title || 'Role'}</h4>
                          <span className="text-green-600 font-semibold">{role.match || 0}% Match</span>
                        </div>
                        {role.salaryRange && (
                          <p className="text-sm text-gray-600 mb-3">Salary: {role.salaryRange}</p>
                        )}
                        <div className="grid md:grid-cols-2 gap-4">
                          {role.requiredSkills && role.requiredSkills.length > 0 && (
                            <div>
                              <h5 className="font-medium text-gray-900 mb-1">Required Skills:</h5>
                              <div className="flex flex-wrap gap-1">
                                {role.requiredSkills.map((skill: string, skillIndex: number) => (
                                  <span key={skillIndex} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {role.missingSkills && role.missingSkills.length > 0 && (
                            <div>
                              <h5 className="font-medium text-gray-900 mb-1">Missing Skills:</h5>
                              <div className="flex flex-wrap gap-1">
                                {role.missingSkills.map((skill: string, skillIndex: number) => (
                                  <span key={skillIndex} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        {role.nextSteps && role.nextSteps.length > 0 && (
                          <div className="mt-3">
                            <h5 className="font-medium text-gray-900 mb-1">Next Steps:</h5>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {role.nextSteps.map((step: string, stepIndex: number) => (
                                <li key={stepIndex} className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-1">•</span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="bg-white rounded-lg p-4 text-center">
                      <p className="text-gray-500 italic">No specific role recommendations available</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(4)}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 font-medium"
              >
                Back to Recommendations
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(assessmentResults, null, 2));
                  addToast({
                    type: 'success',
                    title: 'Copied to Clipboard',
                    description: 'Your skills assessment has been copied to your clipboard.'
                  });
                }}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-medium"
              >
                Copy Assessment
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
            Skills Assessment Tool
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto mb-6 px-4">
            Assess your professional skills across ALL industries with AI-powered analysis. Whether you're in healthcare, finance, education, marketing, or any other field - get personalized skill recommendations and career insights. We only ask for essential skill information - no personal details required!
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
            <h3 className="font-medium text-gray-900 text-sm sm:text-base">{steps[currentStep]?.title || 'Skills Assessment'}</h3>
            <p className="text-xs sm:text-sm text-gray-600">{steps[currentStep]?.description || 'Professional skill analysis'}</p>
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
              <span className="text-2xl">🌍</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All Industries</h3>
            <p className="text-gray-600">Works for healthcare, finance, education, marketing, legal, and any career field</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Industry-Specific Insights</h3>
            <p className="text-gray-600">Get recommendations tailored to your specific industry and career level</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📈</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Career Advancement</h3>
            <p className="text-gray-600">Discover trending skills, emerging roles, and salary growth opportunities</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillsAssessment;
