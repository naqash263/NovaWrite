import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/axios';
import { useSEO } from '../../utils/seo';

interface Workflow {
  id: number;
  title: string;
  slug: string;
  summary?: string;
  description?: string;
  tools_used?: string;
  key_benefits?: string;
  is_published: boolean;
  is_featured: boolean;
  workflow_category_id: number;
  category?: {
    id: number;
    name: string;
  };
  created_at: string;
  files?: WorkflowFile[];
}

interface WorkflowFile {
  id: number;
  file_path: string;
  description?: string;
}

interface WorkflowCategory {
  id: number;
  name: string;
}

export default function Workflows() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    workflow_category_id: '',
    title: '',
    summary: '',
    description: '',
    tools_used: '',
    key_benefits: '',
    is_published: false,
    is_featured: false,
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const queryClient = useQueryClient();

  useSEO({ title: 'Manage Workflows | Admin' });

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['workflows-admin'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/workflows');
      return response.data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-workflow-categories'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/workflow-categories');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/admin/workflows', data);
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
      const response = await apiClient.put(`/admin/workflows/${id}`, data);
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
      await apiClient.delete(`/admin/workflows/${id}`);
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

  const uploadFileMutation = useMutation({
    mutationFn: async ({ workflowId, file, description }: { workflowId: number; file: File; description: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', description);
      
      const response = await apiClient.post(`/admin/workflows/${workflowId}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows-admin'] });
      setSuccess('File uploaded successfully!');
      setUploadFile(null);
      setFileDescription('');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Error uploading file');
      setTimeout(() => setError(''), 3000);
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async ({ workflowId, fileId }: { workflowId: number; fileId: number }) => {
      await apiClient.delete(`/admin/workflows/${workflowId}/files/${fileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows-admin'] });
      setSuccess('File deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Error deleting file');
      setTimeout(() => setError(''), 3000);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const data = {
      ...formData,
      workflow_category_id: Number(formData.workflow_category_id),
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const resetForm = () => {
    setFormData({
      workflow_category_id: '',
      title: '',
      summary: '',
      description: '',
      tools_used: '',
      key_benefits: '',
      is_published: false,
      is_featured: false,
    });
    setEditingId(null);
    setShowForm(false);
    setUploadFile(null);
    setFileDescription('');
  };

  const handleEdit = (workflow: Workflow) => {
    setFormData({
      workflow_category_id: String(workflow.workflow_category_id),
      title: workflow.title,
      summary: workflow.summary || '',
      description: workflow.description || '',
      tools_used: workflow.tools_used || '',
      key_benefits: workflow.key_benefits || '',
      is_published: workflow.is_published,
      is_featured: workflow.is_featured,
    });
    setEditingId(workflow.id);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      setError('');
      setSuccess('');
      deleteMutation.mutate(id);
    }
  };

  const handleFileUpload = async (workflowId: number) => {
    if (!uploadFile) {
      setError('Please select a file to upload');
      setTimeout(() => setError(''), 3000);
      return;
    }

    uploadFileMutation.mutate({ workflowId, file: uploadFile, description: fileDescription });
  };

  const handleDeleteFile = (workflowId: number, fileId: number) => {
    if (confirm('Are you sure you want to delete this file?')) {
      deleteFileMutation.mutate({ workflowId, fileId });
    }
  };

  const currentWorkflow = workflows.find((w: Workflow) => w.id === editingId);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Workflows</h1>
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
          {showForm ? 'Cancel' : 'Create Workflow'}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.workflow_category_id}
                onChange={(e) => setFormData({ ...formData, workflow_category_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat: WorkflowCategory) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tools Used</label>
              <input
                type="text"
                value={formData.tools_used}
                onChange={(e) => setFormData({ ...formData, tools_used: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="e.g., React, Node.js, PostgreSQL"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key Benefits</label>
              <textarea
                value={formData.key_benefits}
                onChange={(e) => setFormData({ ...formData, key_benefits: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                rows={3}
              />
            </div>

            <div className="flex gap-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="published"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="published" className="ml-2 text-sm font-medium text-gray-700">
                  Published
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="featured" className="ml-2 text-sm font-medium text-gray-700">
                  Featured
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : editingId
                ? 'Update Workflow'
                : 'Create Workflow'}
            </button>
          </form>

          {editingId && currentWorkflow && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Attached Files</h3>
              
              {currentWorkflow.files && currentWorkflow.files.length > 0 && (
                <div className="mb-6 space-y-2">
                  {currentWorkflow.files.map((file: WorkflowFile) => (
                    <div key={file.id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                      <div>
                        <p className="font-medium text-gray-900">{file.file_path}</p>
                        {file.description && <p className="text-sm text-gray-600">{file.description}</p>}
                      </div>
                      <button
                        onClick={() => handleDeleteFile(editingId, file.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload File (JSON)</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File Description</label>
                  <input
                    type="text"
                    value={fileDescription}
                    onChange={(e) => setFileDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Optional description for the file"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleFileUpload(editingId)}
                  disabled={uploadFileMutation.isPending || !uploadFile}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadFileMutation.isPending ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading workflows...</div>
        ) : workflows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No workflows found. Create one to get started!</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workflows.map((workflow: Workflow) => (
                <tr key={workflow.id}>
                  <td className="px-6 py-4 font-medium text-gray-900">{workflow.title}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {workflow.category?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${workflow.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {workflow.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${workflow.is_featured ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                      {workflow.is_featured ? 'Featured' : 'Regular'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {new Date(workflow.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    <button
                      onClick={() => handleEdit(workflow)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(workflow.id)}
                      disabled={deleteMutation.isPending}
                      className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
