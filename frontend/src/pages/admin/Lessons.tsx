import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../api/axios';
import RichTextEditor from '../../components/RichTextEditor';
import { useToast } from '../../hooks/use-toast';

interface Lesson {
  id: number;
  course_id: number;
  title: string;
  content: string;
  video_url: string | null;
  duration_minutes: number;
  order: number;
  is_free_preview: boolean;
  created_at: string;
  updated_at: string;
}

interface LessonFile {
  id: number;
  lesson_id: number;
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

interface Course {
  id: number;
  title: string;
  slug: string;
}

interface QuizQuestion {
  id: number;
  question: string;
  type: string;
  options: { [key: string]: string };
  correct_answer: string; // Changed back to string (A, B, C, D)
  points: number;
}

interface QuizData {
  title: string;
  description: string;
  questions: QuizQuestion[];
  passing_score: number;
  time_limit_minutes: number;
  is_active: boolean;
}

interface FormData {
  title: string;
  content: string;
  video_url: string;
  duration_minutes: number;
  is_free_preview: boolean;
  order?: number;
  thumbnail?: string;
  quiz: QuizData | null;
}

export default function AdminLessons() {
  const { addToast } = useToast();
  const { courseId } = useParams<{ courseId: string }>();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    content: '',
    video_url: '',
    duration_minutes: 10,
    is_free_preview: false,
    quiz: null,
  });

  const [showQuizForm, setShowQuizForm] = useState(false);
  const [quizData, setQuizData] = useState<QuizData>({
    title: '',
    description: '',
    questions: [],
    passing_score: 70,
    time_limit_minutes: 10,
    is_active: true,
  });

  // File attachment states
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [lessonFiles, setLessonFiles] = useState<LessonFile[]>([]);
  const [availableFiles, setAvailableFiles] = useState<File[]>([]);
  const [showFileModal, setShowFileModal] = useState(false);
  const [fileFormData, setFileFormData] = useState({
    file_id: '',
    title: '',
    description: '',
    is_required: false,
    is_downloadable: true,
  });

  useEffect(() => {
    fetchLessons();
  }, [courseId]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/admin/courses/${courseId}/lessons`);
      
      // Handle both old and new API response formats
      const data = response.data.data || response.data;
      setCourse(data.course || null);
      setLessons(data.lessons || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      addToast({
        title: 'Error',
        description: 'Failed to load lessons',
        variant: 'destructive',
      });
      setLessons([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Prepare lesson data (without quiz)
      const lessonData = {
        title: formData.title,
        content: formData.content,
        video_url: formData.video_url,
        duration_minutes: formData.duration_minutes,
        is_free_preview: formData.is_free_preview,
        order: formData.order,
        thumbnail: formData.thumbnail
      };

      let lesson;
      if (editingLesson) {
        const response = await apiClient.put(`/admin/courses/${courseId}/lessons/${editingLesson.id}`, lessonData);
        lesson = response.data.data.lesson;
      } else {
        const response = await apiClient.post(`/admin/courses/${courseId}/lessons`, lessonData);
        lesson = response.data.data.lesson;
      }

      // Handle quiz separately if it exists
      if (formData.quiz && formData.quiz.questions && formData.quiz.questions.length > 0) {
        console.log('Saving quiz for lesson:', lesson.id);
        
        // Check if quiz already exists
        try {
          const existingQuizResponse = await apiClient.get(`/admin/lessons/${lesson.id}/tests`);
          const existingData = existingQuizResponse.data.data || existingQuizResponse.data;
          
          if (existingData.tests && existingData.tests.length > 0) {
            // Update existing quiz
            const existingQuiz = existingData.tests[0];
            console.log('Updating existing quiz:', existingQuiz.id);
            await apiClient.put(`/admin/lessons/${lesson.id}/tests/${existingQuiz.id}`, formData.quiz);
          } else {
            // Create new quiz
            console.log('Creating new quiz');
            await apiClient.post(`/admin/lessons/${lesson.id}/tests`, formData.quiz);
          }
        } catch (quizError) {
          console.error('Error saving quiz:', quizError);
          console.error('Quiz data being sent:', formData.quiz);
          if (quizError.response?.data?.errors) {
            console.error('Quiz validation errors:', quizError.response.data.errors);
          }
          addToast({
            type: 'warning',
            title: 'Lesson Saved',
            description: 'Lesson saved but quiz could not be saved. You can add the quiz later.',
            duration: 5000
          });
        }
      }
      
      setShowForm(false);
      setEditingLesson(null);
      resetForm();
      fetchLessons();
      
      addToast({
        type: 'success',
        title: 'Success',
        description: editingLesson ? 'Lesson updated successfully' : 'Lesson created successfully',
        duration: 3000
      });
    } catch (error: any) {
      console.error('Error saving lesson:', error);
      if (error.response?.data?.errors) {
        console.error('Validation errors:', error.response.data.errors);
        addToast({
          type: 'error',
          title: 'Validation Errors',
          description: 'Validation errors: ' + JSON.stringify(error.response.data.errors),
          duration: 5000
        });
      } else {
        addToast({
          type: 'error',
          title: 'Save Failed',
          description: 'Error saving lesson: ' + (error.response?.data?.message || error.message),
          duration: 5000
        });
      }
    }
  };

  const handleEdit = async (lesson: Lesson) => {
    setEditingLesson(lesson);
    
    // Load existing quiz if it exists
    let existingQuiz = null;
    try {
      console.log('Fetching quiz for lesson:', lesson.id);
      const quizResponse = await apiClient.get(`/admin/lessons/${lesson.id}/tests`);
      console.log('Quiz response:', quizResponse.data);
      
      const data = quizResponse.data.data || quizResponse.data;
      console.log('Quiz data:', data);
      
      if (data.tests && data.tests.length > 0) {
        const quiz = data.tests[0]; // Get the first/active quiz
        console.log('Found quiz:', quiz);
        existingQuiz = {
          title: quiz.title,
          description: quiz.description || '',
          questions: quiz.questions || [],
          passing_score: quiz.passing_score,
          time_limit_minutes: quiz.time_limit_minutes || 10,
          is_active: quiz.is_active,
        };
        console.log('Existing quiz loaded:', existingQuiz);
      } else {
        console.log('No tests found in response');
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
    }
    
    setFormData({
      title: lesson.title,
      content: lesson.content,
      video_url: lesson.video_url || '',
      duration_minutes: lesson.duration_minutes,
      is_free_preview: lesson.is_free_preview,
      order: lesson.order,
      thumbnail: lesson.thumbnail || '',
      quiz: existingQuiz,
    });
    
    // If quiz exists, also load it into quizData for editing
    if (existingQuiz) {
      console.log('Setting quizData:', existingQuiz);
      setQuizData(existingQuiz);
    } else {
      console.log('No quiz to set');
    }
    
    setShowForm(true);
  };

  const handleDelete = async (lessonId: number) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;
    
    try {
      await apiClient.delete(`/admin/courses/${courseId}/lessons/${lessonId}`);
      fetchLessons();
    } catch (error) {
      console.error('Error deleting lesson:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      video_url: '',
      duration_minutes: 10,
      is_free_preview: false,
      order: undefined,
      thumbnail: '',
      quiz: null,
    });
    setQuizData({
      title: '',
      description: '',
      questions: [],
      passing_score: 70,
      time_limit_minutes: 10,
      is_active: true,
    });
    setShowQuizForm(false);
  };

  // Quiz management functions
  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: Date.now(),
      question: '',
      type: 'multiple_choice',
      options: { A: '', B: '', C: '', D: '' },
      correct_answer: 'A', // Changed back to string
      points: 10,
    };
    setQuizData({
      ...quizData,
      questions: [...quizData.questions, newQuestion],
    });
  };

  const updateQuestion = (questionId: number, field: string, value: string) => {
    setQuizData({
      ...quizData,
      questions: quizData.questions.map(q => {
        if (q.id === questionId) {
          if (field === 'points') {
            return { ...q, [field]: parseInt(value) || 10 };
          }
          return { ...q, [field]: value };
        }
        return q;
      }),
    });
  };

  const updateQuestionOption = (questionId: number, optionKey: string, value: string) => {
    setQuizData({
      ...quizData,
      questions: quizData.questions.map(q =>
        q.id === questionId 
          ? { ...q, options: { ...q.options, [optionKey]: value } }
          : q
      ),
    });
  };

  const removeQuestion = (questionId: number) => {
    setQuizData({
      ...quizData,
      questions: quizData.questions.filter(q => q.id !== questionId),
    });
  };

  const saveQuiz = () => {
    if (quizData.questions.length === 0) {
      addToast({
        type: 'error',
        title: 'Quiz Required',
        description: 'Please add at least one question',
        duration: 5000
      });
      return;
    }

    // Validate all questions have content and options
    for (const question of quizData.questions) {
      if (!question.question.trim()) {
        addToast({
          type: 'error',
          title: 'Invalid Question',
          description: 'All questions must have content',
          duration: 5000
        });
        return;
      }
      for (const [, value] of Object.entries(question.options)) {
        if (!value.trim()) {
          addToast({
            type: 'error',
            title: 'Invalid Answer Options',
            description: 'All answer options must be filled',
            duration: 5000
          });
          return;
        }
      }
    }

    setFormData({ ...formData, quiz: quizData });
    setShowQuizForm(false);
  };

  // File attachment functions
  const fetchLessonFiles = async (lessonId: number) => {
    try {
      const response = await apiClient.get(`/admin/lessons/${lessonId}/files`);
      setLessonFiles(response.data);
    } catch (error) {
      console.error('Error fetching lesson files:', error);
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

  const handleOpenFileModal = async (lessonId: number) => {
    setSelectedLessonId(lessonId);
    setShowFileModal(true);
    await fetchLessonFiles(lessonId);
    await fetchAvailableFiles();
  };

  const handleAttachFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLessonId) return;

    try {
      await apiClient.post(`/admin/lessons/${selectedLessonId}/files`, {
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
      await fetchLessonFiles(selectedLessonId);
    } catch (error) {
      console.error('Error attaching file:', error);
    }
  };

  const handleRemoveFile = async (fileId: number) => {
    if (!selectedLessonId) return;

    try {
      await apiClient.delete(`/admin/lessons/${selectedLessonId}/files/${fileId}`);
      await fetchLessonFiles(selectedLessonId);
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

  const handleCancel = () => {
    setShowForm(false);
    setEditingLesson(null);
    resetForm();
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link to="/admin/courses" className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
            ← Back to Courses
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Manage Lessons: {course?.title}
          </h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Add Lesson'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video URL
                </label>
                <input
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thumbnail URL
                </label>
                <input
                  type="url"
                  value={formData.thumbnail || ''}
                  onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              <RichTextEditor
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                placeholder="Enter lesson content..."
                height={300}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="1"
                  required
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_free_preview}
                    onChange={(e) => setFormData({ ...formData, is_free_preview: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Free Preview</span>
                </label>
              </div>
            </div>

            {/* Quiz Section */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Quiz (Optional)</h3>
                <div className="flex gap-2">
                  {formData.quiz ? (
                    <button
                      type="button"
                      onClick={() => setShowQuizForm(true)}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm"
                    >
                      Edit Quiz
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowQuizForm(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                    >
                      Add Quiz
                    </button>
                  )}
                  {formData.quiz && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, quiz: null })}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
                    >
                      Remove Quiz
                    </button>
                  )}
                </div>
              </div>
              
              {formData.quiz && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">{formData.quiz.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{formData.quiz.description}</p>
                  <div className="text-sm text-gray-500">
                    {formData.quiz.questions.length} questions • {formData.quiz.passing_score}% passing score • {formData.quiz.time_limit_minutes} min time limit
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                {editingLesson ? 'Update Lesson' : 'Create Lesson'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Video
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Preview
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {lessons.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No lessons yet. Click "Add Lesson" to create one.
                </td>
              </tr>
            ) : (
              lessons.map((lesson) => (
                <tr key={lesson.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{lesson.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lesson.duration_minutes} min
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lesson.video_url ? '✓' : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {lesson.is_free_preview ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Free
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        Locked
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(lesson)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleOpenFileModal(lesson.id)}
                      className="text-green-600 hover:text-green-900 mr-4"
                    >
                      Files
                    </button>
                    <button
                      onClick={() => handleDelete(lesson.id)}
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
      {showFileModal && selectedLessonId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Manage Lesson Files</h3>
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
              <h4 className="text-md font-medium mb-4">Attached Files ({lessonFiles.length})</h4>
              {lessonFiles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📁</div>
                  <p>No files attached to this lesson yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lessonFiles.map((lessonFile) => (
                    <div key={lessonFile.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getFileIcon(lessonFile.file.mime_type)}</span>
                        <div>
                          <h5 className="font-medium text-gray-900">
                            {lessonFile.title || lessonFile.file.original_name}
                          </h5>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(lessonFile.file.size)} • {lessonFile.file.mime_type}
                          </p>
                          {lessonFile.description && (
                            <p className="text-sm text-gray-600 mt-1">{lessonFile.description}</p>
                          )}
                          <div className="flex space-x-2 mt-1">
                            {lessonFile.is_required && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                Required
                              </span>
                            )}
                            {lessonFile.is_downloadable && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                Downloadable
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFile(lessonFile.id)}
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

      {/* Quiz Form Modal */}
      {showQuizForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Create Quiz</h3>
                <button
                  onClick={() => setShowQuizForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Quiz Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quiz Title *
                    </label>
                    <input
                      type="text"
                      value={quizData.title}
                      onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g., Lesson 1 Quiz"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={quizData.description}
                      onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Brief description of the quiz"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Passing Score (%)
                    </label>
                    <input
                      type="number"
                      value={quizData.passing_score}
                      onChange={(e) => setQuizData({ ...quizData, passing_score: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time Limit (minutes)
                    </label>
                    <input
                      type="number"
                      value={quizData.time_limit_minutes}
                      onChange={(e) => setQuizData({ ...quizData, time_limit_minutes: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      min="1"
                    />
                  </div>
                </div>

                {/* Questions */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900">Questions</h4>
                    <button
                      onClick={addQuestion}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Add Question
                    </button>
                  </div>

                  <div className="space-y-4">
                    {quizData.questions.map((question, index) => (
                      <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-900">Question {index + 1}</h5>
                          <button
                            onClick={() => removeQuestion(question.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Question Text *
                          </label>
                          <input
                            type="text"
                            value={question.question}
                            onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Enter the question..."
                            required
                          />
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Points *
                          </label>
                          <input
                            type="number"
                            value={question.points}
                            onChange={(e) => updateQuestion(question.id, 'points', e.target.value)}
                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                            min="1"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                          {Object.entries(question.options).map(([key, value]) => (
                            <div key={key} className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name={`correct_${question.id}`}
                                value={key}
                                checked={question.correct_answer === key}
                                onChange={(e) => updateQuestion(question.id, 'correct_answer', e.target.value)}
                                className="w-4 h-4 text-blue-600"
                              />
                              <input
                                type="text"
                                value={value}
                                onChange={(e) => updateQuestionOption(question.id, key, e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                                placeholder={`Option ${key}`}
                                required
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {quizData.questions.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No questions added yet. Click "Add Question" to get started.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t">
                <button
                  onClick={() => setShowQuizForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={saveQuiz}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  Save Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
