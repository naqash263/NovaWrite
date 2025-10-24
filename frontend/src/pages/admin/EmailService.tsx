import React, { useState, useEffect } from 'react';
import { useSEO } from '../../utils/seo';
import apiClient from '../../api/axios';
import Select from 'react-select';

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  description: string;
  category: string;
  type: string;
  language: string;
  is_active: boolean;
  is_system: boolean;
  variables: string[];
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  instructor: string;
  duration: string;
  price: string;
}

interface Workflow {
  id: number;
  title: string;
  description: string;
  category: string;
  type: string;
  author: string;
  steps: number;
  difficulty: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  author: string;
  category: string;
  published_at: string;
  read_time: string;
}

interface SmtpConfiguration {
  id: number;
  name: string;
  host: string;
  port: number;
  from_address: string;
  from_name: string;
  is_active: boolean;
  is_default: boolean;
}

interface EmailServiceProps {}

const EmailService: React.FC<EmailServiceProps> = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [smtpConfigurations, setSmtpConfigurations] = useState<SmtpConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedSmtpConfig, setSelectedSmtpConfig] = useState<SmtpConfiguration | null>(null);
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({});
  const [previewData, setPreviewData] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  useSEO({
    title: 'Email Service - Admin Dashboard',
    description: 'Send emails using templates with real system data',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [templatesRes, dataRes, smtpRes] = await Promise.all([
        apiClient.get('/admin/email-templates'),
        apiClient.get('/email-service/available-data'),
        apiClient.get('/admin/smtp-configurations'),
      ]);

      setTemplates(templatesRes.data.data || []);
      setUsers(dataRes.data.data.users || []);
      setCourses(dataRes.data.data.courses || []);
      setWorkflows(dataRes.data.data.workflows || []);
      setPosts(dataRes.data.data.posts || []);
      setSmtpConfigurations(smtpRes.data.data || []);
      
      // Set the active SMTP configuration as default
      const activeSmtp = smtpRes.data.data?.find((config: SmtpConfiguration) => config.is_active);
      if (activeSmtp) {
        setSelectedSmtpConfig(activeSmtp);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = async () => {
    if (!selectedTemplate || !selectedUser) return;

    try {
      const response = await apiClient.post('/email-service/preview-real-data', {
        template_name: selectedTemplate.name,
        user_id: selectedUser.id,
        course_id: selectedCourse?.id || null,
        workflow_id: selectedWorkflow?.id || null,
        post_id: selectedPost?.id || null,
        custom_variables: customVariables,
      });
      
      if (response.data.success) {
        setPreviewData(response.data);
      } else {
        setError(response.data.message || 'Failed to generate preview');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate preview');
    }
  };


  const sendEmail = async () => {
    if (!selectedTemplate || !selectedUser) {
      setError('Please select a template and user');
      return;
    }

    try {
      setSending(true);
      setSendResult(null);
      
      const response = await apiClient.post('/email-service/send-real-data', {
        template_name: selectedTemplate.name,
        user_id: selectedUser.id,
        course_id: selectedCourse?.id || null,
        workflow_id: selectedWorkflow?.id || null,
        post_id: selectedPost?.id || null,
        custom_variables: customVariables,
        smtp_config_id: selectedSmtpConfig?.id || null,
      });

      if (response.data.success) {
        setSendResult('Email sent successfully!');
      } else {
        setError(response.data.message || 'Failed to send email');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const addCustomVariable = () => {
    const key = prompt('Enter variable name (without {{}}):');
    const value = prompt('Enter variable value:');
    
    if (key && value) {
      setCustomVariables(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading email service...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <style>{`
        .react-select-container .react-select__control {
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          min-height: 42px;
        }
        .react-select-container .react-select__control:hover {
          border-color: #9ca3af;
        }
        .react-select-container .react-select__control--is-focused {
          border-color: #3b82f6;
          box-shadow: 0 0 0 1px #3b82f6;
        }
        .react-select-container .react-select__placeholder {
          color: #6b7280;
        }
        .react-select-container .react-select__single-value {
          color: #374151;
        }
        .react-select-container .react-select__input-container {
          color: #374151;
        }
        .react-select-container .react-select__menu {
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .react-select-container .react-select__option {
          color: #374151;
        }
        .react-select-container .react-select__option--is-focused {
          background-color: #f3f4f6;
        }
        .react-select-container .react-select__option--is-selected {
          background-color: #3b82f6;
          color: white;
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Email Service</h1>
            <p className="mt-1 text-sm text-gray-600">
              Send emails using templates with real system data
            </p>
          </div>

          {error && (
            <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-md p-4">
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

          {sendResult && (
            <div className="mx-6 mt-4 bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM16.707 7.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Success</h3>
                  <div className="mt-2 text-sm text-green-700">{sendResult}</div>
                </div>
              </div>
            </div>
          )}

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Configuration */}
              <div className="space-y-6">
                {/* Template Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Email Template
                  </label>
                  <Select
                    value={selectedTemplate ? {
                      value: selectedTemplate.id,
                      label: `${selectedTemplate.name} (${selectedTemplate.category})`
                    } : null}
                    onChange={(option) => {
                      if (option) {
                        const template = templates.find(t => t.id === option.value);
                        setSelectedTemplate(template || null);
                        console.log('Selected template:', template);
                      } else {
                        setSelectedTemplate(null);
                      }
                    }}
                    options={templates.map(template => ({
                      value: template.id,
                      label: `${template.name} (${template.category})`
                    }))}
                    placeholder="Choose a template..."
                    isSearchable
                    isClearable
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>

                {/* User Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select User
                  </label>
                  <Select
                    value={selectedUser ? {
                      value: selectedUser.id,
                      label: `${selectedUser.name} (${selectedUser.email})`
                    } : null}
                    onChange={(option) => {
                      if (option) {
                        const user = users.find(u => u.id === option.value);
                        setSelectedUser(user || null);
                        console.log('Selected user:', user);
                      } else {
                        setSelectedUser(null);
                      }
                    }}
                    options={users.map(user => ({
                      value: user.id,
                      label: `${user.name} (${user.email})`
                    }))}
                    placeholder="Choose a user..."
                    isSearchable
                    isClearable
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>

                {/* SMTP Configuration Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select SMTP Configuration (Optional)
                  </label>
                  <Select
                    value={selectedSmtpConfig ? {
                      value: selectedSmtpConfig.id,
                      label: `${selectedSmtpConfig.name} (${selectedSmtpConfig.from_address})`
                    } : null}
                    onChange={(option) => {
                      if (option) {
                        const config = smtpConfigurations.find(c => c.id === option.value);
                        setSelectedSmtpConfig(config || null);
                        console.log('Selected SMTP config:', config);
                      } else {
                        setSelectedSmtpConfig(null);
                      }
                    }}
                    options={smtpConfigurations.map(config => ({
                      value: config.id,
                      label: `${config.name} (${config.from_address})`
                    }))}
                    placeholder="Use active SMTP configuration"
                    isSearchable
                    isClearable
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {selectedSmtpConfig ? 
                      `Will send from: ${selectedSmtpConfig.from_name} <${selectedSmtpConfig.from_address}>` : 
                      'Will use the active SMTP configuration'
                    }
                  </p>
                </div>

                {/* Course Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Course (Optional)
                  </label>
                  <select
                    value={selectedCourse?.id || ''}
                    onChange={(e) => {
                      const course = courses.find(c => c.id === parseInt(e.target.value));
                      setSelectedCourse(course || null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No course selected</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Workflow Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Workflow (Optional)
                  </label>
                  <select
                    value={selectedWorkflow?.id || ''}
                    onChange={(e) => {
                      const workflow = workflows.find(w => w.id === parseInt(e.target.value));
                      setSelectedWorkflow(workflow || null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No workflow selected</option>
                    {workflows.map(workflow => (
                      <option key={workflow.id} value={workflow.id}>
                        {workflow.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Post Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Blog Post (Optional)
                  </label>
                  <select
                    value={selectedPost?.id || ''}
                    onChange={(e) => {
                      const post = posts.find(p => p.id === parseInt(e.target.value));
                      setSelectedPost(post || null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No post selected</option>
                    {posts.map(post => (
                      <option key={post.id} value={post.id}>
                        {post.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Variables */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Custom Variables
                    </label>
                    <button
                      onClick={addCustomVariable}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Variable
                    </button>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(customVariables).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-600 w-20">
                          {`{{${key}}}`}:
                        </span>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => setCustomVariables(prev => ({
                            ...prev,
                            [key]: e.target.value
                          }))}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                        <button
                          onClick={() => {
                            const newVars = { ...customVariables };
                            delete newVars[key];
                            setCustomVariables(newVars);
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    onClick={generatePreview}
                    disabled={!selectedTemplate}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Generate Preview
                  </button>
                  <button
                    onClick={sendEmail}
                    disabled={!selectedTemplate || !selectedUser || sending}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {sending ? 'Sending...' : 'Send Email'}
                  </button>
                </div>
              </div>

              {/* Right Column - Preview */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Email Preview</h3>
                
                {previewData ? (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Subject:</h4>
                      <p className="text-sm text-gray-900">{previewData.preview.subject}</p>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Body:</h4>
                      <div 
                        className="text-sm text-gray-900 prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: previewData.preview.body }}
                      />
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Variables Used:</h4>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(previewData.variables) ? previewData.variables.map((variable: string) => (
                          <span
                            key={variable}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                          >
                            {`{{${variable}}}`}
                          </span>
                        )) : (
                          <span className="text-sm text-gray-500">No variables detected</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="mt-2">Select a template and generate preview to see the email content</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailService;
