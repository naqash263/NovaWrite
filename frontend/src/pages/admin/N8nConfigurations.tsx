import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Play, TestTube, CheckCircle, XCircle } from 'lucide-react';

interface N8nConfiguration {
  id: number;
  name: string;
  webhook_url: string;
  webhook_timeout: number;
  max_retry_attempts: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const N8nConfigurations: React.FC = () => {
  const [configurations, setConfigurations] = useState<N8nConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<N8nConfiguration | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    webhook_url: '',
    webhook_timeout: 30,
    max_retry_attempts: 3
  });

  useEffect(() => {
    fetchConfigurations();
  }, []);

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
      }
    } catch (error) {
      console.error('Error fetching configurations:', error);
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
        setFormData({ name: '', webhook_url: '', webhook_timeout: 30, max_retry_attempts: 3 });
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
      max_retry_attempts: config.max_retry_attempts
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
    try {
      const response = await fetch(`/api/admin/n8n-configurations/${id}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        fetchConfigurations();
      } else {
        alert(data.message || 'Error activating configuration');
      }
    } catch (error) {
      console.error('Error activating configuration:', error);
      alert('Error activating configuration');
    }
  };

  const handleTest = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/n8n-configurations/${id}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      alert(data.message || 'Test completed');
    } catch (error) {
      console.error('Error testing configuration:', error);
      alert('Error testing configuration');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">N8n Configurations</h1>
        <button
          onClick={() => {
            setEditingConfig(null);
            setFormData({ name: '', webhook_url: '', webhook_timeout: 30, max_retry_attempts: 3 });
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
                    className="text-yellow-600 hover:text-yellow-900"
                    title="Test Connection"
                  >
                    <TestTube className="w-4 h-4" />
                  </button>
                  {!config.is_active && (
                    <button
                      onClick={() => handleActivate(config.id)}
                      className="text-green-600 hover:text-green-900"
                      title="Activate"
                    >
                      <Play className="w-4 h-4" />
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
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
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
  );
};

export default N8nConfigurations;
