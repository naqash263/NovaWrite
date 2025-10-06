import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  DocumentDuplicateIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import apiClient from '../../api/axios';

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  type: 'markdown' | 'html';
  variables: string[];
  description: string;
  is_active: boolean;
  category: string;
  created_at: string;
  updated_at: string;
}

interface EmailTemplateFormData {
  name: string;
  subject: string;
  body: string;
  type: 'markdown' | 'html';
  variables: string[];
  description: string;
  is_active: boolean;
  category: string;
}

const EmailTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showTest, setShowTest] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testVariables, setTestVariables] = useState<Record<string, string>>({});
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [showVariableSuggestions, setShowVariableSuggestions] = useState(false);
  const [currentVariableIndex, setCurrentVariableIndex] = useState<number | null>(null);

  const [formData, setFormData] = useState<EmailTemplateFormData>({
    name: '',
    subject: '',
    body: '',
    type: 'markdown',
    variables: [],
    description: '',
    is_active: true,
    category: 'general'
  });

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'user', label: 'User Management' },
    { value: 'course', label: 'Course Related' },
    { value: 'workflow', label: 'Workflow Related' },
    { value: 'system', label: 'System Notifications' },
    { value: 'marketing', label: 'Marketing' }
  ];

  const types = [
    { value: 'markdown', label: 'Markdown' },
    { value: 'html', label: 'HTML' }
  ];

  // Comprehensive variable suggestions with descriptions and example values
  const variableSuggestions = [
    // User-related variables
    { 
      name: 'user_name', 
      description: 'User\'s full name', 
      example: 'John Doe',
      category: 'User',
      usage: '{{user_name}}'
    },
    { 
      name: 'user_email', 
      description: 'User\'s email address', 
      example: 'john@example.com',
      category: 'User',
      usage: '{{user_email}}'
    },
    { 
      name: 'user_first_name', 
      description: 'User\'s first name', 
      example: 'John',
      category: 'User',
      usage: '{{user_first_name}}'
    },
    { 
      name: 'user_last_name', 
      description: 'User\'s last name', 
      example: 'Doe',
      category: 'User',
      usage: '{{user_last_name}}'
    },
    
    // Application variables
    { 
      name: 'app_name', 
      description: 'Application name', 
      example: 'Naqash Thaheem',
      category: 'Application',
      usage: '{{app_name}}'
    },
    { 
      name: 'app_url', 
      description: 'Application URL', 
      example: 'https://naqashthaheem.com',
      category: 'Application',
      usage: '{{app_url}}'
    },
    { 
      name: 'login_url', 
      description: 'Login page URL', 
      example: 'https://naqashthaheem.com/login',
      category: 'Application',
      usage: '{{login_url}}'
    },
    
    // Course-related variables
    { 
      name: 'course_title', 
      description: 'Course title', 
      example: 'Advanced React Development',
      category: 'Course',
      usage: '{{course_title}}'
    },
    { 
      name: 'course_description', 
      description: 'Course description', 
      example: 'Learn advanced React concepts and best practices',
      category: 'Course',
      usage: '{{course_description}}'
    },
    { 
      name: 'course_url', 
      description: 'Course URL', 
      example: 'https://naqashthaheem.com/courses/advanced-react',
      category: 'Course',
      usage: '{{course_url}}'
    },
    
    // Workflow-related variables
    { 
      name: 'workflow_title', 
      description: 'Workflow title', 
      example: 'Content Review Process',
      category: 'Workflow',
      usage: '{{workflow_title}}'
    },
    { 
      name: 'workflow_description', 
      description: 'Workflow description', 
      example: 'Automated content review and approval workflow',
      category: 'Workflow',
      usage: '{{workflow_description}}'
    },
    { 
      name: 'workflow_url', 
      description: 'Workflow URL', 
      example: 'https://naqashthaheem.com/workflows/content-review',
      category: 'Workflow',
      usage: '{{workflow_url}}'
    },
    
    // Password reset variables
    { 
      name: 'reset_url', 
      description: 'Password reset URL', 
      example: 'https://naqashthaheem.com/reset-password?token=abc123',
      category: 'Security',
      usage: '{{reset_url}}'
    },
    { 
      name: 'expires_in', 
      description: 'Token expiration time', 
      example: '60 minutes',
      category: 'Security',
      usage: '{{expires_in}}'
    },
    
    // System variables
    { 
      name: 'current_date', 
      description: 'Current date', 
      example: 'January 15, 2024',
      category: 'System',
      usage: '{{current_date}}'
    },
    { 
      name: 'current_time', 
      description: 'Current time', 
      example: '2:30 PM',
      category: 'System',
      usage: '{{current_time}}'
    },
    { 
      name: 'support_email', 
      description: 'Support email address', 
      example: 'support@naqashthaheem.com',
      category: 'System',
      usage: '{{support_email}}'
    }
  ];

  // Group suggestions by category
  const suggestionsByCategory = variableSuggestions.reduce((acc, suggestion) => {
    if (!acc[suggestion.category]) {
      acc[suggestion.category] = [];
    }
    acc[suggestion.category].push(suggestion);
    return acc;
  }, {} as Record<string, typeof variableSuggestions>);

  useEffect(() => {
    fetchTemplates();
  }, [searchTerm, selectedCategory, showActiveOnly]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (showActiveOnly) params.append('active', 'true');

      const response = await apiClient.get(`/admin/email-templates?${params}`);
      setTemplates(response.data.data.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await apiClient.put(`/admin/email-templates/${editingTemplate.id}`, formData);
      } else {
        await apiClient.post('/admin/email-templates', formData);
      }
      
      setShowModal(false);
      setEditingTemplate(null);
      resetForm();
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
      type: template.type,
      variables: template.variables,
      description: template.description,
      is_active: template.is_active,
      category: template.category
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await apiClient.delete(`/admin/email-templates/${id}`);
        fetchTemplates();
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

  const handlePreview = async (template: EmailTemplate) => {
    try {
      const response = await apiClient.get(`/admin/email-templates/${template.id}/preview`);
      setPreviewData(response.data.data);
      setShowPreview(true);
    } catch (error) {
      console.error('Error fetching preview:', error);
    }
  };

  const handleTestTemplate = async () => {
    if (!testEmail) {
      setTestResult({ success: false, message: 'Please enter a test email address' });
      return;
    }

    setTestLoading(true);
    setTestResult(null);

    try {
      const response = await apiClient.post(`/admin/email-templates/${editingTemplate?.id}/test`, {
        test_email: testEmail,
        variables: testVariables
      });

      setTestResult({
        success: response.data.success,
        message: response.data.message || (response.data.success ? 'Test email sent successfully!' : 'Failed to send test email')
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: 'Error sending test email: ' + (error.response?.data?.message || error.message)
      });
    } finally {
      setTestLoading(false);
    }
  };


  const getDefaultVariableValue = (variable: string): string => {
    const defaults: Record<string, string> = {
      user_name: 'John Doe',
      user_email: 'john@example.com',
      app_name: 'Naqash Thaheem',
      app_url: 'https://naqashthaheem.com',
      login_url: 'https://naqashthaheem.com/login',
      reset_url: 'https://naqashthaheem.com/reset-password?token=test123',
      course_title: 'Sample Course',
      course_description: 'This is a sample course description',
      workflow_title: 'Sample Workflow',
      workflow_description: 'This is a sample workflow description',
      expires_in: '60 minutes'
    };
    return defaults[variable] || `Sample ${variable.replace('_', ' ')}`;
  };

  const handleDuplicate = async (template: EmailTemplate) => {
    try {
      await apiClient.post(`/admin/email-templates/${template.id}/duplicate`);
      fetchTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
    }
  };

  const handleToggleStatus = async (template: EmailTemplate) => {
    try {
      await apiClient.post(`/admin/email-templates/${template.id}/toggle-status`);
      fetchTemplates();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      body: '',
      type: 'markdown',
      variables: [],
      description: '',
      is_active: true,
      category: 'general'
    });
  };

  const addVariable = () => {
    setFormData(prev => ({
      ...prev,
      variables: [...prev.variables, '']
    }));
  };

  const updateVariable = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.map((v, i) => i === index ? value : v)
    }));
  };

  const removeVariable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index)
    }));
  };

  const addVariableFromSuggestion = (suggestion: typeof variableSuggestions[0]) => {
    if (currentVariableIndex !== null) {
      // Replace existing variable
      updateVariable(currentVariableIndex, suggestion.name);
    } else {
      // Add new variable
      setFormData(prev => ({
        ...prev,
        variables: [...prev.variables, suggestion.name]
      }));
    }
    setShowVariableSuggestions(false);
    setCurrentVariableIndex(null);
  };

  const openVariableSuggestions = (index?: number) => {
    setCurrentVariableIndex(index ?? null);
    setShowVariableSuggestions(true);
  };

  const insertVariableInBody = (variableName: string) => {
    const textarea = document.querySelector('textarea[name="body"]') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const newText = before + `{{${variableName}}}` + after;
      
      setFormData(prev => ({ ...prev, body: newText }));
      
      // Set cursor position after the inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variableName.length + 4, start + variableName.length + 4);
      }, 0);
    }
    setShowVariableSuggestions(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            New Template
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Active Only
          </label>
        </div>
      </div>

      {/* Templates Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Template
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {templates.map((template) => (
              <tr key={template.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{template.name}</div>
                    <div className="text-sm text-gray-500">{template.subject}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {categories.find(c => c.value === template.category)?.label || template.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {template.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleStatus(template)}
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      template.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {template.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePreview(template)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Preview"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingTemplate(template);
                        setTestEmail('');
                        // Initialize test variables with the template's variables
                        const variables: Record<string, string> = {};
                        template.variables.forEach(variable => {
                          if (variable.trim()) {
                            variables[variable] = getDefaultVariableValue(variable);
                          }
                        });
                        setTestVariables(variables);
                        setShowTest(true);
                      }}
                      className="text-purple-600 hover:text-purple-900"
                      title="Test Template"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEdit(template)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Edit"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(template)}
                      className="text-green-600 hover:text-green-900"
                      title="Duplicate"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'markdown' | 'html' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {types.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Active
                    </label>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Variables
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openVariableSuggestions()}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                      >
                        📋 Browse Variables
                      </button>
                      <button
                        type="button"
                        onClick={addVariable}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                      >
                        ➕ Add Custom
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {formData.variables.map((variable, index) => {
                      const suggestion = variableSuggestions.find(s => s.name === variable);
                      return (
                        <div key={index} className="flex gap-2 items-center">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={variable}
                              onChange={(e) => updateVariable(index, e.target.value)}
                              placeholder="Variable name (e.g., user_name)"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {suggestion && (
                              <div className="mt-1 text-xs text-gray-500">
                                <span className="font-medium">{suggestion.description}</span>
                                {suggestion.example && (
                                  <span className="ml-2">Example: {suggestion.example}</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => openVariableSuggestions(index)}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              title="Browse suggestions"
                            >
                              📋
                            </button>
                            <button
                              type="button"
                              onClick={() => removeVariable(index)}
                              className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                              title="Remove variable"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>💡 Tip:</strong> Use variables in your email body like this: <code className="bg-white px-1 rounded">{`{{variable_name}}`}</code>
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowVariableSuggestions(true)}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Click here to insert variables directly into your email body
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Body
                  </label>
                  <textarea
                    value={formData.body}
                    onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={10}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Use variables like {`{{variable_name}}`} in your template
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingTemplate(null);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  {editingTemplate && (
                    <button
                      type="button"
                      onClick={() => {
                        setTestEmail('');
                        // Initialize test variables with the template's variables
                        const variables: Record<string, string> = {};
                        editingTemplate.variables.forEach(variable => {
                          if (variable.trim()) {
                            variables[variable] = getDefaultVariableValue(variable);
                          }
                        });
                        setTestVariables(variables);
                        setShowTest(true);
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                      Test Template
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingTemplate ? 'Update' : 'Create'} Template
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && previewData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Email Preview</h3>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="mb-4">
                  <strong>Subject:</strong> {previewData.subject}
                </div>
                <div className="prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: previewData.body }} />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Template Modal */}
      {showTest && editingTemplate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Test Template: {editingTemplate.name}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Email Address
                  </label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="Enter email address to send test to"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {Object.keys(testVariables).length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Test Variables
                    </label>
                    <div className="space-y-2">
                      {Object.entries(testVariables).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <label className="w-32 text-sm text-gray-600 py-2">
                            {key}:
                          </label>
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => setTestVariables(prev => ({
                              ...prev,
                              [key]: e.target.value
                            }))}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {testResult && (
                  <div className={`p-3 rounded-md ${
                    testResult.success 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {testResult.message}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowTest(false);
                      setTestResult(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTestTemplate}
                    disabled={testLoading || !testEmail}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {testLoading ? 'Sending...' : 'Send Test Email'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Variable Suggestions Modal */}
      {showVariableSuggestions && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Variable Suggestions
                </h3>
                <button
                  onClick={() => {
                    setShowVariableSuggestions(false);
                    setCurrentVariableIndex(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  {currentVariableIndex !== null 
                    ? 'Select a variable to replace the current one:'
                    : 'Select a variable to add to your template:'
                  }
                </p>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {Object.entries(suggestionsByCategory).map(([category, suggestions]) => (
                  <div key={category} className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-1">
                      {category}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {suggestions.map((suggestion) => (
                        <div
                          key={suggestion.name}
                          className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => addVariableFromSuggestion(suggestion)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <code className="text-sm font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {suggestion.usage}
                                </code>
                                <span className="text-xs text-gray-500">
                                  {suggestion.name}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mb-2">
                                {suggestion.description}
                              </p>
                              {suggestion.example && (
                                <p className="text-xs text-gray-500">
                                  <strong>Example:</strong> {suggestion.example}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                insertVariableInBody(suggestion.name);
                              }}
                              className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                              title="Insert into email body"
                            >
                              Insert
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowVariableSuggestions(false);
                    setCurrentVariableIndex(null);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplates;
