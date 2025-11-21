import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/axios';
import EnhancedImageUpload from '../../components/EnhancedImageUpload';
import RichTextEditor from '../../components/RichTextEditor';
import { useSEO } from '../../utils/seo';

interface Project {
  id: number;
  title: string;
  slug: string;
  summary?: string;
  description?: string;
  product_description?: string;
  meta_description?: string;
  meta_keywords?: string;
  seo_title?: string;
  image_url?: string;
  project_url?: string;
  github_url?: string;
  technologies?: string[];
  features?: string[];
  status: string;
  is_published: boolean;
  is_featured: boolean;
  order: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export default function Projects() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    description: '',
    product_description: '',
    meta_description: '',
    meta_keywords: '',
    seo_title: '',
    image_url: '',
    project_url: '',
    github_url: '',
    technologies: [] as string[],
    features: [] as string[],
    status: 'draft',
    is_published: false,
    is_featured: false,
    order: 0,
    start_date: '',
    end_date: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const queryClient = useQueryClient();

  useSEO({ title: 'Manage Projects | Admin' });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects-admin'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/projects');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/admin/projects', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-admin'] });
      setSuccess('Project created successfully!');
      resetForm();
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Error creating project');
      setTimeout(() => setError(''), 3000);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiClient.put(`/admin/projects/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-admin'] });
      setSuccess('Project updated successfully!');
      resetForm();
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Error updating project');
      setTimeout(() => setError(''), 3000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/admin/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-admin'] });
      setSuccess('Project deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Error deleting project');
      setTimeout(() => setError(''), 3000);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const data = {
      ...formData,
      order: Number(formData.order) || 0,
      // Ensure empty strings are converted to null for optional fields
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      project_url: formData.project_url || null,
      github_url: formData.github_url || null,
      image_url: formData.image_url?.trim() || null,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      summary: '',
      description: '',
      product_description: '',
      meta_description: '',
      meta_keywords: '',
      seo_title: '',
      image_url: '',
      project_url: '',
      github_url: '',
      technologies: [],
      features: [],
      status: 'draft',
      is_published: false,
      is_featured: false,
      order: 0,
      start_date: '',
      end_date: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (project: Project) => {
    setFormData({
      title: project.title,
      summary: project.summary || '',
      description: project.description || '',
      product_description: project.product_description || '',
      meta_description: project.meta_description || '',
      meta_keywords: typeof project.meta_keywords === 'string' 
        ? project.meta_keywords 
        : (project.meta_keywords || []).join(', '),
      seo_title: project.seo_title || '',
      image_url: project.image_url || '',
      project_url: project.project_url || '',
      github_url: project.github_url || '',
      technologies: project.technologies || [],
      features: project.features || [],
      status: project.status || 'draft',
      is_published: project.is_published,
      is_featured: project.is_featured,
      order: project.order || 0,
      start_date: project.start_date || '',
      end_date: project.end_date || '',
    });
    setEditingId(project.id);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this project?')) {
      setError('');
      setSuccess('');
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading projects...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Projects Management</h1>
        <button
          onClick={() => { 
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
              setError('');
              setSuccess('');
            }
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancel' : 'Create Project'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
              <input
                type="text"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Brief summary of the project"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <RichTextEditor
                value={formData.description}
                onChange={(description) => setFormData({ ...formData, description })}
                placeholder="Enter project description..."
                height={300}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Description (AI & SEO Friendly)
              </label>
              <RichTextEditor
                value={formData.product_description}
                onChange={(product_description) => setFormData({ ...formData, product_description })}
                placeholder="Enter detailed product description optimized for AI and search engines..."
                height={250}
              />
              <p className="text-xs text-gray-500 mt-1">This description will be used for SEO and AI search optimization</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SEO Title
                  <span className="text-xs text-gray-500 ml-2">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.seo_title}
                  onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g., Best AI Automation Project"
                  maxLength={70}
                />
                <p className="text-xs text-gray-500 mt-1">Recommended: 50-60 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Description
                </label>
                <textarea
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Brief description for search engine results..."
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-gray-500 mt-1">Recommended: 120-160 characters</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Keywords (Comma-separated)
              </label>
              <input
                type="text"
                value={formData.meta_keywords}
                onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="e.g., AI automation, project, web development"
              />
            </div>

            <EnhancedImageUpload
              onImageUploaded={(imageUrl) => setFormData({ ...formData, image_url: imageUrl })}
              currentImage={formData.image_url}
              label="Project Image"
              maxSize={5}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project URL</label>
                <input
                  type="url"
                  value={formData.project_url}
                  onChange={(e) => setFormData({ ...formData, project_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GitHub URL</label>
                <input
                  type="url"
                  value={formData.github_url}
                  onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="https://github.com/username/repo"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Technologies Used</label>
              <input
                type="text"
                value={formData.technologies.join(', ')}
                onChange={(e) => {
                  const technologies = e.target.value
                    .split(',')
                    .map(t => t.trim())
                    .filter(t => t.length > 0);
                  setFormData({ ...formData, technologies });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="e.g., React, Node.js, PostgreSQL (separate with commas)"
              />
              <p className="text-xs text-gray-500 mt-1">Separate multiple technologies with commas</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key Features</label>
              <input
                type="text"
                value={formData.features.join(', ')}
                onChange={(e) => {
                  const features = e.target.value
                    .split(',')
                    .map(f => f.trim())
                    .filter(f => f.length > 0);
                  setFormData({ ...formData, features });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="e.g., Real-time updates, User authentication, API integration (separate with commas)"
              />
              <p className="text-xs text-gray-500 mt-1">Separate multiple features with commas</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="draft">Draft</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Published</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Featured</span>
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingId ? 'Update Project' : 'Create Project'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Published</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No projects found. Create your first project!
                  </td>
                </tr>
              ) : (
                projects.map((project: Project) => (
                  <tr key={project.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{project.title}</div>
                      {project.summary && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">{project.summary}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        project.status === 'completed' ? 'bg-green-100 text-green-800' :
                        project.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        project.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {project.is_published ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span className="text-gray-400">✗</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {project.is_featured ? (
                        <span className="text-yellow-600">⭐</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project.order}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(project)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
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
      </div>
    </div>
  );
}

