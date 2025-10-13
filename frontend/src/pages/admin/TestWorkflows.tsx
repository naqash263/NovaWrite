import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/axios';
import ImageUpload from '../../components/ImageUpload';

interface Workflow {
  id: number;
  title: string;
  slug: string;
  summary?: string;
  description?: string;
  tools?: string[];
  benefits?: string[];
  status: string;
  is_featured: boolean;
  workflow_category_id: number;
  image_url?: string;
  category?: {
    id: number;
    name: string;
  };
  created_at: string;
}

interface WorkflowCategory {
  id: number;
  name: string;
}

export default function TestWorkflows() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    workflow_category_id: '',
    title: '',
    summary: '',
    description: '',
    tools: [] as string[],
    benefits: [] as string[],
    status: 'draft',
    is_featured: false,
    image_url: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const queryClient = useQueryClient();

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['workflows-admin'],
    queryFn: async () => {
      const response = await apiClient.get('/workflows');
      return response.data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['workflow-categories'],
    queryFn: async () => {
      const response = await apiClient.get('/workflow-categories');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/workflows', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows-admin'] });
      setSuccess('Workflow created successfully!');
      resetForm();
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Error creating workflow');
      setTimeout(() => setError(''), 3000);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiClient.put(`/workflows/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows-admin'] });
      setSuccess('Workflow updated successfully!');
      resetForm();
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Error updating workflow');
      setTimeout(() => setError(''), 3000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/workflows/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows-admin'] });
      setSuccess('Workflow deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Error deleting workflow');
      setTimeout(() => setError(''), 3000);
    },
  });

  const resetForm = () => {
    setFormData({
      workflow_category_id: '',
      title: '',
      summary: '',
      description: '',
      tools: [],
      benefits: [],
      status: 'draft',
      is_featured: false,
      image_url: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (workflow: Workflow) => {
    setFormData({
      workflow_category_id: String(workflow.workflow_category_id),
      title: workflow.title,
      summary: workflow.summary || '',
      description: workflow.description || '',
      tools: workflow.tools || [],
      benefits: workflow.benefits || [],
      status: workflow.status,
      is_featured: workflow.is_featured,
      image_url: workflow.image_url || '',
    });
    setEditingId(workflow.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const data = {
      ...formData,
      workflow_category_id: parseInt(formData.workflow_category_id),
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Test Workflows Management</h1>
          <p className="mt-2 text-gray-600">Manage your automation workflows</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Workflows</h2>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Workflow
              </button>
            </div>
          </div>

          {showForm && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingId ? 'Edit Workflow' : 'Add New Workflow'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.workflow_category_id}
                    onChange={(e) => setFormData({ ...formData, workflow_category_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category: WorkflowCategory) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    rows={5}
                  />
                </div>

                <ImageUpload
                  onImageUploaded={(imageUrl) => setFormData({ ...formData, image_url: imageUrl })}
                  currentImage={formData.image_url}
                  label="Workflow Image"
                  maxSize={5}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tools Used</label>
                  <input
                    type="text"
                    value={formData.tools.join(', ')}
                    onChange={(e) => {
                      const tools = e.target.value
                        .split(',')
                        .map(t => t.trim())
                        .filter(t => t.length > 0);
                      setFormData({ ...formData, tools });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="e.g., React, Node.js, PostgreSQL (separate with commas)"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate multiple tools with commas</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Key Benefits</label>
                  <input
                    type="text"
                    value={formData.benefits.join(', ')}
                    onChange={(e) => {
                      const benefits = e.target.value
                        .split(',')
                        .map(b => b.trim())
                        .filter(b => b.length > 0);
                      setFormData({ ...formData, benefits });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="e.g., Faster processing, Better accuracy, Cost savings (separate with commas)"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate multiple benefits with commas</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-900">
                    Featured Workflow
                  </label>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Featured
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workflows.map((workflow: Workflow) => (
                  <tr key={workflow.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{workflow.title}</div>
                      <div className="text-sm text-gray-500">{workflow.summary}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {workflow.category?.name || 'No Category'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        workflow.status === 'published' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {workflow.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {workflow.is_featured ? 'Yes' : 'No'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(workflow)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(workflow.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}






