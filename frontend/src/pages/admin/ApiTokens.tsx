import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/axios';
import { Button, Input } from '../../components/ui';
import { useSEO } from '../../utils/seo';

interface ApiToken {
  id: number;
  name: string;
  token: string;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  permissions: string[];
}

interface TokenFormData {
  name: string;
  expires_in_days: number;
  permissions: string[];
}

const AVAILABLE_PERMISSIONS = [
  { value: 'read', label: 'Read Access', description: 'View workflows, courses, and posts' },
  { value: 'write', label: 'Write Access', description: 'Create and update content' },
  { value: 'delete', label: 'Delete Access', description: 'Delete content' },
  { value: 'admin', label: 'Admin Access', description: 'Full administrative access' },
];

export default function ApiTokens() {
  const [showForm, setShowForm] = useState(false);
  const [newToken, setNewToken] = useState<string>('');
  const [formData, setFormData] = useState<TokenFormData>({
    name: '',
    expires_in_days: 30,
    permissions: ['read']
  });

  useSEO({
    title: 'API Tokens Management | Admin Dashboard',
    description: 'Manage API access tokens for external integrations',
    url: '/admin/api-tokens'
  });

  const queryClient = useQueryClient();

  const { data: tokens = [], isLoading } = useQuery({
    queryKey: ['api-tokens'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/api-tokens');
      return response.data;
    }
  });

  const createTokenMutation = useMutation({
    mutationFn: async (data: TokenFormData) => {
      const response = await apiClient.post('/admin/api-tokens', data);
      return response.data;
    },
    onSuccess: (data) => {
      setNewToken(data.token);
      queryClient.invalidateQueries({ queryKey: ['api-tokens'] });
      setShowForm(false);
      setFormData({ name: '', expires_in_days: 30, permissions: ['read'] });
    }
  });

  const deleteTokenMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/admin/api-tokens/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-tokens'] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTokenMutation.mutate(formData);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this token? This action cannot be undone.')) {
      deleteTokenMutation.mutate(id);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Tokens Management</h1>
          <p className="text-gray-600 mt-1">Generate and manage API access tokens for external integrations</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Generate New Token
        </Button>
      </div>

      {/* New Token Display */}
      {newToken && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-800">Token Generated Successfully!</h3>
              <p className="text-green-600 text-sm">Copy this token and store it securely. You won't be able to see it again.</p>
            </div>
            <button
              onClick={() => setNewToken('')}
              className="text-green-600 hover:text-green-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-3 flex items-center space-x-2">
            <code className="bg-green-100 text-green-800 px-3 py-2 rounded text-sm font-mono flex-1">
              {newToken}
            </code>
            <Button
              onClick={() => copyToClipboard(newToken)}
              className="bg-green-600 hover:bg-green-700"
            >
              Copy
            </Button>
          </div>
        </div>
      )}

      {/* Create Token Form */}
      {showForm && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Generate New API Token</h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Token Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Mobile App Integration"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expires In
              </label>
              <select
                value={formData.expires_in_days}
                onChange={(e) => setFormData({ ...formData, expires_in_days: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
                <option value={365}>1 year</option>
                <option value={0}>Never expires</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permissions
              </label>
              <div className="space-y-2">
                {AVAILABLE_PERMISSIONS.map((permission) => (
                  <label key={permission.value} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(permission.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            permissions: [...formData.permissions, permission.value]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            permissions: formData.permissions.filter(p => p !== permission.value)
                          });
                        }
                      }}
                      className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{permission.label}</div>
                      <div className="text-sm text-gray-500">{permission.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-500 hover:bg-gray-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createTokenMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createTokenMutation.isPending ? 'Generating...' : 'Generate Token'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tokens List */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Active Tokens</h3>
        </div>
        
        {tokens.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <p>No API tokens generated yet</p>
            <p className="text-sm">Generate your first token to start using the API</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {tokens.map((token: ApiToken) => (
              <div key={token.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-sm font-medium text-gray-900">{token.name}</h4>
                      {isExpired(token.expires_at) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Expired
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      <p>Created: {formatDate(token.created_at)}</p>
                      <p>Last used: {formatDate(token.last_used_at)}</p>
                      {token.expires_at && (
                        <p>Expires: {formatDate(token.expires_at)}</p>
                      )}
                      <p>Permissions: {token.permissions.join(', ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => handleDelete(token.id)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
