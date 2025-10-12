import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_CONFIG } from '../../config/api';

interface Enrollment {
  enrollment_id: number;
  enrolled_at: string;
  progress: number;
  completed_at: string | null;
  course: {
    id: number;
    title: string;
    slug: string;
    description: string;
    image_url: string | null;
    duration_hours: number;
    level: string;
    lessons_count: number;
  };
}

export default function MyCourses() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}/my-courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEnrollments(response.data);
    } catch (err) {
      setError('Failed to load your courses');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Courses</h1>
          <p className="text-gray-600">Track your learning progress and continue where you left off</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {enrollments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Courses Yet</h2>
            <p className="text-gray-600 mb-6">
              You haven't enrolled in any courses. Browse our catalog to get started!
            </p>
            <Link
              to="/courses"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all"
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {enrollments.map((enrollment) => (
              <div
                key={enrollment.enrollment_id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="md:flex">
                  {enrollment.course.image_url ? (
                    <img
                      src={enrollment.course.image_url}
                      alt={enrollment.course.title}
                      className="w-full md:w-64 h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full md:w-64 h-48 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                      <span className="text-white text-5xl">📚</span>
                    </div>
                  )}
                  
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                          {enrollment.course.title}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Enrolled on {new Date(enrollment.enrolled_at).toLocaleDateString()}
                        </p>
                      </div>
                      {enrollment.completed_at && (
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                          ✓ Completed
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 mb-4">{enrollment.course.description}</p>

                    <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                      <span>⏱️ {enrollment.course.duration_hours}h</span>
                      <span>📝 {enrollment.course.lessons_count} lessons</span>
                      <span>📊 {enrollment.course.level}</span>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-semibold text-blue-600">{enrollment.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${enrollment.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <Link
                      to={`/courses/${enrollment.course.slug}`}
                      className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all"
                    >
                      {enrollment.completed_at ? 'Review Course' : 'Continue Learning'}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {enrollments.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              to="/courses"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Browse More Courses →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
