import { useEffect, useState } from 'react';
import apiClient from '../../api/axios';
import { useSEO } from '../../utils/seo';
import { API_CONFIG } from '../../config/api';

interface File {
  id: number;
  name: string;
  original_name: string;
  path: string;
  mime_type: string;
  size: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface FileCategory {
  type: string;
  label: string;
  icon: string;
  color: string;
}

const FILE_CATEGORIES: FileCategory[] = [
  { type: 'image', label: 'Images', icon: '🖼️', color: 'bg-blue-100 text-blue-800' },
  { type: 'document', label: 'Documents', icon: '📄', color: 'bg-green-100 text-green-800' },
  { type: 'archive', label: 'Archives', icon: '📦', color: 'bg-purple-100 text-purple-800' },
  { type: 'other', label: 'Other', icon: '📁', color: 'bg-gray-100 text-gray-800' },
];

export default function Files() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');

  useSEO({ title: 'Manage Files | Admin' });

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await apiClient.get('/files');
      setFiles(response.data);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset messages
    setError('');
    setSuccess('');

    // Client-side validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/zip', 'application/json'];
    
    if (file.size > maxSize) {
      setError('File size must not exceed 10MB.');
      e.target.value = '';
      return;
    }
    
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPG, PNG, PDF, DOC, DOCX, TXT, ZIP, and JSON files are allowed.');
      e.target.value = '';
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('is_public', '1');

    try {
      const response = await apiClient.post('/files', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess(response.data.message || 'File uploaded successfully!');
      fetchFiles();
      e.target.value = '';
      setShowUploadModal(false); // Close modal after successful upload
    } catch (error: any) {
      console.error('Error uploading file:', error);
      if (error.response?.data?.errors) {
        // Display validation errors
        const errorMessages = Object.values(error.response.data.errors).flat();
        setError(errorMessages.join(' '));
      } else {
        setError(error.response?.data?.message || 'Error uploading file. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this file?')) {
      try {
        await apiClient.delete(`/files/${id}`);
        fetchFiles();
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileCategory = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return 'archive';
    return 'other';
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    if (mimeType.includes('json')) return '🔧';
    return '📁';
  };

  const getFileUrl = (file: File): string => {
    return API_CONFIG.getStorageUrl(file.path);
  };

  const filteredFiles = files.filter(file => {
    const matchesCategory = selectedCategory === 'all' || getFileCategory(file.mime_type) === selectedCategory;
    const matchesSearch = file.original_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleLinkSubmit = async () => {
    if (!linkUrl || !linkTitle) {
      setError('Please provide both URL and title for the link.');
      return;
    }

    try {
      // Create a virtual file entry for the link
      const linkFile = {
        id: Date.now(), // Temporary ID
        name: linkTitle,
        original_name: linkTitle,
        path: linkUrl,
        mime_type: 'application/link',
        size: 0,
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setFiles(prev => [linkFile, ...prev]);
      setShowLinkModal(false);
      setLinkUrl('');
      setLinkTitle('');
      setSuccess('Link added successfully!');
    } catch (error) {
      setError('Failed to add link. Please try again.');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">File Management</h1>
          <p className="text-gray-600 mt-1">Organize and manage your files and links</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowLinkModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <span className="mr-2">🔗</span>
            Add Link
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <span className="mr-2">📁</span>
            Upload File
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
          <span className="mr-2">⚠️</span>
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 flex items-center">
          <span className="mr-2">✅</span>
          {success}
        </div>
      )}

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Files
            </button>
            {FILE_CATEGORIES.map((category) => (
              <button
                key={category.type}
                onClick={() => setSelectedCategory(category.type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.type
                    ? category.color
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-1">{category.icon}</span>
                {category.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-lg">⊞</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-lg">☰</span>
            </button>
          </div>
        </div>
      </div>

      {/* Files Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFiles.map((file) => (
            <div key={file.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{getFileIcon(file.mime_type)}</span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => navigator.clipboard.writeText(getFileUrl(file))}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Copy URL"
                    >
                      📋
                    </button>
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <h3 className="font-medium text-gray-900 truncate mb-1">{file.original_name}</h3>
                <p className="text-sm text-gray-500 mb-2">{formatFileSize(file.size)}</p>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    FILE_CATEGORIES.find(cat => cat.type === getFileCategory(file.mime_type))?.color || 'bg-gray-100 text-gray-800'
                  }`}>
                    {FILE_CATEGORIES.find(cat => cat.type === getFileCategory(file.mime_type))?.label || 'Other'}
                  </span>
                  {file.mime_type === 'application/link' ? (
                    <a
                      href={file.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Open Link →
                    </a>
                  ) : (
                    <a
                      href={getFileUrl(file)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View →
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFiles.map((file) => (
                <tr key={file.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className="text-lg mr-3">{getFileIcon(file.mime_type)}</span>
                      <span className="font-medium text-gray-900">{file.original_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{file.mime_type}</td>
                  <td className="px-6 py-4 text-gray-600">{formatFileSize(file.size)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      FILE_CATEGORIES.find(cat => cat.type === getFileCategory(file.mime_type))?.color || 'bg-gray-100 text-gray-800'
                    }`}>
                      {FILE_CATEGORIES.find(cat => cat.type === getFileCategory(file.mime_type))?.label || 'Other'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500 truncate max-w-xs">
                        {file.mime_type === 'application/link' ? file.path : getFileUrl(file)}
                      </span>
                      <button
                        onClick={() => navigator.clipboard.writeText(file.mime_type === 'application/link' ? file.path : getFileUrl(file))}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy URL"
                      >
                        📋
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {file.mime_type === 'application/link' ? (
                      <a
                        href={file.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Open Link
                      </a>
                    ) : (
                      <a
                        href={getFileUrl(file)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Upload File</h3>
            <label className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 cursor-pointer transition-colors text-center">
              {uploading ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Uploading...
                </>
              ) : (
                'Choose File'
              )}
              <input
                type="file"
                onChange={handleUpload}
                className="hidden"
                disabled={uploading}
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt,.zip,.json,.gif,.webp,.svg"
              />
            </label>
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Link</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link Title</label>
                <input
                  type="text"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="Enter link title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkUrl('');
                  setLinkTitle('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLinkSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredFiles.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Upload your first file or add a link to get started.'
            }
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upload File
            </button>
            <button
              onClick={() => setShowLinkModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
