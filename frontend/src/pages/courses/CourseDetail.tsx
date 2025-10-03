import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface Lesson {
  id: number;
  title: string;
  content: string | null;
  video_url: string | null;
  duration_minutes: number;
  order: number;
  is_free_preview: boolean;
  is_locked: boolean;
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
}

export default function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const navigate = useNavigate();

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
              {!course.is_enrolled ? (
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
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedLesson.title}</h2>
                
                {selectedLesson.video_url && (
                  <div className="mb-6 aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                    <p className="text-gray-600">Video: {selectedLesson.video_url}</p>
                  </div>
                )}
                
                {selectedLesson.content ? (
                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: selectedLesson.content }} />
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <p className="text-yellow-800 font-semibold mb-2">🔒 Lesson Locked</p>
                    <p className="text-yellow-700">Enroll in this course to access this lesson</p>
                    <button
                      onClick={handleEnroll}
                      className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Enroll Now
                    </button>
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
                  <button
                    key={lesson.id}
                    onClick={() => !lesson.is_locked && setSelectedLesson(lesson)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                      selectedLesson?.id === lesson.id
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'border border-gray-200 hover:border-blue-300'
                    } ${lesson.is_locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{lesson.title}</p>
                        <p className="text-xs text-gray-500">{lesson.duration_minutes} min</p>
                      </div>
                      {lesson.is_locked && <span className="text-gray-400">🔒</span>}
                      {lesson.is_free_preview && <span className="text-green-600 text-xs">FREE</span>}
                    </div>
                  </button>
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
    </div>
  );
}
