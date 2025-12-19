import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Play, TestTube, CheckCircle, XCircle, Loader2 } from 'lucide-react';
// REMOVE: import { Tabs, Tab } from '@material-ui/core';

interface N8nConfiguration {
  id: number;
  name: string;
  webhook_url: string;
  webhook_timeout: number;
  max_retry_attempts: number;
  is_active: boolean;
  gemini_fallback_enabled?: boolean;
  gemini_webhook_url?: string;
  gemini_fallback_timeout?: number;
  gemini_fallback_retry_attempts?: number;
  created_at: string;
  updated_at: string;
}

interface FallbackWebhook {
  id: number;
  url: string;
  description?: string;
  is_active: boolean;
}

interface FallbackEmail {
  id: number;
  action: string;
  recipient_email: string;
  recipient_name: string;
  details: any;
  status: string;
  last_error?: string;
  attempts: number;
  created_at: string;
}

const N8nConfigurations: React.FC = () => {
  const [configurations, setConfigurations] = useState<N8nConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<N8nConfiguration | null>(null);
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    webhook_url: '',
    webhook_timeout: 30,
    max_retry_attempts: 3,
    gemini_fallback_enabled: false,
    gemini_webhook_url: '',
    gemini_fallback_timeout: 60,
    gemini_fallback_retry_attempts: 2
  });
  // Fallback Webhook state
  const [fallbackWebhooks, setFallbackWebhooks] = useState<FallbackWebhook[]>([]);
  const [webhookForm, setWebhookForm] = useState<{id?: number; url: string; description: string}>({ url: '', description: '' });
  const [webhookEditId, setWebhookEditId] = useState<number | null>(null);
  const [webhookLoading, setWebhookLoading] = useState<boolean>(false);
  // Fallback Notification
  const [autoNotify, setAutoNotify] = useState(false);
  // Failed/unsent email state
  const [failedEmails, setFailedEmails] = useState<FallbackEmail[]>([]);
  const [failedLoading, setFailedLoading] = useState(false);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    fetchConfigurations();
    fetchFallbackWebhooks();
    fetchAutoNotify();
    fetchFailedEmails();
  }, []);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchConfigurations = async () => {
    try {
      const response = await fetch('/api/admin/n8n-configurations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setConfigurations(data.data);
      } else {
        showNotification('error', 'Failed to fetch configurations');
      }
    } catch (error) {
      console.error('Error fetching configurations:', error);
      showNotification('error', 'Error fetching configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingConfig 
        ? `/api/admin/n8n-configurations/${editingConfig.id}`
        : '/api/admin/n8n-configurations';
      
      const method = editingConfig ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      if (data.success) {
        setShowModal(false);
        setEditingConfig(null);
        setFormData({ 
          name: '', 
          webhook_url: '', 
          webhook_timeout: 30, 
          max_retry_attempts: 3,
          gemini_fallback_enabled: false,
          gemini_webhook_url: '',
          gemini_fallback_timeout: 60,
          gemini_fallback_retry_attempts: 2
        });
        fetchConfigurations();
      } else {
        alert(data.message || 'Error saving configuration');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('Error saving configuration');
    }
  };

  const handleEdit = (config: N8nConfiguration) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      webhook_url: config.webhook_url,
      webhook_timeout: config.webhook_timeout,
      max_retry_attempts: config.max_retry_attempts,
      gemini_fallback_enabled: config.gemini_fallback_enabled ?? false,
      gemini_webhook_url: config.gemini_webhook_url ?? '',
      gemini_fallback_timeout: config.gemini_fallback_timeout ?? 60,
      gemini_fallback_retry_attempts: config.gemini_fallback_retry_attempts ?? 2
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return;
    
    try {
      const response = await fetch(`/api/admin/n8n-configurations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        fetchConfigurations();
      } else {
        alert(data.message || 'Error deleting configuration');
      }
    } catch (error) {
      console.error('Error deleting configuration:', error);
      alert('Error deleting configuration');
    }
  };

  const handleActivate = async (id: number) => {
    setLoadingStates(prev => ({ ...prev, [`activate-${id}`]: true }));
    
    try {
      const response = await fetch(`/api/admin/n8n-configurations/${id}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        showNotification('success', 'Configuration activated successfully');
        // Force refresh and wait for it to complete
        await fetchConfigurations();
        // Reset loading state after UI updates
        setTimeout(() => {
          setLoadingStates(prev => ({ ...prev, [`activate-${id}`]: false }));
        }, 100);
      } else {
        showNotification('error', data.message || 'Error activating configuration');
        setLoadingStates(prev => ({ ...prev, [`activate-${id}`]: false }));
      }
    } catch (error) {
      console.error('Error activating configuration:', error);
      showNotification('error', 'Error activating configuration');
      setLoadingStates(prev => ({ ...prev, [`activate-${id}`]: false }));
    }
  };

  const handleDeactivate = async (id: number) => {
    const confirmed = window.confirm('Are you sure you want to deactivate this configuration? This will disable all email sending.');
    if (!confirmed) {
      return;
    }
    
    setLoadingStates(prev => ({ ...prev, [`deactivate-${id}`]: true }));
    
    try {
      const response = await fetch(`/api/admin/n8n-configurations/${id}/deactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        showNotification('success', 'Configuration deactivated successfully');
        // Force refresh and wait for it to complete
        await fetchConfigurations();
        // Reset loading state after UI updates
        setTimeout(() => {
          setLoadingStates(prev => ({ ...prev, [`deactivate-${id}`]: false }));
        }, 100);
      } else {
        showNotification('error', data.message || 'Error deactivating configuration');
        setLoadingStates(prev => ({ ...prev, [`deactivate-${id}`]: false }));
      }
    } catch (error) {
      console.error('Error deactivating configuration:', error);
      showNotification('error', 'Error deactivating configuration');
      setLoadingStates(prev => ({ ...prev, [`deactivate-${id}`]: false }));
    }
  };

  const handleTest = async (id: number) => {
    setLoadingStates(prev => ({ ...prev, [`test-${id}`]: true }));
    
    try {
      const response = await fetch(`/api/admin/n8n-configurations/${id}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        showNotification('success', data.message || 'Connection test successful');
      } else {
        showNotification('error', data.message || 'Connection test failed');
      }
    } catch (error) {
      console.error('Error testing configuration:', error);
      showNotification('error', 'Error testing configuration');
    } finally {
      // Reset loading state after a delay
      setTimeout(() => {
        setLoadingStates(prev => ({ ...prev, [`test-${id}`]: false }));
      }, 500);
    }
  };

  // Fallback Webhook fetching
  const fetchFallbackWebhooks = async () => {
    setWebhookLoading(true);
    try {
      const res = await fetch('/api/admin/fallback-webhooks', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`} });
      const data = await res.json();
      if (data.success) setFallbackWebhooks(data.data);
    } finally { setWebhookLoading(false); }
  };

  // Create or update webhook
  const handleWebhookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWebhookLoading(true);
    const method = webhookEditId ? 'PUT' : 'POST';
    const url = webhookEditId ? `/api/admin/fallback-webhooks/${webhookEditId}` : '/api/admin/fallback-webhooks';
    try {
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ ...webhookForm, is_active: true })
      });
      const data = await res.json();
      if (data.success) {
        setWebhookForm({ url: '', description: '' }); setWebhookEditId(null);
        fetchFallbackWebhooks();
        showNotification('success', webhookEditId ? 'Webhook updated' : 'Webhook created');
      } else showNotification('error', data.message || 'Error');
    } finally { setWebhookLoading(false); }
  };
  // Edit webhook
  const webhookStartEdit = (w: FallbackWebhook) => {
    setWebhookEditId(w.id);
    setWebhookForm({ url: w.url, description: w.description || '' });
  };
  // Delete webhook
  const webhookDelete = async(id:number) => {
    if (!window.confirm('Delete this webhook?')) return;
    setWebhookLoading(true);
    const res = await fetch(`/api/admin/fallback-webhooks/${id}`, {method:'DELETE', headers:{'Authorization': `Bearer ${localStorage.getItem('token')}`}});
    const data = await res.json();
    if (data.success) { fetchFallbackWebhooks(); showNotification('success','Deleted!'); }
    setWebhookLoading(false);
  }

  // Auto-notify toggle
  const fetchAutoNotify = async () => {
    const n8nRes = await fetch('/api/admin/n8n-configurations', {headers:{'Authorization':`Bearer ${localStorage.getItem('token')}`}});
    const n8nData = await n8nRes.json();
    if (n8nData.success) {
      const active = n8nData.data.find((n: any) => n.is_active);
      setAutoNotify(active?.auto_notify_on_failure ?? false);
    }
  };
  const handleAutoNotifyChange = async (val: boolean) => {
    const n8nRes = await fetch('/api/admin/n8n-configurations', {headers:{'Authorization':`Bearer ${localStorage.getItem('token')}`}});
    const n8nData = await n8nRes.json();
    const active = n8nData.success ? n8nData.data.find((n: any) => n.is_active) : null;
    if (!active) return;
    const res = await fetch('/api/admin/fallback-notifications/toggle-auto', {
      method:'POST',
      headers: {'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ config_id: active.id, auto_notify_on_failure: val })
    });
    const data = await res.json();
    if (data.success) { setAutoNotify(val); showNotification('success', 'Auto-notify updated'); }
  };
  // Manual notify
  const handleNotifyNow = async () => {
    const res = await fetch('/api/admin/fallback-notifications/notify-now', {method:'POST',headers:{'Authorization':`Bearer ${localStorage.getItem('token')}`}});
    const data = await res.json();
    if (data.success) showNotification('success','All webhooks notified');
    else showNotification('error',data.message||'Error');
  }

  // ---------------- Failed/unsent emails -------------------
  const fetchFailedEmails = async () => {
    setFailedLoading(true);
    const res = await fetch('/api/admin/fallback-emails', {headers:{'Authorization':`Bearer ${localStorage.getItem('token')}`}});
    const data = await res.json();
    if (data.success) setFailedEmails(data.data.data ?? []);
    setFailedLoading(false);
  }
  // Mark as sent in failed panel
  const handleMarkAsSent = async (id:number) => {
    if (!window.confirm('Mark email as sent?')) return;
    const res = await fetch(`/api/admin/fallback-emails/${id}/mark-sent`, {method:'POST', headers:{'Authorization':`Bearer ${localStorage.getItem('token')}`}});
    const data = await res.json();
    if (data.success) { fetchFailedEmails(); showNotification('success','Marked as sent'); }
    else showNotification('error',data.message||'Error');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Notification Display */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
          notification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
          notification.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
          'bg-blue-100 text-blue-800 border border-blue-200'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' && <CheckCircle className="w-5 h-5 mr-2" />}
            {notification.type === 'error' && <XCircle className="w-5 h-5 mr-2" />}
            {notification.type === 'info' && <TestTube className="w-5 h-5 mr-2" />}
            <span className="font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      <div className="flex gap-6 border-b mb-4">
        <button className={`pb-2 ${tab === 0 ? 'border-b-2 border-blue-600 font-bold': ''}`} onClick={()=>setTab(0)}>Configurations</button>
        <button className={`pb-2 ${tab === 1 ? 'border-b-2 border-blue-600 font-bold': ''}`} onClick={()=>setTab(1)}>Fallback Webhooks</button>
        <button className={`pb-2 ${tab === 2 ? 'border-b-2 border-blue-600 font-bold': ''}`} onClick={()=>setTab(2)}>Failed Emails</button>
      </div>
      {tab === 0 && (
        <div className="pt-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">N8n Configurations</h1>
            <button
              onClick={() => {
                setEditingConfig(null);
                setFormData({ 
                  name: '', 
                  webhook_url: '', 
                  webhook_timeout: 30, 
                  max_retry_attempts: 3,
                  gemini_fallback_enabled: false,
                  gemini_webhook_url: '',
                  gemini_fallback_timeout: 60,
                  gemini_fallback_retry_attempts: 2
                });
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Configuration
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Webhook URL</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timeout</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Retries</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {configurations.map((config) => (
                  <tr key={config.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {config.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                      {config.webhook_url}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {config.webhook_timeout}s
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {config.max_retry_attempts}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {config.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(config)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleTest(config.id)}
                        disabled={loadingStates[`test-${config.id}`]}
                        className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                        title="Test Connection"
                      >
                        {loadingStates[`test-${config.id}`] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <TestTube className="w-4 h-4" />
                        )}
                      </button>
                      {config.is_active ? (
                        <button
                          onClick={() => handleDeactivate(config.id)}
                          disabled={loadingStates[`deactivate-${config.id}`]}
                          className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                          title="Deactivate"
                        >
                          {loadingStates[`deactivate-${config.id}`] ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(config.id)}
                          disabled={loadingStates[`activate-${config.id}`]}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          title="Activate"
                        >
                          {loadingStates[`activate-${config.id}`] ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      {!config.is_active && (
                        <button
                          onClick={() => handleDelete(config.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingConfig ? 'Edit Configuration' : 'Create Configuration'}
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Webhook URL</label>
                      <input
                        type="url"
                        value={formData.webhook_url}
                        onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Timeout (seconds)</label>
                      <input
                        type="number"
                        min="5"
                        max="300"
                        value={formData.webhook_timeout}
                        onChange={(e) => setFormData({ ...formData, webhook_timeout: parseInt(e.target.value) })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Max Retry Attempts</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.max_retry_attempts}
                        onChange={(e) => setFormData({ ...formData, max_retry_attempts: parseInt(e.target.value) })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    {/* Gemini Fallback Section */}
                    <div className="border-t pt-4 mt-4 bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                        <span className="mr-2">🤖</span>
                        Gemini API Fallback Settings
                      </h4>
                      
                      <div className="mb-4 bg-white p-3 rounded border">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.gemini_fallback_enabled}
                            onChange={(e) => setFormData({ ...formData, gemini_fallback_enabled: e.target.checked })}
                            className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Enable Gemini Fallback</span>
                        </label>
                        <p className="text-xs text-gray-500 mt-1 ml-6">Automatically use N8N when Gemini API fails (quota exceeded, rate limits, etc.)</p>
                      </div>
                      
                      {formData.gemini_fallback_enabled && (
                        <>
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Gemini Webhook URL</label>
                            <input
                              type="url"
                              value={formData.gemini_webhook_url}
                              onChange={(e) => setFormData({ ...formData, gemini_webhook_url: e.target.value })}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              placeholder="https://your-n8n-server.com/webhook/gemini-fallback"
                            />
                            <p className="text-xs text-gray-500 mt-1">N8N webhook endpoint for Gemini fallback</p>
                          </div>
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Fallback Timeout (seconds)</label>
                            <input
                              type="number"
                              min="5"
                              max="300"
                              value={formData.gemini_fallback_timeout}
                              onChange={(e) => setFormData({ ...formData, gemini_fallback_timeout: parseInt(e.target.value) })}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Timeout for N8N fallback requests (default: 60)</p>
                          </div>
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Fallback Retry Attempts</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={formData.gemini_fallback_retry_attempts}
                              onChange={(e) => setFormData({ ...formData, gemini_fallback_retry_attempts: parseInt(e.target.value) })}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Number of retry attempts for failed fallback requests (default: 2)</p>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                      >
                        {editingConfig ? 'Update' : 'Create'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {tab === 1 && (
        <div className="pt-4">
          <div className="flex items-center justify-between mb-4"><h2>Fallback Webhooks</h2></div>
          <form onSubmit={handleWebhookSubmit} className="flex gap-4 mb-4">
            <input type="url" required className="border p-2 rounded" placeholder="Webhook URL" value={webhookForm.url} onChange={e => setWebhookForm({...webhookForm,url:e.target.value})} style={{width:'28rem'}} />
            <input type="text" className="border p-2 rounded" placeholder="Description" value={webhookForm.description} onChange={e => setWebhookForm({...webhookForm,description:e.target.value})} />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">{webhookEditId?'Update':'Add'}</button>
            {webhookEditId && <button type="button" onClick={()=>{setWebhookEditId(null);setWebhookForm({url:'',description:''})}} className="ml-2 px-4 py-2 bg-gray-200 rounded">Cancel</button>}
          </form>
          <div>
            {webhookLoading ? <div>Loading...</div> : (
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead><tr><th>URL</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {fallbackWebhooks.map(w => (
                    <tr key={w.id} className={!w.is_active ? 'opacity-70' : ''}>
                      <td className="px-2 py-2 max-w-xs truncate">{w.url}</td>
                      <td className="px-2 py-2">{w.description || '-'}</td>
                      <td className="px-2 py-2">{w.is_active ? 'Active':'Inactive'}</td>
                      <td className="px-2 py-2">
                        <button onClick={()=>webhookStartEdit(w)} className="px-2 text-blue-600">Edit</button>
                        <button onClick={()=>webhookDelete(w.id)} className="px-2 text-red-600">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="flex items-center mt-8">
            <input type="checkbox" checked={autoNotify} onChange={e=>handleAutoNotifyChange(e.target.checked)} className="mr-2" id="auto-notify" />
            <label htmlFor="auto-notify">Automatically notify all fallback webhooks when a new failed email is detected</label>
            <button className="ml-4 bg-blue-600 px-3 py-2 text-white rounded" onClick={handleNotifyNow}>Notify All Now</button>
          </div>
        </div>
      )}
      {tab === 2 && (
        <div className="pt-4">
          <h2 className="font-semibold mb-2">Failed/Unsent Emails</h2>
          {failedLoading ? <div>Loading...</div> : (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead><tr><th>ID</th><th>Recipient</th><th>Action</th><th>Status</th><th>Attempts</th><th>Error</th><th>Details</th><th>Actions</th></tr></thead>
              <tbody>
                {failedEmails.map(e => (
                  <tr key={e.id}>
                    <td>{e.id}</td>
                    <td>{e.recipient_name} ({e.recipient_email})</td>
                    <td>{e.action}</td>
                    <td>{e.status}</td>
                    <td>{e.attempts}</td>
                    <td title={e.last_error}>{e.last_error? e.last_error.slice(0,32)+'...': ''}</td>
                    <td><details><summary>Show</summary><pre className="text-xs whitespace-pre-wrap max-w-sm">{JSON.stringify(e.details,null,2)}</pre></details></td>
                    <td><button className="bg-green-600 text-white px-2 py-1 rounded" onClick={()=>handleMarkAsSent(e.id)}>Mark as Sent</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default N8nConfigurations;
