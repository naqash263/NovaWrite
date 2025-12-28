import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../hooks/use-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

interface Lesson {
  id: number;
  title: string;
  content: string | null;
  video_url: string | null;
  duration_minutes: number;
  order: number;
  is_free_preview: boolean;
  is_locked: boolean;
  is_completed: boolean;
  has_test: boolean;
  test_passed: boolean;
}

interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  image_url: string | null;
  what_you_learn: string | null;
  duration_hours: number;
  level: string;
  lessons: Lesson[];
  enrolled_users_count: number;
  is_enrolled: boolean;
  is_logged_in: boolean;
}

interface TestQuestion {
  id: number;
  question: string;
  options: { [key: string]: string };
  correct_answer: string;
}

interface Test {
  id: number;
  lesson_id: number;
  title: string;
  description: string;
  questions: TestQuestion[];
  passing_score: number;
  time_limit_minutes: number;
  is_active: boolean;
  order: number;
}

interface TestAttempt {
  id: number;
  user_id: number;
  lesson_test_id: number;
  answers: string[];
  score: number;
  passed: boolean;
  started_at: string;
  completed_at: string | null;
  time_taken_minutes: number | null;
  feedback: any;
}

export default function CourseDetail() {
  const { addToast } = useToast();
  const { slug } = useParams<{ slug: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showTest, setShowTest] = useState(false);
  const [test, setTest] = useState<Test | null>(null);
  const [testAttempt, setTestAttempt] = useState<TestAttempt | null>(null);
  const [testAnswers, setTestAnswers] = useState<{ [key: number]: string }>({});
  const [submittingTest, setSubmittingTest] = useState(false);
  const [completingLesson, setCompletingLesson] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchCourse();
  }, [slug]);

  const fetchCourse = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const response = await axios.get(`${API_URL}/courses/${slug}`, config);
      setCourse(response.data);
      
      const firstAvailableLesson = response.data.lessons.find(
        (l: Lesson) => !l.is_locked
      );
      if (firstAvailableLesson) {
        setSelectedLesson(firstAvailableLesson);
      }
    } catch (err) {
      setError('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      // Store current path for redirect after login
      localStorage.setItem('redirectAfterLogin', location.pathname);
      navigate('/login');
      return;
    }

    setEnrolling(true);
    setError('');

    try {
      await axios.post(
        `${API_URL}/courses/${course?.id}/enroll`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await fetchCourse();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  const handleStartTest = async (lessonId: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.post(
        `${API_URL}/lessons/${lessonId}/test/start`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setTest(response.data.test);
      setTestAttempt(response.data.attempt);
      setShowTest(true);
      setTestAnswers({});
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start test');
    }
  };

  const handleSubmitTest = async () => {
    if (!test || !testAttempt) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setSubmittingTest(true);
    setError('');

    try {
      const answers = Object.values(testAnswers);
      const response = await axios.post(
        `${API_URL}/lessons/${test.lesson_id}/test/submit`,
        {
          attempt_id: testAttempt.id,
          answers: answers
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.passed) {
        setError('');
        setShowTest(false);
        await fetchCourse(); // Refresh course data
        addToast({
          type: 'success',
          title: 'Test Passed!',
          description: '🎉 Test passed! Lesson completed successfully!',
          duration: 5000
        });
      } else {
        setError(`Test failed. Score: ${response.data.score}%. Try again!`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit test');
    } finally {
      setSubmittingTest(false);
    }
  };

  const handleCompleteLesson = async (lessonId: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setCompletingLesson(true);
    setError('');

    try {
      await axios.post(
        `${API_URL}/lessons/${lessonId}/complete`,
        { time_spent_minutes: 10 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await fetchCourse(); // Refresh course data
      addToast({
        type: 'success',
        title: 'Lesson Completed',
        description: '✅ Lesson marked as completed!',
        duration: 5000
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete lesson');
    } finally {
      setCompletingLesson(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || 'Course not found'}</p>
          <Link to="/courses" className="text-blue-600 hover:underline mt-4 inline-block">
            ← Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <Link to="/courses" className="text-blue-200 hover:text-white mb-4 inline-block">
            ← Back to Courses
          </Link>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-blue-100 text-lg mb-6">{course.description}</p>
              
              <div className="flex items-center space-x-6 text-sm">
                <span>⏱️ {course.duration_hours} hours</span>
                <span>📝 {course.lessons.length} lessons</span>
                <span>📊 {course.level}</span>
                <span>👥 {course.enrolled_users_count} enrolled</span>
              </div>
            </div>
            
            <div>
              {!course.is_logged_in ? (
                <div className="bg-white rounded-lg p-6 text-gray-900">
                  <p className="text-2xl font-bold mb-2">Login Required</p>
                  <p className="text-gray-600 mb-4">Register or login to access all lessons</p>
                  <Link
                    to="/login"
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all inline-block text-center"
                  >
                    Login to Access
                  </Link>
                </div>
              ) : !course.is_enrolled ? (
                <div className="bg-white rounded-lg p-6 text-gray-900">
                  <p className="text-2xl font-bold mb-2">FREE</p>
                  <p className="text-gray-600 mb-4">Full access for registered users</p>
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50"
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll Now'}
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-lg p-6 text-gray-900">
                  <div className="flex items-center text-green-600 mb-2">
                    <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">You're enrolled!</span>
                  </div>
                  <p className="text-gray-600">You have full access to all lessons</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            {selectedLesson ? (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedLesson.title}</h2>
                  <div className="flex items-center space-x-2">
                    {selectedLesson.is_completed && (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        ✅ Completed
                      </span>
                    )}
                    {selectedLesson.has_test && (
                      <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                        📝 Has Test
                      </span>
                    )}
                  </div>
                </div>
                
                {selectedLesson.video_url && (
                  <div className="mb-6 aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                    <p className="text-gray-600">Video: {selectedLesson.video_url}</p>
                  </div>
                )}
                
                {selectedLesson.content ? (
                  <div>
                    <div className="prose max-w-none mb-6" dangerouslySetInnerHTML={{ __html: selectedLesson.content }} />
                    
                    {/* Lesson Actions */}
                    <div className="border-t pt-6">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Duration: {selectedLesson.duration_minutes} minutes
                        </div>
                        <div className="flex space-x-3">
                          {!selectedLesson.is_completed && !selectedLesson.is_locked && (
                            <>
                              {selectedLesson.has_test ? (
                                <button
                                  onClick={() => handleStartTest(selectedLesson.id)}
                                  className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                                >
                                  📝 Take Test
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleCompleteLesson(selectedLesson.id)}
                                  disabled={completingLesson}
                                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                  {completingLesson ? 'Completing...' : '✅ Mark Complete'}
                                </button>
                              )}
                            </>
                          )}
                          {selectedLesson.is_completed && (
                            <span className="text-green-600 font-medium">
                              🎉 Great job! This lesson is completed.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <p className="text-yellow-800 font-semibold mb-2">🔒 Lesson Locked</p>
                    {!course.is_logged_in ? (
                      <>
                        <p className="text-yellow-700 mb-4">Login to access this lesson</p>
                        <Link
                          to="/login"
                          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 inline-block"
                        >
                          Login to Access
                        </Link>
                      </>
                    ) : (
                      <>
                        <p className="text-yellow-700 mb-4">Complete previous lessons to unlock this lesson</p>
                        <p className="text-sm text-yellow-600">
                          You need to complete all previous lessons in order to access this content.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <p className="text-gray-600">Select a lesson to start learning</p>
              </div>
            )}
          </div>

          <div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Course Content</h3>
              <div className="space-y-2">
                {course.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className={`w-full px-4 py-3 rounded-lg transition-all border ${
                      selectedLesson?.id === lesson.id
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'border-gray-200 hover:border-blue-300'
                    } ${lesson.is_locked ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold text-gray-900 text-sm">{lesson.title}</p>
                          {lesson.is_completed && <span className="text-green-600">✅</span>}
                          {lesson.has_test && !lesson.test_passed && !lesson.is_locked && (
                            <span className="text-orange-500">📝</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{lesson.duration_minutes} min</p>
                        {lesson.is_locked && (
                          <p className="text-xs text-red-500 mt-1">Complete previous lessons to unlock</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {lesson.is_locked && <span className="text-gray-400">🔒</span>}
                        {lesson.is_free_preview && <span className="text-green-600 text-xs">FREE</span>}
                        {!lesson.is_locked && (
                          <button
                            onClick={() => setSelectedLesson(lesson)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {course.what_you_learn && (
              <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">What You'll Learn</h3>
                <div className="prose prose-sm" dangerouslySetInnerHTML={{ __html: course.what_you_learn }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Test Modal */}
      {showTest && test && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">{test.title}</h3>
                <button
                  onClick={() => setShowTest(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <p className="text-gray-600 mb-6">{test.description}</p>
              
              <div className="space-y-6">
                {test.questions.map((question, index) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      {index + 1}. {question.question}
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(question.options).map(([key, value]) => (
                        <label key={key} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name={`question_${question.id}`}
                            value={key}
                            checked={testAnswers[question.id] === key}
                            onChange={(e) => setTestAnswers(prev => ({
                              ...prev,
                              [question.id]: e.target.value
                            }))}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-gray-700">{key}. {value}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-between mt-8 pt-6 border-t">
                <div className="text-sm text-gray-600">
                  Passing Score: {test.passing_score}% | Time Limit: {test.time_limit_minutes} minutes
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowTest(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitTest}
                    disabled={submittingTest || Object.keys(testAnswers).length !== test.questions.length}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingTest ? 'Submitting...' : 'Submit Test'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
