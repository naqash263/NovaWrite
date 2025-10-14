import React, { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../api/axios';

interface GeminiApiKey {
  id: number;
  name: string;
  max_requests: number;
  total_requests: number;
  used_requests: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserApiKey {
  id: number;
  user_id: number;
  name: string;
  requests_per_key: number;
  usage_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface ApiStats {
  total_keys: number;
  total_requests: number;
  used_requests: number;
  available_requests: number;
  gemini_keys?: {
    total_keys: number;
    active_keys: number;
    total_requests: number;
    used_requests: number;
    available_requests: number;
  };
  user_keys?: {
    total_keys: number;
    total_requests: number;
    used_requests: number;
    available_requests: number;
  };
  overall?: {
    total_keys: number;
    total_requests: number;
    used_requests: number;
    available_requests: number;
  };
}

export default function GeminiApiManagement() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<GeminiApiKey[]>([]);
  const [userApiKeys, setUserApiKeys] = useState<UserApiKey[]>([]);
  const [stats, setStats] = useState<ApiStats>({
    total_keys: 0,
    total_requests: 0,
    used_requests: 0,
    available_requests: 0
  });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingKey, setEditingKey] = useState<GeminiApiKey | null>(null);
  const [editingUserKey, setEditingUserKey] = useState<UserApiKey | null>(null);
  const [showUserKeyModal, setShowUserKeyModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    api_key: '',
    max_requests: 5,
    is_active: true
  });
  const [userKeyFormData, setUserKeyFormData] = useState({
    requests_per_key: 10,
    is_active: true
  });
  const [testing, setTesting] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'admin' | 'user'>('admin');

  useEffect(() => {
    if (user?.role === 'admin') {
      loadApiKeys();
      loadUserApiKeys();
      loadComprehensiveStats();
    }
  }, [user]);

  const loadApiKeys = async () => {
    try {
      const response = await apiClient.get('/admin/gemini-api-keys');
      const data = response.data;
      
      console.log('API Response:', data);
      console.log('API Keys:', data.data?.api_keys);
      console.log('Stats:', data.data?.statistics);
      
      if (data.success) {
        setApiKeys(data.data.api_keys || []);
        setStats(data.data.statistics || {
          total_keys: 0,
          total_requests: 0,
          used_requests: 0,
          available_requests: 0
        });
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
      setError('Failed to load API keys. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const loadUserApiKeys = async () => {
    try {
      const response = await apiClient.get('/admin/user-api-keys');
      const data = response.data;
      if (data.success) {
        setUserApiKeys(data.data.user_api_keys);
      }
    } catch (error) {
      console.error('Failed to load user API keys:', error);
    }
  };

  const loadComprehensiveStats = async () => {
    try {
      const response = await apiClient.get('/admin/gemini-api-keys/comprehensive-stats');
      const data = response.data;
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to load comprehensive stats:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      let response;
      if (editingKey) {
        response = await apiClient.put(`/admin/gemini-api-keys/${editingKey.id}`, formData);
      } else {
        response = await apiClient.post('/admin/gemini-api-keys', formData);
      }

      const result = response.data;

      if (result.success) {
        setSuccess(editingKey ? 'API key updated successfully' : 'API key added successfully');
        setShowAddModal(false);
        setEditingKey(null);
        setFormData({ name: '', api_key: '', max_requests: 5, is_active: true });
        loadApiKeys();
        loadComprehensiveStats();
      } else {
        setError(result.message || 'Failed to save API key');
      }
    } catch (error) {
      setError('Failed to save API key');
    }
  };

  const handleEdit = (key: GeminiApiKey) => {
    setEditingKey(key);
    setFormData({
      name: key.name,
      api_key: '', // Don't show existing key for security
      max_requests: key.max_requests,
      is_active: key.is_active
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      const response = await apiClient.delete(`/admin/gemini-api-keys/${id}`);
      const result = response.data;

      if (result.success) {
        setSuccess('API key deleted successfully');
        loadApiKeys();
        loadComprehensiveStats();
      } else {
        setError(result.message || 'Failed to delete API key');
      }
    } catch (error) {
      setError('Failed to delete API key');
    }
  };

  const handleTest = async (id: number) => {
    setTesting(id);
    try {
      const response = await apiClient.post(`/admin/gemini-api-keys/${id}/test`, {});
      const result = response.data;
      
      if (result.success && result.valid) {
        const details = result.details || {};
        const message = `API key is working correctly. Status: ${details.status}, Response time: ${details.response_time}s, Quota: ${details.quota_status}`;
        setSuccess(message);
      } else {
        const details = result.details || {};
        const message = `API key test failed. Status: ${details.status}, Error: ${details.error_message || 'Unknown error'}`;
        setError(message);
      }
    } catch (error) {
      setError('Failed to test API key');
    } finally {
      setTesting(null);
    }
  };

  const handleHealthCheck = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('Starting health check...');
      const response = await apiClient.get('/admin/gemini-api-keys/health-check');
      const result = response.data;
      console.log('Health check result:', result);
      
      if (result.success) {
        const data = result.data;
        const message = `Health Check Complete: ${data.healthy_keys}/${data.total_keys} keys healthy. ${data.unhealthy_keys} keys have issues.`;
        setSuccess(message);
        
        // Show detailed results
        if (data.unhealthy_keys > 0) {
          const unhealthyKeys = data.keys.filter((key: any) => !key.is_healthy);
          const unhealthyNames = unhealthyKeys.map((key: any) => key.name).join(', ');
          setError(`Unhealthy keys: ${unhealthyNames}`);
        }
      } else {
        console.log('Health check failed:', result);
        setError('Health check failed');
      }
    } catch (error) {
      console.error('Health check error:', error);
      setError('Failed to perform health check');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (key: GeminiApiKey) => {
    try {
      const response = await apiClient.put(`/admin/gemini-api-keys/${key.id}`, {
        ...formData,
        is_active: !key.is_active
      });

      const result = response.data;

      if (result.success) {
        setSuccess(`API key ${!key.is_active ? 'activated' : 'deactivated'} successfully`);
        loadApiKeys();
        loadComprehensiveStats();
      } else {
        setError(result.message || 'Failed to update API key');
      }
    } catch (error) {
      setError('Failed to update API key');
    }
  };

  // User API Key Management Functions
  const handleEditUserKey = (userKey: UserApiKey) => {
    setEditingUserKey(userKey);
    setUserKeyFormData({
      requests_per_key: userKey.requests_per_key,
      is_active: userKey.is_active
    });
    setShowUserKeyModal(true);
  };

  const handleUpdateUserKeyQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserKey) return;

    setError('');
    setSuccess('');

    try {
      const response = await apiClient.put(`/admin/user-api-keys/${editingUserKey.id}/quota`, userKeyFormData);
      const result = response.data;

      if (result.success) {
        setSuccess('User API key quota updated successfully');
        setShowUserKeyModal(false);
        setEditingUserKey(null);
        setUserKeyFormData({ requests_per_key: 10, is_active: true });
        loadUserApiKeys();
        loadComprehensiveStats();
      } else {
        setError(result.message || 'Failed to update quota');
      }
    } catch (error) {
      setError('Failed to update quota');
    }
  };

  const handleResetUserKeyUsage = async (userKey: UserApiKey) => {
    if (!confirm('Are you sure you want to reset usage for this user API key?')) return;

    try {
      const response = await apiClient.post(`/admin/user-api-keys/${userKey.id}/reset-usage`);
      const result = response.data;

      if (result.success) {
        setSuccess('User API key usage reset successfully');
        loadUserApiKeys();
        loadComprehensiveStats();
      } else {
        setError(result.message || 'Failed to reset usage');
      }
    } catch (error) {
      setError('Failed to reset usage');
    }
  };

  const handleDeleteUserKey = async (userKey: UserApiKey) => {
    if (!confirm('Are you sure you want to delete this user API key? This action cannot be undone.')) return;

    try {
      const response = await apiClient.delete(`/admin/user-api-keys/${userKey.id}`);
      const result = response.data;

      if (result.success) {
        setSuccess('User API key deleted successfully');
        loadUserApiKeys();
        loadComprehensiveStats();
      } else {
        setError(result.message || 'Failed to delete user API key');
      }
    } catch (error) {
      setError('Failed to delete user API key');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading API keys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gemini API Management</h1>
          <p className="text-gray-600 mt-2">Manage your Gemini API keys and monitor usage</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Keys</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overall?.total_keys || stats.total_keys}</p>
                {stats.gemini_keys && stats.user_keys && (
                  <p className="text-xs text-gray-500">
                    Admin: {stats.gemini_keys.total_keys} | User: {stats.user_keys.total_keys}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Requests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overall?.available_requests || stats.available_requests}</p>
                {stats.gemini_keys && stats.user_keys && (
                  <p className="text-xs text-gray-500">
                    Admin: {stats.gemini_keys.available_requests} | User: {stats.user_keys.available_requests}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Used Requests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overall?.used_requests || stats.used_requests}</p>
                {stats.gemini_keys && stats.user_keys && (
                  <p className="text-xs text-gray-500">
                    Admin: {stats.gemini_keys.used_requests} | User: {stats.user_keys.used_requests}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overall?.total_requests || stats.total_requests}</p>
                {stats.gemini_keys && stats.user_keys && (
                  <p className="text-xs text-gray-500">
                    Admin: {stats.gemini_keys.total_requests} | User: {stats.user_keys.total_requests}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('admin')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'admin'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Admin API Keys ({apiKeys.length})
              </button>
              <button
                onClick={() => setActiveTab('user')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'user'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                User API Keys ({userApiKeys.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Admin API Keys Section */}
        {activeTab === 'admin' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Admin API Keys</h2>
              <div className="flex space-x-3">
                <Button
                  onClick={handleHealthCheck}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Checking...' : 'Health Check'}
                </Button>
                <Button
                  onClick={() => {
                    setShowAddModal(true);
                    setEditingKey(null);
                    setFormData({ name: '', api_key: '', max_requests: 5, is_active: true });
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Add API Key
                </Button>
              </div>
            </div>

        {/* API Keys Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {apiKeys.length > 0 ? (
                apiKeys.map((key) => (
                  <tr key={key.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{key.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {key.used_requests} / {key.total_requests}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(key.used_requests / key.total_requests) * 100}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        key.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {key.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(key.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(key)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleTest(key.id)}
                        disabled={testing === key.id}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50"
                      >
                        {testing === key.id ? 'Testing...' : 'Test'}
                      </button>
                      <button
                        onClick={() => toggleActive(key)}
                        className={`${key.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                      >
                        {key.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(key.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <div className="text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      <p className="text-sm font-medium text-gray-900 mb-1">No Admin API keys found</p>
                      <p className="text-sm text-gray-500 mb-4">Get started by adding your first Gemini API key</p>
                      <Button
                        onClick={() => {
                          setShowAddModal(true);
                          setEditingKey(null);
                          setFormData({ name: '', api_key: '', max_requests: 5, is_active: true });
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Add Your First API Key
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
          </>
        )}

        {/* User API Keys Section */}
        {activeTab === 'user' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">User API Keys</h2>
              <p className="text-sm text-gray-500">Manage user API key quotas and usage</p>
            </div>

            {/* User API Keys Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quota</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userApiKeys.map((userKey) => (
                    <tr key={userKey.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{userKey.user.name}</div>
                          <div className="text-sm text-gray-500">{userKey.user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {userKey.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {userKey.usage_count} / {userKey.requests_per_key}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {userKey.requests_per_key}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          userKey.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {userKey.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(userKey.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEditUserKey(userKey)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit Quota
                        </button>
                        <button
                          onClick={() => handleResetUserKeyUsage(userKey)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Reset Usage
                        </button>
                        <button
                          onClick={() => handleDeleteUserKey(userKey)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {userApiKeys.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        No user API keys found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingKey ? 'Edit API Key' : 'Add New API Key'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="API Key Name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      API Key {editingKey && '(leave empty to keep current)'}
                    </label>
                    <Input
                      type="password"
                      value={formData.api_key}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, api_key: e.target.value })}
                      placeholder="Enter Gemini API Key"
                      required={!editingKey}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Requests</label>
                    <Input
                      type="number"
                      value={formData.max_requests}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, max_requests: parseInt(e.target.value) })}
                      min="1"
                      max="1000"
                      required
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                      Active
                    </label>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingKey ? 'Update' : 'Add'} API Key
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* User API Key Quota Edit Modal */}
        {showUserKeyModal && editingUserKey && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Edit User API Key Quota
                </h3>
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>User:</strong> {editingUserKey.user.name} ({editingUserKey.user.email})
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Key:</strong> {editingUserKey.name}
                  </p>
                </div>
                <form onSubmit={handleUpdateUserKeyQuota} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Requests Per Key
                    </label>
                    <Input
                      type="number"
                      value={userKeyFormData.requests_per_key}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setUserKeyFormData({ ...userKeyFormData, requests_per_key: parseInt(e.target.value) })
                      }
                      min="1"
                      max="10000"
                      required
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="user_key_is_active"
                      checked={userKeyFormData.is_active}
                      onChange={(e) => setUserKeyFormData({ ...userKeyFormData, is_active: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="user_key_is_active" className="ml-2 block text-sm text-gray-900">
                      Active
                    </label>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      onClick={() => {
                        setShowUserKeyModal(false);
                        setEditingUserKey(null);
                        setUserKeyFormData({ requests_per_key: 10, is_active: true });
                      }}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      Update Quota
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



