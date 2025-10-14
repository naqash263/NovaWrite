import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  PlayIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { useToast } from '../../hooks/use-toast';
import { useConfirm } from '../../hooks/use-confirm';
import apiClient from '../../api/axios';

interface SmtpConfiguration {
  id: number;
  name: string;
  mailer: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  encryption: string | null;
  from_address: string;
  from_name: string;
  is_active: boolean;
  is_default: boolean;
  description: string | null;
  last_tested_at: string | null;
  test_successful: boolean | null;
  test_error: string | null;
  created_at: string;
  updated_at: string;
}

interface SmtpConfigurationFormData {
  name: string;
  mailer: string;
  host: string;
  port: number;
  username: string;
  password: string;
  encryption: string | null;
  from_address: string;
  from_name: string;
  is_active: boolean;
  is_default: boolean;
  description: string;
}

const SmtpConfigurations: React.FC = () => {
  const { addToast } = useToast();
  const { confirm } = useConfirm();
  const [configurations, setConfigurations] = useState<SmtpConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConfiguration, setEditingConfiguration] = useState<SmtpConfiguration | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [testingConfig, setTestingConfig] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [formData, setFormData] = useState<SmtpConfigurationFormData>({
    name: '',
    mailer: 'smtp',
    host: '',
    port: 587,
    username: '',
    password: '',
    encryption: 'tls',
    from_address: '',
    from_name: 'NovaWrite',
    is_active: false,
    is_default: false,
    description: ''
  });

  const mailerTypes = [
    { value: 'smtp', label: 'SMTP' },
    { value: 'sendmail', label: 'Sendmail' },
    { value: 'mailgun', label: 'Mailgun' },
    { value: 'ses', label: 'Amazon SES' },
    { value: 'postmark', label: 'Postmark' },
    { value: 'resend', label: 'Resend' }
  ];

  const encryptionTypes = [
    { value: null, label: 'None' },
    { value: 'tls', label: 'TLS' },
    { value: 'ssl', label: 'SSL' }
  ];

  const commonPorts = [
    { value: 25, label: '25 (Standard)' },
    { value: 587, label: '587 (TLS)' },
    { value: 465, label: '465 (SSL)' },
    { value: 2525, label: '2525 (Alternative)' }
  ];

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/smtp-configurations');
      setConfigurations(response.data.data || []);
    } catch (error) {
      console.error('Error fetching configurations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingConfiguration) {
        await apiClient.put(`/admin/smtp-configurations/${editingConfiguration.id}`, formData);
      } else {
        await apiClient.post('/admin/smtp-configurations', formData);
      }
      setShowModal(false);
      setEditingConfiguration(null);
      resetForm();
      fetchConfigurations();
    } catch (error) {
      console.error('Error saving configuration:', error);
    }
  };

  const handleEdit = (configuration: SmtpConfiguration) => {
    setEditingConfiguration(configuration);
    setFormData({
      name: configuration.name,
      mailer: configuration.mailer,
      host: configuration.host,
      port: configuration.port,
      username: configuration.username,
      password: '', // Don't show existing password
      encryption: configuration.encryption,
      from_address: configuration.from_address,
      from_name: configuration.from_name,
      is_active: configuration.is_active,
      is_default: configuration.is_default,
      description: configuration.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: 'Delete SMTP Configuration',
      message: 'Are you sure you want to delete this SMTP configuration?',
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    
    if (confirmed) {
      try {
        await apiClient.delete(`/admin/smtp-configurations/${id}`);
        fetchConfigurations();
      } catch (error: any) {
        addToast({
          type: 'error',
          title: 'Delete Failed',
          description: error.response?.data?.message || 'Failed to delete configuration',
          duration: 5000
        });
      }
    }
  };

  const handleTest = async (configuration: SmtpConfiguration) => {
    try {
      setTestingConfig(configuration.id);
      setTestResult(null);

      // For now, use the from_address as test email
      // TODO: Implement a proper input dialog
      const testEmail = configuration.from_address;
      if (!testEmail) {
        addToast({
          type: 'warning',
          title: 'No Email Address',
          description: 'Please set a from address before testing.',
          duration: 5000
        });
        return;
      }

      const response = await apiClient.post(`/admin/smtp-configurations/${configuration.id}/test`, { 
        test_email: testEmail 
      });

      setTestResult(response.data);
      
      if (response.data.success) {
        fetchConfigurations(); // Refresh to get updated test results
      }
    } catch (error) {
      console.error('Error testing configuration:', error);
      setTestResult({ success: false, message: 'Test failed: ' + error });
    } finally {
      setTestingConfig(null);
    }
  };

  const handleSetActive = async (id: number) => {
    try {
      await apiClient.post(`/admin/smtp-configurations/${id}/set-active`);
      fetchConfigurations();
    } catch (error) {
      console.error('Error setting active:', error);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await apiClient.post(`/admin/smtp-configurations/${id}/set-default`);
      fetchConfigurations();
    } catch (error) {
      console.error('Error setting default:', error);
    }
  };

  const handleDuplicate = async (configuration: SmtpConfiguration) => {
    try {
      await apiClient.post(`/admin/smtp-configurations/${configuration.id}/duplicate`);
      fetchConfigurations();
    } catch (error) {
      console.error('Error duplicating configuration:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      mailer: 'smtp',
      host: '',
      port: 587,
      username: '',
      password: '',
      encryption: 'tls',
      from_address: '',
      from_name: 'NovaWrite',
      is_active: false,
      is_default: false,
      description: ''
    });
  };

  const getStatusIcon = (configuration: SmtpConfiguration) => {
    if (configuration.test_successful === true) {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" title="Test successful" />;
    } else if (configuration.test_successful === false) {
      return <XCircleIcon className="h-5 w-5 text-red-500" title="Test failed" />;
    } else {
      return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" title="Not tested" />;
    }
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
          <h1 className="text-2xl font-bold text-gray-900">SMTP Configurations</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            New Configuration
          </button>
        </div>

        {testResult && (
          <div className={`mb-4 p-4 rounded-lg ${
            testResult.success 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircleIcon className="h-5 w-5" />
              ) : (
                <XCircleIcon className="h-5 w-5" />
              )}
              <span className="font-medium">
                {testResult.success ? 'Test Successful' : 'Test Failed'}
              </span>
            </div>
            <p className="mt-1">{testResult.message}</p>
          </div>
        )}
      </div>

      {/* Configurations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Configuration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Host
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Test Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {configurations.map((configuration) => (
              <tr key={configuration.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      {configuration.name}
                      {configuration.is_active && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Active
                        </span>
                      )}
                      {configuration.is_default && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">{configuration.from_address}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{configuration.host}:{configuration.port}</div>
                  <div className="text-sm text-gray-500">{configuration.mailer}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    {!configuration.is_active && (
                      <button
                        onClick={() => handleSetActive(configuration.id)}
                        className="text-green-600 hover:text-green-900 text-sm"
                      >
                        Set Active
                      </button>
                    )}
                    {!configuration.is_default && (
                      <button
                        onClick={() => handleSetDefault(configuration.id)}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        Set Default
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(configuration)}
                    <div className="text-sm text-gray-500">
                      {configuration.last_tested_at 
                        ? new Date(configuration.last_tested_at).toLocaleDateString()
                        : 'Never tested'
                      }
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTest(configuration)}
                      disabled={testingConfig === configuration.id}
                      className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                      title="Test Configuration"
                    >
                      {testingConfig === configuration.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      ) : (
                        <PlayIcon className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(configuration)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Edit"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(configuration)}
                      className="text-green-600 hover:text-green-900"
                      title="Duplicate"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(configuration.id)}
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
                {editingConfiguration ? 'Edit SMTP Configuration' : 'Create New SMTP Configuration'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Configuration Name
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
                      Mailer Type
                    </label>
                    <select
                      value={formData.mailer}
                      onChange={(e) => setFormData(prev => ({ ...prev, mailer: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {mailerTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP Host
                    </label>
                    <input
                      type="text"
                      value={formData.host}
                      onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Port
                    </label>
                    <select
                      value={formData.port}
                      onChange={(e) => setFormData(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {commonPorts.map(port => (
                        <option key={port.value} value={port.value}>{port.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Encryption
                    </label>
                    <select
                      value={formData.encryption || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, encryption: e.target.value || null }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {encryptionTypes.map(type => (
                        <option key={type.value || 'none'} value={type.value || ''}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.from_address}
                      onChange={(e) => setFormData(prev => ({ ...prev, from_address: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Name
                    </label>
                    <input
                      type="text"
                      value={formData.from_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, from_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
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

                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Set as Active
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_default}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Set as Default
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingConfiguration(null);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingConfiguration ? 'Update' : 'Create'} Configuration
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmtpConfigurations;
