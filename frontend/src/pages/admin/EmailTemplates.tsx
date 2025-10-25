import React, { useState, useEffect } from 'react';
import { useSEO } from '../../utils/seo';
import apiClient from '../../api/axios';

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  type: string;
  category: string;
  variables: string[];
  description: string;
  metadata: any;
  is_active: boolean;
  is_system: boolean;
  language: string;
  created_at: string;
  updated_at: string;
}

interface TemplateFilters {
  category: string;
  type: string;
  language: string;
  is_active: boolean | null;
  search: string;
}

const EmailTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [filters, setFilters] = useState<TemplateFilters>({
    category: 'all',
    type: 'all',
    language: 'all',
    is_active: null,
    search: ''
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0
  });

  useSEO({
    title: 'Email Templates - Admin Dashboard',
    description: 'Manage email templates for the application'
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'user', label: 'User Management' },
    { value: 'course', label: 'Course Related' },
    { value: 'workflow', label: 'Workflow Related' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'system', label: 'System Notifications' }
  ];

  const types = [
    { value: 'all', label: 'All Types' },
    { value: 'html', label: 'HTML' },
    { value: 'markdown', label: 'Markdown' }
  ];

  const languages = [
    { value: 'all', label: 'All Languages' },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' }
  ];

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.language !== 'all') params.append('language', filters.language);
      if (filters.is_active !== null) params.append('is_active', filters.is_active.toString());
      if (filters.search) params.append('search', filters.search);
      params.append('page', pagination.current_page.toString());
      params.append('per_page', pagination.per_page.toString());

      const response = await apiClient.get(`/admin/email-templates?${params}`);
      setTemplates(response.data.data);
      setPagination(response.data.meta);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch email templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [filters, pagination.current_page]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await apiClient.delete(`/admin/email-templates/${id}`);
      fetchTemplates();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete template');
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await apiClient.patch(`/admin/email-templates/${id}/toggle-active`);
        fetchTemplates();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle template status');
    }
  };

  const handlePreview = async (template: EmailTemplate) => {
    try {
      const response = await apiClient.get(`/admin/email-templates/${template.id}/preview`);
      setPreviewTemplate({ ...template, ...response.data.data });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to preview template');
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
  };

  const handleSave = async () => {
    try {
      if (editingTemplate?.id) {
        // Update existing template
        await apiClient.put(`/admin/email-templates/${editingTemplate?.id}`, editingTemplate);
        await fetchTemplates();
      } else {
        // Create new template
        await apiClient.post('/admin/email-templates', editingTemplate);
        await fetchTemplates();
      }
      setEditingTemplate(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save template');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      user: 'bg-blue-100 text-blue-800',
      course: 'bg-green-100 text-green-800',
      workflow: 'bg-purple-100 text-purple-800',
      marketing: 'bg-pink-100 text-pink-800',
      system: 'bg-yellow-100 text-yellow-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type: string) => {
    return type === 'html' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Templates</h1>
            <p className="text-gray-600">Manage email templates for your application</p>
          </div>
          <button
            onClick={() => setEditingTemplate({
              id: 0,
              name: '',
              subject: '',
              body: '',
              description: '',
              category: 'user',
              type: 'html',
              language: 'en',
              is_active: true,
              is_system: false,
              variables: [],
              metadata: {},
              created_at: '',
              updated_at: ''
            } as EmailTemplate)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add New Template</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {types.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select
                value={filters.language}
                onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {languages.map(lang => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.is_active === null ? 'all' : filters.is_active.toString()}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  is_active: e.target.value === 'all' ? null : e.target.value === 'true' 
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search templates..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
        </div>
      </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{template.name}</h3>
                    <p className="text-sm text-gray-600">{template.subject}</p>
                  </div>
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                      {template.category}
                  </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(template.type)}`}>
                  {template.type}
                    </span>
                  </div>
                </div>

                {template.description && (
                  <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div>
                    <span>Variables: {template.variables?.length || 0}</span>
                    {template.variables && template.variables.length > 0 && (
                      <div className="mt-1">
                        <div className="flex flex-wrap gap-1">
                          {template.variables.slice(0, 3).map((variable, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                              {`{{${variable}}}`}
                            </span>
                          ))}
                          {template.variables.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                              +{template.variables.length - 3} more
                            </span>
                          )}
                        </div>
                  </div>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    template.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {template.is_system && (
                  <div className="mb-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      System Template
                    </span>
                  </div>
                )}

                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePreview(template)}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Preview
                  </button>
                  {!template.is_system && (
                    <>
                      <button
                        onClick={() => handleEdit(template)}
                        className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(template.id)}
                        className={`px-3 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 ${
                          template.is_active
                            ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                            : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                        }`}
                      >
                        {template.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </>
                  )}
                  {!template.is_system && (
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          </div>

        {templates.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No templates found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new email template.</p>
        </div>
      )}

      {/* Preview Modal */}
        {previewTemplate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Template Preview: {previewTemplate.name}</h3>
                <button
                    onClick={() => setPreviewTemplate(null)}
                    className="text-gray-400 hover:text-gray-600"
                >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                </div>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Subject:</h4>
                    <p className="text-sm text-gray-700">{previewTemplate.subject}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Body:</h4>
                    <div 
                      className="text-sm text-gray-700 max-h-96 overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: previewTemplate.body }}
                    />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Edit/Create Modal */}
        {editingTemplate && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingTemplate.id ? `Edit Template: ${editingTemplate.name}` : 'Create New Template'}
                </h3>
                <button
                  onClick={() => setEditingTemplate(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                    <input
                      type="text"
                      value={editingTemplate.name || ''}
                      onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!!editingTemplate.id}
                      placeholder="e.g., welcome_email, password_reset"
                    />
                    {editingTemplate.id && (
                      <p className="text-xs text-gray-500 mt-1">Template name cannot be changed</p>
                    )}
              </div>
              
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <input
                      type="text"
                      value={editingTemplate.subject || ''}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => setEditingTemplate({...editingTemplate, subject: e.target.value})}
                      placeholder="e.g., Welcome to {{app_name}}!"
                    />
              </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={editingTemplate.category || 'user'}
                        onChange={(e) => setEditingTemplate({...editingTemplate, category: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="user">User Management</option>
                        <option value="course">Course Related</option>
                        <option value="workflow">Workflow Related</option>
                        <option value="marketing">Marketing</option>
                        <option value="system">System Notifications</option>
                      </select>
                              </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                      <select
                        value={editingTemplate.type || 'html'}
                        onChange={(e) => setEditingTemplate({...editingTemplate, type: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="html">HTML</option>
                        <option value="markdown">Markdown</option>
                      </select>
                            </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                      <select
                        value={editingTemplate.language || 'en'}
                        onChange={(e) => setEditingTemplate({...editingTemplate, language: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                      </select>
                          </div>
                        </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={editingTemplate.description || ''}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      onChange={(e) => setEditingTemplate({...editingTemplate, description: e.target.value})}
                      placeholder="Brief description of this template's purpose"
                    />
                    </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Body</label>
                    <textarea
                      value={editingTemplate.body || ''}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={10}
                      onChange={(e) => setEditingTemplate({...editingTemplate, body: e.target.value})}
                      placeholder="Enter your email template content here. Use {{variable_name}} for dynamic content."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use HTML tags for formatting. Variables should be wrapped in double curly braces like {'{{user_name}}'}.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Variables</label>
                    <div className="border border-gray-300 rounded-md p-3 bg-gray-50">
                      <div className="flex flex-wrap gap-2">
                        {editingTemplate.variables?.map((variable, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            {`{{${variable}}}`}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Variables are automatically detected from the template content</p>
                    </div>
              </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => setEditingTemplate(null)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                <button
                      onClick={handleSave}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {editingTemplate.id ? 'Save Changes' : 'Create Template'}
                </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
    </div>
  );
};

export default EmailTemplates;