import React, { useState, useEffect } from 'react';
import { useSEO } from '../../utils/seo';
import apiClient from '../../api/axios';
import Select from 'react-select';

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

interface SystemEmailSettings {
  password_reset_smtp_id: number | null;
  welcome_email_smtp_id: number | null;
  notification_smtp_id: number | null;
  default_smtp_id: number | null;
}

const SystemEmailSettings: React.FC = () => {
  const [smtpConfigurations, setSmtpConfigurations] = useState<SmtpConfiguration[]>([]);
  const [settings, setSettings] = useState<SystemEmailSettings>({
    password_reset_smtp_id: null,
    welcome_email_smtp_id: null,
    notification_smtp_id: null,
    default_smtp_id: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useSEO({
    title: 'System Email Settings - Admin Dashboard',
    description: 'Configure SMTP settings for system emails',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [smtpRes, settingsRes] = await Promise.all([
        apiClient.get('/admin/smtp-configurations'),
        apiClient.get('/admin/system-email-settings'),
      ]);

      setSmtpConfigurations(smtpRes.data.data || []);
      setSettings(settingsRes.data.data || {
        password_reset_smtp_id: null,
        welcome_email_smtp_id: null,
        notification_smtp_id: null,
        default_smtp_id: null,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 10000); // 10 second timeout

      const response = await apiClient.post('/admin/system-email-settings', settings, {
        signal: controller.signal,
        timeout: 10000
      });

      clearTimeout(timeoutId);
      setSuccess('System email settings saved successfully!');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Please check your connection and try again.');
      } else {
        setError(err.response?.data?.message || 'Failed to save settings');
      }
    } finally {
      setSaving(false);
    }
  };

  const getSmtpOption = (smtpId: number | null) => {
    if (!smtpId) return null;
    const config = smtpConfigurations.find(c => c.id === smtpId);
    return config ? {
      value: config.id,
      label: `${config.name} (${config.from_address})`
    } : null;
  };

  const handleSmtpChange = (field: keyof SystemEmailSettings, option: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: option ? option.value : null
    }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx="true">{`
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
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">System Email Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Configure which SMTP configuration to use for different types of system emails
          </p>
        </div>

        <div className="p-4 sm:p-6">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                {success}
              </div>
            )}

            <div className="space-y-8">
              {/* Password Reset Emails */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="text-2xl mr-3">🔐</span>
                  Password Reset Emails
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Choose which SMTP configuration to use when sending password reset emails to users.
                </p>
                <div className="max-w-md">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Configuration
                  </label>
                  <Select
                    value={getSmtpOption(settings.password_reset_smtp_id)}
                    onChange={(option) => handleSmtpChange('password_reset_smtp_id', option)}
                    options={smtpConfigurations.map(config => ({
                      value: config.id,
                      label: `${config.name} (${config.from_address})`
                    }))}
                    placeholder="Use default SMTP configuration"
                    isSearchable
                    isClearable
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {settings.password_reset_smtp_id ? 
                      `Will send from: ${smtpConfigurations.find(c => c.id === settings.password_reset_smtp_id)?.from_name} <${smtpConfigurations.find(c => c.id === settings.password_reset_smtp_id)?.from_address}>` : 
                      'Will use the default SMTP configuration'
                    }
                  </p>
                </div>
              </div>

              {/* Welcome Emails */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="text-2xl mr-3">👋</span>
                  Welcome Emails
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Choose which SMTP configuration to use when sending welcome emails to new users.
                </p>
                <div className="max-w-md">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Configuration
                  </label>
                  <Select
                    value={getSmtpOption(settings.welcome_email_smtp_id)}
                    onChange={(option) => handleSmtpChange('welcome_email_smtp_id', option)}
                    options={smtpConfigurations.map(config => ({
                      value: config.id,
                      label: `${config.name} (${config.from_address})`
                    }))}
                    placeholder="Use default SMTP configuration"
                    isSearchable
                    isClearable
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {settings.welcome_email_smtp_id ? 
                      `Will send from: ${smtpConfigurations.find(c => c.id === settings.welcome_email_smtp_id)?.from_name} <${smtpConfigurations.find(c => c.id === settings.welcome_email_smtp_id)?.from_address}>` : 
                      'Will use the default SMTP configuration'
                    }
                  </p>
                </div>
              </div>

              {/* Notification Emails */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="text-2xl mr-3">🔔</span>
                  Notification Emails
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Choose which SMTP configuration to use when sending notification emails (course updates, workflow notifications, etc.).
                </p>
                <div className="max-w-md">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Configuration
                  </label>
                  <Select
                    value={getSmtpOption(settings.notification_smtp_id)}
                    onChange={(option) => handleSmtpChange('notification_smtp_id', option)}
                    options={smtpConfigurations.map(config => ({
                      value: config.id,
                      label: `${config.name} (${config.from_address})`
                    }))}
                    placeholder="Use default SMTP configuration"
                    isSearchable
                    isClearable
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {settings.notification_smtp_id ? 
                      `Will send from: ${smtpConfigurations.find(c => c.id === settings.notification_smtp_id)?.from_name} <${smtpConfigurations.find(c => c.id === settings.notification_smtp_id)?.from_address}>` : 
                      'Will use the default SMTP configuration'
                    }
                  </p>
                </div>
              </div>

              {/* Default SMTP */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="text-2xl mr-3">⚙️</span>
                  Default SMTP Configuration
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  This will be used for any system emails that don't have a specific SMTP configuration assigned.
                </p>
                <div className="max-w-md">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Configuration
                  </label>
                  <Select
                    value={getSmtpOption(settings.default_smtp_id)}
                    onChange={(option) => handleSmtpChange('default_smtp_id', option)}
                    options={smtpConfigurations.map(config => ({
                      value: config.id,
                      label: `${config.name} (${config.from_address})`
                    }))}
                    placeholder="Select default SMTP configuration"
                    isSearchable
                    isClearable
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {settings.default_smtp_id ? 
                      `Default sender: ${smtpConfigurations.find(c => c.id === settings.default_smtp_id)?.from_name} <${smtpConfigurations.find(c => c.id === settings.default_smtp_id)?.from_address}>` : 
                      'No default SMTP configuration selected'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 sm:justify-between">
              <button
                onClick={async () => {
                  try {
                    console.log('Testing health endpoint...');
                    const response = await apiClient.get('/admin/system-email-settings/health');
                    console.log('Health check response:', response.data);
                    setSuccess('Health check successful!');
                  } catch (err) {
                    console.error('Health check failed:', err);
                    setError('Health check failed: ' + (err.response?.data?.message || err.message));
                  }
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center justify-center space-x-2"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Test Connection</span>
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Save Settings</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SystemEmailSettings;
