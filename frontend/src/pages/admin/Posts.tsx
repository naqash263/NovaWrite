import { useState, useEffect } from 'react';
import apiClient from '../../api/axios';
import Pagination from '../../components/Pagination';
import EnhancedImageUpload from '../../components/EnhancedImageUpload';
import AdvancedFilters from '../../components/AdvancedFilters';
import RichTextEditor from '../../components/RichTextEditor';
import { useAuthContext } from '../../contexts/AuthContext';
import { useSEO } from '../../utils/seo';

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image?: string;
  is_published: boolean;
  category_id: number;
  tags?: Tag[];
  created_at: string;
  updated_at: string;
  approval_status: 'pending' | 'approved' | 'rejected' | 'draft';
  rejection_reason?: string;
  approved_by?: number;
  approved_at?: string;
  meta_description?: string;
  meta_keywords?: string;
}

interface Category {
  id: number;
  name: string;
}

interface Tag {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color: string;
}

export default function Posts() {
  const { user } = useAuthContext();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    approval_status: '',
    tags: [] as string[],
    dateFrom: '',
    dateTo: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 10
  });
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    featured_image: '',
    category_id: '',
    is_published: false,
    meta_description: '',
    meta_keywords: '',
    tags: [] as number[],
  });

  // Helper function to process content for better HTML and line break handling
  const processContent = (content: string) => {
    if (!content) return '';
    
    // Check content size to prevent 414 errors
    const maxContentLength = 1000000; // 1MB limit
    if (content.length > maxContentLength) {
      console.warn('Content is very large:', content.length, 'characters');
      // Truncate if too large, but this shouldn't happen in normal usage
      content = content.substring(0, maxContentLength) + '... [Content truncated due to size]';
    }
    
    // Convert line breaks to proper HTML breaks
    let processedContent = content
      .replace(/\n\n/g, '\n\n') // Preserve double line breaks for paragraphs
      .replace(/\n/g, '<br>'); // Convert single line breaks to <br> tags
    
    // Ensure proper HTML structure
    if (!processedContent.includes('<p>') && !processedContent.includes('<div>')) {
      // Wrap in paragraph tags if no block elements exist
      processedContent = `<p>${processedContent}</p>`;
    }
    
    return processedContent;
  };

  useSEO({ title: 'Manage Posts | Admin' });

  useEffect(() => {
    fetchPosts();
    fetchCategories();
    fetchTags();
  }, []);

  // Filter configuration
  const filterConfigs = [
    {
      name: 'category',
      label: 'Category',
      type: 'select' as const,
      options: (categories || []).map(cat => ({ value: cat.id.toString(), label: cat.name }))
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'published', label: 'Published' },
        { value: 'draft', label: 'Draft' }
      ]
    },
    {
      name: 'approval_status',
      label: 'Approval Status',
      type: 'select' as const,
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'draft', label: 'Draft' }
      ]
    },
    {
      name: 'tags',
      label: 'Tags',
      type: 'multiselect' as const,
      options: (tags || []).map(tag => ({ value: tag.id.toString(), label: tag.name }))
    },
    {
      name: 'dateFrom',
      label: 'From Date',
      type: 'date' as const
    },
    {
      name: 'dateTo',
      label: 'To Date',
      type: 'date' as const
    }
  ];

  // Apply filters
  useEffect(() => {
    let filtered = [...posts];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchLower) ||
        post.content.toLowerCase().includes(searchLower) ||
        post.excerpt.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(post => post.category_id.toString() === filters.category);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(post => 
        filters.status === 'published' ? post.is_published : !post.is_published
      );
    }

    // Approval status filter
    if (filters.approval_status) {
      filtered = filtered.filter(post => post.approval_status === filters.approval_status);
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(post =>
        post.tags?.some(tag => filters.tags.includes(tag.id.toString()))
      );
    }

    // Date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(post => {
        const postDate = new Date(post.created_at || post.updated_at);
        const fromDate = new Date(filters.dateFrom);
        return postDate >= fromDate;
      });
    }

    if (filters.dateTo) {
      filtered = filtered.filter(post => {
        const postDate = new Date(post.created_at || post.updated_at);
        const toDate = new Date(filters.dateTo);
        return postDate <= toDate;
      });
    }

    setFilteredPosts(filtered);
  }, [posts, filters]);

  const fetchPosts = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/admin/posts?page=${page}&per_page=${pagination.perPage}`);
      setPosts(response.data.data || []);
      setPagination({
        currentPage: response.data.current_page || 1,
        lastPage: response.data.last_page || 1,
        total: response.data.total || 0,
        perPage: response.data.per_page || 10
      });
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/categories');
      // Handle both old format (array) and new format (object with data property)
      const categoriesData = Array.isArray(response.data) ? response.data : response.data.data || [];
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]); // Ensure categories is always an array
    }
  };

  const fetchTags = async () => {
    try {
      const response = await apiClient.get('/tags');
      // Handle both old format (array) and new format (object with data property)
      const tagsData = Array.isArray(response.data) ? response.data : response.data.data || [];
      setTags(tagsData);
    } catch (error) {
      console.error('Error fetching tags:', error);
      // Fallback to default tags if API fails
      setTags([
        { id: 1, name: 'AI', color: '#3B82F6', slug: 'ai', description: 'Artificial Intelligence' },
        { id: 2, name: 'Automation', color: '#10B981', slug: 'automation', description: 'Process Automation' },
        { id: 3, name: 'Technology', color: '#8B5CF6', slug: 'technology', description: 'General Technology' },
        { id: 4, name: 'Programming', color: '#F59E0B', slug: 'programming', description: 'Programming and Development' },
        { id: 5, name: 'Machine Learning', color: '#EF4444', slug: 'machine-learning', description: 'Machine Learning' },
        { id: 6, name: 'Data Science', color: '#06B6D4', slug: 'data-science', description: 'Data Science and Analytics' },
        { id: 7, name: 'Web Development', color: '#84CC16', slug: 'web-development', description: 'Web Development' },
        { id: 8, name: 'Mobile', color: '#F97316', slug: 'mobile', description: 'Mobile Development' },
        { id: 9, name: 'Cloud', color: '#6366F1', slug: 'cloud', description: 'Cloud Computing' },
        { id: 10, name: 'Security', color: '#DC2626', slug: 'security', description: 'Cybersecurity' },
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { 
        ...formData, 
        category_id: Number(formData.category_id),
        content: processContent(formData.content) // Process content for better HTML handling
      };
      
      // Log data size for debugging
      const dataSize = JSON.stringify(data).length;
      console.log('Submitting post data, size:', dataSize, 'characters');
      
      if (editingId) {
        await apiClient.put(`/admin/posts/${editingId}`, data);
      } else {
        await apiClient.post('/admin/posts', data);
      }
      resetForm();
      fetchPosts(pagination.currentPage);
    } catch (error: any) {
      console.error('Error saving post:', error);
      
      // Provide specific error messages
      if (error.response?.status === 414) {
        alert('Content is too large. Please reduce the content size and try again.');
      } else if (error.response?.status === 413) {
        alert('Request is too large. Please reduce the content size and try again.');
      } else if (error.message) {
        alert(`Error: ${error.message}`);
      } else {
        alert('An error occurred while saving the post. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      featured_image: '',
      category_id: '',
      is_published: false,
      meta_description: '',
      meta_keywords: '',
      tags: [],
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (post: any) => {
    setFormData({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      featured_image: post.featured_image || '',
      category_id: String(post.category_id),
      is_published: post.is_published,
      meta_description: post.meta_description || '',
      meta_keywords: post.meta_keywords || '',
      tags: post.tags ? post.tags.map((tag: Tag) => tag.id) : [],
    });
    setEditingId(post.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this post?')) {
      try {
        await apiClient.delete(`/admin/posts/${id}`);
        fetchPosts(pagination.currentPage);
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  const handleApprove = async (id: number) => {
    if (confirm('Are you sure you want to approve this post?')) {
      try {
        // Find the post in the current posts array
        const post = posts.find(p => p.id === id);
        if (!post) {
          console.error('Post not found');
          return;
        }

        // Update the post with approval status
        await apiClient.put(`/posts/${id}`, {
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          featured_image: post.featured_image,
          category_id: post.category_id,
          is_published: post.is_published,
          approval_status: 'approved',
          approved_by: user?.id || 1,
          approved_at: new Date().toISOString(),
          meta_description: post.meta_description || '',
          meta_keywords: post.meta_keywords || ''
        });
        fetchPosts(pagination.currentPage);
      } catch (error) {
        console.error('Error approving post:', error);
      }
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason !== null) {
      try {
        // Find the post in the current posts array
        const post = posts.find(p => p.id === id);
        if (!post) {
          console.error('Post not found');
          return;
        }

        // Update the post with rejection status
        await apiClient.put(`/posts/${id}`, {
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          featured_image: post.featured_image,
          category_id: post.category_id,
          is_published: post.is_published,
          approval_status: 'rejected',
          rejection_reason: reason,
          meta_description: post.meta_description || '',
          meta_keywords: post.meta_keywords || ''
        });
        fetchPosts(pagination.currentPage);
      } catch (error) {
        console.error('Error rejecting post:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section - Responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Blog Posts Management</h1>
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
          className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
        >
          {showForm ? 'Cancel' : 'Add Post'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-8">
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              >
                <option value="">Select Category</option>
                {(categories || []).map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {(tags || []).map(tag => (
                    <label key={tag.id} className="flex items-center space-x-2 cursor-pointer p-1">
                      <input
                        type="checkbox"
                        checked={formData.tags.includes(tag.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              tags: [...formData.tags, tag.id]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              tags: formData.tags.filter(id => id !== tag.id)
                            });
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span 
                        className="px-2 py-1 text-xs rounded-full text-white whitespace-nowrap"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.name}
                      </span>
                    </label>
                  ))}
                </div>
                {formData.tags.length === 0 && (
                  <p className="text-sm text-gray-500">No tags selected</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content (Markdown/HTML)</label>
              <p className="text-xs text-gray-500 mb-2 hidden sm:block">
                💡 Supports Markdown and HTML. Use <code className="bg-gray-100 px-1 rounded">![alt text](image-url)</code> for images or <code className="bg-gray-100 px-1 rounded">&lt;img src="URL" alt="description" class="w-full rounded-lg my-4" /&gt;</code>
              </p>
              <div className="text-xs text-gray-400 mb-2">
                Content size: {formData.content.length.toLocaleString()} characters
                {formData.content.length > 500000 && (
                  <span className="text-yellow-600 ml-2">⚠️ Large content - consider breaking into smaller sections</span>
                )}
              </div>
              <div className="w-full">
                <RichTextEditor
                value={formData.content}
                  onChange={(value) => setFormData({ ...formData, content: value })}
                  placeholder="Write your content here... You can use Markdown or HTML"
                  height={window.innerWidth < 640 ? 300 : 400}
              />
            </div>
            </div>
            <EnhancedImageUpload
              onImageUploaded={(imageUrl) => setFormData({ ...formData, featured_image: imageUrl })}
              currentImage={formData.featured_image}
              label="Featured Image"
              maxSize={5}
            />
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">SEO Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                  <textarea
                    value={formData.meta_description}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    rows={2}
                    placeholder="Brief description for search engines (150-160 characters)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meta Keywords</label>
                  <input
                    type="text"
                    value={formData.meta_keywords}
                    onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="published"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="published" className="ml-2 text-sm font-medium text-gray-700">
                Published
              </label>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
            >
              {editingId ? 'Update' : 'Create'}
            </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors w-full sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Search Bar - Mobile Optimized */}
      <div className="lg:hidden mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search posts..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-base"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <AdvancedFilters
        filterConfigs={filterConfigs}
        filters={filters}
        onFiltersChange={(newFilters) => setFilters(newFilters as typeof filters)}
        onApply={() => {}} // Filters are applied automatically via useEffect
        onClearAll={() => setFilters({
          search: '',
          category: '',
          status: '',
          approval_status: '',
          tags: [],
          dateFrom: '',
          dateTo: ''
        })}
        isOpen={showFilters}
        onToggle={() => setShowFilters(!showFilters)}
        resultsCount={filteredPosts.length}
      />

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-12 w-12 bg-gray-200 rounded"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                    <div className="h-6 bg-gray-200 rounded w-24"></div>
                    <div className="h-6 bg-gray-200 rounded w-16 ml-auto"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-500 mb-4">
              {filters.search || filters.category || filters.status || filters.approval_status || filters.tags.length > 0 || filters.dateFrom || filters.dateTo
                ? 'Try adjusting your filters to see more posts.'
                : 'Get started by creating your first blog post.'}
            </p>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create First Post
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 admin-table">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured Image</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approval</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
                {filteredPosts.map((post) => (
              <tr key={post.id}>
                  <td className="px-3 py-2 text-sm text-gray-500 font-mono">
                    #{post.id}
                  </td>
                  <td className="px-3 py-2 font-medium text-gray-900 max-w-xs truncate" title={post.title}>
                    {post.title}
                  </td>
                  <td className="px-3 py-2">
                    {post.featured_image ? (
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-300"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                        No Image
                      </div>
                    )}
                  </td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${post.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {post.is_published ? 'Published' : 'Draft'}
                  </span>
                </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        post.approval_status === 'approved' ? 'bg-green-100 text-green-800' :
                        post.approval_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        post.approval_status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {post.approval_status}
                      </span>
                      {post.approval_status === 'pending' && (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleApprove(post.id)}
                            className="text-green-600 hover:text-green-800 text-xs"
                            title="Approve"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => handleReject(post.id)}
                            className="text-red-600 hover:text-red-800 text-xs"
                            title="Reject"
                          >
                            ✗
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                <td className="px-3 py-2 text-right space-x-2">
                  <button
                    onClick={() => handleEdit(post)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
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
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-32 bg-gray-200 rounded-lg mb-3"></div>
                <div className="flex justify-between items-center">
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                  <div className="flex space-x-2">
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-500 mb-4">
              {filters.search || filters.category || filters.status || filters.approval_status || filters.tags.length > 0 || filters.dateFrom || filters.dateTo
                ? 'Try adjusting your filters to see more posts.'
                : 'Get started by creating your first blog post.'}
            </p>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create First Post
              </button>
            )}
          </div>
        ) : (
          filteredPosts.map((post) => (
          <div key={post.id} className="bg-white rounded-lg shadow-md p-4 space-y-3">
            {/* Post Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-gray-500">#{post.id}</span>
                  <h3 className="text-lg font-medium text-gray-900 truncate" title={post.title}>
                    {post.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-2 ml-2">
                <span className={`px-2 py-1 text-xs rounded-full ${post.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {post.is_published ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>

            {/* Featured Image */}
            {post.featured_image && (
              <div className="w-full">
                <img
                  src={post.featured_image}
                  alt={post.title}
                  className="w-full h-32 object-cover rounded-lg border border-gray-300"
                />
              </div>
            )}

            {/* Approval Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  post.approval_status === 'approved' ? 'bg-green-100 text-green-800' :
                  post.approval_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  post.approval_status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {post.approval_status}
                </span>
                {post.approval_status === 'pending' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApprove(post.id)}
                      className="text-green-600 hover:text-green-800 text-sm px-2 py-1 rounded border border-green-300"
                      title="Approve"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleReject(post.id)}
                      className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded border border-red-300"
                      title="Reject"
                    >
                      ✗ Reject
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2 pt-2 border-t border-gray-200">
              <button
                onClick={() => handleEdit(post)}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(post.id)}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Delete
              </button>
            </div>
          </div>
          ))
        )}
      </div>

      {/* Pagination */}
        <Pagination
          currentPage={pagination.currentPage}
          lastPage={pagination.lastPage}
          total={pagination.total}
          perPage={pagination.perPage}
          onPageChange={fetchPosts}
          loading={loading}
        />

      {/* Floating Action Button - Mobile Only */}
      {!showForm && (
        <div className="lg:hidden fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
            title="Add New Post"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
      </div>
      )}
    </div>
  );
}
