import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  image_url: string | null;
  duration_hours: number;
  level: string;
  lessons_count: number;
  enrolled_users_count: number;
  is_enrolled: boolean;
}

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const response = await axios.get(`${API_URL}/courses`, config);
      setCourses(response.data);
    } catch (err) {
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Free Courses & Learning Resources
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Master automation, data analysis, and system development with our comprehensive courses. All courses are free for registered users!
          </p>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No courses available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {course.image_url ? (
                  <img
                    src={course.image_url}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                    <span className="text-white text-4xl">📚</span>
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getLevelColor(course.level)}`}>
                      {course.level}
                    </span>
                    {course.is_enrolled && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        Enrolled
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">{course.description}</p>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>⏱️ {course.duration_hours}h</span>
                    <span>📝 {course.lessons_count} lessons</span>
                    <span>👥 {course.enrolled_users_count} enrolled</span>
                  </div>

                  <Link
                    to={`/courses/${course.slug}`}
                    className="block w-full bg-blue-600 text-white text-center px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all"
                  >
                    {course.is_enrolled ? 'Continue Learning' : 'View Course'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
