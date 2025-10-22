import React, { useState } from 'react';
import { useSEO } from '../../utils/seo';
import { useToast } from '../../hooks/use-toast';

interface InterviewData {
  jobTitle: string;
  company: string;
  industry: string;
  experience: string;
  interviewType: string;
  skills: string[];
}

const InterviewPrep: React.FC = () => {
  const { addToast } = useToast();
  const [interviewData, setInterviewData] = useState<InterviewData>({
    jobTitle: '',
    company: '',
    industry: '',
    experience: '',
    interviewType: '',
    skills: []
  });
  const [prepPlan, setPrepPlan] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);

  useSEO({
    title: 'Interview Preparation Tool - AI-Powered Practice & Guidance | Naqash Thaheem',
    description: 'Ace your next interview with AI-powered preparation. Get practice questions, STAR method guidance, company research, and personalized feedback.',
    url: '/resources/interview-prep',
    keywords: ['interview preparation', 'practice questions', 'STAR method', 'career tools', 'AI guidance', 'job interview']
  });

  const steps = [
    { title: 'Job Details', description: 'Tell us about the position you\'re interviewing for' },
    { title: 'Interview Type', description: 'Select the type of interview you\'re preparing for' },
    { title: 'Skills & Experience', description: 'Highlight your relevant skills and experience' },
    { title: 'Practice Questions', description: 'Get personalized practice questions' },
    { title: 'STAR Method', description: 'Learn to structure your answers effectively' },
    { title: 'Company Research', description: 'Get company-specific insights and tips' }
  ];

  const generatePrepPlan = async () => {
    setIsGenerating(true);
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockPlan = {
        practiceQuestions: [
          {
            category: 'Behavioral',
            question: 'Tell me about a time when you had to work with a difficult team member.',
            difficulty: 'Medium',
            tips: 'Use the STAR method. Focus on how you resolved the conflict professionally.',
            sampleAnswer: 'Situation: I was working on a project with a colleague who had different working styles...'
          },
          {
            category: 'Technical',
            question: 'Explain how you would optimize a slow-performing database query.',
            difficulty: 'Hard',
            tips: 'Start with identifying bottlenecks, then discuss indexing, query optimization, and monitoring.',
            sampleAnswer: 'First, I would analyze the query execution plan to identify bottlenecks...'
          },
          {
            category: 'Situational',
            question: 'How would you handle a situation where you disagree with your manager\'s decision?',
            difficulty: 'Medium',
            tips: 'Show respect for authority while demonstrating your analytical thinking.',
            sampleAnswer: 'I would first seek to understand the reasoning behind the decision...'
          }
        ],
        starMethod: {
          situation: 'Set the context and background of your story',
          task: 'Describe your specific responsibility or challenge',
          action: 'Explain the steps you took to address the situation',
          result: 'Share the outcomes and what you learned'
        },
        companyInsights: {
          culture: 'Innovation-focused, collaborative environment with emphasis on work-life balance',
          values: ['Integrity', 'Innovation', 'Customer Focus', 'Teamwork'],
          recentNews: 'Recently raised $50M in Series B funding, expanding to European markets',
          interviewTips: [
            'Emphasize your experience with agile methodologies',
            'Prepare examples of successful cross-functional collaboration',
            'Research their recent product launches and be ready to discuss'
          ]
        },
        commonMistakes: [
          'Not preparing specific examples for behavioral questions',
          'Speaking negatively about previous employers',
          'Not asking thoughtful questions about the role',
          'Being too vague in technical explanations'
        ],
        successTips: [
          'Practice your elevator pitch',
          'Prepare 3-5 thoughtful questions about the role',
          'Research the interviewer on LinkedIn',
          'Prepare examples that demonstrate growth and learning'
        ]
      };
      
      setPrepPlan(mockPlan);
      setCurrentStep(3);
      addToast({
        type: 'success',
        title: 'Prep Plan Ready',
        description: 'Your personalized interview preparation plan has been generated.'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Generation Failed',
        description: 'Failed to generate prep plan. Please try again.'
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Details</h2>
              <p className="text-gray-600 mb-8">
                Tell us about the position you're interviewing for to get personalized preparation.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  value={interviewData.jobTitle}
                  onChange={(e) => setInterviewData({...interviewData, jobTitle: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={interviewData.company}
                  onChange={(e) => setInterviewData({...interviewData, company: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., TechCorp Inc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry
                </label>
                <select
                  value={interviewData.industry}
                  onChange={(e) => setInterviewData({...interviewData, industry: e.target.value})}
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Interview Type</h2>
              <p className="text-gray-600 mb-8">
                What type of interview are you preparing for?
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                { value: 'phone', label: 'Phone Interview', icon: '📞' },
                { value: 'video', label: 'Video Interview', icon: '💻' },
                { value: 'in-person', label: 'In-Person Interview', icon: '🤝' },
                { value: 'panel', label: 'Panel Interview', icon: '👥' },
                { value: 'technical', label: 'Technical Interview', icon: '💻' },
                { value: 'case-study', label: 'Case Study Interview', icon: '📊' }
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => setInterviewData({...interviewData, interviewType: type.value})}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    interviewData.interviewType === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{type.icon}</span>
                    <span className="font-medium">{type.label}</span>
                  </div>
                </button>
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
                disabled={!interviewData.interviewType}
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Skills & Experience</h2>
              <p className="text-gray-600 mb-8">
                Highlight your relevant skills and experience level.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience
                </label>
                <select
                  value={interviewData.experience}
                  onChange={(e) => setInterviewData({...interviewData, experience: e.target.value})}
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
                  Relevant Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={interviewData.skills.join(', ')}
                  onChange={(e) => setInterviewData({...interviewData, skills: e.target.value.split(',').map(s => s.trim())})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., JavaScript, React, Node.js, Python, AWS"
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
                onClick={generatePrepPlan}
                disabled={isGenerating}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isGenerating ? 'Generating Plan...' : 'Generate Prep Plan'}
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Practice Questions</h2>
              <p className="text-gray-600">
                Here are personalized practice questions based on your interview details.
              </p>
            </div>

            <div className="space-y-4">
              {prepPlan?.practiceQuestions.map((question: any, index: number) => (
                <div key={index} className="bg-white border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{question.question}</h3>
                      <div className="flex items-center gap-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          question.category === 'Technical' ? 'bg-blue-100 text-blue-800' :
                          question.category === 'Behavioral' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {question.category}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          question.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                          question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {question.difficulty}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedQuestion(question)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Answer
                    </button>
                  </div>
                  <p className="text-gray-600 text-sm">{question.tips}</p>
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
                onClick={() => setCurrentStep(4)}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-medium"
              >
                Learn STAR Method
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">STAR Method</h2>
              <p className="text-gray-600">
                Master the STAR method to structure your behavioral interview answers effectively.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {Object.entries(prepPlan?.starMethod || {}).map(([key, value]) => (
                <div key={key} className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 capitalize">
                    {key}
                  </h3>
                  <p className="text-gray-600">{value as string}</p>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Example STAR Answer</h3>
              <div className="space-y-3">
                <div>
                  <strong className="text-blue-800">Situation:</strong>
                  <p className="text-gray-700">"In my previous role as a software engineer, our team was struggling with a critical bug that was affecting our production system."</p>
                </div>
                <div>
                  <strong className="text-blue-800">Task:</strong>
                  <p className="text-gray-700">"I was responsible for leading the debugging effort and ensuring the system was restored within 24 hours."</p>
                </div>
                <div>
                  <strong className="text-blue-800">Action:</strong>
                  <p className="text-gray-700">"I organized a team meeting, analyzed the logs, identified the root cause, and implemented a fix with proper testing."</p>
                </div>
                <div>
                  <strong className="text-blue-800">Result:</strong>
                  <p className="text-gray-700">"We resolved the issue in 18 hours, preventing significant revenue loss, and implemented monitoring to prevent similar issues."</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(3)}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 font-medium"
              >
                Back to Questions
              </button>
              <button
                onClick={() => setCurrentStep(5)}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-medium"
              >
                Company Research
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Company Research</h2>
              <p className="text-gray-600">
                Get insights about {interviewData.company} to help you prepare for your interview.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Culture</h3>
                <p className="text-gray-700">{prepPlan?.companyInsights.culture}</p>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Values</h3>
                <div className="flex flex-wrap gap-2">
                  {prepPlan?.companyInsights.values.map((value: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {value}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent News</h3>
                <p className="text-gray-700">{prepPlan?.companyInsights.recentNews}</p>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Tips</h3>
                <ul className="space-y-2">
                  {prepPlan?.companyInsights.interviewTips.map((tip: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span className="text-gray-700">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-red-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Common Mistakes to Avoid</h3>
                <ul className="space-y-2">
                  {prepPlan?.commonMistakes.map((mistake: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">✗</span>
                      <span className="text-gray-700">{mistake}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Success Tips</h3>
                <ul className="space-y-2">
                  {prepPlan?.successTips.map((tip: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span className="text-gray-700">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(4)}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 font-medium"
              >
                Back to STAR Method
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(prepPlan, null, 2));
                  addToast({
                    type: 'success',
                    title: 'Copied to Clipboard',
                    description: 'Your interview prep plan has been copied to your clipboard.'
                  });
                }}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-medium"
              >
                Copy Prep Plan
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
            Interview Preparation Tool
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ace your next interview with AI-powered preparation. Get practice questions, 
            STAR method guidance, company research, and personalized feedback.
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
              <span className="text-2xl">❓</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Practice Questions</h3>
            <p className="text-gray-600">Get personalized questions based on your role and industry</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⭐</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">STAR Method</h3>
            <p className="text-gray-600">Learn to structure behavioral answers effectively</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏢</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Company Research</h3>
            <p className="text-gray-600">Get insights about your target company</p>
          </div>
        </div>
      </div>

      {/* Question Detail Modal */}
      {selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Question Details</h3>
                <button
                  onClick={() => setSelectedQuestion(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Question</h4>
                  <p className="text-gray-700">{selectedQuestion.question}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Tips</h4>
                  <p className="text-gray-700">{selectedQuestion.tips}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Sample Answer</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 italic">{selectedQuestion.sampleAnswer}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => setSelectedQuestion(null)}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewPrep;
