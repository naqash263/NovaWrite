import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axios';

interface HomeSetting {
  id: number;
  key: string;
  type: 'text' | 'image' | 'boolean' | 'json';
  value: string;
  title: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  image_url?: string;
}

const HomeSettings: React.FC = () => {
  const [settings, setSettings] = useState<HomeSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSetting, setEditingSetting] = useState<HomeSetting | null>(null);
  const [formData, setFormData] = useState({
    key: '',
    type: 'text' as 'text' | 'image' | 'boolean' | 'json',
    value: '',
    title: '',
    description: '',
    is_active: true,
    sort_order: 0,
  });
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/home-settings');
      setSettings(response.data.settings);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSetting) {
        await apiClient.put(`/admin/home-settings/${editingSetting.id}`, formData);
      } else {
        await apiClient.post('/admin/home-settings', formData);
      }
      setShowModal(false);
      setEditingSetting(null);
      setFormData({
        key: '',
        type: 'text',
        value: '',
        title: '',
        description: '',
        is_active: true,
        sort_order: 0,
      });
      fetchSettings();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save setting');
    }
  };

  const handleEdit = (setting: HomeSetting) => {
    setEditingSetting(setting);
    setFormData({
      key: setting.key,
      type: setting.type,
      value: setting.value,
      title: setting.title,
      description: setting.description,
      is_active: setting.is_active,
      sort_order: setting.sort_order,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this setting?')) return;
    
    try {
      await apiClient.delete(`/admin/home-settings/${id}`);
      fetchSettings();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete setting');
    }
  };

  const handleToggleActive = async (setting: HomeSetting) => {
    try {
      await apiClient.post(`/admin/home-settings/${setting.id}/toggle-active`);
      fetchSettings();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle setting');
    }
  };

  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !formData.key) return;

    try {
      setUploading(true);
      const formDataUpload = new FormData();
      formDataUpload.append('image', selectedFile);
      formDataUpload.append('key', formData.key);

      const response = await apiClient.post('/admin/home-settings/upload-image', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setFormData(prev => ({
        ...prev,
        value: response.data.setting.value,
        type: 'image',
        title: response.data.setting.title,
      }));
      
      setSelectedFile(null);
      fetchSettings();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const groupedSettings = settings.reduce((acc, setting) => {
    const type = setting.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(setting);
    return acc;
  }, {} as Record<string, HomeSetting[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Home Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your home page content, images, and notifications
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Setting
        </button>
      </div>

      {/* Settings by Type */}
      {Object.entries(groupedSettings).map(([type, typeSettings]) => (
        <div key={type} className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 capitalize">
            {type} Settings ({typeSettings.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {typeSettings.map((setting) => (
              <div key={setting.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900">{setting.title}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleToggleActive(setting)}
                      className={`px-2 py-1 text-xs rounded ${
                        setting.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {setting.is_active ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => handleEdit(setting)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(setting.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{setting.description}</p>
                <p className="text-xs text-gray-500 mb-2">Key: {setting.key}</p>
                
                {setting.type === 'image' && setting.image_url && (
                  <div className="mb-2">
                    <img
                      src={setting.image_url}
                      alt={setting.title}
                      className="w-full h-24 object-cover rounded"
                    />
                  </div>
                )}
                
                <div className="text-sm text-gray-700">
                  {setting.type === 'boolean' ? (
                    <span className={`px-2 py-1 rounded text-xs ${
                      setting.value === '1' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {setting.value === '1' ? 'Yes' : 'No'}
                    </span>
                  ) : (
                    <p className="truncate">{setting.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingSetting ? 'Edit Setting' : 'Add New Setting'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key
                </label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                  disabled={!!editingSetting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                >
                  <option value="text">Text</option>
                  <option value="image">Image</option>
                  <option value="boolean">Boolean</option>
                  <option value="json">JSON</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                />
              </div>

              {formData.type === 'image' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={handleImageUpload}
                      disabled={uploading}
                      className="mt-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {uploading ? 'Uploading...' : 'Upload Image'}
                    </button>
                  )}
                </div>
              )}

              {formData.type !== 'image' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Value
                  </label>
                  {formData.type === 'boolean' ? (
                    <select
                      value={formData.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="0">No</option>
                      <option value="1">Yes</option>
                    </select>
                  ) : formData.type === 'json' ? (
                    <textarea
                      value={formData.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      rows={4}
                      placeholder="Enter JSON data"
                    />
                  ) : (
                    <textarea
                      value={formData.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      rows={3}
                    />
                  )}
                </div>
              )}

              <div className="flex items-center space-x-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="mr-2"
                    />
                    Active
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    className="w-20 border border-gray-300 rounded-lg px-3 py-2"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingSetting(null);
                    setFormData({
                      key: '',
                      type: 'text',
                      value: '',
                      title: '',
                      description: '',
                      is_active: true,
                      sort_order: 0,
                    });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  {editingSetting ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeSettings;
