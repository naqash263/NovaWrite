import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';

interface FileSearchProps {
  onFileSelect?: (file: any) => void;
  className?: string;
}

interface SearchFilters {
  query: string;
  category: string;
  purpose: string;
  audience: string;
  minSeoScore: number;
}

interface FileData {
  id: number;
  seo_name: string;
  original_name: string;
  description: string;
  seo_score: number;
  content_category: string;
  content_purpose: string;
  target_audience: string;
  keywords: string[];
  ai_tags: string[];
  mime_type: string;
  size: number;
  downloads: number;
  created_at: string;
  user: {
    name: string;
    email: string;
  };
}

const SeoFileSearch: React.FC<FileSearchProps> = ({
  onFileSelect,
  className = ''
}) => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: '',
    purpose: '',
    audience: '',
    minSeoScore: 0
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [purposes, setPurposes] = useState<string[]>([]);
  const [audiences, setAudiences] = useState<string[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchFilterOptions();
    fetchStats();
  }, []);

  useEffect(() => {
    searchFiles();
  }, [filters]);

  const fetchFilterOptions = async () => {
    try {
      const [categoriesRes, purposesRes, audiencesRes] = await Promise.all([
        apiClient.get('/files/categories'),
        apiClient.get('/files/purposes'),
        apiClient.get('/files/audiences')
      ]);

      setCategories(categoriesRes.data);
      setPurposes(purposesRes.data);
      setAudiences(audiencesRes.data);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/files/seo/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const searchFiles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filters.query) params.append('q', filters.query);
      if (filters.category) params.append('category', filters.category);
      if (filters.purpose) params.append('purpose', filters.purpose);
      if (filters.audience) params.append('audience', filters.audience);
      if (filters.minSeoScore > 0) params.append('min_seo_score', filters.minSeoScore.toString());

      const response = await apiClient.get(`/files/search?${params}`);
      setFiles(response.data.data || response.data);
    } catch (error) {
      console.error('Error searching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      category: '',
      purpose: '',
      audience: '',
      minSeoScore: 0
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSeoScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getFileTypeIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    return '📁';
  };

  return (
    <div className={`seo-file-search ${className}`}>
      {/* Search Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          🔍 SEO File Search
        </h2>
        
        {/* Search Input */}
        <div className="mb-4">
          <input
            type="text"
            value={filters.query}
            onChange={(e) => handleFilterChange('query', e.target.value)}
            placeholder="Search by filename, description, or keywords..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purpose
            </label>
            <select
              value={filters.purpose}
              onChange={(e) => handleFilterChange('purpose', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Purposes</option>
              {purposes.map(purpose => (
                <option key={purpose} value={purpose}>
                  {purpose.charAt(0).toUpperCase() + purpose.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Audience
            </label>
            <select
              value={filters.audience}
              onChange={(e) => handleFilterChange('audience', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Audiences</option>
              {audiences.map(audience => (
                <option key={audience} value={audience}>
                  {audience.charAt(0).toUpperCase() + audience.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min SEO Score
            </label>
            <select
              value={filters.minSeoScore}
              onChange={(e) => handleFilterChange('minSeoScore', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={0}>Any Score</option>
              <option value={60}>60+ (Good)</option>
              <option value={80}>80+ (Excellent)</option>
              <option value={90}>90+ (Outstanding)</option>
            </select>
          </div>
        </div>

        {/* Stats and Clear */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {stats && (
              <>
                {stats.total_files} files • Avg Score: {Math.round(stats.avg_seo_score || 0)} • 
                High SEO: {stats.high_seo_files}
              </>
            )}
          </div>
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Searching files...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No files found matching your criteria.
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onFileSelect?.(file)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{getFileTypeIcon(file.mime_type)}</span>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {file.seo_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {file.original_name}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">
                    {file.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {file.keywords.slice(0, 5).map((keyword, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {keyword}
                      </span>
                    ))}
                    {file.keywords.length > 5 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{file.keywords.length - 5} more
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>📁 {file.content_category}</span>
                    <span>🎯 {file.content_purpose}</span>
                    <span>👥 {file.target_audience}</span>
                    <span>📊 {formatFileSize(file.size)}</span>
                    <span>⬇️ {file.downloads} downloads</span>
                    <span>📅 {new Date(file.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSeoScoreColor(file.seo_score)}`}>
                    SEO: {file.seo_score}/100
                  </div>
                  <div className="text-xs text-gray-500">
                    by {file.user.name}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SeoFileSearch;

