import React, { useState, useEffect } from 'react';
import apiClient from '../../../api/axios';
import { useToast } from '../../../hooks/use-toast';

interface WorkflowCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export default function WorkflowCategories() {
  const [categories, setCategories] = useState<WorkflowCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<WorkflowCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const { addToast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/workflow-categories');
      setCategories(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching workflow categories:', error);
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to fetch workflow categories',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await apiClient.put(`/admin/workflow-categories/${editingCategory.id}`, formData);
        addToast({
          type: 'success',
          title: 'Success',
          description: 'Workflow category updated successfully',
          duration: 3000
        });
      } else {
        await apiClient.post('/admin/workflow-categories', formData);
        addToast({
          type: 'success',
          title: 'Success',
          description: 'Workflow category created successfully',
          duration: 3000
        });
      }
      setShowForm(false);
      setEditingCategory(null);
      resetForm();
      fetchCategories();
    } catch (error: any) {
      console.error('Error saving workflow category:', error);
      addToast({
        type: 'error',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save workflow category',
        duration: 5000
      });
    }
  };

  const handleEdit = (category: WorkflowCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this workflow category?')) {
      return;
    }

    try {
      await apiClient.delete(`/admin/workflow-categories/${id}`);
      addToast({
        type: 'success',
        title: 'Success',
        description: 'Workflow category deleted successfully',
        duration: 3000
      });
      fetchCategories();
    } catch (error: any) {
      console.error('Error deleting workflow category:', error);
      addToast({
        type: 'error',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete workflow category',
        duration: 5000
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
    });
    setEditingCategory(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Workflow Categories</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Category
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingCategory ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {category.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.slug}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {category.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(category.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
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
        {categories.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No workflow categories found. Create your first category!
          </div>
        )}
      </div>
    </div>
  );
}
