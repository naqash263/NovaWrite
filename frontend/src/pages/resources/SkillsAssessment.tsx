import React, { useState } from 'react';
import { useSEO } from '../../utils/seo';
import { useToast } from '../../hooks/use-toast';

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
    title: 'Skills Assessment Tool - AI-Powered Skill Analysis | Naqash Thaheem',
    description: 'Assess your professional skills with AI-powered analysis. Get personalized skill recommendations, learning paths, and career development insights.',
    url: '/resources/skills-assessment',
    keywords: ['skills assessment', 'career tools', 'skill analysis', 'professional development', 'learning paths', 'AI guidance']
  });

  const skillCategories = [
    {
      name: 'Technical Skills',
      skills: ['JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'Docker', 'Kubernetes', 'Machine Learning', 'Data Analysis', 'SQL']
    },
    {
      name: 'Soft Skills',
      skills: ['Leadership', 'Communication', 'Problem Solving', 'Teamwork', 'Time Management', 'Adaptability', 'Critical Thinking', 'Emotional Intelligence']
    },
    {
      name: 'Business Skills',
      skills: ['Project Management', 'Strategic Planning', 'Financial Analysis', 'Marketing', 'Sales', 'Customer Service', 'Negotiation', 'Business Development']
    },
    {
      name: 'Design Skills',
      skills: ['UI/UX Design', 'Graphic Design', 'Web Design', 'Prototyping', 'User Research', 'Figma', 'Adobe Creative Suite', 'Wireframing']
    }
  ];

  const steps = [
    { title: 'Experience & Goals', description: 'Tell us about your experience and career goals' },
    { title: 'Skill Selection', description: 'Select and rate your skills' },
    { title: 'Skill Assessment', description: 'Complete the skill assessment' },
    { title: 'Analysis', description: 'Get AI-powered skill analysis' },
    { title: 'Recommendations', description: 'Receive personalized recommendations' },
    { title: 'Learning Path', description: 'Get your personalized learning plan' }
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

  const generateAssessment = async () => {
    setIsGenerating(true);
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResults = {
        overallScore: 72,
        categoryScores: {
          'Technical Skills': 85,
          'Soft Skills': 65,
          'Business Skills': 45,
          'Design Skills': 30
        },
        strengths: [
          {
            skill: 'JavaScript',
            level: 'Advanced',
            score: 90,
            description: 'Strong foundation in JavaScript with good understanding of modern frameworks'
          },
          {
            skill: 'Problem Solving',
            level: 'Advanced',
            score: 88,
            description: 'Excellent analytical thinking and problem-solving abilities'
          },
          {
            skill: 'React',
            level: 'Intermediate',
            score: 82,
            description: 'Good understanding of React concepts and component-based architecture'
          }
        ],
        weaknesses: [
          {
            skill: 'Machine Learning',
            level: 'Beginner',
            score: 25,
            description: 'Limited experience with ML algorithms and data science concepts'
          },
          {
            skill: 'Project Management',
            level: 'Beginner',
            score: 30,
            description: 'Need to develop project planning and team coordination skills'
          },
          {
            skill: 'UI/UX Design',
            level: 'Beginner',
            score: 20,
            description: 'Limited experience with design principles and user experience'
          }
        ],
        recommendations: [
          {
            category: 'Immediate Focus (0-3 months)',
            skills: [
              {
                name: 'React',
                currentLevel: 'Intermediate',
                targetLevel: 'Advanced',
                priority: 'High',
                resources: [
                  'Advanced React Patterns course',
                  'Build a complex React application',
                  'Learn React performance optimization'
                ]
              },
              {
                name: 'Project Management',
                currentLevel: 'Beginner',
                targetLevel: 'Intermediate',
                priority: 'High',
                resources: [
                  'PMP certification preparation',
                  'Agile methodology training',
                  'Lead a small project team'
                ]
              }
            ]
          },
          {
            category: 'Medium-term Goals (3-12 months)',
            skills: [
              {
                name: 'Machine Learning',
                currentLevel: 'Beginner',
                targetLevel: 'Intermediate',
                priority: 'Medium',
                resources: [
                  'Machine Learning course (Coursera/edX)',
                  'Python for Data Science',
                  'Work on ML projects'
                ]
              },
              {
                name: 'UI/UX Design',
                currentLevel: 'Beginner',
                targetLevel: 'Intermediate',
                priority: 'Medium',
                resources: [
                  'Design thinking workshop',
                  'Figma mastery course',
                  'User research methodologies'
                ]
              }
            ]
          }
        ],
        careerAlignment: {
          currentRole: 'Software Engineer',
          recommendedRoles: [
            {
              title: 'Senior Software Engineer',
              match: 85,
              requiredSkills: ['JavaScript', 'React', 'Node.js', 'Leadership'],
              missingSkills: ['System Architecture', 'Team Management']
            },
            {
              title: 'Full Stack Developer',
              match: 78,
              requiredSkills: ['JavaScript', 'React', 'Node.js', 'Database Design'],
              missingSkills: ['Backend Architecture', 'DevOps']
            },
            {
              title: 'Tech Lead',
              match: 65,
              requiredSkills: ['Leadership', 'System Architecture', 'Project Management'],
              missingSkills: ['Strategic Planning', 'Team Management']
            }
          ]
        },
        learningPath: {
          phase1: {
            title: 'Foundation Building (Months 1-3)',
            focus: 'Strengthen core technical skills',
            activities: [
              'Complete advanced React course',
              'Build 2-3 portfolio projects',
              'Start project management certification'
            ]
          },
          phase2: {
            title: 'Skill Expansion (Months 4-8)',
            focus: 'Add complementary skills',
            activities: [
              'Learn machine learning basics',
              'Develop UI/UX design skills',
              'Practice leadership scenarios'
            ]
          },
          phase3: {
            title: 'Specialization (Months 9-12)',
            focus: 'Become expert in chosen domain',
            activities: [
              'Choose specialization track',
              'Complete advanced certifications',
              'Build thought leadership'
            ]
          }
        }
      };
      
      setAssessmentResults(mockResults);
      setCurrentStep(3);
      addToast({
        type: 'success',
        title: 'Assessment Complete',
        description: 'Your skills assessment has been completed. Check the results below.'
      });
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Experience & Goals</h2>
              <p className="text-gray-600 mb-8">
                Tell us about your experience and career goals to personalize your assessment.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry
                </label>
                <select
                  value={assessmentData.industry}
                  onChange={(e) => setAssessmentData({...assessmentData, industry: e.target.value})}
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
                  Career Goals
                </label>
                <textarea
                  value={assessmentData.goals}
                  onChange={(e) => setAssessmentData({...assessmentData, goals: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your career goals and aspirations..."
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
                Continue
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
                  {assessmentResults?.strengths.slice(0, 3).map((strength: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-900">{strength.skill}</span>
                        <span className="text-sm text-gray-600 ml-2">({strength.level})</span>
                      </div>
                      <span className="text-green-600 font-semibold">{strength.score}%</span>
                    </div>
                  ))}
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
              {assessmentResults?.recommendations.map((rec: any, index: number) => (
                <div key={index} className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{rec.category}</h3>
                  <div className="space-y-4">
                    {rec.skills.map((skill: any, skillIndex: number) => (
                      <div key={skillIndex} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{skill.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            skill.priority === 'High' ? 'bg-red-100 text-red-800' :
                            skill.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {skill.priority} Priority
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {skill.currentLevel} → {skill.targetLevel}
                        </div>
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
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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
              {Object.entries(assessmentResults?.learningPath || {}).map(([phase, data]: [string, any]) => (
                <div key={phase} className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{data.title}</h3>
                  <p className="text-gray-600 mb-4">{data.focus}</p>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Activities:</h4>
                    <ul className="space-y-1">
                      {data.activities.map((activity: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>{activity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Career Alignment</h3>
              <div className="space-y-4">
                {assessmentResults?.careerAlignment.recommendedRoles.map((role: any, index: number) => (
                  <div key={index} className="bg-white rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{role.title}</h4>
                      <span className="text-green-600 font-semibold">{role.match}% Match</span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
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
                    </div>
                  </div>
                ))}
              </div>
            </div>

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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Skills Assessment Tool
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Assess your professional skills with AI-powered analysis. Get personalized skill recommendations, 
            learning paths, and career development insights.
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
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Skill Analysis</h3>
            <p className="text-gray-600">Get comprehensive analysis of your current skill levels</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Personalized Recommendations</h3>
            <p className="text-gray-600">Receive targeted suggestions for skill development</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📚</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Learning Paths</h3>
            <p className="text-gray-600">Get structured learning plans with timelines and resources</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillsAssessment;
