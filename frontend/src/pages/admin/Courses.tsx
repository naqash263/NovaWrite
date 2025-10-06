import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/axios';
import EnhancedImageUpload from '../../components/EnhancedImageUpload';
import { useSEO } from '../../utils/seo';

interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  image_url?: string;
  what_you_learn?: string;
  duration_hours: number;
  level: string;
  is_published: boolean;
  order: number;
  lessons_count?: number;
}

interface CourseFile {
  id: number;
  course_id: number;
  file_id: number;
  title?: string;
  description?: string;
  order: number;
  is_required: boolean;
  is_downloadable: boolean;
  file: {
    id: number;
    name: string;
    original_name: string;
    path: string;
    mime_type: string;
    size: number;
    is_public: boolean;
  };
}

interface File {
  id: number;
  name: string;
  original_name: string;
  path: string;
  mime_type: string;
  size: number;
  is_public: boolean;
}

interface FormData {
  title: string;
  description: string;
  image_url: string;
  what_you_learn: string;
  duration_hours: string;
  level: string;
  is_published: boolean;
  order: string;
}

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    image_url: '',
    what_you_learn: '',
    duration_hours: '',
    level: 'beginner',
    is_published: true,
    order: '0',
  });

  // File attachment states
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [courseFiles, setCourseFiles] = useState<CourseFile[]>([]);
  const [availableFiles, setAvailableFiles] = useState<File[]>([]);
  const [showFileModal, setShowFileModal] = useState(false);
  const [fileFormData, setFileFormData] = useState({
    file_id: '',
    title: '',
    description: '',
    is_required: false,
    is_downloadable: true,
  });

  useSEO({ title: 'Manage Courses | Admin' });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await apiClient.get('/admin/courses');
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchCourseFiles = async (courseId: number) => {
    try {
      const response = await apiClient.get(`/admin/courses/${courseId}/files`);
      setCourseFiles(response.data);
    } catch (error) {
      console.error('Error fetching course files:', error);
    }
  };

  const fetchAvailableFiles = async () => {
    try {
      const response = await apiClient.get('/files');
      setAvailableFiles(response.data);
    } catch (error) {
      console.error('Error fetching available files:', error);
    }
  };

  const handleOpenFileModal = async (courseId: number) => {
    setSelectedCourseId(courseId);
    setShowFileModal(true);
    await fetchCourseFiles(courseId);
    await fetchAvailableFiles();
  };

  const handleAttachFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;

    try {
      await apiClient.post(`/admin/courses/${selectedCourseId}/files`, {
        ...fileFormData,
        file_id: parseInt(fileFormData.file_id),
      });
      setFileFormData({
        file_id: '',
        title: '',
        description: '',
        is_required: false,
        is_downloadable: true,
      });
      await fetchCourseFiles(selectedCourseId);
    } catch (error) {
      console.error('Error attaching file:', error);
    }
  };

  const handleRemoveFile = async (fileId: number) => {
    if (!selectedCourseId) return;

    try {
      await apiClient.delete(`/admin/courses/${selectedCourseId}/files/${fileId}`);
      await fetchCourseFiles(selectedCourseId);
    } catch (error) {
      console.error('Error removing file:', error);
    }
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    if (mimeType.includes('json')) return '🔧';
    return '📁';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        duration_hours: parseInt(formData.duration_hours) || 0,
        order: parseInt(formData.order) || 0,
      };

      if (editingId) {
        await apiClient.put(`/admin/courses/${editingId}`, payload);
      } else {
        await apiClient.post('/admin/courses', payload);
      }
      resetForm();
      fetchCourses();
    } catch (error) {
      console.error('Error saving course:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image_url: '',
      what_you_learn: '',
      duration_hours: '',
      level: 'beginner',
      is_published: true,
      order: '0',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (course: Course) => {
    setFormData({
      title: course.title,
      description: course.description,
      image_url: course.image_url || '',
      what_you_learn: course.what_you_learn || '',
      duration_hours: course.duration_hours.toString(),
      level: course.level,
      is_published: course.is_published,
      order: course.order.toString(),
    });
    setEditingId(course.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this course? This will also delete all lessons.')) {
      try {
        await apiClient.delete(`/admin/courses/${id}`);
        fetchCourses();
      } catch (error) {
        console.error('Error deleting course:', error);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Add Course'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                rows={3}
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">What You'll Learn (one per line)</label>
              <textarea
                value={formData.what_you_learn}
                onChange={(e) => setFormData({ ...formData, what_you_learn: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                rows={4}
                placeholder="Build automation workflows&#10;Master system analysis&#10;Create efficient processes"
              />
            </div>

            <EnhancedImageUpload
              onImageUploaded={(imageUrl) => setFormData({ ...formData, image_url: imageUrl })}
              currentImage={formData.image_url}
              label="Course Image"
              maxSize={5}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (hours) *</label>
              <input
                type="number"
                value={formData.duration_hours}
                onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                min="0"
                step="0.5"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level *</label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                min="0"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Published</span>
              </label>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              {editingId ? 'Update Course' : 'Create Course'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lessons</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {courses.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No courses yet. Click "Add Course" to create one.
                </td>
              </tr>
            ) : (
              courses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{course.title}</div>
                      <div className="text-sm text-gray-500">{course.slug}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {course.image_url ? (
                      <img
                        src={course.image_url}
                        alt={course.title}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-300"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                        No Image
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
                      {course.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {course.duration_hours}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <Link
                      to={`/admin/courses/${course.id}/lessons`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {course.lessons_count || 0} lessons
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {course.is_published ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Published
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(course)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleOpenFileModal(course.id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Files
                    </button>
                    <button
                      onClick={() => handleDelete(course.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* File Attachment Modal */}
      {showFileModal && selectedCourseId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Manage Course Files</h3>
              <button
                onClick={() => setShowFileModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Attach File Form */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-md font-medium mb-4">Attach New File</h4>
              <form onSubmit={handleAttachFile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select File
                    </label>
                    <select
                      value={fileFormData.file_id}
                      onChange={(e) => setFileFormData({ ...fileFormData, file_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Choose a file...</option>
                      {availableFiles.map((file) => (
                        <option key={file.id} value={file.id}>
                          {getFileIcon(file.mime_type)} {file.original_name} ({formatFileSize(file.size)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={fileFormData.title}
                      onChange={(e) => setFileFormData({ ...fileFormData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Custom title for this file"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={fileFormData.description}
                    onChange={(e) => setFileFormData({ ...fileFormData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Description of this file"
                  />
                </div>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={fileFormData.is_required}
                      onChange={(e) => setFileFormData({ ...fileFormData, is_required: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Required</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={fileFormData.is_downloadable}
                      onChange={(e) => setFileFormData({ ...fileFormData, is_downloadable: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Downloadable</span>
                  </label>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Attach File
                </button>
              </form>
            </div>

            {/* Attached Files List */}
            <div>
              <h4 className="text-md font-medium mb-4">Attached Files ({courseFiles.length})</h4>
              {courseFiles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📁</div>
                  <p>No files attached to this course yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {courseFiles.map((courseFile) => (
                    <div key={courseFile.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getFileIcon(courseFile.file.mime_type)}</span>
                        <div>
                          <h5 className="font-medium text-gray-900">
                            {courseFile.title || courseFile.file.original_name}
                          </h5>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(courseFile.file.size)} • {courseFile.file.mime_type}
                          </p>
                          {courseFile.description && (
                            <p className="text-sm text-gray-600 mt-1">{courseFile.description}</p>
                          )}
                          <div className="flex space-x-2 mt-1">
                            {courseFile.is_required && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                Required
                              </span>
                            )}
                            {courseFile.is_downloadable && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                Downloadable
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFile(courseFile.id)}
                        className="text-red-600 hover:text-red-800 p-2"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
